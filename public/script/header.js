$(function(){
	$(window).load(function(){ minHeight();})
	$(window).scroll(function(){ minHeight();})
	$(window).resize(function(){ minHeight();})
	$("#account").hover(function(){
		$("#account_menu").show();
	},function(){
		$("#account_menu").hide();
	})
	$("#account_menu").hover(function(){
		$("#account_menu").show();
	},function(){
		$("#account_menu").hide();
	})
	function minHeight(){
		var wh = $(window).height();
		$(".staff_content").css("min-height",wh-81-76); //减去的值为当前页面header及footer
		$(".business_content").css("min-height",wh-81-76); //减去的值为当前页面header及footer
		$(".corp_box").css("min-height",wh-61-60-20); //减去的值为当前页面header及footer  20为padding值
	}
})