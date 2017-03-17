/**
 * Created by seven on 2017/3/15.
 */
"use strict";
import _ = require('lodash');
import {setDepartment} from "./set-department";
var msgbox = require('msgbox');
export async function multipleMoveController($scope,ngModalDlg){
    require('./multiple-move.scss');
    $scope.selectDepartments = []; //用于存放已选择的部门
    $scope.addedArray = []; //用于存放提交时的部门id
    $scope.moveToDepartments = async function(){
        if($scope.moveStaffIds.length<=0){
            msgbox.log('请选择要移动的员工');
            return;
        }
        console.info($scope.moveStaffIds);
        let rootDepartment = await $scope.company.getRootDepartment();
        let childDepartments = await rootDepartment.getChildDeptStaffNum();
        let dptBeenChecked = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                rootDepartment:rootDepartment,
                childDepartments: childDepartments,
                addedDepartments: $scope.selectDepartments
            },
            template: require('./staff-set-department.html'),
            controller: setDepartment
        })
        $scope.selectDepartments = dptBeenChecked;
        if(dptBeenChecked){
            $scope.addedArray = [];
            dptBeenChecked.map(function(deparment){
                $scope.addedArray.push(deparment.id);
                $scope.addedArray.sort();
            })
            $scope.confirmModal({departmentIds:$scope.addedArray,staffIds:$scope.moveStaffIds});
        }
    }
    $scope.cancel = function(){
        $scope.confirmModal();
    }
}