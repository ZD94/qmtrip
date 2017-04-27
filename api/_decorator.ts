import { getSession } from '../common/model/index';
import { Staff, EStaffRole } from '_types/staff';
import { AgencyUser } from '_types/agency';
import {EAccountType} from "_types";
import Zone from '@jingli/zone-setup';
/**
 * Created by wlh on 16/5/16.
 */
const API = require("@jingli/dnode-api");
const _ = require("lodash");
import L from '@jingli/language';
const Models = require("_types").Models;

export function requirePermit(permits: string| string[], type?: number) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = async function (...args) {
            //let context = Zone.current.get('context');
            let session = getSession();
            let account = Models.account.get(session.accountId);
            if(!account)
                throw L.ERR.PERMISSION_DENY();

            await API.permit.checkPermission({accountId: session.accountId, permissions: permits, type: account.type});

            return fn.apply(this, args)
        }
        return desc;
    }
}

export interface CheckInterface {
    if: (fn: Function, self: any, args: any) => Promise<boolean>,
    then?: (target: Function, string: any, desc: any) => Promise<any>    //then函数直接是decorator函数
}

//筛选返回结果
export function filterResultColumn(columns: string[]) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = function(...args) {
            let self = this;
            return fn.apply(self, args)
                .then(function(result) {
                    for(let k in result) {
                        if (columns.indexOf(k) < 0) {
                            delete result[k];
                        }
                    }
                    return result;
                })
        }
        return desc;
    }
}

//追加函数参数
export function addFuncParams(params) {
    return function(target, key, desc) {
        let fn = desc.value;
        desc.value = function(...args) {
            let self = this;
            for(let key of params) {
                args[0][key] = params[key];
            }
            return fn.apply(self, args);
        }
        return desc;
    }
}

/**
 * 判断不为空
 * @param params
 * @constructor
 */
export function modelNotNull(modname: string, keyName?: string) {
    return function(target, key, desc) {
        let fn = desc.value;
        desc.value = async function(...args) {
            let self = this;
            keyName = keyName || 'id';
            let entity = await Models[modname].get(args[0][keyName]);

            if(!entity) {
                throw L.ERR.NOT_FOUND();
            }

            return fn.apply(self, args);
        }
        return desc;
    }
}

export function conditionDecorator(checkFnList: CheckInterface[]) {
    return function (target, key, desc) {
        let fn = desc.value;
        desc.value = async function(...args) {
            //在这里才能拿到参数
            let self = this;
            let thenFn;
            for(let checkFn of checkFnList) {
                let ret = await checkFn.if(fn, self, args);
                //如果返回true,执行then函数
                if (!!ret) {
                    thenFn = checkFn.then;
                    if (!thenFn) {
                        //如果then不存在,直接处理原函数
                        return fn.apply(self, args);
                    }

                    //判断完if后,将desc还原为原来的函数,否则将引起死循环
                    desc.value = fn;
                    //self作用于也要一并传过去
                    return thenFn(target, key, desc).value.apply(self, args)
                }
            }
            throw L.ERR.PERMISSION_DENY();
        }
        return desc;
    }
}

