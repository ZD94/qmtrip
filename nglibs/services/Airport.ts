
import angular = require('angular');

var API = require('@jingli/dnode-api');

API.require("place");

angular
    .module('nglibs')
    .factory('AirPort', function() {
        let obj: any;
        obj = {};
        obj.get = function(id) {
            var ret = (async function(id) {
                await API.onload();
                let airport = await API.place.getAirportById({id: id});
                return airport;
            })(id);
            return ret;
        }

        obj.getByCode = function(code) {
            var ret = (async function(code) {
                await API.onload();
                let airport = await API.place.getAirportByCode({skyCode: code})
                return airport;
            })(code)
            return ret;
        }

        return obj;
    })