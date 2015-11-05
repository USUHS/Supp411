DKI.DataStorage = $.Class({
	/**
	 * Provides an object for tracking/navigating through the structure of a course
	 * @class DKI.DataStorage
	 * @constructor
	 * @param {Object} courseStructure The structure of the course package
	 * @param {Object} behaviour The package's runtime behaviour configuration
	 * @param {Object} aStrings M17N string values
	 * @param {String} [startPageId] If provided, will 'resume' the package at
	 * the given page
	 */
	init: function (courseStructure, behaviour, aStrings, startPageId) {
		this.courseStructure = this.initStructure(courseStructure);
		this.behaviour = behaviour;
		this.strings = aStrings;
		this.currentModuleIndex = 0;
		this.currentObjectIndex = 0;
		this.currentPageIndex = 0;
		this.store  = {
			assets        : {},
			groups        : {},
			elements      : {},
			resources     : {},
			relationships : {
				glossaryElement  : {},
				assetElement     : {},
				citationGlossary : {}
			}
		};
		//if we pass in an ID for the page to start at, set the player to start from there.
		//note this does NOT include questions.
		if(startPageId){
			this.bookmark = startPageId;
		}
		this.currentModule = this.courseStructure.modules[this.currentModuleIndex];
		this.currentObject = this.currentModule.objects[this.currentObjectIndex];
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		this.moduleCount = this.courseStructure.modules.length;
		this.currentObjectCount = this.currentModule.objects.length;
		this.currentPageCount = this.currentObject.subeos.length;
		this.previousPage = null;
		//if we're not on the first page, get the previous one
		if(this.currentPageIndex > 0){
			this.previousPage = this.getPreviousPage();
		}
		this.nextPage = this.getNextPage();
		this.currentModulePageTotal = this.countModulePages(this.currentModule);
		this.currentModulePage = this.currentPageIndex + 1;
		this.passMark = this.courseStructure.passmark;
		this.assessment = null;
		this.lessonStatus = "incomplete";
		this.contentVariables = {};
		this.indexAssets();
		$(document).on(DKI.resourceBrowser.events.resourceRegistered, 
			$.proxy(function(event, data) {
				data.isResource = true;
				if(!this.store.assets[data.id]){
					this.store.assets[data.id] = data;
				}
				if(!this.store.resources[data.id]){
					this.store.resources[data.id] = data;
				}
			}, this)
		);
		$(document).on(DKI.courseStore.events.groupRegistered,
			$.proxy(function(event,data){
				this.store.groups[data.id] = data;
			},this)
		);
		$(document).on(DKI.courseStore.events.elementRegistered, 
			$.proxy(function(event, data) {
				this.store.elements[data.elementid] = data;
				if(data.upload_id) {
					var asset = this.store.assets[data.upload_id];
					this.setRelationship("assetElement",data.upload_id,data.elementid);
				}
				if(data.elementtype == "htm" || data.elementtype =="table" || data.elementtype== "authoringButton")	{
					//Put it in a container so even if the meta only consists of a glossary term, it is found
					var elMeta = $("<div>" + data.meta + "</div>");
					var that = this;
					elMeta.find(".dki-glossary-link").each(function(){
						var id = $(this).data("id");
						that.setRelationship("glossaryElement",id,data.elementid);
					})
				}
			}, this)
		);
	
	}
});
/**
 * Gets a relationship in the datastorage store. If no relationship is found, returns an empty array
 *
 * @return Array
 */
DKI.DataStorage.prototype.getRelationship = function(key,id) {
	var ret = [];
	if(!this.store.relationships[key]) {
		return ret;
	}
	else if(!this.store.relationships[key][id]){
		return ret;
	}
	else {
		return this.store.relationships[key][id];
	}
}
/**
 * Sets a relationship within the datastorage store
*/
DKI.DataStorage.prototype.setRelationship = function(key, id, value) {
	if(!this.store.relationships[key]) {
		this.store.relationships[key] = {};
	}
	if(!this.store.relationships[key][id]) {
		this.store.relationships[key][id] = [value];
	}
	else if($.inArray(value, this.store.relationships[key][id]) < 0){
		this.store.relationships[key][id].push(value);
	}
}

/**
 * Adds all the assets to the datastorage store
 *
 */
DKI.DataStorage.prototype.indexAssets = function() {
	for(var i = 0; i < DKI.assets.length; i ++) {
		var asset = DKI.assets[i];
		if(!this.store.assets[asset.id]) {
			asset.labels = "";
			this.store.assets[asset.id] = asset;
			$(document).trigger(DKI.DataStorage.events.assetRegistered, [asset]);
		}
	}
}

/**
 * Returns true if all course tests have been attempted (or course has not testing), false
 * otherwise
 *
 * @return Boolean
 */
DKI.DataStorage.prototype.allTestsAttempted = function () {
	var totalTests;
	var attemptedTests;
	if (!this.hasTesting() || !(this.behaviour.enablePreTest || this.behaviour.enablePostTest)) {
		return true;
	}
	else {
		totalTests = this.modulesWithTesting().length;
		attemptedTests = this.modulesTestAttempted().length;

		return attemptedTests == totalTests;
	}
};

/**
 * Factory method, creates an Assessment object for a given module
 * @param {Object} module The module the assessment is being created for
 * @param {String} prePost One of "pre" or "post", for the assessment type
 * @param {Object} test The test object
 * @returns DKI.Assessment
 */
DKI.DataStorage.prototype.createAssessment = function (module, prePost, test) {
	return new DKI.Assessment(module, prePost, test);
};

/**
 * For a given object, checks child pages.  If all pages are complete, the object is marked as complete
 * @param {Object} object The learning object whose complete is checked.
 */
DKI.DataStorage.prototype.checkObjectComplete = function (object) {
	var pageCount = object.subeos.length;
	var total = 0;
	for (var i = 0; i < pageCount; i ++) {
		if (object.subeos[i].complete) {
			total += 1;
		}
	}

	if (total === pageCount) {
		this.markObjectComplete(object);
	}
};

/**
 * For a given module, checks child objects.  If all children are complete, the module is marked as complete
 * @param {Object} module The module to check for completion
 */
DKI.DataStorage.prototype.checkModuleComplete = function (module) {
	var objCount = module.objects.length;
	var total = 0;
	for (var i = 0; i < objCount; i ++) {

		if (module.objects[i].complete) {
			total += 1;
		}
	}

	if (total === objCount) {
		this.markModuleComplete(module);
	}
};

/**
 * Checks all modules.  If all are complete, then fires the course complete event.
 *
 * Fires
 *
 * - DKI.DataStorage.events.courseCompleted
 */
DKI.DataStorage.prototype.checkCourseComplete = function () {
	var modCount = this.courseStructure.modules.length;
	var total = 0;
	for (var i = 0; i < modCount; i ++) {
		if (this.courseStructure.modules[i].complete) {
			total += 1;
		}
	}

	if (total === modCount) {
		$(this).trigger(DKI.DataStorage.events.courseCompleted);
		this.doSetCourseComplete();
	}
};

/**
 * Returns a count of the total number of pages in the course
 * @returns Integer The number of pages in the course.
 */
