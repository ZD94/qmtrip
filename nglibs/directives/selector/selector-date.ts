
var moment = require('moment');
var dyload = require('dyload');
dyload('script/libs/bundle.calendar.js');
var LunarCalendar;

var lunarFest = {
    '春节':'春节',
    '元宵节':'元宵',
    '端午节':'端午',
    '七夕情人节':'七夕',
    '中元节':'中元',
    '中秋节':'中秋',
    '重阳节':'重阳',
    '下元节':'下元',
    '腊八节':'腊八',
    '小年':'小年',
    '除夕':'除夕'
}

var weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function initLunarCalendar(){
    if(LunarCalendar)
        return;

    LunarCalendar = require("lunar-calendar");
    LunarCalendar.setWorktime({
        'y2016': {
            "d0101": 2, "d0102": 2, "d0103": 2, //元旦
            "d0206": 1, "d0207": 2, "d0208": 2, "d0209": 2, "d0210": 2, "d0211": 2, "d0212": 2, "d0213": 2, "d0214": 1, //春节
            "d0402": 2, "d0403": 2, "d0404": 2, //清明
            "d0430": 2, "d0501": 2, "d0502": 2, //五一
            "d0609": 2, "d0610": 2, "d0611": 2, "d0612": 1, //端午
            "d0915": 2, "d0916": 2, "d0917": 2, "d0918": 1, //中秋
            "d1001": 2, "d1002": 2, "d1003": 2, "d1004": 2, "d1005": 2, "d1006": 2, "d1007": 2, "d1008": 1, "d1009": 1, //十一
            //"d1231": 2, //元旦
        },
        /*
        'y2017': {
            "d0101": 2, "d0102": 2, //元旦
            "d0127": 2, "d0128": 2, "d0129": 2, "d0130": 2, "d0131": 2, "d0201": 2, "d0202": 2, "d0203": 1, "d0204": 1, //春节
            "d0401": 1, "d0402": 2, "d0403": 2, "d0404": 2, //清明
            "d0429": 2, "d0430": 2, "d0501": 2, //五一
            "d0527": 1, "d0528": 2, "d0529": 2, "d0530": 2, //端午
            "d1001": 2, "d1002": 2, "d1003": 2, "d1004": 2, "d1005": 2, "d1006": 2, "d1007": 2, "d1008": 1, //十一 中秋
        }
        */
    })
}

interface DayData{
    year: number;
    month: number;
    day: number;
    date: Date;
    lunar: string;
    festival: string;
    term: string;
    worktime: number;
}

interface MonthData{
    year: number;
    month: number;
    days: DayData[];
}

function getMonth(year, month): MonthData{
    let ret = { year, month, days: [] };
    let caldata = LunarCalendar.calendar(year, month, true);
    //if(caldata.monthData[caldata.monthData.length-7].month != month){
    //    caldata.monthData.splice(caldata.monthData.length-7);
    //}
    ret.days = caldata.monthData.map(function(day){
        let festival;
        if(day.lunarFestival && lunarFest[day.lunarFestival]){
            festival = lunarFest[day.lunarFestival];
        }else if(day.solarFestival && day.solarFestival != ''){
            let festivals = day.solarFestival.split(' ');
            for(let fest of festivals){
                if(fest.length <= 3){
                    festival  = fest;
                    break;
                }
            }
        }
        return {
            year: day.year,
            month: day.month,
            day: day.day,
            worktime: day.worktime,
            timestamp: new Date(day.year, day.month-1, day.day).getTime(),
            lunar: day.lunarDay == 1 ? day.lunarMonthName : day.lunarDayName,
            festival: festival,
            term: day.term,
        }
    });
    return ret;
}

angular
    .module('nglibs')
    .directive('ngSelectorDateDay', function() {
        return {
            template: require('./selector-date-day.html'),
            scope:{
                day: '=ngModal',
                options: '=ngDayOptions',
            }
        }
    });


function popupSelectorTime($scope, $ionicPopup){
    return $ionicPopup.confirm({
        cssClass: 'ng-selector-date-time',
        scope: $scope,
        title: '选择时间',
        template: require('./selector-date-time.html')
    });
}

