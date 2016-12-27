/**
 * Created by wlh on 2016/12/24.
 */

'use strict';

angular
    .module('nglibs')
    .filter('shortName', function() {
        return function(value) {
            if (!value)
                return value;

            if (value.length == 1)
                return value;

            //如果名称是中文，截取中文后两个字
            if (/^[\u4E00－\u9FA5]+$/.test(value)) {
                return value.substr(value.length-2);
            }

            //如果是全英文，如"John Li" 则返回 JL
            if (/^[a-zA-Z]+\s+[a-zA-Z]+$/.test(value)) {
                return value.split(/\s/).map( (v) => {
                    return v[0];
                }).join("");
            }
            //如果是全英文，如"WangDana" 则返回 Wa
            if (/^[a-zA-Z]+$/.test(value)) {
                return value.substr(0,2);
            }

            //其他情况均返回最后两位
            return value.substr(value.length-2);
        };
    });
