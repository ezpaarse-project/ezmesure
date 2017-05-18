# set local EZMESURE_ES_DISCOVERY variable 
# should contain all ES cluster IP host except local IP address

EZMESURE_MASTER="192.168.128.85"
EZMESURE_NODES="192.168.128.86 192.168.128.87"
EZMESURE_ES_DISCOVERY="discovery.zen.ping.unicast.hosts=${EZMESURE_MASTER}:9300"
THIS_HOST=`hostname -i`

for node in ${EZMESURE_NODES} ; do
	if [[ ! $node = $THIS_HOST ]] ; then
		EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY},${node}:9300"
	fi
done
export EZMESURE_ES_DISCOVERY="${EZMESURE_ES_DISCOVERY}"
	
