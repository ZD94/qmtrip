import { Department } from 'api/_types/department';
import {Staff, EStaffRoleNames, EStaffRole} from 'api/_types/staff/staff';
import moment = require('moment');
var msgbox = require('msgbox');


export async function IndexController($scope, $stateParams, Models, $ionicPopup, $ionicNavBarDelegate,$timeout, $location,ngModalDlg,$window, sortDlg) {
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
    if(departmentId){
        if($location.path() == '/department/index' ||$location.path() == '/department/'){
            newUrl = `#/department/index-instead?departmentId=${departmentId}`;
        }else if($location.path() == '/department/index-instead'){
            newUrl = `#/department/index?departmentId=${departmentId}`;
        }else{
            console.info('location????', $location.path());
            return false;
        }
    }else{
        if($location.path() == '/department/index' ||$location.path() == '/department/'){
            newUrl = '#/department/index-instead';
        }else if($location.path() == '/department/index-instead'){
            newUrl = '#/department/index';
        }else{
            console.info('location????', $location.path());
            return false;
        }
    }
    async function initDepartment(departId?){
        if(departId){
            rootDepartment = await Models.department.get(departId);
        }else{
            rootDepartment = await company.getRootDepartment();
        }
        $timeout(function(){
            $ionicNavBarDelegate.title(rootDepartment.name);
        },100);

        $scope.viewHeader = rootDepartment.name;

        let departments = await rootDepartment.getChildDeptStaffNum();
        let staffs = await rootDepartment.getStaffs();
        initStaffs(staffs)
        $scope.departments = departments;
    }
    function initStaffs(staffs){
        $scope.staffs = staffs.map(function(staff){
            let hours = moment().diff(moment(staff.createdAt),'hours');
            console.info('status',staff.status);
            if(staff.status == 1 && hours < 24){
                staff['newStaff'] = true;
            }else if(!status || staff.status == 0){
                staff['newRegister'] = true;
            }else{
                staff['newStaff'] = false;
                staff['newRegister'] = false;
            }
            return staff;
        })
    }
    initDepartment(departmentId);
    $scope.EStaffRoleNames = EStaffRoleNames;
    $scope.EStaffRole = EStaffRole;
    $scope.arrlist = [
        {name:'最近加入',value:'',icon:'fa-sort-amount-desc'},
        {name:'姓名(A-Z)',value:'nameAsc',icon:'fa-sort-amount-asc'},
        {name:'姓名(Z-A)',value:'nameDesc',icon:'fa-sort-amount-desc'},
        {name:'角色',value:'role',icon:'fa-sort-amount-desc'},
        {name:'差旅标准',value:'travelPolicy',icon:'fa-sort-amount-desc'},
        {name:'激活状态',value:'status',icon:'fa-sort-amount-desc'},
        ]
    $scope.selected = {name:'最近加入',value:'',icon:'fa-sort-amount-desc'};
    $scope.sortBy = async function(selected){
        let staffs = await rootDepartment.getStaffs({where:{},order: selected});
        $scope.staffs = staffs.map(function(staff){
            let hours = moment().diff(moment(staff.createdAt),'hours');
            if(staff.status == 1 && hours < 24){
                staff['newStaff'] = true;
            }else if(staff.status == 0){
                staff['newRegister'] = true;
            }else{
                staff['newStaff'] = false;
                staff['newRegister'] = false;
            }
            return staff;
        })
    }
    $scope.searchKeyword = async function(keyword){
        let staffs = await rootDepartment.getStaffs({where: {name: {$ilike: `%${keyword}%`}}});
        initStaffs(staffs);
    }
    $scope.addNewStaff = function(){
        window.location.href = '#/department/add-staff';
    }
    $scope.addDepartment = async function(){
        let result = await ngModalDlg.createDialog({
            parent: $scope,
            scope:{
                company: company,
                parentDepartment: rootDepartment
            },
            template: require('./add-child-department.html'),
            controller: addChildDepartmentController
        })
        initDepartment(departmentId);
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
        initDepartment(departmentId);
    }
    $scope.goChildDept = async function(id){
        // $ionicNavBarDelegate.title(rootDepartment.name);
        let department = await Models.department.get(id);
        window.location.href = newUrl + '?departmentId=' + id +'&departName=' + department.name;

        // initDepartment(id)
        //$location.url('#/department/index?departmentId=' + id +'&departName=' + department.name);
        // $state.go('ROOT.content',{__path:'department/index',departmentId:id,departName:department.name})
    }
    $scope.showStaff = function(staffId){
        window.location.href = '#/department/staff-info?staffId=' + staffId;
    }
    $scope.staffSelector = {
        query: async function(keyword) {
            let staffs = await rootDepartment.getStaffs({where: {'name': {$ilike: '%'+keyword+'%'}}});
            return staffs;
        },
        display: (staff)=>staff.name
    };
    async function setDepartmentController($scope,ngModalDlg){
        require('./set-dialog.scss');
        $scope.chooseParent = async function () {
            console.info($scope.department);
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
        $scope.saveDepartment = async function(){
            let department = $scope.department;
            if(!department.name){
                msgbox.log('部门名称不能为空');
                return false;
            }
            let departmentName = await Models.department.find({where:{'name':department.name,'companyId':department.companyId}})
            if(departmentName.length>0){
                msgbox.log('部门名称已存在');
                return false;
            }
            try{
                await department.save();
            }catch(e){
                if(e.code == -150){
                    msgbox.log('不能设置该部门为上级部门');
                }else{
                    msgbox.log(e.msg);
                }
                return false;
            }
            $scope.confirmModal()
        }
        $scope.deleteDepartment = function(){
            if($scope.department){
                $ionicPopup.show({
                    title: '删除部门',
                    template: '确定要删除吗？',
                    scope: $scope,
                    buttons:[
                        {
                            text: '取消',
                            type: 'button-stable'
                        },
                        {
                            text: '确认',
                            type: 'button-positive',
                            onTap: async function(){
                                try{
                                    await $scope.department.destroy();
                                }catch(e){
                                    msgbox.log(e.msg);
                                }
                            }
                        }
                    ]
                })
            }
        }
    }

    async function parentDepartmentController($scope){
        require('./parentdpt.scss');
        let rootDepartment = await $scope.company.getRootDepartment();
        let departments = await rootDepartment.getChildDeptStaffNum();
        $scope.rootDepartment = rootDepartment;
        $scope.deleteIndex = null;
        $scope.departments = await Promise.all(departments.map(async function(department,idx) {
            let childDepartment = await department.getChildDeptStaffNum();
            if(childDepartment && childDepartment.length>0){
                department.hasChild = true;
            }else{
                department.hasChild = false;
            }
            if(department.id != $scope.department.id){
                return department;
            }else{
                $scope.deleteIndex = idx;
            }
        }));
        if($scope.deleteIndex != null){
            $scope.departments.splice($scope.deleteIndex,1);
        }
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
        $scope.department.parent = $scope.parentDepartment;
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
            try{
                await $scope.department.save();
            }catch(err){
                msgbox.log(err.msg || err);
            }
            $scope.confirmModal();
        }
    }
}