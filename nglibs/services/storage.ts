
import { ngService } from '../index';

abstract class StorageAbstract{
    abstract getJSON(key: string): string;
    abstract setJSON(key: string, value: string): void;
    abstract remove(key: string): void;
    abstract clear(): void;

    get(key: string): any {
        var value = this.getJSON(key);
        if(value == undefined)
            return undefined;
        return JSON.parse(value);
    }
    set(key: string, value: any): void {
        if(value == undefined)
            return this.remove(key);
        this.setJSON(key, JSON.stringify(value));
    }
}

class MemStorage extends StorageAbstract {
    mem: any = {};
    constructor(){
        super();
    }
    getJSON(key: string): string{
        return this.mem[key];
    }
    setJSON(key: string, value: string){
        this.mem[key] = value;
    }
    remove(key: string): void{
        delete this.mem[key];
    }
    clear(): void{
        this.mem = {};
    }
}

class WebStorage extends StorageAbstract {
    constructor(private storage: Storage){
        super();
    }
    getJSON(key: string): string{
        return this.storage.getItem(key);
    }
    setJSON(key: string, value: string): void{
        this.storage.setItem(key, value);
    }
    remove(key: string): void{
        this.storage.removeItem(key);
    }
    clear(): void{
        this.storage.clear();
    }
}

@ngService('$storage')
class NgStorage{
    global = new MemStorage();
    local: WebStorage;
    session: WebStorage;
    constructor($window){
        this.local = new WebStorage($window.localStorage);
        this.session = new WebStorage($window.sessionStorage);
    }
}
