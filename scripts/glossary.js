/**
 * Singleton representation of the glossary panel
 * @author	Adam Reynolds
 * @class
 * @singleton
 */
DKI.glossary = function(){
	var popupEl = {};
	var pronunciationPlayer = null;
	var terms = [];
	var settings = {};
	var toggledElement = null;
	/**
	 * Initialzes the glossary panel
	 * @method init
	 * @member DKI.glossary
	 * @param {Object} config
	 * @param {Object} config.terms The glossary terms
	 * @param {Object} config.settings The glossary settings
	 * @param {String} config.language The glossary culture code
	 *
	 */
	var initialize = function(config){
		terms = config.terms;
		settings = config.settings;
		language = config.languageString;
		var markup = Handlebars.compile(DKI.templates.glossaryPopup)({
			strings : DKI.strings,
			audioSimpleAncestorId : 'glossaryPopupPronunciation',
			audioSimplePlayerId   : 'glossaryPopupPronunciation_player'
		});
		$("#contentFrame").append(markup);
		popupEl.wrapper = $("#glossaryPopup");
		popupEl.term = $("#glossaryPopupTerm");
		popupEl.definition = $("#glossaryPopupDefinition");
		popupEl.definitionContainer = $("#glossaryPopupDefinitionContainer");		
		popupEl.attribution = $("#glossaryPopupSource");
		popupEl.player = $("#glossaryPopupPronunciation");
		popupEl.close = $("#glossaryPopupClose").attr("title", playerStrings.buttonLabelClose);
		popupEl.hoverDefinition = $("#glossaryHoverDefinition");	
		popupEl.viewBrowserLink = $('#viewBrowserLink');
		popupEl.viewBrowserLink.attr("title", language.viewTermTooltip);
		$("#glossaryPopup #glossaryPopupPronunciation_player").jPlayer({
			swfPath: settings.swfPath,
			cssSelectorAncestor: "#glossaryPopupPronunciation",
			ready: function(){
				pronunciationPlayer = $(this);
				popupEl.wrapper.hide();
				popupEl.wrapper.css("visibility", "visible");
				popupEl.wrapper.removeClass("loading");
				// Player Events
				contentApi.playerEvent.on('pageLoaded',closeAll);
				if(typeof player !== 'undefined') {
					player.navigation.forwardButton.on(settings.clickEvent,closeAll);	
				}		
			},
			supplied: "mp3",
			autohide: false,
			loop: false,
			preload: "auto",
			solution: "flash,html",
			size: {
				width: 0 + "px",
				height: 0 + "px"
			},
			muted: false,
			volume: 1
		});	
		popupEl.close.on(settings.clickEvent, function(){
			if(toggledElement){
				toggledElement.focus();
			}
			popupEl.wrapper.hide();
		});
		$(window).resize(function(e) {
			if(toggledElement) {
				setCoords(toggledElement);
			}
		});
		popupEl.wrapper.draggable({handle : $("#glossaryPopup .glossaryPopupHeader"), containment : ".dkiContentFrame.current"});
	};
	
	/**
	 * Calculates the position on the screen for the popup element
	 * @method calculateCoords
	 * @member DKI.glossary
	 * @private
	 * @param {HTMLElement} targetElement The element that triggered the popup
	 * @param {HTMLElement} display The popup element to display
	 * @param {Number} offset Distance to offest by
	 * @returns {Object} 
	 * @returns {Number} return.x
	 * @returns {Number} return.y
	 */
	var calculateCoords = function(targetElement, display, offset) {
		var coordinates = DKI.calculateCoords(targetElement, display, offset);
		var topOffset = 12;

		if(coordinates.y < topOffset){
			coordinates.y = topOffset;
		}
		return coordinates;
	};
	/**
	 * Handles clicks on glossary links, subscribed in DKI.ContentPage
	 * @method showPopup
	 * @member DKI.glossary
	 * @param {Event} e The click events
	 */
	var showPopup = function(e){

		if(popupEl.wrapper.is(":visible") && settings.selectedTerm && settings.selectedTerm.glossaryid == $(this).data("id")) {
			popupEl.wrapper.hide();
			toggledElement.focus();
			toggledElement = null;
		}
		else {
			settings.selectedTerm = getTerm($(this).data("id"));
			if(settings.selectedTerm) {
				hideDefinition();
				popupEl.term.text(settings.selectedTerm.term);					
				popupEl.definition.html(settings.selectedTerm.definition);				
				setSource(settings.selectedTerm);
				popupEl.viewBrowserLink.show();
				popupEl.viewBrowserLink.attr("href", "javascript:DKI.glossaryBrowse.selectTerm(" + '"' + settings.selectedTerm.id + '"' +")");
				setCoords(e.currentTarget);
				toggledElement = e.currentTarget;
				popupEl.wrapper.show();
				if(popupEl.term[0].clientWidth < popupEl.term[0].scrollWidth){
					popupEl.term.attr("title", settings.selectedTerm.term);		
				}
				popupEl.definitionContainer.scrollTop(0);
				if(settings.selectedTerm.pronunciation_asset_filename){
					popupEl.player.show();
					pronunciationPlayer.jPlayer("setMedia", {
						"mp3": settings.assetURL + settings.selectedTerm.pronunciation_asset_filename
					});
				}
				else{
					popupEl.player.hide();
				}				
			}
			else if(settings.inPreview) {
				//Note missing term for this language, as this is a preview
				hideDefinition();
				popupEl.term.text("Untranslated term");
				popupEl.definition.html("This glossary term has not been translated");
				popupEl.viewBrowserLink.hide();
				setCoords(e.currentTarget);				
				toggledElement = e.currentTarget;
				popupEl.wrapper.show();
			}
			popupEl.definition[0].focus();
		}
	};

	/**
	 * Sets the source information in the glossary popup element
	 * @method setSource
	 * @member DKI.glossary
	 * @private
	 * @param {Object} term The glossary term object
	 */
	var setSource = function(term) {
		popupEl.attribution[0].tabIndex = 0;
		if(term.attribution) {
			popupEl.attribution.html("Source: " + term.attribution);
		}
		else if(term.citation_id) {
			popupEl.attribution.html("Source: " + DKI.reference.getFullCitationText(term.citation_id));
		}
		else {
			popupEl.attribution.html('');
			popupEl.attribution[0].tabIndex = -1;
		}
	}
	/**
	 * Set the coordinates of the popupElement
	 * @method setCoords
	 * @member DKI.glossary
	 * @private
	 * @param {HTMLElement} element The element that triggered the popup
	 */
	var setCoords = function(element) {
		var popupCoords = calculateCoords(element, popupEl.wrapper, 5);
		popupEl.wrapper.css({
				"top": popupCoords.y + "px",
				"left": popupCoords.x + "px"
			});
		//Since IE6 does not support max-width/height, we use jquery to cover our bases here
		var defCont = $("#glossaryPopupDefinitionContainer");
		if(defCont.height() > 150) {
			defCont.height(150);
		}
	}

	/**
	 * Handles mouseover of a glossary link. Subscriber relationship
	 * is set up in DKI.ContentPage
	 * @method showDefinition
	 * @member DKI.glossary
	 * @param {Event} e The mouseover event
	 * @param {HTMLElement} element The element that triggerd the event
	 */
	var showDefinition = function(e, element) {
		if(!popupEl.wrapper.is(":visible")) {
			var glossaryTerm = getTerm($(element).data("id"));
			if(glossaryTerm) {
				var condensed = DKI.stripHTML(glossaryTerm.definition);
				condensed = condensed.length > 50 ? condensed.substr(0,47) + "..." : condensed;
				popupEl.hoverDefinition.html("<p style='display:inline;'>" + condensed + "</p>");
				var popupCoords = calculateCoords(e.currentTarget, popupEl.hoverDefinition, 5);
				popupEl.hoverDefinition.css({
					"top" : popupCoords.y + "px",
					"left": popupCoords.x + "px"
				});
				popupEl.hoverDefinition.show();
			}
		}
	}

	/**
	 * Handles mouseout of a glossary link. Subscriber relationship
	 * is set up in DKI.ContentPage
	 * @method hideDefinition
	 * @member DKI.glossary
	 * @param {Event} e The mouseover event
	 */
	var hideDefinition = function(e) {
		popupEl.hoverDefinition.hide();
	}

	/**
	 * Hides popup definition and wrapper
	 * @method closeAll
	 * @member DKI.glossary
	 * @private
	 */
	var closeAll = function() {
		popupEl.hoverDefinition.hide();
		popupEl.wrapper.hide();
	}

	/**
	 * Gets a term by it's id
	 * @method getTerm
	 * @member DKI.glossary
	 * @private
	 * @param {String} id
	 * @returns {String}
	 */
	var getTerm = function(id){	
		for(var i = 0; i < terms.length; i++){			
			if(terms[i].glossaryid == id){
				return terms[i];
			}
		}
	};


	return {
		init: initialize,
		showPopup: showPopup,
		showDefinition : showDefinition,
		hideDefinition : hideDefinition
	};
	
}();

