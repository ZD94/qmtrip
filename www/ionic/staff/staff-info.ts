import { Staff } from 'api/_types/staff/staff';
export async function StaffInfoController($scope, Models, ngModalDlg ,$ionicPopup, wxApi) {
    $scope.uploadUrl = '/upload/ajax-upload-file?type=avatar';
    require('./staff-info.scss');
    var staff = await Staff.getCurrent();
    $scope.staff = staff;
    $scope.company = await staff.company;
    $scope.department = await staff.department;
    $scope.travelpolicy = await staff.getTravelPolicy(staff['travelPolicyId']);
    $scope.staffRole = ['创建者','员工','管理员','财务'];

    $scope.invoicefuc = {title:'上传头像',done:function(response){
        if(response.ret != 0){
            console.error(response.errMsg);
            $ionicPopup.alert({
                title: '错误',
                template: response.errMsg
            });
            return;
        }
        var fileId = response.fileId;
        staff.avatar = fileId[0];
        staff.save();
    }}

    /*$scope.addCoin = async function(){
        let a = await staff.addCoin(10,"测试加钱");
        console.info(a);
        console.info("==---------");
    }*/
    // $scope.changeAvator = function(){
    //     ngModalDlg.createDialog({
    //         parent:$scope,
    //         scope:{},
    //         template: require('./avator-template.html'),
    //         controller: AvatroController
    //     })
    // }
}
