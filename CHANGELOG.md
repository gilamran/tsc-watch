# @gilamran/tsc-watch CHANGELOG

## v1.0.30 - 10/10/2018
* Added custom compiler ability (Thanks to @sosoba for the PR)

## v1.0.29 - 25/09/2018
* Fixed regression bug (Thanks to @onehorsetown)

## v1.0.28 - 25/09/2018
* Fixed command args extraction (Thanks to @mscharley)

## v1.0.27 - 27/08/2018
* Fixed process termination (Thanks to @igrayson)

## v1.0.26 - 20/07/2018
* Fixed several issues with hadErrors check (Thanks to @tombousso)

## v1.0.24 - 20/07/2018
* Killing onFail and onSuccess after compilation

## v1.0.23 - 1/06/2018
* Typescript as a peer dependency (Thanks to @asztal)

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