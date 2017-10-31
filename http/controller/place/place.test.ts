// const request = require("supertest");
// const assert = require("assert");
// const md5 = require('md5');
// const prefixUrl = '/api/v1';

// const target = 'http://localhost:4003';
// const cityId = 2038349;

// describe('test place api', () => {
//     it(`#GET ${prefixUrl}/city/${cityId} should be ok`, cb => {
//         request(target)
//             .get(prefixUrl + `/city/${cityId}`)
//             .end((err,res) =>{
//                 if(err) cb(err);
//                 const result: any = JSON.stringify(res.body)
//                 cb(assert.equal(result.code, 0));
//             });
//     });

//     it(`#GET ${prefixUrl}/city/${cityId} should be ok`, cb => {
//         request(target)
//             .get(prefixUrl + `/city/${cityId}`)
//             .end((err,res) =>{
//                 if(err) cb(err);
//                 const result: any = JSON.stringify(res.body)
//                 cb(assert.equal(result.code, 0));
//             });
//     });
// });

