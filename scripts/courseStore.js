/**
 * Extends the datastore object to contained a store construct flatted to object keys
 * with attribbutes for consumption by tree and other ui elements
 * @class
 * @singleton
 */
DKI.courseStore = function(){

	var courseNode = null; // needed for initial calls

	var NodeType = {
		course	: 'course',
		module	: 'module',
		object	: 'object',
		page	: 'page',
		question: 'question'
	}; //-> end NodeType

	/**
	 * Returns the base node configuration. Constructed internally, no
	 * public access to the constructor
	 * @class DKI.courseStore.baseClass
	 * @private
	 */
	var baseClass = function (){
		return {
			/**
			 * @property {Boolean}
			 */
			complete    : false,
			/**
			 * @property {Number}
			 */
			completeCnt : 0,
			/**
			 * @property {String}
			 */
			nodeType    : NodeType.course,
			/**
			 * @property {Number}
			 */
			id          : null,
			/**
			 * @property {String}
			 */
			key         : null,
			/**
			 * @property {Number}
			 */
			parentId    : null,
			/**
			 * @property {Object}
			 */
			pageNote    : null,
			/**
			 * @property {Object}
			 */
			transcript  : null,
			/**
			 * @property {String[]}
			 */
			childKeys   : [],
			/**
			 * @property {String}
			 */
			name        : ''
		};
	}
	var store = {};

	/**
	 * Loads the store with the passed data
	 * @method Load
	 * @member DKI.courseStore
	 * @param {Object} data
	 * @returns	{boolean} For some reason it always returns true
	 */
	var Load = function(data){
		var testOnly = data.testonly;
		var storeKey = NodeType.course + data.courseid;
		var i;
		var j;
		var k;

		store[storeKey]=DKI.applyIf(
			DKI.apply({
					nodeType : NodeType.course,
					key      : storeKey,
					parentId : storeKey
				},data),
			new baseClass());
		delete store[storeKey].modules;

		courseNode=storeKey;
		for (i = 0; i < data.modules.length; i++){

			var module = data.modules[i];
			var moduleKey = NodeType.module + module.loid;
			store[moduleKey]=DKI.applyIf(
				DKI.apply({
						nodeType	: NodeType.module,
						key			: moduleKey,
						parentId	: storeKey,
						questionKeys:[]
					},module),
				new baseClass());

			delete store[moduleKey].objects;

			store[storeKey].childKeys.push(moduleKey);
			$(document).trigger(this.events.moduleRegistered, [module]);
			for (j = 0; j < module.objects.length; j++) {

				var object = module.objects[j];
				var objectKey = NodeType.object + object.objectid;

				store[objectKey]=DKI.applyIf(
					DKI.apply({
							nodeType	: NodeType.object,
							key			: objectKey,
							parentId	: moduleKey
						},object),
					new baseClass());

				delete store[objectKey].pages;

				store[moduleKey].childKeys.push(objectKey);
				$(document).trigger(this.events.loRegistered, [object]);
				// add the pages in
				for (k = 0; k < object.subeos.length; k++) {

					var subeo = object.subeos[k];
					var pageKey = NodeType.page + subeo.page.pageid;

					store[pageKey]=DKI.applyIf(
						DKI.apply({
								nodeType	: NodeType.page,
								key			: pageKey,
								parentId	: objectKey,
								moduleKey	: moduleKey
							},subeo),
						new baseClass());

					store[objectKey].childKeys.push(pageKey);
					$(document).trigger(this.events.pageRegistered, [subeo.page]);
					for(var l = 0; l < subeo.page.groups.length; l++) {
						var group = subeo.page.groups[l];
						$(document).trigger(this.events.groupRegistered, [group]);
						for(var m = 0; m < group.elements.length; m++) {
							var element = group.elements[m];
							$(document).trigger(this.events.elementRegistered, [element]);
						}
					}
				} // end page loop

				// add the questions in only if there are pages to display, or the course is testOnly
				if (object.subeos.length > 0 || testOnly) {
					for (k = 0; k < object.questions.length; k++) {

						var question = object.questions[k];
						var questionKey = NodeType.question + question.id;

						store[questionKey]=DKI.applyIf(
							DKI.apply({
									nodeType	: NodeType.question,
									key			: questionKey,
									parentId	: objectKey,
									pageId		: question.pageid,
									transcript	: ''
								},question),
							new baseClass());

						// since visually questions belong to a module we
						// push them into the module keys
						store[moduleKey].questionKeys.push(questionKey);
						store[objectKey].childKeys.push(questionKey);
					} // end page loop
				}

			} // end object loop
		} // end module loop
		$(document).trigger(this.events.courseRegistered, [data]);
		$(player.dataStorage).on(DKI.DataStorage.events.pageCompleted, function (e, id) {
			var o = get(NodeType.page + id);
			o.complete = true;
		});

		$(player.dataStorage).on(DKI.DataStorage.events.objectCompleted, function (e, id) {
			var o = get(NodeType.object + id);
			o.complete = true;
		});

		$(player.dataStorage).on(DKI.DataStorage.events.moduleCompleted, function (e, id) {
			var o = get(NodeType.module + id);
			o.complete = true;
		});

		$(player.dataStorage).on(DKI.DataStorage.events.courseCompleted, function (e) {
			var o = getCourse();
			o.complete = true;
		});
		return true;
	}; // end load

	/**
	 * Returns the course node element
	 * @method get
	 * @member DKI.courseStore.course
	 * @returns	{DKI.courseStore.baseClass} base record
	 */
	var getCourse = function(){
		return store[courseNode];
	};

	/**
	 * Returns the course node element
	 * @member DKI.courseStore.course
	 * @method set
	 * @param {DKI.courseStore.baseClass} o As the course object to set as the course object
	 */
	var setCourse = function(o){
		store[courseNode]=o;
		return null;
	};

	/**
	 * Returns an ordered list of all module objects in the course
	 * @member DKI.courseStore.module
	 * @method all
	 * @returns	{DKI.courseStore.baseClass[]} of records
	 */
	var getAllModules = function(){
		var result=[];
		for(var m in store[courseNode].childKeys){
			result.push(store[store[courseNode].childKeys[m]]);
		}
		return result;
	};

	/**
	 * Returns the module node element
	 * @member DKI.courseStore.module
	 * @method get
	 * @param {string} key Key of module record to fetch
	 * @returns	{DKI.courseStore.baseClass} Module record or null if not found
	 */
	var getModuleAtKey = function(key){
		return store[key].nodeType==NodeType.module ? store[key]: null;
	};

	/**
	 * Sets the module record to the passed module record
	 * @member DKI.courseStore.module
	 * @method set
	 * @param {DKI.courseStore.baseClass} o as the module object to set as the module object
	 */
	var setModule = function(o){
		store[o.key]=o;
		return null;
	};

	/**
	 * Returns an ordered list of all course objects
	 * @member DKI.courseStore.object
	 * @method all
	 * @returns	{DKI.courseStore.baseClass[]}
	 */
	var getAllObjects = function(){
		var result=[];
		for(var m in store[courseNode].childKeys){
			for(var o in store[store[courseNode].childKeys[m]].childKeys){
				result.push(store[store[store[courseNode].childKeys[m]].childKeys[o]]);
			}
		}
		return result;
	};

	/**
	 * Returns the object record at key
	 * @member DKI.courseStore.object
	 * @method get
	 * @param {string} key
	 * @returns	{DKI.courseStore.baseClass} The requested object record or
	 * null if not found
	 */
	var getObjectAtKey = function(key){
		var object = store[key];
		if(object && object.nodeType==NodeType.object){
			return object;
		}
		else{
			return null;
		}
	};

	/**
	 * Sets the object record to the passed object record
	 * @member DKI.courseStore.object
	 * @method set
	 * @param {DKI.courseStore.baseClass} o The object record to set as the object to
	 */
	var setObject = function(o){
		store[o.key]=o;
		return null;
	};

	/**
	 * Returns an ordered list of all course pages
	 * @member DKI.courseStore.page
	 * @method all
	 * @returns	{DKI.courseStore.baseClass}
	 */
	var getAllPages = function(){
		var result=[];
		for(var m in store[courseNode].childKeys){
			var mKey=store[store[courseNode].childKeys[m]];
			for(var o in mKey.childKeys){
				var oKey=store[mKey.childKeys[o]];
				for(var p in oKey.childKeys){
					var pKey = store[oKey.childKeys[p]];
					result.push(pKey);
				}
			}
		}
		return result;
	};

	/**
	 * Returns an object for a page
	 * @member DKI.courseStore.page
	 * @method getForPage
	 * @returns	{DKI.courseStore.baseClass}
	 */
	var getObjectForPage = function(key){
		for(var m in store[courseNode].childKeys){
			var mKey=store[store[courseNode].childKeys[m]];
			for(var o in mKey.childKeys){
				var oKey=store[mKey.childKeys[o]];
				for(var p in oKey.childKeys){
					if(oKey.childKeys[p] == key){
						return oKey;
					}
				}
			}
		}
		return null;
	};

	/**
	 * Returns the page record at key
	 * @member DKI.courseStore.page
	 * @method get
	 * @param {string} key
	 * @returns	{DKI.courseStore.baseClass} the requested page record or null if not found
	 */
	var getPageAtKey = function(key){
		return store[key].nodeType==NodeType.page ? store[key]: null;
	};

	/**
	 * Sets the page object based on the passed page object
	 * @member DKI.courseStore.page
	 * @method set
	 * @param {DKI.courseStore.baseClass} o The page record to set the page object to
	 */
	var setPage = function(o){
		store[o.key]=o;
		return null;
	};

	/**
	 * Gets the node from the store based on the full key
	 * @member DKI.courseStore
	 * @method get
	 * @param {string} key store key
	 * @return {DKI.courseStore.baseClass} requested record or null if not found
	 */
	var get = function(key){
		return store[key]===undefined ? null : store[key];
	}; //-> end get

	/**
	 * Sets the node in the store based on the node's key
	 * @member DKI.courseStore
	 * @method set
	 * @param {DKI.courseStore.baseClass} o
	 */
	var set = function(o){
		store[o.key]=o;
		return store[o.key];
	}; //-> end get

	return	{
		load           : Load,
		NodeType       : NodeType,
		get            : get,
		set            : set,
		course         : {
			get : getCourse,
			set : setCourse
		},
		module         : {
			all : getAllModules,
			get : getModuleAtKey,
			set : setModule
		},
		object         : {
			all        : getAllObjects,
			get        : getObjectAtKey,
			getForPage : getObjectForPage,
			set        : setObject
		},
		page           : {
			all : getAllPages,
			get : getPageAtKey,
			set : setPage
		},
		store          :store,
		events         : {
			courseRegistered    : "courseRegistered",
			moduleRegistered    : "moduleRegistered",
			loRegistered        : "loRegistered",
			pageRegistered      : "pageRegistered",
			elementRegistered   : "elementRegistered",
			groupRegistered     : "groupRegistered"
		}
	};

}(); //-> end courseStore
