import { ngService } from '../../index';
import { selectFromListController } from './list';
import { selectMapPointController } from './map';
import { selectDateController, selectDateSpanController } from './date';

interface DialogOptions{
    scope: any;
    parent: any;
    template: string;
    animation?: string;
    controller: Function
    notHideOnConfiom?: boolean
}
@ngService('ngModalDlg')
class ngModalDlg {
    constructor(private $ionicModal, private $injector) {
        require('./modal-dialog.scss');
    }

    createDialog(options: DialogOptions) {
        var {scope, parent, template, controller, notHideOnConfiom , animation} = options;
        return new Promise((resolve, reject) => {
            let modal = this.$ionicModal.fromTemplate(template, {
                scope: parent,
                animation: animation || 'slide-in-up',
                focusFirstInput: false
            });
            let $scope = modal.scope;
            for(let k in scope) {
                $scope[k] = scope[k];
            }
            $scope.modal = modal;
            let confirmed = false;
            //$scope.$on('$destroy', function() {
            //});
            let deregHidden = parent.$on('modal.hidden', function(event, from) {
                if(from != modal)
                    return;
                modal.remove();
                modal = undefined;
                $scope.confirmModal();
            });
            let deregRemove = parent.$on('modal.removed', function(event, from) {
                if(from != modal)
                    return;
                $scope.$destroy();
                deregHidden();
                deregRemove();
            });

            $scope.confirmModal = function(value) {
                if(confirmed)
                    return;
                confirmed = true;
                if(modal && !notHideOnConfiom)
                    modal.hide();
                resolve(value);
            }
            modal.show();
            this.$injector.invoke(controller, this, {$scope, $element: modal.$el.find('ion-modal-view')});
        });
    }

    selectFromList($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./list/dialog.html'),
            controller: selectFromListController
        });
    }

    selectMapPoint($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./map/dialog.html'),
            controller: selectMapPointController
        });
    }

    selectDate($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./date/dialog.html'),
            controller: selectDateController
        });
    }

    selectDateSpan($scope, options, value) {
        return this.createDialog({
            parent: $scope,
            scope: {options, value},
            template: require('./date/datespan-dialog.html'),
            controller: selectDateSpanController
        });
    }
}

