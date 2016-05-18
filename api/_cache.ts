
var weak = require('weak');

var caches:any = {};

export class WeakCache {
    cache = new Map<string, any>();
    constructor(public id: string){
    }
    put<T>(key: string, value?: T): T {
        if(value == undefined){
            this.remove(key);
            return value;
        }
        var ref = weak(value, ()=>{
            console.log(this.id, 'weak ref', key, 'gc');
            var ref2 = this.cache.get(key);
            if(ref === ref2){
                console.log(this.id, 'remove ref', key);
                this.remove(key);
            }
        })
        this.cache.set(key, ref);
        return value;
    }
    get<T>(key: string): T {
        var ref = this.cache.get(key);
        if(ref == undefined)
            return undefined;
        return weak.get(ref) as T;
    }
    remove(key: string): void{
        this.cache.delete(key);
    }
    removeAll(): void{
        this.cache.clear();
    }
    destroy(): void{
    }
}

export function createCache(cacheId: string): WeakCache{
    if(cacheId in caches) {
        throw new Error('cache id is used.');
    }
    caches[cacheId] = new WeakCache(cacheId);
    return caches[cacheId];
}

