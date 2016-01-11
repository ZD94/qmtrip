/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var TravelPolicy=(function(){

    API.require('travelPolicy');

    var  TravelPolicy = {};

    /*
        差旅标准列表
     * @param $scope
     * @constructor
     */
    TravelPolicy.PolicyListController = function($scope) {
        $("title").html("差旅标准");
        var companyId = "d674f130-a236-11e5-8246-c3a1e3bc94c3";
        Myselect();
        $(".left_nav li").removeClass("on").eq(3).addClass("on");

        //获取差旅标准列表
        $scope.initPolicyList = function () {
            loading(false);
            API.onload(function(){
                var params = {};
                var options = {order: [["create_at", "asc"]]};
                options.perPage = 6;
                options.page = $scope.page;
                params.options = options;
                API.travelPolicy.listAndPaginateTravelPolicy(params)
                    .then(function(result){
                        console.info (result);
                        $scope.PolicyTotal = result.total;
                        $scope.PolicyList = result.items;
                        if ($scope.PolicyTotal==0) {
                            $(".create_policy").show();
                        }
                        loading(true);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
        $scope.initPolicyList();


        //增加标准
        $scope.createPolicyShow = function () {
            $scope.resetting();
            $(".create_policy").show();
            $(".update_policy").hide();
            $(".policy_page li").css('opacity','1');
        }
        //增加标准取消
        $scope.createClose = function () {
            $(".create_policy").hide();
            $(".policy_page li").css('opacity','1');
        }
        $scope.createPolicy = function () {
            if ($(".create_policy .Cname").val()=="") {
                Myalert("温馨提示","请填写等级名称");
                return false;
            }
            if ($(".create_policy .CplaneLevel").html()=="请选择仓位") {
                Myalert("温馨提示","请选择飞机仓位");
                return false;
            }
            if ($(".create_policy .CplaneDiscount").html()=="请选择折扣") {
                Myalert("温馨提示","请选择飞机折扣");
                return false;
            }
            if ($(".create_policy .CtrainLevel").html()=="请选择座次") {
                Myalert("温馨提示","请选择火车座次");
                return false;
            }
            if ($(".create_policy .ChotelTevel").html()=="星级标准") {
                Myalert("温馨提示","请选择住宿标准");
                return false;
            }



            API.onload(function(){
                API.travelPolicy.createTravelPolicy({
                        name:$(".create_policy .Cname").val(),
                        planeLevel:$(".create_policy .CplaneLevel").html(),
                        planeDiscount:$(".create_policy .CplaneDiscount").attr('selectValue'),
                        trainLevel:$(".create_policy .CtrainLevel").html().replace('/',','),
                        isChangeLevel:$(".create_policy .Ccheckbox").is(':checked'),
                        hotelLevel:$(".create_policy .ChotelTevel").html().replace('/',','),
                        hotelPrice:$(".create_policy .ChotelPrice").val(),
                        companyTd:companyId
                    })
                    .then(function(result){
                        Myalert("温馨提示","增加成功");
                        $scope.initPolicyList();
                        $(".create_policy").hide();
                        console.info (result);
                    })
                    .catch(function(err){
//                        Myalert("温馨提示","内容不完整，请重新填写");
                        Myalert("温馨提示", err.msg);
                        console.info (err);
                    });
            })
        }


        //删除标准
        $scope.deletePolicy = function (id,name) {
//            Myalert("温馨提示","删除成功");
            API.onload(function(){
                API.travelPolicy.deleteTravelPolicy({id:id})
                    .then(function(result){
                        Myalert("温馨提示","删除&nbsp;<span>'"+name+"'&nbsp;</span>成功");
                        $scope.initPolicyList();
                        console.info (result);
                    })
                    .catch(function(err){
                        Myalert("温馨提示",err.msg);
                        console.info (err);
                    });
            })
        }


        //修改标准
        $scope.updatePolicyShow = function (id,index) {
            $scope.updateId = id;
            if (index == 0  || index == 6) {
                $(".update_policy").css({'top':'10px','left':'0px'});
            }
            else if (index == 1  || index == 7) {
                $(".update_policy").css({'top':'10px','left':'505px'});
            }
            else if (index == 2  || index == 8) {
                $(".update_policy").css({'top':'230px','left':'0px'});
            }
            else if (index == 3  || index == 9) {
                $(".update_policy").css({'top':'230px','left':'505px'});
            }
            else if (index == 4  || index == 10) {
                $(".update_policy").css({'top':'450px','left':'0px'});
            }
            else if (index == 5  || index == 11) {
                $(".update_policy").css({'top':'450px','left':'505px'});
            }
            var obj = {0:"全价",8:"最高8折",7:"最高7折",6:"最高6折",5:"最高5折",4:"最高4折"};
            var discountTxt = $scope.PolicyList[index].planeDiscount;
            $(".update_policy .Cname").val($scope.PolicyList[index].name);
            $(".update_policy .CplaneLevel").html($scope.PolicyList[index].planeLevel);
            $(".update_policy .CplaneDiscount").html(obj[discountTxt]).attr("selectValue",discountTxt);
            $(".update_policy .CtrainLevel").html($scope.PolicyList[index].trainLevel);
            $(".update_policy .Ccheckbox").attr('checked',$scope.PolicyList[index].isChangeLevel);
            $(".update_policy .ChotelTevel").html($scope.PolicyList[index].hotelLevel);
            $(".update_policy .ChotelPrice").val($scope.PolicyList[index].hotelPrice);
            if ($scope.PolicyList[index].isChangeLevel==true) {
                $(" .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".Ccheckboxlabel").html('');
            }
            $(".update_policy").show();
            $(".create_policy").hide();
            $(".policy_page li").css('opacity','0.2');
        }
        //修改标准取消
        $scope.updateClose = function () {
            $(".update_policy").hide();
            $(".policy_page li").css('opacity','1');
        }
        $scope.updatePolicy = function () {
            API.onload(function(){
                API.travelPolicy.updateTravelPolicy({
                    id:$scope.updateId,
                    name:$(".update_policy .Cname").val(),
                    planeLevel:$(".update_policy .CplaneLevel").html(),
                    planeDiscount:$(".update_policy .CplaneDiscount").attr('selectValue'),
                    trainLevel:$(".update_policy .CtrainLevel").html(),
                    isChangeLevel:$(".update_policy .Ccheckbox").is(':checked'),
                    hotelLevel:$(".update_policy .ChotelTevel").html(),
                    hotelPrice:$(".update_policy .ChotelPrice").val(),
                    companyTd:companyId
                })
                    .then(function(result){
                        Myalert("温馨提示","修改成功");
                        $scope.initPolicyList();
                        $(".update_policy").hide();
                        $(".policy_page li").css('opacity','1');
                        console.info (result);
                    })
                    .catch(function(err){
                        Myalert("温馨提示","内容不完整，请重新填写");
                        console.info (err);
                    });
            })
        }


        //重置
        $scope.resetting = function () {
            $(".Cname").val("");
            $(".CplaneLevel").html("不限");
            $(".CplaneDiscount").html("不限").attr("selectValue","0");
            $(".CtrainLevel").html("不限");
            $(".Ccheckbox").attr('checked',false);
            $(".Ccheckboxlabel").html('');
            $(".ChotelTevel").html("不限");
            $(".ChotelPrice").val("");
        }

        //修改自定义复选框
        $scope.updateChangecheck = function () {
            if ($(".update_policy .Ccheckbox").is(':checked')==false) {
                $(".update_policy .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".update_policy .Ccheckboxlabel").html('');
            }
        }
        //创建自定义复选框
        $scope.createChangecheck = function () {
            if ($(".create_policy .Ccheckbox").is(':checked')==false) {
                $(".create_policy .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".create_policy .Ccheckboxlabel").html('');
            }
        }



        //分页
        $scope.pagination = function () {
            if ($scope.PolicyTotal) {
                $.jqPaginator('#pagination', {
                    totalCounts: $scope.PolicyTotal,
                    pageSize: 6,
                    currentPage: 1,
                    prev: '<li class="prev"><a href="javascript:;">上一页</a></li>',
                    next: '<li class="next"><a href="javascript:;">下一页</a></li>',
                    page: '<li class="page"><a href="javascript:;">{{page}}</a></li>',
                    onPageChange: function (num) {
                        $scope.page = num;
                        $scope.initPolicyList();
                    }
                });
                clearInterval (pagenum);
            }
        }
        var pagenum =setInterval($scope.pagination,1000);
    }

    return TravelPolicy;
})();

module.exports = TravelPolicy;