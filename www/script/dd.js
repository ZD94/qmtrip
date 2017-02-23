/**
 * Created by wlh on 16/9/20.
 */
(function(g) {
  //如果不是在钉钉中,直接跳过
  if (!/dingtalk/i.test(g.navigator.userAgent)) {
    return false;
  }

  var cache = {
    set: function (key, val) {
      localStorage.setItem(key, val);
    },
    get: function(key) {
      return localStorage.getItem(key);
    }
  }

  if ('undefined' == typeof WebViewJavascriptBridge) {
    var key = 'is_show_ddtalk_alert';
    let ret = cache.get(key);
    if (!ret) {
      alert('目前仅支持钉钉手机客户端自动登录,电脑登录需先通过手机客户端绑定手机号后进行');
      cache.set(key, true);
    }
    return false;
  }

  var key = 'ddtalk_corp_id'
  var reg = /corpid=(\w+)/;
  var groups = reg.exec(window.location.href);
  if (groups && groups.length) {
    //判断,如果corpid不存在或者不等于上次的corpid直接清楚登录信息
    var corpid = groups[1];
    var old_corpid = cache.get(key);
    if (corpid != old_corpid) {
      localStorage.removeItem('auth_data');
    }
    cache.set(key, groups[1]);
  }
  var ddtalk = {};
  ddtalk.getCorpid = function() {
    var _corpid = cache.get(key);
    return _corpid;
  }
  g.ddtalk = ddtalk;
})(window);