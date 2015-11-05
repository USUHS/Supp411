var DKI;
if (!DKI) {
	DKI = {};
}

DKI.AssessmentReview = $.Class({
	init: function (assessment) {
		this.module = assessment.module;
		this.prepost = assessment.prepost;
		this.totalQuestions = assessment.answered.length + assessment.unanswered.length;
		this.questions = [];
		this.test = assessment;
		//We'll first present all answered questions, in the order they were recorded, followed by an unanswered.
		for (var i = 0; i < assessment.answered.length; i++) {
			var answeredQuestion = {
				id: assessment.answered[i].id, 
				pageid: assessment.answered[i].pageid,
				userChoices: assessment.answered[i].choices, 
				options: assessment.answered[i].options,
				score: parseFloat(assessment.answered[i].score, 10),
				page: assessment.answered[i].page,
				weight: assessment.answered[i].weight,
				points: parseFloat(assessment.answered[i].points, "10")			
			};
			this.questions[i] = DKI.applyIf(answeredQuestion, assessment.answered[i]); 
			
		}
		for (var i = 0; i < assessment.unanswered.length; i++) {
			var unansweredQuestion = {
				id: assessment.unanwered[i].id, 
				pageid: assessment.unanswered[i].pageid,
				userChoices: [], 
				correctChoices: assessment.unanswered[i].options,
				score: 0,
				page: assessment.unanswered[i].page,
				weight: assessment.answered[i].weight,
				points: 0
			};
			this.questions[this.questions.length] = DKI.applyIf(unansweredQuestion, assessment.unanswered[i]); 
		}
		this.currentQuestionIndex = 0;
		this.currentQuestionCount = 1;
		this.currentQuestion = this.questions[this.currentQuestionIndex];
		this.nextQuestion = this.getNextQuestion();
		this.previousQuestion = this.getPreviousQuestion();
	},

	getScore: function () {
		var score = 0;
		var weight = 0;
		for (var i = 0; i < this.questions.length; i ++) {
			score += parseFloat(this.questions[i].score, "10") * this.questions[i].weight;
			weight += parseInt(this.questions[i].weight, "10");
		}
		if (score == 0 && weight == 0) {
			return 0;
		}

		return Math.floor((score / weight) * 1000) / 1000;
	},

	getPoints: function(){
		var points = parseFloat(0, "10");
		for (var i = 0; i < this.questions.length; i ++) {
			points += parseFloat(this.questions[i].points, "10");
		}

		return parseFloat(points.toFixed(1), 10);
	},
	getWeight: function () {			
		return this.test.totalWeight;
	},

	goNextQuestion: function () {
		if (this.currentQuestionIndex < this.totalQuestions - 1) {
			this.currentQuestionIndex ++;
			this.currentQuestionCount ++;
			this.currentQuestion = this.questions[this.currentQuestionIndex];
			this.nextQuestion = this.getNextQuestion();
			this.previousQuestion = this.getPreviousQuestion();
		}

	},

	goPreviousQuestion: function () {
		if (this.currentQuestionIndex > 0) {
			this.currentQuestionIndex --;	
			this.currentQuestionCount --;
			this.currentQuestion = this.questions[this.currentQuestionIndex];
			this.nextQuestion = this.getNextQuestion();
			this.previousQuestion = this.getPreviousQuestion();
		}

	},

	getNextQuestion: function () {
		if (this.currentQuestionIndex < this.totalQuestions) {
			return this.questions[this.currentQuestionIndex + 1];
		}
		else {
			return null;
		}
	},

	getPreviousQuestion: function () {
		if (this.currentQuestionIndex > 0) {
			return this.questions[this.currentQuestionIndex - 1];
		}
		else {
			return null;
		}
	}
});
