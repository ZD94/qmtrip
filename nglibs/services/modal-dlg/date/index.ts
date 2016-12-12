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
        'y2015': {
            "d0101": 2, "d0102": 2, "d0103": 2, "d0104": 1,
            "d0215": 1, "d0218": 2, "d0219": 2, "d0220": 2, "d0221": 2, "d0222": 2, "d0223": 2, "d0224": 2, "d0228": 1,
            "d0404": 2, "d0405": 2, "d0406": 2,
            "d0501": 2, "d0502": 2, "d0503": 2,
            "d0620": 2, "d0621": 2, "d0622": 2,
            "d0903": 2, "d0904": 2, "d0905": 2, "d0906": 1,
            "d0926": 2, "d0927": 2,
            "d1001": 2, "d1002": 2, "d1003": 2, "d1004": 2, "d1005": 2, "d1006": 2, "d1007": 2, "d1008": 2, "d1010": 1,
        },
        'y2016': {
            "d0101": 2, "d0102": 2, "d0103": 2, //元旦
            "d0206": 1, "d0207": 2, "d0208": 2, "d0209": 2, "d0210": 2, "d0211": 2, "d0212": 2, "d0213": 2, "d0214": 1, //春节
            "d0402": 2, "d0403": 2, "d0404": 2, //清明
            "d0430": 2, "d0501": 2, "d0502": 2, //五一
            "d0609": 2, "d0610": 2, "d0611": 2, "d0612": 1, //端午
            "d0915": 2, "d0916": 2, "d0917": 2, "d0918": 1, //中秋
            "d1001": 2, "d1002": 2, "d1003": 2, "d1004": 2, "d1005": 2, "d1006": 2, "d1007": 2, "d1008": 1, "d1009": 1, //十一
            "d1231": 2, //元旦
        },
        'y2017': {
            "d0101": 2, "d0102": 2, //元旦
            "d0122": 1, "d0127": 2, "d0128": 2, "d0129": 2, "d0130": 2, "d0131": 2, "d0201": 2, "d0202": 2, "d0204": 1, //春节
            "d0401": 1, "d0402": 2, "d0403": 2, "d0404": 2, //清明
            "d0429": 2, "d0430": 2, "d0501": 2, //五一
            "d0527": 1, "d0528": 2, "d0529": 2, "d0530": 2, //端午
            "d0930": 1, "d1001": 2, "d1002": 2, "d1003": 2, "d1004": 2, "d1005": 2, "d1006": 2, "d1007": 2, "d1008": 2, //十一 中秋
        }
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
    flags: {
        [key:string]: boolean;
    };
}

interface MonthData {
    year: number;
    month: number;
    days: DayData[];
}

let monthCache = [];

function getMonth(year, month): MonthData {
    let key = year+'-'+month;
    if(monthCache[key])
        return monthCache[key];
    let ret = {year, month, days: []};
    let caldata = LunarCalendar.calendar(year, month, true);
    if(caldata.monthData[caldata.monthData.length-7].month != month){
       caldata.monthData.splice(caldata.monthData.length-7);
    }
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
            label: '',
            flags: {},
        }
    });
    for(let i=0;i<ret.days.length;i++){
        let day = ret.days[i];
        let w = i%7;
        day.flags.notthismonth = day.month != ret.month;
        if(w==0 || w==6)
            day.flags.weekend = true;
        if(day.worktime == 1){
            day.flags.workday = true;
        } else if(day.worktime == 2){
            day.flags.restday = true;
        }
        if(day.festival){
            day.flags.festival = true;
            day.label = day.festival;
        }
        else if(day.term){
            day.flags.term = true;
            day.label = day.term;
        }
        else{
            day.flags.lunar = true;
            day.label = day.lunar;
        }
    }
    monthCache[key] = ret;
    return ret;
}

