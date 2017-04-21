
require('@jingli/zone-setup');

var Q = require('q');

var events = require('events')

var emiter = new events.EventEmitter();

setTimeout(function () {
    emiter.emit('test');
}, 1000);

function waitEvent() {
    return new Q.Promise(function (resolve, reject) {
        emiter.on('test', resolve);
    });
}

function wait() {
    return new Q.Promise(function (resolve, reject) {
        setTimeout(resolve, 100);
    });
}


function printZoneName() {
    console.log('zone:', Zone.current.name);
}

Zone.current
    .fork({name: 'test', properties: {text: 'test'}})
    .run(function () {
        console.log('init zone:', Zone.current.name);
        Q()
            .then(function () {
                printZoneName();
                return wait();
            })
            .then(printZoneName)
            .tap(printZoneName)
            .then(printZoneName)
            .then(function () {
                return {a: 100};
            })
            .get('a')
            .then(printZoneName)
            .delay(100)
            .then(printZoneName)
            .then(function () {
                console.log('after waitEvent');
                return waitEvent();
            })
            .then(printZoneName)
            .then(function () {
                throw '';
            })
            .catch(function (e) {
                console.log('in catch');
                printZoneName();
                throw e;
            })
            .done();
    });
