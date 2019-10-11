#!/bin/bash

PLUGINS_FOLDER="/tmp/plugins"

echo "Plugins folder: $PLUGINS_FOLDER"

for plugin in `ls $PLUGINS_FOLDER -1p | grep '/$' | sed 's/\/$//'`
do
    echo "Plugin found : $plugin"

    BUILD_FOLDER="$PLUGINS_FOLDER/$plugin/build"
    echo "Plugin build folder : $BUILD_FOLDER"

    ZIP_FILE=`ls $BUILD_FOLDER`
    echo "Plugin zip file : $BUILD_FOLDER/$ZIP_FILE"

    bin/kibana-plugin install file://$BUILD_FOLDER/$ZIP_FILE
    echo ""
done