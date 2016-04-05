var containerId = "cal_" + Math.floor(Math.random()*1e10);

function mobileSelectDate(config, options) {
    "use strict";
    if (!config) {
        config = {};
    }

    if (!options) {
        options = {};
    }

    config.dayClass = "day";
    config.isShowWeekDayName = false;
    config.isShowMonth = true;
    config.holiday = {
        "2016-4-4": "清明节",
        "2016-5-1": "劳动节",
        "2016-6-9": "端午节",
        "2016-9-15": "中秋节",
        "2016-10-1": "国庆节"
    }
    config.restday = {
        "2016-4-2": "true",
        "2016-4-3": "true",
        "2016-4-4": "true",
        "2016-4-30": "true",
        "2016-5-1": "true",
        "2016-5-2": "true",
        "2016-6-09": "true",
        "2016-6-10": "true",
        "2016-6-11": "true",
        "2016-9-15": "true",
        "2016-9-16": "true",
        "2016-9-17": "true",
        "2016-10-1": "true",
        "2016-10-2": "true",
        "2016-10-3": "true",
        "2016-10-4": "true",
        "2016-10-5": "true",
        "2016-10-6": "true",
        "2016-10-7": "true"
    }
    var PromiseLib = options.PromiseLib || window.Promise;

    config.show = function(data) {
        var divObj = document.createElement("div");
        divObj.className = "calendar";
        divObj.id = containerId;
        divObj.innerHTML = data.join("");
        var weekBar = document.createElement("table");
        weekBar.innerHTML = '<tr><td>日</td><td>一</td><td>二</td><td>三</td><td>四</td><td>五</td><td>六</td></tr>';
        weekBar.className = "weekbar";
        divObj.insertBefore(weekBar,divObj.childNodes[0]);
        document.getElementsByTagName("body")[0].appendChild(divObj);
    }

    if (!PromiseLib) {
        throw new Error("can't find PromiseLib support!");
    }

    var calendar = require("calendar");
    return calendar.selectDate(options);
}