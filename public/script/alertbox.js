/**
 * Created by qp on 2016/3/4.
 */
var reset = function () {
    alertify.set({
        labels : {
            ok   : "确认",
            cancel : "取消"
        },
        delay : 5000,
        buttonReverse : false,
        buttonFocus  : "ok"
    });
};

var message = "提示框";

function alert(message){
    reset();
    alertify.alert(message);
    return false;
}


function confirm(sure){
    reset();
    alertify.confirm(message, function (e) {
        if (e) {
            alertify.success("点击确认");
            sure();
        } else {
            alertify.error("点击取消");
        }
    });
    return false;
}

function prompt(){
    reset();
    alertify.prompt("提示输入框", function (e, str) {
        if (e) {
            alertify.success("点击确认，输入内容为: " + str);
        } else {
//			      alertify.error("点击取消");
        }
    }, "默认值");
    return false;
}

//alert
$("#alert").click(function () {
    alert(message);
})
//confirm
$("#confirm").click(function () {
    confirm(prompt);
})
//prompt
$("#prompt").click(function () {
    prompt();
})