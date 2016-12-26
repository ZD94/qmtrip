import { Staff } from 'api/_types/staff/staff';
import { COIN_CHANGE_TYPE } from 'api/_types/coin';
import moment = require("moment");

export * from './detail';
export * from './get-coin';
var msgbox = require('msgbox');

export async function IndexController($scope, Models, $ionicPopup, $stateParams, inAppBrowser) {
    require('./index.scss');
    $scope.coinAccountChanges = [];
    var staff = await Staff.getCurrent();
    var pager = await staff.getCoinAccountChanges();
    $scope.pager = pager;
    $scope.staff = staff;
    $scope.COIN_CHANGE_TYPE = COIN_CHANGE_TYPE;
    await loadData(pager);
    var pagersDate = {
        isHasNextPage:true,
        nextPage : async function() {
            try {
                pager = await $scope.pager['nextPage']();
            } catch(err) {
                this.isHasNextPage = false;
                return;
            }
            $scope.pager = pager;
            await loadData(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        },
        doRefresh: async function(){
            try{
                pager = await staff.getCoinAccountChanges();
            } catch(err){
                msgbox.log('刷新失败');
                return
            }
            $scope.pager = pager;
            reloadData(pager);
            $scope.$broadcast('scroll.refreshComplete');
        }
    }

    async function loadData(pager) {
        if(pager && pager.length>0){
            await Promise.all(pager.map(async function(item){
                $scope.coinAccountChanges.push(item);
            }));
        }
    }
    function reloadData(pager){
        if(pager && pager.length>0){
            $scope.coinAccountChanges = [];
            pager.forEach(function(item){
                $scope.coinAccountChanges.push(item);
            });
        }
    }

    $scope.pagersDate = pagersDate;


    $scope.detail = async function (item) {
        window.location.href = "#/coin-account/detail?id=" + item.id;
    }

    $scope.goShop = async function(){
        //var duiBaUrl = await staff.getDuiBaLoginUrl();
        //inAppBrowser.open(duiBaUrl);
    }

    /*$scope.delete = async function(item, index) {
        $ionicPopup.show({
            title: '确定删除该通知吗？',
            scope: $scope,
            buttons: [
                {
                    text: '取消',
                },
                {
                    text: '确定',
                    type: 'button-positive',
                    onTap: async function (e) {
                        try{
                            await item.destroy();
                            $scope.coinAccountChanges.splice(index, 1);
                            msgbox.log("删除成功");
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        })
    }*/
}
