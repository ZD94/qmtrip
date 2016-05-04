
export const Types = {
    ABSTRACT : Function,
    STRING : Function,
    CHAR : Function,
    TEXT : Function,
    NUMBER : Function,
    INTEGER : Function,
    BIGINT : Function,
    FLOAT : Function,
    TIME : Function,
    DATE : Function,
    DATEONLY : Function,
    BOOLEAN : Function,
    NOW : Function,
    BLOB : Function,
    DECIMAL : Function,
    NUMERIC : Function,
    UUID : Function,
    UUIDV1 : Function,
    UUIDV4 : Function,
    HSTORE : Function,
    JSON : Function,
    JSONB : Function,
    VIRTUAL : Function,
    ARRAY : Function,
    NONE : Function,
    ENUM : Function,
    RANGE : Function,
    REAL : Function,
    DOUBLE : Function,
    "DOUBLE PRECISION" : Function,
    GEOMETRY : Function,
};

export function Table(name?: string, options?: any) {
}

export function Field(options: any){
    return function(prototype: any, name: string, desc: PropertyDescriptor) {
        desc.get = function(){
            return this.target[name];
        };
        desc.set = function(val){
            this.target[name] = val;
        };
    };
}

export function ResolveRef(options: any, getter: (id:string)=>Promise<Object>, key?: string){
    return function(prototype: any, name: string, desc: PropertyDescriptor) {
        key = key || name+'Id';

        desc.configurable = false;
        desc.get = function(){
            return this.$resolved ? this.$resolved[name] : undefined;
        };

        prototype.$resolvers = prototype.$resolvers || [];
        prototype.$resolvers[name] = async ()=>{
            this.$resolved[name] = await getter(this.target[key]);
        }
        var $resolve = prototype.$resolve;
        if(!$resolve || !$resolve.attached){
            prototype.$resolve = function(){
                var promises = this.$resolvers.map((f)=> f());
                if($resolve)
                    promises.push($resolve());
                return Promise.all(promises);
            }
            prototype.$resolve.attached = true;
        }
    };
}

export function Reference(options: any, key?: string){
    return function(prototype: any, name: string, desc: PropertyDescriptor) {
        key = key || name.replace(/^get([A-Z])/, (m, s)=>s.toLowerCase())+'Id';

        var getter = prototype[name];
        prototype[name] = ()=>getter(this.target[key])
    };
}


export function Update(updater: (id:string, fields:Object)=>Promise<any>){
    return function(prototype: any, name: string, desc: PropertyDescriptor) {
        prototype[name] = async ()=>{
            var fields = this.$fields;
            this.$fields = {};
            try{
                if(!fields)
                    return;
                await updater(this.id, fields);
            }catch(e){
                _.defaults(this.$fields, fields);
                throw e;
            }
        }
    };
}

export function Destroy(deleter: (id:string)=>Promise<any>){
    return function(prototype: any, name: string, desc: PropertyDescriptor) {
        prototype[name] = async ()=>{
            await deleter(this.id);
        }
    };
}
