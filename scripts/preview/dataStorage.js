DKI.PreviewDataStorage = DKI.DataStorage.extend({
	init: function (courseStructure, behaviour, apiToken, pageStrings, pageid) {
		this._parent(courseStructure, behaviour);
		this.token = apiToken;
		this.strings = pageStrings;
	    if (!pageid){
			this.previewPageId = 0;
		}else{
			this.previewPageId = pageid;
		}
		
	},

	createTest: function (moduleID, prePost) {
		var module = this.findModule(moduleID);
		var ajaxArgs = {
			headers: {"X-dki-authtoken": this.token},
			type: "GET",
			url: "../api/student.cfm/module/" + moduleID + "/starttest",
			context: this,
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				this.assessment = new DKI.Assessment(module, prePost, data);
				this.currentTestID = data.id;
				if (prePost === "pre") {
					module.pre = 0;
				}
				else if (module.post) {
					module.post.attempts ++;
				}
				else {
					module.post = {
						attempts: 1,
						score: 0
					};
				}
				$(this).trigger(DKI.DataStorage.events.assessmentReady);
				$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert(this.strings.txtFailedLoadAssess + textStatus);
			}
		};
		$.ajax(ajaxArgs);
	},

	loadCompletion: function (autoResume) {
		
		var ajaxArgs = {
			headers: {"X-dki-authtoken": this.token},
			context: this,
			dataType: "json",
			success: function (data, textStatus, jqXHR) {
				
				for (var i = 0; i < data.modules.length; i++) {
					this.setModuleComplete(data.modules[i]);
				}

				for (i = 0; i < data.objects.length; i++) {
					this.setObjectComplete(data.objects[i]);
				}

				for (i = 0; i < data.pages.length; i++) {
					this.setPageComplete(data.pages[i]);
				}

				if(this.previewPageId !=0){
				    this.bookmark = this.previewPageId;
				}else {
					this.bookmark = data.resumePoint;
				}
				//We lose the reference to this._parent inside the callback, so have to call the 
				//prototype directly.
				DKI.DataStorage.prototype.loadCompletion.call(this, autoResume);
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert(this.strings.txtErrorLoadCmpltn);
			},
			url: "../api/student.cfm/course/" + this.courseStructure.id + "/completion"
		};
		
		$.ajax(ajaxArgs);
	},

	markPageComplete: function (page) {
		var ajaxArgs = {
			headers: {"X-dki-authtoken": this.token},
			dataType: "json",
			context: this,
			type: "POST",
			url: "../api/student.cfm/object/" + page.objectid + "/page/" + page.subeoid + "/complete"
		};
		$.ajax(ajaxArgs);
		this._parent.markPageComplete(page);
	},
	
	markObjectComplete: function (object) {
		var ajaxArgs = {
			headers: {"X-dki-authtoken": this.token},
			dataType: "json",
			context: this,
			type: "POST",
			url: "../api/student.cfm/object/" + object.id + "/complete"
		};
		$.ajax(ajaxArgs);
		this._parent.markObjectComplete(object);
	},

	submitCurrentQuestion: function (questionObject) {
		var ajaxArgs = {
			headers: {"X-dki-authtoken": this.token},
			dataType: "json",
			type: "POST",
			context: this,
			success: function (data, textStatus, jqXHR) {
				var score = parseInt(data, 10);
				this.assessment.scoreQuestion(this.assessment.currentQuestion, questionObject, score);
				$(this).trigger(DKI.DataStorage.events.questionSubmitted, score);
				if (this.assessment.currentQuestion) {
					$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
				}
				else {
					if (this.assessment.prePost === "pre") {
						this.assessment.module.pre = this.assessment.getScore();
					}
					else {
						this.assessment.module.post.score = this.assessment.getScore();
					}
					$(this).trigger(DKI.DataStorage.events.assessmentCompleted);
				}
			},
			error: function (jqXHR, textStatus, errorThrown) {
				alert("Error");
			},
			url: "../api/student.cfm/test/" + this.currentTestID + "/question/" + this.assessment.currentQuestion.id,
			data: ""
		};
		for (var i = 0; i < questionObject.options.length; i ++) {
			if (questionObject.type === 2) {
				ajaxArgs.data += "&choice_" + (i + 1) + "=" + questionObject.options[i].checked;
			}
			else {
				ajaxArgs.data += "&choice_" + (i + 1) + "=" + encodeURIComponent(questionObject.options[i]);
			}
		}
		$.ajax(ajaxArgs);
	}
});
