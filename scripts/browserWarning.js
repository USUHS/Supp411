DKI.browserWarning = (function () {
	var disabler;
	var notice;

	var displayWarning = function () {
		disabler = document.createElement("div");
		notice = document.createElement("div");
		disabler.id = "browserWarning_disabler";
		notice.id = "browserWarning_notice";
		document.body.insertBefore(disabler, document.body.firstChild);
		document.body.insertBefore(notice, document.body.firstChild);
		
		$.get(settings.browserWarningURL, onWarningLoad);
	};

	var init = function(behaviour) {
		if (behaviour.warnBrowser && (
				(dkiUA.firefox && dkiUA.firefoxVersion < 4) ||
				(dkiUA.ie && dkiUA.ieVersion < 8) ||
				(dkiUA.safari && (dkiUA.windows || dkiUA.safariVersion < 5))) 
			){
			displayWarning();			
		}
	};

	var centerNotice = function(){
		var el = $(notice);
		el.css({
			"position": "absolute",
			"top": Math.max(0, (($(window).height() - el.outerHeight()) / 2) + $(window).scrollTop()) + "px",
			"left": Math.max(0, (($(window).width() - el.outerWidth()) / 2) + $(window).scrollLeft()) + "px"
		});
	};

	var onWarningLoad = function (data, textStatus) {
		notice.innerHTML = data;
		if (dkiUA.windows) {
			$("#browserWarning_downloads").addClass("windows");
		}
		$("#browserWarning_close").on(settings.clickEvent, onWarningClose);
		setTimeout(centerNotice, 50);
	};

	var onWarningClose = function () {
		document.body.removeChild(disabler);
		document.body.removeChild(notice);
	};

	return {init: init};
})();
