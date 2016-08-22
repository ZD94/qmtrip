"use strict";

var Sequelize = require("sequelize");


var sequelize = require("common/model").importModel("api/agency/models");
let AgencyModel = sequelize.models.Agency;


var scrubber = require('common/api/scrubber');

scrubber.registerClass(
    Sequelize.Instance,
    'Sqlize',
    function (obj) {
        return obj.toJSON();
    },
    function (obj) {
        return obj;
    }
);

var tmp = {
    callbacks: []
}

var cache = {
    callbacks: {local: [], remote: tmp.callbacks}
}


AgencyModel.findOne().then(function (agency) {

    //console.log(Sequelize.Instance.prototype);
    //console.log(agency.__proto__);
    console.log(Sequelize.Instance.prototype === agency.__proto__.__proto__);

    var json = scrubber.scrub.call(tmp, agency);

    console.log(JSON.stringify(json));

    //console.log(Sequelize.Instance.prototype === agency.__proto__);

});
