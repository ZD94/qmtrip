/**
 * Created by wlh on 2016/11/10.
 */

'use strict';
import {EventEmitter} from 'events';

export class OAEmitter extends EventEmitter {
    constructor() {
        super();
    }
}

export var emitter = new OAEmitter()
