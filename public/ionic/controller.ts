"use strict";
var Cookie = require('tiny-cookie');

export async function IndexController($scope,Menu,$ionicPopup, Models){
    require('./index.less');
    var items =[
        {
            id:1051,
            icon:'plane',
            title:'我要出差',
            link:'trip/create',
            badgenum: 0
        },
        {
            id:1052,
            icon:'podium',
            title:'审批单',
            link:'trip-approval/pending',
            badgenum: 5
        },
        {
            id:1053,
            icon:'flag',
            title:'我的行程',
            link:'trip/list',
            badgenum: 15
        },
        {
            id:1054,
            icon:'',
            title:'',
            link:'',
            badgenum: 0
        },
        {
            id:1055,
            icon:'paintbrush',
            title:'待我审批',
            link:'trip-approval/list',
            badgenum: 3
        },
        {
            id:1056,
            icon:'levels',
            title:'企业管理',
            link:'company/management',
            badgenum: 3
        }
    ];

    for( var i =0;i<items.length;i++){
        Menu.add(items[i]);
    }
    console.info(Models);
    var staff = await Models.staff.get(Cookie.get('user_id'));
    console.info(staff);
    staff = staff.target;
    console.info(staff);
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
    $scope.staff = staff;
    console.info(($scope.staff))
}
