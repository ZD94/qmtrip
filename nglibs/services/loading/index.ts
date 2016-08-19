"use strict";

import angular = require('angular');
import {IRootScopeService, IDocumentService} from 'angular';

class LoadingService {
    level: number = 0;

    constructor(private $ionicLoading){
        require('./loading.scss');
    }

    reset() {
        this.level = 0;
    }

    start(options?: any) {
        if (!options) {
            options = {};
        }

        if(this.level == 0){
            var template = options.template || require('./loading.html');
            this.$ionicLoading.show({template: template})
            //var wH = $(window).height();
            //$("#loading").show();
            //$("body").css({'height':wH,'overflow':'hidden'});
            //$("#angular-view").css('visibility', 'hidden');
        }
        this.level++;
    }
    end() {
        if(this.level > 0)
            this.level--;
        if(this.level == 0){
            this.$ionicLoading.hide();
            //this.$timeout(function () {
            //    $("#loading").hide();
            //    $("#angular-view").css('visibility', 'visible');
            //    $("body").css({'height':'auto','overflow':'auto'})
            //}, 50);
        }
    }
}

function isHashChange(newurl: string, oldurl: string){
    var newurlsec = newurl.split('#');
    if(newurlsec.length < 3)
        return false;
    var oldurlsec = oldurl.split('#');
    if(oldurlsec.length < 3)
        return false;
    newurlsec.pop();
    oldurlsec.pop();
    return newurlsec == oldurlsec;
}

angular
    .module('nglibs')
    .service('$loading', LoadingService)
    .run(function($rootScope: IRootScopeService, $loading: LoadingService){
        $rootScope.$on("$stateChangeStart", function (event: any, newurl: string, oldurl: string) {
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
        $rootScope.$on("$scopeControllerDone", function(event) {
            $loading.end();
        });
    })
    .run(function($rootScope: IRootScopeService, $document: IDocumentService) {
        let body = $document.find('body');
        let initialViewChildren = body.find('ion-nav-view>*');
        initialViewChildren.data('$accessed', Date.now());
        var unreg = $rootScope.$on('backdrop.shown', function() {
            unreg();
            let body = $document.find('body');
            let initialViewChildren = body.find('ion-nav-view>*');
            initialViewChildren.data('$accessed', Date.now());
            body.addClass('initial-loading-switching');
            setTimeout(()=> {
                initialViewChildren.remove();
                $document.find('body').removeClass('initial-loading-switching');
            });
        })
    });