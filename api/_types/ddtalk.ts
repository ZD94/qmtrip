/**
 * Created by wlh on 16/9/8.
 */

'use strict';
import {ModelObject} from "common/model/object";
import {Table, Create, Field, Reference} from "common/model/common";
import {Models} from "./index";
import {Types, Values} from "common/model";
import {Company} from "./company";


@Table(Models.ddtalkCorp, "ddtalk.corps")
export class DDTalkCorp extends ModelObject {

    constructor(target: Object) {
        super(target)
    }

    @Create()
    static create(obj?: Object): DDTalkCorp { return null; }

    @Field({type: Types.UUID})
    get id() : string { return Values.UUIDV1();}
    set id(id: string)  {}

    @Reference({type: Types.UUID})
    getCompany(id) : Promise<Company> {
        return Models.company.get(id);
    }

    @Field({type: Types.STRING(50)})
    get corpId() : string { return null};
    set corpId(corpId: string) {}

    @Field({type: Types.STRING(255)})
    get permanentCode() : string {return null};
    set permanentCode(code: string) {}

    @Field({type: Types.BOOLEAN})
    get isSuiteRelieve() : boolean { return false};
    set isSuiteRelieve(val: boolean) {}

    @Field({type: Types.STRING(20)})
    get agentid(): string {return ''}
    set agentid(id: string) {}
}

@Table(Models.ddtalkDepartment, "ddtalk.department")
export class DDTalkDepartment extends ModelObject {

    constructor(target: Object) {
        super(target)
    }

    @Create()
    static create(obj?: Object): DDTalkDepartment { return null; }

    @Field({type: Types.UUID})
    get id() : string { return Values.UUIDV1();}
    set id(id: string)  {}

    //local department id
    @Field({type: Types.UUID})
    get localDepartmentId(): string { return null; }
    set localDepartmentId(val: string) {}

    //dd department id
    @Field({type: Types.UUID})
    get DdDepartmentId(): string { return null; }
    set DdDepartmentId(val: string) {}
}


@Table(Models.ddtalkUser, "ddtalk.users")
export class DDTalkUser extends ModelObject {

    constructor(target: Object) {
        super(target)
    }

    @Create()
    static create(obj ?: Object) : DDTalkUser { return null;}

    @Field({ type: Types.UUID})
    get id():string { return Values.UUIDV1()}
    set id(id: string) {}

    @Field({ type: Types.STRING(50)})
    get ddUserId() : string { return null};
    set ddUserId(userId: string) {}

    @Field({ type: Types.STRING(50)})
    get dingId(): string { return null}
    set dingId(dingId: string) {}

    @Field({type: Types.BOOLEAN})
    get isAdmin() { return false}
    set isAdmin(isAdmin: boolean) {}

    @Field({type: Types.TEXT})
    get avatar() : string { return null}
    set avatar(avatar: string) {}

    @Field({type: Types.STRING(50)})
    get name(): string { return null};
    set name(name: string) {}

    @Field({type: Types.STRING(50)})
    get corpid(): string { return null}
    set corpid(corpid: string) {}
}