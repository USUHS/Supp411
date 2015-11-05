var DKI;
if (!DKI) {
	DKI = {};
}
DKI.TestQuestion = function () {
	//Determine if this is a single page preview.  If so, question will be self-scoring.
	var isSinglePage = $(document.body).data("singlepage") ? true : false;	
	var isMobile = (screen.availWidth <= 480) || ($(document.body).width() <= 480) || (dkiUA.android);
	var Private = {
		closeFeedback: function (e) {
			e.stopPropagation();
			this.feedbackWrapper.addClass("hidden");
			return false;
		},
		submit: function (event, score) {	
			if(this.submitted){
				return null;
			}
			this.submitted = true;
			var options = this.getOptions();
			var i = 0;
			if (event) {
				event.preventDefault();
				event.stopPropagation();
			}
			
			if (Private.overMaxOptions.call(this)) {
				alert(this.strings.tstchoicesLabel1 + " " + this.maxSelections + " " + this.strings.tstchoicesLabel2);
				this.submitted = false;
				return false;
			}
			else if(!this.hasSelection.call(this)){
				if(!confirm(this.strings.confirmQuestionNoSelection)){
					this.submitted = false;
					return false;
				}
			}
			this.submitButton.unbind();
			var score = !score ? 0 : score;
			this.numAttempts ++;
			if (!isSinglePage && !this.isPracticeQuestion) {
				//This call is here to force correct/incorrect to be marked during full course preview.  Don't have time for a cleaner solution
				//Private.scorePreview.call(this);
				score = Private.scoreExport.call(this,score);
				$(document).trigger(DKI.TestQuestion.events.exportSubmitted);
			}
			else {
				score = Private.scorePreview.call(this,score);
				this.setScore(score);			
			}
			if(score == 100){
				$(this.pageContainer).trigger(DKI.TestQuestion.events.correct);
				if(this.numAttempts < this.question.attempts){
					$(this.pageContainer).trigger(DKI.TestQuestion.events.attemptSubmitted);
				}				
				this.numAttempts = this.question.attempts;
			}
			if(this.numAttempts == this.question.attempts){
				$(this.pageContainer).trigger(DKI.TestQuestion.events.submitted);
				if (score <= 0) {
					$(this.pageContainer).trigger(DKI.TestQuestion.events.incorrect);					
				}	
				else if (score < 100){
					$(this.pageContainer).trigger(DKI.TestQuestion.events.partiallyCorrect);
				}
			}
			else{
				$(this.pageContainer).trigger(DKI.TestQuestion.events.attemptSubmitted);
				if (score <= 0) {
					$(this.pageContainer).trigger(DKI.TestQuestion.events.attemptIncorrect);				
				}	
				else if (score < 100){
					$(this.pageContainer).trigger(DKI.TestQuestion.events.attemptPartiallyCorrect);
				}
			}
			return false;
		},
		overMaxOptions: function () {
			var tooManyChoices = false;
			var checkedCount = 0;
			
			if (this.questionType == 2 || this.questionType == 3) {
				var options = this.getOptions();	
				for (var i = 0; i < options.length; i ++) {
					if (options[i].value().checked == 1) {
						checkedCount ++;
					}
				}
				if (checkedCount > this.maxSelections) {
					tooManyChoices = true;
				}
			}

			return tooManyChoices;
		},
		atMaxOptions: function () {
			var atMax = false;
			var checkedCount = 0;
			
			if (this.questionType == 2 || this.questionType == 3) {
				var options = this.getOptions();	
				for (var i = 0; i < options.length; i ++) {
					if (options[i].value().checked == 1) {
						checkedCount ++;
					}
				}
				if (checkedCount == this.maxSelections) {
					atMax = true;
				}
			}

			return atMax;
		},
		positionSubmitButton: function(){
			this.submitButton.unbind();
			this.submitButton.find(".middle").text(this.strings.buttonLabelSubmit);
			
			var top = 0;
			var elementBottom = 0;
			var pageHeight = $(this.pageContainer).height() + $("#headerContainer").height();
			var left = 0;	
			var tabIndex = 0;
			//find the bottom most element	
			$(".dki-authoring-element", this.pageContainer).each(function(){
				var el = $(this);
				var bottom = parseInt(el.css("top").split("px")[0], 10) + el.height();
				if(bottom > elementBottom){
					elementBottom = bottom;
				}
				var elIndex = parseInt(el.find(".dki-element-anchor").attr("data-tabindex"), 10);
				if(elIndex > tabIndex){
					tabIndex = elIndex;
				}
			});	
			this.submitButton.attr("tabIndex", tabIndex);
			this.scoreDisplay.attr("tabIndex", tabIndex);
			if(this.settings.responsive){
				if(this.preview || !this.inReview){
					$(".pageElementsWrapper", this.pageContainer).css("padding-bottom", this.submitButton.height() + "px");
					this.submitButton.fadeIn(500);
					this.submitButton.bind(this.player.settings.clickEvent, $.proxy(Private.submit, this));	
				}
				else{
					$(".pageElementsWrapper", this.pageContainer).css("padding-bottom", this.scoreDisplay.height() + "px");
				}
				return null;
			}				

			//if there is no "bottom" defined, define it the one time.
			//This is to solve case 27904.. apparently as you adjust top, Firefox will retro in bottom.
			if(typeof this.submitButton.data("bottom") === 'undefined'){
				this.submitButton.data("bottom", parseInt(this.submitButton.css("bottom").split("px")[0]));				
			}
			
			elementBottom += this.submitButton.height();			
			if(elementBottom > pageHeight && !$(document.body).hasClass('online')){								
				if ($(document.body).hasClass('phone')) {
					//add the height of the submit button to the page so it has a spot thats not cutting off elements and not not being cut off by the page				
					var newHeight = $(this.pageContainer).height() + this.submitButton.height() + this.submitButton.data("bottom");
					$(this.pageContainer).height(newHeight);
					this.player.contentFrame.height(newHeight);
				}	
				top = elementBottom - this.submitButton.height() - this.submitButton.data("bottom");
			}
			else{
				top = pageHeight - this.submitButton.height() - this.submitButton.data("bottom");
			}			
			if ($(document.body).hasClass('phone')) {
				this.submitButton.width(($(this.pageContainer).width() * 0.9));
				this.scoreDisplay.width(($(this.pageContainer).width() * 0.9));
				left = ($(this.pageContainer).width() * 0.05) + "px";
			}
			else {
				left = "";
			}
			this.submitButton.css({
				position: "absolute",
				left: left,
				top: top + "px",
				right: "",
				margin: 0
			});			
			
			if(this.inReview && !this.question.disable_submit){ // the submit button will be shown, so move up to make room for it
				top -= this.scoreDisplay.height();
			}
			this.scoreDisplay.css({
				position: "absolute",
				left: left,
				top: top + "px",
				right: "",
				margin: 0
			});		

			if (this.preview || !this.inReview) {
				if ($(document.body).hasClass('phone')) {
					this.submitButton.show();
					this.submitButton.bind(this.player.settings.clickEvent, $.proxy(Private.submit, this));	
				}
				else{
					// delay showing the submit button until after the page has finished transitioning
					var that = this;
					setTimeout(
						function(){
							that.submitButton.fadeIn(500);
							that.submitButton.bind(that.player.settings.clickEvent, $.proxy(Private.submit, that));	
						}, 500
					);
				}				
			}
		},			
		scorePreview: function (score) {
			var options = this.getOptions();
			var fullScore = this.getCorrectCount();
			var correctChoices = 0;
			var incorrectChoices = 0;
			var optionScore = 0;
			var score = typeof score === "undefined" ? 0 : score;
			var optionValues = [];
			var displayCorrectAnswers = false;
			if((this.prePost == "pre" && this.behaviour.reviewPreAnswers) || (this.prePost == "post" && this.behaviour.reviewPostAnswers)){
				displayCorrectAnswers = true;
			}

			for (var i = 0; i < options.length; i ++) {
				optionScore = options[i].score();
				if (optionScore === 1) {
					correctChoices ++;
				}
				else if (optionScore === -1) {
					incorrectChoices ++;
				}
				optionValues[i] = options[i].value();				
				if (Private.showCorrectAnswers.call(this)) {					
					options[i].showCorrect(displayCorrectAnswers);
				}
			}
			score = this.calculate(fullScore, correctChoices, incorrectChoices, score);
			//Get all element wrappers for options marked correct, incorrect or multiChoiceCorrectResponse, and float to the top 
			if(!this.isPracticeQuestion && isSinglePage){
				//Single page previews for test questions use this to show their reviews
				$(this.pageContainer).trigger(DKI.TestQuestion.events.questionInReview);
			}
			$(".dki-authoring-element", this.pageContainer).has(".correct, .incorrect, .multiChoiceCorrect").css("zIndex", 100000);
			return score;
		},
		scoreExport: function (score) {
			var options = this.getOptions();
			var body = $(".questionBody", this.pageContainer);
			var submitObject = {
				type: this.questionType,
				body: body.text(),
				latency: new Date().getTime() - this.startTime,
				options: []
			};
			for (var i = 0; i < options.length; i ++) {
				submitObject.options[i] = options[i].value();
			}					
			var score = this.player.dataStorage.submitCurrentQuestion(submitObject,score);
			return score;			
		},
		showCorrectFeedback: function () {
			return Private.doShowFeedback.call(this, this.correctFeedback);
		},
		showIncorrectFeedback: function () {			
			return Private.doShowFeedback.call(this, this.incorrectFeedback);
		},
		showIncorrectAttemptFeedback: function () {
			return Private.doShowFeedback.call(this, this.incorrectAttemptFeedback);
		},
		showPartialFeedback: function () {
			return Private.doShowFeedback.call(this, this.partialFeedback);
		},
		showPartialAttemptFeedback: function () {
			return Private.doShowFeedback.call(this, this.partialAttemptFeedback);
		},
		doShowFeedback: function (feedbackElement) {	
			var optionFeedback = this.getOptionFeedback();
			var self = this;
			var showFeedback = function () {
				$(".questionFeedback", self.feedbackWrapper).hide();
				$(".optionFeedbackWrapper, .optionFeedbackSeparator", self.pageContainer).remove();
				if(optionFeedback != "" && feedbackElement.text() != ""){
					feedbackElement.append("<hr class='optionFeedbackSeparator' />");									
				}
				feedbackElement.append(optionFeedback);
				feedbackElement.css("display", "block");				
				//center the feedback element		
				var availableHeight = Math.min($(window).height(),$(self.pageContainer).height());
				//Themes were applying a margin-top to perfectly center the feedback panel. This was before the height was allowed to be fluid. We need to remove it now and allow min/maxes and js height positioning do the work
				self.feedbackWrapper.css({
					"top": Math.max(5, ((availableHeight - $(self.feedbackWrapper).outerHeight()) / 2) + $(window).scrollTop()) + "px",
					"margin-top" : "0px"
				});
				
				self.feedbackWrapper.removeClass("hidden");
				feedbackElement.focus();
			}
			if (Private.showFeedback.call(this) && (feedbackElement.text() != "" || optionFeedback != "")) {
				if (this.inReview) {
					setTimeout(function(){
						showFeedback();
					}, 500);
				}
				else {
					showFeedback();
				}				
				return true;
			}
			else if(!self.inReview && !self.isPracticeQuestion) {
				if ($(document.body).hasClass('mobile')) {										
					this.player.contentFrame.height($(this.pageContainer).height() - this.submitButton.height());
				}	
				$(document).trigger(DKI.TestQuestion.events.nextClicked);
			}
			return false;
		},		
		showFeedback: function() {
			if (!this.behaviour || this.preview) {
				return true;
			}
			else if (!this.inReview && (this.behaviour.displayQuestionFeedback || this.isPracticeQuestion)) {
				return true;
			}
			else if (this.inReview) {
				if (this.prePost == "pre" && this.behaviour.reviewPreFeedback) {
					return true;
				}
				else if (this.prePost == "post" && this.behaviour.reviewPostFeedback) {
					return true;
				}
				else {
					return false;
				}
			}
			else {
				return false;
			}
		},
		showCorrectAnswers: function () {
			if (!this.isPracticeQuestion && (!this.behaviour || this.preview)) {
				return true;
			}
			else if (this.inReview) {
				return true;
			}
			else {
				//If behaviour is defined and we are not in a review, this is a recorded assessment.  We do not want to show the correct answers.
				return false;
			}
		}
	};
	var Public = {
		setPrePost: function (prePost) {
			if (prePost) {
				this.prePost = prePost;
			}
			else {
				this.prePost = "post";
			}
		},
		setScore: function (score, points, weight) {
			if (score !== undefined && score !== null) {
				score = parseFloat(score, 10);
			}
			//Workaround for a bug in jQuery 1.6.1.  When a custom event is fired and the data payload is the integer 0, data becomes undefined.
			else {
				score = 0;
			}			
			var atMaxAttempts = this.numAttempts == this.question.attempts;			
			var that = this;
			var feedbackShown = false;
			//Custom questions never show feedback
			if(this.questionType !== 7){
				if (score <= 0) {				
					if (atMaxAttempts) {
						feedbackShown = Private.showIncorrectFeedback.call(this);					
					}
					else{
						feedbackShown = Private.showIncorrectAttemptFeedback.call(this);
					}
				}
				else if (score === 100) {				
					feedbackShown = Private.showCorrectFeedback.call(this);												
				}
				else {					
					if (atMaxAttempts) {
						feedbackShown = Private.showPartialFeedback.call(this);				
					}
					else{
						feedbackShown = Private.showPartialAttemptFeedback.call(this);
					}				
				}
				if (feedbackShown) {
					$(document).trigger(DKI.TestQuestion.events.feedbackShown);
				}
			}else {
				//Trick the player into thinking the feedback has been dealt with. This will force page advancement
				feedbackShown = true;
			}
			
			//case 31905: disable the options on submit.
			var options = this.getOptions(); 
			for (var i = 0; i < options.length; i ++) {
				options[i].enabled(false);
			}		
			if (this.inReview) {
				$(".questionScore").text(points + "/" + weight + " " + this.strings.txtPoints);
				if ($(document.body).hasClass('phone')) {
					this.scoreDisplay.show();
				}
				else{
					this.scoreDisplay.fadeIn(200);
				}
			}
			else if(feedbackShown || this.isPracticeQuestion){					
				//changed for bug 48439,"Disable try again" on practice questions doesn't allow the submit button to change to Next
				if (this.numAttempts < this.question.attempts && score < 100 && this.question.show_try_again) {
					
					this.submitButton.find(".middle").text(this.strings.testTryAgain);
					this.submitButton.bind(this.player.settings.clickEvent, $.proxy(function(e){
						this.submitButton.unbind(e);
						this.tryAgain();
					}, this));
										
				}
				else { 
					this.submitButton.find(".middle").text(this.strings.buttonLabelNext);
					this.submitButton.bind(this.player.settings.clickEvent, $.proxy(function(e){
						this.submitButton.unbind(e);
						this.submitButton.hide();
						if ($(document.body).hasClass('mobile')) {
							this.player.contentFrame.height($(this.pageContainer).height() - this.submitButton.height());
						}
						e.preventDefault();
						e.stopPropagation();
						$(document).trigger(DKI.TestQuestion.events.nextClicked);
					}, this));
					if(this.questionType == 7){
						this.submitButton.trigger(this.player.settings.clickEvent);					 
					}
				}
			}
		},
		setOptions: function (userChoices, questionOptions) {
			var options = this.getOptions(); 
			for (var i = 0; i < options.length; i ++) {
				options[i].value(userChoices[i]);
				options[i].enabled(false);
				options[i].correctResponse(questionOptions[i]);
			}
			if(this.questionType == 2){
				$(".dki-multiChoiceOption-element .multiChoiceContentWrapper").css("visibility", "visible");
			}
		},
		showReview: function (prePost, userChoices, questionOptions, question) {
			this.inReview = true;
			this.numAttempts = this.question.attempts;
			this.setPrePost(prePost);
			this.setOptions(userChoices, questionOptions);
			//Call to highlight correct/incorrect
			var args = this.questionType == 7 ? [question.score] : [];
			Private.scorePreview.apply(this,args);
			this.setScore(question.score, question.points, question.weight);
			$(this.pageContainer).trigger(DKI.TestQuestion.events.questionInReview);
			if(!this.question.disable_submit  && !this.settings.responsive){
				//Custom Questions NEVER show the submit button
				if(this.questionType != 7){
					if ($(document.body).hasClass('phone')) {
						this.submitButton.show();
					}
					else{
						this.submitButton.fadeIn(500);
					}
				}		

				this.submitButton.find(".middle").text(this.strings.buttonLabelNext);
				this.submitButton.bind(this.player.settings.clickEvent, $.proxy(function(e){
					this.submitButton.unbind(e);
					this.submitButton.hide();
					if ($(document.body).hasClass('mobile')) {
						this.player.contentFrame.height($(this.pageContainer).height() - this.submitButton.height());
					}
					e.preventDefault();
					e.stopPropagation();
					$(document).trigger(DKI.TestQuestion.events.nextClicked);
				}, this));
			}

		},
		showCorrectAnswers: function(){
			var options = this.getOptions();
			for(var i = 0; i < options.length; i++){
				options[i].showCorrect(true);
			}
		},
		tryAgain: function(){
			this.reset({
				doNotResetAttempts: true
			});
			this.start();
		},
		submitQuestion: function(score){
			Private.submit.call(this,null,score);
		},
		start: function () {
			var that = this;
			this.page.resize(); // page.start() will trigger a resize, but it works in a setTimeout so it may happen too late for anything in the test setup that relies on the size (positionSubmitButton, for example)
			this.page.start();
			this.startOptions();
			if (!this.question.disable_submit && this.question.type != 7) {
				Private.positionSubmitButton.call(this);
			}				
			//set up D&D
			if(this.questionType == 6){
				$(".dki-authoring-element[data-is-draggable=true][data-isquestionelement=true]", this.pageContainer).draggable({					
					revert: function (dropTarget) {
						$(this).data("draggable").originalPosition = {
			                top: $(this).data("y"),
			                left: $(this).data("x")
			            };			            
						//if it is not dropped in a valid drop target
						if(!dropTarget){
							$(this).css("z-index", $(this).data("elementno"));							
							$(this).data("reverted", true);
							$(this).trigger(DKI.ContentPage.events.elementDragReverted);
							return true;
						}
						else{
							$(this).trigger(DKI.ContentPage.events.elementDragDropped);
						}
			            	            
			        },
					start: function(event, ui){							
						$(this).parent().css("position", "static");
						$(this).data("reverted", false);
						var dragTitle = $(this).data("title");
						if(dragTitle == ""){
							dragTitle = $(this).text();
						}
						$(this).data("dropData", {
							id: $(this).data("dragdropid"),
							elementId: $(this).data("id"),
							title:  dragTitle,
							target: {
								id: null,
								title: "No Target"
							},
							x: $(this).data("x"),
							y: $(this).data("y")
						});
						$(this).trigger(DKI.ContentPage.events.elementDragStarted);
						$(document).trigger(DKI.TestQuestion.events.dragStarted);
					},
					stop: function(event, ui){
						if ($(this).data("reverted")) {
							$(this).css("z-index", $(this).data("elementno"));
						}
						else{
							$(this).css("z-index", 100000);
						}
						$(this).trigger(DKI.ContentPage.events.elementDragStopped);
						$(document).trigger(DKI.TestQuestion.events.dragStopped);
					},
					stack: ".dkiContentFrame.current .dki-authoring-element[data-is-droppable=true][data-isquestionelement=true]",
					zIndex: 100000,
					disabled: false,
					containment: "#contentFrame"			
				});
				$(".dki-authoring-element[data-is-droppable=true][data-isquestionelement=true]", this.pageContainer).droppable({
					accept: ".dkiContentFrame.current .dki-authoring-element[data-is-draggable=true][data-isquestionelement=true]",
					tolerance: "pointer",	
					out: function(event, ui){
						$(this).trigger(DKI.ContentPage.events.elementDropOut);
					},
					over: function(event, ui){
						$(this).trigger(DKI.ContentPage.events.elementDropOver);
					},
					drop: function(event, ui){
						var dragTitle =ui.draggable.data("title");
						if(dragTitle == ""){
							dragTitle = ui.draggable.text();
						}
						var dropTitle = $(this).data("title");
						if(dropTitle == ""){
							dropTitle = $(this).text();
						}						
						var position = null;						
						if(that.question.parameters.snapToCenter && that.question.parameters.snapToCenter.toString() == "true"){
							var offset = $(this).position();
							var top = ((offset.top + ($(this).height() / 2)) - ui.draggable.height() / 2);
							var left = ((offset.left + ($(this).width() / 2)) - ui.draggable.width() / 2);
							ui.draggable.animate({
								"top": top + "px",
								"left": left + "px"
							}, 125);
							position = {
								top: top,
								left: left
							};
						}
						else{
							position = ui.draggable.position();	
						}
						
						ui.draggable.data("dropData", {
							id: ui.draggable.data("dragdropid"),
							elementId: ui.draggable.data("id"),
							title: dragTitle,
							target: {
								id: $(this).data("dragdropid"),
								title: dropTitle
							},
							x: position.left,
							y: position.top
						});
						$(this).trigger(DKI.ContentPage.events.elementDropDropped);
					},
					disabled: false
				});
			}					
		},
		reset: function (cfg) {
			cfg = DKI.applyIf(cfg, {
				doNotResetAttempts: false,
				timeout: 0			
			});
			var self = this;
			self.submitButton.hide();
			self.submitButton.unbind();
			var resetFn = function(){
				self.submitted = false;				
				self.feedbackWrapper.addClass("hidden");
				self.feedbackWrapper.css("width", "");
				$(".questionFeedback", self.pageContainer).hide();
				$(".optionFeedbackWrapper", self.pageContainer).remove();			
				if (!cfg.doNotResetAttempts) {
					self.numAttempts = 0;
				}
				cfg.timeout = 0;
				self.page.reset(cfg);
				self.resetOptions();			
				if(self.questionType == 6){
					$(".dki-authoring-element[data-is-draggable=true][data-isquestionelement=true]", self.pageContainer).draggable("option", "disabled", true);
					$(".dki-authoring-element[data-is-droppable=true][data-isquestionelement=true]", self.pageContainer).droppable("option", "disabled", true);
				}
			}
			if(cfg.timeout > 0){
				setTimeout(resetFn, cfg.timeout);		
			}
			else{
				resetFn();
			}
		},
		startOptions: function(){
			var options = this.getOptions();
			for(var i = 0; i < options.length; i++){
				options[i].start();		
			}
		},
		resetOptions: function(){
			var options = this.getOptions();
			for(var i = 0; i < options.length; i++){
				options[i].reset();		
			}
			if(this.question.type == 2){
				this.randomizeOptions();
			}
		},
		onWindowResize: function(){
			this.page.onWindowResize();
		}
	};
	var component = function (playerObj, contentPage, question, isPracticeQuestion) {		
		//This function will apply the 'checked' CSS class to a given input's label, based on it's 'checked' status
		var checkInput = function (input) {
			var label = $("label[for='" + input.attr("id") + "']", contentPage.pageContainer);
			//For radio inputs, need to remove 'checked' class for all inputs
			$(".content input[type='radio']", contentPage.pageContainer).each(function (index, element) {
				$("label[for='" + element.id + "']").removeClass("checked");
				if(element.id != input.attr("id")){
					$(element).prop("checked", false);
				}
			});
			if (input.prop("checked")) {
				label.addClass("checked");
			}
			else {
				label.removeClass("checked");
			}
		};
		this.question = question;
		this.player = playerObj;			
		this.strings = playerObj.strings;
		this.page = contentPage;
		this.behaviour = this.player.behaviour;
		this.inReview = this.player.inReview;
		this.settings = this.player.settings;
		this.submitted = false;
		this.prePost = "";
		this.pageContainer = this.page.pageContainer;
		this.questionElement = $("div[data-pagetype='question']", this.pageContainer);
		this.questionType = parseInt(this.questionElement.attr("data-questiontype"), 10);
		this.startTime = new Date().getTime();
		this.submitButton = $(".submitButton");		
		this.scoreDisplay = $(".questionScoreDisplay");
		this.feedbackWrapper = $(".feedbackWrapper", this.pageContainer);
		this.feedbackWrapper.find(".feedbackClose").attr("title", playerStrings.buttonLabelClose);
		this.correctFeedback = $(".correctFeedback", this.pageContainer);
		this.incorrectFeedback = $(".incorrectFeedback", this.pageContainer);
		this.partialFeedback = $(".partialFeedback", this.pageContainer);
		this.partialAttemptFeedback = $(".partialAttemptFeedback", this.pageContainer);
		this.incorrectAttemptFeedback = $(".incorrectAttemptFeedback", this.pageContainer);			
		this.maxSelections = parseInt(this.questionElement.attr("data-max-selections"), 10);
		this.freeFormMaxLength = 4000;
		this.numAttempts = 0;
		this.isPracticeQuestion = isPracticeQuestion;				
		//if were using scorm 1.2, the maximum is 255.
		if (typeof scormAPI !== 'undefined' && scormAPI.strLMSStandard == "SCORM") {
			this.freeFormMaxLength = 255;
		}
		$(".feedbackClose", this.pageContainer).bind(this.player.settings.clickEvent, $.proxy(Private.closeFeedback, this));

		this.feedbackWrapper.draggable({
			containment: "#contentFrame",
			handle: ".feedbackHeader"
		});

			
		switch (this.questionType) {
			case 1:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.TrueFalseQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.TrueFalseQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.TrueFalseQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.TrueFalseQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.TrueFalseQuestion.calculate, this);	
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.TrueFalseQuestion.getOptionFeedback, this);
				$(".trueOption_label", this.pageContainer).text(this.strings.trueOptionLabel);
				$(".falseOption_label", this.pageContainer).text(this.strings.falseOptionLabel);
				break;
			case 2:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.getOptionFeedback, this);
				this.randomizeOptions = $.proxy(DKI.TestQuestion.MultipleChoiceQuestion.randomizeOptions, this);
				if (!this.inReview) {
					this.randomizeOptions();
				}
				break;
			case 3:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.FreeFormQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.FreeFormQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.FreeFormQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.FreeFormQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.FreeFormQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.FreeFormQuestion.getOptionFeedback, this);
				break;
			case 4:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.FillBlanksQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.FillBlanksQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.FillBlanksQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.FillBlanksQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.FillBlanksQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.FillBlanksQuestion.getOptionFeedback, this);
				break;
			case 5:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.MultiplePulldownQuestion.getOptionFeedback, this);				
				//Added below for case 28831 - we need to randomize the options each view, not just in the services			
				$(".dki-multiPulldownOption-element select", this.pageContainer).each(function(){
					var getRandomOptions = function(options){
						var randomOptions = options;
						var i = randomOptions.length;										
						while (i--){
							var j = Math.floor( Math.random() * ( i + 1 ) );
							var tempI = randomOptions[i];
							var tempJ = randomOptions[j];
							randomOptions[i] = tempJ;
							randomOptions[j] = tempI;
						}
						return randomOptions;
					}
					var newOptions = [];
					for(var i = this.options.length - 1; i >= 0; i--){
						if ($(this.options[i]).html() != "") {
							newOptions.push(this.options[i]);							
						}
						this.remove(i);
					}
					var newOptions = getRandomOptions(newOptions);
					this.innerHTML = "";
					
					if(dkiUA.ie && dkiUA.ieVersion <= 8){
						this.add(new Option("", ""));
						for(var i = 0; i < newOptions.length; i++){
							this.add(newOptions[i], i+1);
						}
					}
					else{
						this.add(new Option("", ""), null);
						for(var i = 0; i < newOptions.length; i++){
							this.add(newOptions[i], null);
						}
					}
					this.selectedIndex = 0;
				});
				break;
			case 6:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.DragDropQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.DragDropQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.DragDropQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.DragDropQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.DragDropQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.DragDropQuestion.getOptionFeedback, this);
				break;
			case 7:
				this.getCorrectCount = $.proxy(DKI.TestQuestion.customQuestion.getCorrectCount, this);
				this.getOptions = $.proxy(DKI.TestQuestion.customQuestion.getOptions, this);
				this.hasSelection = $.proxy(DKI.TestQuestion.customQuestion.hasSelection, this);
				this.scoreOption = $.proxy(DKI.TestQuestion.customQuestion.scoreOption, this);
				this.calculate = $.proxy(DKI.TestQuestion.customQuestion.calculate, this);
				this.getOptionFeedback = $.proxy(DKI.TestQuestion.customQuestion.getOptionFeedback, this);
		}

		this.player.questionPage = this;		
		
		// Creates a delegate that allows the whole question option element to be touched
		var that = this;
		$(this.pageContainer).on(
			this.settings.clickEvent, 
			".dki-trueFalse-selector, .dki-multiChoice-selector, .dki-multiChoiceOption-element .dki-element-anchor, .dki-trueFalseOption-element .dki-element-anchor, .dki-multiChoiceOption-element input, .dki-trueFalseOption-element input", 
			function(e){				
				var input = $(this).parent().find("input");					
				if(input.prop("disabled")){
					e.stopPropagation();
					e.preventDefault();
					return false;
				}														
				var label = $("label[for='" + input.attr("id") + "']", that.pageContainer);		
				if(!label.hasClass("checked")){
					if (Private.atMaxOptions.call(that) && input.attr("type") != "radio") {
						alert(that.strings.tstchoicesLabel1 + " " + that.maxSelections + " " + that.strings.tstchoicesLabel2);
						e.stopPropagation();
						e.preventDefault();
						return false;
					}
				}
				if (!input.prop("checked")) {
					input.prop("checked", "true");
				}
				else if (input.attr("type") == "checkbox") {
					input.prop("checked", false);
				}
				checkInput(input);
				if(input.attr("type") == "checkbox" && input[0] == e.target){
					return false;
				}
			}
		);
	
		$(".dki-freeFormOption-element textarea").attr("maxlength", this.freeFormMaxLength);
		$(this.pageContainer).on(
			"keyup", 
			".dki-freeFormOption-element textarea", 
			function(e){
				var text = $(this).val();
				var chars = text.length;
				if (chars > that.freeFormMaxLength) {
					var newText = text.substr(0, that.freeFormMaxLength);  
					$(this).val(newText);
				}
			}
		);

		// remove any test event handlers left over from the last question that may have used this page container
		for(var event in DKI.TestQuestion.events){
			$(this.pageContainer).off(DKI.TestQuestion.events[event]);
		}

		$(this.pageContainer).on(DKI.TestQuestion.events.submitted, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.submitted, that.page);
		});	
		$(this.pageContainer).on(DKI.TestQuestion.events.correct, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.correct, that.page);
		});		
		$(this.pageContainer).on(DKI.TestQuestion.events.incorrect, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.incorrect, that.page);
		});
		$(this.pageContainer).on(DKI.TestQuestion.events.partiallyCorrect, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.partiallyCorrect, that.page);
		});
		$(this.pageContainer).on(DKI.TestQuestion.events.attemptSubmitted, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.attemptSubmitted, that.page);
		});
		$(this.pageContainer).on(DKI.TestQuestion.events.attemptIncorrect, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.attemptIncorrect, that.page);
		});
		$(this.pageContainer).on(DKI.TestQuestion.events.attemptPartiallyCorrect, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.attemptPartiallyCorrect, that.page);
		});
		$(this.pageContainer).on(DKI.TestQuestion.events.questionInReview, function(){
			that.page.actionAPI.onPageEvent(DKI.TestQuestion.events.questionInReview, that.page);
		});
		//case 39751: prototyping in any of the page protototyped functions

		//case 39751: proxying any of the functions from the page scope that aren't defined here to future proof
		$.each(this.page, function(key){
			if(typeof that[key] == "undefined" && DKI.isFunction(this)){
				that[key] = $.proxy(that.page[key], that.page);
			}
		});
	};

	DKI.applyIf(component.prototype, Public);

	return component;
}();

