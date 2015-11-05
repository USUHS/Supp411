var DKI;
if (!DKI) {
	DKI = {};
}

DKI.ContentPage = (function () {
	//Used to determine if content is being served via http or https.  If not,
	//we assume being served directly from filesystem, or wrapped in a native
	//mobile application
	var contentAPI;
	var isOnWeb = function () {
		var currentLocation = window.location.href;
		var webBasedSearch = /http:\/\/|https:\/\//i;
		return webBasedSearch.test(currentLocation);
	};
	var stage = $("#contentFrame");
	var stageOverflow = stage.css("overflow-y");
	var playerOnWeb = isOnWeb();
	//Holds internal functions for handling/manipulating media functions
	var mediaFunctions = function () {
		var flashTimeout = 0;
		var nativeAudio = false;
		var nativeVideo = false;
		var hasFlash = false;
		var solution = (dkiUA.iOS || dkiUA.android || dkiUA.chromeBook) ? "html,flash" : "flash,html";
		var createVideoPlayerMarkup = function (id, hideControls, wrapper) {			
			var videoMarkup = "" +
			"<div id=\"" + id + "_container\" class=\"jp-video\">" +
				"<div class=\"jp-type-single\">" +
					"<div id=\"" + id + "_player\" class=\"jp-video-player\"></div>" +
					"<div class=\"jp-video-play\">" +
						"<a class=\"jp-video-play-icon\">play</a>" +
					"</div>" +
					"<div class=\"jp-gui\">";
			if (!hideControls) {
				videoMarkup += "" +
						"<div class=\"jp-interface\">" +
							"<div class=\"jp-progress\">" +
								"<div class=\"jp-seek-bar\">" +
									"<div class=\"jp-play-bar\"></div>" +
								"</div>" +
							"</div>" +
							"<div class=\"jp-current-time\"></div>" +
							"<div class=\"jp-duration\"></div>" +
							"<div class=\"jp-controls-holder\">" +
								"<ul class=\"jp-controls\">" +
									"<li><a class=\"jp-play\" role=\"button\">play</a></li>" +
									"<li><a class=\"jp-pause\" role=\"button\">pause</a></li>";
				if(wrapper.data("transcript") != ""){
					videoMarkup += "<li><a class=\"jp-transcript\" role=\"button\">transcript</a></li>";
				}
				videoMarkup += "<li><a class=\"jp-full-screen\" role=\"button\">full</a></li>" +
									"<li><a class=\"jp-restore-screen\" role=\"button\">restore</a></li>" +
									"<li><a class=\"jp-mute\" role=\"button\">mute</a></li>" +
									"<li><a class=\"jp-unmute\" role=\"button\">unmute</a></li>" +
								"</ul>" +
								"<div class=\"jp-volume-bar\">" +
									"<div class=\"jp-volume-bar-value\"></div>" +
								"</div>" +
							"</div>" +
						"</div>" +
					"</div>" +
				"</div>";
			}
			videoMarkup += "</div>";
			return videoMarkup;
		};
		var createAudioPlayerMarkup = function (id, type, hideControls, wrapper) {
			var returnString = "<div id=\"" + id + "\" class=\"jp-" + type;
			if (hideControls) {
				returnString += " hideControls";
			}
			returnString += "\">" +
			"<div class=\"jp-type-single\">";
				returnString += "<div class=\"jp-gui jp-interface\">" +
					"<div class=\"jp-controls-holder\">" +
						"<ul class=\"jp-controls\">" +
							"<li><a class=\"jp-play\" role=\"button\">play</a></li>" +
							"<li><a class=\"jp-pause\" role=\"button\">pause</a></li>";

				if (type !== "basic") {
					if(wrapper.data("transcript") != ""){
						returnString += "<li><a class=\"jp-transcript\" role=\"button\">transcript</a></li>"
					}
					returnString += "<li><a class=\"jp-mute\" role=\"button\">mute</a></li>" +
								"<li><a class=\"jp-unmute\" role=\"button\">unmute</a></li>";
				}
				returnString += "</ul>" +
						"</div>" +
						"<div class=\"jp-progress\">" +
							"<div class=\"jp-seek-bar\">" +
								"<div class=\"jp-play-bar\"></div>" +
							"</div>" +
						"</div>" +
					"</div>" +
					"<div class=\"jp-no-solution\">" +
						"<span>No workee</span>" +
					"</div>" +
				"</div>";
			returnString += "</div>";
			return returnString;
		};
		var resolveMediaURL = function (pageInstance, URL) {
			var absRegEx = /^https?:\/\/|^\//;
			var rtmpEx = /^rtmp:\/\/|^\//;
			if (!absRegEx.test(URL) && !rtmpEx.test(URL)) {
				URL = pageInstance.rootURL + URL;
			}

			return URL;
		};
		//Used to determine if the native audio tag is supported for .mp3 files
		var testAudio = function () {
			var audio = document.createElement("audio");
			//Blackberry 6 'supports' audio, but performance is lousy enough
			//to go without
			if(dkiUA.blackberry && dkiUA.blackberryVersion < 7){
				return false;
			}
			//Audio in native apps is dicey on Android
			if(dkiUA.android && dkiUA.androidVersion < 4 && !playerOnWeb){
				return false;
			}
			//audio performs terrible on webOS
			if (dkiUA.webOS) {
				return false;
			}
			if (audio.canPlayType && audio.canPlayType('audio/mpeg') != "") {
				return true;
			}

			return false;
		};

		//Used to determine if the native video tag is supported for MP4.
		var testVideo = function () {
			var video = document.createElement("video");
			if(dkiUA.blackberry && dkiUA.blackberryVersion < 7){
				return false;
			}
			if(dkiUA.android && dkiUA.androidVersion < 4 && !playerOnWeb){
				return false;
			}
			if (video.canPlayType && video.canPlayType('video/mp4') != "") {
				return true;
			}

			return false;
		};

		var jplayerFlashResetHandler = function (pageInstance, mediaElem) {
		};

		//Sets up handlers & replaces content for media elements based on current
		//device capabilities
		var handleMedia = function (pageInstance) {
			var videos = $(".dki-video-content-element", pageInstance.pageContainer);
			var sounds = $("div[data-elementType='audio']", pageInstance.pageContainer);
			pageInstance.mediaCount = videos.length + sounds.length;
			pageInstance.readyMediaCount = 0;
			handleVideo(videos, pageInstance);
			handleAudio(sounds, pageInstance);
			//Fire ready event
			if (pageInstance.mediaCount === 0) {
				pageInstance.fireReady();
			}
		};

		var mediaIsReady = function (pageInstance) {
			if (pageInstance.mediaCount === pageInstance.readyMediaCount) {				
				pageInstance.fireReady();
			}
		};

		//Sets up handlers and replaces content for audio elements
		var handleAudio = function (sounds, pageInstance) {
			sounds.each(function () {
				var extension = $(this).data("extension").toLowerCase();
				var media = {};
				var controls;
				var wrapper = $(this).closest(".dki-authoring-element");
				var hideControls = !$(this).data("controls");
				var autoplay = $(this).data("autoplay");
				var loop = $(this).data("loop");
				var type = $(this).data("playerskin") ? "basic" : "audio";
				var renderHidden = wrapper.data("renderhidden");
				var readyFunction = function (e) {
					var mediaElem = $(this);
					//If a flash solution is used, we need to handle the 'flashreset' event thrown
					//after player is hidden during reset and shown again.  Ultimately, this is to ensure any hidden
					//auto-play content is played on 'show' after a page reset, or going forward then back again.
					if (e.jPlayer.flash.used) {
						//Reset event is shown, change ready state
						//mediaFunctions.jplayerFlashResetHandler(pageInstance, mediaElem);
						$(pageInstance.pageContainer).on(DKI.ContentPage.events.reset, function (e) {
							mediaElem.on($.jPlayer.event.flashreset, function (e) {
								mediaElem.jPlayer("pause", 0);									
								if(pageInstance.isMuted){
									mediaElem.jPlayer("mute");
								}
								//mediaFunctions.play will attempt to delay & bind to the ready event
								//if the player isn't currently ready.  Fire to ensure the bound play function
								//is executed
								mediaElem.trigger($.jPlayer.event.ready);
								mediaElem.unbind(e);
							});
						});
					}
					mediaElem.jPlayer("setMedia", media);
					var parent = this.parentNode;
					$(".jp-seek-bar, .jp-play-bar", parent).on("mousedown", function(e){
						mediaElem.jPlayer("pause");
						$(".jp-gui", parent).addClass("forceShow");
						$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).on("mousemove", function(e){
							var offset = $(".jp-seek-bar", parent).offset().left;
							var maxwidth = $(".jp-seek-bar", parent).outerWidth();
							/* Percentage calc */
							if(e.clientX+offset <= maxwidth+offset*2) {
								$(".jp-play-bar", parent).css("width", (e.clientX-offset)/(maxwidth/100) + '%');
								mediaElem.jPlayer("playHead", (e.clientX-offset)/(maxwidth/100));
							}
						});
						$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).on("mouseup", function(e){
							mediaElem.jPlayer("play");
							$(this).off("mouseup");
							$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).off("mousemove");
							setTimeout(function(){
								$(".jp-gui", parent).removeClass("forceShow");
							}, 700);

						});
					});

					$(".jp-transcript", parent).on(pageInstance.settings.clickEvent, function(){
						contentApi.showPopup({
							html: wrapper.data("transcript"),
							modal: false,
							title: playerStrings.transcriptLabel
						});
					});
					//case 39637: in the case of flash being used with no course transition (ie: display: none), the media is not ready for the setAudio call. Need to check audio status and mute if necessary					
					if(pageInstance.isMuted){
						mediaElem.jPlayer("mute");
					}
					pageInstance.readyMediaCount += 1;
					mediaIsReady(pageInstance);
					mediaElem.unbind(e);
				};
				//case 26637: jPlayer doesnt want to play mp4's.
				//http://groups.google.com/group/jplayer/browse_thread/thread/72210fec0d912233/856cf89cdfde56d1
				if(extension.toLowerCase() == "mp4"){
					extension = "m4a";
				}
				else if(extension.toLowerCase() == "ogg"){
					extension = "oga";
				}
				media[extension] = mediaFunctions.resolveMediaURL(pageInstance, $(this).data("src"));				
				if (!nativeAudio && !hasFlash) {
					var mediaLink = $(".dki-media-link", this);
					if (mediaLink.parent().hasClass("dki-audio-basic")) {
						mediaLink.parent().removeClass("dki-audio-basic");
						mediaLink.addClass("dki-audio-basic");
					}
					pageInstance.readyMediaCount += 1;
					mediaIsReady(pageInstance);
				}
				else {
					//Create jPlayer skin markup
					controls = createAudioPlayerMarkup(this.id + "_controls", type, hideControls, wrapper);

					$(this).after(controls);
					$(this).jPlayer({
						swfPath: settings.swfPath,
						cssSelectorAncestor: "#" + this.id + "_controls",
						ready: readyFunction,
						supplied: extension,
						loop: loop,
						solution: solution,
						preload: "auto",
						autohide: {
							restored: $(this).data("controls") === "true" ? true : false
						},
						muted: contentAPI.getAudioStatus() ? false : true,
						volume: 1,
						size: {
							width: 0,
							height: 0
						}
					});					
					$(this).data("renderhidden", renderHidden);
				}
				pageInstance.mediaPlayers[this.id] = $(this);
				actionFunctions.registerMediaPlayer($(this), wrapper, pageInstance);
				if (autoplay) {
					pageInstance.autoPlayMedia.push($(this));
				}
				wrapper.data("mediaPlayer", $(this));
				//append screenreader instructions to the anchor.
				var anchor = $(".dki-element-anchor", wrapper);
				var title = anchor.attr("title");
				title += playerStrings.media_instructions_play;
				if(!hideControls){
					if(wrapper.data("transcript") != ""){
						title += playerStrings.media_instructions_transcript;
					}
					title += playerStrings.media_instructions_mute;
					title += playerStrings.media_instructions_volume;					
				}
				//anchor.attr("title", title);
			});
		};

		//Sets up handlers and replaces content for video elements
		var handleVideo = function (videos, pageInstance) {
			var mediaFunction;
			if (nativeVideo || (hasFlash && playerOnWeb)) {
				mediaFunction = function () {
					var wrapper = $(this).closest(".dki-authoring-element");
					var extension = $(this).data("extension").toLowerCase();
					var media = {};
					var hideControls = !$(this).data("controls");
					var controls;
					var loop = $(this).data("loop");
					var autoplay = $(this).data("autoplay");
					var renderHidden = wrapper.data("renderhidden");
					
					var fullScreen = $(this).data("allowfullscreen");
					var player;
					var autoHide = {
						restored: true,
						full: true
					};
					var readyFunction = function (e) {
						var mediaElem = $(this);
						if (!fullScreen) {
							//Ensure fullScreen button isn't shown.
							$(this).data().jPlayer.status.noFullScreen = true;
						}
						//If a flash solution is used, we need to handle the 'flashreset' event thrown
						//after player is hidden during reset and shown again.  Ultimately, this is to ensure any hidden
						//auto-play content is played on 'show' after a page reset, or going forward then back again.
						if (e.jPlayer.flash.used) {
							//Reset event is shown, change ready state
							//mediaFunctions.jplayerFlashResetHandler(pageInstance, mediaElem);
							$(pageInstance.pageContainer).on(DKI.ContentPage.events.reset, function (e) {								
								mediaElem.on($.jPlayer.event.flashreset, function (e) {
									mediaElem.jPlayer("pause", 0);									
									if(pageInstance.isMuted){
										mediaElem.jPlayer("mute");
									}
									//mediaFunctions.play will attempt to delay & bind to the ready event
									//if the player isn't currently ready.  Fire to ensure the bound play function
									//is executed
									mediaElem.trigger($.jPlayer.event.ready);
									mediaElem.unbind(e);
								});
							});
						}
						$(this).jPlayer("setMedia", media);
						$(this).bind($.jPlayer.event.pause, function (e) {
							$(".jp-video-play", this.parentNode).css("display", "");
						});
						$(this).bind($.jPlayer.event.play, function (e) {
							$(".jp-video-play", this.parentNode).css("display", "none");
						});
						$(this).bind($.jPlayer.event.click, function (e) {
							if (e.jPlayer.status.paused) {
								$(this).jPlayer("play");
							}
							else {
								$(this).jPlayer("pause");
							}
						});
						var parent = this.parentNode;
						$(".jp-seek-bar, .jp-play-bar", parent).on("mousedown", function(e){
							mediaElem.jPlayer("pause");
							$(".jp-gui", parent).addClass("forceShow");
							$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).on("mousemove", function(e){
								var offset = $(".jp-seek-bar", parent).offset().left;
								var maxwidth = $(".jp-seek-bar", parent).outerWidth();
								/* Percentage calc */
								if(e.clientX+offset <= maxwidth+offset*2) {
									$(".jp-play-bar", parent).css("width", (e.clientX-offset)/(maxwidth/100) + '%');
									mediaElem.jPlayer("playHead", (e.clientX-offset)/(maxwidth/100));
								}
							});
							$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).on("mouseup", function(e){
								mediaElem.jPlayer("play");
								$(this).off("mouseup");
								$(".jp-seek-bar, .jp-controls-holder, .jp-play-bar", parent).off("mousemove");
								setTimeout(function(){
									$(".jp-gui", parent).removeClass("forceShow");
								}, 700);

							});
						});
						$(".jp-transcript", parent).on(pageInstance.settings.clickEvent, function(){
							contentApi.showPopup({
								html: wrapper.data("transcript"),
								modal: false,
								title: playerStrings.transcriptLabel
							});
						});
						//case 39637: in the case of flash being used with no course transition (ie: display: none), the media is not ready for the setAudio call. Need to check audio status and mute if necessary
						if(pageInstance.isMuted){
							mediaElem.jPlayer("mute");
						}
						pageInstance.readyMediaCount += 1;
						mediaIsReady(pageInstance);
						$(this).unbind(e);
					};
					var resizeFunction = function (e) {
						var playerObj = $(this)
						var fullScreen = playerObj.jPlayer("option", "fullScreen");
						if (fullScreen) {
							onFullScreen(playerObj);
						}
						else {
							onRestoreScreen(playerObj);
						}
					};
					var onFullScreen = function (jplayer) {
						var parentObj = jplayer.parents(".dki-authoring-element");
						parentObj.css({top: "0px", left: "0px", height: stage.css("height"), width: stage.css("width"), zIndex: "100000"});
						parentObj.data("fullscreen", true);
						stage.css("overflow-y", "hidden");
						$(".dkiContentFrame.current").css("overflow-y", "hidden");
					};
					var onRestoreScreen = function (jplayer) {
						var parentObj = jplayer.parents(".dki-authoring-element");
						var top = parentObj.data("y") + "px";
						var left = parentObj.data("x") + "px";
						var height = parentObj.data("height") + "px";
						var width = parentObj.data("width") + "px";
						var zIndex = parentObj.data("elementno");
						parentObj.css({top: top, left: left, height: height, width: width, zIndex: zIndex});
						parentObj.data("fullscreen", false);
						stage.css("overflow-y", stageOverflow);
						$(".dkiContentFrame.current").css("overflow-y", stageOverflow);
					};
					//Firefox on OSX has issues with auto-hiding controls, doesn't seem to register mouse-over to reshow.
					if (dkiUA.firefox && !dkiUA.windows) {
						autoHide = {
							restored: false,
							full: false
						};
					}
					//case 26637: jPlayer doesnt want to play mp4's.
					//http://groups.google.com/group/jplayer/browse_thread/thread/72210fec0d912233/856cf89cdfde56d1
					if(extension.toLowerCase() == "mp4" || extension.toLowerCase() == "mov"){
						extension = "m4v";
					}
					//case 47711: gotta use rtmpv for mediastreams
					else if($(this).data("elementtype") == "mediastream" && $(this).data("src").indexOf("rtmp") == 0){
						extension = "rtmpv";
					}
					media[extension] = mediaFunctions.resolveMediaURL(pageInstance, $(this).data("src"));

					if ($(this).data("poster")) {
						media["poster"] = $(this).data("poster");
					}
					controls = createVideoPlayerMarkup(this.id, hideControls, wrapper);
					$(this).html(controls);
					player = $("#" + this.id + "_player", this);
					if (!fullScreen) {
						$(this).addClass("no-fullscreen");
					}
					var sizeFull = {
						height: "100%"
					};
					if(dkiUA.ie){
						sizeFull.height = stage.css("height");
					}
					player.jPlayer({
						swfPath: settings.swfPath,
						cssSelectorAncestor: "#" + this.id + "_container",
						ready: readyFunction,
						resize: resizeFunction,
						supplied: extension,
						loop: loop,
						preload: "auto",
						solution: solution,
						backgroundColor: "transparent",
						wmode: "transparent",
						nativeVideoControls: settings.nativeVideoControls,
						size: {
							width: $(this).data("width") + "px",
							height: $(this).data("height") + "px"
						},
						sizeFull: sizeFull,
						autohide: autoHide,
						muted: contentAPI.getAudioStatus() ? false : true,
						volume: 1,
						//specifying this as apparently fullscreen is disabled in IE6 by default.
						noFullScreen: {
						}
					});
					player.data("renderhidden", renderHidden);
					//If we're using native controls, mobile players like android and iOS already have a play button overlay. Web does not
					var jPlayerData = player.data("jPlayer");
					if(jPlayerData && jPlayerData.status && jPlayerData.status.nativeVideoControls){
						$(".jp-video-play", this).detach();
					}
					pageInstance.mediaPlayers[this.id] = player;
					actionFunctions.registerMediaPlayer(player, wrapper, pageInstance);
					if (autoplay) {
						pageInstance.autoPlayMedia.push(player);
					}
					player.bind($.jPlayer.event.ended, function(event){
						$(".jp-restore-screen", $(this).parents(".dki-authoring-element")).click();
					});	
					wrapper.data("mediaPlayer", player);

					//append screenreader instructions to the anchor.
					var anchor = $(".dki-element-anchor", wrapper);
					var title = anchor.attr("title");
					title += playerStrings.media_instructions_play;
					if(!hideControls){
						if(wrapper.data("transcript") != ""){
							title += playerStrings.media_instructions_transcript;
						}
						title += playerStrings.media_instructions_mute;
						title += playerStrings.media_instructions_volume;
						if(wrapper.data("allowfullscreen")){
							title += playerStrings.media_instructions_fullscreen;
						}
					}
					//anchor.attr("title", title);
				};
			}
			else {
				mediaFunction = function () {
					//Because this function is called within the jQuery 'each' method,
					//'this' is the current element in the collection
					var mediaLink = $(".dki-media-link", this);
					mediaLink.prop("href", $(this).data("src"));
					pageInstance.readyMediaCount += 1;
					mediaIsReady(pageInstance);
					return mediaLink;
				};
			}
			videos.each(mediaFunction);
		};

		//Determines if the current device supports autoplay
		var canAutoplay = function (){
			if(dkiUA.iOS || dkiUA.android){
				return false;
			}
			return true;
		};

		var play = function (mediaElement, pageInstance, startTime) {
			var bindFunction;
			if (typeof(mediaElement) === "string") {
				mediaElement = pageInstance.mediaPlayers[mediaElement];
			}
			if(typeof(startTime) !== "undefined"){
				mediaElement.jPlayer("play", startTime);
			}
			else{
				mediaElement.jPlayer("play");
			}
			//bind to ready in case it cant be played yet.
			bindFunction = function (e) {
				/*
					case 33559: only play media if it's the current page. We have a callback issue here when getting display set to "" on reset when going next.
					if the element is set to autoplay and theres an action on the page to hide it, when the user goes to the next page,
					next calls reset, which sets display "", which resets flash, which is triggering $.jPlayer.event.ready because our handle audio/video
					methods subscribe to that in case flash isn't ready to go when we first try to autoplay.
					We need it to start playing only if reset happens because of an action or because of the menu
				*/				
				if (pageInstance.started) {
					if(typeof(startTime) !== "undefined"){
						mediaElement.jPlayer("play", startTime);
					}
					else{
						mediaElement.jPlayer("play");
					}
					mediaElement.unbind(e);
				}
			};
			$(mediaElement).bind($.jPlayer.event.ready, bindFunction);
			$(mediaElement).bind($.jPlayer.event.flashreset, bindFunction);
		};

		var pause = function (mediaElement, pageInstance) {
			var bindFunction;
			if (typeof(mediaElement) === "string") {
				mediaElement = pageInstance.mediaPlayers[mediaElement];
			}
			mediaElement.jPlayer("pause");
		};

		nativeAudio = testAudio();
		nativeVideo = testVideo();
		hasFlash = swfobject.hasFlashPlayerVersion("10.1.0");

		var respondVideos = function(pageInstance){
			/*Case 39523 - We need to give the parent container to video elements a place in the document briefly to
			* assess their current size and resize accordingly. This does not/should not be done on current page, as it 
			* is already displayed and dimensions can be obtained.*/
			
			if(!$(pageInstance.pageContainer).hasClass("current")) {	
				$(pageInstance.pageContainer).css({"position" : "absolute", "visibility" : "hidden", "display" : "block"});
			}
			$(".dki-video-element", pageInstance.pageContainer).each(function(){
				var width = $(this).width();
				var assetWidth = $(this).data("width");
				var assetHeight = $(this).data("height");
				$(".jp-video-player, object, video, .jp-video", this).css("height", (assetHeight * (width/assetWidth)) + "px");
			});
			if(!$(pageInstance.pageContainer).hasClass("current")) {
				$(pageInstance.pageContainer).css({"position" : "", "visibility" : "", "display" : ""});
			}
		}

		return {
			handleMedia: handleMedia,
			resolveMediaURL: resolveMediaURL,
			play: play,
			pause: pause,
			canAutoplay: canAutoplay,
			respondVideos: respondVideos,
			handleVideo: handleVideo,
			handleAudio: handleAudio
		};

	}();

	var contentFunctions = {
		setAudio: function (audio, pageInstance) {
			pageInstance.isMuted = !audio;
			var name;
			if (audio === true) {
				for (name in pageInstance.mediaPlayers) {
					pageInstance.mediaPlayers[name].jPlayer("unmute");
				}
				//Case 34391 - We only want to mute, not pause
				//this.resumeAll(pageInstance);
			}
			else {
				for (name in pageInstance.mediaPlayers) {
					pageInstance.mediaPlayers[name].jPlayer("mute");
				}
				//Case 34391 - We only want to mute, not pause
				//this.pauseAll(pageInstance);
			}
		},
		pauseAll: function (pageInstance){
			var name;
			pageInstance.autoPaused = [];
			for (name in pageInstance.mediaPlayers) {
				var id = name.replace("content_", "");
				if ($("#" + id + "_wrapper").data("dontpause") != true) {
					if (!this.isPaused(pageInstance.mediaPlayers[name])) {
						pageInstance.mediaPlayers[name].jPlayer("pause");
						pageInstance.autoPaused.push(name);
					}
				}
			}
		},
		resumeAll: function (pageInstance) {
			var name;
			if(!pageInstance.autoPaused){
				pageInstance.autoPaused = [];
			}
			for (var i = 0; i < pageInstance.autoPaused.length; i += 1) {
				name = pageInstance.autoPaused[i];
				pageInstance.mediaPlayers[name].jPlayer("play");
			}
			pageInstance.autoPaused = [];
		},
		startAutoPlay: function (pageInstance) {
			var autoPlayCount = pageInstance.autoPlayMedia.length;
			for (var i = 0; i < autoPlayCount; i += 1) {
				if (!pageInstance.autoPlayMedia[i].data("renderhidden")) {
					mediaFunctions.play(pageInstance.autoPlayMedia[i], pageInstance);
				}
			}
		},
		stopAll: function (pageInstance) {
			var name;
			var mediaPlayers = pageInstance.mediaPlayers;
			var mediaObject;
			for (name in mediaPlayers) {
				mediaObject = mediaPlayers[name].data().jPlayer.status.media;
				if (mediaPlayers.hasOwnProperty(name)) {
					mediaPlayers[name].jPlayer("option", "fullScreen", false);
					mediaPlayers[name].jPlayer("pause", 0);
				}
				//Case 39167 - This causes iOS to pop up fullscreen video
				//mediaPlayers[name].jPlayer("setMedia", mediaObject);
			}
		},
		isPaused: function (mediaElement) {
			return mediaElement.data().jPlayer.status.paused;
		}
	};
	//holds all the functions that execute actions on things. Dependencies: assetURL, mediaPlayers, contentAPI
	var actionFunctions = {
		init: function(actions, pageInstance, clickEvent){
			pageInstance.actions = actions;
			//Remove any old delegates on the pageContainer element
			$(pageInstance.pageContainer).undelegate();
			this.clearPageTimeouts(pageInstance);
			var self = this;
			var elements = $(".dki-authoring-element", pageInstance.pageContainer);
			$(pageInstance.pageContainer).delegate(".dki-authoring-element", clickEvent, function(e){
				self.onMouseEvent.call(self, "click", this, pageInstance);
			});
			$(pageInstance.pageContainer).delegate(".dki-authoring-element a.dki-text-action-link", clickEvent, function(e){
				self.onTextActionLinkEvent.call(self, "click", this, pageInstance);
			});
			$(pageInstance.pageContainer).delegate(".dki-authoring-element", "contextmenu", function(e){
				var actions = self.onMouseEvent.call(self, "rightClick", this, pageInstance);
				if(actions.length > 0){
					return false;
				}
			});
			$(pageInstance.pageContainer).delegate(".dki-authoring-element a.dki-text-action-link", "contextmenu", function(e){
				var actions = self.onTextActionLinkEvent.call(self, "rightClick", this, pageInstance);
				if(actions.length > 0){
					return false;
				}
			});

			var mouseHandler = function(e){
				self.onMouseEvent.call(self, e.type, this, pageInstance);
			};
			$(pageInstance.pageContainer).delegate(".dki-authoring-element", "dblclick", mouseHandler);
			$(pageInstance.pageContainer).delegate(".dki-authoring-element", "mouseenter", mouseHandler);
			$(pageInstance.pageContainer).delegate(".dki-authoring-element", "mouseleave", mouseHandler);

			elements.on(DKI.ContentPage.events.elementDragStarted, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDragStopped, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDragDropped, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDragReverted, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDropDropped, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDropOut, mouseHandler);
			elements.on(DKI.ContentPage.events.elementDropOver, mouseHandler);

			elements.on(DKI.ContentPage.events.shown, function(){			
				self.onDisplayEvent.call(self, "show", this, pageInstance);
			});
			elements.on(DKI.ContentPage.events.hidden, function(){
				self.onDisplayEvent.call(self, "hide", this, pageInstance);
			});

			var textLinkHandler = function(e){
				self.onTextActionLinkEvent.call(self, e.type, this, pageInstance);
			};
			$(pageInstance.pageContainer).delegate(".dki-authoring-element a.dki-text-action-link", "dblclick", textLinkHandler);
			$(pageInstance.pageContainer).delegate(".dki-authoring-element a.dki-text-action-link", "mouseenter", textLinkHandler);
			$(pageInstance.pageContainer).delegate(".dki-authoring-element a.dki-text-action-link", "mouseleave", textLinkHandler);
			this.setupDragDrop(pageInstance);
			this.setupLinkedElements(actions, pageInstance.pageContainer, clickEvent);
			this.setupRollovers(pageInstance.pageContainer);
			pageInstance.mediaTimeUpdates = {};
			this.checkBreakPointThreshold("breakpoint", pageInstance);
			this.checkDeviceAdaptation("device", pageInstance);
			return this;
		},
		startTimeouts: function(pageInstance) {
			//start timeouts for page
			for(var i = 0; i < pageInstance.actions.length; i++){
				if(pageInstance.actions[i].pageId && pageInstance.actions[i].trigger == "time"){
					this.startPageTimer(pageInstance.actions[i], pageInstance);
				}
			}			
		},
		setupDragDrop: function(pageInstance){
			$(".dki-authoring-element[data-is-draggable=true][data-isquestionelement=false]", pageInstance.pageContainer).each(function(){
				var el = $(this);
				var axis = false;
				if(el.data("draggable-constrain-x")){
					axis = "x";
				}
				else if(el.data("draggable-constrain-y")){
					axis = "y";
				}
				var draggableCfg = {
					revert: function (dropTarget) {	            
						$(this).data("draggable").originalPosition = {
			                top: $(this).data("y"),
			                left: $(this).data("x")
			            };			            
						//if it is not dropped in a valid drop target
						if(!dropTarget){
							if($(this).data("draggable-revert")){
								$(this).data("reverted", true);
								$(this).trigger(DKI.ContentPage.events.elementDragReverted);
								return true;
							}
						}
						else{
							$(this).trigger(DKI.ContentPage.events.elementDragDropped);
						}
			        },
					start: function(event, ui){		
						$(this).parent().css("position", "static");								
						$(this).data("reverted", false);
						$(this).trigger(DKI.ContentPage.events.elementDragStarted);
						$(document).trigger(DKI.TestQuestion.events.dragStarted);
					},
					stop: function(event, ui){	
						//$(this).parent().css("position", "");							
						if($(this).data("draggable-bring-to-front")){
							if ($(this).data("reverted")) {
								$(this).css("z-index", $(this).data("elementno"));
							}
							else{
								$(this).css("z-index", 100000);
							}
						}			
						$(this).trigger(DKI.ContentPage.events.elementDragStopped);
						$(document).trigger(DKI.TestQuestion.events.dragStopped);
					},								
					disabled: false,
					containment: "#contentFrame",
					axis: axis
				};
				if(el.data("draggable-bring-to-front")){
					draggableCfg.zIndex = 100000;
					draggableCfg.stack = ".dkiContentFrame.current .dki-authoring-element[data-is-droppable=true][data-isquestionelement=false]";
				}
				el.draggable(draggableCfg);
			});
			$(".dki-authoring-element[data-is-droppable=true][data-isquestionelement=false]", pageInstance.pageContainer).droppable({
				accept: ".dkiContentFrame.current .dki-authoring-element[data-is-draggable=true][data-isquestionelement=false]",
				tolerance: "pointer",	
				drop: function(event, ui){
					
					if($(this).data("droppable-snap-to-center")){
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
					$(this).trigger(DKI.ContentPage.events.elementDropDropped);
				},
				out: function(event, ui){
					$(this).trigger(DKI.ContentPage.events.elementDropOut);
				},
				over: function(event, ui){
					$(this).trigger(DKI.ContentPage.events.elementDropOver);
				},
				disabled: false
			});
		},
		registerMediaPlayer: function(player, wrapper, pageInstance){
			var self = this;
			$(player).bind($.jPlayer.event.play, function(event){
				var elementId = this.id.replace("content_", "").replace("_player", "");
				self.onMediaPlay(elementId, pageInstance);
				var time = event.jPlayer.status.currentTime * 1000;
				if (time < 600) {
					self.onMediaStart(elementId, pageInstance);
					self.undoMediaActions.call(self, elementId, -2000, pageInstance);
				}
				else {
					self.undoMediaActions.call(self, elementId, time, pageInstance);
				}
			});
			$(player).bind($.jPlayer.event.pause, function(event){
				var elementId = this.id.replace("content_", "").replace("_player", "");
				self.onMediaPause(elementId, pageInstance);
			});
			$(player).bind($.jPlayer.event.ended, function(event){
				var elementId = this.id.replace("content_", "").replace("_player", "");
				self.onMediaEnd(elementId, pageInstance);
			});
			$(player).bind($.jPlayer.event.volumechange, function(event){
				var elementId = this.id.replace("content_", "").replace("_player", "");
				if(event.jPlayer.options.muted){
					self.onMediaVolumeChange(elementId, "mute", pageInstance);
				}
				else {
					self.onMediaVolumeChange(elementId, "unmute", pageInstance);
				}
			});
			$(player).bind($.jPlayer.event.timeupdate, function(event){

				var elementId = this.id.replace("content_", "").replace("_player", "");
				if(!pageInstance.mediaTimeUpdates[elementId]){
					pageInstance.mediaTimeUpdates[elementId] = 0;
				}
				var time = event.jPlayer.status.currentTime * 1000;
				pageInstance.mediaTimeUpdates[elementId] = time;
				if(time > 0){
					self.undoMediaActions(elementId, time, pageInstance);
					self.onTimeUpdate(time, elementId, pageInstance);
				}
			});

			//register KB shortcuts for media.
			$(".dki-element-anchor", wrapper).on("keypress", function(e){
				var jp = player.data().jPlayer;	
				var status = jp.status;
				var options = jp.options;	
				if(e.which == 32 || e.which == 13){
					if (status.paused) {
						player.jPlayer("play");
					}
					else {
						player.jPlayer("pause");
					}
				}
				else if(e.which == 102 && wrapper.data("allowfullscreen")){
					//"f"
					$(".jp-full-screen", wrapper).click();
				}
				else if(e.which == 27 && wrapper.data("allowfullscreen")){
					//escape
					$(".jp-restore-screen", wrapper).click();					
				}
				else if(e.which == 116 && wrapper.data("transcript") != ""){
					//"t"
					contentApi.showPopup({
						html: wrapper.data("transcript"),
						modal: false,
						autoFocus: true,
						returnFocus: this,
						title: playerStrings.transcriptLabel
					})
				}
				else if(e.which == 109){
					//"m"
					if (options.muted) {
						player.jPlayer("unmute");
					}
					else {
						player.jPlayer("mute");
					}
				}
				else if(e.which == 61 || e.which == 43){
					//"up"
					player.jPlayer("volume", (options.volume + 0.1));
				}
				else if(e.which == 45 || e.which == 95){
					//"down"
					player.jPlayer("volume", (options.volume - 0.1));
				}
			});
		},
		undoMediaActions: function(elementId, time, pageInstance){
			var actions = this.getActionsForMediaUndo(elementId, time, pageInstance);
			for(var i = 0; i < actions.length; i++){
				this.actionHandlers.undoAction(actions[i], pageInstance);
			}
		},
		reset: function(pageInstance){
			this.clearPageTimeouts(pageInstance);
			for(var i = 0; i < pageInstance.actions.length; i++){
				pageInstance.actions[i].firedOnce = false;
				if(pageInstance.actions[i].trigger == "breakpoint"){
					pageInstance.actions[i].hitBreakpoint = false;	
				}
				if(pageInstance.actions[i].type == "swapContent"){
					this.actionHandlers.undoAction(pageInstance.actions[i], pageInstance);
				}		
			}
			pageInstance.mediaTimeUpdates = {};
		},
		startPageTimer: function (action, pageInstance){
			var self = this;
			var handler = function(){
				self.actionHandlers[action.type](action, pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: action}]);

			};
			pageInstance.pageTimeouts.push(setTimeout(handler, action.time));
		},
		clearPageTimeouts: function(pageInstance){
			if (pageInstance.pageTimeouts) {
				for(var i = 0; i < pageInstance.pageTimeouts.length; i++){
					clearTimeout(pageInstance.pageTimeouts[i]);
				}
			}
			pageInstance.pageTimeouts = [];
		},

		setReverseAction: function(action) {
			var reverseAction = DKI.clone(action);
			switch(action.type) {
				case "show" :
					reverseAction.type = "hide";
				break;
				case "hide" :
					reverseAction.type = "show";
				break;
				case "applyEffect" :
					var params = action.parameters;
					var a = params.effect == "moveBy" || params.effect == "moveTo" ? "left" : "width";
					var b = params.effect == "moveBy" || params.effect == "moveTo" ? "top" : "height";
					if(params.effect == "moveBy" || params.effect == "resizeBy") {
						reverseAction.parameters.effectOptions.to[a] = params.effectOptions.to[a].replace(/(\+|\-)/g,function($1) {
							return $1 == "+" ? "-" : "+";
						});
						reverseAction.parameters.effectOptions.to[b] = params.effectOptions.to[b].replace(/(\+|\-)/g,function($1) {
							return $1 == "+" ? "-" : "+";
						});
					}
					else if(params.effect == "moveTo" || params.effect == "resizeTo") {
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							var x = params.effect == "moveTo" ? "x" : "width";
							var y = params.effect == "moveTo" ? "y" : "height";
							tempAction.parameters.effectOptions.to[a] = $("#" + action.targetElements[i] + "_wrapper").data(x);
							tempAction.parameters.effectOptions.to[b] = $("#" + action.targetElements[i] + "_wrapper").data(y);
							if(settings.responsive && params.effect == "resizeTo"){
								//if its a flow course we need to inherit the values from its class, not set them back.
								tempAction.parameters.effectOptions.to[a] = "";
								tempAction.parameters.effectOptions.to[b] = "";
							}
							actionArray.push(tempAction);
						}
						for(var i = 0; i < action.targetGroups.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							var x = params.effect == "moveTo" ? "x" : "width";
							var y = params.effect == "moveTo" ? "y" : "height";
							tempAction.parameters.effectOptions.to[a] = $("#group_" + action.targetGroups[i]).data(x);
							tempAction.parameters.effectOptions.to[b] = $("#group_" + action.targetGroups[i]).data(y);
							if(settings.responsive && params.effect == "resizeTo"){
								//if its a flow course we need to inherit the values from its class, not set them back.
								tempAction.parameters.effectOptions.to[a] = "";
								tempAction.parameters.effectOptions.to[b] = "";
							}
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "fadeTo"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);							
							tempAction.parameters.effectOptions.to.opacity = $("#" + action.targetElements[i] + "_wrapper").css("opacity");							
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "rotate"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);							
							tempAction.parameters.effectOptions.to.degrees = $("#" + action.targetElements[i] + "_wrapper").css("rotate");	
							tempAction.parameters.effectOptions.duration = 0;
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "scaleTo"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							var scale = $("#" + action.targetElements[i] + "_wrapper").css("scale");
							if($.isArray(scale)){
								tempAction.parameters.effectOptions.to.w = scale[0] * 100;	
								tempAction.parameters.effectOptions.to.h = scale[1] * 100;	
							}
							else{
								tempAction.parameters.effectOptions.to.w = scale * 100;	
								tempAction.parameters.effectOptions.to.h = scale * 100;	
							}
							tempAction.parameters.effectOptions.duration = 0;
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "zoomTo"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							var scale = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("scale");
							if($.isArray(scale)){
								tempAction.parameters.effectOptions.to.w = scale[0] * 100;	
								tempAction.parameters.effectOptions.to.h = scale[1] * 100;	
							}
							else{
								tempAction.parameters.effectOptions.to.w = scale * 100;	
								tempAction.parameters.effectOptions.to.h = scale * 100;	
							}
							tempAction.parameters.effectOptions.duration = 0;
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "panTo"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							tempAction.parameters.effectOptions.to.x = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("x");	
							tempAction.parameters.effectOptions.to.y = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("y");
							tempAction.parameters.effectOptions.duration = 0;
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
					else if(params.effect == "panAndZoom"){
						var actionArray = [];
						for(var i = 0; i < action.targetElements.length; i++) {
							var tempAction = DKI.clone(reverseAction);
							tempAction.parameters.effectOptions.to.x = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("x");	
							tempAction.parameters.effectOptions.to.y = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("y");
							var scale = $("#" + action.targetElements[i] + "_wrapper .dki-element-content").css("scale");
							if($.isArray(scale)){
								tempAction.parameters.effectOptions.to.w = scale[0] * 100;	
								tempAction.parameters.effectOptions.to.h = scale[1] * 100;	
							}
							else{
								tempAction.parameters.effectOptions.to.w = scale * 100;	
								tempAction.parameters.effectOptions.to.h = scale * 100;	
							}
							tempAction.parameters.effectOptions.duration = 0;
							actionArray.push(tempAction);
						}
						reverseAction = actionArray;
					}
				break;
				case "swapContent" :
					var element = $("#content_" + action.targetElements[0]);
					if(reverseAction.asset) {
						reverseAction.asset.fullAssetUrl = element.attr("src");
					}
					else if(reverseAction.parameters.swapContent) {
						reverseAction.parameters.swapContent = element.html();
					}
				break;
				case "api":
					switch(action.parameters.method){
						case "audioButtonOn":
							reverseAction.parameters.method = "audioButtonOff";
						break;						
						case "audioButtonOff":
							reverseAction.parameters.method = "audioButtonOn";
						break;						
						case "hideForward":
							reverseAction.parameters.method = "showForward";
						break;						
						case "hideBack":
							reverseAction.parameters.method = "showBack";
						break;						
						case "hideBoth":
							reverseAction.parameters.method = "showBoth";
						break;						
						case "showForward":
							reverseAction.parameters.method = "hideForward";
						break;						
						case "showBack":
							reverseAction.parameters.method = "hideBack";
						break;						
						case "showBoth":
							reverseAction.parameters.method = "hideBoth";
						break;						
						case "enableMenuButton":
							reverseAction.parameters.method = "disableMenuButton";
						break;					
						case "disableMenuButton":
							reverseAction.parameters.method = "enableMenuButton";
						break;					
					}
				break;
			}
			action.reverseAction  = reverseAction;
		},		
		checkBreakPointThreshold: function(trigger, pageInstance) {			
			//get all the actions we have to do and do them.

			var actions = this.getActionsForPageEvent(trigger, pageInstance, true);			
			for(var i =0; i < actions.length; i ++) {				
				if(!pageInstance.started && $.inArray(actions[i].type, ["show", "hide", "toggle", "applyEffect", "swapContent"]) == -1){					
					continue;
				}					
				var width = $(window).width();
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				if(actions[i].hitBreakpoint && width > actions[i].parameters.breakpoint) {
					if(DKI.isArray(actions[i].reverseAction)) {
						for(var j = 0; j < actions[i].reverseAction.length; j++) {
							this.actionHandlers[actions[i].reverseAction[j].type](actions[i].reverseAction[j], pageInstance);
							$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i].reverseAction}]);
						}
					}
					else {
						this.actionHandlers[actions[i].reverseAction.type](actions[i].reverseAction, pageInstance);
						$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i].reverseAction}]);
					}
					actions[i].hitBreakpoint = false;
				}
				else if(width <= actions[i].parameters.breakpoint && !actions[i].hitBreakpoint) {
					this.actionHandlers[actions[i].type](actions[i], pageInstance);
					$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
					actions[i].hitBreakpoint = true;
				}
			}
		},
		checkDeviceAdaptation: function(trigger, pageInstance) {
			//get all the actions we have to do and do them.
			var currentUA = dkiUA.getUAProperties();
			var actions = this.getActionsForPageEvent(trigger, pageInstance, true);
			var path = ["platform", "os", "browser"];
			for(var i =0; i < actions.length; i ++) {
				var meetFilter = false;
				if(actions[i].parameters.devices) {
					var currentNode = actions[i].parameters.devices;
					for(var j = 0; j < path.length; j ++) {
						currentNode = currentNode[currentUA[path[j]]];
						meetFilter = DKI.isObject(currentNode) ? currentNode.enabled : currentNode;
						if(meetFilter) {
							break;
						}
					}
					if(meetFilter) 
					{
						if(!actions[i].reverseAction) {
							this.setReverseAction(actions[i]);
						}
						this.actionHandlers[actions[i].type](actions[i], pageInstance);
						$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
					}
				}
			}	
		},

		onPageEvent: function(trigger, pageInstance){
			var actions = this.getActionsForPageEvent(trigger, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
			return actions;
		},
		onTextActionLinkEvent : function(trigger,target,pageInstance) {
			var actions = this.getTextLinkActionsForEvent(trigger,target, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
			return actions;
		},

		onMouseEvent: function(type, target, pageInstance){
			var actions = this.getActionsForEvent(type, $(target).data("id"), pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
			return actions;
		},
		onDisplayEvent: function(type, target, pageInstance){
			var actions = this.getActionsForEvent(type, $(target).data("id"), pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
		},
		onTimeUpdate: function(time, elementId, pageInstance){
			var actions = this.getActionForMediaEvent("time", elementId, pageInstance, time);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				actions[i].firedOnce = true;
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
		},
		onMediaStart: function(elementId, pageInstance){
			var actions = this.getActionForMediaEvent("start", elementId, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
		},
		onMediaEnd: function(elementId, pageInstance){
			var actions = this.getActionForMediaEvent("end", elementId, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
			pageInstance.mediaTimeUpdates[elementId] = 0;
		},
		onMediaPlay: function(elementId, pageInstance){
			var actions = this.getActionForMediaEvent("play", elementId, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
		},
		onMediaPause: function(elementId, pageInstance){
			if (pageInstance.started) {
				var actions = this.getActionForMediaEvent("pause", elementId, pageInstance);
				for(var i = 0; i < actions.length; i++){
					if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
					this.actionHandlers[actions[i].type](actions[i], pageInstance);
					$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
				}
			}
		},
		onMediaVolumeChange: function(elementId, trigger, pageInstance){
			var actions = this.getActionForMediaEvent(trigger, elementId, pageInstance);
			for(var i = 0; i < actions.length; i++){
				if(!actions[i].reverseAction) {
					this.setReverseAction(actions[i]);
				}
				this.actionHandlers[actions[i].type](actions[i], pageInstance);
				$(document).trigger("actionFired",[{pageContext : pageInstance, action: actions[i]}]);
			}
		},
		//utility/helper stuff
		getActionsForEvent: function(trigger, elementId, pageInstance){
			var actions = [];
			for(var i = 0; i < pageInstance.actions.length; i++){
				var action = pageInstance.actions[i];
				if(action.trigger.toLowerCase() == trigger.toLowerCase() && action.elementId == elementId && !action.textLinkId){
					actions.push(pageInstance.actions[i]);
				}
			}
			return actions;
		},
		getTextLinkActionsForEvent: function(trigger, target, pageInstance){
			var actions = [];
			var textLinkId  = $(target).data("textlinkid");
			var elementId = $(target).closest(".dki-authoring-element").data("id");
			for(var i = 0; i < pageInstance.actions.length; i++){
				var action = pageInstance.actions[i];
				if(action.elementId == elementId && action.textLinkId == textLinkId && action.trigger.toLowerCase() == trigger.toLowerCase()){
					actions.push(pageInstance.actions[i]);
				}
			}
			return actions;
		},
		getActionForMediaEvent: function(trigger, elementId, pageInstance, time){
			var actions = [];
			for(var i = 0; i < pageInstance.actions.length; i++){
				if(
					pageInstance.actions[i].trigger == trigger &&
					pageInstance.actions[i].elementId == elementId &&
					!pageInstance.actions[i].firedOnce
				) {
					if (!time) {
						actions.push(pageInstance.actions[i]);
					}
					else if(pageInstance.actions[i].time <= (time + 250)){
						actions.push(pageInstance.actions[i]);
					}
				}
			}
			return actions;
		},
		getActionsForPageEvent: function(trigger, pageInstance, ignoreFiredOnce){
			var actions = [];
			for(var i = 0; i < pageInstance.actions.length; i++){
				if(pageInstance.actions[i].trigger.toLowerCase() == trigger.toLowerCase() && (ignoreFiredOnce || !pageInstance.actions[i].firedOnce)){
					actions.push(pageInstance.actions[i]);
				}
			}
			return actions;
		},
		getActionsForMediaUndo: function(elementId, time, pageInstance){
			var actions = [];
			//get all the actions
			for(var i = pageInstance.actions.length - 1; i >= 0; i--){
				if(
					pageInstance.actions[i].elementId == elementId &&
					pageInstance.actions[i].firedOnce &&
					pageInstance.actions[i].time > (time + 250) &&
					pageInstance.actions[i].trigger.toLowerCase() == "time"
				) {
					actions.push(pageInstance.actions[i]);
				}
			}			
			return actions;
			//todo; optimize this by removing stupid ones.
		},
		//necessary data-attributes on target elements
		setupLinkedElements: function (actions, pageContainer, clickEvent){
			for(var i = 0; i < actions.length; i++){
				if(actions[i].elementId && !actions[i].textLinkId){
					$("#" + actions[i].elementId + "_wrapper", pageContainer).css({
						"cursor": "pointer"
					});
				}
				for (var j = 0; j < actions[i].targetElements.length; j++) {
					$("#" + actions[i].targetElements[j] + "_wrapper", pageContainer).addClass("dki-event-target");
				}
			}
			$("[data-actiontype=pagelink]", pageContainer).each(function(){
				$(this).css({
					"cursor": "pointer"
				});
				$(this).on(clickEvent, function(){
					if (contentAPI) {
						contentAPI.jumpToSubeo($(this).data("actiontargets"));
					}
				});
			});
			$("[data-actiontype=imagemap]", pageContainer).each(function(){
				var elementId = $(this).data("id");
				var mapEl = document.getElementById(elementId + "_imagemap");
				if (mapEl) {
					for (var i = 0; i < mapEl.childNodes.length; i++) {
						processHrefTarget($(mapEl.childNodes[i]).data("hreftarget"), $(mapEl.childNodes[i]).data("hidetargetonload"));
					}
				}
			});
		},
		setupRollovers: function (pageContainer){
			$(".dki-image-element", pageContainer).mouseover(function(){
				var id = $(this).data("id");
				//image has a rollover
				if($(this).data("rolloverassetid") && (!$(this).data("rolledover") || $(this).data("rolledover") == "false")){
					var showEffect = null;
					var meta = $(this).data("meta");
					meta = meta.split(";");
					if(meta.length >= 1){
						var showEffect = meta[0];
					}
					var rolledOver = $("#" + id + "_wrapper", pageContainer).data("rolledover");
					var hasCssReflect = $(this).hasClass('cssFX-slctr-Reflect');

					$('.dki-image-root-reflected',$("#" + id + "_wrapper")).attr('data-id',id)
					$('.dki-image-rollover-reflected',$("#" + id + "_wrapper")).attr('data-id',id)

					if(showEffect && showEffect !== "none" && (!rolledOver || rolledOver === "false")) {
						$("#content_" + id + "_rollover", pageContainer).css({
							"position": "absolute",
							"width": $("#content_" + id, pageContainer).width() + "px",
							"height": $("#content_" + id, pageContainer).height() + "px"
						});
						if(hasCssReflect){
							$('.dki-image-rollover-reflected',$("#" + id + "_wrapper")).show(showEffect,{},800, function(){
								if(settings.responsive){
									$("#content_" + id + "_rollover", pageContainer).css("position", "");
								}
							});
							$('.dki-image-root-reflected',$("#" + id + "_wrapper")).hide(showEffect,{},800);
						}else{

							$("#content_" + id + "_rollover", pageContainer).show(showEffect, {}, 800, function(){
								if(settings.responsive){
									$("#content_" + id + "_rollover", pageContainer).css("position", "");
								}
							});
							$("#content_" + id, pageContainer ).hide(showEffect, {}, 800);

						}

						$("#" + id + "_wrapper", pageContainer).data("rolledover", "true");
					}
					else if(!rolledOver || rolledOver === "false"){
						$("#content_" + id, pageContainer).parent().css("position", "");
						$("#content_" + id + "_rollover", pageContainer).parent().css("position", "");
						if(hasCssReflect){
							$("#content_" + id + "_rollover", pageContainer).parent().show();
							$("#content_" + id, pageContainer ).parent().hide();
						}else{
							$("#content_" + id + "_rollover", pageContainer).show();
							$("#content_" + id, pageContainer ).hide();
						}


						$("#" + id + "_wrapper", pageContainer).data("rolledover", "true");
					}


				}
			});

			$('.dki-image-rollover-reflected', pageContainer).mouseout(function(){
				rolloverOut($(this).data('id'),true)
			});

			$(".dki-image-rollover", pageContainer).mouseout(function(){
				rolloverOut($(this).data('id'),false)
			});

			function rolloverOut(id,hasCssReflect){

				var setToFalse = function(){
					$("#" + id + "_wrapper", pageContainer).data("rolledover", "false");
					if(settings.responsive){
						$("#content_" + id, pageContainer).css("position", "");
					}
				};
				var hideEffect = null;
				var meta = $("#" + id + "_wrapper", pageContainer).data("meta");
				meta = meta.split(";");
				if(meta.length >= 2){
					var hideEffect = meta[1];
				};

				if(hideEffect && hideEffect !== "" && $("#" + id + "_wrapper", pageContainer).data("rolledover") == "true") {
					$("#content_" + id, pageContainer).css({
						"position": "absolute",
						"top": "0",
						"left": "0"
					});
					if(hideEffect !== "none"){

						if(hasCssReflect){
							$('.dki-image-root-reflected',$("#" + id + "_wrapper")).show(hideEffect, {}, 800, setToFalse);
							$('.dki-image-rollover-reflected',$("#" + id + "_wrapper")).hide(hideEffect, {}, 800, setToFalse)
						}else{
							$("#content_" + id, pageContainer).show(hideEffect, {}, 800, setToFalse);
							$("#content_" + id + "_rollover", pageContainer).hide(hideEffect, {}, 800, setToFalse)
						};
					}else{
						if(hasCssReflect){
							$('.dki-image-root-reflected',$("#" + id + "_wrapper")).show();
							$('.dki-image-rollover-reflected',$("#" + id + "_wrapper")).hide();
						}else{
							$("#content_" + id, pageContainer).show();
							$("#content_" + id + "_rollover", pageContainer).hide();
						}
						setToFalse();
					}
				}
			}

		},

		//an object that holds all the action types as functions to call
		actionHandlers: {
			show: function(action, pageInstance){
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				var config = {
					type: action.type,
					effect: action.parameters.effect,
					targetElements: action.targetElements,
					targetGroups: action.targetGroups,
					delay: delay,
					action: action
				};
				if(action.parameters.effectOptions){
					config.effectOptions = action.parameters.effectOptions;
				}
				this.doDisplayAction(config, pageInstance);
			},
			hide: function(action, pageInstance){
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				var config = {
					type: action.type,
					effect: action.parameters.effect,
					targetElements: action.targetElements,
					targetGroups: action.targetGroups,
					delay: delay,
					action: action
				};
				if(action.parameters.effectOptions){
					config.effectOptions = action.parameters.effectOptions;
				}
				this.doDisplayAction(config, pageInstance);
			},
			toggle: function(action, pageInstance){
				var showTargets = [];
				var hideTargets = [];
				if (action.targetElements) {
					for (var i = 0; i < action.targetElements.length; i++) {
						if ($("#" + action.targetElements[i] + "_wrapper").css("display") === "none") {
							showTargets.push(action.targetElements[i]);
						}
						else {
							hideTargets.push(action.targetElements[i]);
						}
					}
				}
				var showGroups = [];
				var hideGroups = [];
				if (action.targetGroups) {
					for (var i = 0; i < action.targetGroups.length; i++) {
						if ($("#group_" + action.targetGroups[i]).css("display") === "none") {
							showGroups.push(action.targetGroups[i]);
						}
						else {
							hideGroups.push(action.targetGroups[i]);
						}
					}
				}
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				var showConfig = {
					type: "show",
					effect: action.parameters.showEffect,
					targetElements: showTargets,
					targetGroups: showGroups,
					delay: delay,
					action: action
				};
				if(action.parameters.showEffectOptions){
					showConfig.effectOptions = action.parameters.showEffectOptions;
				}
				var hideConfig = {
					type: "hide",
					effect: action.parameters.hideEffect,
					targetElements: hideTargets,
					targetGroups: hideGroups,
					delay: delay,
					action: action
				};
				if(action.parameters.hideEffectOptions){
					hideConfig.effectOptions = action.parameters.hideEffectOptions;
				}
				this.doDisplayAction(showConfig, pageInstance);
				this.doDisplayAction(hideConfig, pageInstance);
			},
			doDisplayAction: function(config, pageInstance){
				var self = this;

				if(!config.action.undo){
					config.action.undo = {};
				}
				var targets = this.getTargetSelector(config, "[data-type!='zoomRegion']");				
				var targetGroupSelector = this.getTargetSelector({targetGroups: config.targetGroups});
				var targetsToHide = this.getTargetsToHide(config.action, pageInstance);
				var targetsToHideSelector = this.getTargetSelector(targetsToHide);
				var callback = function () {
					var target = $(this);
					var event = config.type === "show" ? DKI.ContentPage.events.shown : DKI.ContentPage.events.hidden;
					if(target.hasClass("dki-authoring-group")){
						//if its a group, call the callback for its visible elements
						var elements = $(".dki-authoring-element", this);
						if(config.type == "show"){
							elements = elements.filter(":visible");
						}
						elements.each(callback);
					}
					else{
						var contentID = "content_" + target.data("id");
						var content = $("#" + contentID);

						if(!settings.responsive){
							$(targetGroupSelector).css({"height": "", "width": ""});
						}
						//Callback will be fired once for each element shown/hidden.  As it's a jQuery callback,
						//'this' will be the element being shown/hidden					
						target.trigger(event, this);
						if (config.type === "show"){						
							if(content.data("autoplay") && target.data("type") != "flash") {
								mediaFunctions.play(contentID, pageInstance);
							}
							if(target.data("type") == "marker"){
								var outline = pageInstance.getClaroElementById(target.data("id"));
								if(outline.parameters.config.trigger == "custom" && outline.meta != ""){
									content.tooltipster("show");
								}
							}
						}
						else if(config.type == "hide"){

							$("iframe", this).each(function(){
								if(!$(this).attr("data-src")){
									$(this).attr("data-src", this.src);
								}
								this.src = "about:blank";
							});
							if(target.data("multimedia") && target.data("type") != "flash"){
								mediaFunctions.pause(contentID, pageInstance);
							}
							if(config.action.trigger == "breakpoint") {
								$(this).css("display", "none");
							}
							if(target.data("type") == "marker"){
								var outline = pageInstance.getClaroElementById(target.data("id"));
								if(outline.parameters.config.trigger == "custom" && outline.meta != ""){
									content.tooltipster("hide");
								}
							}					
						}

						//gotta re-render the shape as some of the effects cause it to go white
						if(target.data("type") == "shape" && dkiUA.ie){
							shapeFunctions.renderShapes(this, pageInstance);
						}
					}
				};
				if (targets !== "") {					
					var handler = function(){
						if(!settings.responsive){
							$(targetGroupSelector).css({"height": "100%", "width": "100%"});
						}
						if(config.type == "show" && pageInstance.started){							
							$("iframe", targets).each(function(){
								this.src = $(this).attr("data-src");
							});
						}
						if (config.action.type == "toggle" && config.type == "show") {
							config.action.undo.showTargetSelector = targets;
						}
						else if (config.action.type == "toggle" && config.type == "hide") {
							config.action.undo.hideTargetSelector = targets;
						}
						config.action.undo.targetsToHideSelector = targetsToHideSelector;
						$(targetsToHideSelector).hide();
						
						if(config.effect == "type"){
							$(targets).each(function(){
								var el = $(this);
								if(el.data("isrichtext")){
									var content = el.find(".dki-element-content");
									var html = content.html();
									content.html("");
									el.show().typist({
										text: html
									});
								}
							})
						}
						else if(config.effect == "text_grow"){
							$(targets).each(function(){
								var el = $(this);
								if(el.data("isrichtext")){
									var content = el.find(".dki-element-content");
									el.show();
									content.letterfx({"fx":"grow","backwards":false,"timing":50,"fx_duration":config.effectOptions.duration+"ms","letter_end":"restore","element_end":"restore"});
								}
							})
							
						}
						else {
							if (config.effect == "" || config.effect == "none") {
								$(targets, pageInstance.pageContainer)[config.type](0, callback);					
							}
							var zoomTargets = self.getTargetSelector(config, "[data-type='zoomRegion']", " .dki-zoomRegion-element");
							if (config.effectOptions) {
								if(config.effect == "blind" || config.effect == "clip"){
									if(config.effectOptions.direction){
										if(config.effectOptions.direction == "right" || config.effectOptions.direction == "left"){
											config.effectOptions.direction = "horizontal";
										}
										else if(config.effectOptions.direction == "up" || config.effectOptions.direction == "down"){
											config.effectOptions.direction = "vertical";
										}
									}
								}
								$(targets, pageInstance.pageContainer)[config.type](config.effect, config.effectOptions, callback);
							}
							else {
								$(targets, pageInstance.pageContainer)[config.type](config.effect, callback);
							}
							if(config.type == "show"){
								$(zoomTargets, pageInstance.pageContainer).show().each(function(){
									var region = this;
									contentApi.zoomToElement($(this).data("id"), pageInstance, config.effectOptions.duration, function(){
										callback.call(region);
									});
								});
							}
							else{
								if(zoomTargets != ""){
									contentApi.zoomOut(pageInstance, config.effectOptions.duration,function(){
										$(zoomTargets, pageInstance.pageContainer).hide().each(function(){
											var region = this;
											callback.call(region);
										});
									});
								}
							}

						}
					};
					pageInstance.pageTimeouts.push(setTimeout(handler, config.delay));
				}
				else if(targetsToHideSelector !== ""){
					$(targetsToHideSelector).hide();
					config.action.undo.targetsToHideSelector = targetsToHideSelector;
				}
			},
			applyEffect: function(action, pageInstance){			
				var self = this;
				var time = 0;

				if(action.trigger != "time"){
					time = action.time;
				}
				var targets = this.getTargetSelector(action, "", " .dki-authoring-element");

				if (targets !== "") {
					if(action.parameters.effect == "moveTo" || action.parameters.effect == "moveBy"){						
						action.undo = {
							targets: {}
						};
						for(var i = 0; i < action.targetElements.length; i++){
							action.undo.targets[action.targetElements[i]] = {
								left: $("#" + action.targetElements[i] + "_wrapper", pageInstance.pageContainer).css("left").split("px")[0],
								top: $("#" + action.targetElements[i] + "_wrapper", pageInstance.pageContainer).css("top").split("px")[0]
							}
						}
					}
					else if(action.parameters.effect == "resizeTo" || action.parameters.effect == "resizeBy"){
						action.undo = {
							targets: {}
						};
						for(var i = 0; i < action.targetElements.length; i++){
							action.undo.targets[action.targetElements[i]] = {
								width: $("#" + action.targetElements[i] + "_wrapper", pageInstance.pageContainer).css("width").split("px")[0],
								height: $("#" + action.targetElements[i] + "_wrapper", pageInstance.pageContainer).css("height").split("px")[0]
							}
						}
					}					
					var handler = function(){					
						if (action.parameters && action.parameters.effectOptions) {
							if(action.parameters.effect == "moveTo"){
								// have to handle moveTo for groups specially to ensure that the whole group moves together properly
								var targetElements = self.getTargetSelector({targetElements: action.targetElements});
								$(targetElements).effect(action.parameters.effect, action.parameters.effectOptions,function(){										
									if($(this).data("type") == "zoomRegion"){
										contentApi.zoomToElement($(this).data("id"));
									}
								});

								for(var i = 0; i < action.targetGroups.length; i++){
									var group = $("#group_" + action.targetGroups[i]);
									var elements = group.children('.dki-authoring-element');
									var leastPos = {
										top: parseInt(elements[0].style.top),
										left: parseInt(elements[0].style.left)
									};

									for(var j = 1; j < elements.length; j++){
										var elementPos = $(elements[j]).position();
										leastPos.top = Math.min(leastPos.top, elementPos.top);
										leastPos.left = Math.min(leastPos.left, elementPos.left);
									}

									var moveBy = {
										top: "+=" + (action.parameters.effectOptions.to.top -leastPos.top),
										left: "+=" + (action.parameters.effectOptions.to.left - leastPos.left)
									};
									$(elements).effect("moveBy", {to: moveBy});									
								}
							}	
							else if(action.parameters.effect == "rotate"){													
								var properties = {
									rotateZ: action.parameters.effectOptions.to.degrees
								};
								$(targets).velocity(properties, {duration: action.parameters.effectOptions.duration});
							}
							else if(action.parameters.effect == "scaleTo"){				
								var properties = {
									scaleX: action.parameters.effectOptions.to.w/100,
									scaleY: action.parameters.effectOptions.to.h/100
								}
								$(targets).velocity(properties, {duration: action.parameters.effectOptions.duration});
							}
							else if(action.parameters.effect == "panTo"){						
								var properties = {
									translateX: action.parameters.effectOptions.to.x,
									translateY: action.parameters.effectOptions.to.y
								};
								$(targets).css("overflow", "hidden");
								$(".dki-element-content", targets).velocity(properties, {duration: action.parameters.effectOptions.duration});
							}
							else if(action.parameters.effect == "zoomTo"){			
								var properties = {
									scaleX: action.parameters.effectOptions.to.w/100,
									scaleY: action.parameters.effectOptions.to.h/100
								}
								$(targets).css("overflow", "hidden");
								$(".dki-element-content", targets).velocity(properties, {duration: action.parameters.effectOptions.duration});
							}
							else if(action.parameters.effect == "panAndZoom"){													
								var properties = {
									translateX: action.parameters.effectOptions.to.x,
									translateY: action.parameters.effectOptions.to.y,
									scaleX: action.parameters.effectOptions.to.w/100,
									scaleY: action.parameters.effectOptions.to.h/100
								}
								$(targets).css("overflow", "hidden");
								$(".dki-element-content", targets).velocity(properties, {duration: action.parameters.effectOptions.duration});
							}				
							else{
								var options = DKI.clone(action.parameters.effectOptions);
								if(action.parameters.effect == "fadeTo"){
									options.to.opacity = action.parameters.effectOptions.to.opacity / 100;
								}
								$(targets).effect(action.parameters.effect, options);
							}
						}
						else {
							$(targets).effect(action.parameters.effect);
						}
					};
					pageInstance.pageTimeouts.push(setTimeout(handler, time));
				}
			},
			http: function(action, pageInstance){
				if (action.parameters.url.indexOf("mailto:") > -1) {
					location.href = action.parameters.url;
				}
				else {
					if (action.parameters.target && action.parameters.target === "modal") {
						contentAPI.openModal(action.parameters.url);
					}
					else {
						var httpWindow = window.open(action.parameters.url, '_blank');
						httpWindow.focus();
					}
				}
			},
			asset: function(action, pageInstance){
				if (action.parameters && action.parameters.target && action.parameters.target === "modal") {
					contentAPI.openModal(settings.assetURL + action.asset.filename);
				}
				else {
					var assetWindow = window.open(settings.assetURL + action.asset.filename, 'assetWindow');
				}
			},
			lightBox: function(action, pageInstance){
				var time = 0;
				if(action.trigger != "time"){
					time = action.time;
				}
				var targets = this.getTargetSelector(action);				
				if (targets !== "") {
					var handler = function(){
						//$(targets).attr("rel", "lightBox")
						/*Case 49182 - Fancybox 2.1.5 uses autosizingand and requires child elements to have some type of dimensions, otherwise we risk unexpected results. We'll set the clones of our elements to max and min their containers so autosizing works properly. See fancybox documentation for more info*/
						var els =[];
						 $(targets).each(function(idx,item){
						 	var tar = $(item);
						 	var elm = tar.clone();

						 	// append _lightbox to the end of each id to ensure we don't get duplicate IDs messing up events
						 	var children = elm.find('*');
						 	for(var i = 0; i < children.length; i++){
						 		var child = $(children[i]);
						 		child.prop('id', child.prop('id') + '_lightbox');
						 	}
						 	elm.prop('id', elm.prop('id') + '_lightbox');

						 	var cssProps = {
								"min-width" : "150px",
								"max-width" : ($(pageInstance.pageContainer).width() - 20) + "px", 
								"position": "static",
								"display": "block",
								"height": "",
								"width":"",
								"cursor": "",
								"opacity": ""
							};
							elm.css(cssProps);

							elm.find('map, .dki-image-rollover').detach();
							$.each(elm.find("img"), function(key){
								$(this).css({
									"position": "static", 
									"opacity": "", 
									"display": "block"
								}); // for images that may be affected by rollovers when the lightbox action fires
								if($(this).attr('usemap')){ // disable image maps for images in a lightbox
									$(this).attr('usemap', '');
								}
							});
							
							$.each(elm.find("iframe"), function(key){
								if ($(this).attr('src') == "about:blank" && $(this).data('src')){
									$(this).attr('src', $(this).data('src'));
								}
							});

							elm.attr("id", ""); // to ensure that actions won't work from the lightbox and won't target elements that have been cloned into the lightbox

							if(tar.data("isrichtext")){
								cssProps["overflow-y"] = "auto";
							}
						 	els.push(elm);
						 });					
						$.fancybox.open(els, {
							openEffect  : 'none',
							closeEffect : 'none',
							nextEffect  : 'none',
							prevEffect  : 'none',
							padding     : 0,
							margin      : [20, 60, 20, 60], // Increase left/right margin
							scrolling: dkiUA.isIE()? "visible": "auto",
							//43114 - Our iframe elements don't render with source set (that happens on page load); we need to load and unload when the elements are previewed.
							afterLoad : function(current,previous){
								if(current.element.is("iframe")){
									current.element.attr("src", current.element.data('src'));
								}
								if(previous && previous.element.is("iframe")){
									previous.element.attr("src", "about:blank");
								}
							},
							afterShow: function(){
								if(this.element.hasClass("dki-video-element")){
									mediaFunctions.handleVideo(this.element.find(".dki-video-content-element"), pageInstance);
								}
								else if(this.element.hasClass("dki-audio-element")){
									var playerElm = this.element.find("div[data-elementType='audio']");
									this.element.css("height", "100%"); // ensure there's enough height for the controls
									playerElm.siblings(".jp-audio, .jp-basic").detach(); // handleAudio() doesn't clear any old controls; since this element was copied from an existing audio element, do that manually
									mediaFunctions.handleAudio(playerElm, pageInstance);
								}

							},
							beforeShow: function(){
								for(var i = 0; i < els.length; i++){
									els[i].element.width(els[i].element.width() || ''); // calculate the width of the elements and force the element to that width so fancybox knows what width to set the box
								}
							}
						});
					};
					pageInstance.pageTimeouts.push(setTimeout(handler, time));
				}
			},
			api: function(action, pageInstance){
				var time = 0;
				var action = action;
				if(action.trigger != "time"){
					time = action.time;
				}
				var handler = function(){
					var arguments = action.parameters.methodConfig ? action.parameters.methodConfig : {};
					if(action.parameters.method == "jumpToElement" && action.targetElements[0]){
						arguments.elementId = action.targetElements[0];
					}
					contentAPI[action.parameters.method](arguments);
				};
				// if there's no time delay and the action goes to the next or previous page then navigate directly to the page in this action
				if(time == 0 && (action.parameters.method == "contentGoNext" || action.parameters.method == "contentGoBack")){
					handler();
				}
				else{
					pageInstance.pageTimeouts.push(setTimeout(handler, time));
				}
			},
			playMedia: function(action, pageInstance){
				var handler = function(){
					for (var i = 0; i < action.targetElements.length; i++) {
						var mediaEl = pageInstance.mediaPlayers["content_" + action.targetElements[i]];
						var params = action.parameters;

						if (params && typeof params.startTime !== 'undefined') {
							mediaEl.jPlayer("play", (params.startTime / 1000));
						}
						else {
							mediaEl.jPlayer("play");
						}

						if (action.parameters && typeof params.endTime !== 'undefined') {
							action.firedOnce = true;
							$(mediaEl).bind($.jPlayer.event.timeupdate, function(event){
								if (action.firedOnce) {
									var time = event.jPlayer.status.currentTime * 1000;
									if (time > action.parameters.endTime) {
										mediaEl.jPlayer("pause");
										action.firedOnce = false;
									}
								}
							});
						}
					}
				};
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				pageInstance.pageTimeouts.push(setTimeout(handler, delay));
			},
			replayMedia: function(action, pageInstance){
				var handler = function(){
					for (var i = 0; i < action.targetElements.length; i++) {
						var mediaEl = pageInstance.mediaPlayers["content_" + action.targetElements[i]];
						mediaFunctions.play(mediaEl, pageInstance, 0);
					}
				};
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				pageInstance.pageTimeouts.push(setTimeout(handler, delay));
			},
			pauseMedia: function(action, pageInstance){
				var handler = function(){
					for (var i = 0; i < action.targetElements.length; i++) {
						var player = pageInstance.mediaPlayers["content_" + action.targetElements[i]];
						player.jPlayer("pause");
					}
				};
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				pageInstance.pageTimeouts.push(setTimeout(handler, delay));
			},
			toggleMedia: function(action, pageInstance){
				var handler = function(){
					for (var i = 0; i < action.targetElements.length; i++) {
						var player = pageInstance.mediaPlayers["content_" + action.targetElements[i]];
						if (player.data().jPlayer.status.paused) {
							player.jPlayer("play");
						}
						else {
							player.jPlayer("pause");
						}
					}
				};
				var delay = 0;
				if(action.trigger != "time"){
					delay = action.time;
				}
				pageInstance.pageTimeouts.push(setTimeout(handler, delay));
			},
			undoAction: function(action, pageInstance){				
				var self = this;
				if (action.type == "show" || action.type == "hide") {
					var targets = this.getTargetSelector(action);
					if(action.type == "show"){
						$(targets, pageInstance.pageContainer).hide("fade", {duration:0});
					}
					else{
						$(targets, pageInstance.pageContainer).show("fade", {duration:0});

					}
					$(action.undo.targetsToHideSelector, pageInstance.pageContainer).show();
				}
				else if(action.type == "toggle"){
					$(action.undo.showTargetSelector, pageInstance.pageContainer).hide();
					$(action.undo.hideTargetSelector, pageInstance.pageContainer).show();
					$(action.undo.targetsToHideSelector, pageInstance.pageContainer).show();
				}
				else if(action.type == "applyEffect"){
					if(action.parameters.effect == "moveTo" || action.parameters.effect == "moveBy"){
						$.each(action.undo.targets, function(key){
							 $("#" + key + "_wrapper", pageInstance.pageContainer).effect(action.parameters.effect, {
							 	duration: 0,
								to: {
									"left": this.left,
									"top": this.top
								}
							 });
						});
					}
					else if(action.parameters.effect == "resizeTo" || action.parameters.effect == "resizeBy"){
						$.each(action.undo.targets, function(key){							 
							 $("#" + key + "_wrapper", pageInstance.pageContainer).effect(action.parameters.effect, {
							 	duration: 0,
								to: {
									"width": this.width,
									"height": this.height
								}
							 });
						});
					}
					else if(action.reverseAction){
						if($.isArray(action.reverseAction)){
							$.each(action.reverseAction, function(key){		
								self[this.type](this, pageInstance);
							});
						}
						else{
							self[action.reverseAction.type](action.reverseAction, pageInstance);
						}
					}
				}
				if(action.type == "swapContent"){
					if(action.originalContent){
						var el = $("#content_" + action.targetElements[0], pageInstance.pageContainer);
						if(action.asset){
							el.attr("src",action.originalContent);
							el.attr("data-src",action.originalContent);
						}else {
							el.html(action.originalContent);
						}
					}
				}
				action.firedOnce = false;
			},
			//elementExtra is used to append things to the standard selector to explicitly grab certain things where needed...
			getTargetSelector: function(action, elementExtra, groupExtra){
				if(elementExtra == undefined){
					elementExtra = "";
				}
				if(groupExtra == undefined){
					groupExtra = "";
				}
				var targetSelector = "";
				if (action.targetElements) {
					for (var i = 0; i < action.targetElements.length; i++) {
						targetSelector += "#" + action.targetElements[i] + "_wrapper" + elementExtra + ",";
					}
				}
				if (action.targetGroups) {
					for (var i = 0; i < action.targetGroups.length; i++) {
						if(action.type == "applyEffect"){
							targetSelector += "#group_" + action.targetGroups[i] + groupExtra + elementExtra + ",";
						}
						else{
							targetSelector += "#group_" + action.targetGroups[i] + groupExtra + ",";
						}
					}
				}
				if (targetSelector !== "") {
					targetSelector = targetSelector.substring(0, targetSelector.length - 1);
				}
				return targetSelector;
			},			
			getTargetsToHide: function(action, pageInstance){
				var targetsToHide = {
					targetElements: [],
					targetGroups: []
				};
				if(action.parameters && action.parameters.hideOthers){
					for(var i = 0; i < pageInstance.actions.length; i++){
						if(pageInstance.actions[i].type === "show" || pageInstance.actions[i].type === "toggle"){
							if (pageInstance.actions[i].id !== action.id && !pageInstance.actions[i].pageId) {
								for(var j = 0; j < pageInstance.actions[i].targetElements.length; j++){
									if ($("#" + pageInstance.actions[i].targetElements[j] + "_wrapper").data("donthide") != true) {
										var partOfCurrentAction = false;
										for(var k = 0; k < action.targetElements.length; k++){
											if(action.targetElements[k] == pageInstance.actions[i].targetElements[j]){
												partOfCurrentAction = true;
											}
										}
										if (!partOfCurrentAction && $("#" + pageInstance.actions[i].targetElements[j] + "_wrapper", pageInstance.pageContainer).is(":visible")) {
											targetsToHide.targetElements.push(pageInstance.actions[i].targetElements[j]);
										}
									}

								}	
								for(var j = 0; j < pageInstance.actions[i].targetGroups.length; j++){
									var partOfCurrentAction = false;
									for(var k = 0; k < action.targetGroups.length; k++){
										if(action.targetGroups[k] == pageInstance.actions[i].targetGroups[j]){
											partOfCurrentAction = true;
										}
									}
									if (!partOfCurrentAction && $("#group_" + pageInstance.actions[i].targetGroups[j], pageInstance.pageContainer).is(":visible")) {
										targetsToHide.targetGroups.push(pageInstance.actions[i].targetGroups[j]);
									}
								}																
							}
						}
					}
					$(".dki-imagemap-target", pageInstance.pageContainer).each(function(){				
						if ($(this).data("donthide") != true) {
							var partOfCurrentAction = false;
							for(var k = 0; k < action.targetElements.length; k++){
								if(action.targetElements[k] == $(this).data("id")){
									partOfCurrentAction = true;
								}
							}
							if (!partOfCurrentAction && $(this).is(":visible")) {
								targetsToHide.targetElements.push($(this).data("id"));
							}
						}
					});
						
				};
				return targetsToHide;
			},
			swapContent :function(action, pageInstance) {								
				var self = this;
				var time = 0;
				var action = action;
				if(action.trigger != "time"){
					time = action.time;
				}
				var handler = function(){
					self.performSwap(action,pageInstance);
				};
				// if there's no time delay and the action goes to the next or previous page then navigate directly to the page in this action
				if(time == 0){
					handler();
				}
				else{
					pageInstance.pageTimeouts.push(setTimeout(handler, time));
				}
			},
			performSwap : function(action, pageInstance) {
				var type = action.asset  ? "asset" : "text";
				var el = $("#content_" + action.targetElements[0]);
				switch(type) {
					case "text" :
						var newText = action.parameters.swapContent;
						if(!action.originalContent){
							action.originalContent = el.html();
						}
						el.html(newText);
						el.attr("data-meta", newText);
					break;
					case "asset" :
						var newImg = action.asset.fullAssetUrl ? action.asset.fullAssetUrl : settings.assetURL + action.asset.filename;
						if(!action.originalContent){	
							action.originalContent = el.attr("src");
						}
						el.attr("src", newImg);
						el.attr("data-src", newImg);
					break;
				}
			}
		}
	};

	var shapeFunctions = {
		init : function (pageInstance) {
			if (this.canRenderShapes()) {
				try {
					this.loadShapes(pageInstance);
				}
				catch(e){
					this.loadHtmlShapes(pageInstance);
				}
			}
			else {
				this.loadHtmlShapes(pageInstance);
			}
		},
		loadShapes: function (pageInstance) {
			var that = this;
			$(".dki-shape-element", pageInstance.pageContainer).each(function(){
				var display = this.style.display;
				$(this).css({
					opacity: 0,
					display: "block"
				});
				that.renderShapes(this, pageInstance);

				$(this).css({
					opacity: $(this).data("opacity"),
					display: display
				});
			});
		},
		loadHtmlShapes: function (pageInstance){
			$(".dki-shape-element", pageInstance.pageContainer).each(this.renderShapeHtml);
		},

		renderShapeHtml: function (){
			var el = $(this);
			var shapetype = el.data("shapetype");
			if(shapetype != "rect" && shapetype != "hline" && shapetype != "vline" && shapetype != "circle" && shapetype != "ellipse"){
				return;
			}
			var id = el.data('id');
			var titleString = "";
			if(el.data("title") != ""){
				titleString = "title='" + el.data("title") + "'";
			}
			var borderType = "solid";
			if(el.data("bordertype") == "."){
				borderType = "dotted";
			}
			else if(el.data("bordertype") == "-"){
				borderType = "dashed";
			}
			var styleString = "";
			if(shapetype == "rect"){
				var width = el.data("width") - (parseInt(el.data("linethickness")) * 2);
				var height = el.data("height") - (parseInt(el.data("linethickness")) * 2);
				styleString += "width:" + width + "px;";
				styleString += "height:" + height + "px;";
				styleString += "border:" + el.data("linethickness") + "px " + borderType + " " + el.data("linecolour") + ";";
				styleString += "background-color:" + el.data("fillcolour") + ";";
				if(el.data("roundedcorners") == true){
					styleString += "-moz-border-radius: 15px; -webkit-border-radius: 15px;	border-radius: 15px;";
				}
			}
			else if(shapetype == "hline"){
				styleString += "height:" + el.data("linethickness") + "px;";
				styleString += "width:" + el.data("width") + "px;";
				styleString += "border-top:" + el.data("linethickness") + "px " + borderType + " " + el.data("linecolour") + ";";
			}
			else if(shapetype == "vline"){
				styleString += "width:" + el.data("linethickness") + "px;";
				styleString += "height:" + el.data("height") + "px;";
				styleString += "border-left:" + el.data("linethickness") + "px " + borderType + " " + el.data("linecolour") + ";";
			}
			else if(shapetype == "circle" || shapetype == "ellipse"){
				var width = el.data("width") - (parseInt(el.data("linethickness")) * 2);
				var height = el.data("height") - (parseInt(el.data("linethickness")) * 2);
				styleString += "width:" + width + "px;";
				styleString += "height:" + height + "px;";
				styleString += "background-color:" + el.data("fillcolour") + ";";
				styleString += "border:" + el.data("linethickness") + "px " + borderType + " " + el.data("linecolour") + ";";
				var borderRadius = "";
				if(el.data("width") > el.data("height")){
					borderRadius = parseInt(el.data("width")) / 2 + "px";
				}
				else{
					borderRadius = parseInt(el.data("height")) / 2 + "px";
				}
				styleString += "-moz-border-radius: " + borderRadius + "; -webkit-border-radius:" + borderRadius + ";border-radius: " + borderRadius + ";";
			}
			var mouseOver = "";
			var mouseOut = "";
			if(el.data("rollover") == true){
				mouseOver += " onmouseover='"
				mouseOver += 'this.style.backgroundColor = "' + el.data("rollovercolour") + '";';
				mouseOver += 'this.style.borderColor = "' + el.data("strokerollover") + '";';
				mouseOver += "' ";
				mouseOut += " onmouseout='"
				mouseOut += 'this.style.backgroundColor = "' + el.data("fillcolour") + '";';
				mouseOut += 'this.style.borderColor = "' + el.data("linecolour") + '";';
				mouseOut += "' ";
			}
			$("#" + id + "_content_wrapper").append("<div class='dki-element-overlay'></div><div " + titleString + " id='content_" + id + "' class='" + el.data("cssclass") + "' style='" + styleString + "' " + mouseOver + mouseOut + "></div>");
		},

		renderShapes: function(element, pageInstance){			
			if (!$(element).data("sourceHtml")) {
				$(element).data("sourceHtml", $(element).html());
			}
			else{
				$(element).html($(element).data("sourceHtml"));
			}

			var fillColour = element.getAttribute("data-fillcolour") === "null" ? null : element.getAttribute("data-fillcolour");
			var gradient = element.getAttribute("data-fillgradient") === "null" ? null : element.getAttribute("data-fillgradient");
			var rolloverString;
			var rolloverFill;
			var opacity = 1;
			var rolloverOpacity = 1;
			var strokeColour =element.getAttribute("data-lineColour");
			rolloverFill = element.getAttribute("data-rollovercolour") == null || element.getAttribute("data-rollovercolour") == "none"? element.getAttribute("data-fillcolour"):element.getAttribute("data-rollovercolour");
			var rolloverGradient = element.getAttribute("data-rollovergradient") == null || element.getAttribute("data-rollovergradient") == "null"? element.getAttribute("data-fillgradient"):element.getAttribute("data-rollovergradient");
			var rolloverStroke = element.getAttribute("data-strokerollover") == null || element.getAttribute("data-strokerollover") == "none"?element.getAttribute("data-linecolour"):element.getAttribute("data-strokerollover");
			var shape = {};
			var borderThickness = element.getAttribute("data-linethickness");
			var width = parseInt(element.getAttribute("data-width")) - borderThickness;
			var height = parseInt(element.getAttribute("data-height"))  - borderThickness;
			var shapeType = element.getAttribute("data-shapeType").split(":");
			var el = $("#content_" + element.getAttribute("data-id"), pageInstance.pageContainer)[0];
			var paper = Raphael(el,0,0, "100%", "100%");
			paper.canvas.style.height = element.getAttribute("data-height") + "px";
			paper.canvas.style.width = element.getAttribute("data-width") +"px";
			paper.canvas.style.filter = "inherit";
			paper.canvas.style.display = "block";
			paper.width = element.getAttribute("data-height");
			paper.height =  element.getAttribute("data-width");
			paper.canvas.id = "content_" + element.getAttribute("data-id");
			if (gradient === "transparent" || fillColour === null){
					gradient = fillColour;
					opacity = 0;
			}
			if(element.getAttribute("data-filltype") == "1"){
				fillColour = element.getAttribute("data-colourAngle") + "-" + element.getAttribute("data-fillcolour") + "-" + gradient + ":" + element.getAttribute("data-stopPoint");
			}
			else if(element.getAttribute("data-filltype") == "2"){
				fillColour = "r(" + element.getAttribute("data-radialx") + "," + element.getAttribute("data-radialy") + ")" + element.getAttribute("data-fillcolour") + ":" +element.getAttribute("data-stopPoint") + "-" + gradient;
			}

			fillColour = fillColour == "transparent"? "": fillColour;

			if (rolloverGradient === "transparent" || rolloverFill === null){
					rolloverGradient = rolloverFill;
					rolloverOpacity = 0;
			}
			if (element.getAttribute("data-filltype") == "0"){
				rolloverString = rolloverFill;
			}
			else if(element.getAttribute("data-filltype") == "1"){
				rolloverString = element.getAttribute("data-colourAngle") + "-" + rolloverFill + ":" + element.getAttribute("data-stopPoint") + "-" +rolloverGradient;
			}
			else if(element.getAttribute("data-filltype") == "2"){
				rolloverString = "r(" + element.getAttribute("data-radialx") + "," + element.getAttribute("data-radialy") + ")" + rolloverFill + ":" + element.getAttribute("data-stopPoint")+ "-" + rolloverGradient;
			}
			rolloverString = rolloverString == "transparent"? "": rolloverString;
			var strokeColour = element.getAttribute("data-lineColour") == "transparent"? "" : element.getAttribute("data-lineColour");

			var cfg = {
				'fill': fillColour,
				'stroke':strokeColour,
				'stroke-width' : borderThickness,
				'stroke-dasharray': element.getAttribute("data-borderType"),
				'fill-opacity' : opacity
			}
			if(dkiUA.ie && dkiUA.ieVersion <= 8){
				cfg["opacity"] = element.getAttribute("data-opacity") / 100;
			}
			switch(shapeType[0]){
				case "rect":
					cfg["r"] = element.getAttribute("data-roundedCorners") == "true" ? 15:0;
					shape = paper.rect(borderThickness/2, borderThickness/2, width, height);
				break;
				case "circle":
					shape = paper.circle((height/2)+borderThickness/2,(height/2)+borderThickness/2, (height/2));
				break;
				case "ellipse":
					shape = paper.ellipse((width/2) + (borderThickness/2),(height/2) + (borderThickness/2),width/2, height/2);
				break;
				case "vline":
					var x = parseInt(borderThickness);
					shape = paper.path("M" + x/2 + ",0 L" + x/2 + "," + (height+x));
				break;
				case "hline":
					var y = parseInt(borderThickness);
					shape = paper.path("M0," + y/2 +" L" + (width+y) + "," + y/2);
				break;
			}

			shape.attr(cfg);
			shape.node.style.filter = "inherit";
			if (element.getAttribute("data-rollover") == "true") {
				$(element).mouseover(function(event){
					shape.attr({
						"fill": rolloverString,
						"stroke": rolloverStroke,
						"fill-opacity" : rolloverOpacity
					});
				});
				$(element).mouseout(function(event){
					shape.attr({
						"fill": fillColour,
						"stroke": strokeColour,
						"fill-opacity" : opacity
					});
				});
			}
		},

		canRenderShapes: function (){
			if(dkiUA.android){
				return dkiUA.androidVersion > 2.3;
			}
			else if(dkiUA.blackberry){
				return dkiUA.blackberryVersion > 6;
			}
			else if (dkiUA.webOS) {
				return false;
			}
			else{
				return true;
			}
		}
	};

	/**
	 * Represents the api to a course content page
	 * @class DKI.ContentPage
	 * @constructor
	 * @param {Object} cfg
	 * @param {HTMLElement | String} cfg.containerEl The DOM node containing the page,
	 * or the ID 
	 * @param {contentApi} cfg.contentApi
	 * @param {Object} cfg.actions
	 * @param {DKI.PresentationPlayer} cfg.player
	 */
	var component = function (cfg) {
		var self = this;	
		this.mediaPlayers = {};
		this.autoPlayMedia = [];
		this.actions = null;

		this.page = cfg.page;
		this.rootURL = cfg.player.rootURL;
		this.settings = cfg.player.settings;
		this.mediaCount = 0;
		this.readyMediaCount = 0;
		this.readyFired = false;
		this.objectTags = [];
		this.started = false;
		this.isMuted = !cfg.player.audio;
		if (typeof(cfg.containerEl) == "string") {
			this.pageContainer = document.getElementById(cfg.containerEl);
		}
		else {
			this.pageContainer = cfg.containerEl;
		}
		if (!contentAPI) {
			contentAPI = cfg.contentAPI;
		}
		mediaFunctions.handleMedia(this);
		shapeFunctions.init(this);
		this.actionAPI = actionFunctions.init(cfg.actions, this, this.settings.clickEvent);
		this.getClaroElementById = function(id){
			for(var i = 0; i < self.page.groups.length; i++){
				for(var j = 0; j < self.page.groups[i].elements.length; j++){
					if(self.page.groups[i].elements[j].id == id){
						return self.page.groups[i].elements[j];
					}
				}				
			}
		};
		
		$(".dki-authoring-element", this.pageContainer).each(function(){
			var el = $(this);
			var contentWrapper = el.find(".dki-authoring-content-wrapper");
			var content = $("#content_" + el.data("id"), this);
			var anchor = el.find(".dki-element-anchor");
			var tabIndex = anchor.data("tabindex");
			//store the src of the iframes
			$("iframe", this).each(function(){								
				if(!$(this).attr("data-src")){
					$(this).attr("data-src", this.src);
				}
				this.src = "about:blank";
			});
			//if its an html widget and it's adaptive, we need to set an interval which will recalculate the content width/height to update the aspect ratio
			if(el.data("type") == "html" && el.hasClass("adaptive-embed")){
				var recalcSize = function(){
					try{
						var contentDocument = content[0].contentDocument;
						var htmlEl = $(contentDocument.getElementsByTagName("html"));
						var bodyEl = $(contentDocument.getElementsByTagName("body"));

						var bodyPadding = bodyEl.height() / bodyEl.width() * 100;
						var htmlPadding = htmlEl.height() / htmlEl.width() * 100;
						var padding = bodyPadding > htmlPadding? bodyPadding : htmlPadding;

						contentWrapper.css("padding-bottom", padding + "%");				
					}catch(e){}
				};
				content.on("load", function(){
					if(this.src == "about:blank"){
						if(el.data("resizeInterval")){
							clearInterval(el.data("resizeInterval"));
							el.data("resizeInterval", null);
						}
					}
					else{
						el.data("resizeInterval", setInterval(recalcSize, 100));
					}
				});
			}	

			//set tabIndexes
			if(el.data('accessibility-tabable')){
				$("object.dki-element-content, iframe.dki-element-content, textarea.dki-element-content, map area, .dki-element-content iframe:first, .dki-element-content object:first, img.dki-element-content", this).each(function(){
					this.tabIndex = -1;
				});			
				if(el.hasClass("dki-table-element") || el.hasClass("dki-htm-element")){
					content.attr("tabindex", -1);
					$("table, a, .dki-glossary-link, .dki-citation-link sup.refSup", content).attr("tabindex", -1);				
				}
			}
			if(self.enablePlugins){
				var elementData = self.getClaroElementById(el.data("id"));	
				if(elementData.parameters.plugin.fn != ""){
					var cfg = {
						element: elementData,
						wrapper: el,
						content: content
					};

					if(elementData.parameters.plugin.extraContent){
						$.each(elementData.parameters.plugin.extraContent, function(key, value){
							eval(value.processFn);
							processFn(cfg);
						});
					}
					content[elementData.parameters.plugin.fn](elementData.parameters.plugin.config);
				}
			}			
		});
		
		//attach a handler for glossaries
		$(this.pageContainer).on(settings.clickEvent,".dki-glossary-link", DKI.glossary.showPopup);
		$(this.pageContainer).on("mouseenter",".dki-glossary-link", function(e) {DKI.glossary.showDefinition(e,this);});
		$(this.pageContainer).on("mouseleave",".dki-glossary-link",function(e) {DKI.glossary.hideDefinition(e,this);});

		$(this.pageContainer).on(settings.clickEvent,".dki-citation-link sup.refSup", function(e) {DKI.reference.showReference(e.target.parentNode)});
		$(this.pageContainer).on( "mouseenter",".dki-citation-link sup.refSup", function(e) {DKI.reference.hoverReference(e.target.parentNode,true);});
		$(this.pageContainer).on( "mouseleave", ".dki-citation-link sup.refSup",function(e) {DKI.reference.hoverReference(e.target.parentNode,false);});
		
		//Detach & store any object tags
		//We store the raw HTML for IE because the reattached embed wont work using a detached object. It's a mystery.
		$(".dki-videoembed-element object, .dki-chart-element object, .dki-flash-element object", this.pageContainer).each(function() {
			if (!dkiUA.ie) {
				var storeage = {
					parentNode: this.parentNode,
					objTag: $(this).detach()
				};
			}
			else {
				var storeage = {
					parentNode: this.parentNode,
					objTag: $(this.parentNode).html()
				}
				$(this).detach();
			}
			self.objectTags.push(storeage);
		});

		//rotate
		$(".dki-image-element[data-rotation!='0']", this.pageContainer).each(function(){
			$(this).find("img").velocity({rotateZ: $(this).data("rotation") + "deg"},0);
		});
		//suppress alt tags
		if(cfg.player.behaviour && cfg.player.behaviour.suppressAltTags){
			$(".dki-authoring-element *[alt!=''], .dki-authoring-element *[title!='']", this.pageContainer).each(function(){
				var el = $(this);
				if(!el.hasClass("dki-element-anchor")){
					el.removeAttr("alt").removeAttr("title");
				}
			});
		}

		// remove any content event handlers left over from the last page that may have used this page container
		for(var event in DKI.ContentPage.events){
			$(this.pageContainer).off(DKI.ContentPage.events[event]);
		}

		if(this.settings.scrolling){
			$(this.pageContainer).on(DKI.ContentPage.events.shown, function(){
				self.resize();
			});
			$(this.pageContainer).on(DKI.ContentPage.events.hidden, function(){
				self.resize();
			});
		}
		this.getGroupById = function(id){
			for(var i = 0; i < self.page.groups.length; i++){
				if(self.page.groups[i].id == id){
					return self.page.groups[i];
				}
			}
		};
		if(self.enablePlugins){
			$(".dki-authoring-group", this.pageContainer).each(function(){
				var el = $(this);
				var group = self.getGroupById(el.data("id"));			
				if(group.parameters.plugin.fn != ""){				
					el[group.parameters.plugin.fn](group.parameters.plugin.config);
				}
			});
		}
		//If not a mobile browser, fire page ready immediately
		if (!dkiUA.mobile) {
			this.fireReady();
		}
	};

	/**
	 * Turns all page audio on/off
	 * @param {Boolean} audio If true, unmute all audio. Else,
	 * mute all audio
	 */
	component.prototype.setAudio = function (audio) {
		contentFunctions.setAudio(audio, this);
	};
	/**
	 * Pause all playing media on the page
	 */
	component.prototype.pauseAll = function (){
		contentFunctions.pauseAll(this);
	};
	/**
	 * Unpause all playing media on the page
	 */
	component.prototype.resumeAll = function () {
		contentFunctions.resumeAll(this);
	};
	/**
	 * Resize the content. Fires {@link DKI.ContentPage.events#resize}
	 */
	component.prototype.resize = function(){
		//case 29410 - calculate the height of the content.
		var scrollHeight = this.settings.courseHeight;
		$(".dki-authoring-element", this.pageContainer).each(function(){
			if ($(this).css("display") != "none") {
				var el = $(this);
				var bottom = parseInt(el.css("top").split("px")[0], 10) + el.height();
				if (bottom > scrollHeight) {
					scrollHeight = bottom;
				}
			}
		});
		$(document).trigger(DKI.ContentPage.events.resize, scrollHeight);
	};
	/**
	 * Start the content page. Kicks off any page actions, autoplaying media,
	 * etc. Fires {@link DKI.ContentPage.events#started}
	 */
	component.prototype.start = function () {		
		var startFn = function() {
			var self = this;
			self.started = true;
			self.resize();
			//If we have auto play, we set a timeout to let the media start playing. If it doesn't, then we demand user input to get it going
			var touchPopupTimeout = 750;
			var autoplayTimeout = 0;
			if(dkiUA.iOS){
				//setting up timeouts because iOS wont autoplay anymore and this solves it for today.
				touchPopupTimeout = 2500;
				autoplayTimeout = 1000;
			}
			if(self.autoPlayMedia.length != 0 && !mediaFunctions.canAutoplay()) {
				var self = this;
				var disabler = new DKI.disabler({text : playerStrings.autoPlayDisabler, onClick : function(disabler) {
					disabler.hide();
					contentFunctions.startAutoPlay(self);
				}});
				var mediaTimer = setTimeout(function() {
					disabler.show();
				}, touchPopupTimeout);
				$.each(self.autoPlayMedia, function(index,item) {
					item.bind($.jPlayer.event.play, function(){
						clearTimeout(mediaTimer);
						disabler.hide();
					});
				});
			}
			setTimeout(function(){
				contentFunctions.startAutoPlay(self);
				self.setAudio(player.audio);
			}, autoplayTimeout);
			actionFunctions.startTimeouts(self);
			//set the src of the iframes
			$(".dki-authoring-element", self.pageContainer).each(function(){
				var el = $(this);
				var content = $("#content_" + el.data("id"), this);
				var anchor = el.find(".dki-element-anchor");
				var tabIndex = anchor.data("tabindex");
				$("iframe", this).each(function(){
					if(!$(this).attr("data-src")){
						$(this).attr("data-src", this.src);
					}
					if (!el.is(':visible')) {
						this.src = "about:blank";
					}
					else{
						this.src = $(this).attr("data-src");
					}
				});
				
				if(el.data('accessibility-tabable')){
					$("object.dki-element-content, iframe.dki-element-content, textarea.dki-element-content, map area, .dki-element-content iframe:first, .dki-element-content object:first, img.dki-element-content", this).each(function(){
						this.tabIndex = tabIndex;
					});			
				}
				
				if(el.hasClass("dki-table-element") || el.hasClass("dki-htm-element")){
					if(el.hasClass("dki-htm-element")){
						content.attr("tabindex", tabIndex);
					}			
					$("table, a, .dki-glossary-link, .dki-citation-link sup.refSup", content).attr("tabindex", tabIndex);
					if(el.hasClass("dki-htm-element")){
						anchor.attr("tabindex", "-1");
					}
				}
				if(el.data("type") == "zoomRegion" && el.is(":visible")){
					contentApi.zoomToElement(el.data("id"), self, 0);
				}
				

				if(el.data("type") == "marker"){
					var elementData = self.getClaroElementById(el.data("id"));
					var animation = "fade";
					var position = "top";
					var trigger = "hover";
					var theme = "dark";
					if(elementData.parameters.config){
						if(elementData.parameters.config.position){
							position = elementData.parameters.config.position;
						}
						if(elementData.parameters.config.animation){
							animation = elementData.parameters.config.animation;
						}
						if(elementData.parameters.config.trigger){
							trigger = elementData.parameters.config.trigger;
						}
						if(elementData.parameters.config.theme){
							theme = elementData.parameters.config.theme;
						}
					} 
					if(elementData.meta != ""){
						content.tooltipster({
							content: elementData.meta,
							contentAsHTML: true,
							functionBefore: function(origin, continueTooltip){
								origin.tooltipster("option", "offsetX", 0-parseInt($("body").css("margin-left").split("px")[0]))
								continueTooltip();
							},
							maxWidth: 400,
							position: position,
							animation: animation,
							trigger: trigger,
							theme: theme,
							positionTracker: true,
							restoration: "none"
						});
						if(trigger == "custom" && el.is(":visible")){
							content.tooltipster("show");
						}		
					}
				}

			});
			//Loop through detached object tags & re-attach.
			//We have to handle IE by using the raw HTML markup because it breaks the embed if we reattach the object representation
			for (var i = 0; i < self.objectTags.length; i += 1) {
				if (!dkiUA.ie) {
					self.objectTags[i].objTag.appendTo(self.objectTags[i].parentNode);
				}
				else {
					$(self.objectTags[i].parentNode).html(self.objectTags[i].objTag);
				}
			}
			//reattach gifs
			$(".dki-image-element[data-extension='gif'] img", this.pageContainer).each(function(){
				this.src = $(this).attr("data-src") + "?rand=" + Math.floor(Math.random()*500);
			});
			// case 45647 - IE8 won't show the shapes once they have been rendered with visibility:hidden; so re-render any shapes on the page
			if(dkiUA.ie && dkiUA.ieVersion <= 8){
				shapeFunctions.init(self);
			}
			actionFunctions.checkBreakPointThreshold("breakpoint", self);
			actionFunctions.checkDeviceAdaptation("device", self);	
			
			$(document).trigger(DKI.ContentPage.events.started, self);			
		}
		var self = this;
		var duration = 0;
		if($("html").hasClass("csstransitions")){
			duration = $(".dkiContentFrame.current").css("transition-duration").toLowerCase();
			//fix ms vs seconds...		
			duration = (duration.indexOf("ms")>-1) ? parseFloat(duration) : parseFloat(duration)*1000;
		}
		setTimeout(function(){
			startFn.call(self);	
		}, duration);
	}
	/**
	 * Resets the content page. Resets all auto playing media/actions, and
	 * holds until {@link DKI.ContentPage#start} is called again. 
	 * Fires {@link DKI.ContentPage.events#ready}
	 * @method reset
	 * @member DKI.ContentPage
	 */
	component.prototype.reset = function (cfg) {	
		cfg = DKI.applyIf(cfg, {
			timeout: 0
		});
		var self = this;
		$(".dki-marker-element", self.pageContainer).each(function () {
			var el = $(this);
			if(el.data("type") == "marker"){
				if(el.data("meta") != ""){
					el.find(".dki-element-content").tooltipster("option", "animation", false).tooltipster("destroy");
				}
			}
		});
		var resetFn = function(){
			self.started = false;
			contentFunctions.stopAll(self);
			var elementWrappers = $(".dki-authoring-element", self.pageContainer);
			$(self.pageContainer).trigger(DKI.ContentPage.events.reset);
			actionFunctions.reset(self);
			//reset group's css display attribute to show group, for the hidden-on-load group, it use .hidden-on-load to hidden it.
			$(".dki-authoring-group", self.pageContainer).each(function(){
				$(this).css('display', '');
			});
			elementWrappers.each(function () {
				var el = $(this);
				el.stop(true, true);
				if (el.data("renderhidden")) {
					el.css("display", "none");
				}
				else {
					el.css("display", "");
				}
				if (!self.settings.responsive) {
					el.css("left", el.data("x") + "px");
					el.css("top", el.data("y") + "px");
				}
				$("iframe", this).each(function(){
					if(!$(this).attr("data-src")){
						$(this).attr("data-src", this.src);
					}					
					this.src = "about:blank";										
				});
				$("object.dki-element-content, iframe.dki-element-content, textarea.dki-element-content, map area, .dki-element-content iframe:first, .dki-element-content object:first, img.dki-element-content", this).each(function(){
					this.tabIndex = -1;
				});				
				if($(this).data("type") == "html" && $(this).data("cssclass") == "adaptive" && $(this).data("resizeInterval")){
					clearInterval($(this).data("resizeInterval"));
					$(this).data("resizeInterval", null);
				}
			});
			actionFunctions.checkBreakPointThreshold("breakpoint", self);
			actionFunctions.checkDeviceAdaptation("device", self);
			//using this to reset any iframes (html widgets/video embeds) that might still be playing after going to the next page.
			
			//Remove any <object> tags to be re-added when the page is loaded
			$(".dki-videoembed-element object, .dki-chart-element object, .dki-flash-element object", self.pageContainer).each(function () {
				var object = $(this).detach();
			});	
			contentApi.zoomOut(self, 0);	
			//Fire ready event
			self.readyFired = false;
			self.fireReady();
		};
		if(cfg.timeout > 0){
			setTimeout(resetFn, cfg.timeout);		
		}
		else{
			resetFn();
		}
	};
	/**
	 * The paused status of media players
	 * @type Boolean
	 */
	component.prototype.isPaused = contentFunctions.isPaused;
	/**
	 * Fires the ready event, setting the readyFired property
	 * @protected
	 */
	component.prototype.fireReady = function () {
		if (!this.readyFired) {
			this.readyFired = true;		
			if(settings.responsive){	
				mediaFunctions.respondVideos(this);
				$(".dki-authoring-element", this.pageContainer).each(function(){
					var pos = $(this).position();
					$(this).data("x", pos.left).data("y", pos.top);
				});
			}
			$(document).trigger(DKI.ContentPage.events.ready, this.page);
		}
	};
	component.prototype.onWindowResize = function () {		
		actionFunctions.checkBreakPointThreshold("breakpoint", this);
		if(settings.responsive){
			mediaFunctions.respondVideos(this);
			$(".dki-authoring-element", this.pageContainer).each(function(){
				var pos = $(this).position();
				$(this).data("x", pos.left).data("y", pos.top);
				if($(this).data("type") == "marker" && $(this).data("meta") != ""){					
					$(this).find(".dki-element-content").tooltipster("option", "offsetX", 0-parseInt($("body").css("margin-left").split("px")[0]))
				}
			});
		}		
	};
	return component;
})();

/**
 * Collection of events
 * @class
 * @static
 * @member DKI.ContentPage
 */
DKI.ContentPage.events = {
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	resize: "PAGE_RESIZE",
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	shown: "ELEMENT_SHOWN",
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	hidden: "ELEMENT_HIDDEN",
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	reset: "PAGE_RESET",
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	ready: "PAGE_READY",
	/**
	 * @event
	 * @static
	 * @member DKI.ContentPage.events
	 */
	started: "PAGE_STARTED",
	elementDragStarted: "ELEMENT_DRAG_STARTED",
	elementDragStopped: "ELEMENT_DRAG_STOPPED",
	elementDragReverted: "ELEMENT_DRAG_REVERTED",
	elementDragDropped: "ELEMENT_DRAG_DROPPED",
	elementDropOut: "ELEMENT_DROP_OUT",
	elementDropOver: "ELEMENT_DROP_OVER",
	elementDropDropped: "ELEMENT_DROP_DROPPED"
};

//below included for imageMaps
/**
 * Included for old image maps, which require this global function. Used
 * to show hidden elements
 * @member global
 * @param {Number[]} Array of element ids
 * @param {string} showEffect The effect to apply
 */
function showElement(ids, showEffect){
	if(!showEffect) showEffect = "show";
	var idArray = ids.split(",");
	for (var i = 0; i < idArray.length; i++) {
		var id = idArray[i];
		var o = $("#" + id + "_wrapper");
		var callback = function () {
			var contentID = "content_" + $(this).data("id");
			var content = $("#" + contentID);
			//Callback will be fired once for each element shown/hidden.  As it's a jQuery callback,
			//'this' will be the element being shown/hidden
			$(this).trigger(DKI.ContentPage.events.shown, this);
			if (content.data("autoplay")) {
				var bindFunction;
				content.jPlayer("play");
				bindFunction = function (e) {
					content.jPlayer("play");
					content.unbind(e);
				};
				$(content).bind($.jPlayer.event.ready, bindFunction);
			}
			$(document).trigger("imageMapFired",{message : o.data("title") + " was shown."});
		};
		if (showEffect != "show") {
			o.show(showEffect, {}, 800, callback);

		}
		else {
			o.show(0, callback);

		}
	}
}

/**
 * Included for old image maps, which require this global function. Used
 * to hide elements
 * @member global
 * @param {Number[]} Array of element ids
 * @param {string} hideEffect The effect to apply
 */
function hideElement(ids, hideEffect){
	if(!hideEffect) hideEffect = "hide";
	var idArray = ids.split(",");
	for (var i = 0; i < idArray.length; i++) {
		var id = idArray[i];
		var o = $("#" + id + "_wrapper");
		var callback = function () {
			var contentID = "content_" + $(this).data("id");
			var content = $("#" + contentID);
			//Callback will be fired once for each element shown/hidden.  As it's a jQuery callback,
			//'this' will be the element being shown/hidden
			$(this).trigger(DKI.ContentPage.events.hidden, this);
			if (o.data("type") == "audio" || o.data("type") == "video") {
				content.jPlayer("pause");
			}
			$(document).trigger("imageMapFired",{message : o.data("title") + " was hidden."});
		};
		if (hideEffect != "hide") {
			o.hide(hideEffect, {}, 800, callback);
		}
		else{
			o.hide(0, callback);
		}
	}
}

/**
 * Included for old image maps, which require a global function. Toggles the
 * visibility of elements
 * @member global
 * @param {Number[]} The element IDs to toggle
 * @param {string} showEffect The effect to apply when showing elements
 * @param {string} hideEffect The effect to apply when hiding elements
 */
function showHideElement(ids, showEffect, hideEffect){
	 if(ids == null || ids == undefined || ids == '')
	   return;
	var idArray = ids.split(",");
	for (var i = 0; i < idArray.length; i++) {
		var id = idArray[i];
		if (document.getElementById(id + "_wrapper").style.display == "none") {
			showElement(id, showEffect);
		}
		else{
			hideElement(id, hideEffect);
		}
	}
}
/**
 * Included for old image maps. Applies classes/data to elements based on href
 * settings
 * @member global
 * @param {string} hrefTarget list of target Ids
 * @param {boolean} hideTargetOnLoad No longer used
 */
function processHrefTarget(hrefTarget, hideTargetOnLoad){
	//trying/catching because of some weird bug collision with swfobject.. dont have time to deal with it now.
	//the problem is in splitting a string that doesnt have commas.. it should return a 1 length array but instead it tthreows an error in swf object.
	try {
		var hrefTarget = hrefTarget.toString();
		var targetIdArray = hrefTarget.split(",");
		for (var i = 0; i < targetIdArray.length; i++) {
			var targetId = targetIdArray[i];
			$("#" + targetId + "_wrapper").addClass("dki-event-target");
			$("#" + targetId + "_wrapper").addClass("dki-imagemap-target");
			$("#" + targetId + "_wrapper").data("eventtargets", hrefTarget);
		}
	}
	catch(e){
		var targetId = hrefTarget;
		$("#" + targetId + "_wrapper").addClass("dki-event-target");
		$("#" + targetId + "_wrapper").addClass("dki-imagemap-target");
		$("#" + targetId + "_wrapper").data("eventtargets", hrefTarget);
	}
}

/**
 * Included for old image maps. Hides every target of an image map.
 * @member global
 */
function hideAllEventElements(){
	$(".dki-imagemap-target").hide();
	$(document).trigger("imageMapFired",{action: "hideAll"});
}

/**
 * Included for old image maps. Opens a url, based on data attached to given
 * element
 * @member global
 * @param {HTMLElement} el The element with the URL data
 */
function processHttpEvent(el){
	var url = $(el).data("href");
	var hrefWindow = window.open(url, 'hrefWindow', '');
	$(document).trigger("imageMapFired",{message : "'" + url + "' was opened in a new window"});
}
