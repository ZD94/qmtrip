import { registerClass } from "@jingli/patch-dnode-scrub";
import { ERROR_CODE_C } from '@jingli/language';

registerClass(
    ERROR_CODE_C, "ERROR_CODE_C", (obj) => {
        return obj.toJSON();
    }, (obj: any) => { 
        return new ERROR_CODE_C(obj.code, obj.msg);
    })