DKI.TestQuestion.events = {
	exportSubmitted: "TESTQUESTION_EXPORT_SUBMITTED", 
	submitted: "TESTQUESTION_SUBMITTED", 
	nextClicked: "TESTQUESTION_NEXT_CLICKED",
	correct: "TESTQUESTION_CORRECT",
	incorrect: "TESTQUESTION_INCORRECT",
	partiallyCorrect: "TESTQUESTION_PARTIALLY_CORRECT",
	attemptSubmitted: "PRACTICE_QUESTION_ATTEMPT_SUBMITTED",
	attemptIncorrect: "PRACTICE_QUESTION_ATTEMPT_INCORRECT",
	attemptPartiallyCorrect: "PRACTICE_QUESTION_ATTEMPT_PARTIALLY_CORRECT",
	questionInReview: "TESTQUESTION_REVIEW",
	feedbackShown: "TESTQUESTION_FEEDBACK_SHOWN",
	dragStarted: "TESTQUESTION_DRAG_STARTED",	
	dragStopped: "TESTQUESTION_DRAG_STOPPED"
};

DKI.TestQuestion.TrueFalseQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions) {
		if (correctOptions < 1) {
			return 0;
		}
		
		return 100;
	},
	getCorrectCount: function () {
		return 1;
	},
	getOptions: function () {		
		var elementArray = $(".dki-trueFalseOption-element", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {	
			var inputEl = $("input", elementArray[i])[0];
			order = parseInt(inputEl.getAttribute("data-order"), "10") - 1;
			var choice = null;
			for(var k = 0; k < this.question.options.length; k++){
				if(this.question.options[k].element_id == $(elementArray[i]).data("id")){
					choice = this.question.options[k];
					break;
				}
			}
			options[order] = new DKI.TestQuestion.TrueFalseOption(inputEl, elementArray[i], choice);
		}
		return options;
	},
	getOptionFeedback: function(){
		return "";
	},
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].value() == 1){
				//if any one of the options are checked, the question has a sleection
				return true;
			}
		}
		return false;
	}
};

