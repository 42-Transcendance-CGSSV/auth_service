FROM alpine:3.21.3
LABEL authors="jbadaire"

RUN apk add --no-cache git
RUN apk add --no-cache npm

WORKDIR /app

COPY entrypoint.sh /app/entrypoint.sh

ENTRYPOINT ["/bin/sh", "entrypoint.sh"]
