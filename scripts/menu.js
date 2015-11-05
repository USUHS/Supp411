/**
 * Represents the course player menu
 * @class DKI.PlayerMenu
 * @constructor
 * @param {Object} cfg The configuration object.
 * @param {Object} cfg.behaviour The Object holding course behaviour options
 * @param {DKI.DataStorage} cfg.dataStorage The Object holding the course structure and state
 * @param {String} cfg.element The ID of the HTMLElement holding the menu
 * @param {Object} cfg.strings The Object holding the strings to display for the course language
 * @param {DKI.PresentationPlayer} cfg.player
 */
DKI.PlayerMenu = function (cfg) {
	var defaults = {
		animation: {
			effect: "slide",
			options: {
				direction: $("html").hasClass("ltr")? "left" : "right"
			}
		}
	};
	cfg = DKI.applyIf(cfg, defaults);	
	this.config = cfg;

	var that = this;
	/**
	 * The HTML element containing the menu
	 * @property container
	 * @type HTMLElement
	 */
	this.container = $("#" + cfg.element);	
	/**
	 * The object holding the course's runtime behaviour
	 * @property behaviour
	 * @type Object
	 */
	this.behaviour = cfg.behaviour;
	/**
	 * The object holding the course's structure and state
	 * @property dataStorage
	 * @type DKI.DataStorage
	 */
	this.dataStorage = cfg.dataStorage;
	/**
	 * The object holding the UI strings in the course's language
	 * @property strings
	 * @type Object
	 */
	this.strings = cfg.strings;
	/**
	 * The string holds the string that matches up for the click event (touchstart or click depending on device)
	 * @property clickEvent
	 * @type string
	 */
	this.clickEvent = cfg.player.settings.clickEvent;
	
	DKI.courseStore.load(this.dataStorage.courseStructure);
	/**
	 * The flattened course structure object
	 * @property store
	 * @type DKI.courseStore
	 */
	this.store = DKI.courseStore;
	
	/**
	 * The menu's tabset
	 * @property tabSet
	 * @type DKI.TabSet
	 * @private
	 */
	this.tabSet = new DKI.TabSet({
		elementID: "westPanel",
		player: cfg.player		
	});
	this.tabSet.selectTab('outlineTab', true);
	this.outlineTab = document.getElementById("outlineTab");
	
	// modified to use singleton player tree
	this.tree = DKI.PlayerTree;
	DKI.PlayerTree.init(cfg.player,'outlineContent',DKI.courseStore)	
			
	if (this.behaviour.transcripts) {
		this.transcript = this.tabSet.createTab(this.strings.transcriptLabel, "transcriptTab").content;
		this.transcriptTab = document.getElementById("transcriptTab");
		this.transcriptContent = document.createElement("div");
		this.transcriptContent.tabIndex = -1;
		this.transcriptContent.className = "transcript-content";
		this.transcript.appendChild(this.transcriptContent);

		this.transcriptPosition=0;	// used to track vertical position in the transcript scroller		
	}
	if (this.behaviour.pageNotes) {
		this.notes = this.tabSet.createTab(this.strings.notesLabel, "notesTab").content;
		this.notesTab = document.getElementById("notesTab");
		this.notesContent = document.createElement("div");
		this.notesContent.tabIndex = -1;
		this.notesContent.className = "notes-content";
		this.notes.appendChild(this.notesContent);
		this.notesPosition=0;		// used to track vertical position in the note scroller
	}
	this.close = $(".buttonClose");
	//Custom event names
	
	this.pageClicked = "menuPageClicked";
	this.closed = "menuClosed";

	this.initEvents();
	
	/**
	 * Private function to render all transcripts for the course
	 */
	function renderTranscriptAndNotes(){
		
		// transcript base elements
		if (that.transcript) {
			that.transcript.innerHTML='<div class="title">&nbsp;' + this.strings.transcriptLabel + '</div>';
			
			var elWrapperTranscript = document.createElement('div')
			that.transcript.appendChild(elWrapperTranscript)
		}
		
		// note base elements
		if (that.notes) {
			that.notes.innerHTML='<div class="title">&nbsp;' + this.strings.notesLabel + '</div>';
			
			var elWrapperNote = document.createElement('div')
			that.notes.appendChild(elWrapperNote)
		}
				
		var pages = DKI.courseStore.page.all();		
		for(var iPage=0; iPage < pages.length; iPage++){
			var page=pages[iPage];
			
			if(page.nodeType == DKI.courseStore.NodeType.page){
				if(page.transcript!='' && that.transcript){
					elWrapperTranscript.appendChild(
						createDom({
							elId	: 'transcript-' + page.id,
							id 	 	: page.id,
							title	: page.title,
							body 	: page.transcript.body
						})
					)
				};
				
				if(page.pageNote!='' && that.notes){
					elWrapperNote.appendChild(
						createDom({
							elId	: 'note-' + page.id,
							id 	 	: page.id,
							title	: page.title,
							body 	: page.pageNote.body
						})
					);
				}; // end test
			
			}
			
		}; // end page loop
		
		return null;
		
	}; //-> end renderTranscripts
	
	function createDom(oConfig){
		
		var el=document.createElement('div')
		el.className = 'page'
		el.id = oConfig.elId;					
		el.setAttribute('page-id',oConfig.id)	
		
		var elTitle = document.createElement('div');
		elTitle.innerHTML = oConfig.title;		
		el.appendChild(elTitle)
		
		var elBody = document.createElement('p')
		elBody.innerHTML = oConfig.body.replace(/\n/gi, "<br />"); 
		el.appendChild(elBody)
		
		return el;		
	};
		
};