DKI.DataStorage.prototype.countCoursePages = function () {
	var pageCount = 0;
	for (var i = 0; i < this.courseStructure.modules.length; i += 1) {
		pageCount += this.countModulePages(this.courseStructure.modules[i]);
	}

	return pageCount;
};

/**
 * Returns the number of pages in a module
 * @param {Object} module 
 * @returns {number} The number of
 */
DKI.DataStorage.prototype.countModulePages = function (module) {
	var pageCount = 0;
	for (var i = 0; i < module.objects.length; i++) { 
		pageCount += module.objects[i].subeos.length;
	}

	return pageCount;
};


/**
 * Creates a preTest attempt for a module. This is the same as calling
 * {@link DKI.DataStorage#createTest} with the prePost parameter 'pre'.
 * @param {String} moduleID String
 */
DKI.DataStorage.prototype.createPreTest = function (moduleID) {
	this.createTest(moduleID, "pre");
};

/**
 * Creates a postTest attempt for a module. This is the same as calling
 * {@link DKI.DataStorage#createTest} with the prePost parameter 'post'
 * @param {String} moduleID
 */
DKI.DataStorage.prototype.createPostTest = function (moduleID) {
	this.createTest(moduleID, "post");
};

/**
 * Creates a test attempt for a module
 * @param {String} moduleID
 * @param {String} prePost one of "pre" or "post"
 */
DKI.DataStorage.prototype.createTest = function (moduleID, prePost) {
	var module = typeof moduleID === "object" ? moduleID : this.findModule(moduleID);
	var test = this.loadTest(module);
	var canTest = true;

	if (prePost === "pre") {
		if (this.remainingPreAttempts(module) > 0) {
			module.pre = {
				attempts: 1,
				weight: null,
				points: 0,
				score: 0
			};
		}
		else {
			canTest = false;
		}
	}
	else {
		if (this.remainingPostAttempts(module) > 0) {
			if (module.post) {
				module.post.attempts++;
			}
			else {
				module.post = {
					attempts: 1,
					weight: null,
					points: 0,
					score: 0
				};
			}
		}
		else {
			canTest = false;
		}
	}

	if (canTest) {
		this.assessment = this.createAssessment(module, prePost, test);
		$(this).trigger(DKI.DataStorage.events.assessmentReady);
		$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
	}
	else {
		$(this).trigger(DKI.DataStorage.events.attemptsMaxed);
	}
};

/**
 * Creates an assessment review object for a given assessment
 *
 * Fires
 *
 * - DKI.DataStorage.events#assessmentReady
 * - DKI.DataStorage.events#questionSelected
 * @param {Object} assessment The assessment to review. Fires
 */
DKI.DataStorage.prototype.createReview = function (assessment) {
	//testing to see if we are reviewing a review.
	if(assessment.test){
		assessment = assessment.test;
	}
	this.assessment = new DKI.AssessmentReview(assessment);
	$(this).trigger(DKI.DataStorage.events.assessmentReady);
	$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
};


/**
 * Takes an element Id and returns the element object
 * @param {String} elementID
 * @returns {Object}
 */
DKI.DataStorage.prototype.getElement = function (elementID) {
	return this.store.elements[elementID];
};

/**
 * Takes a group Id and returns the group object
 * @param {String} groupID
 * @returns {Object}
 */
DKI.DataStorage.prototype.getGroup = function (groupID) {
	return this.store.groups[groupID];
};

/**
 * Takes an asset id and returns the asset object
 * @param {String} assetID
 * @returns {Object}
 */
DKI.DataStorage.prototype.getAsset = function (assetID) {
	return this.store.assets[assetID];
};

/**
 * Takes a page ID and returns the corresponding page object
 * @param {String} pageID
 * @returns {Object}
 */
DKI.DataStorage.prototype.findPage = function (pageID) {
	var currentMod, currentObj;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				if (currentObj.subeos[k].page.pageid == pageID) {
					return currentObj.subeos[k].page;
				}
			}
		}
	}
};

/**
 * Takes a subeo ID and returns the corresponding subeo object
 * @param {String} sueoID
 * @returns {Object}
 */
DKI.DataStorage.prototype.findSubeo = function (subeoID) {
	var currentMod, currentObj;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				if (currentObj.subeos[k].subeoid == subeoID) {
					return currentObj.subeos[k];
				}
			}
		}
	}
};

/**
 * Takes a page ID and returns the corresponding subeo Object
 * @param {String} pageID
 * @returns {Object}
 */
DKI.DataStorage.prototype.getSubeoFromPage = function (pageID) {
	var currentMod, currentObj;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				if (currentObj.subeos[k].page.pageid == pageID) {
					return currentObj.subeos[k];
				}
			}
		}
	}
};

/**
 * Takes a subeoID and returns the corresponding page object
 * @param {String} subeoId
 * @returns {Object}
 */
DKI.DataStorage.prototype.getPageFromSubeo = function (subeoId) {
	var currentMod, currentObj;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				if (currentObj.subeos[k].subeoid == subeoId) {
					return currentObj.subeos[k].page;
				}
			}
		}
	}
};

DKI.DataStorage.prototype.getModuleEnd = function (module) {
	var objInd;
	var pageInd;
	if (typeof module === "string" || typeof module === "number") {
		module = this.findModule(module);
	}

	objInd = module.objects.length - 1;
	pageInd = module.objects[objInd].subeos.length - 1;

	return module.objects[objInd].subeos[pageInd];
};

DKI.DataStorage.prototype.getUserID = function () {
	return "N/A";
};

/**
 * Takes an objectID and returns the corresonping learning object
 * @param {String} objectID
 * @returns {Object}
 */
DKI.DataStorage.prototype.findObject = function (objectID) {
	var currentMod;

	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			if (currentMod.objects[j].objectid == objectID) {
				return currentMod.objects[j];
			}
		}
	}
};

/**
 * Takes a moduleID and returns the corresponding module object
 * @param {String} moduleID
 * @returns {Object}
 */
DKI.DataStorage.prototype.findModule = function (moduleID) {
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		if (this.courseStructure.modules[i].loid == moduleID) {
			return this.courseStructure.modules[i];
		}
	}
};

/**
 * Takes a moduleID or module object, and return's it's index within a course
 * @param {String|Object} module The module Id, or the actual module object
 * @returns {Number}
 */
DKI.DataStorage.prototype.findModuleIndex = function (module) {
	if (typeof module === "object") {
		module = module.loid;
	}
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		if (this.courseStructure.modules[i].loid == module) {
			return i;
		}
	}
};


/**
 * Returns the score of the current assessment
 * @returns Integer
 */
DKI.DataStorage.prototype.getAssessmentScore = function () {
	if (this.assessment) {
		return this.assessment.getScore();
	}
	else {
		return null;
	}
};

/**
 * Returns the scoring details of the current assessment
 * @returns Object
 */
DKI.DataStorage.prototype.getAssessmentScoringDetails = function () {
	if (this.assessment) {
		return {
			score: this.assessment.getScore(),
			points: this.assessment.getPoints(),
			weight: this.assessment.getWeight()
		};
	}
	else {
		return null;
	}
};

/**
 * Returns the percentage of the course currently completes, as a function of total pages
 * @param {Boolean} includeTesting Whether or not to include testing with the completion calculation
 * @returns Integer
 */
