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

//��͸������ʾ��ֱ�Ӵ������Ϳ��ԡ�eg:black_err(str);
function black_err(str) {
    var timer = setInterval(function(){
        $('.err_alert').hide();
        clearInterval(timer);
    },3000);
    $('body').find('.err_alert').remove();
    var err = '<div class="err_alert"></div>';
    $('body').append(err);
    $('.err_alert').text(str);
    var err_w = $('.err_alert').width();
    $('.err_alert').css('margin-left',-(err_w/2+10));
    $('.err_alert').show();
    timer;
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
