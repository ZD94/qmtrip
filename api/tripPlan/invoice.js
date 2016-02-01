/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
var moment = require("moment");
var fs = require('fs');
var path = require('path');
var API = require("common/api");

function agentGetTripplanInvoice(req, res, next){
    var consumeId = req.params.consumeId;
    var userId = req.cookies.agent_id;
    var token_id = req.cookies.agent_token_id;
    var token_sign = req.cookies.agent_token_sign;
    var timestamp = req.cookies.agent_token_timestamp;
    console.info("userIduserId", userId);
    console.info("token_idtoken_id", token_id);
    console.info("token_signtoken_sign", token_sign);
    console.info("timestamptimestamp", timestamp);
    return API.auth.authentication({user_id: userId, token_id: token_id, token_sign: token_sign, timestamp: timestamp})
        .then(function(result){
            if (!result) {
                return false;
            }else{
                return API.tripPlan.getVisitPermission({consumeId: consumeId, userId: userId})
                    .then(function(data){
                        if(data.allow){
                            return API.attachments.getAttachment({id: data.fileId})
                                .then(function(attachment) {
                                    res.set("Content-Type", attachment.contentType);
                                    var content = new Buffer(attachment.content, 'base64');
                                    res.write(content);
                                    res.end();
                                })
                                .catch(next).done();
                        }else{
                            res.write("您没有权限访问该图片", "utf-8");
                            res.end();
                        }
                    })
            }
        })
}


module.exports = function(app){
    app.get('/consume/invoice/:consumeId', agentGetTripplanInvoice);
};

