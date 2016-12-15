import { Staff } from 'api/_types/staff/staff';
import { TravelPolicy, EPlaneLevel, ETrainLevel, EHotelLevel } from 'api/_types/travelPolicy';
import { SubsidyTemplatesController } from './subsidy-templates';
var msgbox = require('msgbox');

export async function EditpolicyController($scope, Models, $stateParams, $ionicHistory, $ionicPopup, ngModalDlg) {
    require('./editpolicy.scss');
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
    $scope.savePolicy = async function () {
        if(!$scope.travelPolicy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        var re = /^[0-9]+.?[0-9]*$/;
        if($scope.travelPolicy.subsidy && !re.test($scope.travelPolicy.subsidy)){
            msgbox.log("补助必须为数字");
            return false;
        }
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
        $ionicHistory.goBack(-1);
    }

    let hotelLevels = [
        { title: '国际五星', value: 5, desc: '万丽 喜来登 希尔顿 皇冠假日 等'},
        { title: '高端商务', value: 4, desc: '福朋喜来登 诺富特 希尔顿逸林 假日酒店 等'},
        { title: '精品连锁', value: 3, desc: '如家精选 和颐酒店 全季酒店 桔子水晶 智选假日 ZMAX 等'},
        { title: '快捷连锁', value: 2, desc: '如家 莫泰 汉庭 IBIS 锦江之星 速8 等'},
    ];
    $scope.selectHotalLevel = {
        searchbox: false,
        query: () => [5, 4, 3, 2],
        display: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.title;
                }
            }
        },
        note: function(val){
            for(let level of hotelLevels){
                if(level.value === val){
                    return level.desc;
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
                            $ionicHistory.goBack(-1);
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
