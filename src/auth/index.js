// npm packages
const fs = require('fs');
const {join} = require('path');
const {promisify} = require('util');
const jwt = require('jsonwebtoken');
const hapiAuthJWT = require('hapi-auth-jwt');
const sshpk = require('sshpk');
const uuid = require('uuid');

// our packages
const {auth} = require('../../config');
const {getConfig} = require('../config');
const {reqCollection, getTokenCollection} = require('../db');

// promisify readfile
const readFile = promisify(fs.readFile);
const jwtVerify = promisify(jwt.verify);

// path to keys
const keysFolder = getConfig().publicKeysPath;
const publicKeysPath = join(keysFolder, 'authorized_keys');

// validation function
const validate = (request, decodedToken, callback) => {
  const {user, loggedIn, deploy, tokenName} = decodedToken;

  // if it's a deployment token - check if it's still in db
  if (deploy) {
    const existingToken = getTokenCollection().findOne({tokenName, user: user.username});
    if (!existingToken) {
      return callback(null, false, user);
    }
  }

  if (!user || !loggedIn) {
    return callback(null, false, user);
  }

  return callback(null, true, user);
};

const verifyWithKey = async ({key, token, phrase}) => {
  try {
    const pk = sshpk.parseKey(key);
    const pubKey = pk.toString('pem');
    const decoded = await jwtVerify(token, pubKey, {algorithms: ['RS256']});
    return decoded === phrase;
  } catch (e) {
    return false;
  }
};

module.exports = server =>
  new Promise(resolve => {
    server.register(hapiAuthJWT, () => {
      server.auth.strategy('token', 'jwt', {
        key: auth.privateKey,
        validateFunc: validate,
        verifyOptions: {algorithms: ['HS256']}, // only allow HS256 algorithm
      });

      server.route({
        method: 'GET',
        path: '/checkToken',
        config: {auth: 'token'},
        handler(request, reply) {
          const replyObj = {
            message: 'Token is valid',
            credentials: request.auth.credentials,
          };
          reply(replyObj);
        },
      });

      server.route({
        method: 'POST',
        path: '/deployToken',
        config: {auth: 'token'},
        handler(request, reply) {
          // generate new deploy token
          const tokenName = request.payload.tokenName;
          const user = request.auth.credentials;
          // generate new private key
          const token = jwt.sign({loggedIn: true, user, tokenName, deploy: true}, auth.privateKey, {
            algorithm: 'HS256',
          });
          // save token name to config
          getTokenCollection().insert({tokenName, user: user.username});
          // send back to user
          reply({token});
        },
      });

      server.route({
        method: 'GET',
        path: '/deployToken',
        config: {auth: 'token'},
        handler(request, reply) {
          // generate new deploy token
          const user = request.auth.credentials;
          // save token name to config
          const tokens = getTokenCollection().find({user: user.username});
          // send back to user
          reply({tokens});
        },
      });

      server.route({
        method: 'DELETE',
        path: '/deployToken',
        config: {auth: 'token'},
        handler(request, reply) {
          // generate new deploy token
          const tokenName = request.payload.tokenName;
          const user = request.auth.credentials;
          const existingToken = getTokenCollection().findOne({user: user.username, tokenName});
          if (!existingToken) {
            reply({removed: false, reason: 'Token does not exist'}).code(200);
            return;
          }
          // remove token from collection
          getTokenCollection().remove(existingToken);
          // send back to user
          reply().code(204);
        },
      });

      server.route({
        method: 'GET',
        path: '/login',
        config: {auth: false},
        async handler(request, reply) {
          // generate login request with phrase and uuid
          const uid = uuid.v1();
          const doc = {phrase: `hello exoframe ${uid}`, uid};
          // store in request collection
          reqCollection.insert(doc);
          // send back to user
          reply(doc);
        },
      });

      server.route({
        method: 'POST',
        path: '/login',
        config: {auth: false},
        async handler(request, reply) {
          const {payload} = request;
          const {user, token, requestId} = payload;
          const loginReq = reqCollection.findOne({uid: requestId});

          if (!token || !user) {
            reply({error: 'No token given!'}).code(401);
            return;
          }

          if (!loginReq) {
            reply({error: 'Login request not found!'}).code(401);
            return;
          }

          try {
            const publicKeysFile = await readFile(publicKeysPath);
            const publicKeys = publicKeysFile
              .toString()
              .split('\n')
              .filter(k => k && k.length > 0);
            const res = await Promise.all(publicKeys.map(key => verifyWithKey({key, token, phrase: loginReq.phrase})));
            if (!res.some(r => r === true)) {
              reply({error: 'Not authorized!'}).code(401);
              return;
            }
          } catch (e) {
            reply({error: `Could not read public keys file! ${e.toString()}`}).code(503);
            return;
          }

          // generate auth token
          const replyToken = jwt.sign({loggedIn: true, user}, auth.privateKey, {
            algorithm: 'HS256',
          });
          reply({token: replyToken});
        },
      });

      resolve(server);
    });
  });