DKI.TestQuestion.TrueFalseOption = function (option, wrapperEl, choice) {
	this.optionElement = option;
	this.optionValue = $(option).next();	
	this.wrapper = wrapperEl;
	this.choice = choice;
	this.getFeedback = function(){
		return "";
	};
	this.correctResponse = function(questionOption) {
		if (questionOption != null && questionOption != undefined) {
			$(this.optionElement).data("correctresponse", questionOption.correct);
		}
		else {
			return $(this.optionElement).data("correctresponse");
		}
	};
	
	this.isCorrect = function() {
		return this.choice.parameters.correct;
	};

	this.enabled = function (enabled) {
		if (enabled !== undefined && enabled !== null) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};

	this.value = function (value) {
		if (value !== undefined && value !== null) {
			if (value == true || value == 1) {
				this.optionElement.checked = true;
				$("label", this.wrapper).addClass("checked");
			}
			else {
				this.optionElement.checked = false;
				$("label", this.wrapper).removeClass("checked");
			}
		}
		else {
			if (this.optionElement.checked) {
				return 1;
			}
			else {
				return 0;
			}
		}
	};

	this.score = function () {
		if (this.value() == 1 && this.isCorrect()) {
			return this.value();
		}
		else {
			return 0;
		}
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.value() == 1 && this.isCorrect()) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("correct");		
		}
		else if (this.value() == 1) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("incorrect");
		}
		if (displayCorrectAnswer && this.isCorrect()) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("multiChoiceCorrectResponse");
		}
	};
	
	this.reset = function () {
		$(".dki-authoring-content-wrapper", this.wrapper).removeClass("correct").removeClass("incorrect").removeClass("multiChoiceCorrectResponse");
		$(this.optionElement).prop("checked", false);
		if($(this.optionElement).css("display") != "none"){
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
			this.optionElement.tabIndex = -1;
		}
		this.optionValue.removeClass("checked");
		this.enabled(true);
	};

	this.start = function(){
		if($(this.optionElement).css("display") != "none"){
			this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
		}
	}
};

