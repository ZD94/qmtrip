import { Staff } from 'api/_types/staff/staff';
import { EPlanStatus } from 'api/_types/tripPlan';

export default async function DistributionController($scope, Models) {
    require('../trip-approval/trip-approval.scss');
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

    $scope.dateObj = {selectedDate: new Date()};

    $scope.selectDate = async function () {
        $scope.isShowMap = false;

        let date = $scope.dateObj.selectedDate.valueOf();
        let staffTrips: any = await company.getTripPlans({where: {startAt: {$lte: date}, backAt: {$gte: date}, status: EPlanStatus.WAIT_UPLOAD},
            attributes: ["title", "account_id", "arrival_city_code"] , order: ["arrival_city_code"]});

        staffTrips = await Promise.all(staffTrips.map(async (v) => {
            let city = await API.place.getCityInfo({cityCode: v.arrivalCityCode});
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
            longitude = markers[0].longitude;
            latitude = markers[0].latitude;
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