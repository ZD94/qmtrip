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

//��͸������ʾ
function black_err() {
    var err_w = $('.err_alert').width();
    $('.err_alert').css('margin-left',-(err_w/2+10));
    $('.err_alert').show();
    setInterval(function(){
        $('.err_alert').hide();
    },3000);
}

//var message = "��ʾ��";
//
//function alert(message){
//    reset();
//    alertify.alert(message);
//    return false;
//}

//������ť����������򡣲�������ťok����ťcancel�����ok��ִ�еķ�������
function confirm(oks,cancels,sure){
    alertify.set({
        labels : {
            ok   : oks,
            cancel : cancels
        },
        delay : 5000,
        buttonReverse : false
        //buttonFocus  : "ok"
    });

    alertify.confirm(message, function (e) {
        if (e) {
            //alertify.success("���ȷ��");
            sure();
        } else {
            //alertify.error("���ȡ��");
        }
    });
    return false;
}

//function prompt(){
//    reset();
//    alertify.prompt("��ʾ�����", function (e, str) {
//        if (e) {
//            alertify.success("���ȷ�ϣ���������Ϊ: " + str);
//        } else {
////			      alertify.error("���ȡ��");
//        }
//    }, "Ĭ��ֵ");
//    return false;
//}
