import { Staff } from 'api/_types/staff/staff';
import {TravelPolicy, MPlaneLevel, MTrainLevel, EPlaneLevel, ETrainLevel, EHotelLevel} from 'api/_types/travelPolicy';
var msgbox = require('msgbox');

export async function CompanyFirstController ($scope, Models, $stateParams){
    require("./company-guide.scss");
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
        { name: '国际五星', value: EHotelLevel.FIVE_STAR, desc1: '万丽、喜来登 ',desc2: '希尔顿、皇冠假日等'},
        { name: '高端商务', value: EHotelLevel.FOUR_STAR, desc1: '福朋喜来登、诺富特、希尔顿逸林',desc2: '豪生、Holiday Inn、开元名都等'},
        { name: '精品连锁', value: EHotelLevel.THREE_STAR, desc1: '如家精选、和颐酒店、全季酒店、',desc2: '桔子水晶、智选假日、ZMAX等'},
        { name: '快捷连锁', value: EHotelLevel.TWO_STAR, desc1: '如家、莫泰168、汉庭',desc2: '速8、锦江之星、IBIS等'},
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
        { name: '国际五星', value: EHotelLevel.FIVE_STAR, desc1: '万丽、喜来登 ',desc2: '希尔顿、皇冠假日等'},
        { name: '高端商务', value: EHotelLevel.FOUR_STAR, desc1: '福朋喜来登、诺富特、希尔顿逸林',desc2: '豪生、Holiday Inn、开元名都等'},
        { name: '精品连锁', value: EHotelLevel.THREE_STAR, desc1: 'Comfort Inn、和颐酒店、全季酒店、',desc2: '桔子水晶、智选假日、ZMAX等'},
        { name: '快捷连锁', value: EHotelLevel.TWO_STAR, desc1: 'Green Hotel',desc2: 'Super8、IBIS等'},
    ];
    $scope.abroadHotelValue = [];
    var staff = await Staff.getCurrent();
    var travelPolicy;
    if ($stateParams.policyId) {
        travelPolicy = await Models.travelPolicy.get($stateParams.policyId);
    } else {
        travelPolicy = TravelPolicy.create();
        travelPolicy.companyId = staff.company.id;
        travelPolicy.planeLevel = 2;
        travelPolicy.trainLevel = 3;
        travelPolicy.hotelLevel = 2;
    }
    $scope.travelPolicy = travelPolicy;

    $scope.savePolicy = async function () {
        let policy = $scope.travelPolicy;
        if(!policy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        if(!policy.planeLevels || policy.planeLevels.length <=0){
            msgbox.log('飞机舱位不能为空');
            return false;
        }
        if(!policy.trainLevels || policy.trainLevels.length <=0){
            msgbox.log('火车座次不能为空');
            return false;
        }
        if(!policy.hotelLevels || policy.hotelLevels.length <=0){
            msgbox.log('住宿标准不能为空');
            return false;
        }
        if(policy.isOpenAbroad){
            if(!policy.abroadPlaneLevels || policy.abroadPlaneLevels.length <= 0){
                msgbox.log('国际飞机舱位不能为空');
                return false;
            }
            if(!policy.abroadHotelLevels || policy.abroadHotelLevels.length <= 0){
                msgbox.log('国际住宿标准不能为空');
                return false;
            }
        }
        $scope.travelPolicy.company = staff.company;
        $scope.travelPolicy.isDefault = true;
        await $scope.travelPolicy.save();
        staff['travelPolicyId'] = $scope.travelPolicy.id;
        await staff.save();
        window.location.href = '#/guide/company-second';
    }

}
