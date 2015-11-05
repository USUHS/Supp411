/* global dkiUA, player */
DKI.resourceBrowser = function() {
	var mobile = $("body").hasClass("phone") || $("body").hasClass("responsive") ? true : false;
	var launchMethod = "window";
	var browser = {},
		resources = {},
		links = [],
		documentVersion = null,
		selectedResource = {},
		videoPlayer = {},
		searchDictionary = [],
		audioPlayer = {},
		activePlayer = {},
		strings = {},
		typeLabels = {},
		settings,
		playerSolution = dkiUA.iOS ||
			(dkiUA.android) ? "html,flash" : "flash,html";


	var initialize = function(config) {
			var i;
			strings = config.languageString;
			typeLabels = {
				"document" : strings.documentType,
				"html" : strings.htmlType,
				"audio" : strings.audioType,
				"video" : strings.videoType,
				"image" : strings.imageType,
				"flash" : strings.flashType
			};
			resources = config.resources;
			for (i = 0; i < resources.length; i++) {
				searchDictionary.push({
					id: resources[i].id,
					title: resources[i].title,
					type: "resource"
				});
			}
			for(i = 0; i < config.actions.length; i++){
				if(config.actions[i].type == "http"){
					var results =$.grep(links, function(e) {
						return e.parameters.url == config.actions[i].parameters.url;
					});
					if(results.length == 0) {
						links.push(config.actions[i]);
						searchDictionary.push({
							id: config.actions[i].id,
							title: config.actions[i].parameters.title,
							type: "link"
						});
					}
				}
			}
			
			settings = config.settings;
			documentVersion = config.documentVersion;
			var cfg = {
				strings : DKI.strings,
				mobile  : mobile
			};
			var markup = Handlebars.compile(DKI.templates.resourceBrowser)(cfg);
			$("body").append(markup);
			browser.container = $("#resourceWindowContainer");
			browser.contentContainer = $("#resourceContentContainer");
			browser.close = $("#resourceBrowserClose");
			browser.back = $("#resourceBack");
			browser.detailsContainer = $("#resourceView");
			if(mobile) {
				browser.container.addClass("phone");
			}
			browser.resourceList = {
				container    : $("#resourceList"),
				list: $("#resourceList #list"),
				termElements : []
			},
			browser.resourceDetails = {
				resourceTitle :  $("#resources")
			};
			populateResourcesList();
			browser.container.hide();
			browser.container.css("visibility", "visibile");
			if(mobile) {
				browser.back.on(settings.clickEvent,function(){
					browser.back.fadeOut(200);
					shiftContainer(0);
					if (activePlayer && activePlayer.jPlayer){
						activePlayer.jPlayer("stop");
					}
				});
			}
			browser.close.on(settings.clickEvent, function() {
				hide();
			});
			browser.container.draggable({handle : $("#resourceBrowserHeader"), containment : "body"});
			$("#resourceSearchBox").jsonSearch({
				"data": searchDictionary,
				"searchKey": "title",
				onSelect: function(item) {
					if (item.type == "resource") {
						resourceClicked(item.id);
					}
					else if (item.type == "link"){
						linkClicked(item.id);
					}
				}
			});
		},

		organizeResources = function(resources) {
			var oResources = {};
			for(var i = 0; i < resources.length; i ++) {
				var type = resources[i].type;
				if(type in oResources) {
					oResources[type].push(resources[i]);
				}
				else {
					oResources[type] = [resources[i]];
				}
			}
			return oResources;
		},

		populateResourcesList = function() {
			var oResources = organizeResources(resources);
			var keys = DKI.getObjectKeys(oResources);
			var resourceList = $("#resourceList #list");
			var listItem;
			var subList;
			var sublistItem;
			var selectedLink;
			var isMobile = dkiUA.iOS || dkiUA.android || dkiUA.blackberry;
			if (documentVersion) {
				listItem = $("<li />", {
					text: strings.txtPrintableVersionHeader			
				});
				var subList = $("<ul />",{
				"class" : "sublist"
				});				
				sublistItem = $("<li />", {
					id      : "documentVersion",
					"class" : "subItem ",
					title   : strings.txtPrintableVersionTitle,
					html    : "<span class='icon document'></span>" + documentVersion.name
				});
				sublistItem.on(settings.clickEvent, documentVersionClicked);
				subList.append(sublistItem);
				listItem.append(subList);
				resourceList.append(listItem);
			}
			keys.sort();
			$.each(keys, function(index, key){
				var itemGrp = oResources[key];
				var listItem = $("<li />").append($("<span />", {
					"class": "Resource_type_label",
					text:  typeLabels[key]
				}));
				var subList = $("<ul />",{
					"class" : "subList"
				});
				itemGrp.sort(compareResources);
				$.each(itemGrp, function(index,resource){
					var additionalHtml  = ">";
					if(resource.elementLink) {
						additionalHtml = "title='" + strings.txtElementLinkTitle + "'><span class='linkIcon'></span>";
					}
					var html = "<span class='icon " + resource.type +"'" + additionalHtml + "</span>" + resource.title;
					var css = "";
					if(isMobile) {
						html += "<span class='chevron'></span>";
						css += "mobile";
					}
					var sublistItem = $("<li />",{
						"id"    : resource.id,
						"class"	: "subItem " + css,
						"title"	: resource.title,
						"html"  : html,
						"tabIndex": 0
					});
					var clickEv = function(){
						selectedResource = resource;
						selectedLink = null;
						resourceClicked(resource.id);
					};
					if(isMobile) {
						sublistItem.find("span").on(settings.clickEvent, clickEv);
					}
					else {
						sublistItem.on(settings.clickEvent, clickEv);
					}
					subList.append(sublistItem);
					$(document).trigger(events.resourceRegistered, [resource]);
				});
				listItem.append(subList);
				resourceList.append(listItem);
			});
			if (links.length > 0) {
				//append links			
				listItem = $("<li />").append($("<span />", {
					"class": "Resource_type_label",
					text:  strings.txtLinksHeader
				}));
				subList = $("<ul />",{
					"class" : "subList"
				});
				
				$.each(links, function(index, link){
					var label = link.parameters.title === "" ? link.parameters.url : link.parameters.title;
					var html = "<span class='icon link'></span>" + label;
					var css = "";
					if(isMobile) {
						html += "<span class='chevron'></span>";
						css += "mobile";
					}
					sublistItem = $("<li />", {
						"id": link.id,
						"class": "subItem link " + css,
						"title": link.parameters.url,
						"html": html,
						"tabIndex": 0
					});
					var clickEv = function(){
						selectedResource = null;
						selectedLink = link;
						linkClicked(link.id);
					};
					if(isMobile) {
						sublistItem.find("span").on(settings.clickEvent, clickEv);
					}
					else {
						sublistItem.on(settings.clickEvent, clickEv);
					}
					subList.append(sublistItem);
				});
				listItem.append(subList);
				resourceList.append(listItem);
			}			
		},

		compareResources = function(a,b) {
			if(a.title < b.title) {
				return -1;
			}
			if(a.title > b.title) {
				return 1;
			}
			return 0;
		},

		setViewSize = function(assetWidth, assetHeight) {
			var remainingHeight = $("#resourceView").innerHeight() - $("#resourceDetails .assetProperties").outerHeight() -30,
				remainingWidth = $("#resourceView").innerWidth() - 45,
				heightDiff = remainingHeight - assetHeight,
				widthDiff = remainingWidth -  assetWidth,
				ratio = assetWidth / assetHeight,
				setWidth = 0,
				setHeight = 0;
			if(heightDiff < 0 && heightDiff < widthDiff) {
				setHeight = remainingHeight;
				setWidth = ratio * remainingHeight;
			}
			else if(widthDiff <0 && widthDiff < heightDiff) {
				setHeight = (remainingWidth /ratio);
				setWidth  = remainingWidth;
			}
			else {
				setHeight = parseInt(assetHeight, 10);
				setWidth = assetWidth;
			}
			var top = 0;
			if(setHeight < 200) {
				top = (200 - setHeight) /2;
			}
			return{"width" : setWidth, "height" : setHeight , "top" : top };
		},

		renderVideoPlayer =  function(video,dimensions) {
			$("#resourceVideo_player").jPlayer({
				swfPath: settings.swfPath,
				cssSelectorAncestor: "#resourceVideo_container",
				ready: function() {
					videoPlayer = $(this);
					videoPlayer.jPlayer("setMedia", video.media);
					
					$(this).bind($.jPlayer.event.pause, function () {
						$(".jp-video-play", this.parentNode).css("display", "");
						$("#resourceVideo_container .jp-interface").hide();
					});
					$(this).bind($.jPlayer.event.play, function () {
						$(".jp-video-play", this.parentNode).css("display", "none");
						$("#resourceVideo_container .jp-interface").show();
					});
					$(this).bind($.jPlayer.event.click, function (e) {
						if (e.jPlayer.status.paused) {
							$(this).jPlayer("play");
						}
						else {
							$(this).jPlayer("pause");
						}
					});
					//register KB shortcuts for media.
					$("#resourceContent").off("keypress").on("keypress", function(e){
						var jp = videoPlayer.data().jPlayer;	
						var status = jp.status;
						var options = jp.options;	
						if(e.which == 32 || e.which == 13){
							if (status.paused) {
								videoPlayer.jPlayer("play");
							}
							else {
								videoPlayer.jPlayer("pause");
							}
						}
						else if(e.which == 102){
							//"f"
							$(".jp-full-screen", this).click();
						}
						else if(e.which == 27){
							//escape
							$(".jp-restore-screen", this).click();					
						}
						else if(e.which == 116 && video.transcript != ""){
							//"t"
							contentApi.showPopup({
								html: video.transcript,
								modal: false,
								autoFocus: true,
								returnFocus: this
							})
						}
						else if(e.which == 109){
							//"m"
							if (options.muted) {
								videoPlayer.jPlayer("unmute");
							}
							else {
								videoPlayer.jPlayer("mute");
							}
						}
						else if(e.which == 61 || e.which == 43){
							//"up"
							videoPlayer.jPlayer("volume", (options.volume + 0.1));
						}
						else if(e.which == 45 || e.which == 95){
							//"down"
							videoPlayer.jPlayer("volume", (options.volume - 0.1));
						}
					});
				},
				solution: playerSolution,
				volume: 1,
				supplied : video.supplied,
				autohide : true,
				size : {
					width : dimensions.width + "px",
					height : dimensions.height + "px"
				},
				sizeFull: {
							height: "600px"
				},
				nativeVideoControls: settings.nativeVideoControls
			});
		},

		renderAudioPlayer = function(audio) {
			$("#resourceAudio_player").jPlayer({
				swfPath: settings.swfPath,
				cssSelectorAncestor: "#resourceAudio",
				ready: function() {
					audioPlayer = $(this);
					audioPlayer.jPlayer("setMedia", audio.media);
					activePlayer = audioPlayer;
				},
				supplied: audio.supplied,
				solution: playerSolution
			});
		},

		showVideoPlayer = function(resource, file, container, dimensions) {
			var videoMarkup = Handlebars.compile("{{> jPlayerVideo}}")({
				videoAncestorId : "resourceVideo_container",
				videoPlayerId : "resourceVideo_player"
			});
			$("#resourceContent").append(container.html(videoMarkup));
			var media ={},
				extension = resource.extension === "mp4" || resource.extension === "mov" ? "m4v" : resource.extension;
			media[extension] =  file;
			renderVideoPlayer({media : media, supplied : extension}, dimensions);
		},
		
		showAudioPlayer = function(resource, file, container) {
			var audioMarkup = Handlebars.compile("{{> jPlayerAudio}}")({
				audioAncestorId : "resourceAudio",
				audioPlayerId   : "resourceAudio_player"
			});
			$("#resourceContent").append(container.html(audioMarkup));
			var media ={},
				extension = resource.extension === "mp4" ? "m4a" : resource.extension;
			media[extension] = file;
			renderAudioPlayer({media : media, supplied : extension});
		},

		getAssetSize = function(bytes) {
			var capacity = ["B","kB", "MB"],
				count = 0;
			bytes = parseInt(bytes,10);

			while(bytes >= 1024) {
				bytes = bytes /1024;
				count ++;
			}
			return bytes.toFixed(1) +" " + capacity[count];
		},

		loadAssetData = function(resource, fileLocation) {
			var titleHtml = resource.title;
			if(resource.type !== "html") {
				if(playerBehaviour.allowResourceDownload){
					var downloadAs = resource.title;
					var fileNameParts = fileLocation.split(".");
					downloadAs += "." + fileNameParts[fileNameParts.length - 1];
					titleHtml = "<a download='" + downloadAs + "' target='_blank' href='" + fileLocation + "' title='" + strings.txtSaveAs + "'>" +
					resource.title + " <span class='downloadIcon'></span>(" + getAssetSize(resource.size) + ")</a>";
				}
				else{
					titleHtml = "<span>" + resource.title + "</span>";
				}
			}			
			var titleEl = $(titleHtml);			
			$("#resourceTitle").html("").append(titleEl);
			$("#resourceSize").html(getAssetSize(resource.size));
			$("#resourceDescription").html(resource.description);
			if(browser.detailsContainer.is(":hidden")) {
				browser.detailsContainer.show();
			}
		},
		
		loadLinkData = function(link) {
			var titleEl = null;
			var title = link.parameters.title;
			var description = link.parameters.description;
			var altText = strings.txtNewWindowTitle;
			var clsName = "resourceLinkLabel link";
			if (title === "") {
				title = link.parameters.url;
			}
			if(!link.parameters.isWebsite){
				title += "<span class='downloadIcon'></span>";
				altText = strings.txtSaveAs;
				clsName += " download";
				titleEl = $("<a download target='_blank' href='" + link.parameters.url + "' class='" + clsName + "' title='" + altText + "'>" + title + "</a>");
			}
			else{
				clsName += " website";
				titleEl = $("<a href='#' class='" + clsName + "' title='" + altText + "'>" + title + "</a>");
				titleEl.on(settings.clickEvent, function(){												
					if (link.parameters.target && link.parameters.target === "modal") {
						contentApi.openModal(link.parameters.url);
					}
					else {
						var linkWindow = window.open(link.parameters.url, '_blank');
						linkWindow.focus();
					}
				})
			}
			if(!playerBehaviour.allowResourceDownload){
				titleEl = $("<span>" + title + "</span>")
			}
			
			$("#resourceTitle").html("").append(titleEl);
			$("#resourceSize").html("");
			$("#resourceDescription").html(description);
			if(browser.detailsContainer.is(":hidden")) {
				browser.detailsContainer.show();
			}
		},

		loadDocumentVersion = function () {
			var content = $("#resourceContent");
			var fileLocation = player.rootURL + "assets/" + documentVersion.name;
			var dimensions = setViewSize(100, 100);
			var containerDiv = $(document.createElement("div"));
			containerDiv.css({
				margin  : "0px auto",
				width   : dimensions.width,
				height  : dimensions.height,
				padding : dimensions.top + "px 0px"
			});
			containerDiv.html("<div class='docImg doc'></div>");
			content.html("");
			content.append(containerDiv);
			loadAssetData({title: documentVersion.name, description: "", size: documentVersion.size}, fileLocation);
		},

		loadResource = function(resource) {
			var content = $("#resourceContent"),
				fileLocation = resource.filePath ? player.rootURL + resource.filePath : resource.assetURL;
			loadAssetData(resource, fileLocation);
			var dimensions ={};
			var containerDiv = $("<div/>");
			var scrolling;
			content.html("");
			switch(resource.type) {
				case "audio" :
					dimensions = setViewSize(225, 50);
					showAudioPlayer(resource, fileLocation, containerDiv);
					break;
				case "video" :
					dimensions = setViewSize(resource.w, resource.h);
					showVideoPlayer(resource, fileLocation, containerDiv, dimensions);
					break;
				case "image" :
					dimensions = setViewSize(resource.w, resource.h);
					content.append(containerDiv.html("<img src='" + fileLocation + "' width='100%' height = '100%'/>"));
					break;
				case "flash" :
					dimensions = setViewSize(resource.w, resource.h);
					var html = "<object classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\"100%\" height=\"100%\" id=\"flash_previewer\">" +
							"<param name=\"movie\" value=\"" + fileLocation + "\"/>" +
							"<param name=\"allowfullscreen\" value=\"false\" />" +
							"<param name=\"allowScriptAccess\" value=\"sameDomain\" />" +
							"<param name=\"wmode\" value=\"transparent\" />" +
							"<!--[if !IE]>-->" +
							"<object type=\"application/x-shockwave-flash\" data=\""+ fileLocation + "\" width=\"100%\" height=\"100%\">" +
								"<param name=\"allowfullscreen\" value=\"false\" />" +
								"<param name=\"allowScriptAccess\" value=\"sameDomain\" />" +
								"<param name=\"wmode\" value=\"transparent\" />" +
							"<!--<![endif]-->" +
							"<a target=\"flashplayer\" href=\"http://www.adobe.com/go/getflashplayer\">" +
							"<img src=\"http://www.adobe.com/images/shared/download_buttons/get_flash_player.gif\" alt=\"Get Adobe Flash player\" />" +
							"</a>" +
							"<!--[if !IE]>-->" +
							"</object>" +
							"<!--<![endif]-->" +
						"</object>" +
					"</div>";
					content.append(containerDiv.html(html));
				break;
				case "html" :
					dimensions = setViewSize(resource.w, resource.h);
					fileLocation = resource.filePath ? fileLocation + "/" + resource.parameters.LAUNCHFILE : resource.assetURL.substring(0,resource.assetURL.length -1) + "/" + resource.parameters.LAUNCHFILE,
						scrolling = resource.parameters.scrolling;
						switch(scrolling){
							case "off" :
								scrolling = "no";
								break;
							case "on" :
								scrolling = "yes";
								break;
							default:
								scrolling = "auto";
								break;
						}

					content.append(containerDiv.html("<iframe src='" + fileLocation + "' frameborder='" + resource.parameters.border + "' scrolling='" + scrolling +"'/>"));
					break;
				default :
					dimensions = setViewSize(100, 100);
					content.append(containerDiv.html("<div class='docImg " + resource.extension +"'></div>"));
				break;
			}
			containerDiv.css({
				margin : "0px auto",
				width  : dimensions.width,
				height : dimensions.height,
				padding : dimensions.top +"px 0px"
			});
		},
		
		loadLink = function(link) {
			var content = $("#resourceContent");
			content.html("");
			var containerDiv = $("<div/>");
			loadLinkData(link);
			if (link.parameters.isWebsite) {
				containerDiv.html("<iframe style='margin:0;padding:0;width: 100%; height: 290px;' src='" + link.parameters.url + "' frameborder='0' scrolling='auto'/>");
				containerDiv.css({
					margin : "0px auto",
					width  : "100%",
					height : "290px"
				});
				content.append(containerDiv);
			}
		},

		documentVersionClicked = function () {
			loadDocumentVersion();
			$("#resourceList li").removeClass("selected");
			$("#documentVersion").addClass("selected");
			if (mobile) {
				shiftContainer(-283);
				browser.back.fadeIn(200);
			}
		},

		resourceClicked = function(id) {
			loadResource(getResourceById(id));
			$("#resourceList li").removeClass("selected");
			$("#" + id).addClass("selected");
			if(mobile){
				shiftContainer(-283);
				browser.back.fadeIn(200);
			}
		},
		
		linkClicked = function(id) {
			var link = getLinkById(id);
			if(link.parameters.description != ""){
				loadLink(link);
				$("#resourceList li").removeClass("selected");
				$("#" + id).addClass("selected");
				if(mobile){
					shiftContainer(-283);
					browser.back.fadeIn(200);
				}
			}
			else{
				if (link.parameters.target && link.parameters.target === "modal") {
					contentApi.openModal(link.parameters.url);
				}
				else {
					var linkWindow = window.open(link.parameters.url, '_blank');
					linkWindow.focus();
				}
			}
		},

		getResourceById = function(id) {
			for(var i = 0; i < resources.length; i++){
				if(resources[i].id == id){
					return resources[i];
				}
			}
		},
		
		getLinkById = function(id) {
			for(var i = 0; i < links.length; i++){
				if(links[i].id == id){
					return links[i];
				}
			}
		},

		shiftContainer = function(left){
			if(left == 0){
				browser.resourceList.list.show();				
			}
			else{
				browser.detailsContainer.show();
			}
			browser.contentContainer.animate({
					left : left
				}, 300, function(){
				if(left == 0){					
					var selected = $(".selected[tabindex]:first", browser.resourceList.list);
					if(selected.length > 0){
						selected[0].focus();
					}
					else{
						$("*[tabindex]:first", browser.resourceList.list)[0].focus();	
					}
					browser.detailsContainer.hide();
				}
				else{
					browser.resourceList.list.hide();
					$("*[tabindex]:first", browser.detailsContainer)[0].focus();
				}
			});
		},

		show = function() {
			browser.container.show();			
			if(typeof player != "undefined") {
				player.navigation.setResourceState(true);
			}
			if($("*[tabindex]:first", browser.resourceList.list)[0]){
				$("*[tabindex]:first", browser.resourceList.list)[0].focus();
			}
		},

		hide = function() {
			browser.container.hide();
			if(typeof player != "undefined") {
				player.navigation.setResourceState(false);
			}
		},

		toggle = function() {
			if(browser.container.css("display") == "none"){
				this.show();
			}
			else{
				this.hide();
			}
		},
		isEmpty = function() {
			var i=0;
			var prop;
			if (documentVersion) {
				i = 1;
			}
			for(prop in resources){
				if(resources.hasOwnProperty(prop)){i++;}
			}
			for(prop in links){
				if(links.hasOwnProperty(prop)){i++;}
			}
			return i===0;
		},
		setLaunchMethod = function(method){
			launchMethod = method;
		},
		events = {
			resourceRegistered : "resourceRegistered"
		}

	return {
		init            : initialize,
		show            : show,
		hide            : hide,
		toggle          : toggle,
		isEmpty      	: isEmpty,
		setLaunchMethod : setLaunchMethod,
		events          : events
	};
}();
