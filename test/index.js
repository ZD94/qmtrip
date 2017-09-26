"use strict";

process.env.NODE_PATH = '.:'+process.env.NODE_PATH;

var path = require('path');

require('app-module-path').addPath(path.normalize(path.join(__dirname, '..')));
require('ts-node').register({ fast: true });

require('./index.test.ts');
