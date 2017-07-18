/**
 * Created by wangyali on 2017/7/10.
 */
var repl = require('repl')
var net = require('net')
const API = require('@jingli/dnode-api');
import C = require("@jingli/config");

export class ReplModel{
    createReplServer(){
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
        }).listen(C.replPort, "127.0.0.1")
    }
}
let replModel = new ReplModel();
export default replModel;
