/**
 * Created by chen on 2017/3/24.
 */
'use strict';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import { Models } from '_types';
import { TripBasicPackage, TripFuelAddPackage } from '_types/tripPackage';

class TripPackageModule{
    @clientExport
    @requireParams(["id"])
    static getBasicTripPackage(params: {id: string}): Promise<TripBasicPackage> {
        return Models.tripBasicPackage.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static getFuelAddPackage(params: {id: string}): Promise<TripFuelAddPackage> {
        return Models.tripFuelAddPackage.get(params.id);
    }

}

export = TripPackageModule