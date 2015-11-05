(function () {
	//append proper viewport style for windows phone 8
	if (navigator.userAgent.match(/IEMobile\/10\.0/)) {
		var head = document.getElementById("head");
		var viewportStyle = document.createElement("style");
		viewportStyle.appendChild(document.createTextNode("@-ms-viewport{width:" + viewportWidth + " !important;}"));
		head.appendChild(viewportStyle);
	}
})()
