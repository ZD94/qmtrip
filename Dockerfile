FROM docker.l.jingli365.com/jl-run
MAINTAINER Ke Peng <ke.peng@jingli365.com>
COPY package.json /opt/app/
RUN cd /opt/app && npm --registry https://npm.l.jingli365.com install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
WORKDIR /opt/app
CMD node server.js
