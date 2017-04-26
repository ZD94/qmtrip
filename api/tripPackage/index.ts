/**
 * Created by chen on 2017/3/24.
 */
'use strict';
import {requireParams, clientExport} from '@jingli/dnode-api/dist/src/helper';
import {TripBasicPackage} from "_types/tripPackage/tripBasicPackage";
import { Models } from '_types';
import {TripFuelAddPackage} from "_types/tripPackage/tripFuelAddPackage";

class TripPackageModule{
    @clientExport
    @requireParams(["id"])
    static getBasicTripPackage(params: {id: string}) {
        return Models.tripBasicPackage.get(params.id);
    }

    @clientExport
    @requireParams(["id"])
    static getFuelAddPackage(params: {id: string}) {
        return Models.tripFuelAddPackage.get(params.id);
    }

}

export = TripPackageModule