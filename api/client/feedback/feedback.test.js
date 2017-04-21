/**
 * Created by wyl on 16-01-22.
 */
var API = require('@jingli/dnode-api');

var assert = require("assert");

describe("api/client/feedback.js", function() {

    var parentId_f = "";
    var agencyUserId = "";
    var self = {};
    var companyId = "";
    var accountId = "";
    var obj = {
        name: "销售部"
    }
    var company = {
        name: 'feedbackTest的企业',
        userName: '张三',
        domain: 'tulingdao.com',
        description: '企业API测试用',
        email: 'feedback.company.test@tulingdao.com',
        mobile: '15269866999'
    }

    var agency = {
        email: "feedback.agency.test@tulingdao.com",
        userName: "feedbackTest代理商",
        name: 'feedbackTest的代理商',
        mobile: "15269866777",
        description: '企业API测试用'
    };

    //创建部门
    before(function(done) {
        Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function(ret1, ret2, ret3){
                return API.agency.createAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                assert.equal(company.status, 0);
                companyId = company.id;
                accountId = company.createUser;
                self = {accountId: accountId};
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    after(function(done) {
        Promise.all([
                API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
                API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
            ])
            .spread(function(ret1, ret2, ret3){
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });
    //创建默认部门
    it("#sendFeedback should be ok", function(done) {
        obj.companyId = companyId;
        API.client.feedback.sendFeedback.call(self, {content: "意见反馈test", isAnonymity: true}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
})