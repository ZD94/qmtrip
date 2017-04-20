var API = require("@jingli/dnode-api");
API.authenticate = function(remote, cb) {
    var tokenId = Cookie.get("token_id");
    var userId = Cookie.get("user_id");
    var sign = Cookie.get("token_sign");
    var timestamp = Cookie.get("timestamp");
    remote.authenticate({accountid: userId, tokenid: tokenId, tokensign: sign, timestamp: timestamp}, cb);
}