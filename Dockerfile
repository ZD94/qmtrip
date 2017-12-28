FROM dk.jingli365.com/jl-run:v3
MAINTAINER Ke Peng <ke.peng@jingli365.com>
WORKDIR /opt/app
ARG NPM_TOKEN
ENV NPM_TOKEN ${NPM_TOKEN}
COPY package.json ./
RUN npm install --production && rm -rf node_modules/continuation-local-storage && mv node_modules/@jingli/continuation-local-storage-fixed node_modules/continuation-local-storage && rm -rf ~/.npm
COPY dist/ /opt/app/
CMD node server.js
