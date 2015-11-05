/* global -DKI */
/*exported DKI */
var DKI;
if (!DKI){DKI = {};}
/**
 * @class
 * @singleton
 */
DKI.EndTest = function () {
	var course;
	var dataStorage;
	var details;
	var assessment;
	var moduleName;
	var behaviour;
	var strings;
	var pageContainer;
	var continueLink;
	var reviewLink;
	var revisitLink;
	var retakeLink;
	var player;

	/**
	 * Initialze the endscreen state
	 * 
	 * Fires
	 *
	 * - DKI.EndTest.events#ready
	 * @param {DKI.PresentationPlayer} playerObj
	 * @param {HTMLElement} pageContainer
	 */
	var init = function (playerObj, pageContainer) {
		course = playerObj.course;
		dataStorage = playerObj.dataStorage;
		assessment = dataStorage.assessment;
		behaviour = playerObj.behaviour;
		moduleName = assessment.module.name;
		pageContainer = pageContainer;
		player = playerObj;

		$("#endTest_moduleName", pageContainer).text(moduleName);

		continueLink = $("#endTest_learningLink", pageContainer).on(settings.clickEvent, function () {
			playerObj.resume();
		});
		reviewLink = $("#endTest_reviewLink", pageContainer).on(settings.clickEvent, function () {
			playerObj.launchReview(assessment);
		});
		revisitLink = $("#endTest_revisitLink", pageContainer).on(settings.clickEvent, function () {
			playerObj.jumpToModule(assessment.module);
		});
		retakeLink = $("#endTest_retakeTest", pageContainer).on(settings.clickEvent, function () {
			playerObj.launchTest(assessment.module, "post");
		});
		strings = playerObj.strings;
		$(document).trigger(DKI.EndTest.events.ready);
	};

	/**
	 * Starts the endscreen
	 *
	 * Fires
	 *
	 * - DKI.ContentPage.events#resize
	 * - DKI.EndTest.events#started
	 */
	var start = function () {
		var passStatus;
		var passStatusClass;
		var currentModule = assessment.module;
		var statusContainer = $(".status", pageContainer);
		var modulePassingScore = currentModule.passMark ? currentModule.passMark : player.course.passMark;
		$(document).trigger(DKI.ContentPage.events.resize, player.settings.courseHeight);
		if (course.testonly || assessment.prepost === "pre") {
			$("#endTest_revisitLink", pageContainer).css("display", "none");
		}
		if (assessment.prepost === "pre") {
			retakeLink.css("display", "none");
		}
		else if (dataStorage.remainingPostAttempts(assessment.module) === 0) {
			retakeLink.unbind().addClass("disabled");
		}
		details = dataStorage.getAssessmentScoringDetails();
		$("#endTest_testScore", pageContainer).text(Math.floor(details.score) + "%" +
			" (" + details.points + "/" + details.weight + " " + strings.txtPoints + ")");
		if ((assessment.prepost == "pre" && behaviour.enablePreTestReview) ||
				(assessment.prepost == "post" && behaviour.enablePostTestReview)) {

			$("#endTest_reviewLink", pageContainer).css("display", "");
		}
		if (behaviour.displayPass && behaviour.passModules) {
			passStatus = details.score >= modulePassingScore ? strings.passText : strings.failText;
			passStatusClass = details.score >= modulePassingScore ? "pass" : "fail";
			statusContainer.addClass("showPassing");
			$(".endMod_passingScore", pageContainer).text(modulePassingScore + "%");
			$(".endMod_passStatus", pageContainer).text(" - " + passStatus + " - ").addClass(passStatusClass);
			$("#endTest_testScore", pageContainer).removeClass("dki-themeTextColor").addClass(passStatusClass);
		}
		$(document).trigger(DKI.EndTest.events.started);
	};

	return {init: init, start: start};
}();

/**
 * @class
 * @static
 */
DKI.EndTest.events = {
	/**
	 * @event
	 * @static
	 * @member DKI.EndTest.events
	 */
	ready: "END_TEST_READY",
	/**
	 * @event
	 * @static
	 * @member DKI.EndTest.events
	 */
	started:  "END_TEST_STARTED"
};
