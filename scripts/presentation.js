/* globals dkiUA: false, scormAPI: false, Modernizr: false */

/**
 * Class representing the course player used to preview courses
 * @class DKI.PresentationPlayer
 * @constructor
 * @param {Object} cfg Configuration object.
 * @param {DKI.DataStorage} cfg.dataStorage The dataStorage object which holds course structure and state.
 * @param {Object} cfg.behaviour The object which holds course behaviour options
 * @param {Object} settings The object which holds runtime settings, these change depending on how the course is launced.
 * @param {Object} strings The object holding strings to display to the user, depends on the course's language.
 * @param {String} rootURL The root URL of the package
 */
DKI.PresentationPlayer = function (cfg) {
	/**
	 * The course data storage object
	 */
	this.dataStorage = cfg.dataStorage;
	/**
	 * The raw course structure
	 */
	this.course = cfg.dataStorage.courseStructure;
	/**
	 * Object containing the various player behaviour options
	 */
	this.behaviour = cfg.behaviour;
	/**
	 * Current runtime settings
	 */
	this.settings = cfg.settings;
	/**
	 * Current runtime strings
	 */
	this.strings = cfg.strings;
	this.rootURL = cfg.rootURL;
	if (Modernizr.csstransitions) {
		this.transitions = {
			page: this.dataStorage.courseStructure.pagetransition,
			jump: this.dataStorage.courseStructure.jumptransition,
			end: this.dataStorage.courseStructure.endscreentransition
		};
	}
	else {
		this.transitions = {
			page: "none",
			jump: "none",
			end: "none"
		};
	}

	/**
	 * The current page being displayed
	 */
	this.currentPage = null;

	/**
	 * @property {Object} contentPage
	 * Collection of the previous/current/next content pages
	 * @property {DKI.ContentPage} contentPage.previous
	 * @property {DKI.ContentPage} contentPage.current
	 * @property {DKI.ContentPage} contentPage.next
	 */
	this.contentPage = {
		previous: null,
		current: null,
		next: null
	};
	/**
	 * The current module being displayed
	 * @property {Object}
	 */
	this.currentModule = null;
	/**
	 * The current learning object being displayed
	 * @property {Object}
	 */
	this.currentObject = null;
	/**
	 * The current test being displayed
	 * @property {DKI.Assessment}
	 */
	this.currentTest = null;
	/**
	 * The index in the modules array of the current module
	 * @property {number} 
	 * @private
	 */
	this.currentModuleIndex = 0;
	/**
	 * The index in the learning objects array of the current module
	 * @property {number} 
	 * @private
	 */
	this.currentObjectIndex = 0;
	/**
	 * The index in the page array of the current page
	 * @property {number}
	 * @private
	 */
	this.currentPageIndex = 0;
	/**
	 * The frame used to display course content/questions
	 * @property {jQuery}
	 * @private
	 */
	this.contentFrame = $("#contentFrame");
	/**
	 * Holds the 3 frames used to display page content
	 * @property {Object} pageFrames
	 * @property {HTMLElement} pageFrames.previous
	 * @property {HTMLElement} pageFrames.current
	 * @property {HTMLElement} pageFrames.next
	 */
	this.pageFrames = {};
	this.pageFrames.previous = document.createElement("div");
	this.pageFrames.previous.className = "dkiContentFrame previous hidden";	
	this.pageFrames.current = document.createElement("div");
	this.pageFrames.current.className = "dkiContentFrame current";	
	this.pageFrames.next = document.createElement("div");
	this.pageFrames.next.className = "dkiContentFrame next hidden";
	this.contentFrame.append([
		this.pageFrames.previous,
		this.pageFrames.current,
		this.pageFrames.next
	]);
	/**
	 * The contentAPI object. Injected after player and contentAPI are instantiated
	 * @property {Object} 
	 */
	this.contentAPI = null;
	/**
	 * The course menu
	 * @property {DKI.PlayerMenu}
	 */
	this.menu = null;
	/**
	 * The player navigation API
	 * @property {DKI.PlayerNavigation}
	 */
	this.navigation = new DKI.PlayerNavigation(this);
	/**
	 * Container hold player header
	 * @property {jQuery}
	 */
	this.headerContainer = $("#headerContainer");
	/**
	 * Container holding player footer
	 * @property {jQuery}
	 */
	this.footerContainer = $("#footerContainer");

	/**
	 * The course store object, for fast retrieval of nodes? Mostly because
	 * someone didn't like {@link DKI.DataStorage}
	 * @property {DKI.courseStore}
	 */
	this.store = DKI.courseStore;
	/**
	 * The feedback panel, for course review
	 * @property {DKI.FeedbackPanel}
	 */
	this.feedback = DKI.FeedbackPanel;
	/**
	 * primary dom container for feedback button
	 * @property {jQuery}
	 */
	this.feedbackTab = $("#feedbackTab");
	/**
	 * primary dom container for end review button
	 * @property {jQuery}
	 */
	this.endReviewTab = $("#endReviewTab");

	/**
	 * Current audio status
	 * @property {Boolean}
	 */
	this.audio = true;
	/**
	 * True if this is a 'mobile' course
	 * @property {Boolean}
	 */
	this.isMobile = $(document.body).hasClass("mobile");
	/**
	 * True if this is an administrator preview
	 * @property {Boolean}
	 */
	this.isAdminPreview = $(document.body).hasClass("adminPreview");

	/**
	 * State for the current assessments one of either 'next' for another question to load,
	 * or 'complete' for a completed assessment
	 * @property {String}
	 */
	this.assessmentState = null;
	/**
	 * True when question feedbac is closed, false when next question is loaded
	 * @property {Boolean}
	 */
	this.questionFeedbackClosed = null;
	/**
	 * True when the course end is reached
	 * @property {Boolean}
	 */
	this.reachedEnd = false;

	//Setup forward/back functions
	/**
	 * Pointer to the current 'forward' function.
	 * @method
	 */
	this.forward = this.contentForward;
	/**
	 * Pointer to the current 'backward' function.
	 * @method
	 */
	this.back = this.contentBack;
	/**
	 * Pointer to the current 'reload' function.
	 * @method
	 */
	this.reload = this.contentReload;
	this.events = {

		/**
		 * Triggered whenever the player loads a new page into the frame.
		 * @event
		 */
		pageLoaded: "pageLoaded",
		/**
		 * Triggered whenever the player loads a content page into the frame.
		 * @event
		 */
		contentPageLoaded: "contentPageLoaded",
		/**
		 * Triggered whenever the player loads a question page into the frame.
		 * @event
		 */
		questionPageLoaded: "questionPageLoaded",
		/**
		 * Triggered when the player is resized
		 * event
		 */
		playerResized : "playerResized"
	};

	/**
	 * A boolean flag to determine if the course is currently in a test. Used
	 * by onFeedbackSubmit to add feedback notes to a question page instead of
	 * a regular page.
	 * @property {Boolean}
	 */
	this.inAssessment = false;
	/**
	 * A boolean flag to determine if the course is currently displaying an 
	 * end screen
	 * @property {Boolean}
	 */
	this.inEndScreen = false;

	/**
	 * A boolean flag to determin if the course is currently in a review.
	 * @property {Boolean}
	 */
	this.inReview = false;
	/**
	 * Tracks loading/complete state of next/previous/current pages.  Used to prevent attempting to 'start'
	 * an unloaded page.
	 */
	this.loadState = {
		/**
		 * The loading state of the previous page
		 */
		previous: "done",
		/**
		 * The loading state of the current page
		 */
		current: "done",
		/**
		 * The loading state of the next page
		 */
		next: "done"
	};
	/**
	 * Queue any forward/back action calls
	 */
	this.queuedAction = null;
	//Apply this class to suppress page transitions.  Otherwise, we see the next page transition into place
	//when using the 'slide' transition
	this.contentFrame.addClass("loading");
	this.navigation.hideForwardButton();
	this.navigation.hideBackButton();
	$(this.pageFrames.previous).addClass(this.transitions.page);
	$(this.pageFrames.current).addClass(this.transitions.page);
	$(this.pageFrames.next).addClass(this.transitions.page);
	this.initEvents();
	if(dkiUA.mobile){
		$("html").addClass("on-device");
	}
	else{
		$("html").addClass("on-desktop");
	}
	$(".pageElementsWrapper.design").attr("aria-hidden", "true");
};

