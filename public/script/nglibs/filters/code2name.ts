
import angular = require('angular');

angular
    .module('qm.common', [])
    .filter('code2name', function (PlaceCache) {
        var codemap = new Map()
        var code2name:any = function(code, scope) {
            if (code === undefined)
                return undefined;
            if (!codemap.has(code)) {
                codemap.set(code, code)
                PlaceCache.$resolve()
                    .call('get', code)
                    .then(function (value) {
                        codemap.set(code, value.name);
                        scope.$applyAsync();
                    })
                return code;
            } else {
                return codemap.get(code);
            }
        }
        code2name.$stateful = true;
        return code2name;
    });