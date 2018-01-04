'use strict';
import {AbstractModelController, Restful} from "@jingli/restful";
import {Approve} from "_types/approve";
import {Models} from "_types";

var subsidyTypeCols = Approve['$fieldnames'];
@Restful()
export class ApproveController extends AbstractModelController {

    constructor() {
        super(Models.approve, subsidyTypeCols);
    }

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

}
