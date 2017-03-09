import { Staff } from '_types/staff/staff';
import { NoticeAccount, ESendType } from '_types/notice';
import moment = require("moment");

export * from './detail';
export * from './notice-type';
var msgbox = require('msgbox');

export async function IndexController($scope, Models, $ionicPopup, $stateParams) {
    require('./notice.scss');
    $scope.notices = [];
    var staff = await Staff.getCurrent();
    var pager = await staff.getSelfNotices({limit: 5,where: {type: $stateParams.type}});
    await loadStaffs(pager);
    var vm = {
        hasNextPage: function() {
            return pager.totalPages-1 > pager.curPage;
        },
        nextPage : async function() {
            try {
                let newArr =[];
                let join = {};
                pager = await pager.nextPage();
                await Promise.all(pager.map(async function(item){
                    let relate = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: item.id}});
                    if(relate && relate.length >0){
                        item["isRead"] = relate[0].isRead;
                    }else{
                        item["isRead"] = false;
                    }
                    $scope.notices.push(item);
                }))
            }catch(err) {
                alert("获取数据时,发生异常");
                return;
            } finally {
                $scope.$broadcast('scroll.infiniteScrollComplete');
            }
        },
        doRefresh: async function(){
            try{
                pager = await staff.getSelfNotices({limit: 5, where: {type: $stateParams.type}});
            } catch(err){
                msgbox.log('刷新失败');
                return
            }
            $scope.pager = pager;
            reloadNotices(pager);
            $scope.$broadcast('scroll.refreshComplete');
        }
    }

    $scope.vm = vm;
    
    async function loadStaffs(pager) {
        if(pager && pager.length>0){
            await Promise.all(pager.map(async function(notice){
                let relate = await Models.noticeAccount.find({where: {accountId: staff.id, noticeId: notice.id}});
                if(relate && relate.length >0){
                    notice["isRead"] = relate[0].isRead;
                }else{
                    notice["isRead"] = false;
                }
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

    $scope.detail = async function (notice) {
        //标记已读
        await notice.setReadStatus();
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
                            await notice.staffDeleteNotice();
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
