/**
 * Created by wangyali on 2017/7/6.
 */
export  abstract class OaDepartment{
    constructor(public target: any){
    }
    abstract get id();
    abstract set id(val: string);

    abstract get name();
    abstract set name(val: string);

    abstract get manager();
    abstract set manager(val: string);

    abstract get parentId();
    abstract set parentId(val: string);

    abstract async getChildrenDepartments();
    abstract async getParent();
    abstract async getStaffs();

}