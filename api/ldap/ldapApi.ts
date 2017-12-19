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
            return this.client.bind(params.entryDn, params.userPassword, function (err: Error) {
                if (err) return reject(err);
                return resolve(true);
            })
        })
    }

    async searchDn(params: {rootDn: string, opts: {[key: string]: any}}) {
        let result: any[] = [];
        return new Promise<any>( (resolve, reject) => {
            return this.client.search(params.rootDn, params.opts, function (err: Error, search: { on: Function }) {
                search.on('searchEntry', function (entry: {object: object}) {
                    var user = entry.object;
                    result.push(user);
                });

                search.on('end', function () {
                    return resolve(result);
                });

                search.on('error', function (err: Error) {
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
            return this.client.unbind(function (err: Error) {
                if (err) return reject(err);
                return resolve(true);
            })
        })
    }
}