/**
 * Initializes the player events
 */
DKI.PlayerMenu.prototype.initEvents = function () {
	var that = this;
	
	$(this.close).on(this.clickEvent, function (e) {e.stopPropagation();that.onCloseClicked();});
	
	this.tree.pageClicked=function (event, pageid) {
		$(document).trigger(DKI.PlayerMenu.events.pageClicked, pageid);
	};
	
	$(this.dataStorage).on(DKI.DataStorage.events.pageCompleted, function (e, pageid) {
		that.tree.setComplete({type:that.store.NodeType.page,id:pageid})
	});

	$(this.dataStorage).on(DKI.DataStorage.events.objectCompleted, function (e, objectid) {
		that.tree.setComplete({type:that.store.NodeType.object,id:objectid})
	});

	$(this.dataStorage).on(DKI.DataStorage.events.moduleCompleted, function (e, moduleid) {
		that.tree.setComplete({type:that.store.NodeType.module,id:moduleid})
	});

	$(this.dataStorage).on(DKI.DataStorage.events.courseCompleted, function (e) {
		that.tree.setComplete({type:that.store.NodeType.course,id:that.dataStorage.courseStructure.courseid})
	});

	$(this.dataStorage).on(DKI.DataStorage.events.pageSelected, function (e, subeo) {
		that.selectPage(subeo.page);
	});

	//Case 34249 - Transcripts should be empty for endscreens
	$(document).on(DKI.EndTest.events.started, $.proxy(function(){
		if (this.transcriptContent){
			this.transcriptContent.innerHTML = "";
		}
		if (this.notesContent){
			this.notesContent.innerHTML = "";
		}
	}, this));
	$(document).on(DKI.EndModule.events.started, $.proxy(function(){
		if (this.transcriptContent){
			this.transcriptContent.innerHTML = "";
		}
		if (this.notesContent){
			this.notesContent.innerHTML = "";
		}
	}, this));
	$(document).on(DKI.EndCourse.events.started, $.proxy(function(){
		if (this.transcriptContent){
			this.transcriptContent.innerHTML = "";
		}
		if (this.notesContent){
			this.notesContent.innerHTML = "";
		}
	}, this));

	$(".dki-WestPanel .menuHeader").delegate(".courseSearchOpen", this.clickEvent, function(e){
		contentApi.hideMenu();
		contentApi.toggleCourseSearch();
		e.stopPropagation();
	});
	
	// close button for west panel;
	$('.dki-WestPanel .menuHeader').delegate('.buttonClose',this.clickEvent,function(e){
		that.onCloseClicked();
		e.stopPropagation();
		return false;

	})
	
	// enable click on transcript or note element to jump to the page
	$('.dki-WestPanel .innerBlockScroll .content').delegate('.page',this.clickEvent,function(e){
		e.stopPropagation();
		that.onCloseClicked();
		that.dataStorage.jumpToPage($(this).attr('page-id'));
		return false;
	})
	return null;	
	
};

/**
 * Gets the left position of the menu container
 * @return {Number}
 */
DKI.PlayerMenu.prototype.getLeft = function () {
	return 0// $(this.container).offset().left;
};

/**
 * Gets the width of the menu in pixels
 * @return {Number}
 */
DKI.PlayerMenu.prototype.getWidth = function () {
	return $(this.container).width();
};

/**
 * Sets the course object to display in the menu
 * @param {Object} course The course structure
 */
DKI.PlayerMenu.prototype.setCourse = function (course) {
	this.tree.setCourse(course);
};

/**
 * @deprecated
 */
DKI.PlayerMenu.prototype.setCourseComplete = function () {
	//this.tree.setCourseComplete();
};

