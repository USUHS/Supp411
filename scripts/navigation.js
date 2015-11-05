var DKI;
if (!DKI) {DKI = {};}

/**
 * @class
 * @constructor
 * @param {DKI.PresentationPlayer} player
 */
DKI.PlayerNavigation = function (player) {
	/**
	 * @property {jQuery}
	 */
	this.exitButton = $("#exitButton");	
	/**
	 * @property {jQuery}
	 */
	this.audioButton = $("#audioButton");
	/**
	 * @property {jQuery}
	 */
	this.replayButton = $("#replayButton");
	/**
	 * @property {jQuery}
	 */
	this.backButton = $("#backButton");
	/**
	 * @property {jQuery}
	 */
	this.forwardButton = $("#forwardButton");
	/**
	 * @property {jQuery}
	 */
	this.menuButton = $("#menuButton");
	/**
	 * @property {jQuery}
	 */
	this.listButton = $("#listButton");
	/**
	 * @property {jQuery}
	 */
	this.moreButtons = $("#moreButtons");
	/**
	 * jQuery object for DOM element holding the 'more' options
	 * @property {jQuery}
	 */
	this.moreOverlay = $("#moreOverlay");
	/**
	 * @property {jQuery}
	 */
	this.transcriptButton = $("#transcriptButton");
	/**
	 * @property {jQuery}
	 */
	this.glossaryButton = $("#glossaryButton");
	/**
	 * @property {jQuery}
	 */
	this.resourceButton = $("#resourceButton");
	this.skipToContent = $("#skipToContent");
	this.skipToNavigation = $("#skipToNavigation");

	this.showForward = true;
	this.showBack = true;
	this.showAudio = true;
	this.showReload = true;
	this.showMenu = true;
	this.audioState = "on";
	this.menuState = false;
	this.moreState = false;
	this.glossaryState = false;
	this.resourceState = false;
	this.bibliographyState = false;
	this.clickEvent = player.settings.clickEvent;
	this.initEvents();

	$(".navButton").each(function(){
		$(this).data("tab-index", $(this).attr("tabIndex"));
	})
};

/**
 * Initializes events and handlers
 */
