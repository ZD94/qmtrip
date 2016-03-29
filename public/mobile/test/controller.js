"use strict";

var test = module.exports = {}

test.IndexController = function($scope){
    loading(true);
}

test.MsgboxController = function($scope){
    loading(true);
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

test.UploadController = function($scope, FileUploader){
    loading(true);
    $scope.winWidth = $(window).width();
    //$scope.uploader = init_uploader(FileUploader, "/upload/ajax-upload-file?type=invoice");
    $scope.upload_tip = '测试上传';
    $scope.upload_done = function (res) {
        alert('upload_done'+JSON.stringify(res));
        console.log('upload done:', res);
    }
}

test.SelectController = function($scope) {
    loading(true);
    $scope.selectOpt = {value:"a3"};
    $scope.selectData = [
        {val: "a1", name: 111},
        {val: "a2", name: 222},
        {val: "a3", name: 333},
        {val: "a4", name: 444},
        {val: "a5", name: 555},
        {val: "a6", name: 666}
    ];
}


test.IconController = function($scope){
    loading(true);
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

test.InputController = function($scope){
    loading(true);
    $scope.user = {
     name:'',
     pwd:''
    };
 }