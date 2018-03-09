'use strict';
import { Restful, AbstractController } from '@jingli/restful';

@Restful()
export class ApproveController extends AbstractController {

    $isValidId(id: string) {
        return /^\w{8}-\w{4}-\w{4}-\w{4}-\w{12}$/.test(id);
    }

}