DKI.PlayerNavigation.prototype.initEvents = function () {
	var that = this;

	//Setup DOM event handlers	
	$(document.body).on(this.clickEvent, "#exitButton", function (e) {
		e.stopPropagation();
		$(that).trigger(DKI.PlayerNavigation.events.exit);
		return false;
	});

	$(document.body).on(this.clickEvent, "#audioButton", function (e) {
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			if (that.audioState === "on") {
				that.audioState = "off";
			}
			else {
				that.audioState = "on";
			}
			that.audioButton.toggleClass("muted");
			$(that).trigger(DKI.PlayerNavigation.events.audioToggle, [that.audioState]);
			that.hideMore();
		}

		return false;
	});

	var onBackClicked = function(e){
		if (!$("#backButton").hasClass("disabled")) {
			$(that).trigger(DKI.PlayerNavigation.events.back);
		}
		e.stopPropagation();
		if (e.gesture) {			
			e.gesture.preventDefault()
		}
		return false;		
	};
	var onNextClicked = function(e){
		if (!$("#forwardButton").hasClass("disabled")) {
			$(that).trigger(DKI.PlayerNavigation.events.forward);
		}
		e.stopPropagation();
		if (e.gesture) {			
			e.gesture.preventDefault()
		}
		return false;
	};
	$(document.body).on(this.clickEvent, "#backButton", onBackClicked);	
	$(document.body).on(this.clickEvent, "#forwardButton", onNextClicked);

	if(dkiUA.touchEnabled && playerBehaviour.enableSwiping){
		var onSwipeRight = function(e){
			if (!$("#backButton").hasClass("disabled") && (!e.gesture || (e.gesture && e.gesture.deltaX > 150))) {
				$(that).trigger(DKI.PlayerNavigation.events.back);
			}
			e.stopPropagation();
			if (e.gesture) {			
				e.gesture.preventDefault()
			}
			return false;		
		};
		var onSwipeLeft = function(e){
			if (!$("#forwardButton").hasClass("disabled") && (!e.gesture || (e.gesture && e.gesture.deltaX < -150))) {
				$(that).trigger(DKI.PlayerNavigation.events.forward);
			}
			e.stopPropagation();
			if (e.gesture) {			
				e.gesture.preventDefault()
			}
			return false;
		};
		$(".bgRepeater").on("swipeLeft", onSwipeLeft);
		$(".bgRepeater").on("swipeRight", onSwipeRight);

		$(document).on(DKI.TestQuestion.events.dragStarted, function(){
			$(".bgRepeater").off("swipeRight");
			$(".bgRepeater").off("swipeLeft");
		});
		
		$(document).on(DKI.TestQuestion.events.dragStopped, function(){
			$(".bgRepeater").on("swipeRight", onSwipeRight);
			$(".bgRepeater").on("swipeLeft", onSwipeLeft);
		});
	}

	$(that).on(DKI.PlayerNavigation.events.back, function(){
		that.hideBackButton();
		that.hideForwardButton();
	});
	$(that).on(DKI.PlayerNavigation.events.forward, function(){
		that.hideBackButton();
		that.hideForwardButton();
	});


	$(document.body).on(this.clickEvent, "#menuButton", function (e) {		
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			//Since the menu button is hidden while menu is open, it can only be used to open the menu
			if (that.menuState) {
				that.menuState = false;
			}
			else {
				that.menuState = true;
			}
			$(that).trigger(DKI.PlayerNavigation.events.menuToggle, [that.menuState]);
			that.hideMore();
		}

		return false;

	});

	$(document.body).on(this.clickEvent, "#replayButton", function (e) {
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			$(that).trigger(DKI.PlayerNavigation.events.reload);
			that.hideMore();
		}		
		return false;
	});

	$(document.body).on(this.clickEvent, "#listButton", function (e) {
		e.stopPropagation();
		that.onListClick(e);
		return false;
	});

	$(document.body).on(this.clickEvent, "#transcriptButton", function (e) {
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			$(that).trigger(DKI.PlayerNavigation.events.transcriptToggle);
		}
		return false;
	});

	$(document.body).on(this.clickEvent, "#glossaryButton", function (e) {		
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			//Since the menu button is hidden while menu is open, it can only be used to open the menu
			if (that.glossaryState) {
				that.glossaryState = false;
			}
			else {
				that.glossaryState = true;
			}
			$(that).trigger(DKI.PlayerNavigation.events.glossaryToggle, [that.glossaryState]);
			that.hideMore();
		}

		return false;

	});
	$(document.body).on(this.clickEvent, "#resourceButton", function (e) {		
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			//Since the menu button is hidden while menu is open, it can only be used to open the menu
			if (that.resourceState) {
				that.resourceState = false;
			}
			else {
				that.resourceState = true;
			}
			$(that).trigger(DKI.PlayerNavigation.events.resourceToggle, [that.resourceState]);
			that.hideMore();
		}

		return false;

	});

	if (this.moreOverlay) {
		$(document.body).on(this.clickEvent, "#moreOverlay", function (e) {
			e.stopPropagation();
			that.hideMore();
			that.moreOverlay.css("display", "none");
			return false;
		});
	}

	$(document).on(DKI.ContentPage.events.started, function(){
		if(that.skipToContent.is(":visible")){
			that.skipToContent[0].focus();
		}
	});

	$(document.body).on(this.clickEvent, "#skipToContent", function(e){		
		e.stopPropagation();
		$(".dkiContentFrame.current *[tabindex][tabindex!='-1']").each(function(){
			if($(this).is(":visible")){
				this.focus();
				return false;
			}
		});
		return false;
	});

	$(document.body).on(this.clickEvent, "#skipToNavigation", function(e){
		e.stopPropagation();
		$("#headerContainer *[tabindex]").each(function(){
			if(!$(this).hasClass("disabled")){
				this.focus();
				return false;
			}
		});
		return false;
	});
};

/* Methods to fire navigation events */

/**
 * Fire the back event.
 *
 * Fires
 *
 * - DKI.PlayerNavigation.events#back
 */
DKI.PlayerNavigation.prototype.fireBack = function () {
	$(this).trigger(DKI.PlayerNavigation.events.back);
};

/**
 * Fire the forward event
 *
 * Fires
 *
 * - DKI.PlayerNavigation.events#forward
 */
DKI.PlayerNavigation.prototype.fireForward = function () {
	$(this).trigger(DKI.PlayerNavigation.events.forward);
};
/* End fire methods */

