import { Staff } from 'api/_types/staff/staff';
import moment = require('moment');
import { InvitedLink } from 'api/_types/staff/invited-link';
var browserspec = require('browserspec');
var printf = require('printf');

declare var wx:any;
declare var ionic:any;
declare var Wechat:any;

export async function StaffInvitedController($scope, Models, $ionicHistory, $ionicPopup, ClosePopupService, wxApi){
    require('./staff-invited.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    var now = moment().format('YYYY-MM-DD HH:mm:ss');
    var invitedLinks = await Models.invitedLink.find({where: {staffId: staff.id, status: 1, expiresTime: {$gt: now}}});
    $scope.expireTimeout = 0;
    var timer;
    function transformSeconds(){
        clearInterval(timer);
        $scope.expireTimeout = moment($scope.invitedLink['expiresTime']).diff(moment(),'seconds');
        timer = setInterval(function(){
            $scope.expireTimeout = moment($scope.invitedLink['expiresTime']).diff(moment(),'seconds');
            $scope.$apply();
        },500)
    }
    $scope.countdown = function(secend){
        var sec = Math.floor(secend)%60;
        var min = Math.floor(secend/60)%60;
        var hour = Math.floor(secend/3600);
        return printf('%d:%02d:%02d', hour, min, sec);
    }
    if(invitedLinks && invitedLinks.length > 0){
        $scope.invitedLink = invitedLinks[0];
        $scope.encodeLink = encodeURIComponent($scope.invitedLink.goInvitedLink);
        transformSeconds();
        // wx.onMenuShareAppMessage({
        //     title:'邀请加入企业',
        //     desc:'公司邀请你加入',
        //     link:$scope.invitedLink,
        //     imgUrl:'https://t.jingli365.com/ionic/images/logo.png',
        //     success: function () {
        //         // 用户确认分享后执行的回调函数
        //     },
        //     cancel: function () {
        //         // 用户取消分享后执行的回调函数
        //     }
        // })
    }
    $scope.createLink = async function (){
        var invitedLink = InvitedLink.create();
        invitedLink = await invitedLink.save();
        $scope.invitedLink = invitedLink;
        $scope.encodeLink = encodeURIComponent(invitedLink.goInvitedLink);
        transformSeconds();
    }
    $scope.stopLink = function(invitedLink){
        invitedLink.status = 0;
        invitedLink.save();
        $scope.invitedLink = null;
        clearInterval(timer);
    }
    $scope.copyLink = async function(){
        var link:any = document.getElementById('link');
        link.select();
        document.execCommand('Copy');
    }
    $scope.isAndroid = ionic.Platform.isAndroid();
    $scope.isIos =  ionic.Platform.isIOS();
    $scope.is_wechat = browserspec.is_wechat;
    $scope.sendWx = async function(){
        if(browserspec.is_wechat){
            var show = $ionicPopup.show({
                template: '<p>请点击微信右上角菜单<br>将链接分享给好友</p>',
                cssClass: 'share_alert'
            })
            ClosePopupService.register(show);
            var WxConfig={
                title: staff.name +'邀请您注册鲸力商旅',
                desc:'加入'+staff.company.name+',共同开启智能商旅!',
                link: $scope.invitedLink.goInvitedLink,
                imgUrl: 'https://j.jingli365.com/ionic/images/logo.png',
                type: '', // 分享类型,music、video或link，不填默认为link
                dataUrl: '', // 如果type是music或video，则要提供数据链接，默认为空
            };
            console.info('wechat',$scope.invitedLink.goInvitedLink);
            wxApi.setupSharePrivate(WxConfig);
            $scope.$on('WechatShareSuccessed', function(event, type){
                // 用户确认分享后执行的回调函数
                show.close();
                if(type == 'App'){
                    
                }
            })
            $scope.$on('WechatShareCanceled', function(event, type){
                // 用户取消分享后执行的回调函数
                show.close();
            })
            let openConfig = _.clone(WxConfig);
            openConfig.link = 'https://jingli365.com';
            wxApi.setupSharePublic(openConfig);
        }else if(window.cordova){
            let installed = await wxApi.isInstalled();
            if(installed){
                var wxConfig = {
                    title: staff.name+'邀请您注册鲸力商旅',
                    desc: '加入'+staff.company.name+',共同开启智能商旅!',
                    imgUrl: 'https://j.jingli365.com/ionic/images/logo.png',
                    mediaTagName: "TEST-TAG-001",
                    messageExt: "这是第三方带的测试字段",
                    messageAction: "<action>dotalist</action>",
                    link: $scope.invitedLink.goInvitedLink
                }
                await wxApi.setupSharePrivate(wxConfig)
            }
        }
    }
}
