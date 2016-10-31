/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
import { Models, EAccountType } from '../_types/index';
import { EStaffRole } from '../_types/staff';
import { parseAuthString } from '../_types/auth/auth-cert';
var API = require("common/api");
let Logger = require('common/logger');
let logger = new Logger("tripPlan.invoice");


module.exports = function(app){
    //app.get('/consume/invoice/:consumeId', agentGetTripplanInvoice);
    app.get('/trip-detail/:id/invoice/:fileId', agentGetTripplanDetailInvoice);
};

async function checkInvoicePermission(userId, tripDetailId){
    var tripDetail = await Models.tripDetail.get(tripDetailId);
    var tripPlan = await Models.tripPlan.get(tripDetail.tripPlanId);
    var account = await Models.account.get(userId);
    if(account.type == EAccountType.STAFF){
        var staff = await Models.staff.get(userId);
        if(!staff)
            return false;
        if(staff.id == tripPlan.account.id)
            return true;
        if(staff.company.id == tripPlan.account.company.id &&
            (staff.roleId == EStaffRole.ADMIN || staff.roleId == EStaffRole.OWNER))
            return true;
    } else if(account.type == EAccountType.AGENCY){
        var agencyUser = await Models.agencyUser.get(userId);
        if(!agencyUser)
            return false;
        var needAgency = await tripPlan.account.company.getAgency();
        if(agencyUser.agency.id == needAgency.id)
            return true;
    }
    return false;
}
async function agentGetTripplanDetailInvoice(req, res, next){
    try{
        req.clearTimeout();
        var authReq = parseAuthString(req.query.authstr);
        var result = await API.auth.authentication(authReq);
        if(!result) {
            console.log('auth failed', JSON.stringify(req.cookies));
            res.sendStatus(403);
            return;
        }

        var tripDetailId = req.params.id;
        var fileId = req.params.fileId;

        var tripDetail = await Models.tripDetail.get(tripDetailId);
        var invoices = await Models.tripDetailInvoice.find({where: {tripDetailId: tripDetail.id}});
        let pictures = invoices.map( (invoice) => {
            return invoice.pictureFileId
        })
        if(pictures.indexOf(fileId) < 0){
            res.sendStatus(404);
            return;
        }
        if(!checkInvoicePermission(result.accountId, tripDetailId)){
            res.sendStatus(403);
            return;
        }

        var cacheFile = await API.attachment.getFileCache({id: fileId, isPublic:false});
        if(!cacheFile) {
            return res.sendStatus(404);
        }
        res.set("Content-Type", cacheFile.type);
        return res.sendFile(cacheFile.file);
    } catch(e) {
        logger.error(e.stack || e);
        res.sendStatus(500);
    }
}


/*
//TODO: 完全没有权限检查,任何人登录后都可以访问任何图片
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
*/
