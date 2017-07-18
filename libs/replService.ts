import {port} from "_debugger";
/**
 * Created by wangyali on 2017/7/10.
 */
var repl = require('repl')
var net = require('net')
const API = require('@jingli/dnode-api');

export default class ReplModel{
    private port:number|string;
    private host: string;
    private _context: Object;

    constructor(target: {port: number|string, host?: string, context: Object}) {
        this.host = target.host || "0.0.0.0";
        this.port = target.port;
        this._context = target.context;
    }
    initReplServer(){
        let self = this;
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
            for(let k in self._context){
                r.context[k] = self._context[k] ;
            }
        }).listen(this.port, this.host)
    }
}
