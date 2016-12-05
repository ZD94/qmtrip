// "use strict";
//
// import angular = require('angular');
//
//
// angular
//     .module('nglibs')
//     .factory('statistics', function(){
//         return new StatisticsCZCN();
//     })
//
//
// class StatisticsCZCN{
//     $resolve(){
//         return dyload('https://s95.cnzz.com/z_stat.php?id=1260899849&web_id=1260899849');
//     }
//
//     trigger(){
//         var el = $('<style>a[title="站长统计"]{display:none}</style>');
//     }
// }