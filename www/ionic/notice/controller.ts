import { Staff } from 'api/_types/staff/staff';

export * from './detail';

export async function IndexController($scope, Models, $location) {
    $scope.notices = [];
    var staff = await Staff.getCurrent();
    var pager = await staff.getSelfNotices();
    $scope.pager = pager;
    loadStaffs(pager);
    var vm = {
        isHasNextPage:true,
        nextPage : async function() {
            try {
                pager = await $scope.pager['nextPage']();
            } catch(err) {
                this.isHasNextPage = false;
                return;
            }
            $scope.pager = pager;
            loadStaffs(pager);
            $scope.$broadcast('scroll.infiniteScrollComplete');
        }
    }

    function loadStaffs(pager) {
        if(pager && pager.length>0){
            pager.forEach(function(notice){
                $scope.notices.push(notice);
            });
        }
    }

    $scope.vm = vm;

    $scope.detail = async function (notice) {
        //标记已读
        if(!notice.isRead){
            notice.isRead = true;
            await notice.save();
        }
        if(notice.content && notice.content.length > 0){
            window.location.href = "#/notice/detail?noticeId=" + notice.id;
        }else{
            window.location.href = notice.link;
        }

    }
}
