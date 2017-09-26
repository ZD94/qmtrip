/**
 * Created by wyl on 15-12-12.
 */
var API = require('@jingli/dnode-api');

var assert = require("assert");
var getSession = require('@jingli/dnode-api').getSession;


var id = "";
var agencyId = "";
var companyId = "";
var accountId = "";
var obj= {
    accordPrice: 900,
    cityName: "经济舱" ,
    cityCode: "CT_50",
}
var company = {
    name: 'accordHotelTest的企业',
    userName: 'accordHotelTest企业',
    domain: 'tulingdao.com',
    description: 'accordHotel API测试用',
    email: 'ah.company.test@accordhotel.com',
    mobile: '18909876541'
}

var agency = {
    email: "ah.agency.test@accordhotel.com",
    userName: "accordHotelTest代理商",
    name: 'accordHotelTest的代理商',
    mobile: "18767890980",
    description: 'accordHotel API测试用'
};

describe("api/accordHotel.js", function() {

    describe("accordHotel/companyHndel", function() {

        //创建差旅标准
        before(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .spread(function(ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function(ret){
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function(company){
                    assert.equal(company.status, 0);
                    companyId = company.id;
                    accountId = company.createUser;
                    var session = getSession();
                    session.accountId = accountId;
                })
                .nodeify(done);
        });

        after(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .nodeify(done);
        });
        it("#createAccordHotel should be ok", function(done) {
            obj.companyId = companyId;
            API.accordHotel.createAccordHotel(obj, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询差旅标准
        it("#getAccordHotelaaa should be ok", function(done) {
            API.accordHotel.getAccordHotel({id: id}, done);
        })
        //查询差旅标准集合
        it("#getAccordHotels should be ok", function(done) {
            API.accordHotel.getAccordHotels({name: "456", companyId: companyId}, done);
        })
        //更新差旅标准信息
        it("#updateAccordHotel should be ok", function(done) {
            obj.id = id;
            obj.cityName = "修改过的123";
            API.accordHotel.updateAccordHotel(obj, done);
        })
        //删除差旅标准信息
        it("#deleteAccordHotel should be ok", function(done) {
            API.accordHotel.deleteAccordHotel({id: id}, done);
        })

    });


    describe("accordHotel/agencyHandel", function() {
        var objTwo= {
            name: "四级标准",
            planeLevel: "经济舱" ,
            planeDiscount: "7.5",
            trainLevel: "硬卧",
            hotelLevel: "三星级",
            hotelPrice: "300",
            subsidy: "300"
        }
        /********代理商代企业管理差旅标准api********/

        before(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .spread(function(ret1, ret2, ret3) {
                    return API.client.agency.registerAgency(agency);
                })
                .then(function(ret){
                    agencyId = ret.createUser;
                    var session = getSession();
                    session.accountId = agencyId;
                    return API.client.company.registerCompany(company);
                })
                .then(function(company){
                    assert.equal(company.status, 0);
                    companyId = company.id;
                })
                .nodeify(done);
        });

        after(function(done) {
            Promise.all([
                    API.agency.deleteAgencyByTest({email: agency.email, mobile: agency.mobile, name: agency.name}),
                    API.company.deleteCompanyByTest({email: company.email, mobile: company.mobile}),
                    API.staff.deleteAllStaffByTest({email: company.email, mobile: company.mobile, name: company.name})
                ])
                .nodeify(done);
        });


        //创建差旅标准
        it("#agencyCreateAccordHotel should be ok", function(done) {
            objTwo.companyId = companyId;
            objTwo.name = "agencyCreateAccordHotel";
            API.accordHotel.createAccordHotel(objTwo, function(err, result) {
                id = result.id;
                done(err);
            });
        })
        //查询差旅标准
        it("#agencyGetAccordHotel should be ok", function(done) {
            API.accordHotel.getAccordHotel({id: id, companyId: companyId}, done);
        })
        //查询差旅标准集合
        it("#agencyGetAccordHotels should be ok", function(done) {
            API.accordHotel.getAccordHotels({name: "456", companyId: companyId}, done);
        })

        //更新差旅标准信息
        it("#agencyUpdateAccordHotel should be ok", function(done) {
            objTwo.id = id;
            objTwo.cityName = "修改过的456";
            objTwo.companyId = companyId;
            API.accordHotel.updateAccordHotel(objTwo)
                .nodeify(done);
        })
        //删除差旅标准信息
        it("#agencyDeleteAccordHotel should be ok", function(done) {
            API.accordHotel.deleteAccordHotel({id: id, companyId: companyId})
                .nodeify(done);
        })
        /********代理商代企业管理差旅标准api********/
    })

})