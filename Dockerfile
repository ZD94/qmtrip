FROM dk.jingli365.com/jl-run:v4
ARG NPM_TOKEN
WORKDIR /opt/app
COPY package.json ./
RUN npm install --production && rm -rf ~/.npm
COPY dist/ /opt/app/
COPY meiyaFake/ /opt/app/meiyaFake
CMD node server.js
