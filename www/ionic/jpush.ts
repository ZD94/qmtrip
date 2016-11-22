
declare var ionic:any;
var jPushPlugin;

export default async function initJPush($ionicPlatform, $document){
    $ionicPlatform.ready(function(){
        console.log('platform ready');
        if(!window.cordova || !window.plugins || !window.plugins['jPushPlugin'])
            return;
        jPushPlugin = window.plugins['jPushPlugin'];

        document.addEventListener("jpush.setTagsWithAlias", onTagsWithAlias, false);
        document.addEventListener("jpush.openNotification", onOpenNotification, false);
        document.addEventListener("jpush.receiveNotification", onReceiveNotification, false);
        document.addEventListener("jpush.receiveMessage", onReceiveMessage, false);

        jPushPlugin.init();
        getRegistrationID();
        if (ionic.Platform.isIOS()) {
            jPushPlugin.setDebugModeFromIos();
            jPushPlugin.setApplicationIconBadgeNumber(0);
        } else {
            jPushPlugin.setDebugMode(true);
            jPushPlugin.setStatisticsOpen(true);
        }
    });
}


function getRegistrationID(){
    jPushPlugin.getRegistrationID(onGetRegistrationID);
}

function onGetRegistrationID(data) {
    try {
        console.log("JPushPlugin:registrationID is " + data);

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
        alert("open Notification:" + alertContent);
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
        alert(alertContent);
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
