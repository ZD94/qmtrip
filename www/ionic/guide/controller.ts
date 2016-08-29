"use strict";
import {Staff, InvitedLink} from "api/_types/staff";
import {TravelPolicy} from "api/_types/travelPolicy";

const moment = require("moment");
var msgbox = require('msgbox');
var browserspec = require('browserspec');
declare var ionic;
declare var wx:any;

export async function CompanyGuideController ($scope){
    require("./company-guide.scss");
}

export async function CompanyFirstController ($scope, Models, $stateParams){
    require("./company-guide.scss");
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
        console.log(travelPolicy)
    }
    $scope.travelPolicy = travelPolicy;
    $scope.savePolicy = async function () {
        if(!$scope.travelPolicy.name){
            msgbox.log("标准名称不能为空");
            return false;
        }
        $scope.travelPolicy.company = staff.company;
        await $scope.travelPolicy.save();
        //add   shicong
        window.location.href = '#/guide/company-second';
    }
}

export async function CompanySecondController ($scope, Models, $ionicPopup,ClosePopupService,wxApi){
    require("./company-guide.scss");
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    var now = moment().format('YYYY-MM-DD HH:mm:ss');

    var invitedLinks = await Models.invitedLink.find({where: {staffId: staff.id, status: 1, expiresTime: {$gt: now}}});
    var seconds;
    var time;

    var invitedLink = InvitedLink.create();
    $scope.invitedLink = invitedLink;

    function transformSeconds(second){
        var seconds = parseInt(second);//秒
        var minutes = 0;//分
        var hours = 0;//小时
        var newsec,newmin,newhour;
        clearInterval(time);
        if(seconds>60){
            minutes = Math.floor(seconds/60);
            seconds = Math.floor(seconds%60);
            if(minutes>60){
                hours = Math.floor(minutes/60);
                minutes = Math.floor(minutes%60);
            }
        }
        time = setInterval(function(){
            if(seconds>0){
                seconds--;
            }else{
                seconds = 59;
                if(minutes>0){
                    minutes--;
                }else{
                    minutes = 59;
                    if(hours>0){
                        hours--;
                    }else{
                        $scope.invitedLink = null;
                        clearInterval(time);
                    }
                }
            }
            if(seconds<10){
                newsec = '0'+seconds;
            }else{
                newsec = seconds;
            }
            if(minutes<10){
                newmin = '0'+minutes;
            }else{
                newmin = minutes;
            }
            if(hours<10){
                newhour = '0'+hours;
            }else{
                newhour = hours;
            }
            $scope.countdown = newhour+':'+newmin+':'+newsec;
            $scope.$apply();
        },1000)
    }
    if(invitedLinks && invitedLinks.length > 0){
        $scope.invitedLink = invitedLinks[0];
        seconds = moment(invitedLinks[0]['expiresTime']).diff(moment(),'seconds');
        transformSeconds(seconds);
        $scope.encodeLink = encodeURIComponent($scope.invitedLink.goInvitedLink);
    }
    $scope.createLink = async function (){
        var invitedLink = InvitedLink.create();
        invitedLink = await invitedLink.save();
        seconds = moment(invitedLink['expiresTime']).diff(moment(),'seconds');
        transformSeconds(seconds);
        $scope.invitedLink = invitedLink;
        $scope.encodeLink = encodeURIComponent(invitedLink.goInvitedLink);
    }
    $scope.stopLink = function(invitedLink){
        invitedLink.status = 0;
        invitedLink.save();
        clearInterval(time);
        $scope.invitedLink = null;
    }
    function isAndroidBrowser() {
        var userAgent = window.navigator['userAgent'];
        //判断是否手机
        return /(android)/ig.test(userAgent);
    }
    function isIphoneBrowser() {
        var userAgent = window.navigator['userAgent'];
        //判断是否手机
        return /(iphone)|(ios)|(ipad)/ig.test(userAgent);
    }
    $scope.isAndroid = ionic.Platform.isAndroid();
    $scope.isIos =  ionic.Platform.isIOS();
    $scope.is_wechat = browserspec.is_wechat;
    $scope.sendWx = function(){
        if(browserspec.is_wechat){
            var show = $ionicPopup.show({
                template: '<p>请点击微信右上角菜单<br>将链接分享给好友</p>',
                cssClass: 'share_alert'
            })
            ClosePopupService.register(show);
            wx.onMenuShareAppMessage({
                title: staff.name +'邀请您注册鲸力商旅',
                desc:'加入'+staff.company.name+',共同开启智能商旅!',
                link: $scope.invitedLink.goInvitedLink,
                imgUrl:'http://t.jingli365.com/ionic/images/logo.png',
                type: '', // 分享类型,music、video或link，不填默认为link
                dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
                success: function () {
                    // 用户确认分享后执行的回调函数
                    show.close();
                },
                cancel: function () {
                    // 用户取消分享后执行的回调函数
                    show.close();
                }
            });
        }
    }
}

export async function CompanyGuideSuccessController ($scope){
    require("./company-guide.scss");
}