DKI.TestQuestion.MultipleChoiceQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions) {
		if (incorrectOptions > correctOptions) {
			return 0;
		}
		else {
			return (((correctOptions - incorrectOptions) / fullScore) * 100);
		}
	},
	getCorrectCount: function () {
		var correctCount = 0;
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].choice.parameters.correct){
				correctCount ++;
			}
		}
		return correctCount;
	},
	getOptions: function () {
		var elementArray = $(".dki-multiChoiceOption-element", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {	
			var inputEl = $("input", elementArray[i])[0];
			order = parseInt(inputEl.getAttribute("data-order"), "10") - 1;
			var choice = null;
			for(var k = 0; k < this.question.options.length; k++){
				if(this.question.options[k].element_id == $(elementArray[i]).data("id")){
					choice = this.question.options[k];
					break;
				}
			}
			options[order] = new DKI.TestQuestion.MultipleChoiceOption(inputEl, elementArray[i], choice);
		}
		return options;
	},
	randomizeOptions: function() {
		var elements = $(".dki-multiChoiceOption-element[data-randomized='true']", this.pageContainer);
		var elementPositions = [];
		var parentElements = [];
		var randomizedElements = [];
		var availableRandomSpots = [];

		var options = this.getOptions();
		var orderedOptions = [];
		// get all the places we can put randomized question options
		for (var i = 0; i < options.length; i++) {
			if (options[i].wrapper.data("randomized")) {
				availableRandomSpots.push(i);
			}
		}

		// Get the current top and left positions of all elements
		$.each(elements, function(key, element){
			//In responsive courses, the DOM position alone will reposition the elements properly.
			var top = settings.responsive ? 0 : $(element).data("y");
			var left = settings.responsive ? 0 : $(element).data("x");
			elementPositions[key] = {
				top: top,
				left: left,
				numbering: $(element).data("numbering"),
				key: key
			};
			$(element).before("<div class='RandomPlaceHolder' id='RandomPlaceHolder"+key+"'></div>");
			parentElements[key] = $(element).detach();
		});
		// Loop through all elements and randomize the entriwa
		var elCount = parentElements.length;
		for (var i = 0; i < elCount; i++) {
			var randIndex = Math.floor(Math.random() * parentElements.length);
			randomizedElements.push(parentElements.splice(randIndex, 1)[0]);	
		}

		// remap and reappend the elements to the DOM
		for (var i = 0; i < elCount; i++) {
			$(randomizedElements[i])
				.data("y", elementPositions[i].top)
				.data("x", elementPositions[i].left)
				.data("numbering", elementPositions[i].numbering)
				.data("feedbackOrder", availableRandomSpots[i] + 1)
				.css({
		 			"left": elementPositions[i].left,
		 			"top": elementPositions[i].top
		 		});
		 	$(".optionNumber", randomizedElements[i]).text(elementPositions[i].numbering);
		 	$("#RandomPlaceHolder"+elementPositions[i].key,  this.pageContainer).before(randomizedElements[i]);
		}
		
		// Show the Elements on the page.
		$('.RandomPlaceHolder',  this.pageContainer).remove();
		$(".dki-multiChoiceOption-element .multiChoiceContentWrapper").css("visibility", "visible");
	},
	getOptionFeedback: function(){
		var feedbackHtml = "";
		var options = this.getOptions();
		var orderedOptions = [];
		for (var i = 0; i < options.length; i++) {
			var order = 0;			
			if (options[i].wrapper.data("randomized")) {
				order = parseInt(options[i].wrapper.data("feedbackOrder"), "10");
			}
			else{
				var inputEl = options[i].optionElement;
				order = parseInt(inputEl.getAttribute("data-order"), "10");
			}
			orderedOptions[order - 1] = options[i];
		}
		for(var i = 0; i < orderedOptions.length; i++){
			if(this.question.include_selection_feedback && orderedOptions[i].value().checked == 1){
				feedbackHtml += orderedOptions[i].getFeedback();				
			}
			else if(this.question.include_correct_feedback && orderedOptions[i].isCorrect()){
				feedbackHtml += orderedOptions[i].getFeedback();
			}
			else if(this.question.include_incorrect_feedback && !orderedOptions[i].isCorrect()){
				feedbackHtml += orderedOptions[i].getFeedback();
			}
		}		
		return feedbackHtml;
	},	
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].value().checked == 1){
				//if any one of the options are checked, the question has a sleection
				return true;
			}
		}
		return false;
	}
};

