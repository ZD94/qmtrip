/**
 * Created by wlh on 16/8/29.
 */
'use strict';

var app = angular.module('debugModule',[]);

/*var available_prefer = [
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
];*/
var available_prefer = [
    {
        title:"[交通]直接到达",
        value: '{"name": "directArrive", "options": {"deductScorePerStop": 10000}}'
    },
    {
        title:"[交通]出境等待时长",
        value:'{"name": "transitWaitDuration", "options": {"baseScore": 500, "subScore": 5, "maxDuration": 360, "minDuration": 120}}'
    },
    {
        title:"[交通]出境城市",
        value:'{"name": "transitCityInChina", "options": {"baseScore": 5000}}'
    },
    {
        title:"[交通]运营时长",
        value:'{"name": "runningTimePrefer", "options": {"planeScore": 500, "trainScore": 250, "planeScoreInterval": 5, "trainScoreInterval":5}}'
    },
    {
        title:"[交通]运营时长",
        value:'{"name": "runningTimePrefer", "options": {"planeScore": 500, "trainScore": 250, "planeScoreInterval": 5, "trainScoreInterval":5}}'
    },
    {
        title:"[交通]标准出发时间",
        value:'{"name": "departStandardTimePrefer", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "开始时间（格式YYYY-MM-DD HH:mm +0800）", "score": 500, "scoreInterval":-3}}'
    },
    {
        title: "[交通]标准到达时间",
        value: '{"name": "arriveStandardTimePrefer", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "开始时间（格式YYYY-MM-DD HH:mm +0800）", "score": 500,  "scoreInterval":3}}'
    },
    {
        title: "[交通]火车运行时间",
        value: '{"name": "trainDurationPrefer", "options": {"score": 100000, "trainDuration":360}}'
    },
    {
        title: "[交通]最早返回时间",
        value: '{"name": "earliestGoBackTimePrefer", "options": {"score": 100000, "earliestGoBackTime":"最早返回时间（格式YYYY-MM-DD HH:mm +0800）"}}'
    },
    {
        title: "[交通]最晚到达时间",
        value: '{"name": "latestArrivalTimePrefer", "options": {"score": 100000, "latestArrivalTime":"最晚到达时间（格式YYYY-MM-DD HH:mm +0800）"}}'
    },
    {
        title: "[交通]火车价格",
        value: '{"name": "trainPricePrefer", "options": {"score": 100000}}'
    },
    {
        title: "[交通]飞机票价期待值",
        value: '{"name": "planePricePrefer", "options": {"type": "square", "score": 10000, "cabins":2, "percent":0.2}}'
    },
    {
        title: "[交通]代理商",
        value: '{"name": "preferAgent", "options": {"score": 100, "expectedAgents":"ctrip,携程,同城,南航,中航,中国航空公司"}}'
    },
    {
        title: "[交通]到达时间",
        value: '{"name": "arrivalTime", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "开始时间（格式YYYY-MM-DD HH:mm +0800）", "score": "20000"}}'
    },
    {
        title: "[交通]舱位",
        value: '{"name": "cabin", "options": {"score": "10000", "expectTrainCabins": "2", "expectFlightCabins": "3,4,5"}}'
    },
    {
        title: "[交通]廉价航空",
        value: '{"name": "cheapSupplier", "options": {"score": "-100", "cheapSuppliers": "9C,KN,HO,PN,EU,AQ,JR"}}'
    },{
        title: "[交通]出发时间",
        value: '{"name": "departTime", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "开始时间（格式YYYY-MM-DD HH:mm +0800）", "score": "-20000"}}'
    },
    {
        title: "[交通]交通方式",
        value: '{"name": "selectTraffic", "options": {"score": 500, "commonTrainScore":-100000, "selectTrainDuration": 360, "selectFlightDuration": 210}}'
    },
    {
        title: "[酒店]星级",
        value: '{"name": "starMatch", "options": {"score": 500, "expectStar": 3}}'
    },
    {
        title: "[酒店]代表性酒店",
        value: '{"name": "represent", "options": {"score": 100}}'
    },
    {
        title: "[酒店]黑名单",
        value: '{"name": "blackList", "options": {"score": -100}}'
    },
    {
        title: "[酒店]价格区间",
        value: '{"name": "priceRange", "options": {"range":{"2":[120,380],"3":[180,600],"4":[280,1000],"5":[450,2300]}, "score": -1000000}}'
    },
    {
        title: "[酒店]价格",
        value: '{"name": "price", "options": { "score": 2000,"percent":0.2}}'
    }
];
//描述翻译
var prefer_translate = {


    /*交通*/

    //prefer.name
    cheapSupplier:"廉价航空",
    cabin:"舱位",
    runningTimePrefer:"期望的运营时长",
    departStandardTimePrefer:"期望的标准出发时间",
    arriveStandardTimePrefer:"期望的标准到达时间",
    trainDurationPrefer:"期望的火车运行时间",
    earliestGoBackTimePrefer:"期待的最早返回时间",
    latestArrivalTimePrefer:"期望的最晚到达时间",
    trainPricePrefer:"期望的火车价格",
    planePricePrefer:"期望的飞机价格",
    arrivalTime:"到达时间",
    departTime:"出发时间",
    selectTraffic:"选择交通工具",
    preferAgent:"期望的代理商",
    directArrive:"直接到达",
    transitWaitDuration:"过境等待时长",
    transitCityInChina:"从中国过境城市",

    //prefer.option
    score:"基准得分",
    cheapSuppliers:"廉价航班",
    expectTrainCabins:"期待的火车舱位",
    expectFlightCabins:"期待的飞机舱位",
    planeScore:"选择飞机的基准得分",
    trainScore:"选择火车的基准得分",
    planeScoreInterval:"乘坐飞机期望值加分",
    trainScoreInterval:"乘坐火车期望值加分",
    begin:"最早时间",
    end:"最晚时间",
    scoreInterval:"未达到期望值扣分",
    trainDuration:"火车持续时间",
    earliestGoBackTime:"最早返回时间",
    latestArrivalTime:"最晚到达时间",
    type:"增长幅度",
    cabins:"舱位",
    percent:"期待的价格所占比",
    commonTrainScore:"乘坐普快基准得分",
    selectTrainDuration:"选择火车的时长",
    selectFlightDuration:"选择飞机的时长",
    expectedAgents:"期望代理商",
    expectCabins:"期待舱位",
    outScore:"如果不在这个时间段内得分",
    deductScorePerStop:"每多停一次扣除期望值",
    baseScore:"基础的基准得分",
    subScore:"最低期望值",
    maxDuration:"最大等待时长",
    minDuration:"最小等待时长",


    /*住宿*/

    //prefer.name
    priceRange:"价格区间",
    starMatch:"星级",
    represent:"代表酒店",
    blackList:"黑名单",
    price:"价格",

    //prefer.option
    expectStar:"期望星级",
    range:"价格区间",

};
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
  $scope.prefers = available_prefer;
  $scope.ori_prefers = [];
  //描述翻译
  $scope.prefer_translate = prefer_translate;
  //数据的显示与隐藏
  $scope.showOriginData = false;
  $scope.showScoreData = false;
  $scope.hideScoreDetail = true;
  $scope.hideCalResult = true;
  $scope.showReason = false;
  //表格的排序
  $scope.orderBealoon = false;
  $scope.order = 'scope';
  var lastNum = 15;
  var orderBooleanlast;
    //复制粘贴的功能
  var copyTemp = '';

  //拿到原始数据
  if(url.key){
    $http.get('/api/budgets?p='+p+'&pz='+pz+'&key='+url.key)
        .success(function(response){
            console.log(response);
         for(let i=0;i<response.length;i++){
           let arr = response[i].markedData;
              for(let j=0;j<arr.length;j++){
                    let dep = arr[j].departDateTime;
                    let arrival = arr[j].arrivalDateTime;
                    arr[j].departDateTime = new Date(dep);
                    arr[j].arrivalDateTime = new Date(arrival);
              }
         }
        $scope.originDatas = response;
    });
  }

  //更改服务器
    $scope.originServer = {name:'默认',url:'/api/budgets'};
    $scope.originServers = [
        {name:'默认',url:'/api/budgets'},
        {name:'测试',url:'//t.jingli365.com/api/budgets'},
        {name:'本地',url:'//l.jingli365.com/api/budgets'},
        {name:'正式',url:'//j.jingli365.com/api/budgets'}
        ]
    $scope.changeServer = function(){
        let originServer = $scope.originServer;
        let originServerUrl = originServer.url+'?p='+p+'&pz='+pz+'&key='+url.key;
        $http.get(originServerUrl).success(function(response){
            console.log(response);


            let responseArr = response;
            for(let i=0;i<responseArr.length;i++) {
                let arr = responseArr[i].markedData;
                for (let j = 0; j < arr.length; j++) {
                    let dep = arr[j].departDateTime;
                    let arrival = arr[j].arrivalDateTime;
                    arr[j].departDateTime = new Date(dep);
                    arr[j].arrivalDateTime = new Date(arrival);
                    arr[j].price = Number(arr[j].price);
                    arr[j].score = Number(parseInt(arr[j].score));
                }
            }
            $scope.originDatas = responseArr;


        })
    }

  //动态加载clipboard
  // function loadJScript(){
  //   var script = document.createElement("script");
  //   script.type = "text/javascript";
  //   script.src = "//cdn.bootcss.com/clipboard.js/1.5.12/clipboard.min.js";
  //   document.body.appendChild(script);
  // }

  //window.onload = loadJScript;

  //计算出结果
  $scope.getBudget = function(){
    var origin = $scope.originData;
    var originData = JSON.stringify(origin.originData);
    var query = JSON.stringify(origin.query);
    var type = JSON.stringify(origin.type);
    var prefers = JSON.stringify($scope.ori_prefers);
    var policy = JSON.stringify($scope.policy);
    let originServer = $scope.originServer;
    let originServerUrl = originServer.url+'?key='+url.key;
    $.post(originServerUrl, {originData: originData, query: query, policy: policy, prefers: prefers, type: type}, function(datas) {
        $scope.result = datas;
        $scope.originData.markedData = datas.markedScoreData;
    }, "json")
    // $http.post(originServerUrl,{originData: originData, query: query, policy: policy, prefers: prefers, type: type})
    //     .success(function(datas){
    //         console.log('进入');
    //         $scope.result = datas;
    //         $scope.originData.markedData = datas.markedScoreData;
    //         console.log('出来');
    //     })
    //   $http({
    //       method: 'POST',
    //       url: originServerUrl,
    //       data: {originData: originData, query: query, policy: policy, prefers: prefers, type: type}}).then(
    //           function(res){
    //               console.log(res);
    //           },function(){}
    //   )

  };
  $scope.change = function(){
    var single = $scope.prefer;    //string
    var ori = $scope.ori_prefers;   //arr

    ori.push(JSON.parse(single));
    $scope.ori_prefers = ori;
  };
  $scope.changeOrigin = function(){
    if($scope.originData){
        $scope.ori_prefers = $scope.originData.prefers;
        var arr = $scope.originData.markedData;
        var flag = arr[0].type;
        if(flag!==0 && flag!=1){
          $scope.ishotel = true;
        }else{
          $scope.ishotel = false;
        }
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

  $scope.copy = function(){
    copyTemp = $scope.ori_prefers;
  }
  $scope.paste = function(){
      $scope.ori_prefers = copyTemp;
  }
});