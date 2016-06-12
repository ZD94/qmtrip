/**
 * AJAX File Upload
 * http://github.com/davgothic/AjaxFileUpload
 * 
 * Copyright (c) 2010-2013 David Hancock (http://davidhancock.co)
 *
 * Thanks to Steven Barnett for his generous contributions
 *
 * Licensed under the MIT license ( http://www.opensource.org/licenses/MIT )
 */

(function($) {

	function isWeixin() {
		var reg = /micromessenger/i;
		return reg.test(window.navigator.userAgent);
	}

	var wxJSDKReady = false;
	if (isWeixin()) {
		wxJSDKReady = true;
		if (!window.API) {
			console.warn("此项目依赖API,请先引入api.js");
			wxJSDKReady = false;
		} else if (!window.wx) {
			console.warn("没有找打weixin.js 使用默认上传方式");
			wxJSDKReady = false;
		}
	}

	if (wxJSDKReady) {
		API.require("wechat");
		API.onload(function() {
			var url = window.location.href;
			API.wechat.getJSDKParams({url: url, debug: true, jsApiList: ["uploadImage", "chooseImage", "previewImage"]})
					.then(function(config) {
						wx.config(config);
					})
					.catch(function(err) {
						console.error(err);
					});
		})
	}

	$.fn.AjaxFileUpload = function(options) {

		var defaults = {
			action:     "/upload-action",
			onChange:   function(filename) {},
			onSubmit:   function(filename) {},
			onComplete: function(filename, response) {}
		},
		settings = $.extend({}, defaults, options),
		randomId = (function() {
			var id = 0;
			return function () {
				return "_AjaxFileUpload" + id++;
			};
		})();

		return this.each(function() {
			var $this = $(this);

			if (wxJSDKReady) {
				$this.bind("click", bootstapWx);
			} else {
				if ($this.is("input") && $this.attr("type") === "file") {
					$this.bind("change", onChange);
				}
			}
		});
		
		function onChange(e) {
			var $element = $(e.target),
				id       = $element.attr('id'),
				$clone   = $element.removeAttr('id').clone().attr('id', id).AjaxFileUpload(options),
				filename = $element.val().replace(/.*(\/|\\)/, ""),
				iframe   = createIframe(),
				form     = createForm(iframe);

			// We append a clone since the original input will be destroyed
			$clone.insertBefore($element);

			settings.onChange.call($clone[0], filename);

			iframe.bind("load", {element: $clone, form: form, filename: filename}, onComplete);
			
			form.append($element).bind("submit", {element: $clone, iframe: iframe, filename: filename}, onSubmit).submit();
		}
		
		function onSubmit(e) {
			var data = settings.onSubmit.call(e.data.element, e.data.filename);
			
			// If false cancel the submission
			if (data === false) {
				// Remove the temporary form and iframe
				$(e.target).remove();
				e.data.iframe.remove();
				return false;
			} else {
				// Else, append additional inputs
				for (var variable in data) {
					$("<input />")
						.attr("type", "hidden")
						.attr("name", variable)
						.val(data[variable])
						.appendTo(e.target);
				}
			}
		}
		
		function onComplete (e) {
			var $iframe  = $(e.target),
				doc      = ($iframe[0].contentWindow || $iframe[0].contentDocument).document,
				response = doc.body.innerHTML;

			if (response) {
				response = $.parseJSON(response);
			} else {
				response = {};
			}

			settings.onComplete.call(e.data.element, e.data.filename, response);
			
			// Remove the temporary form and iframe
			e.data.form.remove();
			$iframe.remove();
		}

		function createIframe() {
			var id = randomId();

			// The iframe must be appended as a string otherwise IE7 will pop up the response in a new window
			// http://stackoverflow.com/a/6222471/268669
			$("body")
				.append('<iframe src="javascript:false;" name="' + id + '" id="' + id + '" style="display: none;"></iframe>');

			return $('#' + id);
		}
		
		function createForm(iframe) {
			return $("<form />")
				.attr({
					method: "post",
					action: settings.action,
					enctype: "multipart/form-data",
					target: iframe[0].name
				})
				.hide()
				.appendTo("body");
		}

		//调用微信
		function bootstapWx() {
			event.preventDefault();
			wx.ready(function() {
				wx.chooseImage({
					count: 1, // 默认9
					success: function (res) {
						var localIds = res.localIds; // 返回选定照片的本地ID列表，localId可以作为img标签的src属性显示图片
						if (localIds) {
							wxUploadImg(localIds[0]);
						}
					}
				});
			});
		}

		function wxUploadImg(localid) {
			wx.uploadImage({
				localId: localid, // 需要上传的图片的本地ID，由chooseImage接口获得
				isShowProgressTips: 1, // 默认为1，显示进度提示
				success: function (res) {
					var serverId = res.serverId; // 返回图片的服务器端ID
					API.wechat.mediaId2key({mediaId: serverId})
						.then(function(key) {
							console.info('返回的结果:', key);
							settings.onComplete(localid, {code: 0, errmsg: "", key: key});
						})
						.catch(function(err) {
							console.error(err);
						});
				}
			});
		}
	};
})(jQuery);