"use strict";

export function IndexController($scope){
    var item ={
        icon:'plane',
        title:'我要出差',
        name:'name1'
    };
    var item2 ={
        icon:'flag',
        title:'我的行程',
        name:'name2'
    }
    Menu.add(item);
    Menu.add(item2);
    $scope.menus = Menu.menus;
}