/**
 * Set the height of the menu
 * @param {Number} height New menu height in pixels
 */
DKI.PlayerMenu.prototype.setHeight = function (height) {
	$(this.container).height(height);
};

/**
 * @deprecated
 */
DKI.PlayerMenu.prototype.setModuleComplete = function (moduleID) {
	//this.tree.setModuleComplete(moduleID);
};

/**
 * @deprecated
 */
DKI.PlayerMenu.prototype.setObjectComplete = function (objectID) {
	//this.tree.setObjectComplete(objectID);
};

/**
 * @deprecated
 */
DKI.PlayerMenu.prototype.setPageComplete = function (pageID) {
	//this.tree.setPageComplete(pageID);
};


/**
 * Select a page in the menu
 * @param {Object|String} page The page to select
 */
DKI.PlayerMenu.prototype.selectPage = function (page) {
	if (typeof(page) == "string") {
		page = this.dataStorage.findPage(page);
	}
	this.tree.selectPage(page.pageid);
	
	// make sure no other page node is selected
	$("div.content div.active").each(function (i) {
		$(this).removeClass("active");
	});
	$(this.outlineTab).removeClass("disabled");
	
	if (this.behaviour.transcripts && page.transcript) {
		this.transcript.scrollTop = 0;
		this.transcriptContent.innerHTML = page.transcript.body;
	}
	else if (this.transcriptContent){
		this.transcriptContent.innerHTML = "";
	}

	if (this.behaviour.pageNotes && page.pageNote) {
		this.notesContent.innerHTML = page.pageNote.body;
		$(this.notesTab).removeClass("disabled");
	}
	else if (this.notesContent) {
		this.notesContent.innerHTML = "";
	}
	if(playerBehaviour.enableCourseSearch){
		$(".dki-WestPanel .menuHeader a.courseSearchOpen").show();
	}
	
	return null
};

/**
 * Selects a question in the menu
 * @param {Object|String} question The question to select
 */
DKI.PlayerMenu.prototype.selectQuestion = function (question) {
	if (typeof(question) == "string") {
		question = this.dataStorage.findQuestion(question);
	}

	if (this.behaviour.transcripts && question.page.transcript) {
		this.transcriptContent.innerHTML = question.page.transcript.body;
		//Disable outline and pageNotes tabs
		$(this.outlineTab).addClass("disabled");
		if (this.notesTab) {
			$(this.notesTab).addClass("disabled");
		}
	}
	else if (this.transcriptContent) {
		this.transcriptContent.innerHTML = "";
	}
	$(".dki-WestPanel .menuHeader a.courseSearchOpen").hide();
};

/**
 * Scrolls the menu to the selected node
 */
DKI.PlayerMenu.prototype.scrollToSelected = function () {
	this.tree.scrollToSelected();
};

/**
 * Selects a tab in the menu, or returns the selected tab
 * @param {String} tabID The Id of the tab to select.
 * @return {String} If tabID is not provided, returns the ID of the 
 * currently selected tab.
 */
DKI.PlayerMenu.prototype.selectedTab = function (tabID) {
	if (tabID) {
		this.tabSet.selectTab(tabID);
	}
	else {
		return this.tabSet.selectedTab().id;
	}
};

/**
 * Handles the click event of the close button.
 *
 * Fires
 *
 * - DKI.PlayerMenu.events#closed
 */
DKI.PlayerMenu.prototype.onCloseClicked = function (page) {
	$(this).trigger(DKI.PlayerMenu.events.closed);
};

/**
 * Hide the tabset
 */
DKI.PlayerMenu.prototype.hide = function () {
	$(this.container).hide(this.config.animation.effect, this.config.animation.options).addClass("hidden");
};

/**
 * Show the tabset
 */
DKI.PlayerMenu.prototype.show = function () {
	$(this.container).show(this.config.animation.effect, this.config.animation.options).removeClass("hidden");
	if((player.inAssessment || player.inReview) || !playerBehaviour.enableCourseSearch) {
		$(".dki-WestPanel .menuHeader a.courseSearchOpen").hide();
	}
	else {
		$(".dki-WestPanel .menuHeader a.courseSearchOpen").show();
	}

};

/**
 * @class DKI.PlayerMenu.events
 * @static
 */
DKI.PlayerMenu.events = {
	/**
	 * @event
	 * @static
	 * @member DKI.PlayerMenu.events
	 */
	closed: "MENU_CLOSED",
	/**
	 * @event
	 * @static
	 * @member DKI.PlayerMenu.events
	 */
	pageClicked: "MENU_PAGE_CLICKED"
};

	