"use strict";
var Cookie = require('tiny-cookie');

export async function IndexController($scope,Menu,$ionicPopup, StaffService){
    require('./index.less');
    Menu.delall();
    var items =[
        {
            icon:'plane',
            title:'我要出差',
            link:'trip/create',
            badgenum: 0
        },
        {
            icon:'flag',
            title:'我的行程',
            link:'trip/list',
            badgenum: 15
        },
        {
            icon:'',
            title:'',
            link:'',
            badgenum: 0
        },
        {
            icon:'podium',
            title:'审批单',
            link:'trip-approval/pending',
            badgenum: 5
        },
        {
            icon:'paintbrush',
            title:'待我审批',
            link:'trip-approval/list',
            badgenum: 3
        }
    ];

    for( var i =0;i<items.length;i++){
        Menu.add(items[i]);
    }
    var staff = await StaffService.get(Cookie.get('user_id'));

    $scope.alertShow = function () {
        var show = $ionicPopup.alert({
            title: '差旅标准',
            template: staff.name +
            '<br>' +
            '住宿:三星级' +
            '<br>' +
            '补助:5000/天'
        })
    }

    $scope.Menu = Menu;
    $scope.staff = await StaffService.get(Cookie.get('user_id'));
    console.info(($scope.staff))
}
