
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


function selectPage (options) {
	var defaultDataFunc = options.defaultDataFunc;
	var fetchDataFunc = options.fetchDataFunc;	//去那个地址去抓数据
	var displayNameKey = options.displayNameKey;
	var valueKey = options.valueKey;
	var showDefault = options.showDefault;
	var isAllowAdd = options.isAllowAdd;

	return defaultDataFunc()
		.then(function() {
			wrapHtml();
		})
		.then(function() {
			return defaultDataFunc()
				.then(function(data) {
					appendData(data);
				})
				.then(function() {
					return new Promise(function(resolve) {
						$('.cancelBtn').click(function(){
							$('.select_page').remove();
						});
						$('.select_page dd').click(function () {
							key = $(this).html();
							id = $(this).attr('code');
							$('.select_page').remove();
							resolve([id, key]);
						});

						$("#select-box-search-input").bind('input propertychange', function() {
							var val = $(this).val();
							if (!val || val == '') {
								defaultDataFunc(val)
									.then(function(data) {
										appendData(data);
										$('#select-box-data').prepend("<dt>"+options.title+"</dt>");
										$('.cancelBtn').click(function(){
											$('.select_page').remove();
										});
										var key, id;
										$('.select_page dd').click(function () {
											key = $(this).html();
											id = $(this).attr('code');
											$('.select_page').remove();
											resolve([id, key]);
										});
									})
									.catch(function(err) {
										console.error(err);
									})
							}

							fetchDataFunc(val)
								.then(function (data) {
									if (data.length==0) {
										$('.select_page .result_none,.select_page .appendclass,.select_page dt,.select_page dd').remove();
										var strr = "";
										strr += "<div class='result_none'>匹配无结果</div>";
										if (isAllowAdd == true) {
											if (val.length>8) {
												strr += "<dd class='appendclass'><span>+</span> 将&quot;"+val.substring(0,5)+"....."+val.substring(val.length-4)+"&quot;添加为出差目的</dd>";
											}
											else {
												strr += "<dd class='appendclass'><span>+</span> 将&quot;"+val+"&quot;添加为出差目的</dd>";
											}
										}
										$('.select_page').append(strr);
										$('.cancelBtn').click(function(){
											$('.select_page').remove();
										});
										$('.select_page dd').click(function () {
											$('.select_page').remove();
											resolve([id, val]);
										});
									}
									else if (data.length!=0) {
										$('.select_page .result_none,.select_page .appendclass,.select_page dt,.select_page dd').remove();
										appendData(data);
										var key, id;
										$('.select_page dd').click(function () {
											key = $(this).html();
											id = $(this).attr('code');
											$('.select_page').remove();
											resolve([id, key]);
										});
									}
								})
								.catch(function(err) {
									console.error(err);
								});
						});
					});
				})
		});
	function wrapHtml() {
		$('.select_page').remove();
		var str = "";
		str += "<dl class='select_page'>";
		str += "<div class='select_input'><input type='text' class='common_text w85 select_input1' style='float: left;' placeholder="+options.placeholder+" id='select-box-search-input'><div class='w15 cancelBtn' style='float: right;'>取消</div></div>";
		str += "<dt>"+options.title+"</dt>";
		str += "<div id='select-box-data'></div>";
		str += "</dl>";
		$('#angular-view').append(str);
	}

	function appendData(data) {
		var str = '';
		for(var i= 0, ii=data.length; i<ii; i++) {
			if (displayNameKey != '' && valueKey != '') {
				str += "<dd code='"+data[i][valueKey]+"'>"+data[i][displayNameKey]+"</dd>";
			}
			else if (displayNameKey == '' && valueKey == '') {
				str += "<dd>"+data[i]+"</dd>";
			}
		}
		$("#select-box-data").html("");
		$("#select-box-data").html(str);
	}



	if (showDefault == true) {
		$('.select_page dt,.select_page dd').show();
	}
	else if (showDefault == false) {
		$('.select_page dt,.select_page dd').hide();
	}

}
