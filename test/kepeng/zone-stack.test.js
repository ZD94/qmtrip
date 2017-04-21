
var events = require('events');

var zone = require('@jingli/zone-setup');
require('zone.js/dist/long-stack-trace-zone')

global.Promise = require('bluebird');
Promise.config({longStackTraces: false});

var emiter = new events.EventEmitter();

setTimeout(function () {
    emiter.emit('test');
}, 1000);

function waitEvent() {
    return new Promise(function (resolve, reject) {
        emiter.on('test', reject(new Error('event error')));
    });
}

function wait() {
    return new Promise(function (resolve, reject) {
        setTimeout(resolve, 1000);
    });
}

zone.forkStackTrace()
    .run(function () {
        console.log('init zone:', Zone.current.name);
        Zone.current
            .fork({name: 'test', properties: {text: 'test'}})
            .run(function () {
                console.log('init zone:', Zone.current.name);

                waitEvent()
                    .then(function () {
                        console.log('then:', Zone.current.name);
                        return wait();
                    }, function(e){
                        console.log('error:', Zone.current.name);
                        throw e;
                    })
                    .tap(function () {
                        console.log('tap:', Zone.current.name);
                    })
                    .then(function () {
                        console.log('then:', Zone.current.name);
                        throw new Error('test');
                    })
                    .then(function () {
                        console.log('then:', Zone.current.name);
                    }, function(e){
                        console.log('error:', Zone.current.name);
                        throw e;
                    })
                    .catch(function (e) {
                        console.log('catch:', Zone.current.name);
                        //console.log(e.stack);
                        throw e;
                    })
                    .done();

            });
    });
