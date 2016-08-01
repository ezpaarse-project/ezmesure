FROM debian:jessie

MAINTAINER ezTEAM <ezpaarse@couperin.org>

RUN apt-get update \
  && apt-get -y install apache2=2.4.10-10+deb8u5 libapache2-mod-shib2=2.5.3+dfsg-2 \
  && apt-get clean

RUN a2enmod ssl shib2 proxy_http \
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

COPY ./httpd-foreground /usr/local/bin/
CMD [ "httpd-foreground" ]

EXPOSE 443
