import _ = require('lodash');
var msgbox = require('msgbox');

export async function selectFromListController($scope) {
    require('./list.scss');
    if(typeof $scope.options.searchbox === 'undefined'){
        $scope.options.searchbox = true;
    }
    if(!$scope.options.titleTemplate){
        $scope.options.titleTemplate = $scope.options.itemTemplate;
    }
    let form = $scope.form = {
        keyword: ''
    };
    $scope.optionItems = [];
    $scope.$watch('value', function(){
        $scope.$item = $scope.value;
    })

    $scope.disableItem = function(item){
        if(item && $scope.options && $scope.options.disable){
            return $scope.options.disable(item);
        }
        return false;
    }

    $scope.showCreate = function(){
        if($scope.options.create == undefined)
            return false;
        if(!form.keyword || form.keyword.length == 0)
            return false;


    }

    $scope.createItem = async function(keyword){
        let item = await $scope.options.create(keyword);
        $scope.confirm(item);
    };
    var lists;
    async function reloadOptionItems(){
        lists = await $scope.options.query(form.keyword);
        $scope.optionItems = _.cloneDeep(lists);
        console.info($scope.optionItems);

    }
    await reloadOptionItems();
    var page = {
         // hasNextPage: function() {
         //     return lists.hasNextPage();
         // },
        nextPage : async function() {
            try {
                let pager = await lists.nextPage();
                if(pager){
                    pager.map(function(item){
                        $scope.optionItems.push(item);
                    })
                }
            } catch(err) {
                alert("获取数据时,发生异常");
                return;
            } finally {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        }
    }

    $scope.$watch('form.keyword', function(o, n) {
        if(o === n)
            return;
        reloadOptionItems();
        if(o){
            $scope.hidden = true;
        }else{
            $scope.hidden = false;
        }
    })

    $scope.toggle = function () {
        $scope.hidden = false;
        $scope.form.keyword = '';
    }

    $scope.page = page;
    $scope.confirm = function(value){
        if($scope.disableItem(value))
            return value;
        $scope.confirmModal(value);
    }

    $scope.haveSet = function() {
        msgbox.log($scope.options.noticeMsg);
    }
}




