
import angular = require('angular');

var API = require('@jingli/dnode-api');
API.require("place");

angular
    .module('nglibs')
    .factory('AirCompany', function() {
        var obj: any;
        obj = {}
        obj.get = (id:string) => {
            var ret = (async function(id: string) {
                try{
                    await API.onload();
                    let aircompany =  await API.place.getAirCompanyById({id: id});
                    return aircompany;
                } catch(err) {
                    console.info(err.stack? err.stack : err);
                }
            })(id);
            return ret;
        }

        obj.getByCode = (code: string) => {
            var ret = (async function(code: string) {
                try{
                    await API.onload();
                    let aircompany = await API.place.getAirCompanyByCode({code: code});
                    return aircompany;
                } catch(err) {
                    console.info(err.stack? err.stack : err);
                }
            })(code);
            return ret;
        }

        return obj;
    });

