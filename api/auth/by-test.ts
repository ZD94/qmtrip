
import { Models } from '_types/index';

/**
 * @method removeByTest 删除账号
 *
 * @param {Object} data
 * @param {UUID} data.accountId 账号ID
 * @return {Promise}
 * @public
 */
export async function removeByTest(data: {accountId: string, email: string, mobile?: string, type?: Number}) {

    var accountId = data.accountId;
    var email = data.email;
    var mobile = data.mobile;
    var type = data.type || 1;
    var where: any = {$or: [{id: accountId}, {email: email}, {mobile: mobile}]};
    if(!accountId) {
        where.type = type;
    }
    var accounts = await Models.account.find({where});
    do{
        for(let i=0; i<accounts.length; i++){
            accounts[i].destroy();
        }
    }while(await accounts.nextPage());
}

