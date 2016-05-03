export class Staff {
    id: string;
    name: string; // '员工名称'
    avatar: string;  // '员工头像'
    companyId : string; // '企业ID'
    status: STAFF_STATUS; //状态
    totalPoints: number; // '员工总获取的积分'
    balancePoints: number; // '员工剩余积分'
    departmentId: string; // '部门ID'
    travelLevel: string;    // '差旅标准'
    roleId: STAFF_ROLE; // '权限'
    mobile: string; // '手机'
    email: string; // '邮箱'
    sex:number; // '性别'
    department: string; // '部门'
    createAt: Date; // '创建时间'
    quitTime: Date;
    operatorId: string; // '操作人id'
    
    constructor(obj: any){
        this.id = obj.id;
        this.name = obj.name;
        this.sex = obj.sex;
        this.avatar = obj.avatar;
        this.companyId = (!obj.companyId || obj.companyId=="")? null : obj.companyId;
        this.status = obj.status;
        this.totalPoints = obj.totalPoints;
        this.balancePoints = obj.balancePoints;
        this.departmentId = (!obj.departmentId || obj.departmentId=="")? null : obj.departmentId;
        this.department = obj.department;
        this.travelLevel = (!obj.travelLevel || obj.travelLevel=="")? null : obj.travelLevel;
        this.roleId = obj.roleId;
        this.email = obj.email;
        this.mobile = obj.mobile;
        this.createAt = obj.createAt;
        this.quitTime = obj.quitTime;
        this.operatorId = (!obj.operatorId || obj.operatorId=="")? null : obj.operatorId;
    }
}

export class Credentials{
    id: string;
    type: number;
    idNo: string;
    birthday: Date;
    validData: Date;
    ownerId: string;

    constructor(obj: any){
        this.id = obj.id;
        this.type = obj.type;
        this.idNo = obj.idNo;
        this.birthday = obj.birthday;
        this.validData = obj.validData;
        this.ownerId = obj.ownerId;
    }
}

export class PointChange{
    id: string;
    companyId: string;
    staffId: string;
    orderId: string;
    status: number;
    points: number;
    currentPoint: number;
    remark: string;
    createAt: Date;

    constructor(obj: any){
        this.id = obj.id;
        this.companyId = obj.companyId;
        this.staffId = obj.staffId;
        this.orderId = obj.orderId;
        this.status = obj.status;
        this.points = obj.points;
        this.currentPoint = obj.currentPoint;
        this.remark = obj.remark;
        this.createAt = obj.createAt;
    }
}

export enum STAFF_STATUS {
    ON_JOB = 0,
    QUIT_JOB = -1,
    DELETE = -2
}
export enum STAFF_ROLE {
    OWNER = 0,
    COMMON = 1,
    ADMIN = 2,
    FINANCE = 3
}