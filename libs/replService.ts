/**
 * Created by wangyali on 2017/7/10.
 */
var repl = require('repl')
var net = require('net')
const API = require('@jingli/dnode-api');

export class ReplModel{
    createServer(){
        net.createServer(function (socket) {
            var r = repl.start({
                prompt: 'socket '+socket.remoteAddress+':'+socket.remotePort+'> '
                , input: socket
                , output: socket
                , terminal: true
                , useGlobal: false
            })
            r.on('exit', function () {
                socket.end()
            })
            r.context.API = API;
        }).listen(1337)
    }
}
let replModel = new ReplModel();
export default replModel;
