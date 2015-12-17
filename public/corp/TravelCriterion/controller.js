/**
 * Created by zj on 2015/12/15.
 */
'use strict';
var TravelCriterion=(function(){

    API.require('travalPolicy');

    var  TravelCriterion = {};

    /*
        差旅标准列表
     * @param $scope
     * @constructor
     */
    TravelCriterion.CriterionListController = function($scope) {
        $("title").html("差旅标准");
        var companyId = "d674f130-a236-11e5-8246-c3a1e3bc94c3";
        Myselect();


        //获取差旅标准列表
        $scope.initCriterionList = function () {
            loading(false);
            API.onload(function(){
                API.travalPolicy.listAndPaginateTravalPolicy({},{})
                    .then(function(result){
                        console.info (result);
                        $scope.CriterionTotal = result.total;
                        $scope.CriterionList = result.items;
                        loading(true);
                        $scope.$apply();
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }
        $scope.initCriterionList();


        //增加标准
        $scope.createCriterionShow = function () {
            $scope.resetting();
            $(".create_criterion").show();
            $(".update_criterion").hide();
            $(".criterion_page li").css('opacity','1');
        }
        $scope.createCriterion = function () {
            API.onload(function(){
                API.travalPolicy.createTravalPolicy({
                        name:$(".create_criterion .Cname").val(),
                        planeLevel:$(".create_criterion .CplaneLevel").html(),
                        planeDiscount:$(".create_criterion .CplaneDiscount").attr('selectValue'),
                        trainLevel:$(".create_criterion .CtrainLevel").html(),
                        isChangeLevel:$(".create_criterion .Ccheckbox").is(':checked'),
                        hotelTevel:$(".create_criterion .ChotelTevel").html(),
                        hotelPrice:$(".create_criterion .ChotelPrice").val(),
                        companyTd:companyId
                    })
                    .then(function(result){
                        Myalert("温馨提示","增加成功");
                        $scope.initCriterionList();
                        $(".create_criterion").hide();
                        console.info (result);
                    })
                    .catch(function(err){
                        Myalert("温馨提示","内容不完整，请重新填写");
                        console.info (err);
                    });
            })
        }


        //删除标准
        $scope.deleteCriterion = function (id,name) {
            Myalert("温馨提示","删除成功");
            API.onload(function(){
                API.travalPolicy.deleteTravalPolicy({id:id})
                    .then(function(result){
                        Myalert("温馨提示","删除&nbsp;<span>'"+name+"'&nbsp;</span>成功");
                        $scope.initCriterionList();
                        console.info (result);
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            })
        }


        //修改标准
        $scope.updateCriterionShow = function (id,index) {
            $scope.updateId = id;
            if (index == 0  || index == 6) {
                $(".update_criterion").css({'top':'10px','left':'0px'});
            }
            else if (index == 1  || index == 7) {
                $(".update_criterion").css({'top':'10px','left':'505px'});
            }
            else if (index == 2  || index == 8) {
                $(".update_criterion").css({'top':'230px','left':'0px'});
            }
            else if (index == 3  || index == 9) {
                $(".update_criterion").css({'top':'230px','left':'505px'});
            }
            else if (index == 4  || index == 10) {
                $(".update_criterion").css({'top':'450px','left':'0px'});
            }
            else if (index == 5  || index == 11) {
                $(".update_criterion").css({'top':'450px','left':'505px'});
            }
            var obj = {0:"不限",8:"8折及以下",7:"7折及以下",6:"6折及以下",5:"5折及以下",4:"4折及以下"};
            var discountTxt = $scope.CriterionList[index].planeDiscount;
            $(".update_criterion .Cname").val($scope.CriterionList[index].name);
            $(".update_criterion .CplaneLevel").html($scope.CriterionList[index].planeLevel);
            $(".update_criterion .CplaneDiscount").html(obj[discountTxt]).attr("selectValue",discountTxt);
            $(".update_criterion .CtrainLevel").html($scope.CriterionList[index].trainLevel);
            $(".update_criterion .Ccheckbox").attr('checked',$scope.CriterionList[index].isChangeLevel);
            $(".update_criterion .ChotelTevel").html($scope.CriterionList[index].hotelTevel);
            $(".update_criterion .ChotelPrice").val($scope.CriterionList[index].hotelPrice);
            $(".update_criterion").show();
            $(".create_criterion").hide();
            $(".criterion_page li").css('opacity','0.2');
        }
        $scope.updateCriterion = function () {
            API.onload(function(){
                API.travalPolicy.updateTravalPolicy($scope.updateId,{
                    name:$(".update_criterion .Cname").val(),
                    planeLevel:$(".update_criterion .CplaneLevel").html(),
                    planeDiscount:$(".update_criterion .CplaneDiscount").attr('selectValue'),
                    trainLevel:$(".update_criterion .CtrainLevel").html(),
                    isChangeLevel:$(".update_criterion .Ccheckbox").is(':checked'),
                    hotelTevel:$(".update_criterion .ChotelTevel").html(),
                    hotelPrice:$(".update_criterion .ChotelPrice").val(),
                    companyTd:companyId
                })
                    .then(function(result){
                        Myalert("温馨提示","修改成功");
                        $scope.initCriterionList();
                        $(".update_criterion").hide();
                        $(".criterion_page li").css('opacity','1');
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
            $(".Ccheckbox").is(':checked',false);
            $(".ChotelTevel").html("不限");
            $(".ChotelPrice").val("");
        }
    }

    return TravelCriterion;
})();

module.exports = TravelCriterion;