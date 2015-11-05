/* globals -DKI */
/* exported DKI */
var DKI;
if (!DKI){DKI={};}

/**
 * An course endscreen
 * @class
 * @singleton
 */
DKI.EndCourse = function () {
	var certificateLink;
	var certNotAvailable;
	var dataStorage;
	var behaviour;
	var currentModule;
	var courseScoringDetails;
	var courseCompletion;
	var course;
	var player;
	var remainingAttempts;
	var modsWithTest;
	var testingDisplay;
	var courseTestingDetails;
	var courseScoreValue;
	var coursePassingStatus;
	var testingList;
	var strings;
	var pageContainer;
	var coursePassingScoreLabel;
	var bibliographyLink;

	/**
	 * Set the endscreen state.
	 *
	 * Fires
	 *
	 * - DKI.EndCourse.events#ready
	 *
	 * @param {DKI.PresentationPlayer} playerObj
	 * @param {HTMLElement} pageEl
	 */
	var init = function (playerObj, pageEl) {
		dataStorage = playerObj.dataStorage;
		course = playerObj.course;
		behaviour = playerObj.behaviour;
		currentModule = dataStorage.currentModule;
		player = playerObj;
		strings = playerObj.strings;
		pageContainer = pageEl;
		if(pageEl){
			render(pageEl);
		}
		$(document).trigger(DKI.EndCourse.events.ready);
	};
	/**
	 * Renders from template
	 *
	 * @param {DOM Element} container t
	 */
	var render = function(container){
		var template =  Handlebars.compile(DKI.templates.endCourse)({
			strings       : DKI.strings,
			course        : course
		});
		$(container).html(template);
	};

	/**
	 * Starts the endscreen
	 *
	 * Fires
	 *
	 * - DKI.ContentPage.events#resize
	 * - DKI.EndCourse.events#started
	 *
	 */
	var start = function () {
		var statusText;
		var statusClass;
		$(document).trigger(DKI.ContentPage.events.resize, player.settings.courseHeight);
		bibliographyLink = $("#endCourse_bibliographyLink", pageContainer);
		certificateLink = $("#endCourse_certificateLink", pageContainer);
		certNotAvailable = $("#endCourse_certificateNotAvailable", pageContainer);
		testingDisplay = $("#endCourse_testing", pageContainer);
		endCourse_revisitLink = $(".endCourse_revisitLink",pageContainer); 
		
		testingList = $("ul", testingDisplay[0]);
		coursePassingScoreLabel = $("#endCourse_status .passing_score_label", pageContainer);
		courseScoringDetails = dataStorage.getCourseScoringDetails();
		courseCompletion = dataStorage.getCourseCompletion();
		remainingAttempts = dataStorage.remainingPostAttempts(currentModule);
		if (behaviour.displayPass && courseScoringDetails.weight > 0) {
			$(".passing_score_container", pageContainer).addClass("visible");
		}
		if (behaviour.enablePostTest) {
			modsWithTest = dataStorage.modulesWithTesting();
			if (modsWithTest.length > 1) {
				for (var i = 0; i < modsWithTest.length; i ++) {
					testingList.append(createModuleTestItem(modsWithTest[i], true));
					if (i === modsWithTest.length -1) {
						$("li:last-child", testingList).addClass("dki-lineitem-last");
					}
				}
			}
			else if(modsWithTest.length == 1){
				$(".passing_score_container").hide();
				$("#testingLine").append(createModuleTestItem(modsWithTest[0]), false);
				$("#endCourse_testing").hide();
				$("#endCourse_testingStatusLabel").hide();
				$("#endCourse_testingStatus").hide();
			}else if(modsWithTest.length === 0){
				endCourse_revisitLink.on(settings.clickEvent, function(){
					player.jumpToModule(player.course.modules[0].loid);
				});
				endCourse_revisitLink.css('display','block');	
			}
			
			$("li.moduleitem", pageContainer).delegate("span.actions a", settings.clickEvent, function () {
				player.launchTest($(this).attr("data-moduleid"), "post");
			});
		}
		else {
			testingDisplay.hide();
		}
		if(course.testonly){
			$("#endCourse_learningLine", pageContainer).hide();
		}

		dataStorage.checkCourseComplete();

		if (!isNaN(parseInt(courseCompletion, 10))) {
			$("#endCourse_learningStatus", pageContainer).text(Math.floor(courseCompletion) + "%");
		}
		else {
			$("#endCourse_learningLine", pageContainer).hide();
		}
		if (!isNaN(parseInt(courseScoringDetails.score, 10)) && dataStorage.hasTesting() && (behaviour.enablePreTest || behaviour.enablePostTest)) {
			courseTestingDetails = $("#endCourse_testingStatus", pageContainer);
			courseScoreValue = $("#course_score", courseTestingDetails);
			coursePassingStatus = $("#course_passing_status", pageContainer);
			courseScoreValue.text(Math.round(courseScoringDetails.score) + "%" + " (" + courseScoringDetails.points +
				"/" + courseScoringDetails.weight + " " + strings.txtPoints + ")");
			if (behaviour.displayPass && courseScoringDetails.weight > 0) {
				//We just want to display pass/fail status passed on current score vs. passing score, without
				//worrying about actual completion criteria
				courseTestingDetails.removeClass("dki-themeTextColor");
				if (dataStorage.lessonStatus === "passed") {
					courseTestingDetails.addClass("pass");
					statusText = strings.passText;
					if(course.passText !== ""){
						statusText = course.passText;
					}
					statusClass = "pass";
				}
				else if (!dataStorage.allTestsAttempted()) {
					courseTestingDetails.addClass("incomplete");
					statusText = strings.incompleteText;
					statusClass = "dki-themeTextColor";
				}
				else {
					courseTestingDetails.addClass("fail");
					statusText = strings.failText;
					if(course.failText !== ""){
						statusText = course.failText;
					}
					statusClass = "fail";
				}
				if (modsWithTest.length == 1) {
					statusText += " (" + $.trim($(".passing_score_container").text()) + ")";
				}
				coursePassingStatus.text(statusText).addClass(statusClass);
			}
			else {
				coursePassingStatus.css("display", "none");
			}
		}
		else {
			$("#endCourse_testingStatus", pageContainer).text("N/A");
			$("#endCourse_testing", pageContainer).hide();
			$("#testingLine", pageContainer).hide();
			$("#endCourse_learningLine", pageContainer).addClass("dki-lineitem-last");
		}

		if (behaviour.completionCertificate) {
			$(".endScreen", pageContainer).addClass("showCertificate");
		}
		if (behaviour.showBibliography && DKI.reference.courseHasReferences()) {
			$(".endScreen", pageContainer).addClass("showBibliography");
			bibliographyLink.on(player.settings.clickEvent, function() {
				DKI.reference.showBibliography();
			});
		}

		if (dataStorage.lessonStatus === "complete" || dataStorage.lessonStatus === "passed") {
			certificateLink.removeClass("disabled");
			certNotAvailable.css("display", "none");
			certificateLink.on(settings.clickEvent, function () {
				player.loadCertificate();
			});
		}
		
		$("#endCourse_testLink", pageContainer).on(settings.clickEvent, function () {
			this.contentFrame.attr("src", this.settings.endCourseURL);
			player.launchTest(currentModule.loid, "post");
		});
		$(document).trigger(DKI.EndCourse.events.started);
	};

	/**
	 * Creates & returns HTML element for displaying a module's test details
	 */
	var createModuleTestItem = function (module, includeTitle) {
		var modName = module.name;
		var modScoringDetails = dataStorage.getModuleScoringDetails(module);
		var modAttempts = dataStorage.remainingPostAttempts(module);
		var modID;
		var listItem;
		var modPassingScore;
		var createTitleItem = function () {	
			var modClass = "dki-modTitleLabel";
			if(!course.testonly){
				modClass += " mod-jump";
			}
			var titleItem = $("<span class='dki-modTitle'><a title='" + moduleStringText.revisitContentButton + "' class='" + modClass + "' tabindex='0'>" + modName + "</a></span>");
			if(!course.testonly){
				titleItem.on(settings.clickEvent, ".dki-modTitleLabel", function(){
					player.jumpToModule(module.loid);
				});
			}
			return titleItem[0];
		};
		var createScoreItem = function () {
			//Create/populate item holding the module score
			var scoreItem = document.createElement("span");
			var scoreValueItem = document.createElement("span");
			var modScoreDisplay = modScoringDetails.score === null ? " " + strings.txtNotAvailableShort : " " +
				Math.floor(modScoringDetails.score) +
				"%" + " (" + modScoringDetails.points + "/" + modScoringDetails.weight + " " + strings.txtPoints + ")";
			scoreItem.className = "dki-modScore";
			scoreItem.innerHTML = strings.txtScore;
			if (behaviour.displayPass && behaviour.passModules) {
				//We are requiring modules be passed, and are displaying passing details
				if (module.passMark) {
					modPassingScore = module.passMark;
				}
				else {
					modPassingScore = dataStorage.courseStructure.passMark;
				}
				if (modScoringDetails.score >= modPassingScore) {
					scoreValueItem.className = "pass";
				}
				else {
					scoreValueItem.className = "fail";
				}
			}
			else {
				scoreValueItem.className = "dki-themeTextColor";
			}
			scoreValueItem.innerHTML = modScoreDisplay;
			scoreItem.appendChild(scoreValueItem);

			return scoreItem;
		};

		var createAttemptItem = function () {
			var modAttemptDisplay;
			var attemptsItem = document.createElement("span");
			var attemptsValueItem = document.createElement("span");
			if(modScoringDetails.weight > 0 || modScoringDetails.weight === null){
				modAttemptDisplay = " " + modAttempts;
			}
			else{
				modAttemptDisplay = " N/A";
			}
			attemptsItem.className = "dki-modAttempts";
			attemptsItem.innerHTML = strings.txtRemainingAttempts;
			attemptsValueItem.className = "dki-themeTextColor";
			attemptsValueItem.innerHTML = modAttemptDisplay;
			attemptsItem.appendChild(attemptsValueItem);

			return attemptsItem;
		};

		var createActionsItem = function () {
			var actionsItem = document.createElement("span");
			var actionButton = document.createElement("a");
			actionsItem.className = "actions";
			actionButton.className = "dki-modBtn";			
			actionButton.setAttribute("data-moduleid", module.loid);
			actionButton.tabIndex="0";
			actionButton.role="button";
			//If the test has been taken, the module will have a pre or post object. 
			var actionHTML = module.pre || module.post  ? DKI.strings.endTest.retakeTestButton : strings.txtTakeTest;
			actionButton.innerHTML = actionHTML;
			actionsItem.appendChild(actionButton);

			return actionsItem;
		};

		var createTestDetailsItem = function () {
			var passingScore = module.passing_mark ? module.passing_mark : course.passmark;
			var detailsItem = document.createElement("div");
			var passingScoreLabel = document.createElement("span");
			var passingScoreValue = document.createElement("span");
			var passingStatus = document.createElement("span");
			detailsItem.className = "dki-modTestDetails";
			passingScoreLabel.innerHTML = coursePassingScoreLabel.text();
			passingScoreValue.innerHTML = " " + passingScore + "%";
			passingScoreValue.className = "dki-themeTextColor";
			if (modScoringDetails.score === null) {
				passingStatus.className = "dki-themeTextColor";
				passingStatus.innerHTML = strings.incompleteText;
			}
			else if (modScoringDetails.score >= passingScore) {
				passingStatus.className = "pass";
				passingStatus.innerHTML = strings.passText;
			}
			else {
				passingStatus.className = "fail";
				passingStatus.innerHTML = strings.failText;
			}
			passingStatus.className += " modulePassingStatus";
			detailsItem.appendChild(passingScoreLabel);
			detailsItem.appendChild(passingScoreValue);
			detailsItem.appendChild(passingStatus);

			return detailsItem;
		};

		modID = module.loid;
		listItem = document.createElement("li");
		listItem.className = "dki-lineitem moduleitem";
		if (includeTitle) {
			listItem.appendChild(createTitleItem());
		}
		listItem.appendChild(createScoreItem());
		if (behaviour.retestAttempts != "0") {
			listItem.appendChild(createAttemptItem());
		}
		if ((modAttempts != "0" && (modScoringDetails.weight > 0 || modScoringDetails.weight === null))) {
			listItem.appendChild(createActionsItem());
		}
		if (behaviour.displayPass && behaviour.passModules) {
			listItem.appendChild(createTestDetailsItem());
			listItem.className += " showPassing";
		}		
		return listItem;
	};

	return {init: init, start: start};
}();

/**
 * @class DKI.EndCourse.events
 * @static
 */
DKI.EndCourse.events = {
	/**
	 * @event
	 * @static
	 * @member DKI.EndCourse.events
	 */
	ready: "END_COURSE_READY",
	/**
	 * @event
	 * @static
	 * @member DKI.EndCourse.events
	 */
	started:  "END_COURSE_STARTED"
};
