/**
 * Created by chen on 2017/2/13.
 */
import moment = require("moment");
import {AgencyUser} from "api/_types/agency/agency-user";

export async function ListController($scope, Models) {
    $scope.query = {
        userName: '',
        mobile: '',
        keyword: '',
        regDateStart: '',
        regDateEnd: '',
        days: '',
        perPage: 20,
    };
    $scope.page = 1;
    $scope.perPage = 20;

    $scope.getCompany = async function (page, perPage) {
        let agency = await AgencyUser.getCurrent();
        let query = $scope.query || {};
        query.page = page || 1;
        query.perPage = perPage || 20;
        let pager = await agency.findCompanies(query);
        pager.hasNextPage = function() {
            return pager.total >= page * perPage;
        }

        pager.hasPrevPage = function() {
            return page > 1;
        }

        let ps = pager.items.map(async (item) => {
            let company = await Models.company.get(item.id);
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
        $scope.companylist =await Promise.all(ps);
        $scope.pager = pager;
    }
    //进入页面自动调用
    await $scope.getCompany($scope.page, $scope.query.perPage);
    //查询
    $scope.doSearch = async function() {
        return $scope.getCompany();
    }

    $scope.nextPage = async function() {
        $scope.page += 1;
        return $scope.getCompany($scope.page, $scope.perPage);
    }

    $scope.prevPage = async function() {
        $scope.page -= 1;
        return $scope.getCompany($scope.page, $scope.perPage);
    }

}
