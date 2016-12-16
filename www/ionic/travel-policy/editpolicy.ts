import { Staff } from 'api/_types/staff/staff';
import {TravelPolicy, EPlaneLevel, ETrainLevel, EHotelLevel, MPlaneLevel, MTrainLevel} from 'api/_types/travelPolicy';
import { SubsidyTemplatesController } from './subsidy-templates';
var msgbox = require('msgbox');

export async function EditpolicyController($scope, Models, $stateParams, $ionicHistory, $ionicPopup, ngModalDlg) {
    require('./editpolicy.scss');
    $scope.travelPolicy = {};
    $scope.planeLevels = [
        { name: MPlaneLevel[EPlaneLevel.ECONOMY],value: EPlaneLevel.ECONOMY},
        { name: MPlaneLevel[EPlaneLevel.FIRST],value: EPlaneLevel.FIRST},
        { name: MPlaneLevel[EPlaneLevel.BUSINESS],value: EPlaneLevel.BUSINESS},
        { name: MPlaneLevel[EPlaneLevel.PREMIUM_ECONOMY],value: EPlaneLevel.PREMIUM_ECONOMY}
    ];
    $scope.planeValue = [];
    $scope.trainLevels = [
        { name: MTrainLevel[ETrainLevel.BUSINESS_SEAT],value: ETrainLevel.BUSINESS_SEAT},
        { name: MTrainLevel[ETrainLevel.FIRST_SEAT],value: ETrainLevel.FIRST_SEAT},
        { name: MTrainLevel[ETrainLevel.SECOND_SEAT],value: ETrainLevel.SECOND_SEAT},
        { name: MTrainLevel[ETrainLevel.PRINCIPAL_SEAT],value: ETrainLevel.PRINCIPAL_SEAT},
        { name: MTrainLevel[ETrainLevel.SENIOR_SOFT_SLEEPER],value: ETrainLevel.SENIOR_SOFT_SLEEPER},
        { name: MTrainLevel[ETrainLevel.SOFT_SLEEPER],value: ETrainLevel.SOFT_SLEEPER},
        { name: MTrainLevel[ETrainLevel.HARD_SLEEPER],value: ETrainLevel.HARD_SLEEPER},
        { name: MTrainLevel[ETrainLevel.SOFT_SEAT],value: ETrainLevel.SOFT_SEAT},
        { name: MTrainLevel[ETrainLevel.HARD_SEAT],value: ETrainLevel.HARD_SEAT},
        { name: MTrainLevel[ETrainLevel.NO_SEAT],value: ETrainLevel.NO_SEAT}
    ]
    $scope.trainValue = [];
    let hotelLevels = $scope.hotelLevels = [
        { name: '国际五星', value: 5, desc1: '万丽、喜来登 ',desc2: '希尔顿、皇冠假日等'},
        { name: '高端商务', value: 4, desc1: '福朋喜来登、诺富特、希尔顿逸林',desc2: '豪生、、Holiday Inn、开元名都等'},
        { name: '精品连锁', value: 3, desc1: '如家精选、和颐酒店、全季酒店、',desc2: '桔子水晶、智选假日、ZMAX等'},
        { name: '快捷连锁', value: 2, desc1: '如家、莫泰168、汉庭',desc2: '速8、锦江之星、IBIS等'},
    ];
    $scope.hotelValue = [];
    $scope.abroadPlaneLevels = [
        { name: MPlaneLevel[EPlaneLevel.ECONOMY],value: EPlaneLevel.ECONOMY},
        { name: MPlaneLevel[EPlaneLevel.FIRST],value: EPlaneLevel.FIRST},
        { name: MPlaneLevel[EPlaneLevel.BUSINESS],value: EPlaneLevel.BUSINESS},
        { name: MPlaneLevel[EPlaneLevel.PREMIUM_ECONOMY],value: EPlaneLevel.PREMIUM_ECONOMY}
    ];
    $scope.abroadPlaneValue = [];
    $scope.abroadHotelLevels = [
        { name: '国际五星', value: 5, desc1: '万丽、喜来登 ',desc2: '希尔顿、皇冠假日等'},
        { name: '高端商务', value: 4, desc1: '福朋喜来登、诺富特、希尔顿逸林',desc2: '豪生、、Holiday Inn、开元名都等'},
        { name: '精品连锁', value: 3, desc1: 'Comfort Inn、和颐酒店、全季酒店、',desc2: '桔子水晶、智选假日、ZMAX等'},
        { name: '快捷连锁', value: 2, desc1: 'Green Hotel',desc2: 'Super8、IBIS等'},
    ];
    $scope.abroadHotelValue = [];
    var staff = await Staff.getCurrent();
    var travelPolicy;
    var subsidyTemplates;
    let policyId = $stateParams.policyId;
    let saveSubsidyTemplates = [];
    let removeSubsidyTemplates = [];
    $scope.subsidyTemplates = [];
    if ($stateParams.policyId) {
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
        $scope.subsidyTemplates = subsidyTemplates = await travelPolicy.getSubsidyTemplates();
    } else {
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = staff.company.id;
        travelPolicy.planeLevels = [EPlaneLevel.ECONOMY];
        travelPolicy.trainLevels = [ETrainLevel.SECOND_SEAT];
        travelPolicy.hotelLevels = [EHotelLevel.TWO_STAR];
    }
    $scope.travelPolicy = travelPolicy;
    console.info($scope.travelPolicy);
    $scope.savePolicy = async function () {
        if(!$scope.travelPolicy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        if($scope.travelPolicy.planeLevels.length <=0){
            msgbox.log('飞机舱位不能为空')
            return false;
        }
        if($scope.travelPolicy.trainLevels.length <=0){
            msgbox.log('火车座次不能为空')
            return false;
        }
        if($scope.travelPolicy.hotelLevels.length <=0){
            msgbox.log('住宿标准不能为空')
            return false;
        }
        var re = /^[0-9]+.?[0-9]*$/;
        if($scope.travelPolicy.subsidy && !re.test($scope.travelPolicy.subsidy)){
            msgbox.log("补助必须为数字");
            return false;
        }
        console.info($scope.travelPolicy.planeLevels)
        $scope.travelPolicy.company = staff.company;
        let travelPolicy = await $scope.travelPolicy.save();
        for(let v of saveSubsidyTemplates) {
            v.travelPolicy = travelPolicy;
            await v.save();
        }
        for(let v of removeSubsidyTemplates) {
            if (v && v.id) {
                await v.destroy();
            }
        }
        window.location.href= `#/travel-policy/showpolicy?policyId=${policyId}`
    }
    $scope.selectHotalLevel = {
        searchbox: false,
        query: () => [5, 4, 3, 2],
        display: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.name;
                }
            }
        },
        note: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.desc1;
                }
            }
        }
    }

    $scope.deletePolicy = async function () {
        $ionicPopup.show({
            title:'提示',
            template:'确定要删除该条差旅标准么?',
            scope: $scope,
            buttons:[
                {
                    text: '取消'
                },
                {
                    text: '确认删除',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            var result = await $scope.travelPolicy.getStaffs();
                            if(result && result.length > 0){//why后端delete方法throw出来的异常捕获不了
                                throw {code: -1, msg: '还有'+ result.length +'位员工在使用该标准'};
                            }
                            await $scope.travelPolicy.destroy();
                            window.location.href = '#/travel-policy/index'
                        }catch(err){
                            if(err.code == -1){
                                deleteFailed();
                            }
                        }
                    }
                }
            ]
        });

        function deleteFailed(){
            $ionicPopup.show({
                title:'删除失败',
                template:'还有员工在使用该标准，请先移除',
                scope: $scope,
                buttons:[
                    {
                        text: '确认',
                        type: 'button-positive',
                        onTap: async function () {
                        }
                    }
                ]
            });
        }
    }


    $scope.subsidyTemplateList = async function(){
        let obj = await ngModalDlg.createDialog({
            parent:$scope,
            scope: {subsidyTemplates,policyId},
            template: require('./subsidy-templates.html'),
            controller: SubsidyTemplatesController
        });
        saveSubsidyTemplates = obj.saveSubsidyTemplates;
        removeSubsidyTemplates = obj.removeSubsidyTemplates;
    }

}
