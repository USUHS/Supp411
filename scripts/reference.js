/* global contentApi, player */
/**
 * Singleton representation of the glossary panel
 * @author	Adam Reynolds
 * @singleton
 * @class DKI.Reference
 */
if(!DKI.Reference) {
	DKI.Reference = {};
}

/**
 * Creates the UI interface and constructs the singleton instance
 * @param {Object} cfg
 * @param {Object} cfg.references
 * @param {Object} cfg.settings
 * @param {Object} cfg.strings
 * @param {String} cfg.languageString
 */
DKI.Reference.playerReferenceUIInterface = function(cfg){
	var popupEl = {};
	var bibliographyEl = {};
	var references = {};
	var settings = {};
	var toggled = false;
	var toggledElement  = null;
	var events = {
		citationRegistered  : "citationRegistered",
		referenceRegistered : "referenceRegistered"
	};
	/**
	 * @property {Object}
	 * @member DKI.Reference
	 */
	var strings = {};
	var initialize = function(config){
		references = config.references;
		settings = config.settings;
		strings = config.languageString;
		var cfg = {
			strings : DKI.strings
		};
		var popup = Handlebars.compile(DKI.templates.citationPopup)(cfg);
		var bibliography = Handlebars.compile(DKI.templates.bibliography)(cfg);
		$("#contentFrame").append(popup);
		$("body").append(bibliography);
		popupEl.wrapper = $("#referencePopup");
		popupEl.wrapper.hide();
		popupEl.refText = $("#referenceTextContainer");
		popupEl.content = $(".referencePopupBody", popupEl.wrapper);
		popupEl.close = $("#referencePopupClose");
		popupEl.nav = $("#referencePopup div.nav");
		popupEl.next = $("#referencePopup span.next");
		popupEl.previous = $("#referencePopup span.previous");
		popupEl.counter = $("#referencePopup span.counter");
		popupEl.viewBibliographyLink = $("#viewBibliographyLink");
		bibliographyEl.wrapper = $("#bibliographyContainer");
		bibliographyEl.content = $("#bibliographyContentContainer");
		bibliographyEl.close = $("#bibliographyClose");

		loadBibliographyReferences();
		contentApi.playerEvent.on("pageLoaded",hideReference);
		popupEl.next.on(settings.clickEvent, function(e) {
			if(!$(this).hasClass("disable")) {
				settings.currentIdx ++;
				setReferenceData();
			}
		})
		popupEl.previous.on(settings.clickEvent, function(e) {
			if(!$(this).hasClass("disable")) {
				settings.currentIdx --;
				setReferenceData();
			}
		})
		popupEl.close.on(settings.clickEvent, function(){
			hideReference();
		});
		bibliographyEl.close.on(settings.clickEvent, function() {
			bibliographyEl.wrapper.hide();
		});
		popupEl.viewBibliographyLink.on(settings.clickEvent, function() {
			showBibliography();
		});
		popupEl.wrapper.draggable({handle : $("#referenceTextContainer"), containment : ".dkiContentFrame.current"});
		bibliographyEl.wrapper.draggable({handle : $("#bibliographyBrowserHeader"), containment : "body"});
		$(document).on(DKI.ContentPage.events.ready,
				setSuperScript);

		$(window).resize(function() {
			if(toggledElement) {
				setCoords(toggledElement);
			}
		});
		registerCitations();
	};
	/**
	 * Registeres all the courses citations with the search manager, if it's enabled. We can search against label
	 * @method *PRIVATE* registerCitationsWithSearch
	 * @member DKI.Reference
	 */
	var registerCitations = function() {
		for(var key in DKI.references.citations) {
			$(document).trigger(events.citationRegistered,[DKI.references.citations[key]]);
		}
	};

	var calculateCoords = function(targetElement, display, offset) {
		var coordinates = DKI.calculateCoords(targetElement, display, offset);
		var topOffset = 12;

		if(coordinates.y < topOffset){
			coordinates.y = topOffset;
		}
		return coordinates;
	};
	/**
	 * Shows a reference popup
	 * @method
	 * @member DKI.Reference
	 * @param {HTMLElement} element Element to display reference for
	 */
	var showReference = function(element){
		settings.currentElement = element;		
		hideBibliography();
		if(toggled === true && 
			settings.selectedCitations && 
			settings.selectedTextLinkId == $(element).data("citationid") &&
			settings.selectedElementId == $(element).closest(".dki-authoring-element").data("id")) {
			popupEl.wrapper.hide();
			toggledElement = null;
			toggled = false;
		}
		else {
			toggled = true;
			setSelectedCitations(element);
			setReferenceData(element,0);
			toggledElement = element;
			popupEl.wrapper.show();
			$("*[tabindex][tabindex!='-1']", popupEl.content).each(function(){
				if($(this).is(":visible")){
					this.focus();
					return false;
				}
			});
		}
	};
	/**
	 * Shows/hides a reference on hover
	 * @method
	 * @member DKI.Reference
	 * @param {HTMLElement} element The element being hovered
	 * @param {Boolean} show If true show, if false hide
	 */
	var hoverReference = function(element,show) {
		settings.currentElement = element;
		if(toggled === true && 
			settings.selectedCitations && 
			settings.selectedTextLinkId != $(element).data("citationid") &&
			settings.selectedElementId != $(element).closest(".dki-authoring-element").data("id")) {
			toggled = false;
		}
		if(show && !toggled) {
			setSelectedCitations(element);
			var citation = settings.selectedCitations[settings.currentIdx];
			setReferenceData(element);
			popupEl.wrapper.show();
		}
		else if(!show && !toggled) {
			popupEl.wrapper.hide();
		}
	};

	var setSelectedCitations  = function(element) {
		settings.currentIdx = 0;
		settings.selectedTextLinkId = $(element).data("citationid");
		settings.selectedElementId = $(element).closest(".dki-authoring-element").data("id");
		settings.selectedCitations = getCitationsByLink(settings.selectedTextLinkId, settings.selectedElementId);
		popupEl.next.removeClass("disable");
		popupEl.previous.addClass("disable");
	}

	var setReferenceData = function() {
		var index = settings.currentIdx;
		citation = settings.selectedCitations[index];
		if(settings.selectedCitations.length <=1) {
			popupEl.nav.hide();
		}
		else {
			popupEl.nav.show();
			index <= 0 ? popupEl.previous.addClass("disable") : popupEl.previous.removeClass("disable");
			index >= settings.selectedCitations.length -1 ? popupEl.next.addClass("disable") : popupEl.next.removeClass("disable");
			popupEl.counter.html((index + 1) + " / " +  settings.selectedCitations.length);
		}
		
		if(citation) {
			var reference = getReference(citation.referenceId);
			var text = "<span class='refNum'>" + getSuperScript(citation.id) + ".</span> " + DKI.Reference.makeRefText(reference, strings.txtReferenceLink, citation);
			popupEl.refText.html(text);
		}	
		setCoords(settings.currentElement);
	};
	/**
	 * Set the coordinates for reference display
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {HTMLElement} element
	 */
	var setCoords = function(element) {
		var popupCoords = calculateCoords(element, popupEl.wrapper, 0);
			popupEl.wrapper.css({
				"top": popupCoords.y + "px",
				"left": popupCoords.x + "px"
			});
			//Since IE6 does not support max-width/height, we use jquery to cover our bases here
			var defCont = $("#referencePopupText");
			if(defCont.height() > 150) {
				defCont.height(150);
			}
	};
	/**
	 * Shows the bibliography
	 * @method
	 * @member DKI.Reference
	 */
	var showBibliography = function() {
		hideReference();
		DKI.centerInPlayer(bibliographyEl.wrapper);
		bibliographyEl.wrapper.show();
		$("*[tabindex][tabindex!='-1']", bibliographyEl.content).each(function(){
			if($(this).is(":visible")){
				this.focus();
				return false;
			}
		});
		player.navigation.setBibliographyState(true);
	};
	/**
	 * Hides the bibliography
	 * @method
	 * @member DKI.Reference
	 */
	var hideBibliography = function() {
		bibliographyEl.wrapper.hide();
		player.navigation.setBibliographyState(false);
	};
	/**
	 * Toggles visible state of bibliography
	 * @method
	 * @member DKI.Reference
	 */
	var toggleBibliography = function() {
		if(bibliographyEl.wrapper.css("display") == "none"){
			this.showBibliography();
		}
		else{
			this.hideBibliography();
		}
	};
	/**
	 * Load/sort/render bibliographty references
	 * @method
	 * @member DKI.Reference
	 * @private
	 */
	var loadBibliographyReferences = function() {
		var referenceOrder = references.referenceOrder;
		var html = "<ul class='rf-Bibliography'>";
		for(var i =0;  i < referenceOrder.length; i ++) {
			var reference = references.references[referenceOrder[i]];
			$(document).trigger(events.referenceRegistered,[reference]);
			var refText = DKI.Reference.makeRefText(reference, strings.txtReferenceLink);
			html += "<li tabindex='0'> <span class='refIndex'>" + getReferenceIdx(reference) + ".</span> " + refText + "</li>";
		}
		html +="</ul>";
		bibliographyEl.content.html(html);
	};
	
	/**
	 * Hides currently shown reference
	 * @method
	 * @member DKI.Reference
	 */
	var hideReference = function() {
		popupEl.wrapper.hide();
		toggled = false;
	};

	/**
	 * Gets a citaion by id
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {String} id
	 * @return {String}
	 */
	var getCitation = function(id) {
		if (references.citations[id]) {
			return references.citations[id];
		}
	};
	/**
	 * Gets a citation by it's link id
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {String} textLinkId
	 * @param {String} elementId
	 * @return {String}
	 */
	var getCitationsByLink = function(textLinkId, elementId) {
		var citations = [];
		var sortCitations = function(a,b) {
			if(a.order < b.order) {
				return -1;
			}
			if(a.order > b.order) {
				return 1;
			}
			return 0;
		};
		for(var key in references.citations) {
			if(references.citations[key].textLinkId == textLinkId && references.citations[key].elementId == elementId) {
				citations.push(references.citations[key]);
			}
		}
		citations.sort(sortCitations);
		return citations;
	};

	/**
	 * Get a reference by it's id
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {String} id
	 * @returns {Object}
	 */
	var getReference = function(id) {
		if (references.references[id]) {
			return references.references[id];
		}
	};
	/**
	 * Gets superscript label for a citation
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {String} citationId
	 * @return {String}
	 */
	var getSuperScript = function(citationId) {
		var citation = getCitation(citationId);
		var reference  = getReference(citation.referenceId);
		var superScript = getReferenceIdx(reference);
		//In single page preview, we do not determine order and return '#' as a superscript placeholder
		if(superScript != "#") {
			if(citation.alphaOrder) {
				superScript += citation.alphaOrder;
			}
		}
		return superScript;
	};
	/**
	 * Gets the index for a reference
	 * @method
	 * @member DKI.Reference
	 * @private
	 * @param {Object} reference
	 * @return {String}
	 */
	var getReferenceIdx = function(reference) {
		var index = "#";
		if(reference.refIndex) {
			index = parseInt(reference.refIndex,10);
		}
		return index;
	};

	/**
	 * Gets citation text as html for a citationId
	 * @method
	 * @member DKI.Reference
	 * @param {String} citationId
	 * @return {String}
	 */
	var getFullCitationText = function(citationId) {
		var citation = getCitation(citationId);
		var reference  = getReference(citation.referenceId);
		var superScript = getSuperScript(citationId);
		return "<span class='refNum'>" + superScript + ".</span> " + DKI.Reference.makeRefText(reference,strings.txtReferenceLink, citation); 
	};

	/**
	 * Attach superscript labels to references
	 * @method
	 * @member DKI.Reference
	 * @private
	 */
	var setSuperScript = function() {
		//attach a handler for references
		$("div.dkiContentFrame .dki-citation-link").each(function(index,element) {
			if($(element).has("sup.refSup").length == 0) {
				var citations = getCitationsByLink($(element).data("citationid"), $(element).closest(".dki-authoring-element").data("id"));
				var text ="";
				for(var i = 0; i < citations.length; i++) {
					text += getSuperScript(citations[i].id) + " ";
				}
				text = text.substring(0, text.length-1);
				jQuery("<sup />", {
					html    : text,
					"class" : "refSup"
				}).appendTo(element);
			}
		});
	};
	/**
	 * Determine if course has references
	 * @method
	 * @member DKI.Reference
	 * @return {Boolean} 
	 */
	var courseHasReferences = function() {
		if(references.referenceOrder === undefined){
			return false;
		}else{
			return references.referenceOrder.length > 0 ? true : false;
		}
	};
	return {
		strings             : strings,
		showReference       : showReference,
		hoverReference      : hoverReference,
		hideReference       : hideReference,
		showBibliography    : showBibliography,
		hideBibliography    : hideBibliography,
		courseHasReferences : courseHasReferences,
		toggleBibliography  : toggleBibliography,
		getFullCitationText : getFullCitationText,
		events              : events,
		init                : initialize
	}
}();

/**
 * Creates reference text
 * @param {Object} reference
 * @param {String} anchorText
 * @param {Object} citation
 */
DKI.Reference.makeRefText = function(reference,anchorText,citation) {
	var text = reference.refText;
	if(citation) {
		if(citation.label) {
			text += " (" + citation.label + ")";
		}
	}
	if(reference.URL) {
		text += " (<a href='" + reference.URL + "' target='_refTarget'>" + anchorText + "</a>)";
	}	
	return text;
}

