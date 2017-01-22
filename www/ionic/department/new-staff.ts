/**
 * Created by seven on 2017/1/21.
 */
"use strict";
import {Staff, EStaffRoleNames} from "api/_types/staff/staff";
import {EGender} from "api/_types/index";

export async function NewStaffController($scope,$ionicActionSheet,ngModalDlg){
    require('./new-staff.scss');
    let current = await Staff.getCurrent();
    let company = current.company;
    $scope.travelpolicylist = await company.getTravelPolicies();
    let department = await company.getDefaultDepartment();
    let staff = Staff.create();
    staff.company = company;
    staff.sex = 0;
    $scope.staff = staff;
    $scope.addedArray = [] //用于存放已选择的部门
    if($scope.travelpolicylist && $scope.travelpolicylist.length>0){
        staff.setTravelPolicy($scope.travelpolicylist[0]);
    }
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.sexes = [
        {name:'男',value:EGender.MALE},
        {name:'女',value:EGender.FEMALE}
    ]
    let roles = EStaffRoleNames.map(function(rolename){
        return {text:rolename,role:EStaffRoleNames.indexOf(rolename)}
    })
    $scope.chooseRole =function(){
        let hideSheet = $ionicActionSheet.show({
            buttons:roles,
            titleText: '请选择角色',
            cancelText: '取消',
            cancel: function() {
                // add cancel code..
                return true;
            },
            buttonClicked: function(index) {
                $scope.staff.role = index;
                return true;
            }
        })
    }
    $scope.setDepartment = async function(){
        let rootDepartment = await company.getRootDepartment();
        let childDepartments = await rootDepartment.getChildDeptStaffNum();
        let dptBeenChecked = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                rootDepartment:rootDepartment,
                childDepartments: childDepartments,
                addedDepartments: $scope.addedArray
            },
            template: require('./staff-set-department.html'),
            controller: setDepartment
        })
        $scope.addedArray = dptBeenChecked;
    }
    function setDepartment($scope){
        require('./staff-set-department.scss');
        $scope.addToDepartments = function(department){
            let idx = $scope.addedDepartments.indexOf(department);
            if(idx >= 0){
                $scope.addedDepartments.splice(idx,1)
            }else{
                $scope.addedDepartments.push(department);
                $scope.addedDepartments.sort();
            }
            console.info($scope.addedDepartments);
        }
    }
}