DKI.DataStorage.prototype.getCourseCompletion = function (includeTesting) {
	var pageCount = 0;
	var completePages = 0;
	var currentModule, currentObject;	

	if (
		(this.courseStructure.complete && !includeTesting) //learning is done, and we dont include testing in the check
		|| (this.courseStructure.testOnly == "1" && this.allTestsAttempted() && this.isPassed()) //test only course and all tests attempted and passed
		|| ((this.courseStructure.complete || this.behaviour.completionCriteria == "testing") && includeTesting && this.allTestsAttempted() && this.isPassed()) //learning is done, testing's incldued and the tests are passed.
	) {
		return 100;
	}
	else {
		for (var i = 0; i < this.courseStructure.modules.length; i ++) {
			currentModule = this.courseStructure.modules[i];
			//add learning to the completion calculation
			for (var j = 0; j < currentModule.objects.length; j ++) {
				currentObject = currentModule.objects[j];
				pageCount += currentObject.subeos.length;
				if (currentObject.complete || currentModule.complete) {
					completePages += currentObject.subeos.length;
				}
				else {
					for (var k = 0; k < currentObject.subeos.length; k ++) {
						if (currentObject.subeos[k].complete) {
							completePages ++;
						}
					}
				}
			}
			if((includeTesting || this.courseStructure.testOnly == "1") && this.moduleHasTest(currentModule)){
				var details = this.getModuleScoringDetails(currentModule);
				var totalQuestions = this.loadTest(currentModule).questions.length;
				pageCount += totalQuestions;
				if(details.passed){
					completePages += totalQuestions;
				}
			}
		}
		
		if(includeTesting || this.courseStructure.testOnly == "1"){
			if(this.behaviour.completionCriteria == "testing"){
				//if we only cast about testing for completion and we're including testing in the calculation, reset pages
				pageCount = 0;
				completePages = 0;
			}
			for (var i = 0; i < this.courseStructure.modules.length; i ++) {
				currentModule = this.courseStructure.modules[i];
				if(this.moduleHasTest(currentModule)){
					var details = this.getModuleScoringDetails(currentModule);
					var totalQuestions = this.loadTest(currentModule).questions.length;
					pageCount += totalQuestions;
					if(details.passed){
						completePages += totalQuestions;
					}
				}
			}
		}
		if(pageCount == 0 && completePages == 0){
			return 0;
		}
		
		return Math.round((completePages / pageCount) * 100000) / 1000;
	}
};

/**
 * Returns the current score (as a percentage) for all course assessments
 * @returns Integer
 */
DKI.DataStorage.prototype.getCourseScore = function () {
	if (!this.hasTesting()) {
		return null;
	}
	else {
		return this.getCourseScoringDetails().score;
	}
};

/**
 * Returns the the details for all course assessments
 * @returns Object
 */
DKI.DataStorage.prototype.getCourseScoringDetails = function () {
	var points = parseFloat(0, "10");
	var weight = 0;
	var score = 0;
	var currentModDetails;
	for (var i = 0; i < this.courseStructure.modules.length; i++) {
		currentModDetails = this.getModuleScoringDetails(this.courseStructure.modules[i]);
		weight += currentModDetails.weight;
		points += currentModDetails.points;
	}
	points = parseFloat(points.toFixed(1), 10);
	if (points > 0 && weight > 0) {
		score = parseInt((points / weight) * 100, 10);
	}
	else{
		score = 0;
	}
	return {
		score: score,
		weight: weight,
		points: points
	};
};

/**
 * Returns the current score (as a percentage) for all currently attempted course assessments
 * @returns Integer
 */
DKI.DataStorage.prototype.getCourseScoreAvg = function () {
	if (this.hasTesting) {
		return this.getCourseScoringDetails().score;
	}
	else {
		return null;
	}
};

DKI.DataStorage.prototype.getContentVariable = function (name) {
	return this.contentVariables[name];
};

DKI.DataStorage.prototype.setContentVariable = function (name, value) {	
	this.contentVariables[name] = value;	
};

DKI.DataStorage.prototype.getContentVariable = function (name) {
	return this.contentVariables[name];
};

DKI.DataStorage.prototype.setContentVariable = function (name, value) {	
	this.contentVariables[name] = value;	
};

/**
 * Returns the current question
 * @return Object
 */
DKI.DataStorage.prototype.getCurrentQuestion = function () {
	if (this.assessment && this.assessment.currentQuestion) {
		return this.assessment.currentQuestion;
	}
};

DKI.DataStorage.prototype.getNextQuestion = function () {
	if (this.assessment) {
		return this.assessment.nextQuestion;
	}
};

DKI.DataStorage.prototype.getPreviousQuestion = function () {
	if (this.assessment) {
		return this.assessment.previousQuestion;
	}
};

/**
 * Returns the current question number
 * @return Integer
 */
DKI.DataStorage.prototype.getCurrentQuestionCount = function () {
	if (this.assessment) {
		return this.assessment.currentQuestionCount;
	}
};

/**
 * Calculates/returns the percentage of the moudle currently complete, as a function of the total number of pages
 * @param {Object|Number|String} module  The module to calculate completion for
 * @returns {Number} Between 0 and 100 (inclusive)
 */
DKI.DataStorage.prototype.getModuleCompletion = function (module) {
	var pageCount = 0;
	var completePages = 0;
	if (typeof module === "number" || typeof module === "string") {
		module = this.findModule(module);
	}

	if (module.complete) {
		return 100;
	}
	else {
		for (var i = 0; i < module.objects.length; i ++) {
			pageCount += module.objects[i].subeos.length;
			if (module.objects[i].complete) {
				completePages += module.objects[i].subeos.length;
			}
			else {
				for (var j = 0; j < module.objects[i].subeos.length; j ++) {
					if (module.objects[i].subeos[j].complete) {
						completePages ++;
					}
				}
			}
		}

		return Math.round((completePages / pageCount) * 100000) / 1000;
	}
};

/**
 * Returns the score for the module.  If both a pre and post test are recorded, returns whichever is larger
 * @param {Object|Number|String} module
 * @returns {Number}
 */
DKI.DataStorage.prototype.getModuleScore = function (module) {
	var score = null;
	if (typeof module === "number" || typeof module === "string") {
		//Simple value, get the module object
		module = this.findModule(module);
	}
	if (module.pre) {
		score = module.pre;
	}
	if (module.post) {
		if (score && module.post.score > score || !score) {
			score = module.post.score;
		}
	}

	return score;
};

/**
 * Returns the scoring details for the module.  If both a pre and post test are recorded, returns whichever score is larger
 * @param {Object|Number|String} module
 * @returns Object
 */
DKI.DataStorage.prototype.getModuleScoringDetails = function (module) {
	var score = null;
	var points = 0;
	var weight = null;
	var passed = null;
	if (typeof module === "number" || typeof module === "string") {
		//Simple value, get the module object
		module = this.findModule(module);
	}
	if (module.pre) {
		score = module.pre.score;
		points = module.pre.points;
		weight = module.pre.weight;
	}
	if (module.post) {
		if (score && module.post.score > score || !score) {
			score = module.post.score;
			points = module.post.points;
			weight = module.post.weight;			
		}
	}
	if (weight === 0) {
		passed = true;
	}
	else if (module.passMark) {
		passed = score >= module.passMark;
	}
	else {
		passed = score >= this.passMark;
	}

	return {
		score: score,
		points: parseFloat(points.toFixed(1), 10),
		weight: weight,
		passed: passed
	};
};

