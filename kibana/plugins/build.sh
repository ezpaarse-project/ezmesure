#!/bin/bash

PLUGINS=$(ls ./kibana/plugins -1p | grep '/$' | sed 's/\/$//')
echo -e "Plugins found: \033[1m${PLUGINS//[$'\t\r\n']/ }\033[0m"

echo "Create kibana folder"
mkdir -p kibana

echo "Copying plugins in kibana folder"
cp -rt kibana $PLUGINS

echo "Zip kibana folder in kibana.zip"
zip -rq kibana.zip kibana

echo "Remove kibana folder"
rm -Rf kibana