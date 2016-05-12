/**
 * Created by seven on 16/5/9.
 */
"use strict";

var Cookie = require('tiny-cookie');

export function ManagementController($scope){
    console.info("next ..");
}

export function BudgetController($scope){

}

export function RecordController($scope){

}

export function DistributionController($scope){

}

export function DepartmentController($scope){

}

export async function EditpolicyController($scope,Models){
    var staff = await Models.staff.get(Cookie.get('user_id'))
}

export async function StaffsController($scope,Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    console.info(company.getStaffs());
    // var company = await Models.company.get(staff.companyId);
    // console.info(company);
    console.info(staff);
}

export function StaffdetailController($scope){

}

export async function TravelpolicyController($scope , Models){
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var company = await staff.company;
    console.info(company.name);
    console.info(company);
    console.info(company.getStaffs());
}
