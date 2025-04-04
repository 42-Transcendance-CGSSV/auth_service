FROM node:23.10.0
LABEL authors="jbadaire"

WORKDIR /app

COPY output /app/compiled
COPY package.json /app
COPY package-lock.json /app
RUN npm install

ENTRYPOINT ["node" ,"compiled/app.js"]
#TODO: create a small image
