FROM dk.jingli365.com/jl-run:v3
MAINTAINER Ke Peng <ke.peng@jingli365.com>
ARG NPM_TOKEN
ENV NPM_TOKEN $NPM_TOKEN
WORKDIR /opt/app
ARG NPM_TOKEN
ENV NPM_TOKEN ${NPM_TOKEN}
COPY package.json ./
RUN npm install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
COPY meiyaFake/ /opt/app/meiyaFake
CMD node server.js