/**
 * Returns the module that precedes the current module
 * @return {Object}
 */
DKI.DataStorage.prototype.getPreviousModule = function () {
	if (this.currentModuleIndex > 0) {
		return this.courseStructure.modules[this.currentModuleIndex - 1];
	}
};

/**
 * Returns the page that precedes a given page, or the current page if none given
 * @param {String} [pageID] If omitted, current page is used
 * @return {Object}
 */
DKI.DataStorage.prototype.getPrecedingPage = function (pageID) {
	var pageIndex, objectIndex, moduleIndex;
	if (pageID) {
		var indices = this.locatePage(pageID);
		pageIndex = indices.page;
		objectIndex = indices.object;
		moduleIndex = indices.module;
	}
	else {
		pageIndex = this.currentPageIndex;
		objectIndex = this.currentObjecIndex;
		moduleIndex = this.currentModuleIndex;
	}

	if (pageIndex > 0) {
		return this.courseStructure.modules[moduleIndex].objects[objectIndex].subeos[pageIndex - 1];
	}
	else if (objectIndex > 0) {
		objectIndex --;
		pageIndex = this.courseStructure.modules[moduleIndex].objects[objectIndex].subeos.length - 1;
		return this.courseStructure.modules[moduleIndex].objects[objectIndex].subeos[pageIndex];
	}
	else if (moduleIndex > 0) {
		moduleIndex --;
		objectIndex = this.courseStructure.modules[moduleIndex].objects.length - 1;
		pageIndex = this.courseStructure.modules[moduleIndex].objects[objectIndex].subeos.length - 1;
		return this.courseStructure.modules[moduleIndex].objects[objectIndex].subeos[pageIndex];
	}
	else {
		return null;
	}
};

/**
 * Returns the total number of questions for the current assessment
 * @return {Number}
 */
DKI.DataStorage.prototype.getTotalQuestions = function () {
	if (this.assessment) {
		return this.assessment.totalQuestions;
	}
};
/**
 * Returns the the page immediately after the current one, or null of current page is
 * end of course
 *
 * @return {Object}
 */
DKI.DataStorage.prototype.getNextPage = function () {
	var nextObject;
	var nextModule;
	if (this.currentPageIndex < (this.currentPageCount - 1)) {
		return this.currentObject.subeos[this.currentPageIndex + 1];
	}
	else if (this.currentObjectIndex < (this.currentObjectCount -1)) {
		nextObject = this.currentModule.objects[this.currentObjectIndex + 1];
		return nextObject.subeos[0];
	}
	else if (this.currentModuleIndex < (this.moduleCount - 1)) {
		nextModule = this.courseStructure.modules[this.currentModuleIndex + 1];
		nextObject = nextModule.objects[0];
		return nextObject.subeos[0];
	}
	else {
		return null;
	}
};

/**
 * Returns the the page immediately before the current one, or null of current page is
 * beginning of course
 *
 * @return {Object}
 */
DKI.DataStorage.prototype.getPreviousPage = function () {
	var pageCount;
	var objectCount;
	var prevObject;
	var prevModule;

	if (this.currentPageIndex > 0) {
		return this.currentObject.subeos[this.currentPageIndex - 1];
	}
	else if (this.currentObjectIndex > 0) {
		prevObject = this.currentModule.objects[this.currentObjectIndex - 1];
		pageCount = prevObject.subeos.length;

		return prevObject.subeos[pageCount - 1];
	}
	else if (this.currentModuleIndex > 0) {
		prevModule = this.courseStructure.modules[this.currentModuleIndex - 1];
		objectCount = prevModule.objects.length;
		prevObject = prevModule.objects[objectCount - 1];
		pageCount = prevObject.subeos.length;

		return prevObject.subeos[pageCount - 1];
	}
	else {
		return null;
	}

};

/**
 * Advances to the next page in the course, adjusting current object/module if necessary.
 *
 * Fires
 *
 * - DKI.DataStorage.events#pageSelected
 */