DKI.TestQuestion.MultipleChoiceOption = function (option, wrapper, choice) {	
	this.optionElement = option;
	this.optionValue = $(option).next();
	this.wrapper = $(wrapper);
	this.choice = choice;
	this.getFeedback = function(){
		var feedbackHtml = "";
		var feedback = this.wrapper.data("feedback");
		if (feedback) {
			feedbackHtml += "<div class='optionFeedbackWrapper'>";
			feedbackHtml += "<span class='optionFeedbackNumbering'>";
			feedbackHtml += $(".optionNumber", this.wrapper).text();
			feedbackHtml += "</span>";
			feedbackHtml += "<span class='optionFeedbackContent'>";
			feedbackHtml += feedback;
			feedbackHtml += "</span>";			
			feedbackHtml += "</div>";
		}
		return feedbackHtml;
	};
	this.correctResponse = function (questionOption) {
		if (questionOption != null && questionOption != undefined) {
			this.optionElement.setAttribute("data-correctresponse", questionOption.correct);
		}
		else {
			return this.optionElement.getAttribute("data-correctresponse");
		}
	};
	
	this.isCorrect = function () {
		return this.choice.parameters.correct;
	};

	this.enabled = function (enabled) {
		if (enabled !== null && enabled !== undefined) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};
	
	this.value = function (value) {
		if (value !== null && value !== undefined) {
			if (value.checked == 1) {
				this.optionElement.checked = true;
				$("label", this.wrapper).addClass("checked");
			}
			else {
				this.optionElement.checked = false;
				$("label", this.wrapper).removeClass("checked");
			}
			//if its a randomized option, it was put somewhere and should have that ID stored in its data
			if(this.wrapper.data("randomized")){
				var el = $("#" + value.elementIdReplaced + "_wrapper");
				this.wrapper.css({
					"left": el.data("x"),
					"top": el.data("y")
				});
				$(".optionNumber", this.wrapper).text(el.data("numbering"));
				this.wrapper.data("feedbackOrder", value.feedbackOrder);
			}
		}
		else {
			var valueObj = {
				text: this.optionValue.text(),
				elementIdReplaced: null,
				feedbackOrder: null
			};
			if(this.wrapper.data("randomized")){
				valueObj.elementIdReplaced = this.wrapper.data("elementIdReplaced");
				valueObj.feedbackOrder = this.wrapper.data("feedbackOrder");
			}
			if (this.optionElement.checked) {
				valueObj.checked = 1;
			}
			else {
				valueObj.checked = 0;
			}
			return valueObj;
		}
	};

	this.score = function () {
		if (this.value().checked == 1 && this.isCorrect()) {
			return 1;
		}

		else if (this.value().checked == 1 && !this.isCorrect()) {
			return -1;
		}
		else {
			return 0;
		}
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.value().checked == 1) {
			if (this.isCorrect()) {
				$(".dki-authoring-content-wrapper", this.wrapper).addClass("correct");
			}
			else {
				$(".dki-authoring-content-wrapper", this.wrapper).addClass("incorrect");
			}
		}
		if (displayCorrectAnswer && this.isCorrect()) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("multiChoiceCorrectResponse");
		}
	};
	
	this.reset = function(){
		$(".dki-authoring-content-wrapper", this.wrapper).removeClass("correct").removeClass("incorrect").removeClass("multiChoiceCorrectResponse");
		$(this.optionElement).prop("checked", false);
		if($(this.optionElement).css("display") != "none"){
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
			this.optionElement.tabIndex = -1;
		}
		this.optionValue.removeClass("checked");
		$(".optionNumber", this.wrapper).text(this.wrapper.data("numbering"));	
		this.wrapper.data("feedbackOrder", null);
		this.wrapper.data("elementIdReplaced", null);
		this.enabled(true);
	};

	this.start = function(){
		if($(this.optionElement).css("display") != "none"){
			this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
		}
	}
}

