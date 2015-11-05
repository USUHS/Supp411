/* exported contentApi*/
/**
 * This object provides a façade to the objects and methods that make up the core of the player,
 * allowing content pages or custom theme logic to interact with the player and its data.
 * @class
 * @static
 */
var contentApi = (function () {
	var player;
	var behaviour;
	var navigation;
	var dataStorage;
	var scormAPI;
	var data;
	var strings;
	var returnObj = {DkiApi: {}};
	var events = {
		called : "contentAPICalled"
	}
	var pub = {
		/**
		 * The initializer, takes in the player object and, if applicable,
		 * the scormAPI object. Not intended to be called by content/themes
		 * @protected
		 * @member contentApi
		 * @static
		 * @constructor
		 * @param {DKI.PresentationPlayer} playerObj The object providing core
		 * player functionality.
		 * @param {Object}  [scormAPIObj=undefined] The object providing the
		 * SCORM API methods, if this is a SCORM course
		 */
		init: function (playerObj, scormAPIObj) {
			player = playerObj;
			strings = playerObj.strings;
			navigation = player.navigation;
			if(!player.isSinglePage){
				dataStorage = player.dataStorage;
				scormAPI = scormAPIObj;
				behaviour = player.behaviour;
				data = {};
			}
		},
		/**
		 * Enables the course player's audio button
		 * @member contentApi
		 * @static
		 */
		audioButtonOn: function () {
			navigation.showAudioButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Audio is enabled."}]);
		},
		/**
		 * Disables the course player's audio button
		 * @member contentApi
		 * @static
		 */
		audioButtonOff: function () {
			navigation.hideAudioButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Audio is disabled."}]);
		},
		/**
		 * Navigates to the previous content page
		 * @member contentApi
		 * @static
		 */
		contentGoBack: function () {
			navigation.fireBack();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Navigated to the previous page."}]);
		},
		/**
		 * Navigates to the next content page
		 * @member contentApi
		 * @static
		 */
		contentGoNext: function () {
			navigation.fireForward();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Navigated to the next page."}]);
		},
		/**
		 * Returns the audio status
		 * @member contentApi
		 * @static
		 * @returns {boolean} The current status of the audio, false for muted or true for on.
		 */
		getAudioStatus: function () {
			var ret = player.isSinglePage ? true : player.audio;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Audio Status retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the percentage of the course currently complete (0 - 100)
		 * @member contentApi
		 * @static
		 * @returns {number} The percentage of the course content currently complete.
		 */
		getCourseCompletion: function () {
			var ret = player.isSinglePage ? null : dataStorage.getCourseCompletion();
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course completion retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the current course's manifestId
		 * @member contentApi
		 * @static
		 * @returns {string} The manifestId of the course package
		 */
		getCourseID: function () {
			var ret = player.isSinglePage ? null : dataStorage.courseStructure.manifestId;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course ID retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the current course's metadata object
		 * @member contentApi
		 * @static
		 * @returns {Object} The course metadata object
		 */
		getCourseMetadata: function () {
			var ret = player.isSinglePage ? null :  dataStorage.courseStructure.metadata;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course metadata retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the course's language as a culture code
		 * @member contentApi
		 * @static
		 * @returns {string} The language of the course
		 */
		getCourseLanguage: function () {
			var ret = player.isSinglePage ? null :  dataStorage.courseStructure.crslanguage;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course language retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the course's name
		 * @member contentApi
		 * @static
		 * @returns {string} The name of the course
		 */
		getCourseName: function () {
			var ret = player.isSinglePage ? null :  dataStorage.courseStructure.coursename;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course name retrieved", data : ret}]);
			return ret;
		},
				/**
		 * Returns the course's pass mark
		 * @member contentApi
		 * @static
		 * @returns {string} The pass mark of the course. String number 0-100
		 */
		getCoursePassMark: function () {
			var ret = player.isSinglePage ? null :  dataStorage.courseStructure.passmark;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course pass mark retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the number of content pages in the course
		 * @member contentApi
		 * @static
		 * @returns {number} The number of content pages in the course.
		 */
		getCoursePageCount: function () {
			var ret = player.isSinglePage ? null :  dataStorage.countCoursePages();
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course page count retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the current course score.  This is the actual score, out of 100
		 * @member contentApi
		 * @static
		 * @returns {number} The current course score, out of 100
		 */
		getCourseScore: function () {
			var ret = player.isSinglePage ? null :  dataStorage.getCourseScoreAvg();
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course score retrieved.", data : ret}]);
			return ret;
		},
		/**
		 * Returns the current average score.  This is only calculated for currently attempted tests
		 * @member contentApi
		 * @static
		 * @returns {number} The average score for all currently attempted tests
		 */
		getCourseScoreAvg: function () {
			var ret = player.isSinglePage ? null :  dataStorage.getCourseScoreAvg();
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course score average retrieved.", data : ret}]);
			return ret;
		},
		/**
		 * Returns the name of the current module.
		 * @member contentApi
		 * @static
		 * @returns {string} The current module name
		 */
		getCurrentModuleName: function () {
			var ret = player.isSinglePage ? null :  dataStorage.currentModule.name;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Current module name retrieved.", data : ret}]);
			return ret;
		},
		/**
		 * Retrieves a data value previously stored with {@link contentApi#setData}
		 * @member contentApi
		 * @static
		 * @param {string} label The name of the data value to return
		 * @returns {Object} The data value previously stored
		 */
		getData: function (label) {
			var ret = player.isSinglePage ? null :  dataStorage.getContentVariable(label);
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Data for " + label + " retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the duration of the course, in minutes
		 * @member contentApi
		 * @static
		 * @returns {number} The number of minutes the course is expected to take to complete
		 */
		getDuration: function () {
			var ret = player.isSinglePage ? null :  parseInt(dataStorage.courseStructure.duration, 10);
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course duration retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the maximum number of allowed post-test attempts for the course
		 * @member contentApi
		 * @static
		 * @returns {number}
		 */
		getMaxTestAttempts: function () {
			var ret = 0;
			if(!player.isSinglePage){
				if (!behaviour.enablePostTest) {
					ret = 0;
				}
				else if (!behaviour.allowRetesting) {
					ret = 1;
				}
				else {
					ret = parseInt(behaviour.retestAttempts, 10) + 1;
				}
			}
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course maximum test attempts retrieved", data : ret}]);
			return ret;
			
		},
		/**
		 * Returns the course modules, in order
		 * @member contentApi
		 * @static
		 * @returns {Object} Module objects.
		 */
		getModules: function () {
			var modules = null;
			var currentMod;
			if(!player.isSinglePage){
				modules = [];
				for (var i = 0; i < dataStorage.courseStructure.modules.length; i += 1) {
					currentMod = dataStorage.courseStructure.modules[i];
					modules[i] = {
						name : currentMod.loname,
						id: currentMod.loid,
						hasTesting: currentMod.weight === 1 ? true : false,
						remainingAttempts: dataStorage.remainingPostAttempts(currentMod)
					};
					if (currentMod.pre) {
						modules[i].pre = {
							score: currentMod.pre.score,
							rawScore: currentMod.pre.points,
							maxScore: currentMod.pre.weight
						};
					}
					if (currentMod.post) {
						modules[i].post = {
							score: currentMod.post.score,
							attempts: currentMod.post.attempts,
							rawScore: currentMod.post.points,
							maxScore: currentMod.post.weight
						};
					}
				}
			}
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course modules retrieved", data : modules}]);
			return modules;
		},
		/**
		 * Returns the score for a course module
		 * @member contentApi
		 * @static
		 * @param {number} moduleID The ID of the module.  If omitted,
		 * the score for the current module is returned.
		 * @returns {number} The score for the module
		 */
		getModuleScore: function (moduleID) {
			var module = null;
			if(player.isSinglePage){
				if (moduleID === undefined || moduleID === null) {
					moduleID = dataStorage.currentModule.loid;
				}
				module = dataStorage.getModuleScore(moduleID);
			}
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Module by ID:" + moduleID + " retrived", data : module}]);
			return module;
		},
		/**
		 * Returns the number of modules in the course with attempted tests
		 * @member contentApi
		 * @static
		 * @returns {number} The number of modules in the course with attempted
		 * tests
		 */
		getModuleTestCompleteCount: function () {
			var ret = player.isSinglePage ? null :  dataStorage.modulesTestAttempted().length;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Module test completion count retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the number of modules in the course that have testing
		 * @member contentApi
		 * @static
		 * @returns {number} The number of modules in the course with testing
		 */
		getModuleTestCount: function () {
			var ret = player.isSinglePage ? null :  dataStorage.modulesWithTesting().length;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Module test count retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the ID of the current learning object
		 * @member contentApi
		 * @static
		 * @returns {number} The current learning object ID
		 */
		getObjectID: function () {
			var ret = player.isSinglePage ? null :  dataStorage.currentObject.objectid;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Current learning object ID retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the score needed to record a pass in the course
		 * @member contentApi
		 * @static
		 * @returns {number} The score needed to record a pass in the course
		 */
		getPassMark: function () {
			var ret = player.isSinglePage ? null :  dataStorage.passMark;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course passing mark retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the ID of the current page
		 * @member contentApi
		 * @static
		 * @returns {number} The ID of the current page
		 */
		getPageID: function () {
			var ret = player.isSinglePage ? player.settings.pageId :  dataStorage.currentPage.page.pageid;
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Current page ID retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Returns the current status for the course.  Will pull from LMS for a
		 * SCORM course
		 * @member contentApi
		 * @static
		 * @returns {string} One of 'passed'|'failed'|'complete'|'incomplete'
		 */
		getStatus: function () {
			var ret = null;
			if (scormAPI) {
				switch(scormAPI.GetStatus()) {
					case scormAPI.LESSON_STATUS_PASSED:
						ret = "passed";
					case scormAPI.LESSON_STATUS_COMPLETED:
						ret = "complete";
					case scormAPI.LESSON_STATUS_FAILED:
						ret = "failed";
					default:
						ret = "incomplete";
				}
			}
			else if(!player.isSinglePage) {
				ret = dataStorage.lessonStatus;
			}
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Course status retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Gets the name of the current student.  Will pull from LMS for a SCORM course, otherwise will prompt.
		 * This method is asynchronous with the possiblity of using a non-native prompt, therefor doesn't directly
		 * a value
		 * @member contentApi
		 * @static
		 * @param {Function} callback The function that will handle the name
		 * value.  It will accept a single argument, the name of the student.
		 */
		getStudentName: function (callback) {
			var name;
			var promptCallback = function (result, input) {
				if (result) {
					name = input;
				}
				else {
					name = "";
				}
				callback(name);
				$(document).trigger(events.called,[{"message" : "Content API called... </br> Student name entered", data : name}]);
			};
			if (scormAPI) {
				callback(scormAPI.GetStudentName());
				$(document).trigger(events.called,[{"message" : "Content API called... </br> Student name entered" , data : scormAPI.GetStudentName()}]);
			}
			else {
				DKI.prompt(strings.txtEnterName, promptCallback);
			}
		},
		/**
		 * Returns the ID of the current student
		 * @member contentApi
		 * @static
		 * @returns {String} The ID of the current student
		 */
		getUserID: function () {
			var ret = player.isSinglePage ? null : dataStorage.getUserID();
			$(document).trigger(events.called,[{"message" : "Content API called... </br> Current user ID retrieved", data : ret}]);
			return ret;
		},
		/**
		 * Hides the course player's 'back' button
		 * @member contentApi
		 * @static
		 */
		hideBack: function () {
			navigation.hideBackButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br> The preview button is disabled."}]);
		},
		/**
		 * Hides both navigation buttons, 'back' and 'forward'
		 * @member contentApi
		 * @static
		 */
		hideBoth: function () {
			navigation.hideBackButton();
			navigation.hideForwardButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br> Both navigation buttons are disabled."}]);
		},
		/**
		 * Hides the course player's 'forward' button
		 * @member contentApi
		 * @static
		 */
		hideForward: function () {
			navigation.hideForwardButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>The next button is disabled."}]);
		},
		/**
		 * Hides the transcript tab if currently shown
		 * @member contentApi
		 * @static
		 */
		hideTranscript: function () {
			if(!player.isSinglePage){
				player.hideTranscript();
			}
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>The transcript is hidden."}]);
		},
		/**
		 * Jumps to a given page
		 * @member contentApi
		 * @static
		 * @param {number} subeoID The ID of the page to jump to
		 */
		jumpToSubeo: function(subeoId){
			if (!player.inAssessment && !player.inReview && !player.isSinglePage) {
				player.jumpToSubeo(subeoId);
			}
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Jump to page triggered."}]);
		},
		/**
		 * @class contentApi.playerEvent
		 * @static
		 */
		playerEvent: {
			/**
			 * Subscribes to a named player event
			 * @member contentApi.playerEvent
			 * @static
			 * @param {string} name The name of the event to subscribe to
			 * @param {Function} handler The event handler function
			 */
			on: function (name, handler) {
				if(!player.isSinglePage){
					$(player).bind(name, handler);
				}
				$(document).trigger(events.called,[{"message" : "Content API called... Handler attached to player event", data : arguments}]);
			},
			/**
			 * Removes handler from a named player event
			 * @member contentApi.playerEvent
			 * @static
			 * @param {string} name The name of the event to remove handler from
			 * @param {Function} [handler='undefined'] If provided, this specific handler
			 * will be removed.  Otherwise, all handlers will be removed
			 */
			remove: function (name, handler) {
				if(!player.isSinglePage){
					$(player).unbind(name, handler);
				}
				$(document).trigger(events.called,[{"message" : "Content API called... Handler removed from player event", data :arguments}]);
			}
		},
		/**
		 * Prints the current content page
		 * @member contentApi
		 * @static
		 */
		printPage: function () {
			window.print();
			$(document).trigger(events.called,[{"message" : "Content API called... Print page called"}]);
		},
		/**
		 * Saves an arbitrary data value
		 * @member contentApi
		 * @static
		 * @param {string} label The used to save the value
		 * @param {Object} value The value to save
		 * @param {boolean} [preventStorage=false] Configures whether or not to store the value in SCORM suspend data.
		 */
		setData: function (label, value, preventStorage) {
			if(!player.isSinglePage){
				dataStorage.setContentVariable.apply(dataStorage, arguments);
			}
			$(document).trigger(events.called,[{"message" : "Content API called... Data set", data :arguments}]);
		},
		/**
		 * Sets the current learning object's status to complete
		 * @member contentApi
		 * @static
		 */
		setObjectCompleted: function () {
			if(!player.isSinglePage){
				player.setCurrentObjectComplete();
			}
			$(document).trigger(events.called,[{"message" : "Content API called... Current learning object set to complete"}]);
		},
		/**
		 * Executes the provided javascript
		 * @member contentApi
		 * @static
		 * @ignore
		 * @param {Object} config The config object.
		 * @param {String} config.js The javascript to be executed
		 */
		execJS: function (config) {
			try{
				eval(config.js);
			}catch(e){
				$(document).trigger(events.called,[{"message" : "exec JS Content API called... Error executing javascript: " + config.js, status : "warning"}]);
			}
			$(document).trigger(events.called,[{"message" : "Content API called... Javascript successfully executed.", data : config.js}]);		
		},
		/**
		 * Displays the course player's back button
		 * @member contentApi
		 * @static
		 */
		showBack: function () {
			player.navigation.showBackButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>The previous button is enabled."}]);
		},
		/**
		 * Displays the course player's navigation buttons
		 * @member contentApi
		 * @static
		 */
		showBoth: function () {
			player.navigation.showBackButton();
			player.navigation.showForwardButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>Both navigation buttons are enabled."}]);
		},
		/**
		 * Displays the course player's forward button
		 * @member contentApi
		 * @static
		 */
		showForward: function () {
			player.navigation.showForwardButton();
			$(document).trigger(events.called,[{"message" : "Player Control Action Triggered...</br>The next button is enabled."}]);
		},
		/**
		 * If the current module has testing, mark all learning complete and launch the test
		 * @member contentApi
		 * @static
		 * @returns {Null}
		*/
		takeTest: function () {
			if(!player.isSinglePage){
				if (player.inAssessment || player.inReview) {
					return;
				}
				var currentModule = dataStorage.currentModule;
				var moduleHasTest = dataStorage.moduleHasTest(currentModule);
				var testingEnabled =behaviour.enablePostTest;
				if (!testingEnabled) {
					$(document).trigger(events.called,[{"message" : "Content API function called... </br> " + strings.testingDisabled, status : "warning"}]);
					return null;
				}
				else if (!moduleHasTest) {
					$(document).trigger(events.called,[{"message" : "Content API function called... </br> " + strings.noModuleTesting, status : "warning"}]);
					return null;
				}
				else if (dataStorage.isMaxedOut(currentModule)) {
					$(document).trigger(events.called,[{"message" : "Content API function called... </br> " + strings.exceededTestAttempts, status : "warning"}]);
					return null;
				}
				dataStorage.markModuleComplete(currentModule);
				dataStorage.jumpToPage(dataStorage.getModuleEnd(currentModule));
				player.launchTest(currentModule.loid, "post");
				$(document).trigger(events.called,[{"message" : "Content API function called...</br>Jumped to current module testing"}]);
				return null;
			} else {
				$(document).trigger(events.called,[{"message" : "Content API function called...</br>Jumped to current module testing"}]);
			}
		},
		/**
		 * Toggles the visible state of the transcript tab
		 * @member contentApi
		 * @static
		 */
		toggleTranscript: function () {
			if(!player.isSinglePage){
				player.toggleTranscript();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The transcript is toggled"}]);
		},
		/**
		 * Shows the transcript tab
		 * @member contentApi
		 * @static
		 */
		showTranscript: function () {
			if(!player.isSinglePage){
				player.showTranscript();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The transcript is showing"}]);
		},
		/**
		 * Opens a url in a modal
		 * @member contentApi
		 * @static
		 * @param {string} url The url to open
		 * @param {Function} [callback=undefined] Called on the result of the url load
		 */
		openModal: function(url, callback){
			if(!player.isSinglePage) {
				DKI.Modal.show({url: url, callback: callback});
			} else {
				if ($("body").hasClass("phone")) {
					var newWin = window.open(url, "_blank");
				}
				else {
					$("#modalFrame").attr("src", url);
					$("#modalDisabler").css({
						"top": $("#headerContainer").height() + "px",
						"height": $("#contentFrame").height() + "px"
					});
					$("#modalDisabler").fadeIn();
				}
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The modal is showing"}]);
		},
		/**
		 * Shows the glossary browser
		 * @member contentApi
		 * @static
		 */
		showGlossaryBrowser: function(){
			if(!player.isSinglePage) {
				DKI.glossaryBrowse.show();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The glossary browser is showing"}]);
		},
		/**
		 * Hides the glossary browser
		 * @member contentApi
		 * @static
		 */
		hideGlossaryBrowser: function(){
			if(!player.isSinglePage) {
				DKI.glossaryBrowse.hide();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The glossary browser is hidden"}]);
		},
		/**
		 * Toggles visibility of the glossary browser
		 * @member contentApi
		 * @static
		 */
		toggleGlossaryBrowser: function(){
			if(!player.isSinglePage) {
				DKI.glossaryBrowse.toggle();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The glossary browser is toggled"}]);
		},
		/**
		 * Shows the resource browser
		 * @member contentApi
		 * @static
		 */
		showResourceBrowser: function(){
			if(!player.isSinglePage) {
				DKI.resourceBrowser.show();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The resource browser is showing"}]);
		},
		/**
		 * Hides the resource browser
		 * @member contentApi
		 * @static
		 */
		hideResourceBrowser: function(){
			if(!player.isSinglePage) {
				DKI.resourceBrowser.hide();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The resource browser is hidden"}]);
		},
		/**
		 * Toggles visibility of the resource browser
		 * @member contentApi
		 * @static
		 */
		toggleResourceBrowser: function(){
			if(!player.isSinglePage) {
				DKI.resourceBrowser.toggle();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The resource browser is toggled"}]);
		},
		/**
		 * Shows the Bibliography
		 * @member contentApi
		 * @static
		 */
		showBibliography: function(){
			if(!player.isSinglePage) {
				DKI.reference.showBibliography();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The bibliography is showing"}]);
		},
		/**
		 * Hides the Bibliography
		 * @member contentApi
		 * @static
		 */
		hideBibliography: function(){
			if(!player.isSinglePage) {
				DKI.reference.hideBibliography();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The bibliography is hidden"}]);
		},
		/**
		 * Toggles visibility of the Bibliography
		 * @member contentApi
		 * @static
		 */
		toggleBibliography: function(){
			if(!player.isSinglePage) {
				DKI.reference.toggleBibliography();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The bibliography is toggled"}]);
		},
		/**
		 * Shows the course search window
		 * @member contentApi
		 * @static
		 * @param {string} [term=undefined] The term to search for when opening the course search window. 
		 */
		showCourseSearch: function(term){
			if(!player.isSinglePage) {
			DKI.search.Window.show(term);
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The course search window is showing"}]);
		},
		/**
		 * Hides the course search UI
		 * @member contentApi
		 * @static
		 */
		hideCourseSearch: function(){
			if(!player.isSinglePage) {
				DKI.search.Window.hide();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The course search window is hidden"}]);
		},
		/**
		 * Toggles visibility of the course search UI
		 * @member contentApi
		 * @static
		 */
		toggleCourseSearch: function(){
			if(!player.isSinglePage) {
				DKI.search.Window.toggle();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The course search window is toggled"}]);
		},
		/**
		 * Searches the course using our lunr search manager
		 * @member contentApi
		 * @static
		 * @param {String} term The term to search against
		 * @param {Array} [exlude=Empty Array] An array list of indexes to skip over.
		 * @returns {Array}  empty, or filled with lunr-results
		 */
		 searchCourse  :function(term, exclude){
		 	var search = null;
		 	if(!player.isSinglePage){
		 		search = dataStorage.searchManager.search(term,exclude);
		 	}
		 	$(document).trigger(events.called,[{"message" : "Content API function called...</br>The course was searched for: " + term, data : {result : search, term : term, exclude : exclude}}]);
		 	return search;
		 },
		/**
		 * Shows the correct answers for the current question
		 * @member contentApi
		 * @static
		 */
		showCorrectAnswers: function(){
			player.contentPage.current.showCorrectAnswers();
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>Correct answers are showing"}]);
		},
		/**
		 * Starts another test question attempt
		 * @member contentApi
		 * @static
		 */
		tryAgain: function(){
			player.contentPage.current.tryAgain();
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>TAnother test question attempt has been started"}]);
		},
		/**
		 * Submits the current question
		 * @member contentApi
		 * @param {Number} [score=undefined] A number from 0-100. Anything under or over is defaulted to the limit, non numbers default to 0. Sets the score of the question on submit, only affects custom questions
		 * @static
		 */
		submitQuestion: function(score){
			if(player.inReview){
				// simply calling contentGoNext() requires that the page is not an assessment and not in review
				this.contentGoNext();
			}
			else if(player.contentPage.current.submitQuestion){
				player.contentPage.current.submitQuestion(score);
				$(document).trigger(events.called,[{"message" : "Content API function called...</br>The current question has been submitted"}]);
			}
			
		},
		/**
		 * Steps the current scene forward
		 * @member contentApi
		 * @static
		 */
		sceneStepForward: function(){
			player.contentPage.current.stepForward();
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The current scene has been stepped forward"}]);
		},
		/**
		 * Steps the current scene backwards
		 * @member contentApi
		 * @static
		 */
		sceneStepBack: function(){
			player.contentPage.current.stepBack();
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The current scene has been stepped back"}]);
		},
		/**
		 * resets the current page back to its initial state
		 * @member contentApi
		 * @static
		 */
		resetPage: function(){
			player.contentPage.current.reset();
			player.contentPage.current.start();
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The current page has been reset"}]);
		},
		/**
		 * Shows the menu
		 * @member contentApi
		 * @static
		 */
		showMenu: function(){
			if(!player.isSinglePage){
				player.showOutline();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The menu is showing"}]);
		},
		/**
		 * Hides the menu
		 * @member contentApi
		 * @static
		 */
		hideMenu: function(){
			if(!player.isSinglePage){
				player.hideOutline();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>TThe menu is hidden"}]);
		},
		/**
		 * Toggles visibility of menu in outline
		 * @member contentApi
		 * @static
		 */
		toggleMenu: function(){
			if(!player.isSinglePage){
				player.toggleOutline();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The menu is toggled"}]);
		},
		/**
		 * Exits the course
		 * @member contentApi
		 * @static
		 */
		exitCourse: function(){
			if(!player.isSinglePage){
				player.exitCourse();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The course exit has been triggered"}]);
		},
		/**
		* Scrolls the page to the position of a selected element
		* @member contentApi
		 * @static
		* @param {Object} config The configuration object on the jump
		* @param {string} config.elementId The ID of the element to jump to
		*/
		jumpToElement : function(config) {
			var wrapper = $("#" + config.elementId + "_wrapper");		
			var pos = wrapper.offset();
			if(pos.top < 200){
				if ($(document.body).hasClass("mobile")) {
					var header = $("#headerContainer");
					var positionStyle = header.css("position");
					$("#headerContainer").css("position", "relative");
					$("body, html, #contentFrame").scrollTop(0);
					$("#headerContainer").css("position", positionStyle);		
				}
				else if(this.settings.responsive){
					$("body, html, #contentFrame").scrollTop(0);
				}
			}
			else{
				wrapper[0].scrollIntoView();
			}
			var tabableContent =  wrapper.find("*[tabindex][tabindex!=\"-1\"]:first");
			if(tabableContent.length > 0){
				tabableContent[0].focus();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>Element has been jumped to", data: config}]);
		},
		/**
		 * Opens an external URL. Will pass in courseID, userID, objectID and pageID
		 * as either post body or URL paramemters, depending on the HTTP method
		 * @member contentApi
		 * @static
		 * @param {Object} config
		 * @param {string} [config.display=modal] The method used to display
		 * the URL, one of either 'modal' or 'window'.
		 * @param {string} [config.method=GET] The HTTP method, one of either
		 * 'GET' or 'POST'
		 * @param {string} config.url The URL to display
		 * @param {string} config.name Required if config.display is window, 
		 * the name of the new window to open
		 * @param {Function} config.callback If config.display == 'modal' and
		 * config.method == 'get', the function to handle the 'load' event of 
		 * the modal iframe
		 * @param {Object} config.parameters IF config.method == 'POST', additional
		 * parameters to post.
		 */
		launchURL: function (config) {
			if(!player.isSinglePage){
				var defaultConfig = {
					display: "modal",
					method: "GET"
				};
				DKI.applyIf(config, defaultConfig);
			    DKI.Modal.show(config);
			 }
			 $(document).trigger(events.called,[{"message" : "Content API function called...</br>URL has been launched", data: config}]);
		},
		/**
		 * Enables the menu button in the player
		 * @member contentApi
		 * @static
		 */
		enableMenuButton: function() {
			if(!player.isSinglePage){
				navigation.enableMenuButton();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>THe menu button is enabled"}]);
		},
		/**
		 * Disables the menu button in the player
		 * @member contentApi
		 * @static
		 */
		disableMenuButton: function() {
			if(!player.isSinglePage){
				navigation.disableMenuButton();
			}
			$(document).trigger(events.called,[{"message" : "Content API function called...</br>The menu is disabled"}]);
		},
		/**
		 * Shows a popup panel with the passed in content
		 * @member contentApi
		 * @static
		 */
		 showPopup: function(cfg){
		 	DKI.PopupPanel.show(cfg);
		 	$(document).trigger(events.called,[{"message" : "Content API function called...</br>A popup has been shown", data : cfg}]);
		 },
		 /**
		 * Gets the current assessment
		 * @static
		 * @member contentApi
		 * @returns null or an assessment object
		 */
		 getCurrentAssessment: function(){
		 	var ret = player.isSinglePage ? null : dataStorage.assessment;
		 	$(document).trigger(events.called,[{"message" : "Content API function called...</br>Current assessment has been retrieved", data : ret}]);
		 	return ret;
		 },
		  /**
		 * Gets the current assessment review status. True will only be returned if a test question is being reviewed (this does not include practice questions). All other page types will return false.
		 * @static
		 * @member contentApi
		 * @returns {Boolean} Whether or not an assessment is being reviewed.
		 */
		 inReview : function(){
		 	//If in review is undefined, we'll return false anyway.
		 	var ret = player.inReview ? true : false;
		 	$(document).trigger(events.called,[{"message" : "Content API function called...</br>In review status has been retrieved", data : ret}]);
		 	return ret;
		 },
		 /**
		 * Gets the title of a group by the given groupId. This will only return titles for groups on the current page
		 * @static
		 * @member contentApi
		 * @returns {String} The title of the group, if found. Otherwise this function returns undefined.
		 */
		 getGroupTitle : function(groupId){
		 	var ret = undefined;
		 	if(player.isSinglePage){
		 		var group = player.contentPage.getGroupById(groupId);
		 		ret = typeof group !== "undefined" ? group.title : ret;
		 	}else {
		 		var group = dataStorage.getGroup(groupId);
		 		ret = typeof group !== "undefined" ? group.title : ret;
		 	}
		 	$(document).trigger(events.called,[{"message" : "Content API function called...</br>Group title has been retrieved", data : ret}]);
		 	return ret;
		 },
		/**
		 * Zoom to the element passed in
		 * @member contentApi
		 * @static
		 * @param {string} id The ID of the element to zoom in to.
		 */
		zoomToElement: function(id, pageInstance, duration, callback){
			var duration = duration != undefined? duration:1000;
			var callback = callback != undefined? callback:function(){};
			var frame = $(".pageElementsWrapper.page", pageInstance.pageContainer);		
			var viewportHeight = $("html").height() - $("#headerContainer").height() - $("#footerContainer").height();
			if(frame.height() > viewportHeight){
				frame.height(viewportHeight);		
			}
			else{
				viewportHeight = frame.height();
			}
			var el = $("#" + id + "_wrapper", frame);
			var frameOff = frame.offset();
			var elOff = el.position();		
			var scaleX = frame.width() / el.data("width");
			var scaleY = viewportHeight / el.data("height");						
			var frameMidX = (frame.width()/2);
			var frameMidY = (frame.height()/2);
			var elMidX = (el.data("x")) + (el.data("width")/2);
			var elMidY = (el.data("y")) + (el.data("height")/2);
			var scale = scaleX > scaleY? scaleY: scaleX;
			var properties = {
				scale: scale,
				translateX: frameMidX - elMidX,
				translateY: frameMidY - elMidY
			};
			frame.velocity(properties, {duration:duration, complete: function(){				
				callback.call(this)
			}});		
		},
		zoomOut: function(pageInstance, duration, callback){
			var duration = duration != undefined? duration:1000;
			var callback = callback != undefined? callback:function(){};
			var frame = $(".pageElementsWrapper.page", pageInstance.pageContainer);					
			frame.velocity({scale:1,translateX:0,translateY:0}, {duration:duration, complete: function(){
				frame.css("height", "");
				callback.call(this);
			}});
		},
		/**
		 * Gets a jquery pointer to the elements' wrapper
		 * @member contentApi
		 * @static
		 * @param {string} id the if of the element to get
		 */
		 getElementWrapper: function(id){
		 	return $("#" + id + "_wrapper");
		 }	
	};
	for (var method in pub) {
		//We want to expost all the public methods on a DkiApi key for legacy reasons, but also
		//on the root of the contentApi object, because that makes more sense to work with
		if (pub.hasOwnProperty(method)) {
			returnObj[method] = pub[method];
			returnObj.DkiApi[method] = pub[method];
		}
	}
	/**
	 * collection of methods used to overcome LMS limitations. Generally not
	 * recommended to use, were implemented at the behest of a client
	 * @class contentApi.shLMS
	 * @static
	 * @private
	 */
	returnObj.shLMS = {
		/**
		 * Reset test attempts for a module
		 * @member contentApi.shLMS
		 * @static
		 * @param {number} attempts The number of attempts to set
		 * @param {number} [id] The Id of the module. If omitted, current module
		 * is used
		 */
		meth1: function (attempts, id) {
			var dataStorage = player.dataStorage;
			var currentModule = id ? dataStorage.findModule(id) : dataStorage.currentModule;
			if (currentModule.post) {
				currentModule.post.attempts = attempts;
			}

			if (dataStorage.saveCompletion) {
				dataStorage.saveCompletion();
			}
		}
	};
	return returnObj;
})();
