/**
 * Created by ZLW on 2016/03/24.
 */
'use strict';

module.exports = (function () {

    var msgbox = require('msgbox');
    //var id_validation = require('../../script/id_validation');
    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');
    API.require('travelBudget');
    API.require('qm_order');
    API.require('mailingAddress');

    var exported = {};

    /*
     机票订单详情页
     * @param $scope
     * @constructor
     */

    exported.OrderDetailsController = function ( $scope,$routeParams,$loading ) {

        $loading.end();

        $scope._status = "WAIT_PAY";

        $scope.user;
        $scope.order;

        //settings
        $scope.deliveryAddressShown = false;

        $scope.toggle = function( params ){
            if( params==="deliveryAddress" ){
                $scope.deliveryAddressShown = ($scope.deliveryAddressShown?false:true);
            };
        }

        $scope.renderStatus = function(){//该函数用于判断并返回订单状态。
            var statuses = {
                CANCEL: '已取消',
                OUT_TICKET: '已出票',
                PAY_FAILED: '支付失败',
                PAY_SUCCESS: '支付成功',
                REFUND: '已退款',
                REFUNDING: '退款中',
                WAIT_PAY: '待支付',
                WAIT_TICKET: '待出票'
            };
            return $scope.order?statuses[ $scope.order.status ]:'';
        }

        $scope.renderPercentage = function(){//该函数用于计算并以“98%”的格式返回准点率。
            return $scope.order?( $scope.order.punctual_rate*100+'%' ):'';
        }

        $scope.renderDay = function(){
            var day = ['周日','周一','周二','周三','周四','周五','周六'];
            return (
                $scope.order?
                day[new Date($scope.order.flight_list.departure_date).getDay()]
                :
                null
            );
        }

        // $scope.renderTimeSpan = function(){//该函数用于计算并以“10时10分”的格式返回这次飞行所需的时间。
        //     if($scope.order){
        //         var departure_time = new Date( $scope.order.start_time ).getTime();
        //         var arrival_time = new Date( $scope.order.end_time ).getTime();
        //         var time_span = (arrival_time - departure_time)/1000;
        //         return time_span;
        //     };
        // }

        $scope.showInfo = function(){
            msgbox.alert( $scope.order.ticket_info.tpgd, '确定' );
        }

        $scope.delete = function(){
            msgbox.confirm( '订单一经删除则无法恢复，确认删除吗？','确认删除','取消' );
        }

        API.onload( function(){
            console.log( API.staff,API.qm_order );
            
            $scope.user = API.staff
                .getCurrentStaff()
                .then( function(data){
                    console.log(data);
                    
                    console.log( $scope.user.name );
                })
                .catch(function (err) {
                    TLDAlert(err.msg || err)
                });
            
            API.qm_order
                .get_qm_order( {order_id:'e9fd90c0-fb07-11e5-b602-a384e706e5f0'} )
                .then( function(data){
                    $scope.order = data;
                    console.log( data );
                })
                .catch(function (err) {
                    TLDAlert(err.msg || err)
                });

        });

    }

    exported.InfoEditingController = function ($scope, $routeParams) {
        //console.log( id_validation('370683198909072254').isValid() );

        $scope.user;

        $scope.IDType = "身份证";

        $scope.enterSelectingMode = function(){
            $(".veil").show();
            $(".options").show();
        }

        $scope.quitSelectingMode = function(){
            $(".veil").hide();
            $(".options").hide();
        }

        $scope.select = function (string) {
            if ( string === "身份证" ) {
                $scope.IDType = "身份证";
            } else if ( string === "护照" ) {
                $scope.IDType = "护照";
            };
            $scope.quitSelectingMode();
        }

        $scope.renderTimeLeft = function(){
            var currentTime = new Date();
            console.log( currentTime );
        }
        
        API.onload( function(){
            console.log( API.staff,API.qm_order );
            
            API.staff
                .getCurrentStaff()
                .then( function(data){
                    console.log(data);
                    $scope.user = data;
                    console.log( $scope.user.name );
                })
                .catch(function (err) {
                    TLDAlert(err.msg || err)
                });

        });

        $(document).ready(function(){
            $(".expireDate").mobiscroll().date({//.date() .time() .datetime()
                invalid: {
                    daysOfWeek: [],//[0,1,2,3,4,5]
                    daysOfMonth: []//['5/1', '12/24', '12/25']
                },
                theme: 'mobiscroll-qm light',
                display: 'bottom',
                mode: 'scroller',
                dateOrder: 'yy mm dd',
                dateFormat: "yyyy-mm-dd",
                startYear: "2016",
                endYear: "2050",
                yearText: "年",
                monthText: "月",
                dayText: "日",
                showNow: false,
                nowText: "今天",
                setText: "确定",
                cancelText: "取消",
                rows: 5,
                showOnFocus: true,
                monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
                monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
            })
        });

    }

    exported.AddaddressController = function ($scope) {

        $scope.people = {
            name : '',
            mobile : '',
            //area : '',
            //address : ''
        }

        $scope.area = '';
        $scope.address = '';

        //$scope.check_passed = ($scope.people.name.length > 0 && $scope.people.mobile.length > 0 && $scope.area.length > 0 && $scope.address.length > 0);
        //$scope.un_passed = ($scope.people.name.length == 0 || $scope.people.mobile.length == 0 || $scope.area.length == 0 || $scope.address.length == 0);
        //$scope.$watchGroup(['people.email', 'people.mobile', 'area', 'address'], function(){
        //    $scope.check_passed = ($scope.people.name.length > 0 && $scope.people.mobile.length > 0 && $scope.area.length > 0 && $scope.address.length > 0);
        //    $scope.un_passed = ($scope.people.name.length == 0 || $scope.people.mobile.length == 0 || $scope.area.length == 0 || $scope.address.length == 0);
        //})

        $scope.clear_text = function($event) {
            //$($event.target).siblings('textarea').val('');
            $scope.address = '';
        }

        $scope.save = function() {
            API.onload( function(){
                API.mailingAddress.createMailingAddress({name:$scope.people.name,mobile:$scope.people.mobile,area:$scope.area,address:$scope.address})
                    .then(function(){

                    })
                    .catch(function (err) {
                        TLDAlert(err.msg || err);
                    });
            })
        }

    }

    exported.AddresslistController = function ($scope) {
    }

    exported.OrderlistController = function ($scope) {
        API.onload().then(function(){
            API.qm_order.page_qm_orders({})
                .then(function(ret) {
                    var orderlist = ret.items;
                    orderlist.map(function(detail){
                        return API.qm_order.get_qm_order({order_id:detail.id})
                            .then(function(detail){
                                console.info(detail);
                                console.info(detail.STATUS[detail.status]);
                            })
                            .catch(function(err){
                                console.info(err);
                            })
                    })
                })
            
        });
    }
    return exported;
})();

