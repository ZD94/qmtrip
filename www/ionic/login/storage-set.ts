export function StorageSetController($scope, $stateParams, $storage) {
    let token_id = $stateParams.token_id;
    let user_id = $stateParams.user_id;
    let token_sign = $stateParams.token_sign;
    let timestamp = $stateParams.timestamp;
    let back_url = $stateParams.back_url;
    var data = { token_id: token_id,
        user_id: user_id,
        token_sign: token_sign,
        timestamp: timestamp };
    $storage.local.set('auth_data', data);
    //服务器端无法读取storage
    Cookie.set("user_id", data.user_id, {expires: 30});
    Cookie.set("token_sign", data.token_sign, {expires: 30});
    Cookie.set("timestamp", data.timestamp, {expires: 30});
    Cookie.set("token_id", data.token_id, {expires: 30});
    API.reload_all_modules();
    window.location.href = back_url;
}