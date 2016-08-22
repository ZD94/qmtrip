
import { ngService } from '../../index';
import { selectFromListController } from './list';
import { selectMapPointController } from './map';
import { selectDateController, selectDateSpanController } from './date';

@ngService('ngModalDlg')
class ngModalDlg {
    constructor(private $ionicModal, private $ionicPopup, private $injector) {
        require('./modal-dialog.scss');
    }

    createDialog({scope, parent, template, controller}) {
        return new Promise((resolve, reject) => {
            let modal = this.$ionicModal.fromTemplate(template, {
                scope: parent,
                animation: 'slide-in-up',
                focusFirstInput: false
            });
            let $scope = modal.scope;
            for(let k in scope) {
                $scope[k] = scope[k];
            }
            $scope.modal = modal;
            let result;
            //$scope.$on('$destroy', function() {
            //});
            parent.$on('modal.hidden', function() {
                modal.remove();
                resolve(result);
            });
            parent.$on('modal.removed', function() {
                $scope.$destroy();
            });

            $scope.confirmModal = function(value) {
                result = value;
                modal.hide();
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

