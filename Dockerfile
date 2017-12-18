FROM dk.jingli365.com/jl-run:v3
MAINTAINER Ke Peng <ke.peng@jingli365.com>
WORKDIR /opt/app
COPY package.json ./
RUN npm install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
CMD node server.js
