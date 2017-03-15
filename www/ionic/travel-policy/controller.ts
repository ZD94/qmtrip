import { Staff } from 'api/_types/staff/staff';
import {
    MHotelLevel, MPlaneLevel, MTrainLevel, enumHotelLevelToStr, enumPlaneLevelToStr,
    enumTrainLevelToStr
} from 'api/_types/travelPolicy';

var msgbox = require('msgbox');

export * from './editpolicy';
export * from './showpolicy';

export async function IndexController($scope, Models, $location, $ionicPopup, $ionicHistory) {
    require('./index.scss');
    var staff = await Staff.getCurrent();
    var company = await staff.company;
    var pager = await company.getTravelPolicies();
    $scope.MHotelLevel = MHotelLevel;
    $scope.MPlaneLevel = MPlaneLevel;
    $scope.MTrainLevel = MTrainLevel;
    $scope.enumHotelLevelToStr = enumHotelLevelToStr;
    $scope.enumPlaneLevelToStr = enumPlaneLevelToStr;
    $scope.enumTrainLevelToStr = enumTrainLevelToStr;
    $scope.travelPolicies = [];
    async function loadTravelPolicies(pager) {
        /*let ps = pager.map(async function (policy) {
            var subsidyTemplates = await policy.getSubsidyTemplates();
            if(policy.isDefault){
                $scope.defaultTravelpolicy = policy;
            }
            var obj = {policy: policy, usernum: '',subsidy:subsidyTemplates};
            return obj;
        })
        $scope.travelPolicies = await Promise.all(ps);
        await Promise.all($scope.travelPolicies.map(async function (obj) {
            var result = await obj.policy.getStaffs();
            obj.usernum = result.length;
            return obj;
        }))*/
        pager.forEach(async function(policy){
            var subsidyTemplates = await policy.getSubsidyTemplates();
            if(policy.isDefault){
                $scope.defaultTravelpolicy = policy;
            }
            var num = await policy.getStaffs();
            var obj = {policy: policy, usernum: num.length,subsidy:subsidyTemplates};
            if($scope.travelPolicies.indexOf(obj) < 0 ){
                $scope.travelPolicies.push(obj);
            }
        });
    }
    await loadTravelPolicies(pager);
    $scope.vm = {
        isHasNextPage:pager.hasNextPage(),
        nextPage : async function() {
            if(!pager.hasNextPage()){
                $scope.vm.isHasNextPage = false;
                $scope.$broadcast('scroll.infiniteScrollComplete');
                return;
            }
            await pager.nextPage();
            $scope.vm.isHasNextPage = pager.hasNextPage();
            loadTravelPolicies(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    };

    $scope.editpolicy = async function (id) {
        $location.path('/travel-policy/showpolicy').search({'policyId': id}).replace();
    }

    $scope.setDefault = async function(){
        $scope.tripPolicy = {
            newDefaultTp:''
        }
        if($scope.defaultTravelpolicy)
            $scope.tripPolicy.newDefaultTp = $scope.defaultTravelpolicy;
        $ionicPopup.show({
            title:'设置默认标准',
            cssClass:'withCheck',
            template: require('./defaultPolicyTemplate.html'),
            scope: $scope,
            buttons:[
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            if(!$scope.defaultTravelpolicy){
                                $scope.tripPolicy.newDefaultTp.isDefault = true;
                                $scope.defaultTravelpolicy = await $scope.tripPolicy.newDefaultTp.save();
                            }else if($scope.defaultTravelpolicy && $scope.tripPolicy.newDefaultTp && $scope.defaultTravelpolicy.id != $scope.tripPolicy.newDefaultTp.id){
                                $scope.defaultTravelpolicy.isDefault = false;
                                await $scope.defaultTravelpolicy.save();
                                $scope.tripPolicy.newDefaultTp.isDefault = true;
                                $scope.defaultTravelpolicy = await $scope.tripPolicy.newDefaultTp.save();
                            }
                            msgbox.log("设置成功");
                        }catch(err){
                            msgbox.log(err.msg || err);
                        }
                    }
                }
            ]
        });
    }

    $scope.selectTp = function(tp){
        $scope.newDefaultTp = tp;

    }
}
