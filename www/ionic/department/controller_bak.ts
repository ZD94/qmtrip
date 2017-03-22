import { Department } from 'api/_types/department';
import { Staff } from 'api/_types/staff/staff';
var msgbox = require('msgbox');


export async function IndexController($scope, Models, $ionicPopup, $ionicListDelegate) {
    require('./department.scss');
    $scope.showDelete = false;
    var staff = await Staff.getCurrent();
    async function loadDepartment(){
        var getdepartment = await Models.department.find({where: {companyId: staff.company.id}});
        var departments = getdepartment.map(function (department) {
            var depart = {department: department, staffnum: 0};
            return depart;
        });
        await Promise.all(departments.map(async function (depart) {
            var result = await depart.department.getStaffs();
            depart.staffnum = result.length;
            return depart;
        }));
        return departments;
    }
    $scope.departments = await loadDepartment();
    var newdepartment = $scope.newdepartment = Department.create();
    newdepartment["company"] = staff.company;
    $scope.newdepart = function () {
        $scope.newdepartment = Department.create();
        $scope.newdepartment.company = staff.company;
        $ionicPopup.show({
            template: '<input type="text" ng-model="newdepartment.name">',
            title: '创建部门',
            scope: $scope,
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '保存',
                    type: 'button-positive',
                    onTap: async function (e) {
                        if (!$scope.newdepartment.name) {
                            e.preventDefault();
                            msgbox.log("部门名称不能为空");
                        } else {
                            try{
                                await $scope.newdepartment.save();
                                $scope.departments = await loadDepartment();
                            }catch(err){
                                msgbox.log(err.msg);
                            }
                            // $route.reload();
                        }
                    }
                }
            ]
        })
    }

    $scope.editDept = function (item) {
        $scope.newdepartment = item;
        $ionicPopup.show({
            template: '<input type="text" ng-model="newdepartment.name">',
            title: '修改部门',
            scope: $scope,
            buttons: [
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        if (!$scope.newdepartment.name) {
                            e.preventDefault();
                            msgbox.log("部门名称不能为空");
                        } else {
                            await $scope.newdepartment.save();
                            $scope.departments = await loadDepartment();
                            // $route.reload();
                        }
                    }
                }
            ]
        })
    }

    $scope.deleteDept = function (department, index) {
        $ionicPopup.show({
            title:'确定要删除部门吗?',
            scope: $scope,
            buttons:[
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            var dept = department.department;
                            if(department.staffnum > 0){//why后端delete方法throw出来的异常捕获不了
                                throw {code: -1, msg: '该部门下有'+ department.staffnum +'位员工，暂不能删除'};
                            }
                            await dept.destroy();
                            $scope.departments.splice(index, 1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        });
    }
}