DKI.TestQuestion.FillBlanksQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions) {
		return((correctOptions / fullScore) * 100);
	},
	getCorrectCount: function () {
		return this.getOptions().length;
	},
	getOptions: function () {		
		var elementArray = $(".dki-fillBlanksOption-element", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {	
			var inputEl = $("input", elementArray[i])[0];		
			order = parseInt(inputEl.getAttribute("data-order"), "10") - 1;
			var choice = null;
			for(var k = 0; k < this.question.options.length; k++){
				if(this.question.options[k].element_id == $(elementArray[i]).data("id")){
					choice = this.question.options[k];
					break;
				}
			}
			options[order] = new DKI.TestQuestion.FillBlanksOption(inputEl, $(elementArray[i]), choice);
		}
		return options;
	},
	getOptionFeedback: function(){
		var feedbackHtml = "";
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(this.question.include_correct_feedback && options[i].score() == 1){
				feedbackHtml += options[i].getFeedback();
			}
			else if(this.question.include_incorrect_feedback && options[i].score() == 0){
				feedbackHtml += options[i].getFeedback();
			}
		}		
		return feedbackHtml;
	},
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].value() == ""){
				//if any of the inputs are blank
				return false;
			}
		}
		return true;
	}
};

DKI.TestQuestion.FillBlanksOption = function (option, wrapper, choice) {
	this.optionElement = option;
	this.wrapper = wrapper;
	this.choice = choice;
	this.getFeedback = function(){
		var feedbackHtml = "";
		var feedback = this.wrapper.data("feedback");
		if (feedback) {
			feedbackHtml += "<div class='optionFeedbackWrapper'>";
			feedbackHtml += "<span class='optionFeedbackNumbering'>";
			feedbackHtml += $(".optionNumber", this.wrapper).text();
			feedbackHtml += "</span>";
			feedbackHtml += "<span class='optionFeedbackContent'>";
			feedbackHtml += feedback;
			feedbackHtml += "</span>";			
			feedbackHtml += "</div>";
		}
		return feedbackHtml;
	};
	this.correctResponse = function (questionOption) {
		if (questionOption != null && questionOption != undefined) {
			this.optionElement.setAttribute("data-correctresponse", questionOption.correctValues);
		}
		else {
			return this.optionElement.getAttribute("data-correctresponse");
		}
	};

	this.enabled = function (enabled) {
		if (enabled !== null && enabled !== undefined) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};
	
	this.value = function (value) {
		if (value !== null && value !== undefined) {
			$(this.optionElement).val(value);
		}
		else {
			return $.trim($(this.optionElement).val()).toLowerCase();
		}
	};
	
	this.isCorrect = function () {
		if(this.score() == 1){
			return true;
		}
		else{
			return false;
		}
	};

	this.score = function () {
		var correctArray = this.choice.parameters.correctValues;
		for (var i = 0; i < correctArray.length; i ++) {
			var correctAnswer = $.trim(correctArray[i]).toLowerCase();
			var value = this.value();			
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
				return 1;
			}
		}
		return 0;
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.score() == 1) {
			$(".dki-question-option", this.wrapper).addClass("correct");
		}
		else {
			$(".dki-question-option", this.wrapper).addClass("incorrect");
		}
	};
	
	this.reset = function(){
		$(this.optionElement).val(""); 
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
		this.optionElement.tabIndex = -1;
		$(".dki-question-option", this.wrapper).removeClass("correct");
		$(".dki-question-option", this.wrapper).removeClass("incorrect");
		this.enabled(true);
	}

	this.start = function(){
		this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
	}
};

