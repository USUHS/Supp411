/*!
	DKI.eventLogger V1.0
	By Eric Longpre

	This class is used to track, store, and display player events. 

	DKI.eventLogger subscribes to various events, stores them as a log with a timestamp, 
	and writes a custom event message using the private messageBuilder class (who relies on Handlebars). 
	It will render a console button that, when clicked, will render and show the DKI.banner based console.

	Logs are grouped together as "bulks", using a timestamp range (defaulted to 500ms). Only logs that have
	the same status will be grouped.

	@requires Handlebars, DKI.widgets.banner, DKI.widgets.banner.notice, and various DKI functions

	Last updated: June 18th, 2015

*/

(function(){
	var defaultConfig = {
		subscribers : {
			actionFired : function(data){
				data.type  ="Action Fired";
				data.message = "action";
				return data;
			}, 
			contentAPICalled : function(data){
				data.type = "Content API";
				return data;
			},
			imageMapFired : function(data){
				data.type = "Image Map";
				return data;
			} 
		},
		notify : {
			info : {
				show : false
			},
			warning : {
				show : false
			},
			danger : {
				show : false
			}
		}, 
		bulkInterval : 500,
		//If enabled, the logger UI will show, otherwise it will log errors silently
		enableLogUI : true
	},
	state = {
		log               : [],
		logBulks          : [],
		DOM               : {},
		previewController : {},
		disabler          : $("<div class='disabler'></div>").appendTo($("body")),
		banner            : {
			zIndex            : 101,
			width             : 300,
			height            : "auto",
			displayBottomBar  : true,
			displayDismissAll : false,
			displayClose      : true,
			maxHeight         : $(".bgRepeater").height() - 50,
			position          : {
				right: 1
			},
			callback : function(banner){
				var dateEl = $("<div class='currDate'>" + new Date().toLocaleDateString() + "</div>");
				banner.expandEl.before(dateEl);
				banner.titleEl.width(banner.titleEl.width() - dateEl.width());
				banner.bannerWrapper.draggable({handle : banner.bannerHeader});
				banner.bannerWrapper.addClass("noTransition");
			},
			listeners  : {
				hide  : function(){
					state.DOM.button.show();
				}
			}
		},
		reloadBanner  : null,
		currentPageId : null,
		locked        : false
	},
	defaultLog = function() {
	return {
		status               : "info",
		timeStamp            : new Date().getTime(),
		overrideStatusNotify : false,
		dismissed            : false,
		requireRefresh       : false,
		disableContent       : false,
		type                 : "Event"
	};
	},
	/*
		Message Builder

		Based on a config made up of types and subtypes, the message builder will construct a message from 
		a given object using Handlebars templates. Currently, the templates are written staticly into the class,
		but a public method to set custom templates is possible, just like it currently sets helpers and partials
	
	*/
	messageBuilder = function(cfg){
		var templates = {
			action      :{
				def         : "{{> console_actionDefault}}",
				api         : "{{> console_actionBase}} The {{parameters.method}} {{type}} actions was performed.",
				swapContent : "{{> console_actionDefault}} Content swapped to {{#exists 'asset'}}{{asset.title}}{{else}}{{parameters.swapContent}}{{/exists}}"
			}
		};
		var config = DKI.apply({
			partials : {},
			helpers  :{}
		}, cfg);
		var init = function(){
			Private.initPartials();
			Private.initHelpers();
			return Public;
		};
		var Private = {
			initPartials  : function(){
				for(var key in config.partials){
					Handlebars.registerPartial(key, config.partials[key]);
				}
			},
			initHelpers   : function(){
				for(var key in config.helpers){
					Handlebars.registerHelper(key, config.helpers[key]);
				}
			},
			build   : function(obj, type){
				var subtype = obj.type;
				//If the subtype doesn't exist but the template has a default, use default
				subtype = typeof templates[type][subtype] === "undefined" && typeof templates[type].def !== "undefined" ? "def" : subtype;
				return templates[type][subtype] ? Handlebars.compile(templates[type][subtype])(obj) : "";
			}
		};
		var Public = {
			build : function(obj, type){
				return Private.build(obj,type);
			}
		};
		return init(cfg);
	};
	
	var Private = {
		init : function(cfg){
			config = DKI.applyIf  (cfg,defaultConfig);
			Private.initSubscribers();
			if(config.enableLogUI){
				Private.initDOM();
			}
			Private.initMessageBuilder();
			Private.initEvents();
			state.previewController = top.previewController;
			state.currentPageId = parseInt(Private.getParameterByName(window.location.href, "pageid"),10);
		},
		initSubscribers : function(){
			$.each(config.subscribers, function(key,value){
				$(document).on(key, function(e, data){
					data = value(data);
					Public.logEvent(data);
				});
			});
		},
		//Custom UI and internal events
		initEvents  : function(){
			$(".dki-banner").on("mouseover", ".dki-banner-evMessage", function(){
				var id = $(this).data("id");
				var log = state.log[id];
				if(log && log.action){
					if( log.action.elementId) {
						var ids = [log.action.elementId].concat(log.action.targetElements);
						state.previewController.highlightElements(ids);
						if(log.action.targetGroups){
							state.previewController.highlightGroups(log.action.targetGroups);
						}
					} else {
						state.previewController.highlightElements(log.action.targetElements);
						if(log.action.targetGroups){
							state.previewController.highlightGroups(log.action.targetGroups);
						}
					}
				}
			});
			$(".dki-banner").on("mouseout", ".dki-banner-notificationArea", function(){
				state.previewController.clearHighlights();
			});
		},
		initDOM    : function(){
			state.banner.position.top =  $("#headerContainer").outerHeight();
			state.banner = new DKI.widgets.Banner($("body")[0],state.banner);
			state.DOM.button = $("<div class='openConsole'>Course Console</div>").appendTo("body").on("click", function(){
				$(this).hide();
				Public.showLog();
			}).css("top" , $("#headerContainer").height() + "px");
		},
		//Creates a message builder and provides custom partial/helpers to it for log messages
		initMessageBuilder : function(){
			state.msgBuilder = new messageBuilder({
				partials : {
					console_actionBase    : "A {{trigger}} action was triggered" +
					"{{#exists 'pageId'}}"+
						" by the page" +
					"{{else}}"+
						" by {{triggerElTitle}}" + 
					"{{/exists}}.",
					console_actionDefault :"{{> console_actionBase}} The {{type}} action was performed on " +
					"{{#each elTargets}}" +
						"{{#if @first}}" + 
							"Element(s): " + 
						"{{/if}}" +
						"<span title='{{this.titleLong}}'>{{this.title}}</span>" +
						"{{#unless @last}}"+
							", " +
						"{{else}}" +
							". " +
						"{{/unless}}" +
					"{{/each}}" +
					"{{#each groupTargets}}" +
						"{{#if @first}}" + 
							"Group(s): " + 
						"{{/if}}" +
						"<span title='{{this.titleLong}}'>{{this.title}}</span>" +
						"{{#unless @last}}" +
							", " +
						"{{else}}" +
							"." +
						"{{/unless}}" +
					"{{/each}}"
				}
			});
		},
		setLogMessage : function(log){
			if(log.action){
				var actionCfg = DKI.clone(log.action);
				if(actionCfg.elementId){
					var el = $("#" + actionCfg.elementId + "_wrapper");
					actionCfg.triggerElTitle = el[0] ? el.data("title") : "Untitled Element";
				}
				actionCfg.elTargets =[];
				actionCfg.groupTargets = [];
				$.each(actionCfg.targetElements, function(idx, item){
					var el = $("#" + item + "_wrapper");
					if(el[0]){
						var title = el.data("title").length > 50 ? el.data("title").substring(0,47) + "..." : el.data("title");
						actionCfg.elTargets.push({"title" : title, titleLong : el.data("title")});
					}
				});
				$.each(actionCfg.targetGroups, function(idx, item){
					var groupTitle = contentApi.getGroupTitle(item);
					if(groupTitle){
						var title = groupTitle > 50 ? groupTitle.substring(0,47) + "..." : groupTitle;
						actionCfg.groupTargets.push({"title" : title, titleLong : groupTitle});
					}
				});
				log.message = state.msgBuilder.build(actionCfg, "action");
			}
		},
		getParameterByName : function(url, name) {
		    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
		    results = regex.exec(url.toLowerCase());
		    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		},
		setParameterByName : function(url, name, value){
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
		    var regex = new RegExp("(" + name + "=)[^\$]+","i"),
		   	url = url.replace(regex,'$1' + value);
		    return url;
		},
		renderReloadBanner : function(data){
			state.reloadBanner = new DKI.widgets.Banner($("body")[0], {
				height: 25,
				offset : {
					top : $("#headerContainer").outerHeight()
				},
				callback : function(banner){
					banner.expandEl.hide();
					banner.bannerWrapper.css("left", "auto");
					banner.title(data.message + " Click here to reload now.");
					if(data.disableContent){
						state.disabler.show();
					}

					banner.titleEl.addClass("pointer").on("click", function(){
						if(data.pageId){
							location.href = Private.setParameterByName(location.href,"pageid",data.pageId);
						}else {
							location.reload();
						}
					});
					banner.show();
				},
				headerColor: "yellow",
				displayBottomBar: false,
				displayClose: false
			});
		},
		loadPreviousBanner : function(){
			//Don't include the most recent event, because it is the page navigation we are trying to revert from
			var i = state.log.length -2;
			while(i >= 0){
				if(!state.log[i].pageId && state.log[i].requireRefresh){
					Private.renderReloadBanner(state.log[i]);
					break;
				}
				i--;
			}

		},
		// Store log data, determine the type of UI required, then show UI. Will show a specific banner for event logs that
		// require a page refresh, and will add a disabler if the log data requests it
		logEvent : function(data) {
			var urlPageId = Private.getParameterByName(window.location.href, "pageid");
			state.currentPageId = data.pageId ? data.pageId : state.currentPageId;
			state.locked = !(state.currentPageId == urlPageId);
			DKI.applyIf(data, defaultLog());
			if(data.pageId || state.locked == false){
				data.logId = state.log.length;
				state.log.push(data);
				if(data.requireRefresh){
					if(state.reloadBanner){
						state.reloadBanner.destroy();
					}
					//If we're going to link to a new page, or not link at all
					if((data.pageId && data.pageId != Private.getParameterByName(window.location.href, "pageid")) || !data.pageId){
						Private.renderReloadBanner(data);
					}else {
						state.disabler.hide();
						//We're back on the same page but we need to revert back to the previous reload banner message, if there was one
						Private.loadPreviousBanner();
					}
				}
				Shared.notify(data);
			}
		},
		//Renders regular information logs
		renderLog : function(){
			state.banner.removeAllNotices();
			var timeStamp = 0;
			for(var i = 0; i < state.logBulks.length; i++){
				var bulk = state.logBulks[i];
				if(!bulk.dismissed){
					var message = "";
					var type = "";
					for(var j =0; j < bulk.logs.length; j++){
						var log = state.log[bulk.logs[j]];
						type = log.status;
						timeStamp = log.timeStamp;
						if(bulk.type != log.type){
							bulk.type = "Multiple Events";
						}
						if(log.message){
							message += "<div class='dki-banner-evMessage' data-id='" + bulk.logs[j] + "'>" + log.message + "</div>";
							
						}
					}
					message +="<span class='timestamp'>" + new Date(timeStamp).toLocaleTimeString() + "</span>";
					state.banner.addNotice({
						title               : bulk.type,
						message             : message,
						type                : type,
						displayDismiss      : false,
						dismissOnDblClick   : true,
						doNotShow           : true,
						bulk                : bulk,
						listeners : {
							dismiss : function(notice){
								notice.noticeWrapper.hide();
								notice.config.bulk.dismissed = true;
							}
						}
					});	
				}
			}
		},
		showLog : function() {
			Private.renderLog();
			state.banner.show();
			state.banner.expandNotices();
		},
		hideLog : function(){
			state.banner.hide();
		}
	},
	Shared = {
		notify : function(log){
			Private.setLogMessage(log);
			var bulk = state.logBulks.pop();
			//We want to group together like types of statuses only. Different status, different bulk
			if(bulk && (log.timeStamp - bulk.timeStamp ) <= config.bulkInterval && bulk.status === log.status){
				bulk.logs.push(log.logId);
			}else {
				if(bulk){
					state.logBulks.push(bulk);
				}
				bulk = {
					timeStamp : log.timeStamp,
					logs      : [state.log.length -1],
					dismissed : false,
					status    : log.status,
					type      : log.type 
				};
			}
			state.logBulks.push(bulk);
			if(state.shown){	
				Private.renderLog();
			}
			if((!config.notify[log.status].show && log.overrideStatusNotify) || (config.notify[log.status].show && !log.overrideStatusNotify)){
				Public.showLog();
			}
		}
	},
	Public = {
		/*  Function Log Event
			Takes an event, timestamps it, and stores it into state.log
			@event {Object} Information wished to be stored with a log. Can contain default log members to control output settings.
		*/
		logEvent : function(event){
			Private.logEvent(event);

		},
		/*  Function Write Log
			Writes all data in the current log out to the console, regardless of whether or not they were dismissed.
			Writes out formatted text with basic information, as well as the full state.log array
		*/
		writeLog : function() {
			var logTxt = "";
			for(var i =0; i < state.log.length; i ++){
				logTxt += new Date(state.log[i].timeStamp).toLocaleString() + ": " + state.log[i].message + "\n";
			}
			console.log(logTxt);
			console.log(state.log);
		},
		/*  Function Show Log
			Renders and displays the log UI.
		*/
		showLog : function(){
			if(config.enableLogUI){
				state.shown = true;
				Private.showLog();
			}
		},
		/*  Function Hide Log
			Hides the log UI.
		*/
		hideLog : function(){
			if(config.enableLogUI){
				state.shown = false;
				Private.hideLog();
			}
		}
	};

	var component = function(cfg){
		Private.init(cfg);
		return Public;
	};
	DKI.eventLogger = component;
}());