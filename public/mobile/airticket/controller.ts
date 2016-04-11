'use strict';

API.require('airplane');


var airlineCodes = {
    "KN" : "联合航空",
    "HO" : "吉祥航空",
    "CA" : "国际航空",
    "X2" : "新华航空",
    "WH" : "西北航空",
    "CZ" : "南方航空",
    "SZ" : "西南航空",
    "CJ" : "北方航空",
    "F6" : "浙江航空",
    "Z2" : "中原航空",
    "HU" : "海南航空",
    "2Z" : "长安航空",
    "3W" : "南京航空",
    "MU" : "东方航空",
    "MF" : "厦门航空",
    "XO" : "新疆航空",
    "3Q" : "云南航空",
    "3U" : "四川航空",
    "FM" : "上海航空",
    "G8" : "长城航空",
    "WU" : "武汉航空",
    "G4" : "贵州航空",
    "ZH" : "深圳航空",
    "IV" : "福建航空",
    "SC" : "山东航空",
    "GS" : "天津航空",
    "TV" : "西藏航空",

    "AF":"法国航空",
    "AY":"芬兰航空",
    "AZ":"意大利航空",
    "BA":"英国航空",
    "BL":"文莱王家航空",
    "CP":"加拿大国际航空",
    "ET":"埃塞俄比亚航空",
    "E5":"萨马拉航空",
    "GA":"印度尼西亚鹰航空",
    "HY":"乌兹别克斯坦航空",
    "LR":"伊朗航空",
    "JD":"日本航空",
    "JS":"朝鲜航空",
    "KA":"港龙航空",
    "JL":"日本航空",
    "KE":"大韩航空",
    "KL":"荷兰皇家航空",
    "K4":"哈萨克斯坦航空",
    "LH":"德国汉莎航空",
    "LO":"波兰航空",
    "LY":"以色列航空",
    "MH":"马来西亚航空",
    "ML":"新加坡航空",
    "NH":"全日空",
    "NW":"美国西北航空",
    "NX":"澳门航空",
    "OS":"奥地利航空",
    "OZ":"韩亚航空",
    "PK":"巴基斯坦国际航空",
    "PR":"菲律宾航空",
    "QF":"澳大利亚快达航空",
    "QV":"老挝航空",
    "RA":"尼泊尔航空",
    "RO":"罗马尼亚航空",
    "SK":"斯堪的纳维亚（北欧）航空",
    "SQ":"新加坡航空",
    "SU":"瑞士航空",
    "TG":"泰国国际航空",
    "UA":"美国联合航空",
    "UB":"缅甸航空",
    "VJ":"柬埔寨航空",
    "VN":"越南航空"
}


/*
 机票列表页
 * @param $scope
 */
