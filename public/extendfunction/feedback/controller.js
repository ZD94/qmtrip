/**
 * Created by qp on 2016/2/22.
 */
'use strict';
var feedback=(function(){

    API.require("staff");
    API.require("company");
    API.require("feedback");

    var  feedback = {};

    feedback.FeedbackController = function($scope) {
        $("title").html("意见反馈");
        //$(".staff_header").hide();
        $scope.subFeedback = function(){
            var params = {};
            var content = $("#content").val();
            var isAnonymity = $("#anonymity").is(':checked');
            if(!content || content==""){
                Myalert("温馨提示","请把您的建议告诉我们");
                return false;
            }
            params.content = content;
            params.isAnonymity = isAnonymity;
            API.onload(function(){
                API.staff.getCurrentStaff()
                    .then(function(staff){
                        params.userName = staff.name;
                        return API.company.getCompanyById(staff.companyId)
                    })
                    .then(function(company){
                        params.companyName = company.name;
                        return API.feedback.sendFeedback(params)
                    })
                    .then(function(fb){
                        if(fb){
                            Myalert("温馨提示","您的意见已成功提交");
                            $("#content").val("");
                        }
                    })
                    .catch(function(err){
                        console.info (err);
                    });
            });
        }
    }

    return feedback;
})();

module.exports = feedback;