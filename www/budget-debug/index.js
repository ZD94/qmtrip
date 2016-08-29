/**
 * Created by wlh on 16/8/29.
 */
'use strict';

let key = window.location.href;

var prefers = [
  {
    title: "到达时间",
    value: '{"name": "arrivalTime", "options": {"begin": "开始时间", "end": "最晚时间", "inScore": "如果在这个时间段内得分"}}'
  },
  {
    title: "舱位",
    value: '{"name": "cabin", "options": {"expectCabins": ["期望的舱位"], "score": "符合舱位得分"}}'
  },
  {
    title: "廉价航空",
    value: '{"name": "cheapsupplier", "options": {"score": "如果在廉价航空中得分"}}'
  },{
    title: "出发时间",
    value: '{"name": "departTime", "options": {"begin": "开始时间", "end": "最晚时间", "score": "符合时间得分"}}'
  },
  {
    title: "交通方式",
    value: '{"name": "selectTraffic", "options": {"selectTrainDuration": 360, "selectFlightDuration": 210, "score": 500}}'
  }
]

if (!window.$) {
  throw new Error('need JQuery!');
}
var budgets = [];

function getData() {
  return new Promise(function(resolve, reject) {
    $.get('/api/budgets', {p: 1, pz: 20}, function(data) {
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
      if (idx == 1) {
        return '<option value="'+v.id+'" selected="selected" >' + v.title + '</option>';
      }
      return '<option value="'+v.id+'" >' + v.title + '</option>';
    });
    options.reverse()
    $("#budgetItemsSelect").html(options);
}

function renderBudget(id) {
  var budget = {};
  budgets.forEach( function(v) {
    if (v.id == id) {
      budget = v;
      return;
    }
  });
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
}

$(document).ready( function() {
  loadData()
    .then( function(data) {
      budgets = data;
      renderBudgetSelect();
      renderBudget();
      changeBudget();
      renderPrefers();
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
  $.post('/api/budgets', {originData: originData, query: query, policy: policy, prefers: prefers}, function(result) {
    $("#result").val(JSON.stringify(result));
    $("#calBudgetBtn").attr("disabled", false);
  }, "json")
}

function renderPrefers() {
  let options = [];
  options = prefers.map( function(v) {
    return '<option value=\''+v.value+'\'>'+v.title + '</option>';
  });
  $("#availablePrefers").html(options);
}

function addPrefer() {
  var val = $("#availablePrefers").val();
  var _val = $("#prefers").val();
  _val = JSON.parse(_val);
  var _p = $("#availablePrefers").val();
  console.info(_p)
  _p = JSON.parse(_p);
  _val.push(_p);
  $("#prefers").val(JSON.stringify(_val));
}