/**
 * Created by wlh on 2016/9/27.
 */
'use strict';

import _ = require("lodash");

import fs = require("fs");
import path = require("path");

function compile(templatePath, data) {
  return getTemplateFromFile(templatePath)
    .then( (template) => {
      let _compile = _.template(template);
      template = _compile(data);
      return template;
    })
}

function getTemplateFromFile(filePath) {
  return new Promise( (resolve, reject) => {
    fs.readFile(filePath, function(err, bfs) {
      if (err) return reject(err);
      let data = bfs.toString("utf8");
      resolve(data);
    })
  });
}

function html2pdf(html) {
  var pdf = require("html-pdf");
  return new Promise( (resolve, reject) => {
    pdf.create(html, {
      format: 'A4',
      border: 0,
      type: 'pdf',
    }).toBuffer(function(err, bfs) {
      if (err) return reject(err);
      return resolve(bfs.toString("base64"));
    })
  })
}

const templatePath = path.join(__dirname, 'template.html');

export async function makeSpendReport(data) {
  let html = await compile(templatePath, { data: data} );
  return html2pdf(html);
}