
module.exports = function ($module){
    $module.directive('myselect',function(){
        return {
            restrict: 'A',
            template: '<dl><select class="zxc" style="display: none;"></select></dl>',
            replace: true,
            compile: function(element){
                var asd = $(".zxc");
                asd.attr("ng-options",element.attr("ng-optionssss"));
                asd.attr("ng-model",element.attr("ng-modellll"));
                element.removeAttr("ng-options");
                element.removeAttr("ng-model");
                return {
                    post : function ($scope) {
                        var option = $(element).find("option");
                        var select = $(element).find("select");
                        var len = option.length;
                        var str = "";
                        str += "<dt>"+$scope.selectOpt+"</dt>";
                        for (i=0; i<len; i++) {
                            str += "<dd checkval='"+option.eq(i).val()+"' style='display: none;'>"+option.eq(i).html()+"</dd>";
                        }
                        $(element).append(str);
                        $(element).find('dt').click(function(){
                            $(element).find('dd').toggle();
                        });
                        $(element).find('dd').click(function(){
                            $(element).find('dt').html($(this).html());
                            $(element).find('dt').attr("checkval",$(this).attr("checkval"));
                            $(element).find('dd').hide();
                            select.val($(this).attr("checkval"));
                            select.trigger('input');
                            alert ($scope.selectOpt);
                        });
                    }
                }

            }
        }
    });
};

