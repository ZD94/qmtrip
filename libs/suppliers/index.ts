
import { WebRobot } from '../web_robot/index';
import { EPayType } from 'api/_types/tripPlan';

export interface SupplierOrder{
    id: string;
    price: number;
    date: Date;
    desc: string;
    parType: EPayType;
}

export abstract class SupplierWebRobot extends WebRobot{
    constructor(origin: string){
        super(origin);
    }

    abstract login(authData: any): Promise<any>;
    abstract getOrderList(): Promise<SupplierOrder[]>;
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
    }
}

export function getSupplier(id): SupplierWebRobot {
    if(!suppliers){
        initSuppliers();
    }
    return new suppliers[id]();
}

