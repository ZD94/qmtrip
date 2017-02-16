/**
 * Created by chen on 2017/2/13.
 */
import moment = require("moment");
import {Pager} from "../../../common/model/pager";

export async function ListController($scope,Models){
    $scope.pager = null;
    //企业列表
    $scope.initCompanyList=async function(){
        let pager;
        if($scope.pager){
            pager = $scope.pager;
        }else{
            pager = await Models.company.find({where:{}});
        }
        let items = pager.map( async (company)=> {
            let staff = await Models.staff.get(company.createUser);
            //员工总人数
            let staffNum= await company.getStaffNum();
            company["staffNum"]=staffNum;
            company['createUserObj'] = staff;
            //剩余有效期天数
            if (!company.expiryDate) {
                company['remainDays'] = Infinity;
            } else {
                let days = moment(company.expiryDate).diff(new Date(), 'days');
                company['remainDays'] = days;
            }
            if(!company.coinAccount){
                company['balance']=0;
            }else{
                let balance = company.coinAccount.balance;
                company['balance'] = balance;
            }
            return company;
        });
        let companies = await Promise.all(items);
        $scope.companylist = companies;
        $scope.pager = pager;
    }
    $scope.nextPage = async function(){
        await $scope.initCompanyList();
        await $scope.pager.nextPage();

    }
    $scope.prevPage=async function(){
        await $scope.initCompanyList();
        await $scope.pager.prevPage();

    }
    $scope.initCompanyList();

}
