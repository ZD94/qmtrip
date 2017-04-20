/**
 * Created by seven on 2017/1/11.
 */
"use strict";
import angular = require('angular');
import {EStaffRole, EStaffRoleNames} from "_types/staff/staff";
import * as path from 'path';

angular
    .module('nglibs')
    .directive('staffAvatar',function(){
        return {
            restrict: 'AE',
            template: require('./avatar.html'),
            replace: true,
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
                var config = require('@jingli/config');

                $scope.getImageUrl = function getImageUrl(id){
                    if(typeof id !== 'string' || typeof config.update !== 'string')
                        return null;
                    let base = new URL(config.update, location.href);
                    let url = new URL(path.join('attachments', id), base.href);
                    return url.href;
                }
            }
        }
    })