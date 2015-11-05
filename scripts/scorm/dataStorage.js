DKI.SCORMDataStorage = DKI.DataStorage.extend({
	/**
	 * Implementation of a datastorage object, with SCORM data storage/retrieval
	 * @class DKI.SCORMDataStorage
	 * @constructor
	 * @extends DKI.DataStorage
	 * @param {Object} courseStructure The structure of the course pacage
	 * @param {Object} behaviour The package's runtime behaviour configuration
	 * @param {Object} aStrings M17N string values
	 * @param {Object} scormAPI The object providing SCORM methods
	 */
	init: function (courseStructure, behaviour, aStrings, scormAPI) {
		this._parent(courseStructure, behaviour, aStrings);
		/**
		 * The object providing SCORM api methods
		 * @property {Object}
		 */
		this.scormAPI = scormAPI;
		this.storedContentVariables = {};
	},

	setContentVariable: function (name, value, preventStorage) {
		this._parent(name, value);
		if(!preventStorage){
			this.storedContentVariables[name] = this._parent.getContentVariable(name);
		}
	},

	/**
	 * Factory method, creates an Assessment object for a given module
	 * @param {Object} module The module the assessment is being created for
	 * @param {String} prePost One of "pre" or "post", for the assessment type
	 * @param {Object} test The test object
	 * @returns {DKI.SCORMAssessment} The new assessment object
	 */
	createAssessment: function(module, prePost, test) {
		return new DKI.SCORMAssessment(module, prePost, test, this.scormAPI);
	},
	/**
	 * Initializes event handlers. Calls the underlying
	 * {@link DKI.DataStorage#initEvents}
	 */
	initEvents: function () {
		var that = this;
		$(this).on(DKI.DataStorage.events.pageSelected, function (e, subeo) {
			that.saveCompletion(subeo.page);
		});
		this._parent.initEvents();
	},
	/**
	 * Loads previous completion from {@link DKI.SCORMDataStorage#scormAPI}.
	 * If the 'autoResume' parameter is 'on', will automatically resume at last
	 * completion. If the 'autoResume' parameter is 'prompt', will prompt user
	 * to resume. Otherwise, will launch the first page of the course. 
	 *
	 * See DKI.DataStorage#autoResume
	 *
	 * @param {String} autoResume If 'on', will jump automatically. If
	 * 'prompt', will prompt the user to jump.
	 */
	loadCompletion: function (autoResume) {
		this.bookmark = this.scormAPI.GetBookmark();
		if (this.bookmark === "") {
			this.bookmark = null;
		}
		var passMark = this.scormAPI.GetPassingScore();
		var courseStatus = this.scormAPI.GetStatus();
		var chunkData = this.scormAPI.GetDataChunk();
		var data = {
			completion: {
				m: [],
				o: [],
				s: [],
				t: []
			},
			contentVariables: {}
		};
		if(chunkData !== ""){
			data = JSON.parse(chunkData);	
			//hook for new stuff added with the SOW.. 
			if(!data.completion){
				data = {
					completion: data
				};
			}
			if(data.contentVariables){
				this.contentVariables = data.contentVariables;
				this.storedContentVariables = this.contentVariables;
			}
		}
		var completionObject;		
		var i;
		if (passMark > 0) {
			this.passMark = passMark;
		}
		if (
			courseStatus === this.scormAPI.LESSON_STATUS_PASSED ||
			courseStatus === this.scormAPI.LESSON_STATUS_FAILED ||
			courseStatus === this.scormAPI.LESSON_STATUS_COMPLETED
			) {
			completionObject = data.completion;
			this.markCourseComplete();
			//Loop through tests
			for (i = 0; i < completionObject.t.length; i ++) {
				if (completionObject.t[i].pre) {
					this.setModulePre(completionObject.t[i].id, completionObject.t[i].pre);
				}
				if (completionObject.t[i].post) {
					this.setModulePost(completionObject.t[i].id, completionObject.t[i].post);
				}
			}
		}
		else if (chunkData !== ""){
			completionObject = data.completion;
			var that = this;
			for (i = 0; i < completionObject.m.length; i ++) {
				this.markModuleComplete(completionObject.m[i]);
			}
			for (i = 0; i < completionObject.o.length; i ++) {
				this.markObjectComplete(completionObject.o[i]);
			}
			if(completionObject.p){
				completionObject.s = [];
				$.each(completionObject.p, function(index,item){
					var subeo = that._parent.getSubeoFromPage(item);
					if(subeo){
						completionObject.s.push(subeo.subeoid);
					}
				});
			}
			$.each(completionObject.s, function(index,item){
				that.markSubeoComplete(item);
			});		
			for (i = 0; i < completionObject.t.length; i ++) {
				if (completionObject.t[i].pre) {
					this.setModulePre(completionObject.t[i].id, completionObject.t[i].pre);
				}
				if (completionObject.t[i].post) {
					this.setModulePost(completionObject.t[i].id, completionObject.t[i].post);
				}
			}
			this.checkCourseComplete();
		}
		this._parent.loadCompletion(autoResume);
	},
	/**
	 * Rebuilds a module's weighting as part of overall course test. Used
	 * when retrieving suspend data for modules that don't have weightingo
	 * @param {Object} module The module to weight
	 * @returns {Number} totalQuestions * 10
	 */
	reconstructWeight: function (module) {
		var totalQuestions = 0;
		if (typeof module != "object") {
			module = this.findModule(module);
		}

		for (var i = 0; i < module.objects.length; i += 1) {
			if (module.objects[i].randQuest <= module.objects[i].questions.length) {
				totalQuestions += module.objects[i].randQuest;
			}
			else {
				totalQuestions += module.objects[i].questions.length;
			}
		}

		//We assume default weight of 10 for legacy module suspend strings
		return totalQuestions * 10;
	},
	/**
	 * Saves page completion data via scorm API. Also sets progress mesure and
	 * commits suspend data
	 * @param {Object} page The page to store completion for
	 */
	saveCompletion: function (page) {
		if (page) {
			this.scormAPI.SetBookmark(page.pageid, page.title);
		}
		this.scormAPI.SetProgressMeasure(this.getCourseCompletion(true) / 100);
		this.scormAPI.SetDataChunk(this.serializeDataChunk());
		this.scormAPI.CommitData();
	},
	/**
	 * Serializes current course completion for scorm suspend data
	 * @returns {String} Course completion serialized as a JSON string
	 */
	serializeDataChunk: function () {
		var currentMod, currentObj, testRecord;
		var completionObj = {
			m: [],
			o: [],
			s: [],
			t: []
		};
		for (var i = 0; i < this.courseStructure.modules.length; i ++) {
			currentMod = this.courseStructure.modules[i];
			if (currentMod.complete) {
				completionObj.m[completionObj.m.length] = currentMod.loid;
			}
			else {
				for (var j = 0; j < currentMod.objects.length; j ++) {
					currentObj = currentMod.objects[j];
					if (currentObj.complete) {
						completionObj.o[completionObj.o.length] = currentObj.objectid;
					}
					else {
						for (var k = 0; k < currentObj.subeos.length; k ++) {
							if (currentObj.subeos[k].complete) {
								completionObj.s[completionObj.s.length] = currentObj.subeos[k].subeoid;
							}
						}
					}
				}
			}
			if (currentMod.pre || currentMod.post) {
				testRecord = {
					id: currentMod.loid
				};
				if (currentMod.pre) {
					testRecord.pre = currentMod.pre;
				}
				if (currentMod.post) {
					testRecord.post = currentMod.post;
				}
				completionObj.t[completionObj.t.length] = testRecord;
			}
		}
		var storedData = {
			completion: completionObj
		};
		if (this.scormAPI.objLMS.Standard !== "SCORM") {
			storedData.contentVariables = this.storedContentVariables;
		};
		return JSON.stringify(storedData);
	},
	/**
	 * Sets pre-test score for a module
	 * @param {Number | Object} moduleID The Id of the module, or the actual
	 * module.
	 * @param {Object | Number} preScore If a number, weight/ponts are calculated
	 * @param {Number} preScore.score The pre-test score
	 * @param {Number} [preScore.weight] The pre-test weight. Calculcated with
	 * {@link DKI.SCORMDataStorage#reconstructWeight}
	 * @param {Number} [preScore.points] The pre-test points. If not provided,
	 * calculated as (score / 100) * weight)
	 */
	setModulePre: function (moduleID, preScore) {
		var module = typeof moduleID == "object" ? moduleID : this.findModule(moduleID);
		var score = typeof preScore == "object" ? preScore.score : preScore;
		var weight = typeof preScore == "object" ? preScore.weight : this.reconstructWeight(module);
		var points = typeof preScore == "object" ? preScore.points : parseFloat(((score / 100) * weight).toFixed(1), 10);

		if (points == Math.round(points)) {
			points = parseInt(points, "10");
		}

		module.pre = {
			score: score
			,weight: weight
			,points: points
		};
	},
	/**
	 * Sets post-test score for a module
	 * @param {Number | Object} moduleID The Id of the module, or the module itself.
	 * @param {Object} postRecord
	 * @param {Number} postRecord.score The post-test score
	 * @param {Number} [postRecord.weight] The post-test weight. Recalculated by
	 * calling {@link DKI.SCORMDataStorage#reconstructWeight}
	 */
	setModulePost: function (moduleID, postRecord) {
		var module = typeof moduleID == "object" ? moduleID : this.findModule(moduleID);
		if (!postRecord.weight) {
			postRecord.weight = this.reconstructWeight(module);
		}
		if (!postRecord.points) {
			postRecord.points = parseFloat(((postRecord.score / 100) * postRecord.weight).toFixed(1), 10);
		}
		if (postRecord.points == Math.round(postRecord.points)) {
			postRecord.points = parseInt(postRecord.points, "10");
		}
		module.post = postRecord;
		if (this.courseStructure.testonly && this.remainingPostAttempts(module) == "0") {
			module.complete = true;
		}
	},
	/**
	 * Marks the course as complete
	 */
	markCourseComplete: function () {
		for (var i = 0; i < this.courseStructure.modules.length; i ++) {
			this.markModuleComplete(this.courseStructure.modules[i]);
		}
	},
	/**
	 * Overrides the parent method, saving completion information afterward
	 *
	 * See DKI.DataStorage#createTest
	 */
	createTest: function (moduleID, prePost) {
		this._parent.createTest(moduleID, prePost);
		this.saveCompletion();
	},
	//Event handler functions
	/**
	 * Overrides the parent method, saving completing/progress/score to scorm API
	 *
	 * See DKI.DataStorage#onCourseComplete
	 */
	onCourseComplete: function () {
		this._parent.onCourseComplete();		
		switch(playerBehaviour.completionStatus){
			case 1: 
				//default behavior
				switch (this.lessonStatus) {
					case "passed":
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
						this.scormAPI.SetPassed();
						break;
					case "failed":
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
						this.scormAPI.SetFailed();
						break;
					case "complete":
						this.scormAPI.SetReachedEnd();
						this.scormAPI.SetPassed();	
						break;
				}
				break;
			case 2:
				//Completed/incomplete
				if(this.lessonStatus == "complete" || this.lessonStatus == "passed"){
					if(this.lessonStatus == "passed"){
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					}
					this.scormAPI.SetReachedEnd();
				}
				break;
			case 3:
				//Completed/Failed
				if(this.lessonStatus == "complete" || this.lessonStatus == "passed"){
					if(this.lessonStatus == "passed"){
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					}
					this.scormAPI.SetReachedEnd();
				}
				else if(this.lessonStatus == "failed"){
					this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					this.scormAPI.SetFailed();
				}
				break;
			case 4:
				//Passed/Failed				
				if(this.lessonStatus == "complete" || this.lessonStatus == "passed"){
					if(this.lessonStatus == "passed"){
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					}
					this.scormAPI.SetPassed();
				}
				else if(this.lessonStatus == "failed"){
					this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					this.scormAPI.SetFailed();
				}
				break;
			case 5:
				//Passed/Incomplete
				if(this.lessonStatus == "complete" || this.lessonStatus == "passed"){
					if(this.lessonStatus == "passed"){
						this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
					}
					this.scormAPI.SetPassed();
				}
				break;
		}
		this.saveCompletion();
	},
	/**
	 * Overrides the parent method, saving completion etc. to scorm API
	 *
	 * See DKI.DataStorage#onAssessmentComplete
	 */
	onAssessmentComplete: function () {
		var nextModule;
		this._parent.onAssessmentComplete();
		if (this.scormAPI.objLMS.Standard === "SCORM2004") {
			this.scormAPI.SetScore(this.getCourseScore(), 100, 0);
		}
		if (this.courseStructure.testonly) {
			nextModule = this.getNextModule(this.assessment.module);
			if (nextModule) {
				this.scormAPI.SetBookmark(nextModule.loid, nextModule.name);
			}
			else {
				this.scormAPI.SetBookmark("", "");
			}
		}
		this.saveCompletion();
	},
	/**
	 * Overrides the parent method, gets Id from the scorm API
	 *
	 * See DKI.DataStorage#getUserID
	 */
	getUserID: function () {
		return this.scormAPI.GetStudentID();
	}
});
