/**
 * Created by chen on 2017/2/13.
 */
import moment = require("moment");
import {AgencyUser} from "../../../api/_types/agency/agency-user";
import {Pager} from "../../../common/model/pager";

export async function ListController($scope, Models) {
    $scope.pager = null;
    //企业列表
    $scope.initCompanyList = async function () {
        let pager;
        if ($scope.pager) {
            pager = $scope.pager;
        } else {
            pager = await Models.company.find({where: {}});
        }
        let items = pager.map(async(company) => {
            let staff = await Models.staff.get(company.createUser);
            //员工总人数
            let staffNum = await company.getStaffNum();
            company["staffNum"] = staffNum;
            company['createUserObj'] = staff;
            //剩余有效期天数
            if (!company.expiryDate) {
                company['remainDays'] = Infinity;
            } else {
                let days = moment(company.expiryDate).diff(new Date(), 'days');
                company['remainDays'] = days;
            }
            if (!company.coinAccount) {
                company['balance'] = 0;
            } else {
                let balance = company.coinAccount.balance;
                company['balance'] = balance;
            }
            return company;
        });
        let companies = await Promise.all(items);
        $scope.companylist = companies;
        $scope.pager = pager;
    }
    $scope.initCompanyList();

    $scope.doSearch = async function () {
        //姓名
        let obj:any={};
        obj.name = $scope.userName;
        obj.mobile = $scope.mobile;
        obj.keyword = $scope.keyword;
        obj.regDateStart = $scope.regDateStart;
        obj.regDateEnd = $scope.regDateEnd;
        obj.expireDate = $scope.expireDate;
        let pager:any={};
        let agency=await AgencyUser.getCurrent();
        pager= await agency.findByConditions(obj);
        pager = Object.setPrototypeOf(pager, Pager.prototype);
        let items = pager.map(async(company) => {
            console.info(company.createUser);
            let staff = await Models.staff.get(company.createUser);
            // let staff = await Models.staff.find({where:{id:company.createUser}});
            let staffNum = await company.getStaffNum();
            company["staffNum"] = staffNum;
            company['createUserObj'] = staff;
            //剩余有效期天数
            if (!company.expiryDate) {
                company['remainDays'] = Infinity;
            } else {
                let days = moment(company.expiryDate).diff(new Date(), 'days');
                company['remainDays'] = days;
            }
            if (!company.coinAccount) {
                company['balance'] = 0;
            } else {
                let balance = company.coinAccount.balance;
                company['balance'] = balance;
            }
            return company;
        });
        let companies = await Promise.all(items);
        $scope.companylist = companies;
        $scope.pager = pager;

    }

    $scope.nextPage = async function () {
        await $scope.pager.nextPage();
        await $scope.initCompanyList();
    }
    $scope.prevPage = async function () {
        await $scope.pager.prevPage();
        await $scope.initCompanyList();
    }
}
