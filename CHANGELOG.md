# @gilamran/tsc-watch CHANGELOG

## v1.0.22 - 1/06/2018
* Added support for Typescript 2.9+

## v1.0.21 - 16/04/2018
* Removed `--noClearScreen` argument, as typescript added `--preserveWatchOutput`

## v1.0.20 - 16/04/2018
* Fixed ignoring the last arg
* Added `--noColors` argument
* Added `--noClearScreen` argument

## v1.0.19 - 8/04/2018
* Fixed passing compilation when using --pretty param (Thanks to @tomaba)

## v1.0.17 - 27/01/2018
* Terminating typescript on SIGTERM event (Thanks to @amir-arad)

## v1.0.16 - 27/01/2018
* Fixed stdout coloring issues on Mac (Thanks to @jonaskello)

## v1.0.15 - 18/01/2018
* Added `--onFailure` argument

## v1.0.14 - 18/01/2018
* Fixed Windows newline issue

## v1.0.9 - 5/12/2017
* Add CHANGELOG
* Fix typo in package description
* Upgraded chalk version
* Change main to `index.js`
* Removed `yarn.lock` & `package-lock.json`
* Made `index.js` executable