"use strict";
import {Staff, EStaffRole} from 'api/_types/staff';
import {
    MHotelLevel, MPlaneLevel, MTrainLevel, enumHotelLevelToStr, enumPlaneLevelToStr,
    enumTrainLevelToStr
} from "api/_types/travelPolicy";
import * as path from 'path';

var API = require('common/api');

var staffMenus = [
    {
        id: 1050,
        icon: 'person',
        title: '个人中心',
        link: 'staff/index',
        badgeNum: 0,
    },
    {
        id: 1051,
        icon: 'plane',
        title: '我要出差',
        link: 'trip/create',
        badgeNum: 0
    },
    {
        id: 1052,
        icon: 'podium',
        title: '审批单',
        link: 'trip-approval/pending',
        badgeNum: 0
    },
    {
        id: 1053,
        icon: 'flag',
        title: '我的行程',
        link: 'trip/list',
        badgeNum: 0
    },
    {
        id: 1055,
        icon: 'paintbrush',
        title: '出差请示',
        link: 'trip-approval/list',
        badgeNum: 0
    }
];

// var adminMenus = [
//     {
//         id: 1056,
//         icon: 'stats-bars',
//         title: '差旅统计',
//         link: 'statistics/',
//         badgeNum: 0
//     },
//     {
//         id: 1057,
//         icon: 'person-stalker',
//         title: '员工管理',
//         link: 'staff/list',
//         badgeNum: 0
//     },
//     {
//         id: 1058,
//         icon: 'ios-box',
//         title: '部门管理',
//         link: 'department/',
//         badgeNum: 0
//     },
//     {
//         id: 1059,
//         icon: 'android-list',
//         title: '差旅标准',
//         link: 'travel-policy/',
//         badgeNum: 0
//     },
//     {
//         id: 1060,
//         icon: 'pricetags',
//         title: '协议酒店',
//         link: 'accord-hotel/',
//         badgeNum: 0
//     },
//     {
//         id: 1061,
//         icon: 'ios-cart',
//         title: '预订服务商',
//         link: 'supplier/',
//         badgeNum: 0
//     },
// ];

var config = require('config');

export function getImageUrl(id){
    if(typeof id !== 'string' || typeof config.update !== 'string')
        return null;
    let base = new URL(config.update, location.href);
    let url = new URL(path.join('attachments', id), base.href);
    return url.href;
}

export async function IndexController($scope, Menu, $ionicPopup, Models, $storage, $window, $location, $ionicHistory, $ionicSideMenuDelegate) {
    require('./index.scss');
    $scope.ionicGoBack = function () {
        let viewHistory = $ionicHistory.viewHistory();
        let backView = viewHistory.backView;
        if (!backView) {
            $window.history.go(-1);
        } else if (backView.url) {
            //$location.replace();
            $location.url(backView.url);
        } else {
            backView.go();
        }
    }

    $scope.showErrorMsg = function (msg) {
        $ionicPopup.alert({
            title: '提示',
            template: msg
        });
    };

    $scope.isShowLogout = !/dingtalk/i.test(window.navigator.userAgent);
    $scope.logout = async function () {
        await API.onload();
        var browserspec = require('browserspec');
        if (browserspec.is_wechat) {
            await API.auth.destroyWechatOpenId({});
        }

        $storage.local.remove('auth_data');
        API.reload_all_modules();
        window.location.href = '#login/';
        window.location.reload();
    }

    $scope.Menu = Menu;
    $scope.tripPlanSave = 0;
    
    var staff = await Staff.getCurrent();
    // var noticePager = await staff.getSelfNotices();
    var noticePager = [];
    function setupMenu(menuItems){
        Menu.delall();
        for(let item of menuItems){
            Menu.add(item);
        }
    }
    function ifNewNotice(Pager){
        var num = 0;
        Pager.map(function(notice){
            if(!notice.isRead){
                $scope.Menu.notie = true;
            }else{
                num++;
                if(num == Pager.length){
                    $scope.Menu.notie = false;
                }
            }
        })
    }
    setupMenu(staffMenus);
    $scope.$watch(function() { return $ionicSideMenuDelegate.isOpen(); }, async function(isOpen) {
        if (isOpen) {//Menu Open
            noticePager = await staff.getSelfNotices();
            ifNewNotice(noticePager);
        }
        else {
            // Menu Closed
        }
    });
    // $scope.isAdminMenus = false;
    $scope.isAdmin = false;
    if (staff && (staff.roleId == EStaffRole.OWNER || staff.roleId == EStaffRole.ADMIN)) {
        $scope.isAdmin = true;
        // $scope.toggleAdminMenu = function(){
        //     $scope.isAdminMenus = !$scope.isAdminMenus;
        //     if($scope.isAdminMenus)
        //         setupMenu(adminMenus);
        //     else
        //         setupMenu(staffMenus);
    }
    // }

    $scope.showTravelPolicy = async function (staffId?: string) {
        let pStaff = await Staff.getCurrent();

        if(staffId)
            pStaff = await Models.staff.get(staffId);

        if (!pStaff)
            return;

        var policy = await pStaff.getTravelPolicy();
        $scope.policy = policy;
        $scope.subsidies = await policy.getSubsidyTemplates();
        $scope.MTrainLevel = MTrainLevel;
        $scope.MPlaneLevel = MPlaneLevel;
        $scope.MHotelLevel = MHotelLevel;
        $scope.enumHotelLevelToStr = enumHotelLevelToStr;
        $scope.enumPlaneLevelToStr = enumPlaneLevelToStr;
        $scope.enumTrainLevelToStr = enumTrainLevelToStr;
        if (policy) {   //判断是否设置差旅标准
            $ionicPopup.alert({
                title: '差旅标准',
                scope: $scope,
                cssClass:'policyPopup',
                template: require('./policyPopupTemplate.html')
            })
        } else {
            $ionicPopup.alert({   //定义show的原因是避免页面加载就执行
                title: '提示',
                template: '暂未设置差旅标准,请设置后查看'
            })
        }
    };
    
    $scope.currentStaff = staff;
    if (staff) {
        $scope.tripPlanSave = await staff.getTripPlanSave();
    }

    $scope.goMyCenter = function() {
        $location.path('/staff/staff-info');
    }

    await config.$ready;
    $scope.getImageUrl = getImageUrl;
}
