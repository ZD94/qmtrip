/**
 * Created by wlh on 16/8/29.
 */
'use strict';

var url = window.location.href;
var key = '';
var groups = /key=(\w+)/.exec(url);
if (groups) {
  key = groups[1];
}

var prefers = [
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
]

if (!window.$) {
  throw new Error('need JQuery!');
}
var budgets = [];

function getData() {
  return new Promise(function(resolve, reject) {
    $.get('/api/budgets', {p: 1, pz: 20, key: key}, function(data) {
      resolve(data);
    }, "json").error(reject);
  })
}

function loadData() {
  return getData();
}

function renderBudgetSelect() {
    var idx = 0;
    var options = budgets.map( function(v) {
      idx++;
      var tag;
      var icon = v.status == -1 ? '&times;': '&radic;'
      var val = icon + '' + v.title;
      if (idx == 1) {
        tag = wrapTag('option', { value: v.id, selected: "selected"}, val);
      } else {
        tag = wrapTag('option', {value: v.id}, val);
      }
      return tag;
    });
    options.reverse()
    $("#budgetItemsSelect").html(options);
}

function wrapTag(name, options, value) {
  var tag = '<'+name;
  for(var k in options) {
    tag += ' ' + k + '="' + options[k]+'" ';
  }
  tag += '>';
  tag += value;
  tag += '</' + name+'>';
  return tag;
}

function renderBudget(id) {
  var budget = {};
  budgets.forEach( function(v) {
    if (v.id == id) {
      budget = v;
      return;
    }
  });
  if (budget.type) {
    $("#budgetType").val(budget.type);
  }
  if (budget.query) {
    $("#query").val(JSON.stringify(budget.query));
  }
  if (budget.originData) {
    $("#originData").val(JSON.stringify(budget.originData));
  }
  if (budget.prefers) {
    $("#prefers").val(JSON.stringify(budget.prefers));
  }
  if (budget.result) {
    $("#result").val(JSON.stringify(budget.result));
  }
  if (budget.policy) {
    $("#policy").val(JSON.stringify(budget.policy));
  }
  if (budget.markedData) {
    $("#markedData").val(JSON.stringify(budget.markedData));
  }
}

$(document).ready( function() {
  loadData()
    .then( function(data) {
      budgets = data;
      renderBudgetSelect();
      renderBudget();
      changeBudget();
      renderPrefers();
      registryHideBtn();
    })
})

function changeBudget() {
  console.info("执行change")
  var id = $("#budgetItemsSelect").val();
  renderBudget(id);
}

function calBudget() {
  $("#calBudgetBtn").attr("disabled", true);
  var originData = $("#originData").val();
  var query = $("#query").val();
  var policy = $("#policy").val();
  var prefers = $("#prefers").val();
  var type = $("#budgetType").val();
  $.post('/api/budgets?key='+key, {originData: originData, query: query, policy: policy, prefers: prefers, type: type}, function(result) {
    $("#result").val(JSON.stringify(result));
    $("#calBudgetBtn").attr("disabled", false);
  }, "json")
}

function renderPrefers() {
  let options = [];
  options = prefers.map( function(v) {
    return '<option value=\''+v.value+'\'>'+v.title + '</option>';
  });
  options.unshift('<option value="">请选择打分项</option>')
  $("#availablePrefers").html(options);
}

function addPrefer() {
  var val = $("#availablePrefers").val();
  if (!val) return;
  var _val = $("#prefers").val();
  _val = JSON.parse(_val);
  var _p = $("#availablePrefers").val();
  _p = JSON.parse(_p);
  _val.push(_p);
  $("#prefers").val(JSON.stringify(_val));
}

function registryHideBtn() {
  $(".showBtn").click( function() {
    var self = $(this);
    var val = self.html();
    if (val == '显示') {
      self.siblings("textarea").removeClass("hidden");
      self.html("隐藏")
    } else {
      self.siblings("textarea").addClass("hidden");
      self.html("显示")
    }
  })
}