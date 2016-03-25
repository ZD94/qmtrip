/**
 * Created by wyl on 15-12-10.
 */
"use strict";
var assert = require("assert");
var API = require("common/api");

describe("api/client/qm_order.js", function() {

    var agencyId = "";
    var agencyUserId = "";
    var companyId = "";
    var staffId = "";

    var agency = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        description: '计划单测试用代理商'
    };

    var company = {
        email: "tripPlan.test@tulingdao.com",
        userName: "白菜帮九袋长老",
        name: '白菜帮',
        mobile: "15269866803",
        domain: 'tulingdao.com',
        description: '计划单测试用企业'
    }

    before(function(done){
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile}),
            API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
            API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile})
        ])
            .spread(function(){
                return API.agency.registerAgency(agency);
            })
            .then(function(ret){
                agencyId = ret.agency.id;
                agencyUserId = ret.agencyUser.id;
                return API.client.company.createCompany.call({accountId: agencyUserId}, company);
            })
            .then(function(company){
                companyId = company.id;
                staffId = company.createUser;
                done();
            })
            .catch(function(err){
                console.error(err);
                throw err;
            })
            .done();
    })

    after(function(done) {
        Promise.all([
            API.agency.deleteAgencyByTest({email: agency.email}),
            API.company.deleteCompanyByTest({email: company.email}),
            API.staff.deleteAllStaffByTest({email: company.email})
        ])
            .spread(function(){
                done()
            })
            .catch(function(err){
                throw err;
            })
            .done();
    });

    it("#page_qm_orders should be ok", function(done) {
        var params = {
            page: "1",
            per_page: "20"
        };
        API.client.qm_order.page_qm_orders.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            console.info(ret);
            done();
        });
    });


    it("#get_qm_order should be ok", function(done) {
        var params = {
            order_id: "MU5693",
        };
        API.client.qm_order.get_qm_order.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            console.info(ret);
            done();
        });
    });


    it("#create_order should be ok", function(done) {
        var params = {
            trip_plan_id: "0a1f1e90-ec18-11e5-b86d-4d7fe6930b0c",
            consume_id: "0a249cd0-ec18-11e5-b86d-4d7fe6930b0c",
            out_order_no: '1234567890'
        };
        API.client.qm_order.create_order.call({accountId: staffId}, params, function(err, ret) {
            if(err) {
                throw err;
            }
            console.info(ret);
            done();
        });
    });

});