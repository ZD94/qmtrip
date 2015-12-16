/**
 * 此路由器主要是用于前端
 */
'use strict';

var express = require('express');
var router = express.Router();
var upload = require('../controllers/upload');

router.post('/upload/ajax-upload-file', upload.uploadActionFile);
module.exports =  router;