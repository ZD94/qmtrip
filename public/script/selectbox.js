
function Myselect () {
	$(".selectbox").each(function(){
		$(this).find(".common_select").css('width',$(this).width()-22);
		$(this).find(".common_option").css('width',$(this).width()-2);
	});
	$(".selectbox").find(".common_select").click(function(e) {
		$(".common_option").hide();
		$(this).parent().find(".common_option").toggle();
		e=e||window.event;
		e.stopPropagation();
	});
	$(document).click(function() {
		$(".selectbox").find(".common_option").hide();
	});
	$(".selectbox div").click(function() {
		console.log(123);
		var index = $(this).index();
		var x = $(this).text();
		$(this).parent().siblings(".common_select").html(x);
		var value = $(this).attr('selectValue');
		$(this).parent().siblings(".common_select").attr('selectValue',value);
	});
}


function selectPage (el , content , options) {

	$('.select_page').remove();

	var el = $(el);

	var str = "";

	str += "<dl class='select_page'>";
	str += "<div class='select_input'><input type='text' class='common_text w100 select_input1' placeholder="+options.placeholder+"></div>";
	str += "<dt>"+options.title+"</dt>";

	for (i=0;i<options.limit;i++) {
		if (content[i].name == undefined) {
			break;
		}
		str += "<dd ng-click='asd()'>"+content[i].name+"</dd>";
	}

	str += "</dl>";

	$('#angular-view').append(str);

	if (options.showDefault == true) {
		$('.select_page dt,.select_page dd').show();
	}
	else if (options.showDefault == false) {
		$('.select_page dt,.select_page dd').hide();
	}

	$('.select_page dd').click(function(){
		el.html($(this).html());
		$('.select_page').remove();
	});

	return $('.select_input1').val();
}