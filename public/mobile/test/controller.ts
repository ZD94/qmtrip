"use strict";

declare function loading(boolean) : void;
declare var msgbox: any;

export function IndexController($scope){
}

export async function StaffController($scope, $q, StaffCache){
    var Cookie = require('tiny-cookie');
    var current_staff_id = Cookie.get('user_id');
    console.log(current_staff_id);
    $scope.staff = await StaffCache.get(current_staff_id);
    $scope.staff_id = $scope.staff.id;
}

export function AsyncController($scope, $q, $timeout) {
    var get_user = function() {
        return new Promise(function(resolve, reject){
            window.setTimeout(function() {
                resolve({id:1000, name:'Clear'});
            }, 2000);
        });
    };
    $scope.user = get_user();

    var getMessages = function() {
        var deferred = $q.defer();
        $timeout(function() {
            deferred.resolve(['Hello', 'world!']);
        }, 2000);
        return deferred.promise;
    };
    $scope.messages = getMessages();
}


export function MsgboxController($scope){
    $scope.msgbox = msgbox;
    $scope.alert = function(){
        msgbox.alert('提示对话框');
    }
    $scope.confirm = function(){
        msgbox.confirm('确认对话框')
            .then(function(btn){
                console.log(btn);
            });
    }
    $scope.prompt = function(){
        msgbox.prompt('输入对话框', 12345)
            .then(function(ret){
                console.log(ret[0], ret[1]);
            });
    }
}

export function UploadController($scope, FileUploader){
    $scope.winWidth = $(window).width();
    //$scope.uploader = init_uploader(FileUploader, "/upload/ajax-upload-file?type=invoice");
    $scope.upload_tip = '测试上传';
    $scope.upload_done = function (res) {
        alert('upload_done'+JSON.stringify(res));
        console.log('upload done:', res);
    }
}

export function SelectController($scope) {
    $scope.selectOpt = {value: {val: 'a3'}};
    $scope.selectData = [
        {val: "a1", name: 111},
        {val: "a2", name: 222},
        {val: "a3", name: 333},
        {val: "a4", name: 444},
        {val: "a5", name: 555},
        {val: "a6", name: 666}
    ];
    $scope.change = function (num) {
        $scope.selectOpt.value = 'a' + num;
    }
};

export function IconController($scope){
    $scope.symbols = [
        'customs.success',
        'customs.consult',
        'customs.cross',
        'customs.like',

        'customs.hotel',
        'customs.arrow-down',
        'customs.points',
        'customs.train',

        'customs.help',
        'customs.arrows',
        'customs.info',
        'customs.calendar',

        'customs.close',
        'customs.suitcase',
        'customs.plane',
        'customs.gift',

        'customs.bulb',
        'customs.exclaimation',
        'customs.monitor',
        'customs.home',

        'customs.foot',
        'customs.arrow-up',
        'customs.gear',
        'customs.star',

        'customs.checkbox',
        'customs.upload',

        'customs.employee',
        'customs.yuan',
        'customs.users',
        'customs.new-points',

        'customs.pin',
        'customs.export',
        'customs.error',
        'customs.charts',

        'customs.invoice',
        'customs.small-yuan',
        'customs.small-exlaimation',

        'customs.query',
        'customs.train-n-plane'
    ];
    var fontcss = Object.keys(document.styleSheets)
        .map(function(index){
            return document.styleSheets[index];
        }).filter(function(css){
            return css.href && css.href.indexOf('font-awesome.css') >= 0;
        });
    fontcss.forEach(function(css){
        console.log(css.href);
    })
    var facss = fontcss[0];
    var regex_symbol = /\.[a-z][\w\-]*::before/gi;
    [].slice.call(facss.rules).forEach(function(rule){
        if(!rule.selectorText)
            return;
        var cssclasses = rule.selectorText.match(regex_symbol);
        if(!cssclasses)
            return;
        cssclasses.forEach(function(cssclass){
            cssclass = cssclass.replace(/\.\w+\-([\w\-]*)::before/, '$1');
            $scope.symbols.push('fa.'+cssclass);
            //console.log('\''+cssclass+'\':', '\'&#x'+rule.style.content.charCodeAt(1).toString(16)+'\',');
        })
    })

}

export function InputController($scope){
    $scope.user = {
     name:'',
     pwd:''
    };
 }