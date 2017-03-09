import { Staff } from 'api/_types/staff/staff';
import { EPlanStatus } from 'api/_types/tripPlan';

export default async function DistributionController($scope, Models, City,CNZZ) {
    require('./statistics.scss');
    API.require("place");
    await API.onload();


    $scope.showPlace = function() {
        $(".staff-phone").hide();
        $(".staff-place").show();
        $("#phone-btn").removeClass('select-button');
        $("#place-btn").addClass('select-button');
    };

    $scope.showPhone = function() {
        $(".staff-place").hide();
        $(".staff-phone").show();
        $("#place-btn").removeClass('select-button');
        $("#phone-btn").addClass('select-button');
    };

    let staff = await Staff.getCurrent();
    let company = staff.company;
    CNZZ.addEvent("查看员工分布地图","查看","查看员工分布地图",company);
    $scope.dateObj = {selectedDate: new Date()};

    $scope.selectDate = async function () {
        $scope.isShowMap = false;

        let date = $scope.dateObj.selectedDate.valueOf();
        let staffTrips: any = await company.getTripPlans({where: {startAt: {$lte: date}, backAt: {$gte: date}, status: EPlanStatus.WAIT_UPLOAD},
            attributes: ["title", "account_id", "arrival_city_code"] , order: ["arrival_city_code"]});

        staffTrips = await Promise.all(staffTrips.map(async (v) => {
            let city = await City.getCity(v.arrivalCityCode);
            let staff = v.account;
            return {name: staff.name, mobile: staff.mobile, reason: v.title, longitude: city.longitude, latitude: city.latitude, cityName: city.name};
        }));

        let markerWidth = 30;
        let markerHeight = 35;
        let markers = staffTrips.map((v) => {
            return { title: v.name, content: v.reason, longitude: v.longitude, latitude: v.latitude, height: markerHeight, width: markerWidth}
        });

        $scope.map = null;
        $scope.loadMap = function(map) {
            $scope.map = map;
        };

        $scope.offlineOpts = {};
        $scope.staffTrips = staffTrips;

        let longitude = 116.404;
        let latitude = 39.915;
        if (markers && markers.length) {
            let stats = {
                longitude: {min:Number.MAX_VALUE, max:Number.MIN_VALUE},
                latitude: {min:Number.MAX_VALUE, max:Number.MIN_VALUE},
            };
            markers.forEach((m)=>{
                if(!m.longitude || !m.latitude)
                    return;
                stats.longitude.min = Math.min(stats.longitude.min, m.longitude);
                stats.longitude.max = Math.max(stats.longitude.max, m.longitude);
                stats.latitude.min = Math.min(stats.latitude.min, m.latitude);
                stats.latitude.max = Math.max(stats.latitude.max, m.latitude);
            })
            if(stats.longitude.min !== Number.MAX_VALUE){
                longitude = (stats.longitude.min+stats.longitude.max)/2;
                latitude = (stats.latitude.min+stats.latitude.max)/2;
            }
        }
        $scope.mapOptions = {
            center: {
                longitude: longitude,
                latitude: latitude
            },
            zoom: 5,
            city: 'BeiJing',
            enableMessage: false,
            markers: markers
        };
        $scope.isShowMap = true;

        $scope.showPlace();
    };

    await $scope.selectDate();

    $scope.moveTo = function(long, lat) {
        if ($scope.map) {
            $scope.map.centerAndZoom(new window['BMap'].Point(long, lat), 5);
        }
    };
}
