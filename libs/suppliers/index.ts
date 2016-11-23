
import { WebRobot } from '../web_robot/index';
import { SupplierOrder } from './interface';
export { SupplierOrder } from './interface';

export abstract class SupplierWebRobot extends WebRobot{
    constructor(origin: string){
        super(origin);
    }

    abstract login(authData: any): Promise<any>;
    abstract getOrderList(): Promise<SupplierOrder[]>;
    abstract getAirTicketReserveLink(options): Promise<string>;
    abstract getHotelReserveLink(options): Promise<string>;
}

interface SupplierWebRobotConstructor{
    new(): SupplierWebRobot
}

let suppliers: {
    [key: string]: SupplierWebRobotConstructor
};

function initSuppliers(){
    suppliers = {
        ct_ctrip_com: require('./ct_ctrip_com'),
        ct_ctrip_com_m: require('./ct_ctrip_com_m'),
        ctrip_com: require('./ctrip_com'),
    }
}

export function getSupplier(id): SupplierWebRobot {
    if(!suppliers){
        initSuppliers();
    }
    return new suppliers[id]();
}

export type SupplierGetter = typeof getSupplier;
