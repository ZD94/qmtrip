/**
 * Created by lsw on 2017/10/27
 */

'use strict';
import { AbstractController, Restful, Router } from "@jingli/restful";
import API from '@jingli/dnode-api';
import { Models } from "_types";

@Restful()
export default class PlaceController extends AbstractController {
    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\d+$/.test(id);
    }

    async get(req, res, next) {
        let { id } = req.params;
        let result = await API['qmplace'].getCityById(id);
        return res.send(this.resp(result));
    }

    @Router('/search/:keyword', 'GET')
    async find(req, res, next) {
        let { keyword } = req.params;
        const result = await API['qmplace'].findByKeyword(keyword);
        return res.send(this.resp(result));
    }

    @Router('/:parentId/children', 'GET')
    async getSubCities(req, res, next) {
        let { parentId } = req.params,
            result = await API['qmplace'].findSubCities(parentId);
        return res.send(this.resp(result));
    }

    @Router('/nearby/:longitude/:latitude', 'GET')
    async getNearCity(req, res, next) {
        let { longitude, latitude } = req.params,
            pattern = /^\d+\.?\d+$/;
        const isValid = pattern.test(longitude) && pattern.test(latitude);
        if (!isValid) {
            return res.send(this.reply(400, null));
        }
        const result = await API['qmplace'].findNearCitiesByGC(longitude, latitude);
        return res.send(this.resp(result));
    }

    resp(result: any) {
        return result.code === 0
            ? this.reply(0, result.data)
            : this.reply(result.code, null);
    }

}
