import { Department } from 'api/_types/department';
import {Staff, EStaffRoleNames, EStaffRole} from 'api/_types/staff/staff';
var msgbox = require('msgbox');

export async function IndexController($scope, $stateParams, Models, $ionicPopup, $state,$timeout, $location,ngModalDlg,$window) {
    require('./department.scss');
    if($stateParams.departName){
        console.info('comming in....',$stateParams.departName)
        //$ionicNavBarDelegate.title($stateParams.departName);//这个东西会改变属性为nav-bar='cached'的这个div里面的value，然而显示的是nav-bar='active'的这个标签。刷新后才可以正常显示，暂时未解决、、、
    }
    let departmentId = $stateParams.departmentId;
    let staff = await Staff.getCurrent();
    let company = staff.company;
    let rootDepartment : Department;
    let newUrl;
    // console.info('location????', $location.path());
    if($location.path() == '/department/index' ||$location.path() == '/department/'){
        newUrl = '#/department/index-instead';
    }else if($location.path() == '/department/index-instead'){
        newUrl = '#/department/index';
    }else{
        console.info('location????', $location.path());
        return false;
    }
    async function initDepartment(departId?){
        if(departId){
            rootDepartment = await Models.department.get(departId);
        }else{
            rootDepartment = await company.getRootDepartment();
        }
        //$ionicNavBarDelegate.title(rootDepartment.name);
        $scope.viewHeader = rootDepartment.name;

        let departments = await rootDepartment.getChildDeptStaffNum();
        let staffs = await rootDepartment.getStaffs();
        $scope.departments = departments;
        $scope.staffs = staffs;
    }
    initDepartment(departmentId);
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.EStaffRole = EStaffRole;
    $scope.addNewStaff = function(){
        window.location.href = '#/department/add-staff';
    }
    $scope.addDepartment = async function(){
        let result = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                company: company
            },
            template: require('./add-child-department.html'),
            controller: addChildDepartmentController
        })
        initDepartment();
    }
    $scope.setDepartment = async function () {
        let result = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                department: rootDepartment,
                company: company
            },
            template: require('./set-department.html'),
            controller: setDepartmentController
        })
        initDepartment();
    }
    $scope.goChildDept = async function(id){
        // $ionicNavBarDelegate.title(rootDepartment.name);
        let department = await Models.department.get(id);
        // let newUrl = '#/department/index?departmentId=' + id +'&departName=' + department.name;
        console.info(newUrl);
        window.location.href = newUrl + '?departmentId=' + id +'&departName=' + department.name;

        // initDepartment(id)
        //$location.url('#/department/index?departmentId=' + id +'&departName=' + department.name);
        // $state.go('ROOT.content',{__path:'department/index',departmentId:id,departName:department.name})
    }
    $scope.staffSelector = {
        query: async function(keyword) {
            // let staffs = await rootDepartment.getStaffs({where: {'name': {$ilike: '%'+keyword+'%'}}});
            // return staffs;
        },
        display: (staff)=>staff.name
    };
    async function setDepartmentController($scope,ngModalDlg){
        require('./set-dialog.scss');
        console.info($scope.department);
        $scope.chooseParent = async function () {
            let parentDepartment = await ngModalDlg.createDialog({
                parent: $scope,
                scope: {
                    company: $scope.company
                },
                template: require('./parent-department.html'),
                controller: parentDepartmentController
            })
            if(parentDepartment){
                $scope.department.parent = parentDepartment;
            }
        }
        $scope.deleteDepartment = function(){
            if($scope.department)
            $ionicPopup.show({
                title: '删除部门',
                template: '确定要删除吗？',
                scope: $scope,
                button:[
                    {
                        text: '取消',
                        type: 'button-stable'
                    },
                    {
                        text: '确认',
                        type: 'button-positive',
                        onTap: async function(){
                            $scope.department.destroy()
                        }
                    }
                ]
            })
        }
    }

    async function parentDepartmentController($scope){
        require('./parentdpt.scss');
        let rootDepartment = await $scope.company.getRootDepartment();
        let departments = await rootDepartment.getChildDeptStaffNum();
        $scope.rootDepartment = rootDepartment;
        console.info(rootDepartment);
        $scope.departments = await Promise.all(departments.map(async function(department) {
            let childDepartment = await department.getChildDeptStaffNum();
            if(childDepartment && childDepartment.length>0){
                department.hasChild = true;
            }else{
                department.hasChild = false;
            }
            return department;
        }));

        $scope.showChild = async function(department){
            $scope.rootDepartment = department;
            let childDepartments = await department.getChildDeptStaffNum();
            $scope.departments = await Promise.all(childDepartments.map(async function(department) {
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
            $scope.departments = await Promise.all(childDepartments.map(async function(department) {
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

    async function addChildDepartmentController($scope,ngModalDlg){
        require('./add-department.scss');
        $scope.department = Department.create();
        let staff = await Staff.getCurrent();
        let company = staff.company;
        $scope.chooseParent = async function () {
            let parentDepartment = await ngModalDlg.createDialog({
                parent: $scope,
                scope: {
                    company: company
                },
                template: require('./parent-department.html'),
                controller: parentDepartmentController
            })
            if(parentDepartment){
                $scope.department.parent = parentDepartment;
            }
        }
        $scope.createDepartment = async function(){
            $scope.department.company = company;
            if(!$scope.department.name){
                msgbox.log('请填写部门名称');
                return false;
            }
            if(!$scope.department.parent){
                msgbox.log('请选择父级部门');
                return false;
            }
            await $scope.department.save();
            $scope.confirmModal();
        }
    }
}