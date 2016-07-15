
import { loader as loadBaiduMap } from '../baidu-map/baiduScriptLoader';
declare var BMap;
declare var BMAP_STATUS_SUCCESS;

export function modalSelectorMap($scope, $ionicModal, selected){
    $scope.showMap = false;
    loadBaiduMap('sFB94QImEEc4ve0uynf8Gt9vvKYcmECw', {retryInterval: 5000}, ()=>{});
    var template = require('./selector-map-dialog.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: false
    });
    $scope.$on('$destroy', function() {
    });
    $scope.$on('modal.shown', function() {
        $scope.showMap = true;
        $scope.$apply();
    });
    $scope.$on('modal.hidden', function() {
        $scope.modal.remove();
    });
    $scope.$on('modal.removed', function() {
    });

    $scope.mapOptions = {
        center: $scope.city,
        //zoom: 12,
        city: $scope.city,
        scaleCtrl: false,
        overviewCtrl: false,
        enableMessage: false,
        enableMapClick: false
        //markers: markers
    };
    $scope.loadMap = function(map){
        console.log('map inited');
        $scope.map = map;
        window['map'] = map;
        var geoc = new BMap.Geocoder();
        var marker = new BMap.Marker(map.getCenter());
        map.addOverlay(marker);
        marker.enableDragging();
        $scope.marker = marker;
        marker.addEventListener('dragend', function(event){
            var point = $scope.marker.getPosition();
            geoc.getLocation(point, function(rs){
                $scope.results = rs.surroundingPois;
                $scope.showResults = true;
                $scope.$apply();
            });
        });
    }

    var form = $scope.form = {
        selected: selected,
        keyword: ''
    };
    $scope.showResults = false;
    $scope.results = [];

    $scope.locateResult = function(result){
        console.log('centerAndZoom:', result);
        var point = new BMap.Point(result.point.lng, result.point.lat);
        $scope.map.centerAndZoom(point, 15);
        $scope.marker.setPosition(point);
        $scope.form.selected = result;
        $scope.showResults = false;
    }

    $scope.$watch('form.keyword', function(o, n){
        if(o === n)
            return;
        var map = $scope.map;
        var local = new BMap.LocalSearch(map, {
            //renderOptions: {map: map},
            onSearchComplete: onSearchComplete
        });
        //var key = $scope.form.keyword;
        //console.log('searchNearby', key);
        local.searchNearby($scope.form.keyword, $scope.city);
        function onSearchComplete(results) {
            // 判断状态是否正确
            //console.log('onSearchComplete ', key, local.getStatus(), results);
            if(local.getStatus() == BMAP_STATUS_SUCCESS) {
                var s = [];
                for(var i = 0; i < results.getCurrentNumPois(); i++) {
                    s.push(results.getPoi(i));
                }
                $scope.results = s;
                $scope.showResults = true;
                console.log(s);
                $scope.$apply();
            }
        }
    });

    $scope.keywordColor = function(title){
        var keyword = $scope.form.keyword;
        var regkeyword = new RegExp(keyword,'ig');
        var colorful = '<span class="color_key">'+ keyword + '</span>';
        if(title.indexOf(keyword)>=0){
            var msg = title.replace(regkeyword,colorful);
            return msg;
        }
        else{
            return title;
        }
    };

    return new Promise(function(resolve, reject) {
        $scope.confirmModal = function() {
            $scope.modal.hide();
            resolve($scope.form.selected);
        }
        $scope.cancelModal = function() {
            $scope.modal.hide();
            resolve();
        }
        $scope.modal.show();

    })
}
