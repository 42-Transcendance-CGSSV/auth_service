FROM node:alpine3.22 AS builder
LABEL authors="jbadaire"

WORKDIR /app

COPY . /app
RUN npm install -D
RUN npm run build

RUN mkdir -p /app/compiled
RUN cp -r /app/output/* /app/compiled/

FROM node:alpine3.22

WORKDIR /app

COPY --from=builder /app/output /app/compiled

COPY --from=builder /app/package.json /app
COPY --from=builder /app/package-lock.json /app

RUN npm ci --omit=dev

RUN mkdir -p /app/data/static/profiles_pictures
COPY ./data/static/profiles_pictures /app/data/static/profiles_pictures

ENTRYPOINT ["node" ,"compiled/app.js"]