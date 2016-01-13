/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var TravelPolicy=(function(){

    API.require('travelPolicy');
    API.require("staff");

    var  TravelPolicy = {};

    /*
        差旅标准列表
     * @param $scope
     * @constructor
     */
    TravelPolicy.PolicyListController = function($scope) {
        $("title").html("差旅标准");
        Myselect();
        $(".left_nav li").removeClass("on").eq(3).addClass("on");

        API.onload(function(){
            API.staff.getCurrentStaff()
                .then(function(ret){
                    $scope.company_id = ret.companyId;
                    $scope.$apply();
                })
                .catch(function(err){
                    console.info(err)
                })
        })

        //获取差旅标准列表
        $scope.initPolicyList = function () {
            loading(false);
            API.onload(function(){
                var params = {};
                var options = {order: [["create_at", "asc"]]};
                options.perPage = 100;
                params.options = options;
                API.travelPolicy.listAndPaginateTravelPolicy(params)
                    .then(function(result){
                        console.info (result);
                        $scope.PolicyTotal = result.total;
                        $scope.PolicyList = result.items;
                        if ($scope.PolicyTotal==0) {
                            $(".create_policy").show();
                        }
                        $(window).scroll(function() {
                            console.info ($(window).scrollTop());
                            if ($(window).scrollTop()<=64) {
                                $(".policy_title").removeClass('policy_titlefixed');

                            }
                            else {
                                $(".policy_title").addClass('policy_titlefixed');
                            }
                        });
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
                        companyTd:$scope.company_id
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
            if (index == 0) {
                $(".update_policy").css({'top':'10px','left':'0px'});
            }
            else if (index == 1) {
                $(".update_policy").css({'top':'10px','left':'505px'});
            }
            else if (index == 2) {
                $(".update_policy").css({'top':'230px','left':'0px'});
            }
            else if (index == 3) {
                $(".update_policy").css({'top':'230px','left':'505px'});
            }
            else if (index == 4) {
                $(".update_policy").css({'top':'450px','left':'0px'});
            }
            else if (index == 5) {
                $(".update_policy").css({'top':'450px','left':'505px'});
            }
            else if (index == 6) {
                $(".update_policy").css({'top':'670px','left':'0px'});
            }
            else if (index == 7) {
                $(".update_policy").css({'top':'670px','left':'505px'});
            }
            else if (index == 8) {
                $(".update_policy").css({'top':'890px','left':'0px'});
            }
            else if (index == 9) {
                $(".update_policy").css({'top':'890px','left':'505px'});
            }
            else if (index == 10) {
                $(".update_policy").css({'top':'1110px','left':'0px'});
            }
            else if (index == 11) {
                $(".update_policy").css({'top':'1110px','left':'505px'});
            }
            else if (index == 12) {
                $(".update_policy").css({'top':'1330px','left':'0px'});
            }
            else if (index == 13) {
                $(".update_policy").css({'top':'1330px','left':'505px'});
            }
            else if (index == 14) {
                $(".update_policy").css({'top':'1550px','left':'0px'});
            }
            else if (index == 15) {
                $(".update_policy").css({'top':'1550px','left':'505px'});
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
                $(".Ccheckboxlabel").removeClass('lablefalse');
                $(" .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".Ccheckboxlabel").addClass('lablefalse');
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
                    companyTd:$scope.company_id
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
            $(".Ccheckbox").attr('checked',true);
            $(".Ccheckboxlabel").removeClass('lablefalse');
            $(".Ccheckboxlabel").html('&#xe9ec;');
            $(".ChotelTevel").html("不限");
            $(".ChotelPrice").val("");
        }

        //修改自定义复选框
        $scope.updateChangecheck = function () {
            if ($(".update_policy .Ccheckbox").is(':checked')==false) {
                $(".update_policy .Ccheckboxlabel").removeClass('lablefalse');
                $(".update_policy .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".update_policy .Ccheckboxlabel").addClass('lablefalse');
                $(".update_policy .Ccheckboxlabel").html('');
            }
        }
        //创建自定义复选框
        $scope.createChangecheck = function () {
            if ($(".create_policy .Ccheckbox").is(':checked')==false) {
                $(".create_policy .Ccheckboxlabel").removeClass('lablefalse');
                $(".create_policy .Ccheckboxlabel").html('&#xe9ec;');
            }
            else {
                $(".create_policy .Ccheckboxlabel").addClass('lablefalse');
                $(".create_policy .Ccheckboxlabel").html('');
            }
        }

    }

    return TravelPolicy;
})();

module.exports = TravelPolicy;