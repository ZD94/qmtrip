import _ = require('lodash');
var msgbox = require('msgbox');

export async function selectFromListController($scope) {
    require('./list.scss');
    if(typeof $scope.options.searchbox === 'undefined'){
        $scope.options.searchbox = true;
    }
    let form = $scope.form = {
        keyword: ''
    };
    $scope.optionItems = [];

    function displayItem(item){
        if(item && $scope.options && $scope.options.display){
            return $scope.options.display(item, true);
        }
        return item;
    };
    $scope.displayItem = displayItem;

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

        for(let v of $scope.optionItems){
            if(displayItem(v) == form.keyword)
                return false;
        }
        return true;
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
        hasNextPage: function() {
            return lists.hasNextPage();
        },
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
    })
    $scope.page = page;
    $scope.confirm = function(value){
        if($scope.disableItem(value))
            return;
        $scope.confirmModal(value);
    }

    $scope.haveSet = function() {
        msgbox.log($scope.options.noticeMsg);
    }
}
