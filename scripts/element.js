/**
 * @static
 */
var Element = (function () {
	/**
	 * Replaces a placeholder with a SWF
	 * @member Element
	 * @static
	 * @param {HTMLElement} element The element to replace
	 * @param {Object} config
	 * @param {Function} [config.callback] Callback function after SWF is ready
	 * @param {Boolean} [config.autoplay] If true, SWF will autoplay
	 */
	function replaceWithFlash(element, config) {	
		var swf = $(element).attr("data-movie");
		var id = $(element).attr("id");
		var assetType = $(element).attr("data-elementType");
		//Since the player is being served from /players, we need to go up a directory to access the asset
		var flashVars = {src: $(element).attr("data-src")};
		var flashParams = {wmode: "transparent", quality: "high", allowscriptaccess: "samedomain", allowfullscreen: $(element).attr("data-allowfullscreen")};
		var playerskin = $(element).attr("data-playerskin");
		var elementID = $(element).attr("data-id");
		var absolutePattern = /^(http|\/)/;
		//If we're dealing with a relative path to the asset, we need to prepend ../, since the Strobe player is hosted in /players
		if (!absolutePattern.test(flashVars.src)) {
			flashVars.src = "../" + flashVars.src;
		}
		if (config && config.callback) {
			flashVars.javascriptCallbackFunction = config.callback;
		}
		if($(element).attr("data-starttime") && $(element).attr("data-starttime") != ""){
			flashVars.clipStartTime = $(element).attr("data-starttime");
		}
		if($(element).attr("data-endtime") && $(element).attr("data-endtime") != ""){
			flashVars.clipEndTime = $(element).attr("data-endtime");
		}		
		if (assetType === "audio") {
			flashVars.playButtonOverlay = false;
		}
		if ($(element).attr("data-controls")) {
			flashVars.controlBarAutoHide = false;
		}
		else {
			flashVars.controlBarAutoHide = true;
		}

		if ($(element).attr("data-verbose")) {
			flashVars.verbose = "true";
		}

		if ($(element).attr("data-loop")) {
			flashVars.loop = "true";
		}

		if (config && (config.autoplay !== undefined && config.autoplay !== null)) {
			flashVars.autoPlay = config.autoplay;
		}
		else if ($(element).attr("data-autoplay")) {
			flashVars.autoPlay = "true";
			$(element).parent().data("autoplay", "true");
		}
		swfobject.embedSWF(swf, id, $(element).attr("data-width"), $(element).attr("data-height"), "10.2.0", {}, flashVars, flashParams, {name: id}, function(){
			if (assetType === "audio") {
				var hiddenCss = {
					opacity: 0
				};
				if(!dkiUA.ie && !dkiUA.blackberry && !dkiUA.android){
					hiddenCss.visibility = "hidden";
				}
				if (dkiUA.android) {
					hiddenCss.height = 1;
					hiddenCss.width = 1;
				}
				if (playerskin == "true") {
					$("#" + id).css(hiddenCss);			
				}
				$('[data-id="' + elementID + '"].dki-audio-basic').addClass("ready");
				if(flashVars.controlBarAutoHide && canAutoplay()){
					$("#" + elementID + "_wrapper").css(hiddenCss);
					$("#" + id).css(hiddenCss);
				}		
			}
		});
	}

	return {replaceWithFlash: replaceWithFlash};
}());
