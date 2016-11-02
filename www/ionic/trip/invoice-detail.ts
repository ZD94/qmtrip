import {ETripType, EPlanStatus, EInvoiceType, EInvoiceFeeTypes, EPayType} from 'api/_types/tripPlan';
import * as path from 'path';
import moment = require('moment');
import {Model} from "sequelize";
var API = require('common/api');
var msgbox = require('msgbox');

export async function InvoiceDetailController($scope , Models, $stateParams, $ionicPopup, $ionicSlideBoxDelegate, ngModalDlg, City){
    //////绑定上传url
    require("./invoice-detail.scss");
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&auth='+authDataStr;
    ///// END

    function formatInvoice(invoices) {
        if (!invoices) invoices = [];
        return invoices.map(function(invoice){
            if(invoice.pictureFileId != null){
                let img = path.join(config.update, 'trip-detail', $stateParams.detailId, 'invoice', invoice.pictureFileId);
                img = path.normalize(img);
                img = img+'?authstr='+authDataStr;
                invoice.imgUrl = img;
            }else{
                invoice.imgUrl = 'ionic/images/logo_write10.png';
            }
            return invoice;
        })
    }

    //date选择
    $scope.selectDate = async function(){
        let value = await ngModalDlg.selectDate($scope, {
            beginDate: new Date(),
            endDate: moment().add(1, 'year').toDate(),
            timepicker: false,
            title: '选择开始时间',
            titleEnd: '选择结束时间'
        })
    }
    $scope.select_menu = true;
    var config = require('config');
    await config.$ready;
    var tripDetail = await Models.tripDetail.get($stateParams.detailId);
    var invoices = await tripDetail.getInvoices();
    $scope.invoices = formatInvoice(invoices);
    $ionicSlideBoxDelegate.update();
    if(tripDetail.type == EInvoiceType.HOTEL){
        tripDetail.h_city = await City.getCity(tripDetail.city);
    }else{
        tripDetail.a_city = await City.getCity(tripDetail.arrivalCity);
        tripDetail.d_city = await City.getCity(tripDetail.deptCity);
    }

    $scope.tripDetail = tripDetail;
    // $scope.invoices = invoices;
    $scope.dateOptions = {
        beginDate: tripDetail.createdAt,
        endDate: new Date(),
        timepicker: false
    }
    $scope.EInvoiceType = EInvoiceType;

    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    $scope.statustext = statusTxt;
    $scope.EPlanStatus = EPlanStatus;
    let title;
    if (tripDetail.type == ETripType.OUT_TRIP) {
        title = '去程交通';
    }
    if (tripDetail.type == ETripType.BACK_TRIP) {
        title = '回程交通';
    }
    if (tripDetail.type == ETripType.HOTEL) {
        title = '住宿';
    }
    $scope.invoicefuc = {title:'上传'+title + '发票',done:function(response){
        if(response.ret != 0){
            console.error(response.errMsg);
            $ionicPopup.alert({
                title: '错误',
                template: response.errMsg
            });
            return;
        }
        var fileId = response.fileId;
        $scope.fileId = fileId;
        uploadInvoice(tripDetail, fileId,async function (err, result) {
            if (err) {
                alert(err.msg ? err.msg : err);
                return;
            }
            var newdetail = await Models.tripDetail.get($stateParams.detailId);
            $scope.invoice = newdetail;
        });
    }}

    function uploadInvoice(tripDetail, picture, callback) {
        tripDetail.uploadInvoice({
            pictureFileId: picture
        },callback)
    }

    $scope.backtodetail = function(){
        var tripPlan = tripDetail.tripPlan;
        window.location.href = "#/trip/list-detail?tripid="+tripPlan.id;
    }
    //start 修改票据button事件
    $scope.editInvoice = false;
    $scope.editNow = function(){
        $scope.editInvoice = true;
    };
    $scope.deleteInvoice = async function(invoice,$index){
        $ionicPopup.show({
            title:'是否删除',
            scope: $scope,
            buttons:[
                {text:'取消'},
                {
                    text:'确定',
                    type: 'button-positive',
                    onTap: async function(){
                        invoice.destroy();
                        $scope.tripDetail = await Models.tripDetail.get($stateParams.detailId);
                        $scope.invoices = formatInvoice(await tripDetail.getInvoices());
                        $ionicSlideBoxDelegate.update();
                    }
                }
            ]
        })
    }
    $scope.saveChanges = async function(invoice){
        invoice.save();
        $scope.editInvoice = false;
    }
    $scope.cancelChanges = function(){
        $scope.editInvoice = false;
    }

    //start 创建新票据button事件
    $scope.manual = function(){
        $scope.select_menu = false;
    }

    $scope.linkOthers = function(){
        window.location.href = "#/trip/select-supplier?detailId="+$stateParams.detailId;
    }

    $scope.newInvoice = {
        totalMoney: '',
        invoiceDateTime: undefined,
        remark: '',
        payType: '',
        type: ''
    }
    $scope.createInvoice = async function(){
        var newInvoice = Models.tripDetailInvoice.create({tripDetailId: tripDetail.id});
        newInvoice.totalMoney = $scope.newInvoice.totalMoney;
        newInvoice.payType = $scope.newInvoice.payType;
        newInvoice.remark = $scope.newInvoice.remark;
        newInvoice.type = $scope.newInvoice.type;
        newInvoice.invoiceDateTime = $scope.newInvoice.invoiceDateTime;
        newInvoice.pictureFileId = $scope.fileId;
        if(newInvoice.totalMoney == null){
            msgbox.log('请输入金额');
            return;
        }
        if(newInvoice.payType == null){
            msgbox.log('支付方式');
            return;
        }
        if(newInvoice.type == null){
            msgbox.log('票据类型');
            return;
        }
        if(newInvoice.invoiceDateTime == null){
            msgbox.log('请输入时间');
            return;
        }
        if(newInvoice.payType == null){
            msgbox.log('请输入金额');
            return;
        }
        newInvoice.save();
        $scope.tripDetail = await Models.tripDetail.get($stateParams.detailId);
        $scope.invoices = formatInvoice(await tripDetail.getInvoices());
        $ionicSlideBoxDelegate.update();
        $scope.select_menu = true;
        $scope.newInvoice = {
            totalMoney: '',
            invoiceDateTime: undefined,
            remark: '',
            payType: '',
            type: ''
        }
    }
    $scope.backToChooese = function(){
        $scope.select_menu = true;
    }
    //end 创建新票据button事件
}