angular
    .module('nglibs')
    .filter('currency_int', function() {
        return function(value) {
            if(typeof value == 'string'){
                value = value.replace(/[^0-9\.]+/g, '');
            }
            value = Number(value);
            value = parseInt(value) == value? value : value.toFixed(1);
            return value;
        };
    });