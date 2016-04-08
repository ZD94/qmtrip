/**
 * Created by ZLW on 2016/03/24.
 */
'use strict';

module.exports = (function () {

    var msgbox = require('msgbox');
    //var card = require('../../script/id_validation');
    API.require('tripPlan');
    API.require('auth');
    API.require('attachment');
    API.require('staff');
    API.require('travelBudget');
    API.require('qm_order');

    var exported = {};

    /*
     机票订单详情页
     * @param $scope
     * @constructor
     */

    exported.OrderDetailsController = function ( $scope,$routeParams,$loading ) {

        $loading.end();

        $scope._status = "CANCEL";
        $scope.deliveryAddressShown = false;

        $scope.user;
        $scope.order;

        $scope.time_left = null;//该变量的值为该订单的剩余时间。

        setInterval(function(){//每隔一秒给$scope.time_left重新赋值。
            get_time_left();
            $scope.$apply();
        },1000);

        function get_time_left(){//该函数用于获取剩余时间并给$scope.time_left重新赋值。
            if($scope.order){
                var now = new Date().getTime();
                var deadline = new Date('2016-04-08T08:55:11.000Z').getTime();
                var minutes = ((deadline-now)/1000/60).toFixed(4);
                var seconds = (Number(minutes.split('.')[1])/10000*60).toFixed(0);
                minutes = minutes.split('.')[0];
                seconds = (seconds.length===1)?('0'+seconds):seconds;
                seconds = (seconds==='60')?('00'):seconds;
                $scope.time_left = minutes+' : '+seconds;
            }
        }        

        $scope.toggle = function( params ){
            if( params==="deliveryAddress" ){
                $scope.deliveryAddressShown = ($scope.deliveryAddressShown?false:true);
            };
        }

        $scope.renderStatus = function(){//该函数用于判断并返回订单状态。
            var statuses = {
                CANCEL: '已取消',
                OUT_TICKET: '已出票',
                PAY_FAILED: '已取消',
                PAY_SUCCESS: '支付成功',
                REFUND: '已关闭',
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

        $scope.user;

        $scope.inSelectingMode = false;

        $scope.data = {
            type: '身份证',
            id: null
        }

        $scope.enterSelectingMode = function(){
            $scope.inSelectingMode = true;
        }

        $scope.quitSelectingMode = function(){
            $scope.inSelectingMode = false;
        }

        $scope.select = function (string) {
            if ( string === "身份证" ) {
                $scope.data.type = "身份证";
            } else if ( string === "护照" ) {
                $scope.data.type = "护照";
            };
            $scope.quitSelectingMode();
        }

        $scope.renderTimeLeft = function(){
            var currentTime = new Date();
            console.log( currentTime );
        }
        
        $scope.check_id = function(){
            if(
                /^[1-9]\d{7}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}$/.test($scope.data.id)||
                /^[1-9]\d{5}[1-9]\d{3}((0\d)|(1[0-2]))(([0|1|2]\d)|3[0-1])\d{3}([0-9]|X)$/.test($scope.data.id)
            ){}else{
                msgbox.log('身份证号码无效');
            }
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

        // $(document).ready(function(){
        //     $(".expireDate").mobiscroll().date({//.date() .time() .datetime()
        //         invalid: {
        //             daysOfWeek: [],//[0,1,2,3,4,5]
        //             daysOfMonth: []//['5/1', '12/24', '12/25']
        //         },
        //         theme: 'mobiscroll-qm light',
        //         display: 'bottom',
        //         mode: 'scroller',
        //         dateOrder: 'yy mm dd',
        //         dateFormat: "yyyy-mm-dd",
        //         startYear: "2016",
        //         endYear: "2050",
        //         yearText: "年",
        //         monthText: "月",
        //         dayText: "日",
        //         showNow: false,
        //         nowText: "今天",
        //         setText: "确定",
        //         cancelText: "取消",
        //         rows: 5,
        //         showOnFocus: true,
        //         monthNames: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        //         monthNamesShort: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        //     })
        // });

    }

    exported.AddaddressController = function ($scope) {
    }

    exported.AddresslistController = function ($scope) {
    }

    exported.OrderlistController = function ($scope) {
        API.onload().then(function(){
            API.qm_order.page_qm_orders({})
                .then(function(ret) {
                    var orderlist = ret.items;
                    var orders = [];
                    console.info("#####")
                    orderlist.map(function(detail){
                        return API.qm_order.get_qm_order({order_id:detail})
                            .then(function(order){
                                order.orderstatus = order.STATUS[order.status]
                                orders.push(order);
                                $scope.orders = orders;
                                console.info(order)
                                return order;
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