angular
    .module('nglibs')
    .directive('ngSelectorDateMonth', function() {
        return {
            template: require('./date-month.html'),
            scope: {
                month: '=ngModal',
                options: '<ngDateOptions',
                selectDay: '<ngSelectDay',
            },
            controller: selectorDateMonthController
        }
    })
    .directive('ngSelectorDateDay', function() {
        return {
            template: require('./date-day.html'),
            scope: {
                day: '=ngModal',
                options: '<ngDateOptions',
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
function getWeeks(month){
    let weeks = []
    let weekcount = month.days.length/7;
    for(let w=0; w<weekcount; w++){
        let week = [];
        for(let d=0; d<7; d++){
            let day = month.days[w*7+d];
            week.push(day);
        }
        weeks.push(week);
    }
    return weeks;
}

function selectorDateMonthController($scope){
    $scope.weeks = getWeeks($scope.month);
    $scope.$watch('month.days.length', function(o, n){
        if(o == n)
            return;
        $scope.weeks = getWeeks($scope.month);
    })
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

let t0;
function log_time(desc){
    let t1 = Date.now();
    console.info('time log:', t1-t0, desc);
}
function calendarController($scope, $element, value, $ionicScrollDelegate){
    t0 = Date.now();
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

    let today = moment().startOf('day').valueOf();
    $scope.dayOptions = {
        valid: $scope.valid,
        today: today,
        selected: today,
        begin: 0,
        end: 0,
    };
    initLunarCalendar();
    log_time('initLunarCalendar');

    loadMonths($scope, $element, $ionicScrollDelegate);
    log_time('loadMonths');

    log_time('calendarController');
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
    for(let i = 0; i < $scope.months.length; i++) {
        let m1 = $scope.months[i];
        if(m1.days[m1.days.length - 7].month != m1.month) {
            m1.days.splice(m1.days.length - 7);
        }
    }
    $scope.$broadcast('scroll.infiniteScrollComplete');
}

function updateDayFlags(day, options) {
    day.flags.expired = checkExpired(day.timestamp, options.valid);
    day.flags.selected = day.timestamp == options.selected;
    day.flags.begin = day.timestamp == options.begin;
    day.flags.span = options.begin < day.timestamp && day.timestamp < options.end;
    day.flags.end = day.timestamp == options.end;
}
function updateMonthFlags(month, options) {
    for(let day of month.days)
        updateDayFlags(day, options);
}
function loadMonths($scope, $element, $ionicScrollDelegate) {
    $scope.weekDayNames = weekDayNames;

    $scope.month_2col = false;
    $scope.$on('modal.shown', function() {
        if($element.width() > 640)
            $scope.month_2col = true;
        //fixMonths($scope);
        $scope.$broadcast('scroll.infiniteScrollComplete');

    });
    $scope.months = [];
    $scope.$watchGroup([
        'dayOptions.selected',
        'dayOptions.begin',
        'dayOptions.end',
    ], function(n, o){
        for(let month of $scope.months)
            updateMonthFlags(month, $scope.dayOptions);
    });

    let begin = moment($scope.options.beginDate).startOf('month');
    let valDate: any = $scope.value || new Date();
    if(valDate.begin)
        valDate = valDate.begin;
    let end = moment(valDate).startOf('month');
    if(begin.diff(end) > 0)
        end = begin;

    for(let m = begin.clone(); m.diff(end) <= 0; m.add(1, 'month')){
        let caldata = getMonth(m.year(), m.month() + 1);
        updateMonthFlags(caldata, $scope.dayOptions);
        $scope.months.push(caldata);
    }
    if($scope.months.length % 2 == 1){
        loadNextMonth();
    }

    function hasMoreMonths(){
        let last = $scope.months[$scope.months.length - 1];
        let date = moment({year: last.year, month: last.month - 1, day: 1});
        return date.diff($scope.options.endDate) < 0;
    }
    $scope.hasMoreMonths = hasMoreMonths();

    function loadNextMonth() {
        let last = $scope.months[$scope.months.length - 1];
        let date = moment({year: last.year, month: last.month - 1, day: 1});
        date.add(1, 'month');
        let caldata = getMonth(date.year(), date.month() + 1);
        updateMonthFlags(caldata, $scope.dayOptions);
        $scope.months.push(caldata);
        $scope.hasMoreMonths = hasMoreMonths();
    }

    let unregShow = $scope.$on('modal.shown', function(){
        log_time('modal.shown');
        let pos = $element.find('.selected').parents('.ng-modal-select-date-month-element').position();
        $ionicScrollDelegate.scrollTo(0, pos.top);
        unregShow();
    })

    //loadNextMonth();

    $scope.loadNextMonth = function() {
        loadNextMonth();
        loadNextMonth();
        //fixMonths($scope);
        $scope.$broadcast('scroll.infiniteScrollComplete');
    }

}