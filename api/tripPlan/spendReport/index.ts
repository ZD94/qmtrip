/**
 * Created by wlh on 2016/9/27.
 */
'use strict';

import _ = require("lodash");

import fs = require("fs");
import path = require("path");

function compile(templatePath: any, data: any) {
    return getTemplateFromFile(templatePath)
        .then((template) => {
            let _compile = _.template(template);
            template = _compile(data);
            return template;
        })
}

function getTemplateFromFile(filePath: string): Promise<any> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, function(err, bfs) {
            if(err) return reject(err);
            let data = bfs.toString("utf8");
            resolve(data);
        })
    })
}
function html2pdf(html: any, base: any): Promise<Buffer> {
    var pdf = require("html-pdf");
    return new Promise<Buffer>((resolve, reject) => {
        pdf.create(html, {
            base: base,
            format: 'A4',
            border: 0,
            type: 'pdf',
            "footer": {
                "height": "10mm",
                "contents": {
                    first: '<p style="font-size: 9pt; color: #b4b4b4; text-align: center;">请将序号纸的票据按顺序贴于底层,便于财务快速审核、加快报销速度。</p>', // fallback value
                }
            },
        }).toBuffer(function(err: Error, buf: Buffer) {
            if(err) return reject(err);
            return resolve(buf);
        })
    })
}

const templatePath = path.normalize(path.join(__dirname, 'template.html'));
var templateBase = 'file://' + templatePath;

export async function makeSpendReport(data: any): Promise<Buffer> {
    console.info('data======================',data);
    let html = await compile(templatePath, {data: data});
    return html2pdf(html, templateBase);
}
