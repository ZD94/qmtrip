/**
 * Created by dev on 2017/3/14.
 */


var dataSource = {
    getHotels: function(qs) {
        //分析日期，分析地点
        let city = qs.city;
        let hotels;
        try {
            hotels = require("./hotel/"+city)
        } catch(err) {
            hotels = require("./hotel/default")
        }
    },
    getTickets: function(qs) {}
}

module.exports = dataSource;