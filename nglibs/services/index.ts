
import './storage';
import './loading';
import './wx-api';
import './modal-dlg';
import './ddtalk-api'
import './inAppBrowser';
import './AirCompany';
import './Airport';
import './closePopup';

var dyload = require('dyload');
function dyloadSerivce(src: string){
    return class {
        $resolve() : Promise<void> {
            return dyload(src);
        }
    }
}

angular.module('nglibs')
    .service('mobiscroll', dyloadSerivce('/script/mobiscroll.js'));
