/**
 * Created by seven on 2017/1/19.
 */
"use strict";
import _ = require('lodash');

export async function setDepartment($scope){
    require('./staff-set-department.scss');
    $scope.oldDepartments = _.clone($scope.addedDepartments)
    // $scope.oldDepartments = oldDepartments;
    $scope.selected = function(department){
        $scope.hasSelect = false;
        $scope.addedDepartments.map(function(added,index){
            if(added.id == department.id){
                $scope.hasSelect = true;
            }
        })
        return $scope.hasSelect;
    }
    $scope.childDepartments = await Promise.all($scope.childDepartments.map(async function(department) {
        let childDepartment = await department.getChildDeptStaffNum();
        if(childDepartment && childDepartment.length>0){
            department.hasChild = true;
        }else{
            department.hasChild = false;
        }
        return department;
    }));
    $scope.addToDepartments = function(department){
        // let idx = $scope.addedDepartments.indexOf(department);  //数组元素为obj，indexof只能用于str
        $scope.idx = -1;
        $scope.addedDepartments.map(function(added,index){
            if(added.id == department.id){
                $scope.idx = index;
            }
        })
        if($scope.idx >= 0){
            $scope.addedDepartments.splice($scope.idx,1)
        }else{
            $scope.addedDepartments.push(department);
            $scope.addedDepartments.sort();
        }
    }
    $scope.showChild = async function(department){
        $scope.rootDepartment = department;
        let childDepartments = await department.getChildDeptStaffNum();
        $scope.childDepartments = await Promise.all(childDepartments.map(async function(department) {
            let childDepartment = await department.getChildDeptStaffNum();
            if(childDepartment && childDepartment.length>0){
                department.hasChild = true;
            }else{
                department.hasChild = false;
            }
            return department;
        }));
    }
    $scope.backParent = async function(parentDdepartment){
        let childDepartments = await parentDdepartment.getChildDeptStaffNum();
        $scope.childDepartments = await Promise.all(childDepartments.map(async function(department) {
            let childDepartment = await department.getChildDeptStaffNum();
            if(childDepartment && childDepartment.length>0){
                department.hasChild = true;
            }else{
                department.hasChild = false;
            }
            return department;
        }));
        $scope.rootDepartment = parentDdepartment;
    }
    $scope.confirm = function(department){
        $scope.confirmModal(department);
    }
}