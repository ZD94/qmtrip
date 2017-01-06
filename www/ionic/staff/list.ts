import { Staff, EStaffRole, EStaffStatus } from 'api/_types/staff/staff';
import { ACCOUNT_STATUS } from 'api/_types/auth/account';
var msgbox = require('msgbox');

export default async function ListController($scope, Models, $ionicPopup) {
    require('./list.scss');
    var staff = await Staff.getCurrent();
    $scope.currentStaff = staff;
    $scope.staffs = [];
    var pager = await staff.company.getStaffs();
    await loadStaffs(pager);

    $scope.pager = pager;
    var vm = {
        isHasNextPage:true,
        nextPage : async function() {
            try {
                pager = await $scope.pager['nextPage']();
            } catch(err) {
                this.isHasNextPage = false;
                return;
            }
            $scope.pager = pager;
            await loadStaffs(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    $scope.vm = vm;

    async function loadStaffs(pager) {
        if(pager && pager.length>0){
            await Promise.all(pager.map(async function (staff) {
                staff.travelPolicy = await staff.getTravelPolicy();
                var obj = {staff: staff, role: ""};
                if (obj.staff.roleId == EStaffRole.OWNER) {
                    obj.role = '创建者';
                }
                $scope.staffs.push(obj);
            }));
        }

    }

    /*$scope.staffs = staffs.map(function (staff) {
     var obj = {staff: staff, role: ""};
     if (obj.staff.roleId == EStaffRole.OWNER) {
     obj.role = '创建者';
     }
     return obj;
     });*/

    $scope.option = {name: ''};
    $scope.search = async function () {

        var staffs = await Models.staff.find({where: {companyId: staff.company.id, name: {$like: '%'+ $scope.option.name +'%'}}});
        $scope.staffs = staffs.map(function (staff) {
            var obj = {staff: staff, role: ""};
            if (obj.staff.roleId == EStaffRole.OWNER) {
                obj.role = '创建者';
            }
            return obj;
        });
        await Promise.all($scope.staffs.map(async function (obj) {
            obj.travelPolicy = await obj.staff.getTravelPolicy();
            return obj;
        }));
    }

    $scope.delete = async function(id, index) {
        $ionicPopup.show({
            title: '确定删除该员工吗？',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            var delStaff = await Models.staff.get(id);
                            await delStaff.destroy();
                            $scope.staffs.splice(index, 1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        })
    }

    $scope.forbidden = async function(id, index) {
        $ionicPopup.show({
            title: '确定禁用该员工吗？',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            var forbidStaff = await Models.staff.get(id);
                            forbidStaff.status = ACCOUNT_STATUS.FORBIDDEN;
                            forbidStaff.staffStatus = EStaffStatus.FORBIDDEN;//同时修改account和staff两张表会有问题 只会修改一张表
                            await forbidStaff.save();
                            $scope.staffs.splice(index, 1);
                        }catch(err){
                            console.info(err);
                            msgbox.log(err.msg);

                        }
                    }
                }
            ]
        })
    }

    $scope.goInviteStaff = async function(){
        var company = staff.company;
        /*var staffNum = await company.getStaffNum();
        if(staffNum >= company.staffNumLimit){
            msgbox.log('企业员工数已达到员工数目上限，无法继续邀请员工');
            return false;
        }*/
        window.location.href = "#/company/staff-invited";
    }
}
