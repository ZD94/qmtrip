
import {LoginResponse} from "api/_types/auth/auth-cert";
declare var ionic:any;
var jPushPlugin;
var API = require('common/api');

export default async function initJPush($ionicPlatform, $document){
    API.require('auth');
    await API.onload();
    $ionicPlatform.ready(function(){
        console.log('platform ready');
        var jpushId = localStorage.getItem('jpushId');
        if(!window.cordova || !window.plugins || !window.plugins['jPushPlugin'])
            return;
        jPushPlugin = window.plugins['jPushPlugin'];

        document.addEventListener("jpush.setTagsWithAlias", onTagsWithAlias, false);
        document.addEventListener("jpush.openNotification", onOpenNotification, false);
        document.addEventListener("jpush.receiveNotification", onReceiveNotification, false);
        document.addEventListener("jpush.receiveMessage", onReceiveMessage, false);
        
        jPushPlugin.init();

        document.addEventListener('needJPushId',getRegistrationID, false);

        if(!jpushId){
            getRegistrationID();
        }
        document.addEventListener('resume', resetBadgeNumber, false);
        if (ionic.Platform.isIOS()) {
            jPushPlugin.setDebugModeFromIos();
            jPushPlugin.setApplicationIconBadgeNumber(0);
        } else {
            jPushPlugin.setDebugMode(true);
            jPushPlugin.setStatisticsOpen(true);
        }
    });
}

function resetBadgeNumber(){
    if (ionic.Platform.isIOS()) {
        jPushPlugin.setApplicationIconBadgeNumber(0);
    } else {
        jPushPlugin.clearAllNotification();
    }
}

function getAuthData(): LoginResponse {
    var data = localStorage.getItem('auth_data');
    try{
        return JSON.parse(data);
    }catch(e){
        return null;
    }
}

function getRegistrationID(){
    jPushPlugin.getRegistrationID(onGetRegistrationID);
}

async function onGetRegistrationID(data) {
    API.require('auth');
    await API.onload();
    let authData = getAuthData();
    try {
        console.log("JPushPlugin:registrationID is " + data);
        if(data.length != 0 && authData) {
            var a = await API.auth.saveOrUpdateJpushId({jpushId: data});
            localStorage.setItem('jpushId',data)
        }
        if (data.length == 0) {
            var t1 = window.setTimeout(getRegistrationID, 1000);
        }
    } catch (exception) {
        console.log(exception);
    }
};

function onTagsWithAlias(event) {
    try {
        console.log("onTagsWithAlias");
        var result = "result code:" + event.resultCode + " ";
        result += "tags:" + event.tags + " ";
        result += "alias:" + event.alias + " ";
        alert(result);
    } catch (exception) {
        console.log(exception)
    }
};

function onOpenNotification(event) {
    try {
        var alertContent;
        var link;
        if (device.platform == "Android") {
            alertContent = event.alert;
            link = event.extras.link;
        } else {
            alertContent = event.aps.alert;
            link = event.link;
        }
        // alert("open Notification:" + alertContent);
        if(link && link.length > 0){
            window.location.href = link;
        }
    } catch (exception) {
        console.log("JPushPlugin:onOpenNotification" + exception);
    }
};

function onReceiveNotification(event) {
    try {
        var alertContent;
        if (device.platform == "Android") {
            alertContent = event.alert;
        } else {
            alertContent = event.aps.alert;
        }
        // alert(alertContent);
    } catch (exception) {
        console.log(exception)
    }
};

function onReceiveMessage(event) {
    try {
        var message;
        if (device.platform == "Android") {
            message = event.message;
        } else {
            message = event.content;
        }
        alert(message);
    } catch (exception) {
        console.log("JPushPlugin:onReceiveMessage-->" + exception);
    }
};