DKI.DataStorage.prototype.goNextPage = function () {
	if (this.currentPageIndex < (this.currentPageCount - 1)) {
		this.currentPageIndex ++;
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		this.currentModulePage ++;
		$(this).trigger(DKI.DataStorage.events.changePage, "forward");
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
	else {
		this.goNextObject();
	}
	this.previousPage = this.getPreviousPage();
	this.nextPage = this.getNextPage();
};

/**
 * Goes to the previous page in the course, adjusting current object/module if necessary
 *
 * Fires
 *
 * - DKI.DataStorage.events#pageSelected
 */
DKI.DataStorage.prototype.goPreviousPage = function () {
	if (this.currentPageIndex > 0) {
		this.currentPageIndex --;
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		this.currentModulePage --;
		$(this).trigger(DKI.DataStorage.events.changePage, "back");
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
	else {
		this.goPreviousObject();
	}
	this.previousPage = this.getPreviousPage();
	this.nextPage = this.getNextPage();
};

/**
 * Goes to the next learning object in the course, adjusting current page/module as necessary.
 *
 * Fires
 *
 * - DKI.DataStorage.events#changeObject
 * - DKI.DataStorage.events#pageSelected
 */
DKI.DataStorage.prototype.goNextObject = function () {
	if (this.currentObjectIndex < (this.currentObjectCount - 1)) {
		this.currentObjectIndex ++;
		this.currentPageIndex = 0;
		this.currentObject = this.currentModule.objects[this.currentObjectIndex];
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		this.currentModulePage ++;
		this.currentPageCount = this.currentObject.subeos.length;
		$(this).trigger(DKI.DataStorage.events.changeObject, "forward");
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
	else {
		this.goNextModule();
	}
};

/**
 * Goes to the previous learning object in the course, adjusting current page/module as necessary.
 *
 * Fires
 *
 * - DKI.DataStorage.events#changeObject
 * - DKI.DataStorage.events#pageSelected
 */
DKI.DataStorage.prototype.goPreviousObject = function () {
	if (this.currentObjectIndex > 0) {
		this.currentObjectIndex --;
		this.currentObject = this.currentModule.objects[this.currentObjectIndex];
		this.currentModulePage --;
		this.currentPageCount = this.currentObject.subeos.length;
		this.currentPageIndex = this.currentPageCount - 1;
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		$(this).trigger(DKI.DataStorage.events.changeObject, "back");
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
	else {
		this.goPreviousModule();
	}
};

/**
 * Goes to the next module in the course.
 *
 * Fires
 *
 * - DKI.DataStorage.events#changeModule
 * - DKI.DataStorage.events#pageSelected
 * - DKI.DataStorage.events#courseEnd
 */
DKI.DataStorage.prototype.goNextModule = function () {
	var hasTesting = false;
	if (this.currentModuleIndex < (this.moduleCount - 1)) {
		this.currentModuleIndex++;
		this.currentObjectIndex = 0;
		this.currentPageIndex = 0;
		this.currentModule = this.courseStructure.modules[this.currentModuleIndex];
		this.currentObject = this.currentModule.objects[this.currentObjectIndex];
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		this.currentObjectCount = this.currentModule.objects.length;
		this.currentPageCount = this.currentObject.subeos.length;
		this.currentModulePage = 1;
		this.currentModulePageTotal = this.countModulePages(this.currentModule);
		$(this).trigger(DKI.DataStorage.events.changeModule, "forward");
		if (this.currentPage) {
			$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
		}

		return true;
	}else {
		if (this.currentModuleIndex == this.courseStructure.modules.length-1 &&
			this.moduleHasTest(this.currentModule)){
			hasTesting = true;
			this.currentModuleIndex += 1;
		}

		$(this).trigger(DKI.DataStorage.events.courseEnd, hasTesting);
		return false;
	}
};

/**
 * Returns the next module, if there is one.  NULL otherwise
 * @returns [Object|null]
 */
DKI.DataStorage.prototype.getNextModule = function (module) {
	var modIndex = this.currentModuleIndex;

	if (module) {
		modIndex = this.findModuleIndex(module);
	}

	if (modIndex < (this.moduleCount - 1)) {
		return this.courseStructure.modules[modIndex + 1];
	}
	else {
		return null;
	}
};

/**
 * Goes to the previous module in the course, adjusting current object/page.
 *
 * Fires
 *
 * - DKI.DataStorage.events#changeModule
 *   if current module was not the first in the course.
 *
 * - DKI.DataStorage.events#pageSelected
 *   if current module was not the first in the course.
 */
DKI.DataStorage.prototype.goPreviousModule = function () {
	if (this.currentModuleIndex > 0) {
		this.currentModuleIndex --;
		this.currentModule = this.courseStructure.modules[this.currentModuleIndex];
		this.currentModulePageTotal = this.countModulePages(this.currentModule);
		this.currentModulePage = this.currentModulePageTotal;
		this.currentObjectCount = this.currentModule.objects.length;
		this.currentObjectIndex = this.currentObjectCount - 1;
		this.currentObject = this.currentModule.objects[this.currentObjectIndex];
		this.currentPageCount = this.currentObject.subeos.length;
		this.currentPageIndex = this.currentPageCount - 1;
		this.currentPage = this.currentObject.subeos[this.currentPageIndex];
		$(this).trigger(DKI.DataStorage.events.changeModule, "back");
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
};

/**
 * Goes to the next question in the current assessment.
 *
 * Fires
 *
 * - DKI.DataStorage.events#questionSelected
 *   if there is another question to display.
 * - DKI.DataStorage.events#assessmentCompleted
 *   if the last question in the assessment was completed
 */
DKI.DataStorage.prototype.goNextQuestion = function () {
	if (this.assessment) {
		this.assessment.goNextQuestion();
	}

	if (this.assessment.currentQuestion) {
		$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
	}
	else {
		//Need to set the actual assessment for the module end screen
		if (this.assessment.test !== null && this.assessment.test !== undefined) {
			//This.assessment is actually an assessment review
			this.assessment = this.assessment.test;
		}
		$(this).trigger(DKI.DataStorage.events.assessmentCompleted);
	}
};

/**
 * Goes to the previous question in the assessment.
 *
 * Fires
 *
 * - DKI.DataStorage.events.questionSelected
 *   if there is a question to display.
 *
 * - DKI.DataStorage.events.assessmentCompleted
 *   if the assessment was finished.
 */
DKI.DataStorage.prototype.goPreviousQuestion = function () {
	if (this.assessment) {
		this.assessment.goPreviousQuestion();
	}

	if (this.assessment.currentQuestion) {
		$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
	}
	else {
		//Need to set the actual assessment for the module end screen
		if (this.assessment.test !== null && this.assessment.test !== undefined) {
			//This.assessment is actually an assessment review
			this.assessment = this.assessment.test;
		}
		$(this).trigger(DKI.DataStorage.events.assessmentCompleted);
	}
};

/**
 * Returns true if the course has any testing associated with it
 * @return Boolean
 */
DKI.DataStorage.prototype.hasTesting = function () {
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		if (this.courseStructure.modules[i].weight > 0) {
			return true;
		}
	}

	return false;
};

/**
 * Initializes event handlers
 */
DKI.DataStorage.prototype.initEvents = function () {
	var that = this;
	$(this).bind(DKI.DataStorage.events.courseCompleted, function () {
		that.onCourseComplete();
	});
	$(this).on(DKI.DataStorage.events.assessmentCompleted, function (e) {
		that.onAssessmentComplete(e);
	});
};

/**
 * Initializes the course structure.  Sets module weight to 1 or 0 depending on whether the module has any
 * testing associated
 * @param {Object} Object
 */
DKI.DataStorage.prototype.initStructure = function (courseStructure) {
	for (var i = 0; i < courseStructure.modules.length; i ++) {
		if (this.moduleHasTest(courseStructure.modules[i])) {
			courseStructure.modules[i].weight = 1;
		}
		else {
			courseStructure.modules[i].weight = 0;
		}
	}

	return courseStructure;
};

/**
 * Returns true if the current page is the last of it's module, false otherwise.
 * @return {Boolean}
 */
DKI.DataStorage.prototype.isEndOfModule = function () {
	return (this.currentModulePage === this.currentModulePageTotal);
};

/**
 * Returns true if the current page is the last in the course, false otherwise.
 */
DKI.DataStorage.prototype.isEndOfCourse = function () {
	return (this.isEndOfModule() && this.currentModuleIndex === (this.moduleCount - 1));
};

/**
 * Returns true if the given module's tests are maxed out
 * @param {Object} module The module to test
 * @return {Boolean}
 */
DKI.DataStorage.prototype.isMaxedOut = function (module) {
	var allowedAttempts = 1;
	if (typeof module === "string" || typeof module === "number") {
		module = this.findModule(module);
	}
	if (this.behaviour.allowRetesting) {
		allowedAttempts += parseInt(this.behaviour.retestAttempts, "10");
	}
	return !(!module.post || module.post.attempts < allowedAttempts || (this.behaviour.allowRetesting && this.behaviour.retestAttempts === 0));
};

/**
 * Returns true if all the criteria for a passing status are met
 * @return {Boolean}
 */
DKI.DataStorage.prototype.isPassed = function (scoringDetails) {
	if (!scoringDetails) {
		scoringDetails = this.getCourseScoringDetails();
	}
	var passed = false;
	var modulesPassed = true;
	var moduleDetails;
	if (scoringDetails.score >= this.passMark && this.allTestsAttempted()) {
		if (this.behaviour.passModules) {
			for (var i = 0; i < this.courseStructure.modules.length; i += 1) {
				moduleDetails = this.getModuleScoringDetails(this.courseStructure.modules[i]);
				if (this.courseStructure.modules[i].weight > 0 && !moduleDetails.passed) {
					modulesPassed = false;
					break;
				}
			}
			passed = modulesPassed;
		}
		else {
			passed = true;
		}
	}
	return passed;
};

/**
 * Returns true if all the criteria for a failed status are met
 * @return {Boolean}
 */
DKI.DataStorage.prototype.isFailed = function (scoringDetails) {
	if (!scoringDetails) {
		scoringDetails = this.getCourseScoringDetails();
	}
	return scoringDetails.score < this.passMark && this.testMaxedOut();
};

/**
 * Jumps to the first page of a given module
 * @param {Object|Number|String} The module object, or it's ID
 */

DKI.DataStorage.prototype.jumpToModule = function(module) {
	if (typeof module !== "object") {
		module = this.findModule(module);
	}
	if (!module) {
		return false;
	}
	this.currentModule = module;
	this.currentModuleIndex = this.findModuleIndex(module);
	if (!this.courseStructure.testonly) {
		this.currentObject = module.objects[0];
		this.currentObjectIndex = 0;
		this.currentPage = this.currentObject.subeos[0];
		this.currentPageIndex = 0;
		this.currentModulePageTotal = this.countModulePages(this.currentModule);
		this.currentModulePage = 1;
		this.currentObjectCount = this.currentModule.objects.length;
		this.currentPageCount = this.currentObject.subeos.length;
		this.previousPage = this.getPreviousPage();
		this.nextPage = this.getNextPage();
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
	else {
		this.currentObject = null;
		this.currentObjectIndex = null;
		this.currentPage = null;
		this.currentPageIndex = null;
	}

	$(this).trigger(DKI.DataStorage.events.changeModule, "jump");
	return true;

};
/**
 * Jumps directly to a given page
 * @param {String} pageID
 */
DKI.DataStorage.prototype.jumpToPage = function (page) {
	var currentMod, currentObj;
	var currentScreen = 0;
	var pageID = typeof page === "object" ? page.pageid : page;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		currentScreen = 0;
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				currentScreen ++;
				if (currentObj.subeos[k].page.pageid == pageID) {
					this.currentPageIndex = k;
					this.currentPage = currentObj.subeos[k];
					this.currentObjectIndex = j;
					this.currentObject = currentObj;
					this.currentModuleIndex = i;
					this.currentModule = currentMod;
					this.currentModulePageTotal = this.countModulePages(this.currentModule);
					this.currentModulePage = currentScreen;
					this.currentObjectCount = this.currentModule.objects.length;
					this.currentPageCount = this.currentObject.subeos.length;
					this.previousPage = this.getPreviousPage();
					this.nextPage = this.getNextPage();
					$(this).trigger(DKI.DataStorage.events.changeModule, "jump");
					$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
					return true;
				}
			}
		}
	}
};

/**
 * Loads the stored completion information, if there is any.
 *
 * Fires
 *
 * - DKI.DataStorage.events#pageSelected
 * - DKI.DataStorage.events#ready
 */
DKI.DataStorage.prototype.loadCompletion = function () {
	//TODO: Load last location from local storage, if supported in the current browser
	//If a hash was provided in the URL, start there
	var urlParams = DKI.uri.decodeCurrentLocation();
	if (window.location.hash !== "") {
			this.bookmark = window.location.hash.replace("#page", "");
	}
	else if (urlParams.pageID) {
			this.bookmark = urlParams.pageID;
	}
	this.initEvents();
	$(this).trigger(DKI.DataStorage.events.beforeReady);
	$(this).trigger(DKI.DataStorage.events.ready);
};

/**
 * Sets all pages preceding the given to 'complete'
 * @param {Number | String | Object} page  The page, or it's Id
 */
DKI.DataStorage.prototype.completePreviousPages = function (page) {
	if (typeof page === "string" || typeof page === "number") {
		page = this.findPage(page);
	}
	var currentMod, currentObj;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObj = currentMod.objects[j];
			for (var k = 0; k < currentObj.subeos.length; k ++) {
				if (currentObj.subeos[k].page.pageid != page.pageid) {
					this.markSubeoComplete(currentObj.subeos[k]);
				}
				else{
					return null;
				}
			}
			this.markObjectComplete(currentObj);
		}
		this.markModuleComplete(currentMod);
	}
};

