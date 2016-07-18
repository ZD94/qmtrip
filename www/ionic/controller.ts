"use strict";
import {Staff, EStaffRole} from 'api/_types/staff';
import {MHotelLevel, MPlaneLevel, MTrainLevel} from "api/_types/travelPolicy";
var API = require('common/api');

export async function IndexController($scope, Menu, $ionicPopup, Models, $storage, $window, $location, $ionicHistory){
    require('./index.scss');
    $scope.ionicGoBack = function(){
        let viewHistory = $ionicHistory.viewHistory();
        let backView = viewHistory.backView;
        if(!backView){
            $window.history.go(-1);
        }else if(backView.url) {
            //$location.replace();
            $location.url(backView.url);
        } else {
            backView.go();
        }
    }
    var items =[
        {
            id:1051,
            icon:'plane',
            title:'我要出差',
            link:'trip/create',
            badgeNum: 0
        },
        {
            id:1052,
            icon:'podium',
            title:'审批单',
            link:'trip-approval/pending',
            badgeNum: 0
        },
        {
            id:1053,
            icon:'flag',
            title:'我的行程',
            link:'trip/list',
            badgeNum: 0
        },
        {
            id:1055,
            icon:'paintbrush',
            title:'出差请示',
            link:'trip-approval/list',
            badgeNum: 0
        }

    ];

    var staff = await Staff.getCurrent();
    if(staff && (staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN)){
        items.push({
                id:1056,
                icon:'stats-bars',
                title:'预算统计',
                link:'company/budget',
                badgeNum: 0
            },
            {
                id:1057,
                icon:'person-stalker',
                title:'员工管理',
                link:'company/staffs',
                badgeNum: 0
            },
            {
                id:1058,
                icon:'ios-box',
                title:'部门管理',
                link:'company/department',
                badgeNum: 0
            },
            {
                id:1059,
                icon:'android-list',
                title:'差旅标准',
                link:'company/travelpolicy',
                badgeNum: 0
            },
            {
                id:1060,
                icon:'',
                title:'',
                link:'',
                badgeNum: 0
            })
    }
    for( var i =0;i<items.length;i++){
        Menu.add(items[i]);
    }

    if(staff) {
        var policy = await staff.getTravelPolicy();
        $scope.showTravelPolicy = async function (staffId?: string) {
            if(staffId && staff.id != staffId) {
                staff = await Models.staff.get(staffId);
                policy = await staff.getTravelPolicy();
            }
            if(policy){   //判断是否设置差旅标准
                var show = $ionicPopup.alert({
                    title: '差旅标准',
                    template: '飞机:' +MPlaneLevel[policy.planeLevel] +
                    '<br>' +
                    '火车:' +MTrainLevel[policy.trainLevel] +
                    '<br>' +
                    '住宿:'+MHotelLevel[policy.hotelLevel] +
                    '<br>' +
                    '补助:'+policy.subsidy +'/天'
                })
            }else{
                var show = $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                    title:'提示',
                    template:'暂未设置差旅标准,请设置后查看'
                })
            }
        };
    }

    $scope.showErrorMsg = function (msg) {
        $ionicPopup.alert({
            title:'提示',
            template:msg
        });
    };

    $scope.Menu = Menu;
    $scope.currentStaff = staff;
    $scope.logout = async function(){
        var browserspec = require('browserspec');
        if(browserspec.is_wechat) {
            await API.auth.destroyWechatOpenId({});
        }
        await API.onload();
        $storage.local.remove('auth_data');
        API.reload_all_modules();
        window.location.href = '#login/';
        window.location.reload();
    }
}
