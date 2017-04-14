"use strict";
module.exports = function ($module) {
    $module.filter('currency_point', function () {
        return function (value, search) {
            while (!isNaN(value)) {
                value = parseFloat(value);
                trans();
            }
            return value;
            function trans() {
                var floatnum = parseFloat(value);
                var intval = parseInt(value);
                var intvalue = Math.floor((floatnum - intval) * 100);
                var stringn = intvalue.toString();
                var length = stringn.length;
                var i = 0;
                while (stringn.length < 3) {
                    stringn = '0' + stringn;
                    i++;
                }
                var point;
                if (i == 1 && stringn.substr(-1) == "0") {
                    point = stringn.substr(length - i, 1);
                    value = '￥' + intval + '<i>.' + point + '</i>';
                }
                else {
                    point = stringn.substr(length - i);
                    if (point == 0) {
                        value = '￥' + intval;
                    }
                    else {
                        value = '￥' + intval + '<i class="sm_font">.' + point + '</i>';
                    }
                }
            }
        };
    });
};