DKI.TestQuestion.MultiplePulldownQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions) {
		return ((correctOptions / fullScore) * 100);
	},
	getCorrectCount: function () {
		return this.getOptions().length;
	},
	getOptions: function () {		
		var elementArray = $(".dki-multiPulldownOption-element", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {	
			var inputEl = $("select", elementArray[i])[0];		
			order = parseInt(inputEl.getAttribute("data-order"), "10") - 1;
			var choice = null;
			for(var k = 0; k < this.question.options.length; k++){
				if(this.question.options[k].element_id == $(elementArray[i]).data("id")){
					choice = this.question.options[k];
					break;
				}
			}
			options[order] = new DKI.TestQuestion.MultiplePulldownOption(inputEl, $(elementArray[i]), choice);
		}
		return options;
	},
	getOptionFeedback: function(){
		var feedbackHtml = "";
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(this.question.include_correct_feedback && options[i].score() == 1){
				feedbackHtml += options[i].getFeedback();
			}
			else if(this.question.include_incorrect_feedback && options[i].score() == 0){
				feedbackHtml += options[i].getFeedback();
			}
		}		
		return feedbackHtml;
	},
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){			
			if(options[i].value() == ""){
				//if any of the dropdowns havent had a seelction made...
				return false;
			}
		}
		return true;
	}
};

DKI.TestQuestion.MultiplePulldownOption = function (option, wrapper, choice) {
	this.optionElement = option;
	this.wrapper = wrapper;
	this.choice = choice;
	this.getFeedback = function(){
		var feedbackHtml = "";
		var feedback = this.wrapper.data("feedback");
		if (feedback) {
			feedbackHtml += "<div class='optionFeedbackWrapper'>";
			feedbackHtml += "<span class='optionFeedbackNumbering'>";
			feedbackHtml += $(".optionNumber", this.wrapper).text();
			feedbackHtml += "</span>";
			feedbackHtml += "<span class='optionFeedbackContent'>";
			feedbackHtml += feedback;
			feedbackHtml += "</span>";			
			feedbackHtml += "</div>";
		}
		return feedbackHtml;
	};
	this.correctResponse = function (questionOption) {
		if (questionOption != null && questionOption != undefined) {
			this.optionElement.setAttribute("data-correctresponse", questionOption.correctValue);
		}
		else {
			return this.optionElement.getAttribute("data-correctresponse");
		}
	};
	
	this.isCorrect = function () {
		if (this.value() == this.choice.parameters.correctValue.toString()) {
			return true;
		}
		else {
			return false;
		}
	};

	this.enabled = function (enabled) {
		if (enabled !== null && enabled !== undefined) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};

	this.value = function (value) {
		if (value !== null && value != undefined) {
			$(this.optionElement).val(value);
		}
		else {
			return $(this.optionElement).val();
		}
	};

	this.score = function () {
		if (this.isCorrect()) {
			return 1;
		}
		else {
			return 0;
		}
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.score() == 1) {
			$(".dki-question-option", this.wrapper).addClass("correct");
		}
		else {			
			$(".dki-question-option", this.wrapper).addClass("incorrect");
		}
	};
	
	this.reset = function(){
		this.optionElement.selectedIndex = 0;
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
		this.optionElement.tabIndex = -1;
		$(".dki-question-option", this.wrapper).removeClass("correct");
		$(".dki-question-option", this.wrapper).removeClass("incorrect");
		this.enabled(true);
	}

	this.start = function(){
		this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
	}
};

DKI.TestQuestion.FreeFormQuestion = {
	calculate: function () {
		return 0;
	},
	getCorrectCount: function () {
		return 0;
	},
	getOptions: function () {
		var elementArray = $(".dki-freeFormOption-element textarea", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {
			order = parseInt(elementArray[i].getAttribute("data-order"), "10") - 1;
			options[order] = new DKI.TestQuestion.FreeFormOption(elementArray[i], $(elementArray[i]).closest(".dki-authoring-element"));
		}
		return options;
	},
	getOptionFeedback: function(){
		return "";
	},
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].value() == ""){
				//if any of the options (although theres only 1 in this question type) is empty, the question is not finished and still needs selection
				return false;
			}
		}
		return true;
	}

};

