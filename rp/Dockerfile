FROM debian:buster
LABEL maintainer="ezTEAM <ezpaarse@couperin.org>"

RUN apt-get update \
  && apt-get -y install apache2 libapache2-mod-shib2 \
  && apt-get clean

RUN a2enmod ssl proxy_http \
  && a2dissite 000-default \
  && a2ensite default-ssl

# generate ssl keys to be able to start the shibd service
# but these keys have to be replaced by officials ones at
# configuration step
RUN cd /etc/shibboleth/ && shib-keygen -f

# redirect logs to stdout
RUN ln -sf /proc/self/fd/1 /var/log/apache2/access.log \
  && ln -sf /proc/self/fd/1 /var/log/apache2/error.log \
  && ln -sf /proc/self/fd/1 /var/log/shibboleth/shibd.log \
  && ln -sf /proc/self/fd/1 /var/log/shibboleth/shibd_warn.log \
  && ln -sf /proc/self/fd/1 /var/log/shibboleth/signature.log \
  && ln -sf /proc/self/fd/1 /var/log/shibboleth/transaction.log

COPY ./apache2/sites-available /etc/apache2/sites-available
COPY ./shibboleth /etc/shibboleth
COPY ./httpd-foreground /usr/local/bin/
CMD [ "httpd-foreground" ]

EXPOSE 443
