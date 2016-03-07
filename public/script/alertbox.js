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

//半透明框提示
function black_err() {
    var err_w = $('.err_alert').width();
    $('.err_alert').css('margin-left',-(err_w/2+10));
    $('.err_alert').show();
    setInterval(function(){
        $('.err_alert').hide();
    },3000);
}

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