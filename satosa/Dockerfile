FROM satosa:8.5.1-alpine

USER root

COPY ./docker-entrypoint.sh /usr/local/bin/

RUN apk add --no-cache envsubst

USER satosa

CMD ["gunicorn", "-b0.0.0.0:8080", "satosa.wsgi:app"]
