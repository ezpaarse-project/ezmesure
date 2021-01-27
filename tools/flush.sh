#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")

source "$SCRIPT_DIR/../ezmesure.env.sh"

Help()
{
   echo "Flush all data streams and indices in the cluster."
   echo
   echo "Syntax: ./flush.sh"
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

if [ -z "$ES_USR" ]; then
  echo "ELASTICSEARCH_USERNAME not set, check ezmesure.local.env.sh"
  exit 1;
fi
if [ -z "$ES_PWD" ]; then
  echo "ELASTICSEARCH_PASSWORD not set, check ezmesure.local.env.sh"
  exit 1;
fi

response=$(curl -X POST -u $ES_USR:$ES_PWD 'http://localhost:9200/_flush' -fsSL)

if [ $? -ne 0 ]; then
  echo "Something went wrong"
  exit 1
fi

if [[ "$response" == *'"failed":0'* ]]; then
  echo "Cluster flushed"
  exit 0
else
  echo "Something went wrong, some shards failed to flush"
  echo "Response:"
  echo "$response"
  exit 1
fi
