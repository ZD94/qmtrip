
import { EPayType, EInvoiceFeeTypes } from '_types/tripPlan/index';

export interface SupplierOrder{
    id: string;
    price: number;
    date: Date;
    persons: string[];
    desc: string;
    orderType: EInvoiceFeeTypes;
    parType: EPayType;
    number?: string;
    starCityName?: string;
    endCityName?: string;
}

export interface ReserveLink{
    url: string;
    jsCode: string;
}
