/**
 * Created by wangyali on 2017/7/17.
 */
import {Models} from "_types/index";
import {CPropertyType} from "_types/company";
import L from '@jingli/language';
import LdapApi from "./ldapApi";
export default class ShareConnection {

    static connectionMap: any = {};

    static async initConnection(params: {companyId: string}){
        let ldapProperty = await Models.companyProperty.find({where: {companyId: params.companyId, type: CPropertyType.LDAP}});
        if(!ldapProperty || !ldapProperty[0]){
            throw L.ERR.INVALID_ARGUMENT("ldap相关设置");
        }
        let ldapInfo = ldapProperty[0].value;
        let ldapInfoJson = JSON.parse(ldapInfo);

        let ldapApi = new LdapApi(ldapInfoJson.ldapUrl);
        ShareConnection.connectionMap[params.companyId] = ldapApi;
    }
}