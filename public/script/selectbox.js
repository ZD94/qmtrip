
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
						$('.select_page dd').click(function () {
							key = $(this).html();
							id = $(this).attr('code');
							$('.select_page').remove();
							resolve([id, key]);
						});

						$("#select-box-search-input").keyup(function() {
							var val = $(this).val();
							console.info (val);
							if (!val) {
								defaultDataFunc(val)
									.then(function(data) {
										appendData(data);
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
										if (isAllowAdd == true) {
											$('.select_page .result_none,.select_page .appendclass,.select_page dd').remove();
											var strr = "";
											strr += "<div class='result_none'>匹配无结果</div>";
											strr += "<dd class='appendclass'><span>+</span> 将&quot;"+val+"&quot;添加为出差目的</dd>";
											$('.select_page').append(strr);
										}

										$('.select_page dd').click(function () {
											$('.select_page').remove();
											resolve([id, val]);
										});
									}
									else if (data.length!=0) {
										$('.select_page .result_none,.select_page .appendclass').remove();
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
		str += "<div class='select_input'><input type='text' class='common_text w100 select_input1' placeholder="+options.placeholder+" id='select-box-search-input'></div>";
		str += "<dt>"+options.title+"</dt>";
		str += "<div id='select-box-data'></div>";
		str += "</dl>";
		$('#angular-view').append(str);
		$("#select-box-search-input").focus();
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