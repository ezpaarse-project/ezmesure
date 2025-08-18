#!/bin/bash

SCRIPT_DIR=$(dirname "${BASH_SOURCE[0]}")
LOCAL_ENV_FILE="$SCRIPT_DIR/ezmesure.local.env.sh"

EZMESURE_NODE_NAME=`hostname`
THIS_HOST=`hostname -I | cut -d ' ' -f1`

export EZMESURE_DOMAIN="ezmesure-preprod.couperin.org"
export EZMESURE_APPLICATION_NAME="ezMESURE"

export APPLI_APACHE_SERVERADMIN="ezpaarse@couperin.org"
export APPLI_APACHE_LOGLEVEL="info ssl:warn"
export SHIBBOLETH_DS_URL="https://discovery.renater.fr/renater"

# kibana env settings
export EZMESURE_AUTH_SECRET="d7a8c699c63836b837af086cfb3441cbcfcf1a02"
export EZMESURE_SMTP_HOST="127.0.0.1"
export ELASTICSEARCH_USERNAME="elastic"
export ELASTICSEARCH_PASSWORD="changeme"
export KIBANA_PASSWORD="changeme"
export ELASTICSEARCH_HOSTS="https://elastic:9200"
export SERVER_BASEPATH="/kibana"
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="5601"
export XPACK_MONITORING_ENABLED="true"
export XPACK_SECURITY_ENCRYPTIONKEY="e558e233df22145278e760c7b26ea9e9c9f72102"
export XPACK_REPORTING_KIBANASERVER_HOSTNAME=${THIS_HOST}

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

# ezREEPORT specific
export EZREEPORT_RABBITMQ_USERNAME="ezreeport"
export EZREEPORT_RABBITMQ_PASSWORD=""
export EZREEPORT_RABBITMQ_VHOST="/ezreeport"
export EZREEPORT_POSTGRES_DB="ezreeport"
export EZREEPORT_TZ="Europe/Paris"

export EZMESURE_ADMIN_PASSWORD="changeme"

# OIDC vars
export EZMESURE_OIDC_CLIENT_ID="ezmesure"
export EZMESURE_OIDC_SCOPES="[\"openid\",\"profile\",\"email\"]"

# Check your IDP configuration
export EZMESURE_OIDC_CLIENT_SECRET="changeme"

if [[ -f $LOCAL_ENV_FILE ]] ; then
  source "$LOCAL_ENV_FILE"
fi

# set ezmesure Domain
export EZMESURE_PUBLIC_URL="https://${EZMESURE_DOMAIN}"
export APPLI_APACHE_SERVERNAME="https://${EZMESURE_DOMAIN}"
export SHIBBOLETH_SP_URL="https://${EZMESURE_DOMAIN}/sp"

# OIDC vars

export EZMESURE_ADMIN_PASSWORD_HASH="$(echo $EZMESURE_ADMIN_PASSWORD | htpasswd -BinC 10 admin | cut -d: -f2)"

# OpenID Connect 1.0 - Uncomment if provider supports it
export EZMESURE_OIDC_DISCOVERY_URI="https://${EZMESURE_DOMAIN}/auth/.well-known/openid-configuration"
# OAuth 2.0 - Uncomment if provider supports it
# export EZMESURE_OIDC_DISCOVERY_URI="https://${EZMESURE_DOMAIN}/auth/.well-known/oauth-authorization-server"

export EZMESURE_OIDC_ISSUER_URI="https://${EZMESURE_DOMAIN}/auth"
export EZMESURE_OIDC_AUTH_URI="https://${EZMESURE_DOMAIN}/auth/auth"
export EZMESURE_OIDC_TOKEN_URI="https://${EZMESURE_DOMAIN}/auth/token"
export EZMESURE_OIDC_INTROSPECTION_URI="https://${EZMESURE_DOMAIN}/auth/token/introspect"
export EZMESURE_OIDC_USERINFO_URI="https://${EZMESURE_DOMAIN}/auth/userinfo"

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