/**
 * Sets a subeo to complete, will set the parent object to complete if appropriate
 *
 * Fires
 *
 * - DKI.DataStorage.events#pageCompleted
 * @param {Number | String | Object} subeo The subeo, or it's Id
 */
DKI.DataStorage.prototype.markSubeoComplete = function (subeo) {
	var parentObject;
	if (typeof subeo === "string" || typeof subeo === "number") {
		subeo = this.findSubeo(subeo);
	}
	this.doSetPageComplete(subeo);
	subeo.complete = true;
	parentObject = this.findObject(subeo.objectid);
	parentObject.started = true;
	$(this).trigger(DKI.DataStorage.events.pageCompleted, subeo.page.pageid);
	this.checkObjectComplete(parentObject);
};

/**
 * Sets an object to complete, will set the parent module to complete if appropriate.
 *
 * Fires
 *
 * - DKI.DataStorage.events#objectCompleted
 * @param {Number | String | Object} object The object, or it's Id
 */
DKI.DataStorage.prototype.markObjectComplete = function (object) {
	var parentModule;
	if (typeof object === "string" || typeof object === "number") {
		object = this.findObject(object);
	}
	this.doSetObjectComplete(object);
	parentModule = this.findModule(object.moduleid);
	parentModule.started = true;
	$(this).trigger(DKI.DataStorage.events.objectCompleted, object.objectid);
	this.checkModuleComplete(this.findModule(object.moduleid));
};

/**
 * Sets a module to complete, will set course completion if necessary
 *
 * Fires
 *
 * - DKI.DataStorage.events#moduleCompleted
 * @param {Number | String | Object} module The module, or it's Id
 */
DKI.DataStorage.prototype.markModuleComplete = function (module) {
	if (typeof module === "string" || typeof module === "number") {
		module = this.findModule(module);
	}
	this.doSetModuleComplete(module);
	$(this).trigger(DKI.DataStorage.events.moduleCompleted, module.loid);
	this.checkCourseComplete();
};

/**
 * Returns true if the given module has testing
 * @param {Object} module
 * @returns {Boolean}
 */
DKI.DataStorage.prototype.moduleHasTest = function (module) {
	for (var i = 0; i < module.objects.length; i ++) {
		if (module.objects[i].randQuest !== 0 && module.objects[i].questions.length > 0) {
			return true;
		}
	}

	return false;
};

/**
 * Returns array of all modules that have had testing (pre or post) attempted
 * @returns {Object[]} Array of module objects that have had testing attempted.
 */
DKI.DataStorage.prototype.modulesTestAttempted = function () {
	var mods = this.modulesWithTesting();
	var attempted = [];
	for (var i = 0; i < mods.length; i ++) {
		if (typeof(mods[i].pre) == "object" || typeof(mods[i].post) == "object") {
			attempted[attempted.length] = mods[i];
		}
	}

	return attempted;
};

/**
 * Returns array of module objects in the course that have testing
 * @returns {Object[]}
 */
DKI.DataStorage.prototype.modulesWithTesting = function () {
	var mods = [];
	for (var i = 0; i < this.courseStructure.modules.length; i++) {
		if (this.courseStructure.modules[i].weight > 0) {
			mods[mods.length] = this.courseStructure.modules[i];
		}
	}

	return mods;
};

/**
 * Returns the number of remaining preTest attempts for a given module
 * @param {Number | String | Object} module The module, or it's Id
 * @returns {Number}
 */
DKI.DataStorage.prototype.remainingPreAttempts = function (module) {
	if (!this.behaviour.enablePreTest) {
		return 0;
	}
	else {
		if (typeof module === "string" || typeof module === "number") {
			module = this.findModule(module);
		}
		if (module.weight === 0) {
			return 0;
		}
		if (module.pre || this.getModuleCompletion(module) > 0) {
			return 0;
		}
	}

	return 1;
};

