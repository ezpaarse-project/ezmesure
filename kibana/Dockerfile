FROM docker.elastic.co/kibana/kibana:7.4.2

COPY ./plugins /tmp/plugins

RUN bash /tmp/plugins/install.sh