// import {Models} from "_types";
var request = require("supertest");
var assert = require("assert");
const config = require("@jingli/config");
const url = `http://localhost:${config.port}`;
/**
 * @method 测试订单系统的透明代理，
 *   注意 测试用例未完全跑通，
 */
describe("api/proxy", async () => {
    // let tripDetail = await Models.tripDetail.find({where: {}, order: [["created_at", "desc"]], limit: 1});
    var tripDetail = [{id: '11'}]
    describe("fetchOrderList", async () => {
        it("#fetchOrderList should fetch an order list with latest tripDetailId", async () => {
            request(url)
            .get(`/order/${tripDetail[0].id}`)
            .expect(200)
            .end(async (err, res) => {
                if(err)
                    console.log(err);
                let result = res.body;
                assert.notEqual(result.length, 0, '订单列表为空');
            });
        })
    })
    describe("orderTicket", async ()=> {
        it("#orderTicket should order ticket successfully with one tripDetailId ", async () => {
            request(url)
            .post(`/order/${tripDetail[0].id}`)
            .expect(200)
            .end(async (err, res) => {
                if(err)
                    console.log(err);
                let result = res.body;
                assert.notEqual(result.length, 0, '订单列表为空');
            });    
        })
    });
});
