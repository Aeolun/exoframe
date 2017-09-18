
0.19.0 / 2017-09-18
==================

Additions:
  * Add route that gets and displays current and latest versions of server and traefik

0.18.1 / 2017-09-15
==================

Fixes:
  * Fix server self update, add slight delay upon sending response to make time for it to finish

0.18.0 / 2017-09-15
==================

Additions:
  * Always pull base image during build

Changes:
  * Use node:latest base image for node.js projects

0.17.1 / 2017-09-13
==================

Fixes:
  * Clean docker images in travis after tests finish to fix wrong image getting pushed

0.17.0 / 2017-09-13
==================

Additions:
  * Add update endpoint that can update traefik and self

0.16.0 / 2017-08-28
==================

Additions:
  * Return build log on image build failures during deployment

0.15.0 / 2017-08-03
==================

Additions:
  * Implement basic deployment update functionality

0.14.0 / 2017-08-02
==================

Additions:
  * Add simple way to generate deploy tokens

0.13.1 / 2017-08-02
==================

Fixes:
  * Use node8-alpine during pkg build since latest-alpine might fail

0.13.0 / 2017-08-02
==================

Additions:
  * Allow disabling domain with false value in config
  * Allow specifying project name using config file
  * Allow getting logs for whole projects, not just single deployments

0.12.0 / 2017-07-31
==================

Additions:
  * Add exoframe.project labels to deployments to allow grouping them
  * Allow removing whole projects

0.11.1 / 2017-07-17
==================

Fixes:
  * Bundle docker-compose into dockerfile to fix standalone compose deployments

0.11.0 / 2017-07-17
==================

Additions:
  * Better docs

0.10.6 / 2017-07-06
==================

Fixes:
  * Fix verification with malformed keys

0.10.5 / 2017-07-06
==================

Fixes:
  * Fix template packaging

0.10.4 / 2017-07-06
==================

Additions:
  * Add home route that links to github

Fixes:
  * Fix HTTPS traefik deployment

0.10.3 / 2017-07-06
==================

Changes:
  * Autoredirect http to https in Traefik
  * Add default entry points configs for Traefik

0.10.2 / 2017-07-06
==================

Fixes:
  * Fix login double-reply issue

0.10.1 / 2017-06-29
==================

Changes:
  * Replace gitlab-ci with travis

Fixes:
  * Fix node dockerfile and use npm to start app

0.10.0 / 2017-06-28
==================

Changes:
  * Use private-public RSA key pairs instead of plain-text credentials for auth

Fixes:
  * Only use yarn for node projects if yarn.lock is present

0.9.0 / 2017-05-20
==================

Additions:
  * Allow enabling autoconstructed domains for deployments
  * Allow specifying internal hostnames for deployments

Changes:
  * Get all containers for all commands
  * Change list output to include extended deployment info
  * Return extended info for deployments
  * Set NODE_ENV to production within docker

Fixes:
  * Only stop non-running containers during remove

0.8.1 / 2017-05-18
==================

Fixes:
  * Fix issue when removing/getting logs for nonexistent deployments
  * Fix on-failure restart policy parsing

0.8.0 / 2017-05-18
==================

Additions:
  * Use on-failure restart policy instead of always one
  * Add method to get logs and tests for it
  * Use gitlab-ci to build slim pkg based docker images, closes #3

Changes:
  * Replace travis-ci with gitlab-ci
  * Clarify deployment arguments in README
  * Use node:alpine as base image

Fixes:
  * Only append non-empty messages to build log
  
0.7.0 / 2017-05-17
==================

Full rewrite, beta version.

* Simplified deployment procedure
* Autoconfigurable Traefik reverse-proxy
* Docker-compose support
* Letsencrypt support

0.6.0 / 2016-09-16
==================

Additions:
  * Add clean method that removes all untagged docker images
  * Add method to remove images
  * Add method to inspect containers
  * Add method to start containers
  * Add method to get container logs
  * Add unit tests and test coverage

Changes:
  * Enforce current user info during build
  * Better build test completion validation

Fixes:
  * Do not build without tag, correctly catch issues with parsing of labels during build

0.5.0 / 2016-09-08
==================

  * Filter out non-named images for deploy
  * Add way to link containers during deployment

0.4.0 / 2016-09-05
==================

Additions:
  * Allow pulling and listing images from registries
  * Allow stopping and removing containers

Fixes:
  * Expose ports during deploy to forward them correctly
  * Correctly handle deployment of registry images
