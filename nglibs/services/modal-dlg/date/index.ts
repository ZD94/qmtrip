var moment = require('moment');
var dyload = require('dyload');
dyload('script/libs/bundle.calendar.js');
var LunarCalendar;

var lunarFest = {
    '春节': '春节',
    '元宵节': '元宵',
    '端午节': '端午',
    '七夕情人节': '七夕',
    '中元节': '中元',
    '中秋节': '中秋',
    '重阳节': '重阳',
    '下元节': '下元',
    '腊八节': '腊八',
    '小年': '小年',
    '除夕': '除夕'
}

var weekDayNames = ['日', '一', '二', '三', '四', '五', '六'];

function initLunarCalendar() {
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

interface DayData {
    year: number;
    month: number;
    day: number;
    date: Date;
    lunar: string;
    festival: string;
    term: string;
    worktime: number;
}

interface MonthData {
    year: number;
    month: number;
    days: DayData[];
}

function getMonth(year, month): MonthData {
    let ret = {year, month, days: []};
    let caldata = LunarCalendar.calendar(year, month, true);
    //if(caldata.monthData[caldata.monthData.length-7].month != month){
    //    caldata.monthData.splice(caldata.monthData.length-7);
    //}
    ret.days = caldata.monthData.map(function(day) {
        let festival;
        if(day.lunarFestival && lunarFest[day.lunarFestival]) {
            festival = lunarFest[day.lunarFestival];
        } else if(day.solarFestival && day.solarFestival != '') {
            let festivals = day.solarFestival.split(' ');
            for(let fest of festivals) {
                if(fest.length <= 3) {
                    festival = fest;
                    break;
                }
            }
        }
        let date = new Date(day.year, day.month - 1, day.day);
        return {
            year: day.year,
            month: day.month,
            day: day.day,
            worktime: day.worktime,
            date: date,
            timestamp: date.getTime(),
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
            template: require('./day-element.html'),
            scope: {
                day: '=ngModal',
                options: '=ngDayOptions',
            },
            controller: selectorDateDayController
        }
    });


function checkExpired(timestamp, valid){
    if(!valid)
        return false;
    if(valid.begin && timestamp < valid.begin)
        return true;
    if(valid.end && valid.end <= timestamp)
        return true;
    return false;
}

function selectorDateDayController($scope){
    let day = $scope.day;
    let options = $scope.options;
    $scope.today = day.timestamp == options.today;

    $scope.$watch('options.valid', function(n, o){
        $scope.expired = checkExpired(day.timestamp, options.valid);
    }, true);
    $scope.$watch('options.selected', function(n, o){
        if(!options.selected)
            return;
        $scope.selected = day.timestamp == options.selected;
    });
    $scope.$watchGroup(['options.begin', 'options.end'], function(n, o){
        if(!options.begin || !options.end)
            return;
        $scope.begin = day.timestamp == options.begin;
        $scope.span  = options.begin < day.timestamp && day.timestamp < options.end;
        $scope.end   = day.timestamp == options.end;
    });
}

function popupSelectorTime($scope, $ionicPopup) {
    var ret = $ionicPopup.confirm({
        cssClass: 'ng-modal-select-time-range',
        scope: $scope,
        title: '选择时间',
        template: require('./time-range.html')
    });
    return ret;
}

interface DateSelect {
    date: Date;
    day: number;
    time: number;
}

function updateSelectedDate(day: DateSelect, timeScale: number){
    if(!day.time){
        day.time = 0;
    }
    day.date = moment(
        day.day
        + day.time * timeScale * 60 * 1000
    ).toDate();
}

function parseDateSelect(date: Date, timeScale: number): DateSelect{
    let v = moment(date);
    return {
        date: date,
        time: Math.floor((v.hour() * 60 + v.minute()) / timeScale),
        day: v.startOf('day').valueOf()
    };
}

function calendarController($scope, $element, value, $ionicScrollDelegate){
    initLunarCalendar();

    loadMonths($scope, $element, $ionicScrollDelegate);

    let timeScale = $scope.options.timeScale || 10;
    if($scope.options.timepicker) {
        $scope.timeScale = timeScale;
        $scope.timeMax = 24 * 60 / timeScale;
    }else{
        $scope.timeScale = 10;
    }

    $scope.valid = {
        begin: moment($scope.options.beginDate).startOf('day').valueOf(),
        end: moment($scope.options.endDate).startOf('day').valueOf()
    };

    $scope.selected = parseDateSelect(value, timeScale);
    $scope.$watchGroup(['selected.day', 'selected.time'], function(n, o) {
        if(n == o)
            return;
        updateSelectedDate($scope.selected, timeScale);
    });

    $scope.dayOptions = {};
    $scope.dayOptions.valid = $scope.valid;
    $scope.dayOptions.today = moment().startOf('day').valueOf();
}

export function selectDateController($scope, $element, $ionicPopup, $ionicScrollDelegate) {
    calendarController($scope, $element, $scope.value, $ionicScrollDelegate);

    $scope.confirm = async function(day) {
        if(day.timestamp < $scope.valid.begin || $scope.valid.end < day.timestamp)
            return;
        $scope.selected.day = moment({year: day.year, month: day.month-1, day: day.day}).valueOf();
        if($scope.options.timepicker){
            let res = await popupSelectorTime($scope, $ionicPopup);
            if(!res){
                $scope.selected = parseDateSelect($scope.value, $scope.timeScale);
                return;
            }
        }
        updateSelectedDate($scope.selected, $scope.timeScale);
        $scope.confirmModal($scope.selected.date);
    }

    $scope.$watch('selected.day', function(n, o) {
        $scope.dayOptions.selected = $scope.selected.day;
    });
}

export function selectDateSpanController($scope, $element, $ionicPopup, $ionicScrollDelegate) {
    calendarController($scope, $element, $scope.value.begin, $ionicScrollDelegate);

    $scope.result = {
        begin: $scope.selected,
        end: parseDateSelect($scope.value.end, $scope.timeScale)
    };

    $scope.beginSelected = false;
    $scope.confirm = async function(day) {
        if(day.timestamp < $scope.valid.begin || $scope.valid.end < day.timestamp)
            return;
        let oldday = $scope.selected.day;
        let oldtime = $scope.selected.time;
        $scope.selected.day = moment({year: day.year, month: day.month-1, day: day.day}).valueOf();
        updateSelectedDate($scope.selected, $scope.timeScale);
        if($scope.options.timepicker){
            let res = await popupSelectorTime($scope, $ionicPopup);
            if(!res){
                $scope.selected.day = oldday;
                $scope.selected.time = oldtime;
                return;
            }
        }
        if(!$scope.beginSelected){
            $scope.beginSelected = true;
            $scope.valid.begin = $scope.result.begin.day;
            $scope.selected = $scope.result.end;

            if($scope.result.end.date > $scope.result.begin.date)
                return;
            $scope.result.end.day = moment($scope.result.begin.date).add(1, 'day').startOf('day').valueOf();
            updateSelectedDate($scope.result.end, $scope.timeScale);
            return;
        }
        $scope.confirmModal({
            begin: $scope.result.begin.date,
            end: $scope.result.end.date
        });
    }

    $scope.$watch('result.begin.day', function(n, o) {
        $scope.dayOptions.begin = $scope.result.begin.day;
    });
    $scope.$watch('result.end.day', function(n, o) {
        $scope.dayOptions.end = $scope.result.end.day;
    });
    $scope.$watch('selected.day', function(n, o) {
        $scope.dayOptions.selected = $scope.selected.day;
    });

}


function fixMonths($scope) {
    if($scope.month_2col) {
        for(let i = 1; i < $scope.months.length; i += 2) {
            let m1 = $scope.months[i - 1];
            let m2 = $scope.months[i];
            if(m1.days[m1.days.length - 7].month != m1.month
                && m2.days[m2.days.length - 7].month != m2.month) {
                m1.days.splice(m1.days.length - 7);
                m2.days.splice(m2.days.length - 7);
            }
        }
    } else {
        for(let i = 0; i < $scope.months.length; i++) {
            let m1 = $scope.months[i];
            if(m1.days[m1.days.length - 7].month != m1.month) {
                m1.days.splice(m1.days.length - 7);
            }
        }
    }
    $scope.$broadcast('scroll.infiniteScrollComplete');
}
function loadMonths($scope, $element, $ionicScrollDelegate) {
    $scope.weekDayNames = weekDayNames;

    $scope.month_2col = false;
    $scope.$on('modal.shown', function() {
        if($element.width() > 640)
            $scope.month_2col = true;
        fixMonths($scope);
    });
    $scope.months = [];
    let toBottom = $scope.options.toBottom;
    let loadMonthNum = $scope.options.loadMonthNum;
    let begin = $scope.options.beginDate;
    let end = $scope.options.endDate;
    let diff;
    console.info(begin)
    function loadNextMonth() {
        let date;
        if($scope.months.length == 0){
            date = moment(begin).startOf('month');
        }else{
            let last = $scope.months[$scope.months.length - 1];
            date = moment({year: last.year, month: last.month - 1, day: 1});
            date = date.add(1, 'month');
        }
        let caldata = getMonth(date.year(), date.month() + 1);
        $scope.months.push(caldata);
    }

    if(loadMonthNum && typeof loadMonthNum == 'number'){
        diff = loadMonthNum
    }else{
        diff = moment(end).diff(moment(begin), 'months') + 1;
    }
    for(let i = 0;i<diff;i++){
        loadNextMonth();
    }
    if(toBottom){
        $ionicScrollDelegate.scrollBottom();
    }

    //loadNextMonth();

    $scope.loadNextMonth = function() {
        loadNextMonth();
        loadNextMonth();
        fixMonths($scope);
        //$scope.$broadcast('scroll.infiniteScrollComplete');
    }

}