DKI.Assessment = $.Class({
	prototype: {
		/**
		 * Represents a test
		 * @class DKI.Assessment
		 * @constructor
		 * @param {Object} module The module the assesment belongs to
		 * @param {"pre"|"post"} prepost Whether this assessment is a pretest or 
		 * a posttest
		 * @param {Object} test The test, a collection of questions
		 */
		init: function(module, prepost, test) {
			/**
			 * @property
			 * The module the assessment belongs to
			 */
			this.module = module;
			/**
			 * @property {Object[]}
			 * The currently unanswered questions
			 */
			this.unanswered = test.questions.concat();			
			/**
			 * @property {Object[]}
			 * The currently answered questions
			 */
			this.answered = [];
			/**
			 * @property {"pre"|"post"}
			 */
			this.prepost = prepost;
			/**
			 * @property {Number}
			 * Position of current question in the test
			 */
			this.currentQuestionIndex = 0;
			/**
			 * @property {Object}
			 * The current question
			 */
			this.currentQuestion = this.unanswered[this.currentQuestionIndex];
			/**
			 * @property {Object}
			 * The next question to display
			 */
			this.nextQuestion = this.getNextQuestion();
			/**
			 * @property {Object}
			 * The previously displayed question
			 */
			this.previousQuestion = this.getPreviousQuestion();
			/**
			 * @property {Number}
			 * The number of question remaining
			 */
			this.totalQuestions = this.unanswered.length;
			this.currentQuestionCount = 1;
			/**
			 * @property {Number}
			 * The weight of this assessment in the overall course score
			 */
			this.totalWeight = 0;
			for (var i = 0; i < test.questions.length; i++) {
				this.totalWeight += parseInt(test.questions[i].weight, 10);
			} 
		},
		/**
		 * @returns {Number} The current score of the test, as a percentage
		 */
		getScore: function () {
			var score = 0;	
			if (this.answered.length > 0) {
				for (var i = 0; i < this.answered.length; i ++) {
					var weight = parseInt(this.answered[i].weight, 10);
					score += parseFloat(this.answered[i].score, 10) * weight;
				}
				if (score == 0 && this.totalWeight == 0) {
					score = 0;
				}
				else {
					score = score / this.totalWeight;
				}
			}			
			return Math.floor(score * 1000) / 1000;
		},
		/**
		 * @returns {Number} The current raw score
		 */
		getPoints: function(){
			var points = parseFloat(0, "10");
			if (this.answered.length > 0) {
				for (var i = 0; i < this.answered.length; i ++) {
					points += parseFloat(this.answered[i].points, "10");
				}				
			}			
			return parseFloat(points.toFixed(1), 10);
		},
		/**
		 * A getter for DKI.Assessment#totalWeight
		 * @returns {Number} The total weight
		 */
		getWeight: function () {			
			return this.totalWeight;
		},
		/**
		 * @returns {Object|null} The next question to display, or null
		 * if this is the last question
		 */
		getNextQuestion: function () {
			var nextIndex = this.currentQuestionIndex + 1;
			if (this.unanswered.length === 1) {
				//We are answering the last question.  Set next question to null, so player knows
				//to load endscreen next
				return null;
			}
			else if (nextIndex >= this.unanswered.length) {
				nextIndex = 0;
			}

			return this.unanswered[nextIndex];
		},
		/**
		 * Gets previously displayed unanswered question, or null.
		 * @returns {Object | null} The previously displayed unanswered question,
		 * or null if no unanswered questions remain
		 */
		getPreviousQuestion: function () {
			var previousIndex = this.currentQuestionIndex - 1;
			if (this.unanswered.length === 1) {
				//We are answering the last question.  Return null
				return  null;
			}
			else if (previousIndex < 0) {
				previousIndex = this.unanswered.length - 1;
			}

			return this.unanswered[previousIndex];
		},
		/**
		 * Gets The number of questions in the assessment
		 * @returns {numeric} The number of questions in the assessment
		 */
		getTotalQuestions: function () {
			return this.totalQuestions;
		},
		/**
		 * Go to the next unanswered question
		 */
		goNextQuestion: function () {
			if (this.currentQuestion !== null) {
				this.currentQuestionIndex ++;
			}
			if (this.currentQuestionIndex >= this.unanswered.length) {
				this.currentQuestionIndex = 0;
			}

			if (this.unanswered.length > 0) {
				this.currentQuestion = this.unanswered[this.currentQuestionIndex];
				this.nextQuestion = this.getNextQuestion();
				this.previousQuestion = this.getPreviousQuestion();
			}
			else {
				this.currentQuestion = null;
				this.nextQuestion = null;
				this.previousQuestion = null;
			}
		},
		/**
		 * Go to the previously unanswered question
		 */
		goPreviousQuestion: function () {
			if (this.currentQuestionIndex > 0) {
				this.currentQuestionIndex --;
			}
			else {
				this.currentQuestionIndex = this.unanswered.length - 1;
			}

			this.currentQuestion = this.unanswered[this.currentQuestionIndex];
			this.nextQuestion = this.getNextQuestion();
			this.previousQuestion = this.getPreviousQuestion();
		},
		/**
		 * Record a question score
		 * @param {Object} question The question from the course structure
		 * @param {Object} questionObject The question object the user interacted
		 * with, includes user choices.
		 * @param {Number} score The score the user obtained
		 */
		scoreQuestion: function (question, questionObject, score) {
			var questionPage;
			for (var i = 0; i < this.unanswered.length; i ++) {
				if (this.unanswered[i].id === question.id) {
					questionPage = this.unanswered[i].page;
					this.unanswered.splice(i, 1);
					var answeredQuestion = {
						choices: questionObject.options, 
						score: score, 
						body: questionObject.body,
						page: questionPage,
						points: parseFloat(parseFloat(score * question.weight / 100, 10).toFixed(1), 10)					
					};
					this.answered[this.answered.length] = DKI.applyIf(answeredQuestion, question);					
					this.currentQuestionIndex = i;
				}
			}
			if (this.unanswered.length > 0) {
				this.currentQuestionCount ++;
			}
			this.currentQuestion = null;
		}

	}
});
