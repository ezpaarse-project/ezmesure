#!/bin/bash

EZMESURE_NODE_NAME=`hostname`
THIS_HOST=`hostname -I | cut -d ' ' -f1`

export EZMESURE_DOMAIN="ezmesure-preprod.couperin.org"

export APPLI_APACHE_SERVERADMIN="ezpaarse@couperin.org"
export APPLI_APACHE_LOGLEVEL="info ssl:warn"
export SHIBBOLETH_DS_URL="https://discovery.renater.fr/renater"

# kibana env settings
export EZMESURE_AUTH_SECRET="d7a8c699c63836b837af086cfb3441cbcfcf1a02"
export EZMESURE_SMTP_HOST="127.0.0.1"
export ELASTICSEARCH_USERNAME="elastic"
export ELASTICSEARCH_PASSWORD="changeme"
export ELASTICSEARCH_HOSTS="http://elastic:9200"
export SERVER_BASEPATH="/kibana"
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="5601"
export XPACK_MONITORING_ENABLED="true"
export XPACK_SECURITY_ENCRYPTIONKEY="e558e233df22145278e760c7b26ea9e9c9f72102"
export XPACK_REPORTING_KIBANASERVER_HOSTNAME=${THIS_HOST}
export KIBANA_DEFAULTAPPID="dashboard/homepage"

# default values for elastic.yml or kibana.yml configuration
export EZMESURE_ES_DISCOVERY=""
export EZMESURE_ES_DISCOVERY_TYPE="single-node"
export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
export EZMESURE_ES_PUBLISH="${THIS_HOST}"
export EZMESURE_ES_INITIAL_MASTER_NODES=""

# these values are overwriten by ezmesure.local.env.sh values
export NODE_ENV="dev"
export EZMESURE_ES_NODE_MASTER="true"
export EZMESURE_ES_NODE_DATA="true"
export EZMESURE_ES_NODE_INGEST="true"
export EZMESURE_ES_NODE_SEARCH_REMOTE="true"
export ES_JAVA_OPTS="-Xms2g -Xmx2g"
export EZMESURE_ES_MEM_LIMIT="4g"

if [[ -f ezmesure.local.env.sh ]] ; then
  source ezmesure.local.env.sh
fi

# set ezmesure Domain
export APPLI_APACHE_SERVERNAME="https://${EZMESURE_DOMAIN}"
export SHIBBOLETH_SP_URL="https://${EZMESURE_DOMAIN}/sp"

# set local EZMESURE_ES_DISCOVERY variable
# should contain all ES cluster IP host except local IP address
# needs EZMESURE_NODES in environment

if [[ ! -z ${EZMESURE_NODES} ]] ; then
  for node in ${EZMESURE_NODES} ; do
    if [[ ! $node = $THIS_HOST ]] ; then
      EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY},${node}:9300"
    fi
  done
fi

if [[ ! -z ${EZMESURE_ES_DISCOVERY} ]] ; then
  EZMESURE_ES_DISCOVERY_TYPE="zen"
fi
