/* globals -DKI */
/* exported DKI */
var DKI;
if (!DKI) {DKI = {};}
/**
 * A module endscreen
 * @class
 * @singleton
 */
DKI.EndModule = function () {
	var player;
	var testOnly;
	var dataStorage;
	var behaviour;
	var currentModule;
	var moduleProgress;
	var strings;
	var state;
	var assessment;
	var testingLink;

	/**
	 * Initialize state
	 *
	 * Fires
	 *
	 * - DKI.EndModule.events#ready
	 *
	 * @param {DKI.PresentationPlayer} playerObj
	 * @param (DOM Element) container -optional param. Will render the endscreen if provided
	 */
	var init = function (playerObj, container) {
		player = playerObj;
		dataStorage = player.dataStorage;
		testOnly = player.course.testonly;
		behaviour = player.behaviour;
		strings = playerObj.strings;
		if (player.inAssessment || player.inReview) {
			assessment = dataStorage.assessment;
			state = dataStorage.assessment.prepost;
			currentModule = assessment.module;
		}
		else {
			state = "content";
			currentModule = dataStorage.currentModule;
			assessment = null;
		}
		if(container){
			render(container);
		}
		$(document).trigger(DKI.EndModule.events.ready);
	};
	/**
	 * Renders from template
	 *
	 * @param {DOM Element} container
	 */
	var render = function(container){
		var template =  Handlebars.compile(DKI.templates.endModule)({
			strings     : DKI.strings,
			module      : currentModule
		});
		$(container).html(template);
	};

	/**
	 * Start the endscreen
	 *
	 * Fires
	 *
	 * - DKI.ContentPage.events#resize
	 * - DKI.EndModule.events#started
	 */
	var start = function () {
		var pageContainer = player.pageFrames.current;
		var modulePassingScore = currentModule.passing_mark && currentModule.passing_mark != "" ? currentModule.passing_mark : player.course.passmark;
		var passStatus;
		var passStatusClass;
		var moduleScoreDetails;
		var statusContainer = $(".status", pageContainer);
		var revisitLink = $(".endMod_revisitLink", pageContainer);
		var reviewLink = $(".endMod_reviewLink", pageContainer);

		$(document).trigger(DKI.ContentPage.events.resize, player.settings.courseHeight);
		testingLink = $(".endMod_testingLink", pageContainer);
		reviewLink.css("display", "none");
		revisitLink.on(settings.clickEvent, function () {
			player.jumpToModule(currentModule);
		});
		moduleProgress = dataStorage.getModuleCompletion(currentModule);
		if (state === "content") {
			moduleScoreDetails = dataStorage.getModuleScoringDetails(currentModule);
		}
		else {
			moduleScoreDetails = {
				score: assessment.getScore(),
				points: assessment.getPoints(),
				weight: assessment.getWeight()
			};
		}
		if (!dataStorage.moduleHasTest(currentModule) || dataStorage.remainingPostAttempts(currentModule) == 0 || !behaviour.enablePostTest) {
			testingLink.css("display", "none");
		}
		else if (state !== "pre" && (dataStorage.remainingPostAttempts(currentModule) > 0)) {
			
			if (currentModule.post && currentModule.post.attempts > 0) {
				//Test has already been attempted
				testingLink.text(strings.retakeTest);				
			}
			testingLink.removeClass("disabled");
			testingLink.on(settings.clickEvent, function(){
				testingLink.off(settings.clickEvent);
				player.launchTest(currentModule.loid, "post");
			});
			
		}
		if (assessment && (
			(assessment.prepost == "pre" && behaviour.enablePreTestReview) ||
			(assessment.prepost == "post" && behaviour.enablePostTestReview)
		)) {
			reviewLink.on(settings.clickEvent, function () {
				player.launchReview(assessment);
			});
			reviewLink.css("display", "block");
		}
		
		$("#endMod_moduleName", pageContainer).text(currentModule.name);

		$(".endMod_learningLink", pageContainer).on(settings.clickEvent, function () {
			player.resume((state === "pre"));
		});
		if (testOnly) {
			$("#endMod_learningLine", pageContainer).css("display", "none");
			revisitLink.css("display", "none");
		}
		else {
			$("#endMod_learningStatus", pageContainer).text(Math.floor(moduleProgress) + "%");
		}
		if (!isNaN(parseInt(moduleScoreDetails.score, "10"))) {
			$("#endMod_testScore", pageContainer).text(Math.floor(moduleScoreDetails.score) + "%" +
				" (" + parseFloat(moduleScoreDetails.points, 10) + "/" + moduleScoreDetails.weight + " " + strings.txtPoints + ")");
			if (behaviour.displayPass && behaviour.passModules && moduleScoreDetails.weight > 0) {
				passStatus = moduleScoreDetails.score >= modulePassingScore ? strings.passText : strings.failText;
				passStatusClass = moduleScoreDetails.score >= modulePassingScore ? "pass" : "fail";
				statusContainer.addClass("showPassing");
				$(".endMod_passingScore", pageContainer).text(modulePassingScore + "%");
				$(".endMod_passStatus", pageContainer).text(" - " + passStatus + " - ").addClass(passStatusClass);
				$("#endMod_testScore", pageContainer).removeClass("dki-themeTextColor").addClass(passStatusClass);
			}
		}
		else {
			$("#endMod_testScore", pageContainer).text(strings.txtNotAvailableShort);
			$("#endMod_scoreLine", pageContainer).hide();
			$("#endMod_learningLine", pageContainer).addClass("dki-lineitem-last");
		}
		$(document).trigger(DKI.EndModule.events.started);

	};

	return {
		init: init,
		start: start
	};
}();

/**
 * @class
 * @static
 */
DKI.EndModule.events = {
	/**
	 * @event
	 * @static
	 * @member DKI.EndModule.events
	 */
	ready: "END_MODULE_READY",
	/**
	 * @event
	 * @static
	 * @member DKI.EndModule.events
	 */
	started:  "END_MODULE_STARTED"
};
