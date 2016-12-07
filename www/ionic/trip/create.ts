import moment = require('moment');
import { Staff } from 'api/_types/staff/staff';

var msgbox = require('msgbox');


var defaultTrip = {
    beginDate: moment().add(3, 'days').startOf('day').hour(18).toDate(),
    endDate: moment().add(4, 'days').startOf('day').hour(9).toDate(),
    place: undefined,
    placeName: '',
    reason: '',

    traffic: true,
    fromPlace: undefined,
    round: true,

    hotel: false,
    hotelPlace: undefined
};
type TripDefine = typeof defaultTrip;
function TripDefineFromJson(obj: any): TripDefine{
    if(obj == undefined)
        return defaultTrip;
    obj.beginDate = new Date(obj.beginDate);
    obj.endDate = new Date(obj.endDate);
    return obj as TripDefine;
}


export async function CreateController($scope, $storage, $loading, ngModalDlg, $ionicPopup, Models){
    require('./trip.scss');
    API.require('tripPlan');
    await API.onload();
    /*******************出差补助选择begin************************/
    $scope.select_subsidy = {
        name: '请选择'
    };
    $scope.currentStaff = await Staff.getCurrent();
    $scope.currentTp = await $scope.currentStaff.getTravelPolicy();
    if($scope.currentTp){
        $scope.currentTpSts = await $scope.currentTp.getSubsidyTemplates();
    }
    $scope.subsidy = {hasFirstDaySubsidy: true, hasLastDaySubsidy: true, template: null};

    var ret = await $scope.currentStaff.testServerFunc();
    console.log('$scope.currentStaff.testServerFunc() return', ret);

    $scope.selectSubsidyTemplate = async function(){
        $ionicPopup.show({
            title:'出差补助选择',
            cssClass:'selectSubsidy',
            template:require('./selectSubsidy.html'),
            scope: $scope,
            buttons:[
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            if(!$scope.subsidy.template){
                                e.preventDefault();
                                msgbox.log("请选择补助模板");
                                return false;
                            }else{
                                $scope.select_subsidy = $scope.subsidy.template;
                            }
                        }catch(err){
                            msgbox.log(err.msg || err);
                        }
                    }
                }
            ]
        });
    }

    /*******************出差补助选择end************************/

    /******住宿打开******/
    $scope.$watch('trip.place',function(n,o){
        if(n != undefined){
            $scope.trip.hotel = true;
        }
    })
    /*****************/
    let minStDate = moment().format('YYYY-MM-DD');
    $scope.minStDate = minStDate;
    $scope.minEndDate = moment().add(3, 'days').format('YYYY-MM-DD');

    let trip;
    try {
        trip= TripDefineFromJson($storage.local.get('trip'));
    } catch(err) {
        trip = {};
    }

    if(!trip.regenerate) {
        trip = defaultTrip;
        await $storage.local.set('trip', trip);
    }else {
        var today = moment();
        if (!trip.beginDate || (new Date(trip.beginDate) < new Date())) {
            trip.beginDate = today.startOf('day').hour(18).toDate();
        }

        trip.regenerate = false;
    }

    $scope.oldBeginDate = trip.beginDate;

    $storage.local.set('trip', trip);
    $scope.trip = trip;
    $scope.$watch('trip', function(){
        $storage.local.set('trip', $scope.trip);
    }, true);
    $scope.$watch('trip.beginDate', function(n, o){
        if (!trip.endDate || trip.endDate <= trip.beginDate) {
            trip.endDate = moment(trip.beginDate).add(3, 'days').toDate();
        }
    })

    $scope.calcTripDuration = function(){
        return moment(trip.endDate).startOf('day').diff(moment(trip.beginDate).startOf('day'), 'days') || 1;
    };
    $scope.incTripDuration = function(){
        trip.endDate = moment(trip.endDate).add(1, 'days').toDate();
        $scope.$applyAsync();
    };
    $scope.decTripDuration = function(){
        var newDate = moment(trip.endDate).subtract(1, 'days').toDate();
        if(newDate > trip.beginDate){
            trip.endDate = newDate;
            $scope.$applyAsync();
        }
    };

    $scope.$watch('trip.place.name', function($newVal, $oldVal) {
        if ($newVal != $oldVal) {
            $scope.trip.hotelPlaceObj = undefined;
            $scope.trip.hotelPlace = '';
            $scope.trip.hotelName = '';
        }
    });

    async function queryPlaces(keyword){
        if (!keyword) {
            let hotCities = $storage.local.get("hot_cities")
            if (hotCities && hotCities[0] && hotCities[0].id) {
                return hotCities;
            }
        }
        var places = await API.place.queryPlace({keyword: keyword});
        if (!keyword) {
            $storage.local.set('hot_cities', places);
        }
        return places;
    }
    $scope.placeSelector = {
        query: queryPlaces,
        display: (item)=>item.name
    };
    $scope.fromPlaceSelector = {
        query: queryPlaces,
        display: (item)=>item.name
    };
    $scope.projectSelector = {
        query: async function(keyword){
            var staff = await Staff.getCurrent();
            var options = {where:{companyId: staff.company.id}};
            if(keyword){
                options.where["name"] = {$like: '%'+keyword+'%'};
            }
            var projects = await Models.project.find(options);
            return projects;
        },
        display: (item)=>item.name,
        create: async function(name){
            return {
                name: name,
                id: undefined
            }
        },
        done: function(val) {
            $scope.trip.reason = val.name ? val.name: val;
        }
    };
    $scope.hotelPlaceSelector = {
        done: function(val) {
            if (!val.point || !val.point.lat || !val.point.lng) {
                $scope.showErrorMsg("获取住宿位置失败");
                return;
            }
            $scope.trip.hotelPlace = val.point.lat + "," + val.point.lng
            $scope.trip.hotelName = val.title;
        }
    };

    $scope.selectDatespan = async function(){
        let value = {
            begin: $scope.trip.beginDate,
            end: $scope.trip.endDate
        }
        value = await ngModalDlg.selectDateSpan($scope, {
            beginDate: new Date(),
            endDate: moment().add(1, 'year').toDate(),
            timepicker: true,
            title: '选择开始时间',
            titleEnd: '选择结束时间',
        }, value);
        if(value){
            $scope.trip.beginDate = value.begin;
            $scope.trip.endDate = value.end;
        }

    };

    $scope.endDateSelector = {
        beginDate: $scope.trip.beginDate,
        endDate: moment().add(1, 'year').toDate(),
        timepicker: true,
    };
    $scope.$watch('trip.beginDate', function(n, o){
        $scope.endDateSelector.beginDate = $scope.trip.beginDate;
    })
    $scope.nextStep = async function() {
        if ($scope.currentTpSts && $scope.currentTpSts.length && (!$scope.subsidy || !$scope.subsidy.template)) {
            $scope.showErrorMsg('请选择补助信息');
            return false;
        }
        let beginMSecond = Date.now();
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;

        if(!trip.place || !trip.place.id) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        if(!trip.traffic && ! trip.hotel) {
            $scope.showErrorMsg('请选择交通或者住宿！');
            return false;
        }

        if(trip.traffic && (!trip.fromPlace || !trip.fromPlace.id)) {
            $scope.showErrorMsg('请选择出发地！');
            return false;
        }

        let params = {
            originPlace: trip.fromPlace? trip.fromPlace.id : '',
            destinationPlace: trip.place ? trip.place.id : '',
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            latestArrivalTime: moment(trip.beginDate).format('HH:mm'),
            // leaveTime: moment(trip.beginDate).format('HH:mm'),
            // goBackTime: moment(trip.endDate).format('HH:mm'),
            earliestGoBackTime: moment(trip.endDate).format('HH:mm'),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
            subsidy: $scope.subsidy
        };

        if(params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }

        let front = ['正在验证出行参数', '正在匹配差旅政策', '正在搜索全网数据', '动态预算即将完成'];
        $loading.reset();
        $loading.start({
            template: '预算计算中...'
        });
        let idx = 0;
        let isShowDone = false;
        let budget;
        let timer = setInterval(async function() {
            let template = front[idx++]+'...';
            if (idx >= front.length) {
                clearInterval(timer);
                isShowDone = true;
                if (budget) {
                    return cb();
                }
            }
            $loading.reset();
            $loading.start({
                template: template,
            });
        }, 1000);

        try {
            budget = await API.travelBudget.getTravelPolicyBudget(params);
            if (isShowDone) {
                cb();
            }
        } catch(err) {
            clearInterval(timer);
            $loading.end();
            alert(err.msg || err);
        }
        let endMSecond = Date.now();
        spendMS(beginMSecond, endMSecond);
        function spendMS(begin, end) {
            console.info('开始时间:', begin, '结束时间:', end, '耗时:', end - begin);
        }
        function cb() {
            $loading.end();
            window.location.href = "#/trip/budget?id="+budget;
        }
    }

    $scope.specialApprove = async function() {
        API.require("travelBudget");
        await API.onload();

        let trip = $scope.trip;

        if(!trip.place || !trip.place.id) {
            $scope.showErrorMsg('请填写出差目的地！');
            return false;
        }

        if(!trip.reasonName) {
            $scope.showErrorMsg('请填写出差事由！');
            return false;
        }

        // if(!trip.traffic && ! trip.hotel) {
        //     $scope.showErrorMsg('请选择交通或者住宿！');
        //     return false;
        // }

        if(trip.traffic && (!trip.fromPlace || !trip.fromPlace.id)) {
            $scope.showErrorMsg('请选择出发地！');
            return false;
        }

        let params = {
            originPlace: trip.fromPlace? trip.fromPlace.id : '',
            destinationPlace: trip.place ? trip.place.id : '',
            leaveDate: moment(trip.beginDate).format('YYYY-MM-DD'),
            goBackDate: moment(trip.endDate).format('YYYY-MM-DD'),
            latestArrivalTime: moment(trip.beginDate).format('HH:mm'),
            // leaveTime: moment(trip.beginDate).format('HH:mm'),
            // goBackTime: moment(trip.endDate).format('HH:mm'),
            earliestGoBackTime: moment(trip.endDate).format('HH:mm'),
            isNeedTraffic: trip.traffic,
            isRoundTrip: trip.round,
            isNeedHotel: trip.hotel,
            businessDistrict: trip.hotelPlace,
            hotelName: trip.hotelName,
        };

        if(params.originPlace == params.destinationPlace){
            msgbox.log("出差地点和出发地不能相同");
            return false;
        }

        try {
            $loading.end();
            window.location.href = "#/trip/special-approve?params="+JSON.stringify(params);
        } catch(err) {
            $loading.end();
            alert(err.msg || err);
        }
    }

    $scope.checkDate = function(isStartTime?: boolean) {
        let beginDate = trip.beginDate;
        let endDate = trip.endDate;
        if(moment(endDate).diff(moment(beginDate)) < 0) {
            if(isStartTime) {
                $scope.minEndDate = moment(beginDate).format('YYYY-MM-DD');
            }else {
                $scope.showErrorMsg('结束日期不能早于结束日期！');
            }
            $scope.trip.endDate = beginDate;
            return;
        }

        $scope.oldBeginDate = beginDate;
        $scope.minEndDate = moment(beginDate).format('YYYY-MM-DD');
    }
}
