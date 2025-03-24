FROM node:23.10-alpine
LABEL authors="jbadaire"

RUN apk add --no-cache git

WORKDIR /app

COPY entrypoint.sh /app/entrypoint.sh

EXPOSE $PORT
ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
