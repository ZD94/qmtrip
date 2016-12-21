
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

    async function reloadOptionItems(){
        $scope.optionItems = await $scope.options.query(form.keyword);
    }
    await reloadOptionItems();

    $scope.$watch('form.keyword', function(o, n) {
        if(o === n)
            return;
        reloadOptionItems();
    })

    $scope.confirm = function(value){
        if($scope.disableItem(value))
            return;
        $scope.confirmModal(value);
    }

    $scope.haveSet = function() {
        msgbox.log($scope.options.noticeMsg);
    }
}
