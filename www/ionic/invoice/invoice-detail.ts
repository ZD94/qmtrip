import {
    ETripType, EPlanStatus, EInvoiceType, EInvoiceFeeTypes, EPayType, EInvoiceStatus,
    InvoiceFeeTypeNames, PayTypeNames
} from 'api/_types/tripPlan';
import * as path from 'path';
import {ImgTemplateController} from './img-template';
import moment = require('moment');
import {Model} from "sequelize";
var API = require('common/api');
var msgbox = require('msgbox');

export async function InvoiceDetailController($scope , Models, $stateParams, $ionicPopup, $ionicSlideBoxDelegate, ngModalDlg, City, $ionicModal){

    $scope.EInvoiceFeeTypes = EInvoiceFeeTypes;
    $scope.InvoiceFeeTypeNames = InvoiceFeeTypeNames;
    $scope.EPayType = EPayType;
    $scope.PayTypeNames = PayTypeNames;
    $scope.parseInt = parseInt;
    
    //////绑定上传url
    require("./invoice-detail.scss");
    let authDataStr = window['getAuthDataStr']();
    $scope.uploadUrl = '/upload/ajax-upload-file?type=image&auth='+authDataStr;
    ///// END

    $scope.EPlanStatus = EPlanStatus;
    function formatInvoice(invoices) {
        if (!invoices) invoices = [];
        return invoices.map(function(invoice){
            if(invoice.pictureFileId != null){
                let img = path.join(config.update, 'trip-detail', $stateParams.detailId, 'invoice', invoice.pictureFileId);
                img = path.normalize(img);
                img = img+'?authstr='+authDataStr;
                invoice.imgUrl = img;
            }else{
                invoice.imgUrl = 'ionic/images/invoiceEmpty.png';
            }
            invoice.edit = false;
            return invoice;
        })
    }
    $scope.EInvoiceStatus = EInvoiceStatus;
    $scope.select_menu = true;
    var config = require('config');
    await config.$ready;
    var tripDetail = await Models.tripDetail.get($stateParams.detailId);
    var invoices = await tripDetail.getInvoices();
    $scope.invoices = formatInvoice(invoices);
    if(tripDetail.type == EInvoiceType.HOTEL){
        tripDetail.h_city = await City.getCity(tripDetail.city);
    }else{
        tripDetail.a_city = await City.getCity(tripDetail.arrivalCity);
        tripDetail.d_city = await City.getCity(tripDetail.deptCity);
    }
    let initPager = 0;
    let addNew = $stateParams.method;
    if(addNew == 'add'){
        initPager = invoices.length;
        console.info(initPager);
    }
    $scope.initPager = initPager;
    $scope.tripDetail = tripDetail;
    $ionicSlideBoxDelegate.update();
    console.info(invoices);
    $scope.dateOptions = {
        beginDate: moment().add(-1,'years').startOf('months').toDate(),
        endDate: new Date(),
        timepicker: false,
        title: '选择开始时间',
    }
    $scope.EInvoiceType = EInvoiceType;

    let statusTxt = {};
    statusTxt[EPlanStatus.AUDIT_NOT_PASS] = "未通过";
    statusTxt[EPlanStatus.WAIT_UPLOAD] = "待上传票据";
    statusTxt[EPlanStatus.WAIT_COMMIT] = "待提交";
    statusTxt[EPlanStatus.AUDITING] = "已提交待审核";
    statusTxt[EPlanStatus.COMPLETE] = "已完成";
    $scope.statustext = statusTxt;
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
    $scope.invoicefuc = {
        title:'上传'+title + '发票',
        done: async function(response){
            if(response.ret != 0){
                $ionicPopup.alert({
                    title: '错误',
                    template: response.errMsg
                });
                return;
            }
            var fileId = (response.fileId && response.fileId.length) ? response.fileId[0] : '';
            $scope.fileId = fileId;
            let tempFile = response.tempFiles[fileId];
            let previewUrl = path.join(config.update,'attachment/temp',fileId)+'?expireTime='+tempFile.expireTime+'&sign='+tempFile.sign;
            $scope.previewUrl = previewUrl;
            $scope.$apply();
        }
    }

    function uploadInvoice(tripDetail, picture, callback) {
        tripDetail.uploadInvoice({
            pictureFileId: picture
        },callback)
    }

    $scope.backtodetail = function(){
        var tripPlan = tripDetail.tripPlan;
        window.location.href = "#/trip/list-detail?tripid="+tripPlan.id;
    }

    //查看票据
    $scope.imgView = async function(imgUrl){
        // $ionicModal.fromTemplateUrl('ionic/trip/img-template.html', {
        //     scope: $scope,
        //     animation: 'fade-in'
        // }).then(function(result){
        //     $scope.imgUrl = imgUrl;
        //     $scope.imgModal = result;
        //     $scope.imgModal.show();
        // })
        let imgView = await ngModalDlg.createDialog({
            parent: $scope,
            scope: {imgUrl},
            animation: 'fade-in',
            template: require('./img-template.html'),
            controller: ImgTemplateController
        })
    }

    //start 修改票据button事件
    $scope.editInvoice = false;
    $scope.editNow = function(invoice){
        invoice.edit = true;
        $ionicSlideBoxDelegate.enableSlide(false);
        // $scope.editInvoice = true;
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

    $scope.unBind = async function(invoice){
        $ionicPopup.show({
            title:'是否解除绑定',
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
        invoice.edit = false;
        invoice.pictureFileId = $scope.fileId;
        await invoice.save();
        $scope.previewUrl = null;
        let tripDetail = await Models.tripDetail.get($stateParams.detailId);
        let invoices = await tripDetail.getInvoices();
        $scope.invoices = formatInvoice(invoices);
        $ionicSlideBoxDelegate.enableSlide(true);
        // $scope.editInvoice = false;
    }
    $scope.cancelChanges = function(invoice){
        invoice.edit = false;
        $scope.previewUrl = null;
        $ionicSlideBoxDelegate.enableSlide(true);
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
        $scope.previewUrl = null;
        $scope.newInvoice = {
            totalMoney: '',
            invoiceDateTime: undefined,
            remark: '',
            payType: '',
            type: ''
        }
    }
    $scope.backToChooese = function(){
        $scope.previewUrl = null;
        $scope.select_menu = true;
    }
    //end 创建新票据button事件
}