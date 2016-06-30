/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var travelRecord=(function(){

    API.require('agencyTripPlan');
    API.require('tripPlan');
    API.require("staff");
    API.require("company");


    var  travelRecord = {};

    /*
        出差单列表
     * @param $scope
     * @constructor
     */
    travelRecord.TravelListController = function($scope, $loading, Models, $stateParams) {
        var status = $stateParams.status;
        $("title").html("出差单列表");
        $scope.status = status || 'all';
        $scope.pager;
        $scope.tripPlans = [];
        $scope.init = function(status) {
          if (status == $scope.status ) return;
          if (status) { $scope.status = status;}
          var where = {};
          if (status == 'no_budget') {
            where.status = -1;
          } else if (status == 'wait_approve') {
            where.status = 0;
          }
          Models.tripPlan.find({where: where})
            .then(function(pager) {
              $scope.pager = pager;
              return Promise.all(pager.map( (item)=> {
                  return item.getCompany()
                    .then(function(company) {
                      item.company = company;
                      return item;
                    })
              }));
            })
            .then(function(tripPlans) {
              $scope.tripPlans = tripPlans;
            })
            .catch(TLDAlert).done();
        }

        $scope.nextPage = function() {
          $scope.pager = $scope.pager.nextPage();
        }

        $scope.init(status);
    }

    /*
     出差单详细
     * @param $scope
     * @constructor
     */
    travelRecord.TravelDetailController = function($scope, $stateParams, $location, $anchorScroll, Models) {
        $("title").html("出差单明细");
        var orderId = $stateParams.orderId;
      $scope.showInvoiceFailDialog = false;
      $scope.showInvoicePassDialog = false;
      $scope.curTripDetail = null;
      $scope.expenditure = '';

      $scope.init = function() {
          Models.tripPlan.get(orderId)
            .then(function(tripPlan) {
              $scope.tripPlan = tripPlan;
              //获取出差预算列表
              return tripPlan.getTripDetails({where: {}})
                .then(function(tripDetails) {
                  console.info(tripDetails)
                  //对出差单进行排序,按照类型
                  tripDetails.sort(function(v1, v2) {
                    if (v1.type == 0) return -1;
                    if (v2.type == 0) return 1;
                    if (v1.type == 2) return -1;
                    if (v2.type == 2) return 1;
                    if (v1.type == 1) return -1;
                    if (v2.type == 1) return 1;
                    return v1.type <= v2.type;
                  });
                  $scope.tripDetails = tripDetails;
                })
            })
            .catch(TLDAlert).done();
        }
        $scope.init();

        //默认不显示审批对话框

        $scope.showInvoice = function(tripDetailId) {
          Models.tripDetail.get(tripDetailId)
            .then(function(tripDetail) {
              if (tripDetail.invoice && typeof tripDetail.invoice == 'string') {
                tripDetail.invoice = JSON.parse(tripDetail.invoice);
              }
              $scope.curTripDetail = tripDetail;
              $scope.curTripDetailInoviceImg = '/consume/invoice/' + tripDetail.id;
              return tripDetail;
            })
            .catch(TLDAlert).done();
        }

        $scope.closePassFailDialog = function() {
          $scope.showInvoicePassFailDialog = false;
        };
        $scope.invoiceNopassShow = function(tripDetailId) {
          $scope.showInvoicePassDialog = false;
          $scope.showInvoicePassFailDialog = true;
        }


        //审批通过
        $scope.invoicePassShow = function(tripDetailId) {
          $scope.showInvoicePassFailDialog = false;
          $scope.showInvoicePassDialog = true;
        }
        //关闭审批通过对话框
        $scope.closePassDialog = function() {
          $scope.showInvoicePassDialog = false;
        }

        $scope.invoicePass = function() {
          console.info($scope.expenditure)
          if (!$scope.expenditure || !/^\d+(\.\d{1,2})?$/.test($scope.expenditure)) {
            alert("实际花费格式不正确");
            return false;
          }

          if (confirm("确实要通过审核吗?")) {
            $scope.curTripDetail.status = 1;
            $scope.curTripDetail.expenditure = $scope.expenditure;
            $scope.curTripDetail.save();
            $scope.closePassDialog();
          }
        }

        // $scope.initTravelDetail = function () {
        //     API.onload(function() {
        //         API.agencyTripPlan.getTripPlan({id: orderId})
        //             .then(function(result){
        //                 console.info (result);
        //                 var outTraffic = result.outTraffic[0];
        //                 var backTraffic = result.backTraffic[0];
        //                 var hotel = result.hotel[0];


        //                 $scope.planDetail = result;
        //                 $scope.outTraffic = $scope.planDetail.outTraffic[0];
        //                 $scope.backTraffic = $scope.planDetail.backTraffic[0];
        //                 $scope.hotel = $scope.planDetail.hotel[0];
        //                 //console.info("执行到A==>", hotel, backTraffic, outTraffic);

        //                 var outTraffics = $scope.planDetail.outTraffic;
        //                 var backTraffics = $scope.planDetail.backTraffic;
        //                 var hotels = $scope.planDetail.hotel;

        //                 if (hotel && hotel.newInvoice) {
        //                     $scope.hotelInvoiceImg = "/consume/invoice/" + hotel.id;
        //                 }

        //                 if (backTraffic && backTraffic.newInvoice) {
        //                     $scope.backTrafficInvoiceImg = "/consume/invoice/" + backTraffic.id;
        //                 }

        //                 if (outTraffic && outTraffic.newInvoice) {
        //                     $scope.outTrafficInvoiceImg = "/consume/invoice/" + outTraffic.id;
        //                 }

        //                 outTraffic = outTraffics.map(function(outTraffic){
        //                     if(!outTraffic.newInvoice) {
        //                         return outTraffic;
        //                     }

        //                     return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: outTraffic.id})
        //                         .then(function(invoiceImg){
        //                             outTraffic.invoiceImg = invoiceImg;

        //                             if(!outTraffic.auditUser){
        //                                 return outTraffic;
        //                             }

        //                             return API.agency.getAgencyUser(outTraffic.auditUser)
        //                                 .then(function(auditName) {
        //                                     outTraffic.auditName = auditName;
        //                                     return outTraffic
        //                                 })
        //                         })

        //                 });

        //                 backTraffics = backTraffics.map(function(backTraffic){
        //                     if(!backTraffic.newInvoice) {
        //                         return backTraffic;
        //                     }

        //                     return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: backTraffic.id})
        //                         .then(function(invoiceImg){
        //                             backTraffic.invoiceImg = invoiceImg;

        //                             if(!backTraffic.auditUser){
        //                                 return backTraffic;
        //                             }

        //                             return API.agency.getAgencyUser(backTraffic.auditUser)
        //                                 .then(function(auditName) {
        //                                     backTraffic.auditName = auditName;
        //                                     return backTraffic
        //                                 })
        //                         })

        //                 });

        //                 hotels = hotels.map(function(hotel){
        //                     if(!hotel.newInvoice) {
        //                         return hotel;
        //                     }

        //                     return API.agencyTripPlan.getConsumeInvoiceImg({consumeId: hotel.id})
        //                         .then(function(invoiceImg){
        //                             hotel.invoiceImg = invoiceImg;

        //                             if(!hotel.auditUser){
        //                                 return hotel;
        //                             }

        //                             return API.agency.getAgencyUser(hotel.auditUser)
        //                                 .then(function(auditName) {
        //                                     hotel.auditName = auditName;
        //                                     return hotel
        //                                 })
        //                         })

        //                 });

        //                 Promise.all(hotels)
        //                     .then(function(hotels) {
        //                         $scope.hotels = hotels;
        //                     })
        //                     .catch(function(err) {
        //                         console.info("hotels");
        //                         console.info(err);
        //                         TLDAlert(err.msg || err);
        //                     })

        //                 Promise.all(outTraffics)
        //                     .then(function(outTraffics) {
        //                         $scope.outTraffics = outTraffics;
        //                         console.info(outTraffics);
        //                     })
        //                     .catch(function(err) {
        //                         console.info("outTraffics");
        //                         console.info(err);
        //                         TLDAlert(err.msg || err);
        //                     })

        //                 Promise.all(backTraffics)
        //                     .then(function(backTraffics) {
        //                         $scope.backTraffics = backTraffics;
        //                     })
        //                     .catch(function(err) {
        //                         console.info("backTraffics");
        //                         console.info(err);
        //                         TLDAlert(err.msg || err);
        //                     })

        //                 API.staff.getStaff({id:$scope.planDetail.accountId, companyId: $scope.planDetail.companyId})
        //                     .then(function(result){
        //                         $scope.travelerName = result.name;
        //                     })
        //             })
        //     })
        // }
        // $scope.initTravelDetail();


        // $scope.outTraffichref = function () {
        //     $location.hash('outTraffic');
        //     $anchorScroll();

        // }
        // $scope.hotelhref = function () {
        //     $location.hash('hotel');
        //     $anchorScroll();

        // }
        // $scope.backTraffichref = function () {
        //     $location.hash('backTraffic');
        //     $anchorScroll();
        // }


        // //审核通过
        // $scope.invoicePassShow = function (status) {
        //     if (status=='outTraffic') {
        //         $scope.consumeId = $scope.outTraffic.id;
        //     }
        //     else if (status=='hotel') {
        //         $scope.consumeId = $scope.hotel.id;
        //     }
        //     else if (status=='backTraffic') {
        //         $scope.consumeId = $scope.backTraffic.id;
        //     }
        //     $('.error').empty();
        //     $(".expenditure").val("");
        //     $(".invoicePass").show();
        // }
        // $scope.invoicePass = function () {
        //     var moneyReg = /^\d+(.\d{1,2})?$/;
        //     $scope.expenditure = $(".expenditure").val();
        //     $('.error').empty();
        //     if ($scope.expenditure=='') {
        //         $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出不能为空");
        //         return false;
        //     }
        //     if (!moneyReg.test($scope.expenditure)) {
        //         $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>实际支出格式不正确");
        //         return false;
        //     }
        //     API.onload(function() {
        //         API.agencyTripPlan.approveInvoice({
        //             userId:$scope.planDetail.accountId,
        //             consumeId:$scope.consumeId,
        //             expenditure:$scope.expenditure,
        //             status:1
        //         })
        //             .then(function(result){
        //                 $(".success").show();
        //                 $(".success_text").html('票据审核通过，实际支出为¥'+$scope.expenditure);
        //                 $scope.initTravelDetail();
        //             })
        //             .catch(function(err){
        //                 TLDAlert(err.msg || err);
        //             })
        //     })
        // }
        // //审核未通过
        // $scope.invoiceNopassShow = function (status) {
        //     if (status=='outTraffic') {
        //         $scope.consumeId = $scope.outTraffic.id;
        //     }
        //     else if (status=='hotel') {
        //         $scope.consumeId = $scope.hotel.id;
        //     }
        //     else if (status=='backTraffic') {
        //         $scope.consumeId = $scope.backTraffic.id;
        //     }
        //     $('.error').empty();
        //     $(".expenditure").val("");
        //     $(".remark").val("");
        //     $(".invoiceNoPass").show();
        // }


        // var reason1 = "",
        //     reason2 = "";
        // $scope.checkreason1 = function () {
        //     $(".reason1 i").toggleClass("check");
        //     reason1 = $(".reason1 .check").next().html();
        // }
        // $scope.checkreason2 = function () {
        //     $(".reason2 i").toggleClass("check");
        //     reason2 = $(".reason2 .check").next().html();
        // }
        // $scope.invoiceNoPass = function () {
        //     var reasontext = $(".invoiceNoPass .remark").val();

        //     var reason = reason1;

        //     if(reason2 != '' && reason2!= undefined) {
        //         reason==''?reason = reason2: reason += ','+reason2;
        //     }

        //     if(reasontext != ''&& reasontext!= undefined) {
        //         reason==''?reason = reasontext: reason += ','+reasontext;
        //     }

        //     $scope.remark = reason;
        //     console.info(reason1,reason2,reasontext);
        //     $('.error').empty();
        //     if (reason1 =='' && reason2 == '' && reasontext == '') {
        //         $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>理由不能为空");
        //         return false;
        //     }
        //     API.onload(function() {
        //         console.info($scope.remark);
        //         API.agencyTripPlan.approveInvoice({
        //             userId:$scope.planDetail.accountId,
        //             consumeId:$scope.consumeId,
        //             remark:$scope.remark,
        //             status:-1
        //         })
        //             .then(function(result){
        //                 $(".invoicePass,.invoiceNoPass").hide();
        //                 $(".reason1 i,.reason2 i").removeClass("check");
        //                 reason1 = '';
        //                 reason2 = '';
        //                 reasontext = '';
        //                 $scope.initTravelDetail();
        //             })
        //             .catch(function(err){
        //                 TLDAlert(err.msg || err);
        //             })
        //     })
        // }


        // //录入预算
        // $scope.editBudgetShow = function (id) {
        //     $scope.editBudgetId = id;
        //     $('.error').empty();
        //     $(".budget").val("");
        //     $(".editBudget").show();
        // }
        // $scope.editBudget = function () {
        //     var budget = $(".editBudget .budget").val();
        //     var moneyReg = /^\d+(.\d{1,2})?$/;
        //     $('.error').empty();
        //     if (budget=='') {
        //         $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>预算不能为空");
        //         return false;
        //     }
        //     if (!moneyReg.test(budget)) {
        //         $('.error').html("<span class='web-icon-font' style='font-size: 15px;'>&#xf06a;&nbsp;</span>预算格式不正确");
        //         return false;
        //     }
        //     API.onload(function() {
        //         API.agencyTripPlan.editTripPlanBudget({
        //             consumeId:$scope.editBudgetId,
        //             budget:budget
        //         })
        //             .then(function(result){
        //                 $(".invoicePass,.invoiceNoPass,.editBudget").hide();
        //                 $scope.initTravelDetail();
        //             })
        //             .catch(function(err){
        //                 TLDAlert(err.msg || err);
        //             })
        //     })
        // }

        // //关闭弹窗
        // $scope.invoiceColse = function () {
        //     $(".invoicePass,.invoiceNoPass,.editBudget").hide();
        //     $(".reason1 i,.reason2 i").removeClass("check");
        //     reason1 = "";
        //     reason2 = "";
        //     $(".remark").val('');
        // }
    }



    return travelRecord;
})();

module.exports = travelRecord;