/**
 * Returns the number of remaining postTest attempts for a given module
 * @param {Number | String | Object} module The module, or it's Id
 * @returns {Number}
 */
DKI.DataStorage.prototype.remainingPostAttempts = function (module) {
	var allowedAttempts;
	var takenAttempts = 0;
	if (!this.behaviour.enablePostTest) {
		return 0;
	}
	else {
		if (typeof module === "string" || typeof module === "number") {
			module = this.findModule(module);
		}
		if (module.weight === 0) {
			return 0;
		}
		if (!this.behaviour.allowRetesting) {
			allowedAttempts = 1;
		}
		else {
			allowedAttempts = parseInt(this.behaviour.retestAttempts, 10) + 1;
		}
		if (module.post) {
			takenAttempts = module.post.attempts;
		}

		allowedAttempts = allowedAttempts - takenAttempts;

		if (allowedAttempts < 0) {
			allowedAttempts = 0;
		}
		if(this.behaviour.allowRetesting && this.behaviour.retestAttempts == "0"){
			allowedAttempts = 1;
		}
		return allowedAttempts;
	}
};

/**
 * When player is intialized, this call will jump to the bookmark based on autoResume.
 *
 * Fires
 *
 * - DKI.DataStorage.events#resume
 * @param {String} autoResume If 'on', will jump automatically. If 'prompt', will prompt the user to jump.
 */
DKI.DataStorage.prototype.resume = function (autoResume) {
	if (this.bookmark && (autoResume === "on" || (autoResume === "prompt" && window.confirm(this.strings.iResume)))) {
		this.jumpToPage(this.bookmark);
	}
	else {
		$(this).trigger(DKI.DataStorage.events.pageSelected, this.currentPage);
	}
};

/**
 * Sets the current page to complete.
 * See DKI.DataStorage#markSubeoComplete
 */
DKI.DataStorage.prototype.setCurrentPageComplete = function () {
	this.markSubeoComplete(this.currentPage);
};

/**
 * Sets the current object to complete.
 * See DKI.DataStorage#markObjectComplete
 */
DKI.DataStorage.prototype.setCurrentObjectComplete = function () {
	this.markObjectComplete(this.currentObject);
};

/**
 * Sets a page to complete.
 * See DKI.DataStorage#markSubeoComplete
 * @param {String} pageID
 */
DKI.DataStorage.prototype.setPageComplete = function (pageID) {
	var subeo = this.getSubeoFromPage(pageID);
	if (subeo) {
		this.markSubeoComplete(subeo);
	}
};

/**
 * Sets an object to complete.
 * See DKI.DataStorage#markObjectComplete
 * @param {String} objectID
 */
DKI.DataStorage.prototype.setObjectComplete = function (objectID) {
	var object = this.findObject(objectID);
	if (object) {
		this.markObjectComplete(object);
	}
};

/**
 * Sets a module to complete
 * @param moduleID
 */
DKI.DataStorage.prototype.setModuleComplete = function (moduleID) {
	var module = this.findModule(moduleID);
	if (module) {
		this.markModuleComplete(module);
	}
};

/**
 * Submits the current question, for the current assessment
 * @param {Object} questionObject The question object to submit
 * @param {Number} questionObject.id
 * @param {Object[]} questionObject.options
 */
DKI.DataStorage.prototype.submitCurrentQuestion = function (questionObject, score) {
	var score = typeof score === "undefined" ? 0 : score;
	if (this.assessment) {
		var question = this.assessment.currentQuestion;
		score = DKI.Marker.scoreQuestion(question, questionObject.options, score);
		this.assessment.scoreQuestion(question, questionObject, score);
		$(this).trigger(DKI.DataStorage.events.questionSubmitted, score);
		if (this.assessment.currentQuestion) {
			$(this).trigger(DKI.DataStorage.events.questionSelected, this.assessment.currentQuestion);
		}
		else if(this.assessment.unanswered.length === 0){
			if (this.assessment.prepost === "pre") {
				this.assessment.module.pre.score = this.assessment.getScore();
				this.assessment.module.pre.points = parseFloat(this.assessment.getPoints(), "10");
				this.assessment.module.pre.weight = this.assessment.getWeight();
			}
			else {
				this.assessment.module.post.score = this.assessment.getScore();
				this.assessment.module.post.points = parseFloat(this.assessment.getPoints(), "10");
				this.assessment.module.post.weight = this.assessment.getWeight();
			}
			$(this).trigger(DKI.DataStorage.events.assessmentCompleted);
		}
	}
	return score;
};

/**
 * Returns true if all test attempts are maxed out
 * @returns true
 */
DKI.DataStorage.prototype.testMaxedOut = function () {
	var totalTests = 0;
	var completedTests = 0;
	var allowedAttempts = 1;
	var i;
	if (!this.hasTesting() || !(this.behaviour.enablePreTest || this.behaviour.enablePostTest)) {
		return true;
	}
	else if (this.hasTesting()) {
		if (this.behaviour.enablePreTest && !this.behaviour.enablePostTest) {
			for (i = 0; i < this.courseStructure.modules.length; i ++) {
				if (this.courseStructure.modules[i].weight > 0) {
					totalTests ++;
					if (this.courseStructure.modules[i].pre || this.getModuleCompletion(this.courseStructure.modules[i]) > 0) {
						completedTests ++;
					}
				}
			}
		}
		else {
			if (this.behaviour.allowRetesting) {
				allowedAttempts += parseInt(this.behaviour.retestAttempts, 10);
			}
			for (i = 0; i < this.courseStructure.modules.length; i ++) {
				if (this.courseStructure.modules[i].weight > 0) {
					totalTests ++;
					if (this.courseStructure.modules[i].post && this.courseStructure.modules[i].post.attempts >= allowedAttempts) {
						completedTests ++;
					}
				}
			}
		}
	}

	return totalTests === completedTests;
};

// 'Helper' methods, not intended to be called outside of the object
/**
 * Returns an object representing the test questions
 * @returns object
 */
DKI.DataStorage.prototype.loadTest = function (module) {
	var testObject = {questions: []};
	var moduleObjects = module.objects.slice();
	var objectCount = moduleObjects.length;
	var randIndex;
	//randomize the LO's for the module
	for (var i = 0; i < objectCount; i ++) {
		randIndex = Math.floor(Math.random() * moduleObjects.length);
		testObject.questions = testObject.questions.concat(this.randomQuestions(moduleObjects.splice(randIndex, 1)[0]));
	}

	return testObject;
};

DKI.DataStorage.prototype.randomQuestions = function (object) {
	var questions = [];
	var sourceQuestions = object.questions.slice();
	var randIndex;

	if ( (object.randQuest >= sourceQuestions.length 
		&& (parseInt(object.preserve_question_order, 10) === 1 || object.preserve_question_order === true) ) 
		|| this.courseStructure.isDebug ) {
		
		return sourceQuestions;
	}
	else {
		for (var i = 1; i <= object.randQuest; i ++) {
			if (sourceQuestions.length > 0) {
				randIndex = Math.floor(Math.random() * sourceQuestions.length);
				questions[questions.length] = sourceQuestions.splice(randIndex, 1)[0];
			}
			else {
				return questions;
			}
		}
	}

	return questions;
};

