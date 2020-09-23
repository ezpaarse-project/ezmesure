FROM docker.elastic.co/kibana/kibana:7.9.1

COPY ./plugins /tmp/plugins

RUN bin/kibana-plugin install file:///tmp/plugins/kibana.zip