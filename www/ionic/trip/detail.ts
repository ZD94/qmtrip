import moment = require('moment');
import { Staff } from '_types/staff/staff';
import { ETripType, EAuditStatus, EPlanStatus } from '_types/tripPlan';

export default async function DetailController($scope, Models, $stateParams, $ionicPopup, $ionicLoading){
    require('../trip-approval/trip-approval.scss');
    let tripId = $stateParams.tripid;
    let tripPlan = await Models.tripPlan.get(tripId);

    $scope.tripPlan = tripPlan;
    let staff = tripPlan.account; //await Models.staff.get(tripPlan.accountId);
    $scope.staff = staff;

    //判断有无审批权限
    let isHasPermissionApprove = false;
    let curStaff = await Staff.getCurrent();
    if(curStaff.id == tripPlan.auditUser) { isHasPermissionApprove = true;}
    $scope.isHasPermissionApprove = isHasPermissionApprove;

    let tripDetails = await tripPlan.getTripDetails();
    let traffic = [], hotel = [], subsidys = [], specialApproves = [];
    let trafficBudget = 0, hotelBudget = 0, subsidyBudget = 0, specialApproveBudget = 0;
    let subsidyDays:number = moment(tripPlan.backAt).diff(moment(tripPlan.startAt), 'days');
    let totalBudget: number = 0;
    totalBudget = tripPlan.budget as number;
    tripDetails.forEach(function(detail) {
        switch (detail.type) {
            case ETripType.OUT_TRIP:
                traffic.push(detail);
                trafficBudget += detail.budget;
                break;
            case ETripType.BACK_TRIP:
                traffic.push(detail);
                trafficBudget += detail.budget;
                break;
            case ETripType.HOTEL:
                hotel.push(detail);
                hotelBudget += detail.budget;
                break;
            case ETripType.SPECIAL_APPROVE:
                specialApproves.push(detail);
                specialApproveBudget += detail.budget;
                break;
            default:
                subsidys.push(detail);
                subsidyBudget += detail.budget; break;
        }
    })

    $scope.totalBudget = totalBudget;
    $scope.traffic = traffic;
    $scope.hotel = hotel;
    $scope.subsidys = subsidys;
    $scope.specialApproves = specialApproves;
    $scope.trafficBudget = trafficBudget;
    $scope.hotelBudget = hotelBudget;
    $scope.subsidyBudget = subsidyBudget;
    $scope.specialApproveBudget = specialApproveBudget;
    $scope.subsidyDays = subsidyDays;
    $scope.approveResult = EAuditStatus;
    $scope.EPlanStatus = EPlanStatus;

}
