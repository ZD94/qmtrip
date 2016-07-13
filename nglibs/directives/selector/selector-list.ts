
declare var API: any;

export async function modalSelectorList($scope, $ionicModal, selected) {
    var template = require('./selector-list.html');
    $scope.modal = $ionicModal.fromTemplate(template, {
        scope: $scope,
        animation: 'slide-in-up',
        focusFirstInput: true
    });
    $scope.$on('$destroy', function() {
        $scope.modal.remove();
    });
    $scope.$on('modal.hidden', function() {
    });
    $scope.$on('modal.removed', function() {
    });

    var optionsLoader = $scope.callbacks.query;
    var optionsCreator = $scope.callbacks.create;

    var form: any = $scope.form = {};
    form.keyword = selected;
    form.selected = '';

    $scope.optionLoader = async function(){
        $scope.options = await optionsLoader(form.keyword);
    }

    $scope.$watch('form.keyword', function(o, n) {
        if(o === n)
            return;
        $scope.optionLoader();
    })
    $scope.options = [];
    await $scope.optionLoader();
    //需要等待加载完数据后
    $scope.options.map(function(v) {
        if (v.name == selected) {
            form.selected = v;
            return;
        }
    });

    $scope.showCreate = function(){
        if(optionsCreator == undefined)
            return false;
        if(!form.keyword || form.keyword.length == 0)
            return false;

        let isMatch = false;
        $scope.options.forEach(function(v) {
            if (v == form.keyword || v.name == form.keyword) {
                isMatch = true;
                return;
            }
        });

        if(isMatch) return false;
        return true;
    }

    return new Promise(function(resolve, reject) {
        $scope.confirmModal = function() {
            $scope.modal.hide();
            resolve($scope.form.selected);
        }
        $scope.cancelModal = function() {
            $scope.modal.hide();
            resolve();
        }
        $scope.modal.show();

    })

}