export function modalSelectorDate(scope, $ionicModal, $ionicPopup, options, value){
    let $scope = scope.$new(true);
    initLunarCalendar();
    var template = require('./selector-date-dialog.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    $scope.month_2col = false;
    $scope.$on('modal.shown', function() {
        if($($scope.modal.modalEl).width() > 680)
            $scope.month_2col = true;
        fixMonths();
    });
    $scope.$on('modal.hidden', function() {
    });
    $scope.$on('modal.removed', function() {
    });

    $scope.weekDayNames = weekDayNames;

    let timeScale = 10;
    if(options.timepicker){
        $scope.timeScale = timeScale;
        $scope.timeMax = 24*60/timeScale;
    }

    $scope.options = {};
    $scope.options.begin = moment(options.beginDate).startOf('day').valueOf();
    $scope.options.end = moment(options.endDate).startOf('day').valueOf();

    $scope.options.today = moment().startOf('day').valueOf();
    $scope.options.selected = {};
    function parseSelected(){
        $scope.options.selected.day = moment(value).startOf('day').valueOf();
        $scope.options.selected.hour = value.getHours();
        $scope.options.selected.minute = value.getMinutes();
        $scope.options.selected.time = Math.floor(($scope.selected.hour*60 + $scope.selected.minute)/timeScale);
    }
    parseSelected();
    $scope.$watch('value', function(n, o){
        if(n == o)
            return;
        parseSelected();
    });
    $scope.$watch('selected.time', function(n, o){
        if(n == o)
            return;
        $scope.selected.hour = Math.floor($scope.selected.time*timeScale/60);
        $scope.selected.minute = ($scope.selected.time*timeScale)%60;

    });

    $scope.months = [];

    let ret = new Promise(function(resolve, reject) {
        function closeAndResolve(day){
        }
        $scope.confirmModal = async function(day) {
            if(day.timestamp<$scope.begin||$scope.end<day.timestamp)
                return;
            if(options.timepicker){
                $scope.options.selected.date = moment({year: day.year, month: day.month-1, day: day.day}).toDate();
                let res = await popupSelectorTime($scope, $ionicPopup);
                if(!res)
                    return;
                $scope.modal.hide();
                let date = moment({
                    year: day.year,
                    month: day.month-1,
                    day: day.day,
                    hour: $scope.options.selected.hour,
                    minute: $scope.options.selected.minute
                });
                resolve(date.toDate());
            }
        }
        $scope.cancelModal = function() {
            $scope.modal.hide();
            resolve(false);
        }
        $scope.modal.show();
    });

    var date = moment().startOf('month');
    let caldata = getMonth(date.year(), date.month()+1);
    $scope.months.push(caldata);
    function loadNextMonth(){
        let last = $scope.months[$scope.months.length-1];
        let date = moment({year: last.year, month: last.month-1, day: 1});
        date = date.add(1, 'month');
        let caldata = getMonth(date.year(), date.month()+1);
        $scope.months.push(caldata);
    }
    loadNextMonth();
    loadNextMonth();
    function fixMonths(){
        if($scope.month_2col){
            for(let i=1; i< $scope.months.length; i+=2){
                let m1 = $scope.months[i-1];
                let m2 = $scope.months[i];
                if(m1.days[m1.days.length-7].month != m1.month
                    && m2.days[m2.days.length-7].month != m2.month){
                    m1.days.splice(m1.days.length - 7);
                    m2.days.splice(m2.days.length - 7);
                }
            }
        } else {
            for(let i = 0; i < $scope.months.length; i++) {
                let m1 = $scope.months[i];
                if(m1.days[m1.days.length-7].month != m1.month){
                    m1.days.splice(m1.days.length - 7);
                }
            }
        }
    }
    $scope.loadNextMonth = function(){
        loadNextMonth();
        loadNextMonth();
        fixMonths();
        $scope.$broadcast('scroll.infiniteScrollComplete');
    }
    return ret;
}