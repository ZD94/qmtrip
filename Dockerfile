FROM docker.l.jingli365.com/jl-run
MAINTAINER Ke Peng <ke.peng@jingli365.com>
COPY package.json /opt/app/
RUN cd /opt/app && npm --registry https://npm.l.jingli365.com install --production
COPY dist/ /opt/app/
WORKDIR /opt/app
CMD nohup node server.js > log/nohup.out 2>&1
