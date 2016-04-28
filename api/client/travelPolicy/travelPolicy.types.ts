var API = require("common/api");
export class TravelPolicy {
    id: string;
    name: string;
    planeLevel: string;
    planeDiscount: number;
    trainLevel: string;
    hotelLevel: string;
    hotelPrice: number;
    companyId: string;
    isChangeLevel: boolean;
    createAt: Date;

    constructor(obj: any) {
        this.id = obj.id;
        this.name = obj.name;
        this.planeLevel = obj.planeLevel;
        this.planeDiscount = obj.planeDiscount;
        this.trainLevel = obj.trainLevel;
        this.hotelLevel = obj.hotelLevel;
        this.hotelPrice = obj.hotelPrice;
        this.companyId = obj.companyId;
        this.isChangeLevel = obj.isChangeLevel;
        this.createAt = obj.createAt;
    }
    /*getCompanyId() {
        return API.company.getCompany({companyId: this.companyId});
    }*/

    /*getStaffs() {
        return API.staff.getStaffsByTp({travelPolicyId: this.id});
    }*/
}
