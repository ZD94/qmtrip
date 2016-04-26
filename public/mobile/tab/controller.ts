"use strict";


export function IndexController($scope){
}

export function TabDashController($scope){
}

export function TabChatsController($scope){

    $scope.chats = [{
        id: 0,
        name: 'Ben Sparrow',
        lastText: 'You on your way?',
        face: 'mobile/images/logo.png'
    }, {
        id: 1,
        name: 'Max Lynx',
        lastText: 'Hey, it\'s me',
        face: 'mobile/images/logo.png'
    }, {
        id: 2,
        name: 'Adam Bradleyson',
        lastText: 'I should buy a boat',
        face: 'mobile/images/logo.png'
    }, {
        id: 3,
        name: 'Perry Governor',
        lastText: 'Look at my mukluks!',
        face: 'mobile/images/logo.png'
    }, {
        id: 4,
        name: 'Mike Harrington',
        lastText: 'This is wicked good ice cream.',
        face: 'mobile/images/logo.png'
    }];
    $scope.remove = function(chat) {
        $scope.chats.splice($scope.chats.indexOf(chat), 1);
    };
}

