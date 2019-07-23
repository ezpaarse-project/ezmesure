FROM docker.elastic.co/kibana/kibana:7.2.0

COPY ./plugins/kibana.zip /tmp/plugins/

RUN bin/kibana-plugin install file:///tmp/plugins/kibana.zip