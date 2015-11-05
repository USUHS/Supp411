/* globals contentApi */
contentApi.playerEvent.on("pageLoaded", function () {
	//The 'player' object gets the 'this' context
	//Drop any select fix events in the previous/next frames
	$("select.content", this.pageFrames.previous).off(".selectFix");
	$("select.content", this.pageFrames.next).off(".selectFix");
	$("select.content", this.pageFrames.current).each(function () {
		var el = $(this);
		el.data("origWidth", el.css("width"));
	})
	.on("mouseenter.selectFix", function () {
		var el = $(this);

		// http://frogger.dominknow.com/default.asp?36814
		// origWidth was getting set to 0px, which effectively allowed no minimum width and the select elements were being allowed to resize down
		var minWidth = el.data("origWidth");
		if(parseInt(minWidth) == 0) {
			minWidth = el.width() + 'px';
		}
		
		el.css({
			"width": "auto",
			"min-width": minWidth
		});
	})
	.on("mouseout.selectFix", function () {
		var el = $(this);
		if (!el.is(":focus")) {
			el.css({
				"width"     : "",
				"min-width" : ""
			});
		}
	})
	.on("blur.selectFix change.selectFix", function () {
		var el = $(this);
		el.css({
			"width"     : "",
			"min-width" : ""
		});
	});
});
