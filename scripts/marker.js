/**
 * @class
 * @singleton
 */
DKI.Marker = {
	/**
	 * Scores question choices
	 * @param {Object} question The question to score
	 * @param {Mixed[]} choices The user's responses
	 * @return {Number} 
	 */
	scoreQuestion: function (question, choices, score) {
		var score = typeof score === "undefined" ? 0 : score;
		if (question.type == "1") {
			score = this.scoreTrueFalse(choices, question.options);
		}
		else if (question.type == "2") {
			score = this.scoreMultipleChoice(choices, question.options);
		}
		else if (question.type == "3") {
			score = this.scoreFreeForm(choices, question.options);
		}
		else if (question.type == "4") {
			score = this.scoreFillBlanks(choices, question.options);
		}
		else if (question.type == "5") {
			score = this.scoreMultiplePulldown(choices, question.options);
		}
		else if (question.type == "6") {
			score = this.scoreDragDrop(choices, question.options);
		}
		else if(question.type == "7"){
			score = this.scoreCustom(choices, question.options, score);
		}
		else{
			throw("Invalid question type: "  + question.type);
		}
		//partial scoring is off.
		if(((question.parameters.scoringType == 0 && !playerBehaviour.partialScoring) || question.parameters.scoringType == 2) && score < 100){
			score = 0;
		}

		return isNaN(score) ? 0 : score;
	},
	/**
	 * Scores a true/false question
	 * @param {Number[]} choices The users selection.
	 * @param {Object[]} options The correct options for the question
	 * @return {100|0}
	 * @private
	 */
	scoreTrueFalse: function (choices, options) {
		if (options[0].parameters.correct && choices[0] == 1) {
			return 100;
		}
		else if (options[1].parameters.correct && choices[1] == 1) {
			return 100;
		}
		else {
			return 0;
		}
	},
	/**
	 * Scores a multiple choice question
	 * @param {Object[]} choices The user's selections
	 * @param {Object[]} options The question's correct options
	 * @return {Number}
	 * @private
	 */
	scoreMultipleChoice: function (choices, options) {
		var totalScore = 0;
		var correctChoices = 0;
		var incorrectChoices = 0;
		for (var i = 0; i < options.length; i ++) {
			if (options[i].parameters.correct) {
				totalScore ++;
				if (choices[i] && choices[i].checked == 1) {
					correctChoices ++;
				}
			}
			else if (choices[i] && choices[i].checked == 1) {
				incorrectChoices ++;
			}
		}
		correctChoices -= incorrectChoices;
		if (correctChoices > 0) {
			return Math.round(correctChoices / totalScore * 100);
		}
		else {
			return 0;
		}
	},
	/**
	 * Scores a Fill in the blanks question
	 * @param {String[]} choices The user's selections
	 * @param {Object[]} options The question's correct options
	 * @return {Number}
	 * @private
	 */
	scoreFillBlanks: function (choices, options) {
		var acceptedAnswers;
		var correctAnswers = 0;
		var totalAnswers = 0;
		for (var i = 0; i < options.length; i ++){
			totalAnswers ++;
			acceptedAnswers = options[i].parameters.correctValues;
			for (var j = 0; j < acceptedAnswers.length; j ++) {				
				var correctAnswer = $.trim(acceptedAnswers[j].toString().toLowerCase());
				var value = $.trim(choices[i].toString().toLowerCase());			
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
					correctAnswers ++;
					break;
				}
			}
		}
		return Math.round(correctAnswers / totalAnswers * 100);
	},
	/**
	 * Scores a multiple pulldown question
	 * @param {String[]} choices The user's selections
	 * @param {Object[]} options The question's correct options
	 * @return {Number}
	 * @private
	 */
	scoreMultiplePulldown: function (choices, options) {
		var correctChoices = 0;
		var totalAnswers = 0;
		var correctAnswer;
		for (var i = 0; i < options.length; i ++) {			
			totalAnswers ++;	
			correctAnswer = options[i].parameters.correctValue;
			if (choices[i].toString().toLowerCase() === correctAnswer.toString().toLowerCase()) {
				correctChoices ++;
			}			
		}

		return Math.round(correctChoices / totalAnswers * 100); 
	},
	/**
	 * Scores a freeform question
	 * @return {0}
	 * @private
	 */
	scoreFreeForm: function () {
		return 0; 
	},
	/**
	 * Scores a drag/drop question
	 * @param {Object[]} choices The user's selections
	 * @param {Object[]} options The question's correct options
	 * @return {Number}
	 * @private
	 */
	scoreDragDrop: function(choices, options){
		if(choices.length == 0 && options.length == 0){
			return 0;
		}
		var correctChoices = 0;
		var totalAnswers = options.length;
		var correct = false;
		var option = null;
		for (var i = 0; i < choices.length; i ++) {
			correct = false;
			option = null;
			for (var k = 0; k < options.length; k++) {
				if(options[k].element_id == choices[i].elementId){
					option = options[k];
					break;
				}
			}
			for(var k = 0; k < option.parameters.correctTargets.length; k++){
				if(choices[i].target.id && choices[i].target.id.toString().toLowerCase() == option.parameters.correctTargets[k].toString().toLowerCase()){
					correct = true;
				}
			}
			if(!choices[i].target.id && option.parameters.correctTargets.length == 0){
				correct = true;
			}
			if (correct) {
				correctChoices ++;
			}			
		}
		return Math.round(correctChoices / totalAnswers * 100); 
	},
	/**
	 * Scores a custom question
	 * @param {Object[]} choices The user's selections
	 * @param {Object[]} options The question's correct options
	 * @param {Number} returns this value here. Because scoring done by whatever third party content that calls the content api for this question type, this functionalty is only here to keep workflow consistent
	 * @return {Number}
	 * @private
	 */
	scoreCustom: function(choices, options, score){
		//Because this is user input data, we need to validate it as an integer from 0-100. Defaults to 0
		try{
			if(isNaN(score)){
				throw 'Invalid data. Please provide a numeric score.';
			}else{
				score = parseInt(score,10);
				score = score < 0 ? 0 : score;
				score = score > 100 ? 100 : score;
				return score;
			}
		}catch(e){
			console.log(e);
			return 0;
		}
		return score;
	}
};
