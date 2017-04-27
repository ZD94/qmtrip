"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var angular = require("angular");
var LoadingService = (function () {
    function LoadingService($ionicLoading) {
        this.$ionicLoading = $ionicLoading;
        this.level = 0;
        require('./loading.scss');
    }
    LoadingService.prototype.reset = function () {
        this.level = 0;
    };
    LoadingService.prototype.start = function (options) {
        if (!options) {
            options = {};
        }
        if (this.level == 0) {
            var template = options.template || require('./loading.html');
            this.$ionicLoading.show({ template: template });
            //var wH = $(window).height();
            //$("#loading").show();
            //$("body").css({'height':wH,'overflow':'hidden'});
            //$("#angular-view").css('visibility', 'hidden');
        }
        this.level++;
    };
    LoadingService.prototype.end = function () {
        if (this.level > 0)
            this.level--;
        if (this.level == 0) {
            this.$ionicLoading.hide();
            //this.$timeout(function () {
            //    $("#loading").hide();
            //    $("#angular-view").css('visibility', 'visible');
            //    $("body").css({'height':'auto','overflow':'auto'})
            //}, 50);
        }
    };
    return LoadingService;
}());
function isHashChange(newurl, oldurl) {
    var newurlsec = newurl.split('#');
    if (newurlsec.length < 3)
        return false;
    var oldurlsec = oldurl.split('#');
    if (oldurlsec.length < 3)
        return false;
    newurlsec.pop();
    oldurlsec.pop();
    return newurlsec == oldurlsec;
}
angular
    .module('nglibs')
    .service('$loading', LoadingService)
    .run(function ($rootScope, $loading) {
    $rootScope.$on("$stateChangeStart", function (event, newurl, oldurl) {
        //console.log('$locationChangeStart', event, newurl, oldurl);
        // if(isHashChange(newurl, oldurl))
        //     return;
        $loading.reset();
        $loading.start();
    });
    //$rootScope.$on("$locationChangeSuccess", function(event, newurl, oldurl) {
    //    //console.log('$locationChangeSuccess', event, newurl, oldurl);
    //    //$loading.end();
    //});
    $rootScope.$on("$scopeControllerDone", function (event) {
        $loading.end();
    });
})
    .run(function ($rootScope, $document, $timeout) {
    var initElements;
    var deregisterSetupInitElements = $rootScope.$on("$locationChangeStart", function () {
        deregisterSetupInitElements();
        initElements = $document.find('body ion-nav-view>*');
        initElements.data('$accessed', Date.now());
    });
    var deregisterRemoveInitElements = $rootScope.$on("$stateChangeSuccess", function () {
        deregisterRemoveInitElements();
        removeInitElements();
    });
    var deregisterRemoval = $rootScope.$on('backdrop.shown', removeInitElements);
    function removeInitElements() {
        if (!deregisterRemoval)
            return;
        deregisterRemoval();
        deregisterRemoval = undefined;
        var body = $document.find('body');
        body.addClass('initial-loading-switching');
        $timeout(function () {
            initElements.remove();
            $document.find('body').removeClass('initial-loading-switching');
        });
    }
});
