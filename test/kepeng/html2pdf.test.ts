
import * as path from 'path';
import * as fs from 'fs';
import {makeSpendReport} from 'api/tripPlan/spendReport';

var html = fs.readFileSync(__dirname+'/html2pdf.html', 'utf-8');
var base = 'file://'+path.normalize(__dirname+'/html2pdf.html');
console.log(base);

function html2pdf(html: string): Promise<string> {
    var pdf = require("html-pdf");
    return new Promise<string>( (resolve, reject) => {
        pdf.create(html, {
            base: base,
            format: 'A4',
            border: 0,
            type: 'pdf',
            "footer": {
                "height": "10mm",
                "contents": {
                    first: '<p style="font-size: 6pt; color: #b4b4b4; text-align: center;">请将序号纸的票据按顺序贴于底层(例如) 便于财务快速审核、加快报销速度。</p>', // fallback value
                }
            },
            zoomFactor: 1,
        }).toBuffer(function(err: any, bfs: string) {
            if (err) return reject(err);
            return resolve(bfs);
        })
    })
}


export default async function main() {
    console.log('main');
    var api_test = false;
    if(api_test){
        let buf = await html2pdf(html);
        fs.writeFileSync('output.pdf', buf, 'binary');
    }else{
        let buf = await makeSpendReport(data);
        fs.writeFileSync('output.pdf', buf);
    }
}


var data = {
    "submitter": "李晓晨",  //提交人
    "department": "董事会",  //部门
    "budgetMoney": 4000.20, //预算总金额
    "totalMoney": 3865.40,  //实际花费
    "totalMoneyHZ": "叁千捌佰陆拾肆元五角整",  //汉子大写金额
    "invoiceQuantity": 4, //票据数量
    "createAt": "2016-10-15 12:00:00", //生成时间
    "departDate": "2016-09-21", //出差起始时间
    "backDate": "2016-09-25", //出差返回时间
    "reason": "阿里巴巴商务洽谈", //出差事由
    "approveUsers": ["彭科", "王鹏", "曹爽"], //本次出差审批人
    "qrcode": "data:image/png;base64,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",
    "invoices": [ //全部票据
        {
            "type": "交通",
            "date": "2016-09-15",
            "invoiceInfo": "交通费",
            "quantity": 1,
            "money": 710.00,
            "departCity": "北京",
            "arrivalCity": "上海",
            "remark": "北京至上海",
            "trafficType": "GO",
            "trafficInfo": "高铁一等座"
        },
        {
            "type": "住宿",
            "date": "2016-09-25",
            "invoiceInfo": "住宿费",
            "quantity": 1,
            "money": 200.00,
            "remark": "2016.09.21-2016.09.25 上海 共5日",
            "duration": "5"
        },
        {
            "type": "交通",
            "date": "2016-08-25",
            "invoiceInfo": "交通费",
            "quantity": 1,
            "money": 1000,
            "departCity": "上海",
            "arrivalCity": "北京",
            "remark": "上海至北京",
            "trafficType": "BACK",
            "trafficInfo": "飞机经济舱"
        }
    ]
}
