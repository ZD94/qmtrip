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
var available_prefer = [];
var translate_prefer = {
    directArrive: {
        title: "[交通]直接到达目的地",
        value: '{"name": "directArrive", "options": {"deductScorePerStop": 10000}}',
        template: {
            directArrive: "直接到达目的地",
            deductScorePerStop: "每多中转一站扣除的分数"
        }
    },
    transitWaitDuration: {
        title: "[交通]中转等待时长",
        value: '{"name": "transitWaitDuration", "options": {"baseScore": 500, "subScore": 5, "maxDuration": 360, "minDuration": 120}}',
        template: {
            transitWaitDuration: "[系统项]中转等待时长",
            baseScore: "基准分",
            subScore: "每超出合理的等待时长一分钟扣除的分数",
            maxDuration: "合理的最大等待时长--单位/分钟",
            minDuration: "合理的最小等待时长--单位/分钟"
        }
    },
    transitCityInChina: {
        title: "[交通]中转地是否包含国内",
        value: '{"name": "transitCityInChina", "options": {"baseScore": 5000}}',
        template: {
            transitCityInChina: "[系统项]中转地是否包含国内",
            baseScore: "基准分"
        }
    },
    runningTimePrefer: {
        title: "[交通]运行时长",
        value: '{"name": "runningTimePrefer", "options": {"planeScore": 500, "trainScore": 250, "planeScoreInterval": 5, "trainScoreInterval":5}}',
        template: {
            runningTimePrefer: "[系统项]运行时长",
            planeScore: "飞机基准分",
            trainScore: "火车基准分",
            planeScoreInterval: "乘坐飞机时每超过预期时长一分钟扣除的分数",
            trainScoreInterval: "乘坐火车时每超过预期时长一分钟扣除的分数"
        }
    },
    departStandardTimePrefer: {
        title: "[交通]标准出发时间",
        value: '{"name": "departStandardTimePrefer", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "最早时间（格式YYYY-MM-DD HH:mm +0800）", "score": 500, "scoreInterval":-3}}',
        template: {
            departStandardTimePrefer: "[系统项]标准出发时间",
            end: "最晚出发时间",
            begin: "最早出发时间",
            score: "基准分",
            scoreInterval: "每超过标准出发时间一分钟扣除的分数"
        }
    },
    arriveStandardTimePrefer: {
        title: "[交通]标准到达时间",
        value: '{"name": "arriveStandardTimePrefer", "options": {"end": "最晚时间（格式YYYY-MM-DD HH:mm +0800）", "begin": "开始时间（格式YYYY-MM-DD HH:mm +0800）", "score": 500,  "scoreInterval":3}}',
        template: {
            arriveStandardTimePrefer: "[系统项]标准到达时间",
            end: "最晚到达时间",
            begin: "最早到达时间",
            score: "基准分",
            scoreInterval: "每超过标准到达时间一分钟扣除的分数"
        }
    },
    trainDurationPrefer: {
        title: "[交通]火车时长",
        value: '{"name": "trainDurationPrefer", "options": {"score": 100000, "trainDuration":360}}',
        template: {
            trainDurationPrefer: "[偏好项]火车时长",
            score: "基准分",
            trainDuration: "如果运行时长在输入的时间范围内则更倾向于坐火车--单位/分钟"
        }
    },
    earliestGoBackTimePrefer: {
        title: "[交通]最早离开时间",
        value: '{"name": "earliestGoBackTimePrefer", "options": {"score": 100000, "earliestGoBackTime":"最早返回时间（格式YYYY-MM-DD HH:mm +0800）"}}',
        template: {
            earliestGoBackTimePrefer: "[出行条件]最早离开时间",
            score: "基准分",
            earliestGoBackTime: "最早离开时间"
        }
    },
    latestArrivalTimePrefer: {
        title: "[交通]最晚到达时间",
        value: '{"name": "latestArrivalTimePrefer", "options": {"score": 100000, "latestArrivalTime":"最晚到达时间（格式YYYY-MM-DD HH:mm +0800）"}}',
        template: {
            latestArrivalTimePrefer: "[出行条件]最晚到达时间",
            score: "基准分",
            latestArrivalTime: "最晚到达时间"
        }
    },
    trainPricePrefer: {
        title: "[交通]火车价格",
        value: '{"name": "trainPricePrefer", "options": {"score": 100000}}',
        template: {
            trainPricePrefer: "[偏好项]火车价格",
            score: "基准分"
        }
    },
    planePricePrefer: {
        title: "[交通]飞机价格",
        value: '{"name": "planePricePrefer", "options": {"type": "square", "score": 10000, "cabins":"2,3,4,5" ,"percent":0.2}}',
        template: {
            planePricePrefer: "[偏好项]飞机价格",
            score: "基准分",
            type: "曲线",
            cabins: "舱位名称",
            percent: "期望的飞机价格所占总价格的比例"
        }
    },
    cabin: {
        title: "[交通]舱位",
        value: '{"name": "cabin", "options": {"score": "10000", "expectTrainCabins": "1,2,3,4,5,6,7,8,9,10", "expectFlightCabins": "2,3,4,5"}}',
        template: {
            cabin: "[标准项]舱位",
            score: "基准分",
            expectTrainCabins: "火车舱位",
            expectFlightCabins: "飞机舱位"
        }
    },
    cheapSupplier: {
        title: "[交通]是否允许廉价航空",
        value: '{"name": "cheapSupplier", "options": {"score": "-100", "cheapSuppliers": "9C,KN,HO,PN,EU,AQ,JR"}}',
        template: {
            cheapSupplier: "[偏好项]是否允许廉价航空",
            score: "基准分",
            cheapSuppliers: "廉价航空代码"
        }
    },
    starMatch: {
        title: "[酒店]差旅标准",
        value: '{"name": "starMatch", "options": {"score": 500, "expectStar": "2,3,4,5"}}',
        template: {
            starMatch: "[标准项]差旅标准",
            score: "基准分",
            expectStar: "差旅标准"
        }
    },
    represent: {
        title: "[酒店]代表性酒店",
        value: '{"name": "represent", "options": {"score": 100}}',
        template: {
            represent: "[系统项]代表性酒店",
            score: "基准分"
        }
    },
    blackList: {
        title: "[酒店]酒店黑名单",
        value: '{"name": "blackList", "options": {"score": -100}}',
        template: {
            blackList: "[系统项]酒店黑名单",
            score: "基准分"
        }
    },
    priceRange: {
        title: "[酒店]价格区间",
        value: '{"name": "priceRange", "options": {"range":{"2":[120,380],"3":[180,600],"4":[280,1000],"5":[450,2300]}, "score": -1000000}}',
        template: {
            priceRange: "[系统项]价格区间",
            range: "价格范围--前面的数字为星级，后面的数字为价格区间",
            score: "基准分"
        }
    },
    price: {
        title: "[酒店]价格",
        value: '{"name": "price", "options": { "score": 2000,"percent":0.2}}',
        template: {
            price: "[偏好项]价格",
            score: "基准分",
            percent: "期待的酒店价格所占总价格的比例"
        }
    }
};
for (var ename in translate_prefer) {
    available_prefer.push(translate_prefer[ename]);
}

