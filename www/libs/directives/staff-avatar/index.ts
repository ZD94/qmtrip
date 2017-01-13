/**
 * Created by seven on 2017/1/11.
 */
"use strict";
import angular = require('angular');
import {EStaffRole, EStaffRoleNames} from "api/_types/staff/staff";

angular
    .module('nglibs')
    .directive('staffAvatar',function(){
        return {
            restrict: 'AE',
            template: require('./avatar.html'),
            scope: {
                staff: '=staff',
                textClass: '@textClass',
                imgClass: '@imgClass',
                showRole: '=showRole'
            },
            controller: async function($scope, Models){
                require('./avatar.scss');
                $scope.EStaffRole = EStaffRole;
                $scope.EStaffRoleNames = EStaffRoleNames;
            }
        }
    })