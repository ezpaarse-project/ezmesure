#!/bin/bash

export APPLI_APACHE_SERVERNAME="https://ezmesure-preprod.couperin.org"
export APPLI_APACHE_SERVERADMIN="ezpaarse@couperin.org"
export APPLI_APACHE_LOGLEVEL="info ssl:warn"
export SHIBBOLETH_SP_URL="https://ezmesure-preprod.couperin.org/sp"
export SHIBBOLETH_DS_URL="https://discovery.renater.fr/renater"
export EZMESURE_AUTH_SECRET="d7a8c699c63836b837af086cfb3441cbcfcf1a02"

EZMESURE_NODE_NAME=`hostname`
THIS_HOST=`hostname -i`
export EZMESURE_ES_DISCOVERY="${EZMESURE_MASTER}:9300"
export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
export EZMESURE_ES_PUBLISH="${THIS_HOST}"

if [[ -f master-nodes.env.sh ]] ; then
	source master-nodes.env.sh
	if [[ -z ${EZMESURE_MASTER} || -z ${EZMESURE_NODES} ]] ; then 
		echo "Variables EZMESURE_MASTER/EZMESURE_NODES mandatory"
		exit 1;
	fi 
	# set ezmesure Domain
	export APPLI_APACHE_SERVERNAME="https://${EZMESURE_DOMAIN}.couperin.org"
	export SHIBBOLETH_SP_URL="https://${EZMESURE_DOMAIN}.couperin.org/sp"
	# set local EZMESURE_ES_DISCOVERY variable
	# should contain all ES cluster IP host except local IP address
	# needs EZMESURE_MASTER and EZMESURE_NODES in environment

	EZMESURE_ES_DISCOVERY="${EZMESURE_MASTER}:9300"
	EZMESURE_NODE_NAME=`hostname`
	THIS_HOST=`hostname -I | cut -d ' ' -f1`

	for node in ${EZMESURE_NODES} ; do
        	if [[ ! $node = $THIS_HOST ]] ; then
               		EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY},${node}:9300"
        	fi
	done
	export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
	export EZMESURE_ES_PUBLISH="${THIS_HOST}"
	export EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY}"
fi

