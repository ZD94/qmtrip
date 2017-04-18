/**
 * Created by wyl on 16-03-25.
 */
var API = require('@jingli/dnode-api');

var assert = require("assert");

describe("api/client/mailingAddress.js", function() {

    var id = "";
    var self = {};
    var obj = {
        name: "wyl_test",
        mobile: "12659854698" ,
        area: "北京市昌平区",
        address: "霍营旗胜家园21号楼4单元902室",
        zipCode: "23659"
    }

    
    before(function(done) {
        API.staff.findOneStaff({})
            .then(function(staff){
                self = {accountId: staff.id}
                done();
            })
            .catch(function(err){
                console.info(err);
                throw err;
            })
            .done();
    });

    //创建邮寄地址
    it("#createMailingAddress should be ok", function(done) {
        API.client.mailingAddress.createMailingAddress.call(self, obj, function(err, result) {
            assert.equal(err, null);
            id = result.id;
            //console.log(result);
            done();
        });
    })
    //查询邮寄地址
    it("#getMailingAddressById should be ok", function(done) {
        API.client.mailingAddress.getMailingAddressById.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    //查询邮寄地址集合
    it("#listAndPaginateMailingAddress should be ok", function(done) {
        API.client.mailingAddress.listAndPaginateMailingAddress.call(self, {ownerId: self.accountId}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
//                console.log(result.items);//item dataValues里存放的才是记录信息
            done();
        });
    })
    it("#getCurrentUserMailingAddress should be ok", function(done) {
        API.client.mailingAddress.getCurrentUserMailingAddress.call(self, function(err, result) {
            assert.equal(err, null);
//            console.log(result);
            done();
        });
    })
    //更新邮寄地址信息
    it("#updateMailingAddress should be ok", function(done) {
        obj.id = id;
        obj.name = 'wwwyyylll';
        API.client.mailingAddress.updateMailingAddress.call(self, obj, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })
    //删除邮寄地址信息
    it("#deleteMailingAddress should be ok", function(done) {
        API.client.mailingAddress.deleteMailingAddress.call(self, {id: id}, function(err, result) {
            assert.equal(err, null);
            //console.log(result);
            done();
        });
    })

})