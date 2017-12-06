/**
 * Created by wangyali on 2017/6/28.
 */
var ldap = require('ldapjs');
export default class LdapApi {

    private url: string;
    private client: any;

    constructor(url: string) {
        this.url = url;
        this.client = ldap.createClient({
            url: url
        });
    }

    async bindUser(params:{entryDn: string, userPassword: string}){
        return new Promise<any>( (resolve, reject) => {
            return this.client.bind(params.entryDn, params.userPassword, function (err: any) {
                if (err) return reject(err);
                return resolve(true);
            })
        })
    }

    async searchDn(params: {rootDn: string, opts: any}){
        let result: any[] = [];
        return new Promise<any>( (resolve, reject) => {
            return this.client.search(params.rootDn, params.opts, function (err: any, search: any) {
                search.on('searchEntry', function (entry: any) {
                    var user = entry.object;
                    result.push(user);
                });

                search.on('end', function () {
                    return resolve(result);
                });

                search.on('error', function (err: any) {
                    return reject(err);
                });
            })
        })
    }

    async getParentDn(params:{dn: string}){
        let parseDN = ldap.parseDN;
        let dn = parseDN(params.dn);
        let parentDn = dn.parent();
        return parentDn.toString();
    }

    async unBind(){
        return new Promise<any>( (resolve, reject) => {
            return this.client.unbind(function (err: any) {
                if (err) return reject(err);
                return resolve(true);
            })
        })
    }
}
