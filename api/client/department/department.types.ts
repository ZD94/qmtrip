export class Department{
    id: string;
    code: string;
    name: string;
    isDefault: boolean;
    parentId: string;
    companyId: string;
    createAt: Date;

    constructor(obj: any){
        this.id = obj.id;
        this.code = obj.code;
        this.name = obj.name;
        this.isDefault = obj.isDefault;
        this.parentId = obj.parentId;
        this.companyId = obj.companyId;
        this.createAt = obj.createAt;
    }
}