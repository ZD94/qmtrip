/**
 * Created by chen on 2017/3/24.
 */
'use strict';
import {requireParams, clientExport} from 'common/api/helper';
import {TripBasicPackage} from "_types/tripPackage/tripBasicPackage";
import { Models } from '_types';
import {TripFuelAddPackage} from "_types/tripPackage/tripFuelAddPackage";

class TripPackageModule{
    @clientExport
    @requireParams(["id"])
    static async getBasicPackage(params): Promise<TripBasicPackage>{
        let tripBasicPackage = await Models.tripBasicPackage.get(params.id);
        return tripBasicPackage;
    }

    @clientExport
    @requireParams(["id"])
    static async getFuelAddPackage(params): Promise<TripFuelAddPackage>{
        let tripFuelAddPackage = await Models.tripFuelAddPackage.get(params.id);
        return tripFuelAddPackage;
    }

}