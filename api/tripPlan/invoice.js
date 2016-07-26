/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var moment = require("moment");
var fs = require('fs');
var path = require('path');
var API = require("common/api");

function agentGetTripplanInvoice(req, res, next){
    req.clearTimeout();
    var consumeId = req.params.consumeId;
    var userId = req.cookies.agent_id;
    var token_id = req.cookies.agent_token_id;
    var token_sign = req.cookies.agent_token_sign;
    var timestamp = req.cookies.agent_token_timestamp;
    return API.auth.authentication({user_id: userId, token_id: token_id, token_sign: token_sign, timestamp: timestamp})
        .then(function(result){
            if (!result) {
                res.send(403);
                return;
            }

            return API.tripPlan.getTripDetail({id: consumeId})
                .then(function(data){
                    if (!data) {
                      res.send(404);
                      return;
                    }
                    return API.attachments.getAttachment({id: data.newInvoice})
                        .then(function(attachment) {
                            if (!attachment || !attachment.content) {
                                res.send(404);
                                return;
                            }

                            res.set("Content-Type", attachment.contentType);
                            var content = new Buffer(attachment.content, 'base64');
                            res.write(content);
                            res.end();
                        })
                })
        })
        .catch(next).done();
}

function agentGetTripplanDetailInvoice(req, res, next){
    req.clearTimeout();
    var fileId = req.params.fileId;
    var userId = req.cookies.agent_id;
    var token_id = req.cookies.agent_token_id;
    var token_sign = req.cookies.agent_token_sign;
    var timestamp = req.cookies.agent_token_timestamp;
    return API.auth.authentication({user_id: userId, token_id: token_id, token_sign: token_sign, timestamp: timestamp})
        .then(function(result){
            if (!result) {
                res.send(403);
                return;
            }

            return API.attachments.getAttachment({id: fileId})
                .then(function(attachment) {
                    if (!attachment || !attachment.content) {
                        res.send(404);
                        return;
                    }

                    res.set("Content-Type", attachment.contentType);
                    var content = new Buffer(attachment.content, 'base64');
                    res.write(content);
                    res.end();
                })
        })
        .catch(next).done();
}


module.exports = function(app){
    app.get('/consume/invoice/:consumeId', agentGetTripplanInvoice);
    app.get('/consume/invoice/detail/:fileId', agentGetTripplanDetailInvoice);
};

