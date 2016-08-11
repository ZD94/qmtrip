'use strict';


var _ = require('lodash');


var tpl = 'test <%= "hello " + func() %> <% print("hello " + func()); %>'

var compiled = _.template(tpl);
var result = compiled({
    'user': 'barney',
    'func': function(){
        return this.user;
    }
});

console.log(result);
