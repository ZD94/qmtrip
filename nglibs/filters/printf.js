var printf = require('printf');
angular
    .module('nglibs')
    .filter('printf', function () {
    return function (value, format) {
        return printf(format, value);
    };
});
