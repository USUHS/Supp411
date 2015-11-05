DKI.SCORMAssessment = DKI.Assessment.extend({
	prototype: {
		/**
		 * Represents an assessment, uses scormAPI to transmit results to 
		 * an LMS
		 * @class DKI.SCORMAssessment
		 * @constructor
		 * @extends DKI.Assessment
		 * @param {Object} module The module the assessment belongs to
		 * @param {"pre"|"post"} prepost Whether this is a pretest or a posttest
		 * @param {Object} test The test object
		 * @param {Object} scormAPI The object providing SCORM API methds
		 */
		init: function(module, prepost, test, scormAPI) {
			this._parent(module, prepost, test);
			/**
			 * @property {Object}
			 */
			this.scormAPI = scormAPI;
		},
		/**
		 * Wrapper for SCORM API call. Used to evalute on a publishing profile
		 *
		 * @param {String} strShort The short identifier for the option, as defined by the SCORM API
		 * @param {String} strLong The long identifier for the option, as defined by the SCORM API
		 */
		createResponseIdentifier: function(strShort, strLong){
			/* We use encodeURIComponent because the string isn't a URI, by any means. It's just user entered data. 
			 * If we don't encode it, the High ASCII characters will be lost in the CreateResponseIdentifiers function.
			*/
			strLong = player.behaviour.supportHighASCII ? encodeURIComponent(strLong) : strLong;
			return this.scormAPI.CreateResponseIdentifier(strShort, strLong);
		},
		/**
		 * Overrides the parent method, records the question interaction
		 *
		 * See DKI.Assessment#scoreQuestion
		 */
		scoreQuestion: function (question, questionObject, score) {
			this._parent(question, questionObject, score);
			this.recordInteraction(question, questionObject, score);
		},
		/**
		 * Records a question result via SCORM API
		 * @param {Object} question The question from course structure
		 * @param {Object} questionObject The question user interacted with.
		 * @param {Number} score The score for the question.
		 */
		recordInteraction: function (question, questionObject, score) {
			questionObject.questionOptions = question.options;
			questionObject.id = question.id;
			questionObject.score = score;
			questionObject.weight = question.weight;
			switch(questionObject.type) {
				case 1:
					this.recordTrueFalse(questionObject);
					break;
				case 2:
					this.recordMultipleChoice(questionObject);
					break;
				case 3:
					this.recordFreeForm(questionObject);
					break;
				case 4: 
					this.recordFillBlanks(questionObject);
					break;
				case 5:
					this.recordPulldown(questionObject);
					break;
				case 6:
					this.recordDragDrop(questionObject);
					break;
			}
		},
		recordTrueFalse: function (questionObject) {
			var actualChoice = questionObject.options[0] == 1 ? true : false;
			var correctChoice = questionObject.questionOptions[0].parameters.correct;
			var isCorrect = questionObject.score == 100 ? true : false;

			this.scormAPI.RecordTrueFalseInteraction(
				questionObject.id,
				actualChoice,
				isCorrect,
				correctChoice,
				questionObject.body,
				questionObject.weight,
				questionObject.latency);

		},
		recordMultipleChoice: function (questionObject) {
			var letters = ["a", "b", "c", "d", "e", "f", "g", "h"];
			var actualChoice = [];
			var correctChoice = [];
			var isCorrect = questionObject.score == 100 ? true : false;
			for (var i = 0; i < questionObject.options.length; i ++) {
				if (questionObject.options[i].checked == 1) {
					actualChoice[actualChoice.length] = this.createResponseIdentifier(letters[i], questionObject.options[i].text);
				}
				if (questionObject.questionOptions[i].parameters.correct) {
					correctChoice[correctChoice.length] = this.createResponseIdentifier(letters[i], questionObject.options[i].text);
				}
			}
			this.scormAPI.RecordMultipleChoiceInteraction(
				questionObject.id,
				actualChoice,
				isCorrect,
				correctChoice,
				questionObject.body,
				questionObject.weight,
				questionObject.latency);
		},
		recordFillBlanks: function (questionObject) {
			var actualChoice = "";
			var correctChoice = "";
			var currentCorrectChoice;
			var isCorrect = questionObject.score == 100 ? true : false;
			var matchedChoice;
			for (var i = 0; i < questionObject.options.length; i ++) {
				actualChoice += questionObject.options[i];
				currentCorrectChoice = questionObject.questionOptions[i].parameters.correctValues;
				matchedChoice = currentCorrectChoice[0];
				for (var j = 0; j < currentCorrectChoice.length; j ++) {					
					var correctAnswer = $.trim(questionObject.options[i].toString().toLowerCase());
					var value = $.trim(currentCorrectChoice[j].toString().toLowerCase());			
					/* case 33076
					 * If some of the correct answers are numbers, they need to accept any form of valid number. 
					 * IE: if the correct answer is '1000', 
					 * the choice will be marked as correct if the learner enters '1000', '1,000', '1 000', '1000.00', or any combination of them.			 
					 */
					if($.isNumeric(correctAnswer)){
						//parsing float here for 1000.00 == 1000 support
						correctAnswer = parseFloat(correctAnswer);
						value = parseFloat(value.replace(/\,|\s/g, ""));				
					}
					if (value === correctAnswer) {
						matchedChoice = currentCorrectChoice[j];
						break;
					}
				}
				correctChoice += matchedChoice;
				if (i < questionObject.options.length - 1) {
					actualChoice += ",";
					correctChoice += ",";
				}
			}
			this.scormAPI.RecordFillInInteraction(
				questionObject.id,
				actualChoice,
				isCorrect,
				correctChoice,
				questionObject.body,
				questionObject.weight,
				questionObject.latency);
		},
		recordPulldown: function (questionObject) {
			var actualChoice = [];
			var correctChoice = [];
			var optionChoices = [];
			var isCorrect = questionObject.score == 100 ? true : false;
			for (var i = 0; i < questionObject.options.length; i ++) {
				optionChoices = [];
				optionChoices[0] = questionObject.questionOptions[i].parameters.correctValue;
				optionChoices = optionChoices.concat(questionObject.questionOptions[i].parameters.incorrectValues);				
				correctChoice[correctChoice.length] = this.createResponseIdentifier("1", optionChoices[0]);
				for (var j = 0; j < optionChoices.length; j ++) {
					if (questionObject.options[i].toString().toLowerCase() == optionChoices[j].toString().toLowerCase()) {
						actualChoice[actualChoice.length] = this.createResponseIdentifier((j + 1).toString(), questionObject.options[i].toString().toLowerCase());
					}
				}
			}
			this.scormAPI.RecordSequencingInteraction(
				questionObject.id,
				actualChoice,
				isCorrect,
				correctChoice,
				questionObject.body,
				questionObject.weight,
				questionObject.latency);

		},
		recordFreeForm: function (questionObject) {
			this.scormAPI.RecordFillInInteraction(
				questionObject.id,
				questionObject.options[0],
				this.scormAPI.INTERACTION_RESULT_NEUTRAL,
				questionObject.options[0],
				questionObject.body,
				questionObject.weight,
				questionObject.latency);

		},
		recordDragDrop: function (questionObject) {
			var actualChoices = [];
			var correctChoices = [];
			var optionChoices = [];
			var source = null;
			var target = null;
			var isCorrect = questionObject.score == 100 ? true : false;
			for (var i = 0; i < questionObject.options.length; i ++) {
				source = this.createResponseIdentifier((i + 1).toString(), questionObject.options[i].title);
				target = this.createResponseIdentifier((i + 1).toString(), questionObject.options[i].target.title);

				var choicesLength = actualChoices.length;
				actualChoices[choicesLength] = {};
				this.scormAPI.MatchingResponse.call(actualChoices[choicesLength], source, target);

				var found = false;
				var questionOption = null;
				for (var j = 0; j < questionObject.questionOptions.length; j++) {
					if(questionObject.questionOptions[j].element_id == questionObject.options[i].elementId){
						questionOption = questionObject.questionOptions[j];
					}
				}
				optionChoices = [];				
				optionChoices = optionChoices.concat(questionOption.parameters.correctTargets);
				if (optionChoices.length > 0) {
					for (var j = 0; j < optionChoices.length; j++) {												
						if (questionObject.options[i].target.id == optionChoices[j]) {

							var choicesLength = correctChoices.length;
							correctChoices[choicesLength] = {};
							this.scormAPI.MatchingResponse.call(correctChoices[choicesLength], source, target);
							found = true;
						}
					}
					if(!found){
						//the target it was dropped in is not in the correctTargets array...
						var defaultCorrectTarget = this.createResponseIdentifier((i + 1).toString(), optionChoices[0]);
						var choicesLength = correctChoices.length;
						correctChoices[choicesLength] = {};
						this.scormAPI.MatchingResponse.call(correctChoices[choicesLength], source, defaultCorrectTarget);
					}
				}
				else if (!questionObject.options[i].target.id){
					//if they didnt drop it anywhere and weren't supposed to, they're right.
					var choicesLength = correctChoices.length;
					correctChoices[choicesLength] = {};
					this.scormAPI.MatchingResponse.call(correctChoices[choicesLength], source, target);
				}
				else{
					//if they werent supposed to select and they did
					var nullTarget = this.createResponseIdentifier((i + 1).toString(), "No Target");
					var choicesLength = correctChoices.length;
					correctChoices[choicesLength] = {};
					this.scormAPI.MatchingResponse.call(correctChoices[choicesLength], source, nullTarget);
				}
			}
			this.scormAPI.RecordMatchingInteraction(
				questionObject.id,
				actualChoices,
				isCorrect,
				correctChoices,
				questionObject.body,
				questionObject.weight,
				questionObject.latency);

		}
	}
});
