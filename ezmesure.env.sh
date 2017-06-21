#!/bin/bash

export APPLI_APACHE_SERVERNAME="https://ezmesure-preprod.couperin.org"
export APPLI_APACHE_SERVERADMIN="ezpaarse@couperin.org"
export APPLI_APACHE_LOGLEVEL="info ssl:warn"
export SHIBBOLETH_SP_URL="https://ezmesure-preprod.couperin.org/sp"
export SHIBBOLETH_DS_URL="https://discovery.renater.fr/renater"

EZMESURE_NODE_NAME=`hostname`
THIS_HOST=`hostname -I | cut -d ' ' -f1`

# kibana env settings
export EZMESURE_AUTH_SECRET="d7a8c699c63836b837af086cfb3441cbcfcf1a02"
export EZMESURE_SMTPOUT="127.0.0.1"
export ELASTICSEARCH_PASSWORD="changeme"
export SERVER_BASEPATH=/kibana
export SERVER_HOST="0.0.0.0"
export SERVER_PORT="5601"
export ELASTICSEARCH_URL=http://elastic:9200
export XPACK_MONITORING_ENABLED="true"
export XPACK_SECURITY_ENCRYPTIONKEY="e558e233df22145278e760c7b26ea9e9c9f72102"
export KIBANA_DEFAULTAPPID="dashboard/homepage"


# default values for elastic.yml or kibana.yml configuration
export EZMESURE_ES_REPORTING_HOSTNAME=${THIS_HOST}
export EZMESURE_ES_DISCOVERY="${THIS_HOST}:9300"
export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
export EZMESURE_ES_PUBLISH="${THIS_HOST}"
export EZMESURE_ES_MINMASTER="1"
export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
# this values are overwrited by status-nodes.env.sh values
export NODE_ENV="dev"
export EZMESURE_ES_NODE_MASTER="true"
export EZMESURE_ES_NODE_DATA="true"
export EZMESURE_ES_NODE_INGEST="true"
export EZMESURE_ES_NODE_SEARCH_REMOTE="true"

if [[ -f status-nodes.env.sh ]] ; then
	source status-nodes.env.sh
	if [[ -z ${EZMESURE_NODES} ]] ; then 
		echo "Variable EZMESURE_NODES mandatory"
		exit 1;
	fi 
	# set ezmesure Domain
	export APPLI_APACHE_SERVERNAME="https://${EZMESURE_DOMAIN}.couperin.org"
	export SHIBBOLETH_SP_URL="https://${EZMESURE_DOMAIN}.couperin.org/sp"
	# set local EZMESURE_ES_DISCOVERY variable
	# should contain all ES cluster IP host except local IP address
	# needs EZMESURE_MASTER and EZMESURE_NODES in environment

	for node in ${EZMESURE_NODES} ; do
        	if [[ ! $node = $THIS_HOST ]] ; then
               		EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY},${node}:9300"
        	fi
	done
	export EZMESURE_ES_PUBLISH="${THIS_HOST}"
	export EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY}"
	export EZMESURE_ES_MINMASTER="2"
fi