var translate_result = {
    price:{
        translate:"价格",
    },
    type:{
        translate:"火车/飞机"
    },
    No:{
        translate:"车次/航班"
    },
    cabin:{
        translate:"舱位名"
    },
    destination:{
        translate:"目的地"
    },
    originPlace:{
        translate:"出发地"
    },
    departDateTime:{
        translate:"出发时间"
    },
    arrivalDateTime:{
        translate:"到达时间"
    },
    agent:{
        translate:"供应商"
    },
    name:{
        translate:"旅馆名称"
    },
    star:{
        translate:"星级"
    },
    latitude:{
        translate:"纬度"
    },
    longitude:{
        translate:"经度"
    }
}
//描述翻译
/*var prefer_translate = {


    /!*交通*!/

    //prefer.name
    cheapSupplier:"廉价航空",
    cabin:"舱位",
    runningTimePrefer:"运行时长偏好",
    departStandardTimePrefer:"通用的出发时间偏好",
    arriveStandardTimePrefer:"通用的到达时间偏好",
    trainDurationPrefer:"火车超时偏好",
    earliestGoBackTimePrefer:"最早返回时间偏好",
    latestArrivalTimePrefer:"最晚到达时间偏好",
    trainPricePrefer:"火车价格偏好",
    planePricePrefer:"飞机价格偏好",
    arrivalTime:"到达时间偏好",
    departTime:"出发时间偏好",
    selectTraffic:"交通工具偏好",
    preferAgent:"代理商偏好",
    directArrive:"直接到达",
    transitWaitDuration:"过境等待时长偏好",
    transitCityInChina:"过境时国内中转城市偏好",

    //prefer.option
    score:"基准分",
    cheapSuppliers:"廉价航班",
    expectTrainCabins:"期待的火车舱位",
    expectFlightCabins:"期待的飞机舱位",
    planeScore:"选择飞机的基准分",
    trainScore:"选择火车的基准分",
    planeScoreInterval:"未乘坐飞机扣除的基准分值",
    trainScoreInterval:"未乘坐火车扣除的基准分值",
    begin:"最早时间",
    end:"最晚时间",
    scoreInterval:"未达到期望值扣除的基准分值",
    trainDuration:`火车每晚到分钟扣除基准分值`,
    earliestGoBackTime:"最早返回时间",
    latestArrivalTime:"最晚到达时间",
    type:"增长幅度",
    cabins:"舱位",
    percent:"期待的价格所占比例",
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


    /!*住宿*!/

    //prefer.name
    priceRange:"价格区间",
    starMatch:"星级",
    represent:"代表酒店",
    blackList:"黑名单",
    price:"价格",

    //prefer.option
    expectStar:"期望星级",
    range:"价格区间",

};*/
app.controller('debug',function($scope, $http, $location){
    //舱位翻译
  var  MPlaneLevel  = {
      // 1: "公务舱/头等舱",
      2: "经济舱",
      3: '头等舱',
      4: '商务舱',
      5: '高端经济舱',
  };
  var  MHotelLevel  = {
      5: "国际五星",
      4: "高端商务",
      3: "精品连锁",
      2: "快捷连锁"
  };
  var  MTrainLevel  = {
      1: "商务座",
      2: "一等座",
      3: "二等座",
      4: '特等座',
      5: '高级软卧',
      6: '软卧',
      7: '硬卧',
      8: '软座',
      9: '硬座',
      10: '无座'
  }
  var url = $location.search();
  var p;
  var pz;
  if(url.p){
    p = url.p;
  }
  if(url.pz){
    pz=url.pz;
  }
  $scope.translate_result = translate_result;
  $scope.prefers = available_prefer;
  $scope.ori_prefers = [];
  //描述翻译
    $scope.translate_prefer = translate_prefer;
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
  $.ajaxSetup({
     async:false
  });
  $scope.getBudget = function(){

      //翻译舱位
      levelChange();
      //  将价格区间的json字符串转换为json对象
      rangeJsonChangeStr();
    var origin = $scope.originData;
    var originData = JSON.stringify(origin.originData);
    var query = JSON.stringify(origin.query);
    var type = JSON.stringify(origin.type);
    var prefers = JSON.stringify($scope.ori_prefers);
    var policy = JSON.stringify($scope.policy);
    let originServer = $scope.originServer;
    let originServerUrl = originServer.url+'?key='+url.key;
    $.post(originServerUrl, {originData: originData, query: query, policy: policy, prefers: prefers, type: type},function(datas) {
        $scope.result = datas;
        $scope.originData.markedData = datas.markedScoreData;
        console.log($scope.result);
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
    //
    if($scope.result){
        if($scope.result.star != null) {
            $scope.result.star = MHotelLevel[$scope.result.star];
        } else {
            if($scope.result.type == 0){
                $scope.result.cabin = MTrainLevel[$scope.result.cabin];
            } else if ($scope.result.type == 1) {
                $scope.result.cabin = MPlaneLevel[$scope.result.cabin];
            }
            if($scope.result.destination.name) {
                $scope.result.destination = $scope.result.destination.name;
                $scope.result.originPlace = $scope.result.originPlace.name;
            }
            $scope.result.type = $scope.result.type == 0 ? "火车" : "飞机";
        }
    }

      //  将价格区间的json对象转换为json字符串
      rangeStrChangeJson();
      //翻译舱位
      changeLevel();
  };
  $scope.change = function(){
    var single = $scope.prefer;    //string
    var ori = $scope.ori_prefers;   //arr
    single = JSON.parse(single);
    //舱位翻译
      if(single.name == 'cabin') {
          if (single.options.expectTrainCabins) {
              single.options.expectTrainCabins = single.options.expectTrainCabins.split(",");
              single.options.expectTrainCabins.forEach(function (value,index) {
                  single.options.expectTrainCabins[index] = value+":"+MTrainLevel[value];
              });
              single.options.expectTrainCabins = single.options.expectTrainCabins.join(",");
          }
          if(single.options.expectFlightCabins){
              single.options.expectFlightCabins = single.options.expectFlightCabins.split(",");
              single.options.expectFlightCabins.forEach(function (value,index) {
                  single.options.expectFlightCabins[index] = value+":"+MPlaneLevel[value];
              });
              single.options.expectFlightCabins = single.options.expectFlightCabins.join(",");
          }
      }
      if(single.name == "starMatch") {
          if (single.options.expectStar) {
              single.options.expectStar = single.options.expectStar.split(",");
              single.options.expectStar.forEach(function (value,index) {
                  single.options.expectStar[index] = value+":"+MHotelLevel[value];
              });
              single.options.expectStar = single.options.expectStar.join(",");
          }
      }
      if(single.name == "planePricePrefer") {
          if(single.options.cabins){
              if(typeof (single.options.cabins) != "object") {
                  single.options.cabins = single.options.cabins.replace(/[^\d]+/g, ",").replace(/,$/g,"").split(",");
              }
              single.options.cabins.forEach(function (value, index) {
                  single.options.cabins[index] = value + ":" + MPlaneLevel[value];
              });
              single.options.cabins = single.options.cabins.join(",");
          }
      }
    if (single.name == "priceRange") {
        single.options.range=JSON.stringify(single.options.range);
    }
    ori.push(single);
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
      //  将价格区间的json对象转换为json字符串
      rangeStrChangeJson();
    //算法描述翻译
    /*translate_prefer = [];
    for (var i = 0; i < $scope.ori_prefers.length; i++) {
        for(var j = 0; j < available_prefer.length; j++){
            if ($scope.ori_prefers[i].name == available_prefer[j].cn) {
                translate_prefer.push(available_prefer[j].template);
            }
        }
    }
    $scope.translate_prefer = translate_prefer;*/

      //翻译舱位
      changeLevel();
      if($scope.result){
          if($scope.result.star != null) {
              $scope.result.star = MHotelLevel[$scope.result.star];
          } else {
              if($scope.result.type == 0){
                  $scope.result.cabin = MTrainLevel[$scope.result.cabin];
              } else if ($scope.result.type == 1) {
                  $scope.result.cabin = MPlaneLevel[$scope.result.cabin];
              }
              if($scope.result.destination.name) {
                  $scope.result.destination = $scope.result.destination.name;
                  $scope.result.originPlace = $scope.result.originPlace.name;
              }
              $scope.result.type = $scope.result.type == 0 ? "火车" : "飞机";
          }
      }
  }
  $scope.delete = function(index){
    var del_arr = $scope.ori_prefers;
    del_arr.splice(index,1);
    /*translate_prefer.splice(index,1);
    $scope.translate_prefer = translate_prefer;*/
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
    //  将价格区间的json对象转换为json字符串
    function rangeStrChangeJson() {
        for(var i = 0; i < $scope.ori_prefers.length; i++) {
            if($scope.ori_prefers[i].name == "priceRange") {
                $scope.ori_prefers[i].options.range=JSON.stringify($scope.ori_prefers[i].options.range);
            }
        }
    }
    //  将价格区间的json字符串转换为json对象
    function rangeJsonChangeStr() {
        for(var i = 0; i < $scope.ori_prefers.length; i++) {
            if($scope.ori_prefers[i].name == "priceRange") {
                $scope.ori_prefers[i].options.range=JSON.parse($scope.ori_prefers[i].options.range);
            }
        }
    }
    // 将舱位翻译
    function changeLevel() {
        for(var i = 0; i < $scope.ori_prefers.length; i++) {
            if($scope.ori_prefers[i].name == 'cabin') {
                if ($scope.ori_prefers[i].options.expectTrainCabins) {
                    $scope.ori_prefers[i].options.expectTrainCabins = $scope.ori_prefers[i].options.expectTrainCabins.split(",");
                    $scope.ori_prefers[i].options.expectTrainCabins.forEach(function (value,index) {
                        $scope.ori_prefers[i].options.expectTrainCabins[index] = value+":"+MTrainLevel[value];
                    });
                    $scope.ori_prefers[i].options.expectTrainCabins = $scope.ori_prefers[i].options.expectTrainCabins.join(",");
                }
                if($scope.ori_prefers[i].options.expectFlightCabins){
                    $scope.ori_prefers[i].options.expectFlightCabins = $scope.ori_prefers[i].options.expectFlightCabins.split(",");
                    $scope.ori_prefers[i].options.expectFlightCabins.forEach(function (value,index) {
                        $scope.ori_prefers[i].options.expectFlightCabins[index] = value+":"+MPlaneLevel[value];
                    });
                    $scope.ori_prefers[i].options.expectFlightCabins = $scope.ori_prefers[i].options.expectFlightCabins.join(",");
                }
            }
            if($scope.ori_prefers[i].name == "starMatch") {
                if ($scope.ori_prefers[i].options.expectStar) {
                    $scope.ori_prefers[i].options.expectStar = $scope.ori_prefers[i].options.expectStar.split(",");
                    $scope.ori_prefers[i].options.expectStar.forEach(function (value,index) {
                        $scope.ori_prefers[i].options.expectStar[index] = value+":"+MHotelLevel[value];
                    });
                    $scope.ori_prefers[i].options.expectStar = $scope.ori_prefers[i].options.expectStar.join(",");
                }
            }
            if($scope.ori_prefers[i].name == "planePricePrefer") {
                if($scope.ori_prefers[i].options.cabins){
                    if(typeof ($scope.ori_prefers[i].options.cabins) != "object") {
                        $scope.ori_prefers[i].options.cabins = $scope.ori_prefers[i].options.cabins.replace(/[^\d]+/g, ",").replace(/,$/g,"").split(",");
                    }
                    $scope.ori_prefers[i].options.cabins.forEach(function (value, index) {
                        $scope.ori_prefers[i].options.cabins[index] = value + ":" + MPlaneLevel[value];
                    });
                    $scope.ori_prefers[i].options.cabins = $scope.ori_prefers[i].options.cabins.join(",");
                }
            }
        }
    }
    function levelChange() {
        for(var i = 0; i < $scope.ori_prefers.length; i++) {
            if($scope.ori_prefers[i].name == 'cabin') {
                if ($scope.ori_prefers[i].options.expectTrainCabins) {
                    $scope.ori_prefers[i].options.expectTrainCabins = $scope.ori_prefers[i].options.expectTrainCabins.replace(/[^\d]+/g, ",").replace(/,$/g,"");
                }
                if($scope.ori_prefers[i].options.expectFlightCabins){
                    $scope.ori_prefers[i].options.expectFlightCabins = $scope.ori_prefers[i].options.expectFlightCabins.match(/\d/g).join(",");
                }
            }
            if($scope.ori_prefers[i].name == "starMatch") {
                if ($scope.ori_prefers[i].options.expectStar) {
                    $scope.ori_prefers[i].options.expectStar = $scope.ori_prefers[i].options.expectStar.match(/\d/g).join(",");
                }
            }
            if($scope.ori_prefers[i].name == "planePricePrefer") {
                if($scope.ori_prefers[i].options.cabins){
                    $scope.ori_prefers[i].options.cabins = $scope.ori_prefers[i].options.cabins.match(/\d/g);
                }
            }
        }
    }
});