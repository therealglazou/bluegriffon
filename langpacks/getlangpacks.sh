#!/bin/sh

VERSION=$1
BG_VERSION=$2

LOCALES="cs de es-ES fi fr gl he hu it ja ko nl pl ru sl sr sv-SE zh-CN zh-TW"
#LOCALES="ru"

R_VERSION=`echo $VERSION | sed -e "s/\./\\\\\./g" | sed -e "s/\n//"`
R_BG_VERSION=`echo $BG_VERSION | sed -e "s/\./\\\\\./g" | sed -e "s/\n//"`

echo $R_VERSION " " $R_BG_VERSION
wget http://ftp.mozilla.org/pub/firefox/nightly/latest-mozilla-aurora/firefox-$VERSION.en-US.langpack.xpi
for i in `echo $LOCALES`
do
    wget http://ftp.mozilla.org/pub/mozilla.org/firefox/nightly/latest-mozilla-aurora-l10n/win32/xpi//firefox-$VERSION.$i.langpack.xpi
done

#for i in `echo $LOCALES`
for i in `echo "en-US "$LOCALES`
do
    P=`pwd`
    cd /tmp
    rm -fr $i
    mkdir $i
    cd $i
    unzip $P/firefox-$VERSION.$i.langpack.xpi
    for j in install.rdf chrome.manifest
    do
    	cat $j | sed -e "s/firefox.mozilla.org/bluegriffon.org/" \
    	       | sed -e "s/{ec8030f7-c20a-464f-9b0e-13a3a9e97384}/bluegriffon@bluegriffon.com/" \
    	       | sed -e "s/$R_VERSION/$R_BG_VERSION/" \
             > foo
      mv foo $j
    done
    echo "manifest bluegriffon/chrome.manifest application=bluegriffon@bluegriffon.com" >> chrome.manifest
    mkdir bluegriffon
    echo "locale bluegriffon "$i" base/locale/bluegriffon/
locale branding "$i" base/locale/branding/
locale fs "$i" extensions/fs/
locale gfd "$i" extensions/gfd/
locale cssproperties "$i" sidebars/cssproperties/
locale domexplorer "$i" sidebars/domexplorer/
locale scripteditor "$i" sidebars/scripteditor/
locale stylesheets "$i" sidebars/stylesheets/
locale tipoftheday "$i" extensions/tipoftheday/
locale aria "$i" sidebars/aria/
" > bluegriffon/chrome.manifest
    rm -f foo
    cd ..
    cp -r $i $P
    cd $P
#    rm firefox-$VERSION.$i.langpack.xpi
done

#find . -name \*.dtd -exec git add {} \;
#find . -name \*.properties -exec git add {} \;
#find . -name \*.manifest -exec git add {} \;
