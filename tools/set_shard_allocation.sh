#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

source "$SCRIPT_DIR/../ezmesure.env.sh"

Help()
{
   echo "Update Elasticsearch shard allocation setting."
   echo
   echo "Syntax: set_shard_allocation <primaries|new_primaries|all|none|null>"
   echo "options:"
   echo "h     Print this help."
   echo
}

while getopts ":h" option; do
  case $option in
    h)
      Help
      exit;;
    \?)
      echo "Error: invalid option"
      exit;;
  esac
done

ES_USR="$ELASTICSEARCH_USERNAME"
ES_PWD="$ELASTICSEARCH_PASSWORD"
VALUE="$1"

if [ -z "$VALUE" ]; then
  Help
  exit 1;
fi
if [ -z "$ES_USR" ]; then
  echo "ELASTICSEARCH_USERNAME not set, check ezmesure.local.env.sh"
  exit 1;
fi
if [ -z "$ES_PWD" ]; then
  echo "ELASTICSEARCH_PASSWORD not set, check ezmesure.local.env.sh"
  exit 1;
fi

if [ "$VALUE" != "null" ]; then
  VALUE="\"$VALUE\""
fi

SETTINGS="{
  \"persistent\": {
    \"cluster.routing.allocation.enable\": $VALUE
  }
}"

response=$(curl -X PUT -u $ES_USR:$ES_PWD -H 'Content-Type: application/json' 'http://localhost:9200/_cluster/settings' -fsSL -d "$SETTINGS")

if [ $? -ne 0 ]; then
  echo "Something went wrong"
  exit $?
fi

if [[ "$response" == *'"acknowledged":true'* ]]; then
  echo "Cluster settings applied"
  exit 0
else
  echo "Something went wrong, cannot find 'acknowledged:true' in the response"
  echo "Response:"
  echo "$response"
  exit 1
fi
