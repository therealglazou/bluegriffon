# Bluegriffon

The Open Source next-generation Web Editor based on the rendering engine of Firefox

## To prepare the build USING MERCURIAL

* make sure to have installed the environment to build Mozilla: [windows](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Windows_Prerequisites), [MacOS X](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Mac_OS_X_Prerequisites), [linux](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Linux_Prerequisites)
* get mozilla-central from Mozilla through Mercurial:

  `hg clone http://hg.mozilla.org/mozilla-central bluegriffon-source`

  Warning: on Windows, it's HIGHLY recommended to have both Windows and Visual Studio in the same locale, preferably en-US. If for instance you have a fr-FR Windows10 and a en-US VS, build will miserably fail...

* get BlueGriffon's tree through:

  `cd bluegriffon-source`

  `git clone https://github.com/therealglazou/bluegriffon`

* update the mozilla tree

  ```hg update -r `cat bluegriffon/config/mozilla_central_revision.txt` ```

  `patch -p 1 < bluegriffon/config/gecko_dev_content.patch`

  `patch -p 1 < bluegriffon/config/gecko_dev_idl.patch`

* create a `.mozconfig` file inside your `bluegriffon-source` directory. The  settings I am using on a daily basis on OS X (Sierra) can be found in `bluegriffon/config/mozconfig.macosx`

## To prepare the build USING GIT

* make sure to have installed the environment to build Mozilla: [windows](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Windows_Prerequisites), [MacOS X](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Mac_OS_X_Prerequisites), [linux](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Linux_Prerequisites)
* get gecko-dev from github through git:

  `git clone https://github.com/mozilla/gecko-dev bluegriffon-source`

  Warning: on Windows, it's HIGHLY recommended to have both Windows and Visual Studio in the same locale, preferably en-US. If for instance you have a fr-FR Windows10 and a en-US VS, build will miserably fail...

* get BlueGriffon's tree through:

  `cd bluegriffon-source`

  `git clone https://github.com/therealglazou/bluegriffon`

* update the mozilla tree

  ```git reset --hard `cat bluegriffon/config/gecko_dev_revision.txt` ```

  `patch -p 1 < bluegriffon/config/gecko_dev_content.patch`

  `patch -p 1 < bluegriffon/config/gecko_dev_idl.patch`

* create a `.mozconfig` file inside your `bluegriffon-source` directory. The  settings I am using on a daily basis on OS X (Sierra) can be found in `bluegriffon/config/mozconfig.macosx`

## My own builds

* OS X: OS X 10.12.6 with Xcode version 9.0 (9A235)
* Windows: Windows 10 Pro with Visual Studio Community 2015
* Linux: Ubuntu 16.04.1 LTS

## Build BlueGriffon

`./mach build`

## Run BlueGriffon in a temporary profile

`./mach run`

## Package the build

`./mach package`

## Want to contribute to BlueGriffon?

There are two ways to contribute:

1. Contribute code. That's just another OSS project, we're waiting for your Pull Requests!
2. Contribute L10N. All happens only in the 'locales' directory. You can review the existing locales and proposed changes/fixes or submit a new locale in a Pull Request. In that case, you need to translate everything from en-US into a new locale beforeI can accept the PR.
