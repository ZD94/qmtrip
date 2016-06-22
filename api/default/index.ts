/**
 * Created by yumiao on 16-5-26.
 */
'use strict';
import { Models } from 'api/_types';
import {clientExport} from "common/api/helper";

class defaultModule {
    @clientExport
    static async remoteGet<T>(params: {id: string, modname: string}): Promise<T> {
        let modname = params.modname.replace(/^[A-Z]/, (s)=>s.toLowerCase());
        return await Models[modname].get(params.id);
    }

    @clientExport
    static async remoteDelete<T>(params: {id: string, modname: string}): Promise<T> {
        let modname = params.modname.replace(/^[A-Z]/, (s)=>s.toLowerCase());
        let ret = await Models[modname].get(params.id);
        return ret.destroy();
    }
}

export = defaultModule;