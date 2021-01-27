FROM docker.elastic.co/kibana/kibana:7.10.1

COPY ./plugins /tmp/plugins

RUN /tmp/plugins/install.sh
