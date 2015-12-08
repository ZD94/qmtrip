'use strict';

require('app-module-path').addPath(__dirname);

var fs = require('fs');
var util = require('util');
var Q = require('q');
var co = require('co');

var skyscanner = require('api/skyscanner');

function filter_by_flighttime(itinerary){
    var leg = this.Legs[itinerary.OutboundLegId];
    if(!leg) return false;
    if(leg.SegmentIds.length != 1) return false;
    var seg = this.Segments[leg.SegmentIds[0]];
    if(!seg) return false;
    if(seg.DepartureDateTime.hour < 9) return false;
    if(seg.ArrivalDateTime.hour > 21) return false;
    return true;
}

co(function*(){
    var data;
    if(true){
        var url = yield skyscanner.create_session('BJSA-sky', 'CSHA-sky', '2016-01-01', '');
        //return;
        var index = 0;
        do{
            yield Q.timeout(1000);
            console.error('pull session url:', url);
            var res = yield skyscanner.pull_session(url);
            console.error('code:%d, msg:%s', res.statusCode, res.statusMessage);
            //console.log(res.data);
            fs.writeFileSync('skyscanner_'+index+'.json', res.body);
            console.error('next url:', res.headers.location);
            index++;
            console.log(res.data.Status);
        }while(res.data.Status == 'UpdatesPending');
        data = res.data;
    }else{
        var readFile = Q.denodeify(fs.readFile);
        data = yield readFile('skyscanner_2.json');
        data = JSON.parse(data);
        data.__proto__ = skyscanner.Session.prototype;
        data.prepare();
    }
    data.print(filter_by_flighttime);
    //console.log(util.inspect(data, {depth:1}));
    var lowest = data.lowest_price(filter_by_flighttime);
    console.log('参考价格:');
    lowest.leg.print();
    lowest.pricing_option.print();


}).catch(function(e){
    if(e.stack)
        console.error('co catch:', e.stack);
    else
        console.error('co catch:', e);
});