export async function FlightlistController($scope, $routeParams, $filter, $loading){

    $loading.start();

    var budget = $routeParams.BG;
    var startCityName = $routeParams.SCN;
    var endCityName = $routeParams.ECN;
    var startCityCode = $routeParams.SCC;
    var endCityCode = $routeParams.ECC;
    var startDate = $routeParams.ST;

    $scope.airlineCodes = airlineCodes;
    $scope.budget = parseInt(budget).toFixed(2);
    $scope.startCityName = startCityName;
    $scope.endCityName = endCityName;

    //选择日期
    function GetDateStr(AddDayCount) {
        var searchDay = new Date(startDate);
        searchDay.setDate(searchDay.getDate()+AddDayCount);
        return searchDay;
    }

    //设置那天为那天
    var n = 0;
    $scope.thatDay = startDate;

    //点击前一天
    $scope.prevDay = function () {
        n = n - 1;
        $scope.thatDay = $filter('date')(GetDateStr(n),'yyyy-MM-dd');
        $loading.start();
        $scope.initFlightlist();
    }

    //点击后一天
    $scope.nextDay = function () {
        n = n + 1;
        $scope.thatDay = $filter('date')(GetDateStr(n),'yyyy-MM-dd');
        $loading.start();
        $scope.initFlightlist();
    }

    //获取今天日期
    var today = new Date();
    $scope.today = $filter('date')(today,'yyyy-MM-dd');


    //初始化机票列表
    $scope.initFlightlist = async function () {
        try {
            await API.onload();
            $scope.flightlist = await API.airplane.get_plane_list({departure_city:startCityCode,arrival_city:endCityCode,date:$scope.thatDay});
            $loading.end();
            console.info ($scope.flightlist);
        } catch (e) {
            console.info (e);
        }
    }
    $scope.initFlightlist();

    //排序
    $scope.sort = "suggest_price";
    $scope.sortFunc = function (sort) {
        $scope.sort = sort;
    }

    //筛选
    $scope.shaixuanShow = function () {
        $('.shaixuan_bg').show();
    }



    $scope.timeList = [
        {st:'00:00', et:'24:00', timeName:'不限'},
        {st:'00:00', et:'06:00', timeName:'00:00 - 06:00'},
        {st:'06:00', et:'12:00', timeName:'06:00 - 12:00'},
        {st:'12:00', et:'18:00', timeName:'12:00 - 18:00'},
        {st:'18:00', et:'24:00', timeName:'18:00 - 24:00'}
    ];

    $scope.cabinList = [
        {cabinLeval:0, cabinName:'不限'},
        {cabinLeval:0, cabinName:'经济舱'},
        {cabinLeval:6, cabinName:'头等/商务舱'}
    ];

    $scope.airList = [
        {airName:'不限', airCode:''},
        {airName:'联合航空', airCode:'KN'},
        {airName:'吉祥航空', airCode:'HO'},
        {airName:'国际航空', airCode:'CA'},
        {airName:'新华航空', airCode:'X2'},
        {airName:'西北航空', airCode:'WH'},
        {airName:'南方航空', airCode:'CZ'},
        {airName:'西南航空', airCode:'SZ'},
        {airName:'北方航空', airCode:'CJ'},
        {airName:'浙江航空', airCode:'F6'},
        {airName:'中原航空', airCode:'Z2'},
        {airName:'海南航空', airCode:'HU'}
    ];



    $scope.chooseTime = function (st,et,item) {
        return item.departure_time == '2016-04-25 08:45:00';
    }

    //筛选切换
    $('.shaixuan_bottom').find('dt').click(function(){
        var index = $(this).index();
        $('.shaixuan_bottom').find('dt').removeClass('active');
        $(this).addClass('active');
        $('.shaixuan_bottom').find('ul').hide();
        $('.shaixuan_bottom').find('ul').eq(index).show();
    })

    //进入机票详情页
    $scope.enterDetails = function (flight_no,query_key) {
        window.location.href = "#/airticket/flightdetails?BG="+budget+"&SCN="+startCityName+"&ECN="+endCityName+"&flight_no="+flight_no+"&query_key="+query_key;
    }
}

/*
 机票详情页
 * @param $scope
 */
export async function FlightdetailsController($scope, $routeParams){

    var budget = $routeParams.BG;
    var startCityName = $routeParams.SCN;
    var endCityName = $routeParams.ECN;
    var flight_no = $routeParams.flight_no;
    var query_key = $routeParams.query_key;

    $scope.budget = parseInt(budget).toFixed(2);
    $scope.startCityName = startCityName;
    $scope.endCityName = endCityName;

    try {
        await API.onload();
        $scope.flightdetails = await API.airplane.get_plane_details({flight_no:flight_no,query_key:query_key});
        console.info ($scope.flightdetails);
    } catch (e) {
        console.info (e);
    }

    $scope.economy_class = function () {
        $('#economy_class').find('dd').toggle();
        $('#economy_class').find('.up').toggle();
        $('#economy_class').find('.down').toggle();
    }

    $scope.first_class = function () {
        $('#first_class').find('dd').toggle();
        $('#first_class').find('.up').toggle();
        $('#first_class').find('.down').toggle();
    }

}