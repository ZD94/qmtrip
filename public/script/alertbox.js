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
    $('body').find('.err_alert').remove();
    var timer = setTimeout(function(){
        $('.err_alert').hide();
    },3000);
    var err = '<div class="err_alert">'+str+'</div>';
    $('body').append(err);
    var err_w = $('.err_alert').width();
    $('.err_alert').css('margin-left',-(err_w/2+10));
    $('.err_alert').show();

}

//var message = "��ʾ��";
//
//function alert(message){
//    reset();
//    alertify.alert(message);
//    return false;
//}

//confirm('ok按钮的名字','取消按钮的名字','要显示的内容',方法名字)
function confirm(oks,cancels,message,sure){
    alertify.set({
        labels : {
            ok   : oks,
            cancel : cancels
        },
        delay : 5000,
        //buttonReverse : false
        //buttonFocus  : "ok"
    });

    alertify.confirm(message, function (e) {
        if (e) {
            //alertify.success("");
            sure();
        } else {
            //alertify.error("");
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


