import { Staff } from 'api/_types/staff/staff';

export async function IndexController($scope, $stateParams, inAppBrowser) {
    var staff = await Staff.getCurrent();
    var params:any = {};
    if($stateParams.redirect){
        params.redirect = $stateParams.redirect;
    }
    var duiBaUrl = await staff.getDuiBaLoginUrl(params);
    inAppBrowser.open(duiBaUrl);
}