export var condition = {
    isMySelf: function (idpath: string) {
        return async function (fn, self, args) {
            let session = getSession();
            let id = _.get(args, idpath);
            return id && session.accountId && id == session.accountId;
        }
    },
    isMyCompany: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && staff.company && staff.company.id == id;
        }
    },
    isMyCompanyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && staff.company && staff.company["agencyId"] == id;
        }
    },
    isMyAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let agencyUser = await AgencyUser.getCurrent();
            return id && agencyUser && agencyUser.agency.id == id;
        }
    },
    isStaffsAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Models.staff.get(id);
            // let company = staff.company;
            if (staff && staff["companyId"]) {
                let company = await Models.company.get(staff["companyId"]);
                let agencyUser = await AgencyUser.getCurrent();
                return staff && company && agencyUser && agencyUser["agencyId"] == company["agencyId"];
            }
            return false;
        }
    },
    isSameCompany: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let other = await Models.staff.get(id);
            return id && staff && other && staff["companyId"] == other["companyId"];
        }
    },
    isSameAgency: function (idpath: string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let other = await Models.agencyUser.get(id);
            if(!other) {
                throw L.ERR.AGENCY_USER_NOT_EXIST();
            }
            return id && user && other && user["agencyId"] == other.agencyId;
        }
    },
    isTravelPolicyAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            if(id == 'dc6f4e50-a9f2-11e5-a9a3-9ff0188d1c1a'){
                return true;
            }else{
                let staff = await Staff.getCurrent();
                let tp = await Models.travelPolicy.get(id);
                return id && staff && tp && tp["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
            }
        }
    },
    isSupplierAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let sp = await Models.supplier.get(id);
            return id && staff && sp && sp["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
        }
    },
    isStaffSupplierInfoOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let sp = await Models.staffSupplierInfo.get(id);
            return id && staff && sp && sp["staffId"] == staff["id"];
        }
    },
    isAccordHotelAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let ah = await Models.accordHotel.get(id);
            return id && staff && ah && ah["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
        }
    },
    isSelfTravelPolicy: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && (staff["travelPolicyId"] == id || !staff["travelPolicyId"]);
        }
    },
    isTravelPolicyCompany: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let tp = await Models.travelPolicy.get(id);
            let staff = await Staff.getCurrent();
            return tp && staff && staff["companyId"] == tp["companyId"];
        }
    },
    isTravelPolicyAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let tp = await Models.travelPolicy.get(id);
            let company = await Models.company.get(tp["companyId"]);//此处为什么不能用tp.company
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isAccordHotelAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let ah = await Models.accordHotel.get(id);
            let company = await Models.company.get(ah["companyId"]);
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isDepartmentAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let dept = await Models.department.get(id);
            return id && staff && dept && dept["companyId"] == staff["companyId"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
        }
    },
    isDepartmentCompany: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let dept = await Models.department.get(id);
            return id && staff && dept && dept["companyId"] == staff["companyId"];
        }
    },
    isSelfDepartment: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return id && staff && (staff["departmentId"] == id || !staff["departmentId"]);
        }
    },
    isDepartmentAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let dept = await Models.department.get(id);
            let company = await Models.company.get(dept["companyId"]);
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isSelfLink: function (idpath:string) {
        return async function(fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let link = await Models.invitedLink.get(id);
            return link && staff && (link["staffId"] == staff.id);
        }
    },
    isCompanyAgency: function(idpath: string) {
        return async function (fn ,self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let company = await Models.company.get(id);
            return id && user && company && user["agencyId"] == company["agencyId"];
        }
    },
    isCompanyStaff: function(idpath: string) {
        return async function (fn ,self, args) {
            let companyId = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            return companyId && staff && staff["companyId"] == companyId;
        }
    },
    isCompanyAdminOrOwner: function(idpath: string) {
        return async function (fn ,self, args) {
            let companyId = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            if(companyId){
                let company = await Models.company.get(companyId);
                return companyId && staff && company && staff["companyId"] == company["id"] && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
            }else{
                return staff && staff.company && (staff["roleId"] == EStaffRole.ADMIN || staff["roleId"] == EStaffRole.OWNER);
            }
        }
    },
    isCompanyDepartment: function(idpath: string) {
        return async function (fn ,self, args) {
            let parentId = _.get(args, idpath);
            let department = await Models.department.get(parentId);
            let staff = await Staff.getCurrent();
            let company = staff.company;
            return staff && company && company.id == department.companyId;
        }
    },
    isMyTripPlan: function(idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let staff = await Staff.getCurrent();
            let tripPlan = await Models.tripPlan.get(id);
            return id && staff && tripPlan && staff.id == tripPlan.accountId;
        }
    },
    isAgencyTripPlan: function(idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let tripPlan = await Models.tripPlan.get(id);

            if(!user) {
                throw L.ERR.AGENCY_USER_NOT_EXIST();
            }

            if(!tripPlan) {
                throw L.ERR.TRIP_PLAN_NOT_EXIST();
            }

            let company = await tripPlan.getCompany();

            return id && user && tripPlan && user.agency.id == company['agencyId'];
        }
    },
    isAgencyTripDetail: function(idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let user = await AgencyUser.getCurrent();
            let tripDetail = await Models.tripDetail.get(id);

            if(!tripDetail) {
                throw L.ERR.TRIP_PLAN_NOT_EXIST();
            }

            let tripPlan = tripDetail.tripPlan;

            if(!user) {
                throw L.ERR.AGENCY_USER_NOT_EXIST();
            }

            let company = await tripPlan.getCompany();

            return id && user && tripPlan && user.agency.id == company['agencyId'];
        }
    },
    canGetTripPlan: function (idpath: string) {
        return async function (fn, self, args) {
            let id = _.get(args, idpath);
            let session = Zone.current.get('session');
            
            if(!session || !session.accountId) {
                throw L.ERR.PERMISSION_DENY();
            }
            
            let account = await Models.account.get(session.accountId);
            let tripPlan = await Models.tripPlan.get(id);
            let acc_type = account.type;
            
            if(acc_type == EAccountType.STAFF) {
                let staffs = await Models.staff.all({ where: {accountId: account.id}});
                let isHasPermit;
                for(let staff of staffs) {
                    isHasPermit =
                        staff.roleId == EStaffRole.ADMIN
                        || staff.roleId == EStaffRole.OWNER
                        || tripPlan.accountId == account.id
                        || tripPlan.auditUser == account.id;
                    if (isHasPermit) break;
                }
                return !!isHasPermit;
            }else if(acc_type == EAccountType.AGENCY) {
                let user = await AgencyUser.getCurrent();
                let company = await tripPlan.getCompany();
                let agency = await company.getAgency();
                if(!agency){
                    return true;
                }
                return agency.id == user.agency.id;
            }else {
                throw L.ERR.PERMISSION_DENY();
            }
        }
    },
    isSameAccount: function(idpath: string) {
        return async function (fn, self, args) {
            let session = Zone.current.get('session');
            if(!session || !session.accountId) {
                throw L.ERR.PERMISSION_DENY();
            }
            let accountId = session['accountId'];
            let id = _.get(args, idpath);
            return id == accountId;
        }
    }
}