DKI.TestQuestion.FreeFormOption = function (option, wrapper) {
	this.optionElement = option;
	this.wrapper = wrapper;

	this.correctResponse = function () {
		return "";
	};
	
	this.getFeedback = function(){
		return "";
	};
	
	this.isCorrect = function () {
		if (this.value() != "") {
			return true;
		}
		else {
			return false;
		}
	};

	this.enabled = function (enabled) {
		if (enabled !== null && enabled !== undefined) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};
	
	this.value = function (value) {
		if (value !== null && value !== undefined) {
			$(this.optionElement).val(value);
		}
		else {
			return $(this.optionElement).val();
		}
	};

	this.score = function () {		
		return 0;
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.isCorrect()) {
			$(".dki-question-option", this.wrapper).addClass("correct");
		}
		else {
			$(".dki-question-option", this.wrapper).addClass("incorrect");
		}
	};
	
	this.reset = function(){
		$(this.optionElement).val("");
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
		this.optionElement.tabIndex = -1;
		$(".dki-question-option", this.wrapper).removeClass("correct");
		$(".dki-question-option", this.wrapper).removeClass("incorrect");
		this.enabled(true);
	}

	this.start = function(){
		this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
		$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
	}
};

DKI.TestQuestion.DragDropQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions) {
		if(fullScore == 0 && correctOptions == 0 && incorrectOptions == 0){
			return 0;
		}
		return ((correctOptions / fullScore) * 100);
	},
	getCorrectCount: function () {
		return $(".dki-authoring-element[data-is-draggable=true][data-isquestionelement=true]", this.pageContainer).length;
	},
	getOptions: function () {
		var elementArray = $(".dki-authoring-element[data-is-draggable=true][data-isquestionelement=true]", this.pageContainer);
		var options = [];
		var order;
		for (var i = 0; i < elementArray.length; i++) {	
			var option = null;
			var elementId = $(elementArray[i]).data("id");
			for(var k = 0; k < this.question.options.length; k++){
				if(this.question.options[k].element_id == elementId){
					option = this.question.options[k];
				}
			}
			options[i] = new DKI.TestQuestion.DragDropOption(elementArray[i], option);
		}
		return options;
	},
	getOptionFeedback: function(){
		return "";
	},
	hasSelection: function(){
		var options = this.getOptions();
		for(var i = 0; i < options.length; i++){
			if(options[i].value().target.id != null){
				//if at least one of the draggables has been moved, the question has selection.
				return true;
			}
		}
		return false;
	}
};
DKI.TestQuestion.customQuestion = {
	calculate: function (fullScore, correctOptions, incorrectOptions, score) {
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
	},

	getOptions: function () {
		var options = [];
		return options;
	},
	getOptionFeedback: function(){
		return "";
	},
	getCorrectCount : function(){
		return 0;
	},
	hasSelection : function(){
		return true;
	}
};

DKI.TestQuestion.DragDropOption = function (optionElement, questionOption) {
	this.optionElement = optionElement;
	this.questionOption = questionOption;

	this.correctResponse = function (questionOption) {
		var dropData = this.value();
		$(this.optionElement).css({
			"top": dropData.y + "px",
			"left": dropData.x + "px"
		});
		return null;
	};
	
	this.getFeedback = function(){
		return "";
	};

	this.enabled = function (enabled) {
		if (enabled !== null && enabled !== undefined) {			
			$(this.optionElement).draggable({
				disabled: !enabled
			});
			var highestTargetZIndex = 0;
			$(".dki-authoring-element[data-is-droppable=true][data-isquestionelement=true]", this.pageContainer).each(function(){
				var zIndex = parseInt($(this).css("z-index"), 10);
				if(zIndex > highestTargetZIndex){
					highestTargetZIndex = zIndex;
				}
			});
			$(this.optionElement).css("z-index", highestTargetZIndex + 1);
			$(this.optionElement).parent(".dki-authoring-group").css("position", "static");
		}
		else {
			return false;
		}
	};
	
	this.value = function (value) {
		if (value !== null && value !== undefined) {
			$(this.optionElement).data("dropData", value);
		}
		else {
			var dropData = $(this.optionElement).data("dropData");
			if(!dropData){
				var position = $(this.optionElement).position();
				var title = $(this.optionElement).data("title");
				if(title == ""){
					title = $(this.optionElement).text();
				}		
				dropData = {
					id: $(this.optionElement).data("dragdropid"),
					elementId: $(this.optionElement).data("id"),
					title: title,
					target: {
						id: null,
						title: "No Target"
					},
					x: position.left,
					y: position.top
				};
			}
			return dropData;
		}
	};
	
	this.isCorrect = function () {
		if (this.score() == 1) {
			return true;
		}
		else{
			return false;
		}
	};

	this.score = function () {
		var dropData = this.value();		
		var currentDropTarget = dropData.target.id;
		if (currentDropTarget) {
			for(var i = 0; i < this.questionOption.parameters.correctTargets.length; i++){
				if(currentDropTarget.toString().toLowerCase() == this.questionOption.parameters.correctTargets[i].toString().toLowerCase()){
					return 1;
				}
			}
			return -1;
		}
		else if (this.questionOption.parameters.correctTargets.length > 0) {
			return -1;
		}
		else {
			return 1;
		}		
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.score() == 1) {
			$(this.optionElement).addClass("correct");
		}
		else {
			$(this.optionElement).addClass("incorrect");
		}
	};
	
	this.reset = function(){
		$(this.optionElement).data("dropData", null);
		$(this.optionElement).removeClass("correct");
		$(this.optionElement).removeClass("incorrect");
		this.enabled(true);
	}

	this.start = function(){}
};
DKI.TestQuestion.TrueFalseOption = function (option, wrapperEl, choice) {
	this.optionElement = option;
	this.optionValue = $(option).next();	
	this.wrapper = wrapperEl;
	this.choice = choice;
	this.getFeedback = function(){
		return "";
	};
	this.correctResponse = function(questionOption) {
		if (questionOption != null && questionOption != undefined) {
			$(this.optionElement).data("correctresponse", questionOption.correct);
		}
		else {
			return $(this.optionElement).data("correctresponse");
		}
	};
	
	this.isCorrect = function() {
		return this.choice.parameters.correct;
	};

	this.enabled = function (enabled) {
		if (enabled !== undefined && enabled !== null) {
			this.optionElement.disabled = !enabled;
		}
		else {
			return !this.optionElement.disabled;
		}
	};

	this.value = function (value) {
		if (value !== undefined && value !== null) {
			if (value == true || value == 1) {
				this.optionElement.checked = true;
				$("label", this.wrapper).addClass("checked");
			}
			else {
				this.optionElement.checked = false;
				$("label", this.wrapper).removeClass("checked");
			}
		}
		else {
			if (this.optionElement.checked) {
				return 1;
			}
			else {
				return 0;
			}
		}
	};

	this.score = function () {
		if (this.value() == 1 && this.isCorrect()) {
			return this.value();
		}
		else {
			return 0;
		}
	};

	this.showCorrect = function (displayCorrectAnswer) {
		if (this.value() == 1 && this.isCorrect()) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("correct");		
		}
		else if (this.value() == 1) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("incorrect");
		}
		if (displayCorrectAnswer && this.isCorrect()) {
			$(".dki-authoring-content-wrapper", this.wrapper).addClass("multiChoiceCorrectResponse");
		}
	};
	
	this.reset = function () {
		$(".dki-authoring-content-wrapper", this.wrapper).removeClass("correct").removeClass("incorrect").removeClass("multiChoiceCorrectResponse");
		$(this.optionElement).prop("checked", false);
		if($(this.optionElement).css("display") != "none"){
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", this.optionElement.tabIndex);
			this.optionElement.tabIndex = -1;
		}
		this.optionValue.removeClass("checked");
		this.enabled(true);
	};

	this.start = function(){
		if($(this.optionElement).css("display") != "none"){
			this.optionElement.tabIndex = $(".dki-element-anchor", this.wrapper).attr("tabIndex");
			$(".dki-element-anchor", this.wrapper).attr("tabIndex", -1);
		}
	}
};


