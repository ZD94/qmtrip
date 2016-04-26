"use strict";

export function IndexController($scope,Menu){
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
            title:''
        },
        {
            icon:'podium',
            title:'审批单',
            link:'trip-approval/list',
            badgenum: 5
        },
        {
            icon:'paintbrush',
            title:'待我审批',
            link:'trip-approval/pending',
            badgenum: 3
        }
    ];
    for( var i =0;i<items.length;i++){
        Menu.add(items[i]);
    }
    console.info(Menu);
    $scope.menus = Menu.menus;
}
