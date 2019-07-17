FROM docker.elastic.co/kibana/kibana:6.8.0

COPY ./plugins/kibana.zip /tmp/plugins/

RUN bin/kibana-plugin install file:///tmp/plugins/kibana.zip