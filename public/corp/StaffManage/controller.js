
'use strict';
var staff = (function(){

    API.require('staff');
    var  staff = {};

    staff.StaffInfoManageController = function($scope){

        $scope.addStaff = function() {
            $("#add").addClass("onCheck");
            $(".add_staff").show();
        }
        $scope.cancelAdd = function() {
            $(".add_staff").hide();
            $("#add").removeClass("onCheck");
        }
    }
    return staff;
})();
module.exports = staff;