/**
 * Created by qp on 2016/3/4.
 */
var reset = function () {
    alertify.set({
        labels : {
            ok   : "ȷ��",
            cancel : "ȡ��"
        },
        delay : 5000,
        buttonReverse : false,
        buttonFocus  : "ok"
    });
};

var message = "��ʾ��";

function alert(message){
    reset();
    alertify.alert(message);
    return false;
}


function confirm(sure){
    reset();
    alertify.confirm(message, function (e) {
        if (e) {
            alertify.success("���ȷ��");
            sure();
        } else {
            alertify.error("���ȡ��");
        }
    });
    return false;
}

function prompt(){
    reset();
    alertify.prompt("��ʾ�����", function (e, str) {
        if (e) {
            alertify.success("���ȷ�ϣ���������Ϊ: " + str);
        } else {
//			      alertify.error("���ȡ��");
        }
    }, "Ĭ��ֵ");
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