/**
 * Created by wlh on 16/8/29.
 */
'use strict';

var app = angular.module('debugModule',[]);
app.controller('debug',function($scope, $http, $location){

  var url = $location.search();
  var p;
  var pz;
  if(url.p){
    p = url.p;
  }
  if(url.pz){
    pz=url.pz;
  }
  $scope.prefers = [
    {
      title: "[交通]到达时间",
      value: '{"name": "arrivalTime", "options": {"begin": "开始时间,格式YYYY-MM-DD HH:mm +0800", "end": "最晚时间", "outScore": "如果不在这个时间段内得分"}}'
    },
    {
      title: "[交通]舱位",
      value: '{"name": "cabin", "options": {"expectCabins": ["期望的舱位","仓位2","舱位3"], "score": "符合舱位得分"}}'
    },
    {
      title: "[交通]廉价航空",
      value: '{"name": "cheapSupplier", "options": {"score": "如果在廉价航空中得分"}}'
    },{
      title: "[交通]出发时间",
      value: '{"name": "departTime", "options": {"begin": "开始时间", "end": "最晚时间", "score": "符合时间得分"}}'
    },
    {
      title: "[交通]交通方式",
      value: '{"name": "selectTraffic", "options": {"selectTrainDuration": 360, "selectFlightDuration": 210, "score": 500}}'
    },{
      title: "[酒店]星级",
      value: '{"name": "starMatch", "options": {"expectStar": 3, "score": 500}}'
    },{
      title: "[酒店]代表性酒店",
      value: '{"name": "represent", "options": {"score": 100}}'
    },{
      title: "[酒店]黑名单",
      value: '{"name": "blackList", "options": {"score": -100}}'
    }
  ];

  //数据的显示与隐藏
  $scope.showOriginData = false;
  $scope.showScoreData = false;
  $scope.hideScoreDetail = true;
  $scope.hideCalResult = true;

  //拿到原始数据
  if(url.key){
    $http.get('/api/budgets?p='+p+'&pz='+pz+'&key='+url.key)
        .success(function(response){
        $scope.originDatas = response;
    });
  }

  //计算出结果
  $scope.getBudget = function(){
    var origin = $scope.originData;
    var originData = JSON.stringify(origin.originData);
    var query = JSON.stringify(origin.query);
    var type = JSON.stringify(origin.type);
    var prefers = JSON.stringify(origin.prefers);
    var policy = $scope.policy;
    $http.post('/api/budgets?key='+url.key,{originData: originData, query: query, policy: policy, prefers: prefers, type: type})
        .success(function(datas){
            $scope.result = datas;
            console.log(datas)
        })
  }
})