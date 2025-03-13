#!/usr/bin/env bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
INSTANCES_FILE="$SCRIPT_DIR/../certs/instances.yml"

source "$SCRIPT_DIR/../ezmesure.env.sh"

if [ -f $INSTANCES_FILE ]
then
  read -e -n 1 -p "$INSTANCES_FILE already exists. Override it (y/N) ? " answer

  if [ -z "$answer" ]; then exit 0; fi
  if [ "$answer" != "y" ]; then exit 0; fi
fi

echo "instances:" > $INSTANCES_FILE

go_on=y
first_instance=true

while [ "$go_on" != "n" ]; do
  echo "Adding new instance"

  default_name=""
  default_ip=""

  if [ $first_instance == true ]; then
    default_name="$EZMESURE_ES_NODE_NAME"
    default_ip="$EZMESURE_ES_PUBLISH"
  fi

  read -e -p "  Name: " -i "$default_name" instance_name
  read -e -p "  IP: " -i "$default_ip" instance_ip
  read -e -p "  Hostname: " -i "$instance_name" instance_hostname

  echo "  - name: \"$instance_name\"" >> $INSTANCES_FILE
  echo "    ip:" >> $INSTANCES_FILE
  echo "      - \"$instance_ip\"" >> $INSTANCES_FILE
  echo "    dns:" >> $INSTANCES_FILE
  echo "      - \"$instance_hostname\"" >> $INSTANCES_FILE
  echo "      - \"localhost\"" >> $INSTANCES_FILE

  if [ $first_instance == true ]; then
    echo "      - \"elastic\"" >> $INSTANCES_FILE
  fi

  first_instance=false

  echo "Instance added to $INSTANCES_FILE"
  read -e -n 1 -p "Add another instance (Y/n) ? " go_on
done
