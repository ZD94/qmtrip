import { Models } from 'api/_types/index';
import { Staff } from 'api/_types/staff/staff';

/**
 * 删除绑定的设备id
 * @param params
 * @returns {boolean}
 */
export async function destroyJpushId(params?: {}): Promise<boolean> {
    let staff = await Staff.getCurrent();
    let tokens = await Models.token.find({where: {accountId: staff.id, type:'jpush_id'}});

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
export async function saveOrUpdateJpushId(params) {
    let staff = await Staff.getCurrent();
    let list = await Models.token.find({where: {token: params.jpushId, type:'jpush_id'}});

    if(list && list.length > 0) {
        await Promise.all(list.map((op) => op.destroy()));
    }

    let obj = Models.token.create({token: params.jpushId, accountId: staff.id, type:'jpush_id'});
    await obj.save();
}


/**
 * 获取绑定的设备id
 * @type {getJpushIdByAccount}
 * @param params
 * @returns {null}
 */
export async function getJpushIdByAccount(params: {accountId: string}): Promise<string> {
    let list = await Models.token.find({where: {accountId: params.accountId, type:'jpush_id'}});

    if(!list || list.length <= 0) {
        return null;
    }

    let obj = list[0];
    return obj.token;
}