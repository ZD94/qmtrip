
import L = require('common/language');
import { Models } from '../_types';
import { clientExport } from 'common/api/helper';


export default class ModelForClient{
    @clientExport
    static async call(modelType: string, method: string, id: string, args: any[]): Promise<any>{
        var model = Models[modelType];
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        var obj = await model.get(id);
        if(!obj)
            throw L.ERR.NOT_FOUND('id');
        var func = obj[method];
        if(typeof func !== 'function')
            throw L.ERR.INVALID_ARGUMENT('method');

        return func.apply(obj, args);
    }
}