/* show/hide navigation elements */
DKI.PlayerNavigation.prototype.disableButton = function(el){
	if($.type(el) == "string"){
		el = $("#" + el);
	}
	else{
		el = $(el);		
	}
	el.addClass("disabled");	
	el.attr("tabindex", -1);
	el.attr("aria-hidden", "true");
};
DKI.PlayerNavigation.prototype.enableButton = function(el){
	if($.type(el) == "string"){
		el = $("#" + el);
	}
	else{
		el = $(el);		
	}
	el.removeClass("disabled");
	el.attr("tabindex", el.data("tab-index"));
	el.attr("aria-hidden", "false");
};
DKI.PlayerNavigation.prototype.hideTranscriptButton = function () {
	this.transcriptButton.css("display", "none");
};
DKI.PlayerNavigation.prototype.showTranscriptButton = function () {
	this.transcriptButton.css("display", "");
};
DKI.PlayerNavigation.prototype.disableTranscriptButton = function () {
	this.disableButton(this.transcriptButton);
};
DKI.PlayerNavigation.prototype.enableTranscriptButton = function () {	
	this.enableButton(this.transcriptButton);
};

DKI.PlayerNavigation.prototype.hideAudioButton = function () {
	this.disableButton(this.audioButton);
};

DKI.PlayerNavigation.prototype.showAudioButton = function () {
	this.enableButton(this.audioButton);
};

DKI.PlayerNavigation.prototype.hideBackButton = function () {
	this.disableButton(this.backButton);
};

DKI.PlayerNavigation.prototype.showBackButton = function () {	
	this.enableButton(this.backButton);
};

DKI.PlayerNavigation.prototype.hideForwardButton = function () {	
	this.disableButton(this.forwardButton);
};

DKI.PlayerNavigation.prototype.showForwardButton = function () {	
	this.enableButton(this.forwardButton);
};

DKI.PlayerNavigation.prototype.hideMenuButton = function () {	
	this.disableButton(this.menuButton);
};

DKI.PlayerNavigation.prototype.showMenuButton = function () {
	this.enableButton(this.menuButton);
};

DKI.PlayerNavigation.prototype.hideReloadButton = function () {
	this.disableButton(this.replayButton);
};

DKI.PlayerNavigation.prototype.showReloadButton = function () {
	this.enableButton(this.replayButton);
};

DKI.PlayerNavigation.prototype.showScreenCountDisplay = function () {
	$("#screenCount").css("display", "");
};

DKI.PlayerNavigation.prototype.hideScreenCountDisplay = function () {
	$("#screenCount").css("display", "none");
};

DKI.PlayerNavigation.prototype.hideGlossaryButton = function () {
	this.glossaryButton.css("display", "none");
};

DKI.PlayerNavigation.prototype.showGlossaryButton = function () {
	this.glossaryButton.css("display", "");
};

DKI.PlayerNavigation.prototype.disableGlossaryButton = function () {	
	this.disableButton(this.glossaryButton);
};

DKI.PlayerNavigation.prototype.enableGlossaryButton = function () {	
	this.enableButton(this.glossaryButton);
};

DKI.PlayerNavigation.prototype.disableResourceButton = function () {	
	this.disableButton(this.resourceButton);
};

DKI.PlayerNavigation.prototype.enableResourceButton = function () {	
	this.enableButton(this.resourceButton);
};

DKI.PlayerNavigation.prototype.disableMenuButton = function () {	
	this.disableButton(this.menuButton);
};

DKI.PlayerNavigation.prototype.enableMenuButton = function () {
	this.enableButton(this.menuButton);
};

/* end show/hide methods */


/**
 * Display the total number of pages
 * @param {Number} number
 */
DKI.PlayerNavigation.prototype.setTotalScreens = function (number) {
	$("#totalScreens").text(number);
};

/**
 * Display the current page number
 * @param {Number} number
 */
DKI.PlayerNavigation.prototype.setCurrentScreen = function (number) {
	$("#currentScreen").text(number);
};

/**
 * Display text in module name area
 * @param {String} name
 */
DKI.PlayerNavigation.prototype.setModuleName = function (name) {
	$("#moduleName").text(name);
};

/**
 * Display text in object name area
 * @param {String} name
 */
