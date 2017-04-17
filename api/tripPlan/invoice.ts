/**
 * Created by by wyl on 15-12-16.
 */
'use strict';
import { Models, EAccountType } from '_types/index';
import { EStaffRole } from '_types/staff';
import { parseAuthString } from '_types/auth/auth-cert';
var API = require("common/api");
import Logger from '@jingli/logger';
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

        var staffs = await Models.staff.all({ where: {accountId: userId}});
        if(!staffs || !staffs.length)
            return false;
        let isHasPermit = false;
        for(let staff of staffs) {
            if(staff.id == tripPlan.account.id){
                isHasPermit = true;
                break;
            }
            if(staff.company.id == tripPlan.account.company.id &&
                (staff.roleId == EStaffRole.ADMIN || staff.roleId == EStaffRole.OWNER)) {
                isHasPermit = true;
                break;
            }
        }
        return isHasPermit;

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