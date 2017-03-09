/**
 * Created by chen on 2017/2/13.
 */
import moment = require("moment");
import {AgencyUser} from "_types/agency/agency-user";
import {ECompanyType} from "_types/company/company";

export async function ListController($scope , Models) {
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
                let d = moment();
                let days = moment(company.expiryDate).diff(d, 'days');
                company['remainDays'] = days;
            }
            if (!company.coinAccount) {
                company['balance'] = 0;
            } else {
                let balance = company.coinAccount.balance;
                //行程点数剩余
                // let balance = company.tripPlanNumBalance;

                company['balance'] = balance;
            }
            //是否为试用企业
            if(company.type == ECompanyType.TRYING){
                company["trying"] = '试用';
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
        $scope.fromIdx = $scope.page * $scope.perPage ;
        $scope.page += 1;
        return $scope.getCompany($scope.page, $scope.perPage);
    }

    $scope.prevPage = async function() {
        $scope.page -= 1;
        $scope.fromIdx = ( $scope.page - 1 ) * $scope.perPage ;
        return $scope.getCompany($scope.page, $scope.perPage);
    }

}
