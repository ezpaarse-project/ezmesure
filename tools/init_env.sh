#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
ENV_FILE="$SCRIPT_DIR/../ezmesure.local.env.sh"

source "$SCRIPT_DIR/../ezmesure.env.sh"

if [ -f $ENV_FILE ]
then
  read -e -n 1 -p "$ENV_FILE already exists. Override it (y/N) ? " answer

  if [ -z "$answer" ]; then exit 0; fi
  if [ "$answer" != "y" ]; then exit 0; fi
fi

declare -A defaults
declare -A answers

HASH_1=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
HASH_2=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)

defaults[EZMESURE_DISABLE_SHIBBOLETH]="true"
defaults[EZMESURE_AUTH_SECRET]="$HASH_1"
defaults[EZMESURE_ENCRYPTION_SECRET]="$HASH_2"

order=(
  "EZMESURE_DOMAIN"
  "APPLI_APACHE_SERVERADMIN"
  "EZMESURE_DISABLE_SHIBBOLETH"
  ""
  "EZMESURE_AUTH_SECRET"
  "EZMESURE_ENCRYPTION_SECRET"
  ""
  "ELASTICSEARCH_USERNAME"
  "ELASTICSEARCH_PASSWORD"
  "EZMESURE_SMTP_HOST"
  ""
  "EZMESURE_ES_MEM_LIMIT"
  "ES_JAVA_OPTS"
  ""
  "EZMESURE_NODES"
  "EZMESURE_ES_NODE_MASTER"
  "EZMESURE_ES_NODE_DATA"
  "EZMESURE_ES_NODE_INGEST"
  "EZMESURE_ES_NODE_SEARCH_REMOTE"
  ""
  "EZMESURE_NOTIFICATIONS_SENDER"
  "EZMESURE_NOTIFICATIONS_RECIPIENTS"
  "EZMESURE_NOTIFICATIONS_CRON"
  "REPORTING_SENDER"
  "KIBANA_EXTERNAL_URL"
)

for i in "${order[@]}"
do
  if [ ! -z "$i" ]
  then
    # Get the value of the environment variable
    default="${!i}"

    if [ -z "$default" ]
    then
      # If the environment variable is not set, check default values defined above
      default="${defaults[$i]}"
    fi

    read -e -p "$i: " -i "$default" answer

    if [ "$i" == "EZMESURE_DOMAIN" ]; then defaults[KIBANA_EXTERNAL_URL]="https://$answer/kibana"; fi
    if [ "$i" == "EZMESURE_NOTIFICATIONS_SENDER" ]; then defaults[REPORTING_SENDER]="$answer"; fi

    if [ ! -z "$answer" ]
    then
      answers[$i]=$answer
    fi
  fi
done

echo "" > $ENV_FILE

for key in "${order[@]}"
do
  if [ -z "$key" ]
  then
    echo "" >> $ENV_FILE
  else
    echo "export $key=\"${answers[$key]}\"" >> $ENV_FILE
  fi
done

echo "Environment saved into $ENV_FILE"
