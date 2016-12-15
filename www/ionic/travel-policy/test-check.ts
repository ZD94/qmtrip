/**
 * Created by seven on 2016/12/12.
 */
"use strict";
import {EPlaneLevel} from "api/_types/travelPolicy";

export async function TestCheckController($scope){
    $scope.testmodel = [
        {
            name: '头等舱',
            value: EPlaneLevel.FIRST
        },
        {
            name: '经济舱',
            value: EPlaneLevel.ECONOMY
        },
        {
            name: '高端经济舱',
            value: 4
        }
    ];
    $scope.values = [];
}