DKI.DataStorage.prototype.locatePage = function (pageID) {
	var indices = {
		page: 0,
		object: 0,
		module: 0
	};
	var currentMod, currentObject;

	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObject = currentMod.objects[j];
			for (var k = 0; k < currentObject.subeos.length; k ++) {
				if (currentObject.subeos[k].page.pageid === pageID) {
					indices.page = k;
					indices.object = j;
					indices.module = i;
					return indices;
				}
			}
		}
	}

	return indices;
};
/**
 * Returns the path to the specified node in the courseStructure; includes the data objects for each node
 */
DKI.DataStorage.prototype.locateObject = function(id) {
	var indices = {
		object: 0,
		module: 0
	};
	var currentMod, currentObject;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		for (var j = 0; j < currentMod.objects.length; j ++) {
			currentObject = currentMod.objects[j];
			if (currentObject.objectid === id) {
				indices.object = j;
				indices.module = i;
				return indices;
			}
		}
	}
}
DKI.DataStorage.prototype.locateModule = function(id) {
	var indices = {
		module: 0
	};
	var currentMod, currentObject;
	for (var i = 0; i < this.courseStructure.modules.length; i ++) {
		currentMod = this.courseStructure.modules[i];
		if (currentMod.loid === id) {
			indices.module = i;
			return indices;
		}
	}
}
/**
 * Marks the course and all descendants as complete
 * @private
 */
DKI.DataStorage.prototype.doSetCourseComplete = function () {
	this.courseStructure.complete = true;
	this.courseStructure.started = true;
	for (var i = 0; i < this.courseStructure.modules.length; i += 1) {
		this.doSetModuleComplete(this.courseStructure.modules[i]);
	}
};

/**
 * Marks a modules and all it's descendants as complete
 * @private
 * @param {Object} module
 */
DKI.DataStorage.prototype.doSetModuleComplete = function (module) {
	module.complete = true;
	this.doSetModuleStarted(module);
	for (var i = 0; i < module.objects.length; i += 1) {
		this.doSetObjectComplete(module.objects[i]);
	}
};

/**
 * Marks module and course as started
 * @private
 * @param {Object} module
 */
DKI.DataStorage.prototype.doSetModuleStarted = function (module) {
	module.started = true;
	this.courseStructure.started = true;
};

/**
 * Marks a learning object and all children as complete.
 * @private
 * @param {Object} object
 */
DKI.DataStorage.prototype.doSetObjectComplete = function (object) {
	object.complete = true;
	this.doSetObjectStarted(object);
	for (var i = 0; i < object.subeos.length; i += 1) {
		this.doSetPageComplete(object.subeos[i]);
	}
};

/**
 * Marks object and parent module as started
 * @private
 * @param {Object} object
 */
DKI.DataStorage.prototype.doSetObjectStarted = function (object) {
	var parentModule = this.findModule(object.moduleid);
	object.started = true;
	this.doSetModuleStarted(parentModule);
};

/**
 * Marks page as started and complete.
 * @private
 * @param {Object} subeo
 */
DKI.DataStorage.prototype.doSetPageComplete = function (subeo) {
	var parentObject = this.findObject(subeo.objectid);
	subeo.complete = true;
	subeo.started = true;
	this.doSetObjectStarted(parentObject);
};

//Event handlers functions
//
/**
 * Handles the courseComplete event
 */
DKI.DataStorage.prototype.onCourseComplete = function () {
	var scoringDetails;
	if (this.hasTesting() && (this.behaviour.enablePreTest || this.behaviour.enablePostTest)) {
		scoringDetails = this.getCourseScoringDetails();
		if (this.isPassed(scoringDetails)) {
			this.lessonStatus = "passed";
		}
		else if (this.isFailed(scoringDetails)) {
			this.lessonStatus = "failed";
		}
	}
	else  {
		this.lessonStatus = "complete";
	}
};

/**
 * Handles the assessment Complete event
 */
DKI.DataStorage.prototype.onAssessmentComplete = function () {
	if ((this.behaviour.completionCriteria == "both" && this.getCourseCompletion() === 100) || (this.behaviour.completionCriteria == "testing" && this.allTestsAttempted()) || (this.courseStructure.model_id == 5 && this.allTestsAttempted()) ) {
		$(this).trigger(DKI.DataStorage.events.courseCompleted);
	}
};
/**
 * @class DKI.DataStorage.events
 * @static
 */
DKI.DataStorage.events = {
	/**
	 * Fired when the course end is reached
	 * @event
	 */
	courseEnd: "courseEnd",
	/**
	 * Fired when the current test end is reached
	 * @event
	 */
	testEnd: "testEnd",
	/**
	 * Fired when changing pages, but stayting within the same object.
	 * Passes either 'back' or 'forward'
	 * @event 
	 * @param {String} dir The direction of change
	 */
	changePage: "changePage",
	/**
	 * Fired when changing objects withing the same module.
	 * Passes either 'back' or 'forward'
	 * @event
	 * @param {String} dir The direction of change
	 */
	changeObject: "changeObject",
	/**
	 * Fired when changing modules. Passes either 'back' or 'forward'
	 * @event
	 * @param {String} dir The direction of change
	 */
	changeModule: "changeModule",
	/**
	 * Fires when a page is completed. Passes the page Id
	 * @event
	 * @param {Number} id The Id of the page
	 */
	pageCompleted: "pageCompleted",
	/**
	 * Fires when an object is completed. Passes the Id of the object
	 * @event
	 * @param {Number} id The Id of the page
	 */
	objectCompleted: "objectCompleted",
	/**
	 * Fired whenever a module is marked complete.  Provides the id of the module.
	 * @event
	 * @param {Number} id The Id of the module
	 */
	moduleCompleted: "moduleCompleted",
	/**
	 * Fired whenever the course is completed.
	 * @event
	 */
	courseCompleted: "courseCompleted",
	/**
	 * Fired whenever the current page changes.
	 * Provides the ID of the currently selected page.
	 * @event
	 * @param {Number} id The Id of the page
	 */
	pageSelected: "pageSelected",
	/**
	 * Fired whenever the current question changes.  Provides ID of the question's page.
	 * @event
	 * @param {Number} id The Id of the question page
	 */
	questionSelected: "questionSelected",
	/**
	 * Fired whenever the current question is submitted.  Provides score of question.
	 * @event
	 * @param {Number} id The score of the question
	 */
	questionSubmitted: "questionSubmitted",
	/**
	 * Fired whenever the current assessment is completed.
	 * @event
	 */
	assessmentCompleted: "assessmentCompleted",
	/**
	 * Fired whenver a newly created asessment is in a ready state.
	 * @event
	 */
	assessmentReady: "assessmentReady",
	/**
	 * Fired when attempting to create a test whose attempts are maxed out.
	 * @event
	 */
	attemptsMaxed: "attemptsMaxed",
	/**
	 * Fired before datastorage is ready (to allow anything required components to initialize before the ready event fires).
	 * @event
	 */
	beforeReady: "beforeReady",
	/**
	 * Fired whenever datastorage is ready (previous completion/bookmark data
	 * has been loaded, player should now display the current page).
	 * @event
	 */
	ready: "ready",
	/**
	 * Fired whenever datastorage is looping through available assets
	 * @event
	 */
	assetRegistered : "assetRegistered"
};
