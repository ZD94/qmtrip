'use strict';

function Segment(){

}

Segment.prototype.print = function() {
    var self = this;
    var session = this.session;
    var flightnumber = self.Carrier.DisplayCode + self.FlightNumber;
    var flighttime = self.DepartureDateTime.hour+':'+self.DepartureDateTime.minute + '=>' + self.ArrivalDateTime.hour+':'+self.ArrivalDateTime.minute;
    var flightfromto = self.OriginStation.Name + '->' + self.DestinationStation.Name;
    var flightcarrier = self.Carrier.Name;
    console.log(`  ${flightnumber} ${flighttime} ${flightfromto} ${flightcarrier}`);
};

function Leg(){

}

Leg.prototype.print = function(){
    var self = this;
    var session = this.session;
    var p = [];
    p.push(self.OriginStation.Name);
    for(var stop of self.Stops){
        p.push(stop.Name);
    }
    p.push(self.DestinationStation.Name);
    p = p.join('->');
    console.log(`${self.Departure.hour}:${self.Departure.minute}=>${self.Arrival.hour}:${self.Arrival.minute} (${p})`);
    self.Segments.forEach(function(seg){
        seg.print();
    });
};

function PricingOption(){

}

PricingOption.prototype.print = function(){
    var self = this;
    var itinerary = self.itinerary;
    var session = itinerary.session;
    var agentnames = [];
    for(var agent of self.Agents){
        agentnames.push(agent.Name);
    }
    agentnames = agentnames.join(' ');
    console.log(`    ${agentnames} ${self.Price}`);
};

function Itinerary(){

}

Itinerary.prototype.print = function(){
    var self = this;
    self.OutboundLeg.print();
    for(var price of self.PricingOptions){
        price.print();
    }
};
function Session(){

}

var reg_datetime = /(\d{4})\-(\d{2})\-(\d{2})T(\d{2}):(\d{2}):(\d{2})/;
function parse_datetime(str){
    var m = str.match(reg_datetime);
    return {
        year:m[1],month:m[2],day:m[3],
        hour:m[4],minute:m[5],secend:m[6]
    };
}

Session.prototype.prepare = function(){
    function convert_array_to_map(arr){
        var map = {};
        for(var obj of arr){
            map[obj.Id] = obj;
        }
        return map;
    }
    var self = this;
    self.Places = convert_array_to_map(self.Places);
    self.Carriers = convert_array_to_map(self.Carriers);
    self.Agents = convert_array_to_map(self.Agents);
    self.Segments.forEach(function(seg){
        seg.session = self;
        seg.OriginStation = self.Places[seg.OriginStation];
        seg.DestinationStation = self.Places[seg.DestinationStation];
        seg.Carrier = self.Carriers[seg.Carrier];
        seg.OperatingCarrier = self.Carriers[seg.OperatingCarrier];
        seg.DepartureDateTime = parse_datetime(seg.DepartureDateTime);
        seg.ArrivalDateTime = parse_datetime(seg.ArrivalDateTime);
        seg.__proto__ = Segment.prototype;
    });
    self.Segments = convert_array_to_map(self.Segments);
    self.Legs.forEach(function(leg){
        leg.session = self;
        leg.Segments = leg.SegmentIds.map(function(segid){ return self.Segments[segid]; });
        leg.OriginStation = self.Places[leg.OriginStation];
        leg.DestinationStation = self.Places[leg.DestinationStation];
        leg.Stops = leg.Stops.map(function(stopid){ return self.Places[stopid]; });
        leg.Carriers = leg.Carriers.map(function(carrierid){ return self.Carriers[carrierid]; });
        leg.OperatingCarriers = leg.OperatingCarriers.map(function(carrierid){ return self.Carriers[carrierid]; });
        leg.FlightNumbers.forEach(function(flight){
            flight.Carrier = self.Carriers[flight.CarrierId];
        });
        leg.Departure = parse_datetime(leg.Departure);
        leg.Arrival = parse_datetime(leg.Arrival);
        leg.__proto__ = Leg.prototype;
    });
    self.Legs = convert_array_to_map(self.Legs);
    self.Itineraries.forEach(function(itnr){
        itnr.session = self;
        itnr.OutboundLeg = self.Legs[itnr.OutboundLegId];
        itnr.PricingOptions.forEach(function(option){
            option.itinerary = itnr;
            option.Agents = option.Agents.map(function(agentid){ return self.Agents[agentid]; });
            option.__proto__ = PricingOption.prototype;
        });
        itnr.__proto__ = Itinerary.prototype;
    });
};

Session.prototype.print = function(itinerary_filter){
    var self = this;
    var itineraries = self.Itineraries;
    if(itinerary_filter){
        itineraries = itineraries.filter(itinerary_filter.bind(self));
    }
    console.log('================================================================================');
    itineraries.forEach(function(itinerary){
        itinerary.print();
    });
    console.log('================================================================================');
};
Session.prototype.lowest_price = function(itinerary_filter){
    var self = this;
    var itineraries = self.Itineraries;
    if(itinerary_filter){
        itineraries = itineraries.filter(itinerary_filter.bind(self));
    }
    var lowest_price = Number.MAX_VALUE;
    var lowest = {};
    itineraries.forEach(function(itinerary){
        for(var option of itinerary.PricingOptions){
            if(option.Price < lowest_price){
                lowest_price = option.Price;
                lowest.itinerary = itinerary;
                lowest.leg = self.Legs[itinerary.OutboundLegId];
                lowest.pricing_option = option;
            }
        }
    });
    return lowest;
};

module.exports = Session;
