/**
 * Created by wlh on 16/8/11.
 */

'use strict';

export var ticketPrefer = {
    arrivaltime: require('./ticket-arrivaltime'),
    cabin: require('./ticket-cabin'),
    cheapsupplier: require('./ticket-cheapsupplier'),
    departtime: require('./ticket-departtime'),
    lowestprice: require('./ticket-lowestprice'),
    maxpricelimit: require('./ticket-maxpricelimit'),
    selecttraffic: require('./ticket-selecttraffic'),
    priceprefer: require('./ticket-priceprefer'),
    preferagent: require('./ticket-preferagent'),
    preferaircompany: require('./ticket-preferaircompany')
};

export var hotelPrefer = {
    lowestprice: require('./hotel-lowestprice'),
    blacklist: require('./hotel-blacklist'),
    represent: require('./hotel-represent'),
    starmatch: require('./hotel-starmatch'),
    maxpricelimit: require('./hotel-maxpricelimit')
}