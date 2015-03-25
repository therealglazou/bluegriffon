# Bluegriffon
BlueGriffon, the Web editor

## To build BlueGriffon

* make sure to have installed the environment to build Mozilla: [windows](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Windows_Prerequisites), [MacOS X](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Mac_OS_X_Prerequisites), [linux](https://developer.mozilla.org/En/Developer_Guide/Build_Instructions/Linux_Prerequisites)
* get mozilla-central from Mozilla through Mercurial:

  `hg clone http://hg.mozilla.org/mozilla-central bluegriffon-source`

* get BlueGriffon's tree through:

  `cd bluegriffon-source`

  `git clone https://github.com/therealglazou/bluegriffon`

* update the mozilla tree

  ``hg update -r `cat bluegriffon/config/mozilla_central_revision.txt```

  `patch -p 1 < bluegriffon/config/content.patch`
