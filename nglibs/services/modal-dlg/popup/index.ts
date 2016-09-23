/**
 * Created by seven on 16/8/31.
 */
"use strict";
import {EApproveResult} from "api/_types/tripPlan";

export async function selectModeController ($scope){
    $scope.options.title = '同意出差';
    $scope.isNextApprove = false;
    $scope.chooseApprove = {
        approveUser: ''
    };
    $scope.chooseOption = function(isNextApprove) {
        $scope.isNextApprove = isNextApprove;
    };
    $scope.confirmApprove = async function () {
        var opt = {
            result: EApproveResult.PASS,
            isNextApprove: $scope.isNextApprove,
            agree: true
        }
        $scope.tripApprove.approveUser = $scope.chooseApprove.approveUser;
        $scope.confirmModal(opt);
    }
    $scope.cancel = async function() {
        var opt ={
            agree: false
        }
        $scope.confirmModal(opt);
    }
}