import { Staff } from 'api/_types/staff/staff';
import { AccordHotel } from 'api/_types/accordHotel';

var msgbox = require('msgbox');

export async function EditController($scope, Models, $storage, $stateParams, $ionicHistory, $ionicPopup) {
    var staff = await Staff.getCurrent();
    var accordHotel;
    if ($stateParams.accordHotelId) {
        accordHotel = await Models.accordHotel.get($stateParams.accordHotelId);
    }else if($stateParams.cityCode) {
        var accordHotels = await Models.accordHotel.find({where: {companyId: staff.company.id, cityCode: $stateParams.cityCode}});
        if(accordHotels && accordHotels.length >0){
            accordHotel = accordHotels[0];
        }
    }else{
        accordHotel = AccordHotel.create();
        accordHotel.companyId = staff.company.id;
    }
    $scope.accordHotel = accordHotel;

    var accordHotels = await Models.accordHotel.find({where: {companyId: staff.company.id}});

    $scope.city = accordHotel.cityName?{name: accordHotel.cityName}:undefined;
    $scope.isSetCity = function($item){
        for(let city of accordHotels){
            if(city.cityName == $item.name)
                return true;
        }
        return false;
    }
    $scope.placeSelector = {
        query: async function(keyword){
            var places = await API.place.queryPlace({keyword: keyword});
            return places;
        },
        disable: $scope.isSetCity,
        done: function(val) {
            $scope.accordHotel.cityName = val.name;
            $scope.accordHotel.cityCode = val.id;
        }
    };

    $scope.saveAccordHotel = async function () {
        if(!$scope.accordHotel.cityName || !$scope.accordHotel.cityCode){
            msgbox.log("出差地点不能为空");
            return false;
        }
        if(!$scope.accordHotel.accordPrice){
            msgbox.log("协议价格不能为空");
            return false;
        }
        var re = /^[0-9]+.?[0-9]*$/;
        if(!re.test($scope.accordHotel.accordPrice)){
            msgbox.log("协议价格必须为数字");
            return false;
        }
        $scope.accordHotel.company = staff.company;
        await $scope.accordHotel.save();
        $ionicHistory.goBack(-1);
    }

    $scope.deleteAccordHotel = async function (accordHotel) {
        $ionicPopup.show({
            title:'确定要删除该协议酒店吗?',
            scope: $scope,
            buttons:[
                {
                    text: '取消'
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function () {
                        try{
                            await accordHotel.destroy();
                            $ionicHistory.goBack(-1);
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        });
    }
}
