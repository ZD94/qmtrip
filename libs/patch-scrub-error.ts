import { registerClass } from "@jingli/patch-dnode-scrub";
import { ERROR_CODE_C } from '@jingli/language';

registerClass(
    ERROR_CODE_C, null, (obj) => {
        return { __class: "ERROR_CODE_C", value: obj.toJSON()}
    }, (obj: any) => { 
        return new ERROR_CODE_C(obj.code, obj.msg);
    })

registerClass(
    Error,
    null,
    (err) => { 
        if (err['error@context']) { 
            delete err['error@context'];
        }
        return err;
    },
    null,
)