import { Staff } from 'api/_types/staff/staff';
import { NoticeAccount, ESendType } from 'api/_types/notice';
import moment = require("moment");

export * from './detail';
export * from './notice-type';
var msgbox = require('msgbox');
export async function IndexController($scope, Models, $ionicPopup, $stateParams) {
    require('./notice.scss');
    $scope.notices = [];
    var staff = await Staff.getCurrent();
    var pager = await staff.getSelfNotices({where: {type: $stateParams.type}});
    $scope.pager = pager;
    await loadStaffs(pager);
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
            await loadStaffs(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        },
        doRefresh: async function(){
            try{
                pager = await staff.getSelfNotices({where: {type: $stateParams.type}});
            } catch(err){
                msgbox.log('刷新失败');
                return
            }
            $scope.pager = pager;
            reloadNotices(pager);
            $scope.$broadcast('scroll.refreshComplete');
        }
    }
    
    async function loadStaffs(pager) {
        if(pager && pager.length>0){
            await Promise.all(pager.map(async function(notice){
                //有待查证
                var noticeAccounts = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
                if(noticeAccounts && noticeAccounts.length>0){
                    notice["isRead"] = noticeAccounts[0].isRead;
                }
                //有待查证
                $scope.notices.push(notice);
            }));
        }
    }
    function reloadNotices(pager){
        if(pager && pager.length>0){
            $scope.notices = [];
            pager.forEach(function(notice){
                $scope.notices.push(notice);
            });
        }
    }

    $scope.pagersDate = pagersDate;


    $scope.detail = async function (notice) {
        //标记已读
        var noticeAccounts = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
        if(noticeAccounts && noticeAccounts.length>0 && !noticeAccounts[0].isRead){
            noticeAccounts[0].isRead = true;
            noticeAccounts[0].readTime = moment().toDate();
            await noticeAccounts[0].save();
        }
        if(notice.content && notice.content.startsWith("skipLink@")){
            // console.info("直接跳转");
            window.location.href = notice.content.substring(9);
        }else{
            // console.info("跳转详情");
            window.location.href = "#/notice/detail?noticeId=" + notice.id;
        }

    }

    $scope.delete = async function(notice, index) {
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
                            var noticeAccount = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
                            if(noticeAccount && noticeAccount.length>0){
                                await noticeAccount[0].destroy();
                            }
                            $scope.notices.splice(index, 1);
                            msgbox.log("删除成功");
                        }catch(err){
                            msgbox.log(err.msg);
                        }
                    }
                }
            ]
        })
    }
}
