
import L from '@jingli/language';
import { Models } from '_types';
import { clientExport } from '@jingli/dnode-api/dist/src/helper';
import { ModelInterface, ModelObjInterface, FindResult } from 'common/model/interface';

export class ModelForClient{
    @clientExport
    async create<T extends ModelObjInterface>(modelType: string, obj: Object): Promise<T>{
        let model = Models[modelType] as ModelInterface<T>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        return model.create(obj);
    }
    @clientExport
    async get<T extends ModelObjInterface>(modelType: string, id: string, options?: any): Promise<T|null>{
        let model = Models[modelType] as ModelInterface<T>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        return model.get(id, options);
    }
    @clientExport
    async find<T extends ModelObjInterface>(modelType: string, options: any): Promise<FindResult>{
        let model = Models[modelType] as ModelInterface<T>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        return model.$find(options);
    }
    @clientExport
    async update<T extends ModelObjInterface>(modelType: string, id: string, props: object, options: any): Promise<T>{
        let model = Models[modelType] as ModelInterface<T>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        let obj = await model.get(id);
        if(!obj)
            throw L.ERR.NOT_FOUND('id');

        for(let key in props){
            obj[key] = props[key];
        }
        return obj.save();
    }
    @clientExport
    async destory(modelType: string, id: string, options: any): Promise<any>{
        let model = Models[modelType] as ModelInterface<ModelObjInterface>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        let obj = await model.get(id);
        if(!obj)
            throw L.ERR.NOT_FOUND('id');
        return obj.destroy();
    }
    @clientExport
    async call(modelType: string, method: string, id: string, args: any[]): Promise<any>{
        let model = Models[modelType] as ModelInterface<any>;
        if(!model)
            throw L.ERR.INVALID_ARGUMENT('modelType');
        let obj = await model.get(id);
        if(!obj)
            throw L.ERR.NOT_FOUND('id');
        let func = obj[method];
        if(typeof func !== 'function')
            throw L.ERR.INVALID_ARGUMENT('method');

        return func.apply(obj, args);
    }
}

export default new ModelForClient();