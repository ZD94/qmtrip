
import './storage';
import './loading';

import './AirCompany';
import './Airport';


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
