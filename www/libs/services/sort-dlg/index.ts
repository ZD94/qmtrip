import {ngService} from "nglibs/index";

interface SortOption{
    scope: any;
    parent: any;
    element: any;
    template: string;
    controller: Function;
}

@ngService('sortDlg')
class sortDlg{
    constructor(private $injector, private $compile, private $ionicBody){
        require('./sort-dlg.scss');
    }
    createDialog(options){
        return new Promise((resolve,reject) =>{
            let {scope,parent,template,controller} = options;
            let self = this;
            let element = angular.element(template);
            this.$ionicBody.get().appendChild(element[0]);
            let $scope = parent.$new(true);
            for(let k in scope) {
                $scope[k] = scope[k];
            }
            this.$compile(element)($scope);
            let sortRemove = parent.$on('$sortClose', function(event){
                // event.preventDefault();
                $(element).remove();
            })
            $scope.confirm = function(value){
                $(element).remove();
                resolve(value);
            }
            self.$injector.invoke(controller, self, {$scope, $element: element});
        })

    }
}