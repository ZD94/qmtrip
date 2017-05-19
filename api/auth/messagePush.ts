import { Models } from '_types/index';
import { Staff } from '_types/staff/staff';
import { Token } from '_types/auth/token';

/**
 * 删除绑定的设备id
 * @param params
 * @returns {boolean}
 */
export async function destroyJpushId(params?: any): Promise<boolean> {
    let staff = await Staff.getCurrent();
    let options: any = {};
    options.accountId = staff.id;
    options.type = 'jpush_id';
    if(params.jpushId){
        options.token = params.jpushId;
    }
    let tokens = await Models.token.find({where: options});

    if(!tokens || tokens.length <= 0) {
        return false;
    }

    await Promise.all(tokens.map((token) => token.destroy()));
    return true;
}

/**
 * 用户绑定设备id
 * @type {saveOrUpdateJpushId}
 */
export async function saveOrUpdateJpushId(params): Promise<Token>  {
    let staff = await Staff.getCurrent();
    let list = await Models.token.find({where: {token: params.jpushId, type:'jpush_id', accountId: {$ne: staff.id}}});

    if(list && list.length > 0) {
        await Promise.all(list.map((op) => op.destroy()));
    }

    let selfList = await Models.token.find({where: {token: params.jpushId, type:'jpush_id', accountId: staff.id}});

    if(selfList && selfList.length > 0) {
        return selfList[0];
    }

    let obj = Models.token.create({token: params.jpushId, accountId: staff.id, type:'jpush_id'});
    return obj.save();
}


/**
 * 获取绑定的设备id
 * @type {getJpushIdByAccount}
 * @param params
 * @returns {null}
 */
export async function getJpushIdByAccount(params: {accountId: string}): Promise<string[]> {
    let list = await Models.token.find({where: {accountId: params.accountId, type:'jpush_id'}});

    if(!list || list.length <= 0) {
        return null;
    }
    var result = [];
    list.forEach(function(item){
        result.push(item.token);
    })
    return result;
}