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
  $scope.ori_prefers = [];
  //数据的显示与隐藏
  $scope.showOriginData = false;
  $scope.showScoreData = false;
  $scope.hideScoreDetail = true;
  $scope.hideCalResult = true;
  $scope.showReason = false;
  //表格的排序117.213983,39.121397
  $scope.orderBealoon = false;
  $scope.order = 'scope';
  var lastNum = 15;
  var orderBooleanlast;

  //拿到原始数据
  if(url.key){
    $http.get('/api/budgets?p='+p+'&pz='+pz+'&key='+url.key)
        .success(function(response){
         for(let i=0;i<response.length;i++){
           let arr = response[i].markedData;
              for(let j=0;j<arr.length;j++){
                    let dep = arr[j].departDateTime;
                    let arrival = arr[j].arrivalDateTime;
                    arr[j].departDateTime = new Date(dep);
                    arr[j].arrivalDateTime = new Date(arrival);
                    arr[j].price = Number(arr[j].price);
              }
         }
        $scope.originDatas = response;
    });
  }
  // function loadJScript(){
  //   var script = document.createElement("script");
  //   script.type = "text/javascript";
  //   script.src = "http://api.map.baidu.com/api?v=2.0&ak=rYaQkpPjbkxa0sAfIBHP13CGLrgVjzVG&callback=init";
  //   document.body.appendChild(script);
  // }
  //
  // window.onload = loadJScript;

  //计算出结果
  $scope.getBudget = function(){
    var origin = $scope.originData;
    var originData = JSON.stringify(origin.originData);
    var query = JSON.stringify(origin.query);
    var type = JSON.stringify(origin.type);
    var prefers = JSON.stringify($scope.ori_prefers);
    var policy = JSON.stringify($scope.policy);
    $http.post('/api/budgets?key='+url.key,{originData: originData, query: query, policy: policy, prefers: prefers, type: type})
        .success(function(datas){
            $scope.result = datas;
            console.log(datas);
            $scope.originData.markedData = datas.markedScoreData;
            console.log($scope.originData.markedData);
        })
  };
  $scope.change = function(){
    var single = $scope.prefer;    //string
    var ori = $scope.ori_prefers;   //arr

    ori.push(JSON.parse(single));
    $scope.ori_prefers = ori;
    console.log(ori);
  };
  $scope.changeOrigin = function(){
    $scope.ori_prefers = $scope.originData.prefers;
    var arr = $scope.originData.markedData;
    var flag = arr[0].type;
    if(flag!==0 && flag!=1){
      $scope.ishotel = true;
    }else{
      $scope.ishotel = false;
    }
  }
  $scope.delete = function(index){
    var del_arr = $scope.ori_prefers;
    del_arr.splice(index,1);
    $scope.ori_prefers = del_arr;
  }
  $scope.showMap = function(lon,lat){
      let mapKey = "rYaQkpPjbkxa0sAfIBHP13CGLrgVjzVG";
      let zoom=15;
      lon = lon+0.007536;
      lat = lat+0.005636;
      //+"&bbox="+minX+","+minY+";"+maxX+","+maxY
      let mapUrl = "http://api.map.baidu.com/staticimage/v2?ak="+mapKey+"&width=1000&height=1000&center="+lon+","+lat+"&markers="+lon+","+lat+"&zoom="+zoom+"&markerStyles=l,A,0xFFFF00";
      window.open(mapUrl);
  }

  $scope.changeOrder = function(orderStr,orderBooleanArg,num){
      let orderBoolean;
      if(lastNum == num){
        orderBooleanlast = orderBoolean =!orderBooleanlast ;
        $scope.orderBealoon = orderBoolean;
      }else{
        $scope.orderBealoon = orderBooleanlast = orderBooleanArg;
      }
      $scope.order = orderStr;
      lastNum = num;
  }
});