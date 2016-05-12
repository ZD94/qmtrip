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
    var staff = await Models.staff.get(Cookie.get('user_id'));
    var policy = await staff.getTravelPolicy();
    $scope.alertShow = function () {
        var show = $ionicPopup.alert({
            title: '差旅标准',
            template: '飞机:' +policy.planeLevel +
            '<br>' +
            '火车:' +policy.trainLevel +
            '<br>' +
            '住宿:'+policy.hotelLevel +
            '<br>' +
            '补助:5000/天'
        })
    }
    console.info(staff);
    console.info(policy);

    let company = staff.company;
    console.info(company);
    let agency = await company.getAgency();
    console.info(agency);
    // let staffs = await company.getStaffs();
    // console.info(staffs);
    $scope.Menu = Menu;
    $scope.staff = staff;
}
