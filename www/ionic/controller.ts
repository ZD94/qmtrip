"use strict";
import { Staff } from 'api/_types/staff';
import async = Q.async;

export async function IndexController($scope, Menu, $ionicPopup, Models){
    require('./index.less');
    var items =[
        {
            id:1051,
            icon:'plane',
            title:'我要出差',
            link:'trip/create',
            badgeNum: 0,
            name: "tripPlan"
        },
        {
            id:1052,
            icon:'podium',
            title:'审批单',
            link:'trip-approval/pending',
            badgeNum: 0,
            name: "waitApprove"
        },
        {
            id:1053,
            icon:'flag',
            title:'我的行程',
            link:'trip/list',
            badgeNum: 0,
            name: "allTripPlans"
        },
        {
            id:1054,
            icon:'',
            title:'',
            link:'',
            badgeNum: 0
        },
        {
            id:1055,
            icon:'paintbrush',
            title:'出差请示',
            link:'trip-approval/list',
            badgeNum: 0,
            name: "needApprove"
        },
        {
            id:1056,
            icon:'levels',
            title:'企业管理',
            link:'company/management',
            badgeNum: 0,
            name: "companyManager"
        }
    ];

    for( var i =0;i<items.length;i++){
        Menu.add(items[i]);
    }
    var staff = await Staff.getCurrent();
    var policy = await staff.getTravelPolicy();
    $scope.alertShow = async function (staffId?: string) {
        if(staffId && staff.id != staffId) {
            staff = await Models.staff.get(staffId);
            policy = await staff.getTravelPolicy();
        }
        if(policy){   //判断是否设置差旅标准
            var show = $ionicPopup.alert({
                title: '差旅标准',
                template: '飞机:' +policy.planeLevel +
                '<br>' +
                '火车:' +policy.trainLevel +
                '<br>' +
                '住宿:'+policy.hotelLevel +
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
    
    let company = staff.company;
    $scope.Menu = Menu;
    $scope.staff = staff;
}
