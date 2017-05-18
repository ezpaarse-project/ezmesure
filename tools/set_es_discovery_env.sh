# set local EZMESURE_ES_DISCOVERY variable 
# should contain all ES cluster IP host except local IP address
# needs EZMESURE_MASTER and EZMESURE_NODES in environment

EZMESURE_ES_DISCOVERY="discovery.zen.ping.unicast.hosts=${EZMESURE_MASTER}:9300"
EZMESURE_NODE_NAME=`hostname`
THIS_HOST=`hostname -i`

for node in ${EZMESURE_NODES} ; do
	if [[ ! $node = $THIS_HOST ]] ; then
		EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY},${node}:9300"
	fi
done
export EZMESURE_ES_NODE_NAME="${EZMESURE_NODE_NAME}"
export EZMESURE_ES_PUBLISH="${THIS_HOST}"
export EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY}"
	
