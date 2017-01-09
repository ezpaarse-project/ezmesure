FROM docker.elastic.co/kibana/kibana:5.1.1

USER root
RUN chown -R kibana:kibana /usr/share/kibana
USER kibana

#COPY ./plugin/ /tmp/x-pack-5.0.1.zip
#RUN kibana-plugin install file:///tmp/x-pack-5.0.1.zip

COPY ./images/ezmesure_252_45.svg ./opt/kibana/optimize/bundles/src/ui/public/images/kibana.svg
#RUN cp /opt/kibana/config/kibana.yml /opt/kibana/config/kibana.yml.dist
#RUN echo 'kibana.defaultAppId: "dashboard/id"' >> /opt/kibana/config/kibana.yml
