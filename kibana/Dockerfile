FROM kibana:4.5

MAINTAINER ezTEAM <ezpaarse@couperin.org>

COPY ./images/ezmesure_252_45.svg ./opt/kibana/optimize/bundles/src/ui/public/images/kibana.svg
RUN cp /opt/kibana/config/kibana.yml /opt/kibana/config/kibana.yml.dist
RUN echo 'kibana.defaultAppId: "dashboard/id"' >> /opt/kibana/config/kibana.yml