DKI.PlayerNavigation.prototype.setObjectName = function (name) {
	$("#objectName").text(name);
};

/**
 * Sets the menu visibility state. Does not actually hide anything, just
 * used to determine how menu button should fire it's events
 * @param {Boolean} state True for visible, false for hidden
 */
DKI.PlayerNavigation.prototype.setMenuState = function (state) {
	this.menuState = state;
};

/**
 * Sets the glossary visibility state. Does not actually hide anything, just
 * used to determine how glossary button should fire it's events
 * @param {Boolean} state True for visible, false for hidden
 */
DKI.PlayerNavigation.prototype.setGlossaryState = function(state) {
	this.glossaryState = state;
};

/**
 * Sets the resource UI visibility state. Does not actually hide anything, just
 * used to determine how resource button should fire it's events
 * @param {Boolean} state True for visible, false for hidden
 */
DKI.PlayerNavigation.prototype.setResourceState = function(state) {
	this.resourceState = state;
};

/**
 * Sets the bibliography visibility state. Does not actually hide anything, just
 * used to determine how bibliography button should fire it's events
 * @param {Boolean} state True for visible, false for hidden
 */
DKI.PlayerNavigation.prototype.setBibliographyState = function(state) {
	this.BibliographyState = state;
}

/**
 * Sets appropriate button states for content pages
 * @method contentMode
 * @member DKI.PlayerNavigation
 */
DKI.PlayerNavigation.prototype.contentMode = function () {
	this.showAudioButton();
	this.showReloadButton();
	this.showMenuButton();
	this.showScreenCountDisplay();
};

/**
 * Sets appropriate button states for test pages
 */
DKI.PlayerNavigation.prototype.testMode = function (showNav) {
	if (showNav) {
		this.showForwardButton();
		this.showBackButton();
	}
	else{
		this.hideForwardButton();
		this.hideBackButton();
	}
	this.showAudioButton();
	this.hideReloadButton();
	this.hideMenuButton();
	this.showScreenCountDisplay();
};

/**
 * Sets appropriate button states for end screens
 */
DKI.PlayerNavigation.prototype.endMode = function () {
	this.hideForwardButton();
	this.hideBackButton();
	this.hideReloadButton();
	this.hideAudioButton();
	this.hideMenuButton();
	this.hideScreenCountDisplay();
	this.setObjectName("");
	this.setModuleName("");
};

/**
 * Handles click of the 'more' button, if visible.
 *
 * Fires
 *
 * - DKI.PlayerNavigation.events#menuClose
 */
DKI.PlayerNavigation.prototype.onListClick = function () {
	this.menuState = false;		
	$(this).trigger(DKI.PlayerNavigation.events.menuClose);
 			
	if (this.moreState) {
		this.moreButtons.css("display", "none");	
		this.moreOverlay.css("display", "none");
		this.moreState = false;
	}
	else {
		this.moreButtons.css("display", "block");
		this.moreOverlay.css("display", "block");
		this.moreState = true;
	}
};

/**
 * Hides the 'more' overaly
 */
DKI.PlayerNavigation.prototype.hideMore = function () {
	if (this.moreState) {
		this.moreButtons.css("display", "none");
		this.moreOverlay.css("display", "none");
		this.moreState = false;
	}

}

/**
 * @class DKI.PlayerNavigation.events
 * @static
 */
DKI.PlayerNavigation.events = {
	/**
	 * Fired when 'audio' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	audioToggle: "audioToggle",
	/**
	 * Fired when 'back' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	back: "back",
	/**
	 * Fired when 'forward' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	forward: "forward",
	/**
	 * Fired when 'menu' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	menuToggle: "menuToggle",
	/**
	 * Fired when menu closes
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	menuClose: "menuClose",
	/**
	 * Fired when 'reload' button is clickedt
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	reload: "reload",
	/**
	 * Fired when 'exit' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	exit: "exit",
	/**
	 * Fired when 'transcript' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	transcriptToggle: "transcriptToggle",
	/**
	 * Fired when 'glossary' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	glossaryToggle: "glossaryToggle",
	/**
	 * Fired when 'resource' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	resourceToggle: "resourceToggle",
	/**
	 * Fired when 'bibliography' button is clicked
	 * @event
	 * @static
	 * @member DKI.PlayerNavigation.events
	 */
	bibliographyToggle : "bibliographyToggle"
};


