DKI.glossaryBrowse = function() {
	var mobile = $("body").hasClass("phone") || $("body").hasClass("responsive") ? true : false;
		var browser = {},
		terms = [],
	
		initialize = function(config) {
			terms = config.terms;
			settings = config.settings;
			language = config.languageStrings;
			pronunciationPlayer = {};
			var markup = Handlebars.compile(DKI.templates.glossaryBrowser)({
				strings 		      : DKI.strings,
				mobile                : mobile,
				audioSimpleAncestorId : 'glossaryManagePronunciation',
				audioSimplePlayerId   : 'glossaryManagePronunciation_player'
			});
			$("body").append(markup);
			browser.container = $("#glossaryBrowserContainer");
			browser.contentContainer = $("#glossaryContentContainer");
			browser.player = $("#glossaryManagePronunciation");
			browser.close = $("#glossaryBrowserClose");
			browser.back = $("#back");
			if(mobile) {
				browser.container.addClass("phone");
			}
			browser.termList = {
				container 		: $("#termUl"),
				termElements	: []
			},
			browser.termDetails = {
				termTitle :  $("#term"),
				termDefinition : $("#definition"),
				attribution : $("#attribution"),
				container: $("#termDetails")
			};
			populateTermList(terms);
			$("#searchBox").jsonSearch({
				"data" :terms, 
				"searchKey" :'term',
				onSelect : function(term) {
					selectTerm(term.id);
				}
			});
			$("#glossaryBrowserContainer #glossaryManagePronunciation_player").jPlayer({
				swfPath: settings.swfPath,
				cssSelectorAncestor: "#glossaryManagePronunciation",
				ready: function(){
					pronunciationPlayer = $(this);
					browser.container.css("visibility", "visible");	
					browser.container.removeClass('loading');
					// Player Events
					contentApi.playerEvent.on('pageLoaded',function(){browser.container.hide()});
					if(typeof player !== 'undefined') {
						player.navigation.forwardButton.on(settings.clickEvent,function(){hide();});
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
			browser.close.on(settings.clickEvent, function(){
				hide();
			});
			if(mobile) {
				browser.back.on(settings.clickEvent,function(){
					browser.container.on("shifted", function(){
						var selectedTerms = $(".terms li.selected");
						if(selectedTerms.length){
							selectedTerms[0].focus();
						}
						else{
							if(browser.termList.termElements.length!==0){
								if(browser.termList.termElements[0].length!==0){
									browser.termList.termElements[0][0].focus();
								}
							}
						}
						browser.container.off("shifted");
					});
					browser.back.fadeOut(200);
					shiftContainer(0);

				});
			}
			browser.container.draggable({handle : $("#browserHeader"), containment : "body"});
		},
		show = function() {
			
			browser.container.show();				
			if(typeof player != 'undefined') {
				player.navigation.setGlossaryState(true);
			}
			if(browser.termList.termElements.length!==0){
				if(browser.termList.termElements[0].length!==0){
					browser.termList.termElements[0][0].focus();
				}
			}
		},
		hide = function() {
			if(pronunciationPlayer.jPlayer) {
				pronunciationPlayer.jPlayer("stop");
			}
			browser.container.hide();
			if(typeof player != 'undefined') {
				player.navigation.setGlossaryState(false);
			}
		},
		toggle = function() {
			if(browser.container.css("display") == "none"){
				this.show();
			}			
			else{
				this.hide();
			}
		},
		populateTermList = function(terms) {
			$.each(terms, function(index,term) {
				var isMobile = dkiUA.iOS || dkiUA.android || dkiUA.blackberry;
				var html = term.term;
				var css = "";
				if(isMobile) {
					html = "<span class='termIcon'></span>" + term.term;
					css += "mobile";
				}
				var element = $("<li/>", {
					"id" : term.id,
					"html" : html,
					"class"    : css,
					"tabindex": 0
				});
				
				var clickFn = function(){
					termClicked(term.id);
				};
				if (isMobile) {
					element.find("span").on(settings.clickEvent, clickFn);
				} else {
					element.on(settings.clickEvent,clickFn);
				}

				browser.termList.container.append(element);
				browser.termList.termElements.push(element);
				if(term.citation_id && typeof(dataStorage) !== 'undefined'){
					dataStorage.setRelationship("citationGlossary", term.citation_id, term.glossaryid);
				}
				$(document).trigger(DKI.glossaryBrowse.events.glossaryRegistered,[term]);
			});
		},

		getTerm = function(termId) {
			for(var i = 0; i < terms.length; i++){			
				if(terms[i].id == termId){
					return terms[i];
				}
			}
		},
		termClicked = function(id) {
			if(pronunciationPlayer.jPlayer) {
				pronunciationPlayer.jPlayer("stop");
			}
			selectTerm(id);			
		},
		shiftContainer = function(left){
			if(left == 0){
				browser.termList.container.show();				
			}
			else{
				browser.termDetails.container.show();
			}
			browser.contentContainer.animate({
					left : left
				}, 200, function(){
				if(left == 0){					
					browser.termDetails.container.hide();					
				}
				else{
					browser.termList.container.hide();					
				}
				browser.container.trigger("shifted");

			});
			
		},
		getTerms = function() {
			return terms;
		},
		selectTerm = function(termId) {
			show();			
			$("#termDetails .detailsContent").show();
			$("#termDetails").css("visibility", "visible");
			var term = getTerm(termId);
			setTermHighlight(termId);
			browser.termDetails.termTitle.html(term.term);
			browser.termDetails.termDefinition.html(term.definition);
			setSource(term);
			if(term.pronunciation_asset_filename){
				browser.player.show();
				pronunciationPlayer.jPlayer("setMedia", {
					"mp3": settings.assetURL + term.pronunciation_asset_filename
				});
			}
			else{
				browser.player.hide();
			}
			if(mobile) {
				browser.container.on("shifted", function(){
					browser.termDetails.termDefinition[0].focus();	
					browser.container.off("shifted");
				});
				shiftContainer(-283);
				browser.back.fadeIn(200);		
			}
			else{
				browser.termDetails.termDefinition[0].focus();			
			}
		},
		setSource = function(term) {
			if(term.attribution) {
				browser.termDetails.attribution.html("Source: " + term.attribution);
			}
			else if(term.citation_id) {
				browser.termDetails.attribution.html("Source: " + DKI.reference.getFullCitationText(term.citation_id));
			}
			else {
				browser.termDetails.attribution.html('');
			}
		},
		setTermHighlight = function(termId) {
			$("#termList li").removeClass("selected");
			$("#" + termId).addClass("selected");
		},
		isEmpty = function() {
			return terms.length > 0 ? false : true;
		}

		return {
			getTerms 	: getTerms,
			initialize 	: initialize,
			show 		: show,
			hide 		: hide,
			selectTerm  : selectTerm,
			isEmpty 	: isEmpty,
			toggle		: toggle,
			events      : {
				glossaryRegistered  : "glossaryRegistered"
			}
		};
}();