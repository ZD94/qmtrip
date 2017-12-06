/**
 * Created by wangyali on 2017/7/10.
 */
var repl = require('repl')
var net = require('net')
import { Socket } from 'net';
import Logger from '@jingli/logger';
const logger = new Logger("replServer");

export interface ReplOptions { 
    context?: {
        [index: string]: any;
    },
    host?: string;
}

export default class ReplModel{
    private host: string;
    private _context: {
        [key:string]: any
    };

    constructor(public port: number | string, options?: ReplOptions) {
        if (!options) { 
            options = {};
        }
        this.host = options.host || "127.0.0.1";
        this._context = options.context;
    }

    initReplServer(){
        let self = this;
        var server = net.createServer(function (socket: Socket) {
            var r = repl.start({
                prompt: 'socket ' + socket.remoteAddress + ':' + socket.remotePort + '> '
                , input: socket
                , output: socket
                , terminal: true
                , useGlobal: false
            })
            r.on('exit', function () {
                socket.end()
            })
            for (let k in self._context) {
                r.context[k] = self._context[k];
            }
        });
        server.on('listening', function () {
            logger.info(`repl server start on ${self.port}`);
        });   
        server.listen(self.port, self.host);
        return server;
    }
}
