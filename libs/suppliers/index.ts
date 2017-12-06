
import { WebRobot } from '../web_robot/index';
import { SupplierOrder, ReserveLink } from './interface';
export { SupplierOrder, ReserveLink } from './interface';

export abstract class SupplierWebRobot extends WebRobot{
    constructor(origin: string){
        super(origin);
    }

    abstract login(authData: any): Promise<any>;
    abstract getOrderList(): Promise<SupplierOrder[]>;
    
    getBookLink(options): Promise<ReserveLink>{
        return Promise.resolve(null);
    }
}

interface ReserveLinkObject{
    url: string
}

interface SupplierWebRobotConstructor{
    new(): SupplierWebRobot
}

let suppliers: {
    [key: string]: SupplierWebRobotConstructor
};

function initSuppliers(){
    suppliers = {
        ct_ctrip_com:    require('./ct_ctrip_com'),
        ct_ctrip_com_m:  require('./ct_ctrip_com_m'),
        ctrip_com:       require('./ctrip_com'),
        qunar_com_m:     require('./qunar_com'),
        taobao_com :     require('./taobao_com'),
        ly_com :         require('./ly_com'),
        jingzhong_com:   require('./jingzhong_com'),
        kiwi_com:        require('./kiwi_com')
    }
}

export function getSupplier(id): SupplierWebRobot {
    if(!suppliers){
        initSuppliers();
    }
    return new suppliers[id]();
}

export type SupplierGetter = typeof getSupplier;