/**
 * Applies a given CSS classname to a pageFrame, used to create a transition effect.
 * Removes any previously applied transition class. See DKI.PresentationPlayer.transitionClasses and 
 * DKI.PresentationPlayer.pageFrames
 * @param {String} frame The member of DS.PresentationPlayer.pageFrames
 * @param {String} newClass The classname to apply
 */
DKI.PresentationPlayer.prototype.applyTransitionClass = function (frame, newClass) {
	var pageFrame = $(this.pageFrames[frame]);
	pageFrame.removeClass(DKI.PresentationPlayer.transitionClasses);
	pageFrame.addClass(newClass);
};

/**
 * Initializes the events to be fired, as well as any event handlers
 */
DKI.PresentationPlayer.prototype.initEvents = function () {
	var that = this;

	if (this.behaviour.preventRightClick) {
		$(document).on("contextmenu", function () {return false;});
	}

	$(document).on(DKI.ContentPage.events.ready,function(){
		that.applyCssEffects.init();
	});

	$(this.dataStorage).on(DKI.DataStorage.events.ready, function () {
		that.initSearch();
		that.initMenu();
		that.setPlayerSize();
		that.initFeedbackTab();
		that.resumeBookmark();
		//Remove the loading class, so page transitions will once again be seen
		that.contentFrame.removeClass("loading");
	});

	$(this.dataStorage).on(DKI.DataStorage.events.changeObject, function () {
		that.setObjectDisplay();
	});

	$(this.dataStorage).on(DKI.DataStorage.events.courseEnd, function () {});

	$(this.dataStorage).on(DKI.DataStorage.events.questionSubmitted, function (e, score, questionObject) {
		that.contentPage.current.setScore(score, questionObject);
	});

	$(this.dataStorage).on(DKI.DataStorage.events.assessmentReady, function () {
		that.initBarsAssessment();
		that.navigation.setCurrentScreen(that.dataStorage.getCurrentQuestionCount());
		that.loadCurrentQuestion();
		that.pageFrames.previous.innerHTML = "";
		if (!that.inReview) {
			window.onbeforeunload = function(e){
				var message = that.strings.quitTestWarning;
				e = e || window.event;
				// For IE and Firefox prior to version 4
				if (e) {
					e.returnValue = message;
				}
				// For Safari
				return message;
			};
		}
	});

	$(this.dataStorage).on(DKI.DataStorage.events.assessmentCompleted, function () {
		window.onbeforeunload = function () {};
	});

	$(this.navigation).on(DKI.PlayerNavigation.events.forward, function () {
		that.forward();
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.back, function () {
		that.back();
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.reload, function () {that.reload();});
	$(this.navigation).on(DKI.PlayerNavigation.events.menuToggle, function () {
		that.toggleOutline();
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.menuClose, function () {
		that.hideTree();
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.glossaryToggle, function (e, showGlossary) {
		if (showGlossary) {
			DKI.glossaryBrowse.show();
		}
		else {
			DKI.glossaryBrowse.hide();
		}
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.resourceToggle, function (e, showResource) {
		if (showResource) {
			DKI.resourceBrowser.show();
		}
		else {
			DKI.resourceBrowser.hide();
		}
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.exit, function() {
		that.exitCourse.call(that);
	});
	$(this.navigation).on(DKI.PlayerNavigation.events.audioToggle, function (e, audio) {that.toggleAudio(audio);});
	$(this.navigation).on(DKI.PlayerNavigation.events.transcriptToggle, function () {
		that.toggleTranscript();
	});

	//Handler for next button's click event
	$(document).on(DKI.TestQuestion.events.nextClicked, function () {
		that.forward();
	});
	//Handler for menu's page click event.
	$(document).on(DKI.PlayerMenu.events.pageClicked, function (e, pageid) {
		that.onPageClicked(pageid);
	});
	//Handler for page rezise event
	$(document).on(DKI.ContentPage.events.resize, $.proxy(this.onPageResize, this));

	$(document).on(DKI.TestQuestion.events.feedbackShown, function(){
		// http://frogger.dominknow.com/default.asp?37057
		// practice questions with multiple attempts were enabling the forward button if feedback was shown on the first of multiple attempts, now the forward button is only enabled on the last attempt of a question		
		if(that.contentPage.current.isPracticeQuestion && that.contentPage.current.numAttempts >= that.contentPage.current.question.attempts) {			
			that.navigation.showForwardButton();
		}
	});

	//Bind to the event fired when a page is ready.
	$(document).on(DKI.ContentPage.events.ready, $.proxy(this.onPageReady, this));
	//Bind to the event fired when an endscreen is ready.
	$(document).on(DKI.EndModule.events.ready, $.proxy(this.onEndReady, this));
	$(document).on(DKI.EndCourse.events.ready, $.proxy(this.onEndReady, this));
	$(document).on(DKI.EndTest.events.ready, $.proxy(this.onEndReady, this));
	
	$(window).on("resize", $.proxy(this.onWindowResize, this));	
};

/**
 * Initializes the player menu.
 */
DKI.PresentationPlayer.prototype.initMenu = function () {
	var self = this;
	this.menu = new DKI.PlayerMenu({
		element:"westPanel",
		dataStorage: this.dataStorage,
		behaviour: this.behaviour,
		strings: this.strings,
		player: this
	});
	this.menuWidth = this.menu.getWidth();
	this.menuLeft = this.menu.getLeft();
	$(this.menu).on(DKI.PlayerMenu.events.closed, function () {self.hideTree();});
};

DKI.PresentationPlayer.prototype.initSearch = function(){
	
	if(!(dkiUA.isIE() && dkiUA.ieVersion<=8)) {
		dataStorage.searchManager = new DKI.search.Manager({dataStorage : dataStorage});
		//Remove icon if we won't be using the UI
		if(!playerBehaviour.enableCourseSearch || !DKI.search.isSupportedLanguage()){
			$(".dki-WestPanel .menuHeader a.courseSearchOpen").remove();
		}
	}else {
		$(".dki-WestPanel .menuHeader a.courseSearchOpen").remove();
	}	
}

/**
 * Checks if we should prompt or force a pretest for the current module
 */
DKI.PresentationPlayer.prototype.checkPreTest = function () {
	if (this.behaviour.enablePreTest &&
			this.dataStorage.currentModule.weight > 0 &&
			this.dataStorage.getModuleCompletion(this.dataStorage.currentModule) === 0 &&
			typeof this.dataStorage.currentModule.pre !== "object") {

		if (this.behaviour.forcePreTest) {
			return true;
		}
		else {
			if (window.confirm(this.strings.pretestQuestLabel)) {
				return true;
			}
		}
	}

	return false;
};

/**
 * Displays the given URL in the content frame
 * @param url {string} The URL to be displayed
 * @param frame {HTMLElement} The HTML element that should display the URL content
 * @param callback {Object | Function} Optional callback function(s).  If a function is provieded,
 * executed on success.  Otherwise an object specifying any of success, error and complete functions
 */
DKI.PresentationPlayer.prototype.displayURL = function (url, frame, callback) {
	var callBackObj = {
		success: function () {},
		error: function () {},
		complete: function () {}
	};
	if (callback) {
		if (typeof(callback) == "function") {
			callBackObj.success = callback;
		}
		else {
			if (callback.success) {
				callBackObj.success = callback.success;
			}
			if (callback.error) {
				callBackObj.error = callback.error;
			}
			if (callback.complete) {
				callBackObj.complete = callback.complete;
			}
		}
	}
	$.get(url, function (data) {
		frame.innerHTML = data;
	}, "html").success(callBackObj.success).error(callBackObj.error).complete(callBackObj.complete);
};

/**
 * Returns the score of the current assessment.
 * See DKI.DataStorage#getAssessmentScore
 * @returns {Number | null}
 */
DKI.PresentationPlayer.prototype.getCurrentTestScore = function () {
	return this.dataStorage.getAssessmentScore();
};

/**
 * Returns the number of pages in a module
 * @param {Object} module The module whose screen count is to be determined
 * @returns {Number} The number of screens (content pages) in the module
 */
DKI.PresentationPlayer.prototype.getModuleScreenCount = function (module) {
	var screenCount = 0;
	for (var i = 0; i < module.objects.length; i++) {
		screenCount += module.objects[i].pages.length;
	}

	return screenCount;
};

/**
 * Initialized the bars for learning content
 */
DKI.PresentationPlayer.prototype.initBars = function () {
	var page = this.dataStorage.currentPage.page;
	var prevPage = this.dataStorage.previousPage;
	this.navigation.contentMode();
	this.setModuleDisplay();
	this.setObjectDisplay();
	this.navigation.setCurrentScreen(this.dataStorage.currentModulePage);
	if (this.behaviour.transcripts) {
		if (page.transcript) {
			this.navigation.enableTranscriptButton();
		}
		else {
			this.navigation.disableTranscriptButton();
		}
	}
	else {
		this.navigation.hideTranscriptButton();
	}
	if (page.disableaudio) {
		this.navigation.hideAudioButton();
	}
	else {
		this.navigation.showAudioButton();
	}

	if (!prevPage) {
		this.navigation.hideBackButton();
	}
	if(DKI.glossaryBrowse.isEmpty()) {
		this.navigation.disableGlossaryButton();
	}
	if(DKI.resourceBrowser.isEmpty()) {
		this.navigation.disableResourceButton();
	}
};

/**
 * Initializes the navigation bars for testing content
 */
DKI.PresentationPlayer.prototype.initBarsAssessment = function () {
	var page = this.dataStorage.getCurrentQuestion().page;
	var showNav = false;
	if (this.inReview || (this.behaviour.enableForwardInTesting && this.dataStorage.getCurrentQuestionCount() < this.dataStorage.getTotalQuestions())) {
		showNav = true;
	}
	this.navigation.testMode(showNav);
	/*
	* Case 32546 - The testMode function enables certain buttons in the player. 
	* We need to evaluate disable audio after that call to ensure that it takes precedence
	*/
	if (page.disableAudio) {
		this.navigation.hideAudioButton();
	}
	else {
		this.navigation.showAudioButton();
	}	
	this.navigation.hideBackButton();
	this.navigation.setTotalScreens(this.dataStorage.getTotalQuestions());
	this.navigation.setCurrentScreen(this.dataStorage.getCurrentQuestionCount());
	if (this.behaviour.transcripts) {
		if (page.transcript) {
			this.navigation.enableTranscriptButton();
		}
		else {
			this.navigation.disableTranscriptButton();
		}
	}
	else {
		this.navigation.hideTranscriptButton();
	}

};

/**
 * Initialized the navigation bars for end screens
 */
DKI.PresentationPlayer.prototype.initBarsEndScreen = function () {
	this.inEndScreen = true;
	if (this.behaviour.transcripts) {
		this.navigation.disableTranscriptButton();
	}
	this.navigation.endMode();
};

/**
 * Initializes the feedback tab. Calls the .init function of 
 * feedback UI, displays the tab and attaches keyhandlers. See 
 * DKI.FeedbackPanel
 * @returns {Boolean} For some reason, always returns true
 */
DKI.PresentationPlayer.prototype.initFeedbackTab = function () {
	var that = this;
	if (this.course.isDebug) {
		this.feedback.init(that,"feedbackPanel",DKI.courseStore, this.strings);
		this.feedbackTab.css("display", "block");
		$("body").on(this.settings.clickEvent, function (e) {
			$("#reviewerButtons").hide();
		});
		$("#reviewerButton").on(this.settings.clickEvent, function (e) {
			$("#reviewerButtons").show();
			$("#feedbackTab").focus();
			return false;
		});
		this.feedbackTab.on(this.settings.clickEvent, function (e) {
			that.feedback.toggleDisplay();
			$("#reviewerButtons").hide();
			e.stopPropagation();
			return false;
		});
		this.endReviewTab.css("display", "block");
		this.endReviewTab.on(this.settings.clickEvent + " keypress", function (e) {
			that.onReviewEnded();
			$("#reviewerButtons").hide();
		});
	}
	return true;
};

/**
 * Jumps to a given page in the course.
 * See DKI.DataStorage#jumpToPage
 * and DKI.PresentationPlayer#jumpComplete
 * @param pageID {Number} The ID of the page to jump to
 * @fires DKI.PresentationPlayer.events#contentPageLoaded
 * @fires DKI.PresentationPlayer.events#pageLoaded
 */
DKI.PresentationPlayer.prototype.jumpTo = function (pageID) {
	//TODO: Verify that page jump is allowed by checking enrollment options and completion status.
	/*
	* Case 33623 -  Endscreens aren't actual page objects,
	* so we need to check for that before evaluating if we need to jump or reload
	*/
	var pId = this.contentPage.current.page ? this.contentPage.current.page.id : null;

	//If we have a self referencing page action or the menu selects the currently loaded page, simply reload
	if(pageID == pId) {
		this.contentReload();
	}
	else {
		this.dataStorage.jumpToPage(pageID);
		this.jumpComplete();
	}
};

/**
 * Jumpts to a given module.
 * See DKI.DataStorage#jumpToModule
 * and DKI.PresentationPlayer#jumpComplete
 * @param module {Number|Object} The module to jump to
 * @fires DKI.PresentationPlayer.events#contentPageLoaded
 * @fires DKI.PresentationPlayer.events#pageLoaded
 */
DKI.PresentationPlayer.prototype.jumpToModule = function (module) {
	this.dataStorage.jumpToModule(module);
	this.jumpComplete();
};

/**
 * Executes logic to display content page after jumping
 * @protected
 * @fires DKI.PresentationPlayer.events#contentPageLoaded
 * @fires DKI.PresentationPlayer.event#pageLoaded
 */
DKI.PresentationPlayer.prototype.jumpComplete = function () {
	this.inAssessment = false;
	this.inEndScreen = false;
	this.contentAPI.hideBoth();
	this.initBars();
	//Ensure reachedEnd is false.  If we are jumping to the last page of the course,
	//the 'loadCourseEnd' function call will set the value back to true
	this.reachedEnd = false;
	if (this.checkPreTest()) {
		this.launchTest(this.dataStorage.currentModule.loid, "pre");
	}
	this.applyTransitionClass("next", this.transitions.jump);
	this.loadPage("next", this.dataStorage.currentPage, function () {
		this.dataStorage.setCurrentPageComplete();
		this.reload = this.contentReload;
		this.shuffleForward();
		this.pageFrames.next.innerHTML = "";
		this.pageFrames.previous.innerHTML = "";
		this.initBars();
		if (this.dataStorage.previousPage) {
			this.applyTransitionClass("previous", this.transitions.page);
			this.loadPage("previous", this.dataStorage.previousPage);
		}
		//Determine if an endscreen or page should be loaded in the 'next' slot
		if (this.dataStorage.isEndOfCourse()) {
			this.loadCourseEnd();
		}
		else if (!this.behaviour.skipEnd && this.dataStorage.isEndOfModule()) {
			this.loadModuleEnd();
		}
		else if (this.dataStorage.nextPage) {
			this.applyTransitionClass("next", this.transitions.page);
			this.loadPage("next", this.dataStorage.nextPage);
			//Ensure forward function executes next page, not a start endscreen function
			this.forward = this.contentForward;
		}
		$(this).trigger(this.events.contentPageLoaded);
		$(this).trigger(this.events.pageLoaded);
		this.back = this.contentBack;
	});
};
/**
 * Launches a review of an assessment
 * @param {Object} assessment The assessment to review
 */
DKI.PresentationPlayer.prototype.launchReview = function (assessment) {
	this.inReview = true;
	this.dataStorage.createReview(assessment);
	this.forward = this.assessmentForward;
	this.back = this.assessmentBack;
	this.reload = this.loadCurrentQuestion;
	this.hideTree();
};

/**
 * Launches a test for a module
 * @param {Number} loid The ID of the module to launch a test for
 * @param {Number} prePost If 1, launch a preTest.  If 2, launch a postTest
 */
DKI.PresentationPlayer.prototype.launchTest = function (loid, prePost) {
	if(this.inAssessment){
		// can't load a test if we're already in a test
		return;
	}
	this.inAssessment = true;
	this.dataStorage.createTest(loid, prePost);
	//Setup forward/back functions
	this.forward = this.assessmentForward;
	this.back = this.assessmentBack;
	this.reload = this.loadCurrentQuestion;
	this.hideTree();
};

/**
 * Displays the completion certificate for the course.
 */
DKI.PresentationPlayer.prototype.loadCertificate = function () {
	var that = this;
	this.displayURL(this.settings.certificateURL, this.pageFrames.current, function () {
		DKI.CompletionCertificate(that.contentAPI);
	});
};

/**
 * Loads the current completion information for the course and updates the menu
 */
DKI.PresentationPlayer.prototype.loadCompletion = function () {
	this.dataStorage.loadCompletion(); //TODO: Use configured behaviour to determine if autoResume should be passed.
};

/**
 * Load the course end screen into the content frame
 */
DKI.PresentationPlayer.prototype.loadCourseEnd = function () {
	var loadModuleEnd = false;
	var that = this;
	if (!this.reachedEnd &&
		this.dataStorage.moduleHasTest(this.dataStorage.currentModule) &&
		!this.behaviour.skipEnd) {
		loadModuleEnd = true;
	}
	this.reachedEnd = true;
	if (loadModuleEnd) {
		this.loadModuleEnd();
	}
	else {
		var that = this;
		this.contentPage.next = DKI.EndCourse;
		this.applyTransitionClass("next", this.transitions.end);
		DKI.EndCourse.init(that, that.pageFrames.next);	
		this.forward = this.startCourseEnd;
	}
};

/**
 * Load the current page content into the content frame
 */
DKI.PresentationPlayer.prototype.loadCurrentPage = function () {
	var page = this.dataStorage.currentPage;
	this.forward = this.contentForward;
	this.back = this.contentBack;
	//If pre-testing is enable, and the current module has a test & content has not been attempted
	//launch the pre-test
	if (this.checkPreTest()) {
		this.launchTest(this.dataStorage.currentModule.loid, "pre");
	}
	else {
		this.applyTransitionClass("current", this.transitions.page);
		this.loadPage("current", page, function () {
			this.reload = this.contentReload;
			this.contentPage.current.start();
			this.dataStorage.setCurrentPageComplete();
			this.navigation.setCurrentScreen(this.dataStorage.currentModulePage);

			this.initBars();
			$(this).trigger(this.events.contentPageLoaded);
			$(this).trigger(this.events.pageLoaded);
		});
		if (this.dataStorage.previousPage) {
			this.applyTransitionClass("previous", this.transitions.page);
			this.loadPage("previous", this.dataStorage.previousPage);
		}
		//Determine if an endscreen or page should be loaded in the 'next' slot
		if (this.dataStorage.isEndOfCourse()) {
			this.loadCourseEnd();
		}
		else if (!this.behaviour.skipEnd && this.dataStorage.isEndOfModule()) {
			this.loadModuleEnd();
		}
		else if (this.dataStorage.nextPage) {
			this.applyTransitionClass("next", this.transitions.page);
			this.loadPage("next", this.dataStorage.nextPage);
		}
	}
};

/**
 * Loads a given content page, as either "previous", "current" or "next"
 * @param {String} position One of "previous", "current" or "next".  Used to determine which pageFrames and contentPage
 * object key to use
 * @param {Object} subeo The subeo containing to load
 * @param {Function} [callback] If provided, executed after page is loaded & instantiated
 */
DKI.PresentationPlayer.prototype.loadPage = function (position, subeo, callback) {
	var that = this;
	var pageContainer = this.pageFrames[position];
	var pageMarkup = null;
	var pageActions = null;
	var initPage = function () {
		if (pageMarkup !== null && pageActions !== null) {

			that.contentPage[position] =  new DKI.ContentPage({
				contentAPI: that.contentAPI,
				containerEl: pageContainer,
				actions: pageActions,
				page: subeo.page,
				player: that
			});
			//if its a practice question
			if(subeo.subeotype == 7){
				that.contentPage[position] = new DKI.TestQuestion(that, that.contentPage[position], subeo.question, true);
			}
			//if its a scene
			else if(subeo.subeotype == 8){
				that.contentPage[position] = new DKI.Scene(that, that.contentPage[position]);	
			}
			that.loadState[position] = "done";
			if (callback) {
				callback.call(that);				
			}
			if (that.queuedAction) {
				//Next or previous have been called, execute after load is completed
				if (that.queuedAction === "forward" && position === "next") {
					that.forward();
				}
				else if (that.queuedAction === "resume" && position === "next") {
					that.resume();
				}
				else if (that.queuedAction === "back" && position === "previous") {
					that.back();
				}
				that.queuedAction = null;
			}
		}
	};
	this.loadState[position] = "loading";
	this.loadPageActions(subeo.page.pageid, function (data) {
		pageActions = data;
		initPage();
	});
	this.displayURL(
		this.settings.contentURL + subeo.page.pageid + ".html",
		pageContainer,
		function (data) {
			pageMarkup = data;
			initPage();
	});

};

/**
 * Loads a given question, as either "previous", "current" or "next"
 * @param {String} position One of "previous", "current" or "next".  Used to determine which pageFrames and contentPage
 * object key to use
 * @param {Object} question The question to load
 * @param {Function} [callback] If provided, executed after page is loaded & instantiated
 */
DKI.PresentationPlayer.prototype.loadQuestion = function (position, question, callback) {
	var self = this;
	var callbackFunction = function () {
		this.contentPage[position] = new DKI.TestQuestion(this, this.contentPage[position], question);		
		if (callback) {
			callback.call(self);
		}		
	};
	this.loadPage(position, question, callbackFunction);
};

/**
 * Load the current question into the content frame
 */
DKI.PresentationPlayer.prototype.loadCurrentQuestion = function () {
	var self = this;
	var currentQuestion = this.dataStorage.getCurrentQuestion();
	var nextQuestion = this.dataStorage.getNextQuestion();
	this.applyTransitionClass("next", this.transitions.jump);
	this.navigation.setTotalScreens(this.dataStorage.getTotalQuestions());
	this.navigation.setCurrentScreen(this.dataStorage.getCurrentQuestionCount());
	this.loadQuestion("next", currentQuestion, function () {
		this.shuffleForward();
		self.initBarsAssessment();
		if (this.inReview) {
			this.questionPage.showReview(
				this.dataStorage.assessment.prepost,
				this.dataStorage.getCurrentQuestion().userChoices,
				this.dataStorage.getCurrentQuestion().options,
				this.dataStorage.getCurrentQuestion());
		}
		this.applyTransitionClass("current", this.transitions.page);		
		if (nextQuestion) {
			this.applyTransitionClass("next", this.transitions.page);
			this.loadQuestion("next", nextQuestion, function(){
				$(self).trigger(self.events.pageLoaded);
				$(self).trigger(self.events.questionPageLoaded);
			});
		}
		else {
			this.loadModuleEnd(function(){});
		}
		if (this.behaviour.transcripts) {
			if (currentQuestion.page.transcript) {
				this.navigation.enableTranscriptButton();
			}
			else {
				this.navigation.disableTranscriptButton();
			}
		}
		else {
			this.navigation.hideTranscriptButton();
		}
		this.menu.selectQuestion(currentQuestion);
		this.assessmentState = "next";
		this.questionFeedbackClosed = "false";
		$(this).trigger(this.events.questionPageLoaded);
		$(this).trigger(this.events.pageLoaded);
	});
};

/**
 * Load the module end screen into the content frame
 */
DKI.PresentationPlayer.prototype.loadModuleEnd = function (callback) {
	var self = this;
	this.applyTransitionClass("next", this.transitions.end);	
	self.contentPage.next = DKI.EndModule;
	DKI.EndModule.init(self, this.pageFrames.next);
	if(callback){
		callback.call(self);
	}
	this.forward = this.startModuleEnd;
};

/**
 * Load the actions for a page
 * @param {Number} id The Id of the page to load actions for
 * @param {Function | Object} callback If function, called on successful load.
 * @param {Function} callback.success Function to call on successful load.
 * @param {Function} callback.error Function to call on load error.
 * @param {Function} callback.complete Function to call after load, regardless
 * of success/error
 */
DKI.PresentationPlayer.prototype.loadPageActions = function (id, callback) {
	var url = this.settings.actionsURL + id + this.settings.actionsPrefix;
	var callBackObj = {
		success: function () {},
		error: function () {},

		complete: function () {}
	};
	if (callback) {
		if (typeof(callback) == "function") {
			callBackObj.success = callback;
		}
		else {
			if (callback.success) {
				callBackObj.success = callback.success;
			}
			if (callback.error) {
				callBackObj.error = callback.error;
			}
			if (callback.complete) {
				callBackObj.complete = callback.complete;
			}
		}
	}
	$.get(url, function () {
	}, "json").success(callBackObj.success).error(callBackObj.error).complete(callBackObj.complete);
};

/**
 * Resumes learning content, called from endscreens
 * @param {Boolean} [fromPre = false] Determines if we a resuming after a pre-test,
 * skips the pretest check. Generally should always be false, this parameter is used
 * for internal calls
 */
DKI.PresentationPlayer.prototype.resume = function (fromPre) {
	var self = this;
	var resumeTestOnly = function () {
		var status = self.dataStorage.lessonStatus;
		if (status === "passed" || status === "failed" || self.dataStorage.allTestsAttempted()) {
			self.startCourseEnd();
		}
		else if (self.dataStorage.goNextModule()){
			self.launchTest(self.dataStorage.currentModule.loid, "post");
		}
		else {
			self.dataStorage.onCourseComplete();
			self.startCourseEnd();
		}
	};
	var resumeContent = function (fromPreTest) {
		var tempFrame = self.pageFrames.current;
		self.inAssessment = false;
		self.inEndScreen = false;
		if (self.loadState.next === "loading") {
			if (!self.queuedAction) {
				self.queuedAction = "resume";
			}
			return true;
		}
		if (self.reachedEnd) {
			self.startCourseEnd();
		}
		else {
			//When we come back from a pretest, we're going to display the current page.
			if (fromPreTest) {
				self.dataStorage.resume();
			}
			else{
				self.dataStorage.goNextPage();
			}
			if (self.checkPreTest()) {
				self.launchTest(self.dataStorage.currentModule.loid, "pre");
			}
			else {
				self.applyTransitionClass("next", self.transitions.page);
				self.forward(true);
				setTimeout(function(){
					if (self.dataStorage.previousPage) {
						self.applyTransitionClass("previous", self.transitions.page);
						self.loadPage("previous", self.dataStorage.previousPage);
					}
				}, 500);
			}
		}
	};

	if (this.course.testonly) {
		resumeTestOnly();
	}
	else {
		resumeContent(fromPre);
	}
};

/**
 * Called when player is launched to resume from the last bookmark, or the first page of the course.
 * This function is responsible for actually loading the content page when the player is initialized.
 */
DKI.PresentationPlayer.prototype.resumeBookmark = function () {
	var bookmark = this.dataStorage.bookmark;
	var status = this.dataStorage.lessonStatus;
	if (this.course.testonly) {
		if (status === "passed" || status === "failed" || this.dataStorage.allTestsAttempted()) {
			this.resumeToCourseEnd();
		}
		else if (bookmark && bookmark !== "" && this.dataStorage.jumpToModule(bookmark)) {
			this.launchTest(bookmark, "post");
		}
		else {
			this.launchTest(this.course.modules[0].loid, "post");
		}
	}
	else {
		this.dataStorage.resume(this.behaviour.autoResume);
		this.setModuleDisplay();
		this.loadCurrentPage();
	}
};

/**
 * Resumes to the course end page
 */
DKI.PresentationPlayer.prototype.resumeToCourseEnd = function () {
	var self = this;
	this.contentPage.current = DKI.EndCourse;
	DKI.EndCourse.init(this, this.pageFrames.current);
	self.initBarsEndScreen();
	self.hideTree();
	DKI.EndCourse.start();
};

/**
 * Shuffles the content frames and page objects forward, moving the previous frame into the next postion
 */
DKI.PresentationPlayer.prototype.shuffleForward = function () {
	var tempFrame = this.pageFrames.previous;
	//Add the 'forward' class, so we don't see the previous frame transition to the next position
	this.contentFrame.removeClass("back").addClass("forward");
	this.pageFrames.previous = this.pageFrames.current;
	this.pageFrames.current = this.pageFrames.next;
	this.pageFrames.next = tempFrame;
	this.contentPage.previous = this.contentPage.current;
	this.contentPage.current = this.contentPage.next;
	this.contentPage.next = null;
	tempFrame.innerHTML = "";
	$(this.pageFrames.previous).removeClass("current hidden").addClass("previous");
	$(this.pageFrames.current).removeClass("next hidden").addClass("current").css("visibility", "");
	$(this.pageFrames.next).removeClass("previous hidden").addClass("next");
	var self = this;
	setTimeout(function(){
		$(self.pageFrames.previous).css("visibility", "hidden").addClass("hidden");
		$(self.pageFrames.next).css("visibility", "hidden").addClass("hidden");
	}, 500);

	//this.contentFrame.height(this.course.height);
	//$(this.pageFrames.previous).height(this.course.height);	
	if ($(document.body).hasClass("mobile")) {
		this.headerContainer.css("position", "relative");
		$("body, html, #contentFrame").scrollTop(0);
		this.headerContainer.css("position", "fixed");		
	}
	else if(this.settings.responsive){
		$("body, html, #contentFrame").scrollTop(0);
	}
	if (this.contentPage.previous !== null && this.contentPage.previous.reset) {
		this.contentPage.previous.reset({
			timeout: 500
		});
	}
	this.contentPage.current.start();
};

/**
 * Shuffles the content frames and page objects backward, moving the
 * 'next' frame into the 'previous' postion
 */
DKI.PresentationPlayer.prototype.shuffleBack = function () {
	var tempFrame = this.pageFrames.next;
	//Add the 'back' class, so we don't see the next frame transition to the previous position
	this.contentFrame.removeClass("forward").addClass("back");
	this.pageFrames.next = this.pageFrames.current;
	this.pageFrames.current = this.pageFrames.previous;
	this.pageFrames.previous = tempFrame;
	this.contentPage.next = this.contentPage.current;
	this.contentPage.current = this.contentPage.previous;
	this.contentPage.previous = null;
	tempFrame.innerHTML = "";
	$(this.pageFrames.next).removeClass("current hidden").addClass("next");
	$(this.pageFrames.current).removeClass("previous hidden").addClass("current").css("visibility", "");
	$(this.pageFrames.previous).removeClass("next hidden").addClass("previous");
	var self = this;
	setTimeout(function(){
		$(self.pageFrames.previous).css("visibility", "hidden").addClass("hidden");
		$(self.pageFrames.next).css("visibility", "hidden").addClass("hidden");
	}, 500);
	//this.contentFrame.height(this.course.height);
	//$(this.pageFrames.next).height(this.course.height);
	if ($(document.body).hasClass("mobile")) {
		this.headerContainer.css("position", "relative");
		$("body, html, #contentFrame").scrollTop(0);
		this.headerContainer.css("position", "");		
	}
	else if(this.settings.responsive){
		$("body, html, #contentFrame").scrollTop(0);
	}
	if (this.contentPage.next.reset) {
		this.contentPage.next.reset({
			timeout: 500
		});
	}
	this.contentPage.current.start();
};

/**
 * Called to start the module end screen, setup the forward function and load the next page
 */
DKI.PresentationPlayer.prototype.startModuleEnd = function () {
	// don't start the module end screen until it has been loaded
	if(this.pageFrames.next.innerHTML == ""){
		$(document).on(DKI.EndModule.events.ready,
				$.proxy(function () {
					this.startModuleEnd();
				}, this)
		);
		return;
	}

	var forAssessment = this.inAssessment || this.inReview;	
	this.inReview = false;
	this.inAssessment = false;
	$(".questionScoreDisplay").hide();
	$(".submitButton").hide();
	if (forAssessment) {
		if ((this.course.testonly && this.dataStorage.allTestsAttempted()) ||
				(!this.course.testonly  && !this.dataStorage.nextPage && this.dataStorage.assessment.prepost !== "pre")) {
			this.reachedEnd = true;
		}
	}
	this.setModuleDisplay();
	this.clearObjectDisplay();
	this.initBarsEndScreen();
	this.hideTree();
	this.forward = this.contentForward;
	//Shuffle frames
	this.shuffleForward();
	if (this.reachedEnd) {
		this.loadCourseEnd();
	}
	else {
		this.applyTransitionClass("next", this.transitions.page);
		if (!this.course.testonly) {
			if (forAssessment && this.dataStorage.assessment.prepost === "pre") {
				this.loadPage("next", this.dataStorage.currentPage);
			}
			else {
				this.loadPage("next", this.dataStorage.nextPage);
			}
			this.forward = this.contentForward;
			this.back = this.contentBack;
		}
	}
};

/**
 * Shuffles the course end screen to the current slot.
 */
DKI.PresentationPlayer.prototype.startCourseEnd = function () {
 	// don't start the course end screen until it has been loaded
	if(this.pageFrames.next.innerHTML == ""){
			$(document).on(DKI.EndCourse.events.ready,
					$.proxy(function () {
						this.startCourseEnd();
					}, this)
			);
			return;
	}

	this.initBarsEndScreen();
	//We want menu enabled for course endscreen
	this.navigation.showMenuButton();
	this.hideTree();
	this.shuffleForward();
	this.pageFrames.next.innerHTML = "";
};

/**
 * Size the player to fit the current window/resolution
 * @fires DKI.PresentationPlayer.events#playerResized
 */
DKI.PresentationPlayer.prototype.setPlayerSize = function () {
	this.barHeight = this.headerContainer.height() + this.footerContainer.height();	
	var totalHeight = this.barHeight + parseInt(this.course.height, 10);
	var totalWidth = this.course.width;
	var deltaX = totalWidth - $(window).width();
	var deltaY = totalHeight - $(window).height();
	if (this.behaviour.resizeWindow) {
		//Case 22790 - Checking to see screen real-estate.. if were in a crap resolution, just resize it to the maximum the window can take.
		top.window.resizeBy(deltaX, deltaY);
		if(screen.availHeight <= 800){
			var that = this;
			var resize = function(){
				if (totalHeight > $(window).height()) {
					var newSize = $(window).height() - that.barHeight;
					that.setPageHeight(newSize);
					$('.dkiContentFrame').height(newSize);
					//We only want to run this function once right after our resize. So now we turn it off
					$(window).off("resize", this);
					$(that).trigger(that.events.playerResized);
				}
			}//Use jQuery proxy to send the resize function as the 'this' scope
			$(window).resize($.proxy(resize, resize));
		}
		$(this).trigger(this.events.playerResized);
	}
};

/* Event handlers */

/**
 * Handles the 'ready' event fired by endscreens
 */
DKI.PresentationPlayer.prototype.onEndReady = function () {
	var currentPage = this.dataStorage.currentPage;

	if (currentPage && !this.inAssessment && !this.inEndScreen && !currentPage.page.disablenext) {
		this.navigation.showForwardButton();
	}
};

/**
 * Handles the 'window resized' event
 * need to tightly couple this to prevent courses from stacking up.
 */
DKI.PresentationPlayer.prototype.onWindowResize = function () {
	if(this.contentPage.current && this.contentPage.current.onWindowResize){
		this.contentPage.current.onWindowResize();
	}
	if(this.contentPage.previous && this.contentPage.previous.onWindowResize){
		this.contentPage.previous.onWindowResize();
	}
	if(this.contentPage.next && this.contentPage.next.onWindowResize){
		this.contentPage.next.onWindowResize();
	}
};

/**
 * Handles the 'submission' for the feedback panel, performs actual submission 
 * of data. Not a true event handler, this is implemented by a direct call to 
 * the function. Not very decoupled.
 * See DKI.FeedbackPanel
 * @param {String} text The text entered by the reviewer
 * @param {Function} callback Callback to handle the submission of the data
 */
DKI.PresentationPlayer.prototype.onFeedbackSubmit = function (text, callback) {
	callback = callback === undefined? function(){} : callback;

	var	page = this.inAssessment || this.inReview ? this.dataStorage.assessment.currentQuestion.page : this.dataStorage.currentPage.page;
	var ajaxArgs = {
		type:"PUT",
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		},
		processData: false,
		url: "../api/student.cfm/page/" + page.pageid + "/note",
		dataType: "json",
		success: function(data) {
			callback(data);
		},
		context: this
	};
	if (/\S/.test(text)) {
		ajaxArgs.data = JSON.stringify({description: text});
		$.ajax(ajaxArgs);
	}

	return false;
};

/**
 * Handles the click/keypress of the end review button. Submits the end of
 * the review back to the server.
 * @param {Function} callback The callback function to execute after submitting
 * the end of the review
 */
DKI.PresentationPlayer.prototype.onReviewEnded = function (callback) {
	var self = this;
	callback = callback === undefined? function(){} : callback;

	var	page = this.inAssessment ? this.dataStorage.assessment.currentQuestion.page : this.dataStorage.currentPage;

	var ajaxArgs = {
		type:"PUT",
		headers: {
			"Content-Type": "application/json; charset=UTF-8"
		},
		processData: false,
		url: "../ajax/course.cfm/endReview",
		dataType: "json",
		success: function(data) {
			callback(data);
			self.exitCourse();
		},
		failure: function(){
			alert("There was a problem ending your review period. Please try again.");
		},
		context: this
	};
	$.ajax(ajaxArgs);
	return false;
};

/**
 * Handler for a question's load event. No longer appears to be used
 * @deprecated
 * @param url {string} The URL of the question to display
 */
DKI.PresentationPlayer.prototype.onQuestionLoaded = function (url) {
	this.navigation.setCurrentScreen(this.currentTest.currentQuestionDisplay);
	this.displayURL(url, this.currentFrame);
	return true;
};

/**
 * No longer appears to be used
 * @deprecated
 */
DKI.PresentationPlayer.prototype.onQuestionFeedbackClosed = function () {
	if (this.assessmentState === "next") {
		this.loadCurrentQuestion();
	}
	else if (this.assessmentState === "complete") {
		this.loadModuleEnd();
	}
	else {
		this.questionFeedbackClosed = true;
	}
};

/**
 * Handles the {@link DKI.PlayerMenu.events#pageClicked} event. Will jump to the
 * selected page, if allowed.
 * @param {Number} pageid The ID of the page clicked
 */
DKI.PresentationPlayer.prototype.onPageClicked = function (pageid) {

	if (this.canJump(pageid)) {
		this.hideTree();

		//Need to verify then complete jump to page first.
		this.jumpTo(pageid);
	}
	else {
		window.alert(this.strings.noNavLabel);
	}
};

/**
 * Handles the {@link DKI.ContentPage.events#ready} event. Will call either
 * {@link DKI.PresentationPlayer#onQuestionPageReady} or
 * {@link DKI.PresentationPlayer#onContentPageReady}, depending on the current
 * state
 * @param {Event} e The fired event
 * @param {Object} page The page that is ready
 */
DKI.PresentationPlayer.prototype.onPageReady = function (e, page) {
	if (this.inAssessment || this.inReview) {
		this.onQuestionPageReady(page);
	}
	else {
		this.onContentPageReady(page);
	}
};

/**
 * Handler for the {@link DKI.ContentPage.events#resize} event. If the size
 * passed to too great, will resize content area
 * to fit the window
 * @param {Event} e The event object
 * @param {Number} size The size of the page
 */
DKI.PresentationPlayer.prototype.onPageResize = function (e, size) {
	if (this.isMobile && this.settings.scrolling) {
		this.setPageHeight(size);
	}
};

/**
 * Gets player ready after a content page is ready
 * @param {Object} page The page that is ready
 */
DKI.PresentationPlayer.prototype.onContentPageReady = function (page) {
	var nextPageID = this.dataStorage.nextPage ? parseInt(this.dataStorage.nextPage.page.pageid, "10") : null;
	var prevPageID = this.dataStorage.previousPage ? parseInt(this.dataStorage.previousPage.page.pageid, "10") : null;
	var pageID = parseInt(page.pageid, 10);
	var currentPage = this.dataStorage.currentPage;
	if (pageID === nextPageID && !this.inEndScreen && (!currentPage.page.disablenext)) {
		this.navigation.showForwardButton();
	}
	else if (pageID === prevPageID && !this.inEndScreen && (!currentPage.page.disableback)) {
		this.navigation.showBackButton();
	}
};

/**
 * Gets player ready after a question  page is ready
 */
DKI.PresentationPlayer.prototype.onQuestionPageReady = function () {
	//var nextQuestionID = this.dataStorage.getNextQuestion() ? this.dataStorage.getNextQuestion().page.id : null;

};

/* Navigation methods */

/**
 * Moves learning content back by one screen. Not to be called directly, use
 * {@link DKI.PresentationPlayer#back}
 * @protected
 */
DKI.PresentationPlayer.prototype.contentBack = function () {
	var page;
	var self = this;
	//Whenever we go backwards, we have to end up at least one page from the end.  Ensure this is false.
	this.reachedEnd = false;
	this.contentAPI.hideBoth();
	if (this.loadState.previous === "loading") {
		if (!this.queuedAction) {
			this.queuedAction = "back";
		}
		return true;
	}
	this.dataStorage.goPreviousPage();
	page = this.dataStorage.currentPage;
	this.shuffleBack();
	this.initBars();
	this.dataStorage.setCurrentPageComplete();
	this.navigation.setCurrentScreen(this.dataStorage.currentModulePage);
	//Ensure the 'forward' method is contentForward.  If an endscreen was preloaded before 'previous' action
	//was executed, it may be pointing to a 'start endscreen' action.
	this.forward = this.contentForward;
	this.reload = this.contentReload;
	// added ticket 22864: always ensure buttons are enabled as we can jump from test to page via the menu
	$(this).trigger(this.events.contentPageLoaded);
	$(this).trigger(this.events.pageLoaded);
	setTimeout(function(){
		//Determine if an endscreen or page should be loaded in the 'next' slot
		if (self.dataStorage.isEndOfCourse()) {
			self.loadCourseEnd();
		}
		else if (!self.behaviour.skipEnd && self.dataStorage.isEndOfModule()) {
			self.loadModuleEnd();
		}
	}, 500);

	if (this.dataStorage.previousPage) {
		this.applyTransitionClass("previous", this.transitions.page);
		this.loadPage("previous", this.dataStorage.previousPage);
	}
	return true;
};

/**
 * Advances learning content one screen. Not to be called directly, use
 * {@link DKI.PresentationPlayer#forward}
 * @protected
 */
DKI.PresentationPlayer.prototype.contentForward = function(preventDataStorageNext) {
	var currentModule = this.dataStorage.currentModule;
	var transition = this.transitions.page + " next";
	this.contentAPI.hideBoth();
	if (this.loadState.next === "loading") {
		if (!this.queuedAction) {
			this.queuedAction = "forward";
		}
		return true;
	}
	if(!preventDataStorageNext){
		this.dataStorage.goNextPage();
	}
	if (currentModule !== this.dataStorage.currentModule && this.checkPreTest(this.dataStorage.currentModule)) {
		this.launchTest(this.dataStorage.currentModule.loid, "pre");
	}
	else {
		this.applyTransitionClass(transition);
		this.shuffleForward();
		this.dataStorage.setCurrentPageComplete();
		this.navigation.setCurrentScreen(this.dataStorage.currentModulePage);
		this.reload = this.contentReload;
		// added ticket 22864: always ensure buttons are enabled as we can jump from test to page via the menu
		$(this).trigger(this.events.contentPageLoaded);
		$(this).trigger(this.events.pageLoaded);
		//Determine if an endscreen or page should be loaded in the 'next' slot
		if (this.dataStorage.isEndOfCourse()) {
			this.loadCourseEnd();
		}
		else if (!this.behaviour.skipEnd && this.dataStorage.isEndOfModule()) {
			this.loadModuleEnd();
		}
		else if (this.dataStorage.nextPage) {
			this.applyTransitionClass("next", this.transitions.page);
			this.loadPage("next", this.dataStorage.nextPage);
		}
		this.initBars();
	}

	return true;
};

/**
 * Reloads the current content page. Not to be called directly, use
 * {@link DKI.PresentationPlayer#reload}
 */
DKI.PresentationPlayer.prototype.contentReload = function () {
	this.contentPage.current.reset();
	this.contentPage.current.start();
};

/**
 * Moves the current assessment to the next question. Not to be called directly,
 * use {@link DKI.PresentationPlayer#forward}
 * @protected
 */
DKI.PresentationPlayer.prototype.assessmentForward = function () {	
	var nextQuestion;
	var transition = this.transitions.page + " next";
	var self = this;	
	if (this.loadState.next === "loading") {
		if (!this.queuedAction) {
			this.queuedAction = "forward";			
		}	
		return true;
	}
	this.dataStorage.goNextQuestion();
	this.applyTransitionClass(transition);
	this.contentAPI.hideBoth();
	this.shuffleForward();
	this.initBarsAssessment();
	this.navigation.setTotalScreens(this.dataStorage.getTotalQuestions());
	this.navigation.setCurrentScreen(this.dataStorage.getCurrentQuestionCount());
	if (this.inReview) {
		this.questionPage.showReview(
			this.dataStorage.assessment.prepost,
			this.dataStorage.getCurrentQuestion().userChoices,
			this.dataStorage.getCurrentQuestion().options,
			this.dataStorage.getCurrentQuestion());
	}		
	nextQuestion = this.dataStorage.getNextQuestion();	
	if (nextQuestion) {
		this.applyTransitionClass("next", this.transitions.page);
		this.loadQuestion("next", nextQuestion, function(){
			$(self).trigger(self.events.pageLoaded);
			$(self).trigger(self.events.questionPageLoaded);
		});
	}
	else {
		this.loadModuleEnd(function(){});
	}	
	return true;
};

/**
 * Moves the current assessment to the previous question. Not to be called
 * directly, use {@link DKI.PresentationPlayer#back}
 * @protected
 */
DKI.PresentationPlayer.prototype.assessmentBack = function () {
	var prevQuestion;
	var transition = this.transitions.page + " previous";
	this.applyTransitionClass(transition);
	this.contentAPI.hideBoth();
	if (this.loadState.previous === "loading") {
		if (!this.queuedAction) {
			this.queuedAction = "back";
		}
		return true;
	}
	this.dataStorage.goPreviousQuestion();
	this.shuffleBack();
	prevQuestion = this.dataStorage.getPreviousQuestion();
	if (prevQuestion) {
		this.applyTransitionClass("previous", this.transitions.previous);
		this.loadQuestion("previous", prevQuestion);
		this.contentAPI.showBoth();
	}
	$(this).trigger(this.events.pageLoaded);
	$(this).trigger(this.events.questionPageLoaded);
	return true;
};

/**
 * Hide the course menu
 */
DKI.PresentationPlayer.prototype.hideTree = function () {
	this.menu.hide();
	this.navigation.setMenuState(false);
};

/**
 * Displays the course menu
 */
DKI.PresentationPlayer.prototype.showTree = function () {
	this.menu.show();
	this.menu.scrollToSelected();
	this.navigation.setMenuState(true);
};

/**
 * Toggles the current state of course audio from on to off
 * @param {String} audio If "on", audio is turned on, otherwise turned off.
 */
DKI.PresentationPlayer.prototype.toggleAudio = function (audio) {
	if (audio === "on") {
		this.audio = true;
	}
	else {
		this.audio = false;
	}
	if (this.contentPage.current.setAudio) {
		this.contentPage.current.setAudio(this.audio);
	}
};

/**
 * Displays the page audio transcript
 */
DKI.PresentationPlayer.prototype.showTranscript = function () {	
	this.showTree();
	this.menu.selectedTab("transcriptTab");
};

/**
 * Hides the page audio transcript
 */
DKI.PresentationPlayer.prototype.hideTranscript = function () {
	this.hideTree();
};

/**
 * Toggles the shown/hidden state of the page audio transcript
 */
DKI.PresentationPlayer.prototype.toggleTranscript = function () {
	if (this.menu.selectedTab() === "transcriptTab" && !this.menu.tabSet.isHidden()){
		this.hideTranscript();
	}
	else{
		this.showTranscript();
	}
};

/**
 * Hide the course outline
 */
DKI.PresentationPlayer.prototype.hideOutline = function () {
	this.hideTree();
};

/**
 * Displays the course outline
 */
DKI.PresentationPlayer.prototype.showOutline = function () {	
	this.showTree();
	this.menu.selectedTab("outlineTab");
};

/**	
 * Toggles the shown/hidden state of the outline
 */
DKI.PresentationPlayer.prototype.toggleOutline = function () {
	if (this.menu.selectedTab() === "outlineTab" && !this.menu.tabSet.isHidden()){
		this.hideOutline();
	}
	else{
		this.showOutline();
	}
};

/**
 * Jumps to the subeo passed in and sets completion on everything before
 * @param {string} subeoId the subeoid to jump to
 */
DKI.PresentationPlayer.prototype.jumpToSubeo = function (subeoId) {
	var page = this.dataStorage.getPageFromSubeo(subeoId);
	//case 37189: if you delete the endpoint of the page link (ie remove its lo from the course) the page link is still around and jumping to it causes an error.
	//fix here is to simply check to see whether or not the page is in this course before jumping.
	if(page){
		this.initBars();
		this.dataStorage.completePreviousPages(page);
		this.jumpTo(page.pageid);
	}
};

/* Navigation helper methods */

/**
 * Sets the current object complete.
 */
DKI.PresentationPlayer.prototype.setCurrentObjectComplete = function () {
	this.dataStorage.setCurrentObjectComplete();
};

/**
 * Displays the current module details in the navigation bars
 * @protected
 */
DKI.PresentationPlayer.prototype.setModuleDisplay = function () {
	this.navigation.setModuleName(this.dataStorage.currentModule.name);
	this.navigation.setTotalScreens(this.dataStorage.currentModulePageTotal);
};

/**
 * Displays the current learning object details in the navigation bars
 * @protected
 */
DKI.PresentationPlayer.prototype.setObjectDisplay = function () {
	var text = this.dataStorage.currentObject ? this.dataStorage.currentObject.name : "";
	this.navigation.setObjectName(text);
};

/**
 * Sets the height, in pixels, of the content display area
 * @param {Number} size The height the area should be
 */
DKI.PresentationPlayer.prototype.setPageHeight = function (size) {
	$(this.pageFrames.current).height(size);
	this.contentFrame.height(size);
	if(dkiUA.blackberry && parent && parent.setContentHeight){
		parent.setContentHeight(size);
	}
};


/**
 * Removes any text from display area of navigation bars
 */
DKI.PresentationPlayer.prototype.clearObjectDisplay = function () {
	this.navigation.setObjectName("");
};

/* 'Private' methods.  Helpers that are publically available, but only intended to be call from within instance methods */

/**
 * Determines if we can jump to a given page
 * @protected
 * @param {Number} pageId
 * @returns {Boolean}
 */
DKI.PresentationPlayer.prototype.canJump = function (pageID) {
	var nextPage;
	if (!this.behaviour.forceSequential) {
		return true;
	}
	else {
		nextPage = this.dataStorage.getPrecedingPage(pageID);
		if (!nextPage || nextPage.complete) {
			return true;
		}
		else {
			return false;
		}
	}
};
DKI.PresentationPlayer.prototype.applyCssEffects = {
	allowed :  function(){
		return ((dkiUA.ie && dkiUA.ieVersion > 6) || !dkiUA.ie);
	}(),
	init : function(){
		var r;
		var reflections;
		if(this.allowed){
			reflections=$(".cssFX-slctr-Reflect");
			for(r=0;r < reflections.length; r++){
				var images=$($(".cssFX-slctr-Reflect")[r]).find("img");
				if(images.length==2 && $(reflections[r]).data("rolloverassetid")!==null){
					//alert($(images[1]).attr('id') )
					var id = "#"+$(images[1]).attr("id");
					$(id).show();
					$(id).reflect({
						height:1/3,opacity:0.5,
						attr:{
							cls:"dki-image-rollover-reflected",
							style:"filter:inherit;" +
								"left: 0px;" +
								"top: 0px;" +
								"width: inherit !important;" +
								"height: inherit !important;" +
								"right:0px;" +
								"bottom:0px;" +
								"overflow: hidden;" +
								"position: absolute;" +
								"display:none;z-index:2"
						}
					});
					$(id).attr("class","reflected"); //dki-image-rollover '
				}

				$(images[0]).reflect({
					height:1/3,opacity:0.5,
					attr:{
						cls:"dki-image-root-reflected",
						style:"filter:inherit; " +
						"left: 0px; " +
						"top: 0px; " +
						"width: inherit !important; " +
						"height: inherit !important; " +
						"right:0px; " +
						"bottom:0px; " +
						"overflow: hidden; " +
						"z-index: 1; " +
						"position: absolute;"
					}
				});
			}
		}else{
			reflections=$(".cssFX-slctr-Reflect");
			for(r=0;r < reflections.length; r++){
				$(reflections[r]).removeClass("cssFX-slctr-Reflect");
				$(reflections[r]).removeClass("cssFX-Reflect");
				$(reflections[r]).removeClass("cssFX-MirrorRounded");
				$(reflections[r]).height(
					Math.round($(reflections[r]).height() * 0.7)
				);
			}
		}
	}
};

/**
 * Opens a model with a given URL
 * @param {String} url The URL to display
 * @param {Function} [callback] Callbac to get the result of the url load
 */
DKI.PresentationPlayer.prototype.openModal = function(url, callback) {
	DKI.Modal.show({url: url, callback: callback});
};

/**
 * Close the course pacage
 */
DKI.PresentationPlayer.prototype.exitCourse = function() {
	var doExit = true;
	if (this.inAssessment) {
		if (window.confirm(this.strings.quitTestWarning)) {
			window.onbeforeunload = function () {};
			this.dataStorage.checkCourseComplete();
		}
		else {
			doExit = false;
		}
	}
	if (doExit) {
		if (scormAPI) {
			if (scormAPI.strLMSStandard === "SCORM2004" &&
					(
					 this.dataStorage.lessonStatus === "passed" ||
					 this.dataStorage.lessonStatus === "failed" ||
					 this.dataStorage.lessonStatus === "complete"
					)
				)
			{
				scormAPI.SCORM2004_SetNavigationRequest("exitAll");
			}
			scormAPI.ConcedeControl();
			if (this.behaviour.launchInNewWindow) {
				window.close();
			}
		}
		else {
			if (this.behaviour.exitFunction !== "") {
			/* jshint evil: true */
				eval(this.behaviour.exitFunction);
			/* jshint evil: false */
			}
			else{
				window.close();
			}
		}
	}
};

// Static values
/**
 * @property
 * @static
 */
DKI.PresentationPlayer.transitionClasses = "none slide fade flip pop";
