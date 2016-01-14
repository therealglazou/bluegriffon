# Bluegriffon

The Open Source next-generation Web Editor based on the rendering engine of Firefox

## To prepare the build

* make sure to have installed the environment to build Mozilla: [windows](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Windows_Prerequisites), [MacOS X](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Mac_OS_X_Prerequisites), [linux](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Linux_Prerequisites)
* get mozilla-central from Mozilla through Mercurial:

  `hg clone http://hg.mozilla.org/mozilla-central bluegriffon-source`

* get BlueGriffon's tree through:

  `cd bluegriffon-source`

  `git clone https://github.com/therealglazou/bluegriffon`

* update the mozilla tree

  if you want to build the bluegriffon-ng branch, you need to `cd bluegriffon; git checkout bluegriffon-ng; cd ..`

  if you want to build the bg2 branch, you need to `cd bluegriffon; git checkout bg2; cd ..`

  ``hg update -r `cat bluegriffon/config/mozilla_central_revision.txt```

  `patch -p 1 < bluegriffon/config/content.patch`

* create a `.mozconfig` file inside your `bluegriffon-source` directory.The  settings I am using on a daily basis on OS X (Yosemite) can be found in `bluegriffon/config/mozconfig.macosx`

## To build the master branch

`make client.mk build_all`

You can after that type `make package`in the object directory to package the application for distribution.

## To build the `bluegriffon-ng` or the `bg2` branch

`./mach build`

## Want to contribute to BlueGriffon?

There are two ways to contribute:

1. Contribute code. That's just another OSS project, we're waiting for your Pull Requests!
2. Contribute L10N. All happens only in the 'locales' directory. You can review the existing locales and proposed changes/fixes or submit a new locale in a Pull Request. In that case, you need to translate everything from en-US into a new locale beforeI can accept the PR.
