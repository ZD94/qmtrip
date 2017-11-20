/**
 * Created by ycl on 2017/10/30.
 */

'use strict';
import {AbstractController, Restful, Router} from "@jingli/restful";
import {Request, Response} from "express-serve-static-core";

@Restful()
export class ApproveController extends AbstractController {

    constructor() {
        super();
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

}
