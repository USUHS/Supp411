if(!DKI.search) {
	DKI.search = {
		events : {},
		isSupportedLanguage : function(cultureCode){
			var cc = cultureCode ? cultureCode : contentApi.getCourseLanguage();
			var supported =  ["en-us", "en-gb", "en-au", "en-ca"];
			return $.inArray(cc.toLowerCase(),supported) >= 0;
		}
	};
}

(function(){
	var config = {
		/*
        * @config indexes [boolean] Defines whether search is enabled. Lunr is incompatible with < IE9, 
        * so we'll disable it for those versions
        */
		enabled : true,
		/*
        * @config indexes [object] A store for all the indexes to be applied to various objects and searched on
        */
		indexes : {},
		/*
        * @config itemStore [array] A flat storage of all the items registered in any index. Their array position will act * as a unique id
        */
		itemStore : [],
		/*
        * @config memberMap [object] A mapping of structure properties to their deep values. This is used to (if necessary)
        * provide a flat level index to lunr because lunr does not search in depth. This is required when you need to 
        * search against values in a member that aren't at the surface level (i.e. parameters).
        * If defined, the whole mapping will be supplied to Lunr instead of the member from the course structure, so you
        * must include a mapping for all things you wish to search against
        */
        memberMap : {
        	pages : {
        		"transcript"        : "transcript.body"
        	} 
        },
        /*
        * @config supportedAssetTypes [array] A list of asset types that are currently searchable
        */
        supportedAssetTypes : ["video", "audio", "image", "flash", "html"],
         /*
        * @config supportedElementTypes [array] a list of element types that are currently searchable
        */
        supportedElementTypes : ["htm", "authoringButton", "table", "videoembed"],
        /*
        * @config memberRules [object] Function to be run when the member (needs to be defined in courseMembers) is 
        * reached when walking the course
        */
        memberRules : {
        	'elements' : function(item) {
        		item.elementMeta = DKI.stripHTML(item.meta);
        		item.keysFlat = item.keywords.join(" ");
        	},
        	'objects'  : function(item) {
        		item.keysFlat = item.keywords.join(" ");
        	},
        	'assets'  : function(item) {
        		item.keysFlat = item.keywords.join(" ");
        	}		
        }

	};
	var Private = {
		init : function(cfg) {
			DKI.apply(config,cfg);
			if(config.enabled){
				Private.initIndexes();
				Private.initSubscribers();
			}
		},
		//Rules based on languages will reside here for lunr
		alterPipelines : function(lunrIns){
			if(!DKI.search.isSupportedLanguage()){
				//Basic lunr search. Nothing extra
				lunrIns.pipeline.remove(lunr.stemmer);
				lunrIns.pipeline.remove(lunr.stopWordFilter);
				lunrIns.pipeline.remove(lunr.trimmer);
				lunrIns.pipeline.add(function(token, tokenIndex, tokens){
					if(token != ""){
						return token;
					}
				});
			}
		},
		initSubscribers : function() {
			//Course Structurep
			$(document).on(DKI.courseStore.events.courseRegistered, function(event, data) {
				Private.registerAssets();
			});
			$(document).on(DKI.courseStore.events.moduleRegistered, function(event, data) {
				Private.addToIndex(data, "modules");
			});
			$(document).on(DKI.courseStore.events.loRegistered, function(event, data) {
				Private.addToIndex(data, "objects");
			});
			$(document).on(DKI.courseStore.events.pageRegistered, function(event, data) {
				Private.addToIndex(data, "pages");
			});
			$(document).on(DKI.courseStore.events.elementRegistered, function(event, data) {
				if($.inArray(data.elementtype, config.supportedElementTypes) >= 0){
					Private.addToIndex(data, "elements");
				}
				if(data.parameters.labels) {
					for(var i = 0; i < data.parameters.labels.length; i ++) {
						var asset = dataStorage.getAsset(data.upload_id);
						if(asset) {
							//We can use a space to delemit each new label because lunr parses them out
							asset.labels += " " + data.parameters.labels[i].text;
						}
					}
				}
			});

			//Glossaries
			$(document).on(DKI.glossaryBrowse.events.glossaryRegistered, function(event, data) {
				Private.addToIndex(data, "glossaries");
			});

			//References
			$(document).on(DKI.Reference.playerReferenceUIInterface.events.referenceRegistered, function(event, data) {
				Private.addToIndex(data, "references");
			});
			$(document).on(DKI.Reference.playerReferenceUIInterface.events.citationRegistered, function(event, data) {
				Private.addToIndex(data, "citations");
			});
		},
		initIndexes : function() {
			config.indexes = {
				"elements" : lunr(function(){
					this.ref("idx");
					this.field("elementMeta", {boost : 12.5});
					this.field("txt", {boost : 12.5});
					this.field("description", {boost : 10});
					this.field("keysFlat", {boost : 10});
					Private.alterPipelines(this);
				}),
				"pages" : lunr(function(){
					this.ref("idx");
					this.field("transcript", {boost : 10});
					Private.alterPipelines(this);
				}),
				"assets" : lunr(function(){
					this.ref("idx");
					this.field("title", {boost: 12.5});
					this.field("description", {boost: 10});
					this.field("transcript", {boost: 10});
					this.field("labels", {boost : 10});
					this.field("keysFlat", {boost : 10});
					Private.alterPipelines(this);
				}),
				"citations" : lunr(function(){
					this.ref("idx");
					this.field("label", {boost: 10});
					Private.alterPipelines(this);
				}),
				"references" : lunr(function(){
					this.ref("idx");
					this.field("refText", {boost: 10});
					Private.alterPipelines(this);
				}),
				"glossaries" : lunr(function(){
					this.ref("idx");
					this.field("term", {boost: 12.5});
					this.field("definition", {boost: 10});
					this.field("attribution", {boost: 7.5});
					Private.alterPipelines(this);
				})
			};
		},

		registerAssets : function() {
			for(var key in config.dataStorage.store.assets) {
				var asset = config.dataStorage.store.assets[key];
				if($.inArray(asset.type, config.supportedAssetTypes) >= 0){
					Private.addToIndex(asset, "assets");
				}
			}
		},
		addToIndex  : function(item, indexName) {
			if(config.indexes[indexName]) {
				item.idx = config.itemStore.length;
				//We're going to add the search manager search type so that when it's retrieved from lunr, we can use that property to identify it in the UI
				item.smSearchType = indexName;
				var newItem = item;
				//If a mapping exists, we will provide a new flat object to lunr with the properties as defined in config,
				// parsing dot notation to fetch any deep values
				if(config.memberMap[indexName]) {
					newItem = {idx : item.idx};
					for(var key in config.memberMap[indexName]) {
						newItem[key] = config.memberMap[indexName][key].split('.').reduce(function(obj,i) {
							return obj[i] ? obj[i] : {};
						}, item);
					}
				}
				//If we have a custom rule to apply to this member, run it. This includes (currently) stripping html from the members of certain indexabble data
				if(config.memberRules[indexName]) {
					config.memberRules[indexName](newItem);
				}
				config.itemStore.push(item);
				config.indexes[indexName].add(newItem);
				return item.idx;
			}
		},
		search  : function(term, exclude) {
			var searchResults = [];
			for(var key in config.indexes) {
				//Skip the index if our search demands it
				if(exclude && DKI.isArray(exclude) && exclude.indexOf(key) >= 0) {
					continue;
				}
				searchResults = searchResults.concat(config.indexes[key].search(term));
			}
			//Add in th object information to the search results and sort them overall by relevance score
			var returnVal = searchResults.map(function(item) {
				item.obj = config.itemStore[item.ref];
				return item;
			}).sort(Private.sortResults);
			return returnVal;
		},
		sortResults : function(a,b) {
			if (a.score < b.score)
				return 1;
			if (a.score > b.score)
				return -1;
			return 0;
		},
		runAsync : function(func) {
			setTimeout(func,0);
		}
	}
	var Shared = {
		
	}
	var Public = {
		/**
		* Searches all of the indexes for a given term. Will exclude certain indexes, if an array
		* of indexes to exclude is provided.
		*
		* @method addToIndex
		* @param term [String] *Required* The item to be added to the index that can be searched against
		* @para exclude [Array] An array of index key names to exclude
		*/
		search           : function(term, exclude) {
			return Private.search(term, exclude);
		},
		/**
		* Returns whether or not the class has been set to enabled. If it is not enabled, it has no search
		* indexes instantiated and cannot search. 
		*
		* @method isEnabled
		*/
		isEnabled        : function() {
			return config.enabled;
		},
		/**
		* Returns whatever item is as the index provided.
		*
		* @method getItemByStoreIndex
		* @para idx [Integer]The index of the item to retrieve
		*/
		getItemByStoreIndex : function(idx) {
			return config.itemStore[idx];
		}

	}
	var component = function(config) {
		Private.init(config);
		jQuery.extend(this, Public);
		return this;
	}
	DKI.search.Manager = component;
})()