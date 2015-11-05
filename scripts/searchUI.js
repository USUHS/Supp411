
DKI.search.Window = function() {
	var render = true; 
	var transformTime = $("html").hasClass("csstransforms") ? 500 : 0;
	var mobile = $("body").hasClass("phone") || $("body").hasClass("responsive") ? true : false;
	var itemMarkup = "<div class='itemContainer' tabindex='0'>" +
		"<span class='iconContainer'><span class='icon'></span> </span>" +
		"<span class='chevronContainer'><span class='icon chevron'></span></span>" + 
		"<div class='metaContainer'>" + 
			"<h3></h3>" + 
			"<p></p>" + 
		"</div>" + 
	"</div>";
	var propertiesMarkup = "<div tabindex='0' class='preview'></div>" + 
	"<div class='propertiesMeta'></div>";

	var browser = {},	
		strings = {},
		settings,
		activePlayer = {},
		sequentialFilter = false,
		defaultSearchResults = {
			categories : {
				top        : [],
				image      : [],
				video      : [],
				audio      : [],
				reference  : [],
				glossary   : [],
				transcript : [],
				text       : [],
				richMedia  : []
			}
		},
		searchResults = {},
		playerSolution = dkiUA.iOS || (dkiUA.android) ? "html,flash" : "flash,html",
		searchDebounce = {};
	var getFlashMarkup = function(fileLocation){
		return "<object classid=\"clsid:D27CDB6E-AE6D-11cf-96B8-444553540000\" width=\"100%\" height=\"100%\" id=\"search_flash\">" +
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
	};
	var getWidgetMarkup = function(fileLocation){
		var container = $("<div class='widgetPlaceholder'></div>").on(settings.clickEvent, function(e){
			DKI.Modal.show({url:fileLocation,name:"widgetPreview",method:"GET"});
		});
		return container;
	};
	var initialize = function(config) {
		render = !(dkiUA.isIE() && dkiUA.ieVersion<=8) && DKI.search.isSupportedLanguage();
		sequentialFilter = playerBehaviour.forceSequential && playerBehaviour.enableCourseSearchSequential;
		strings = config.languageString;
		settings = config.settings;
		documentVersion = config.documentVersion;
		if(render){	
			var markup = Handlebars.compile(DKI.templates.search)({
				strings : DKI.strings
			});
			$("body").append(markup);
			browser = { 
				container       : $("#searchBrowserContainer"),
				details         : {
					detailsPanel      : $("#searchBrowserContainer .panel.details"),
					listPanel         : $("#searchBrowserContainer .listPanel"),
					propertiesPanel   : $("#searchBrowserContainer .propertiesPanel"),
					propertiesContent : $("#searchBrowserContainer .propertiesPanel .propertiesContent"),
					switchContainer   : $("#searchBrowserContainer .switchContainer"),
					backNav           : $("#searchBrowserContainer .propertiesPanel .backNav"),
					linksContainer    : $("#searchBrowserContainer .propertiesPanel .linksContainer"),
					overflow          : $("#searchBrowserContainer .propertiesPanel .overflowContainer"),
				},
				close           : $("#searchBrowserContainer .browserCloseButton").attr("title", playerStrings.buttonLabelClose),
				back            : $("#searchBrowserContainer .backButton"),
				search          : $("#searchBrowserContainer .searchInput"),
				filters         : $("#searchBrowserContainer .resultList"),
				sequential      : $("#searchBrowserContainer .sequential")
			};
			searchDebounce = DKI.func.debounce(search,200,false,this);
			$("#searchBrowserContainer").on(settings.clickEvent,".backNav", function() {
				setTimeout(unloadPreview,transformTime);
				if(browser.details.detailsPanel.hasClass("properties"))  {
					browser.details.detailsPanel.removeClass("properties").addClass("list");
				}
				else {
					browser.container.removeClass("shift");
				}
			});
			browser.close.on(settings.clickEvent, function() {
				hide();
			});
			browser.container.draggable({handle : $("#searchbrowserHeader")});
			$(browser.filters).on(settings.clickEvent,"li", filterClicked);
			$(document.body).on(settings.clickEvent,".searchPageJump", function(el) {
				contentApi.jumpToSubeo($(this).data("id"));
			});
			$(document).on(DKI.ContentPage.events.ready, function(){
				hide();
			});
			$(document).on(DKI.EndCourse.events.ready, function(){
				hide();
			});
			$(document).on(DKI.EndModule.events.ready, function(){
				hide();
			});
			$(document).on(DKI.EndTest.events.ready, function(){
				hide();
			});
			browser.search.keyup(function() {
				searchDebounce(true);
			});
			browser.container.on("filterClicked", function(e,data){
				loadListPanel(data);
			});
			$(window).on("resize", $.proxy(function(){
					browser.container.css("left",($(".bgRepeater").outerWidth() - browser.container.outerWidth())/2);
				}, this)
			);
		}
	},
	search = function(clickFilter){
		var term = browser.search.val();
		var results = dataStorage.searchManager.search(term);
		populateResults(results, term, clickFilter);
	}
	showVideoPlayer = function(resource, file, container, dimensions) {
		var media ={},
			extension = resource.extension === "mp4" || resource.extension === "mov" ? "m4v" : resource.extension;
		media[extension] =  file;
		renderVideoPlayer({media : media, supplied : extension}, dimensions, container, resource);
	},
	showAudioPlayer = function(resource, file, container) {
		var media ={},
			extension = resource.extension === "mp4" ? "m4a" : resource.extension;
		media[extension] = file;
		renderAudioPlayer({media : media, supplied : extension}, container);
	},
	renderAudioPlayer = function(audio, container) {
		$(container).find("#search_audioPlayer").jPlayer({
			swfPath: settings.swfPath,
			cssSelectorAncestor: "#search_audioAncestor",
			ready: function() {
				var audioPlayer = $(this);
				audioPlayer.jPlayer("setMedia", audio.media);
				activePlayer = audioPlayer;
			},
			supplied: audio.supplied,
			solution: playerSolution
		});
	},

	renderVideoPlayer =  function(video,dimensions, container, asset) {
		$(container).find("#search_vidPlayer").jPlayer({
			swfPath: settings.swfPath,
			cssSelectorAncestor: "#search_vidAncestor",
			ready: function() {
				videoPlayer = $(this);
				videoPlayer.jPlayer("setMedia", video.media);
				
				$(this).bind($.jPlayer.event.pause, function () {
					$(".jp-video-play", this.parentNode).css("display", "");
					$("#searchBrowserContainer .vidContainer .jp-interface").hide();
				});
				$(this).bind($.jPlayer.event.play, function () {
					$(".jp-video-play", this.parentNode).css("display", "none");
					$("#searchBrowserContainer .vidContainer .jp-interface").show();
				});
				$(this).bind($.jPlayer.event.click, function (e) {
					if (e.jPlayer.status.paused) {
						$(this).jPlayer("play");
					}
					else {
						$(this).jPlayer("pause");
					}
				});
				$(".jp-transcript", this.parentNode).on(settings.clickEvent, function(){
							contentApi.showPopup({
								html: asset.transcript,
								modal: false,
								title: playerStrings.transcriptLabel
							});
						});

				//register KB shortcuts for media.
				container.off("keypress").on("keypress", function(e){
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
				width  : dimensions.width + "px",
				height : dimensions.height + "px"
			},
			sizeFull: {
						height: "600px"
			},
			nativeVideoControls: settings.nativeVideoControls
		});
	},
	getType = function(item) {
		switch(item.smSearchType) {
			case "assets" : 
				if(item.type =="flash" || item.type  == "html"){
					return ["richMedia"];
				}
				return [item.type];
			break;
			case "glossaries" :
				return ["glossary", "text"];
			break;
			case "references" :
				return ["reference", "text"];
			break;
			case "citations" :
				return ["reference", "text"];
			break;
			case "pages" :
				return ["transcript", "text"];
			break;
			case "elements" :
				if(item.elementtype == "videoembed") {
					return ["video"]
				}
				else{
					return ["text"];
				}
			case "objects" :
				return ["objects"];
			break;
		}
	},
	//Sets the object that a search result may exist in.
	setObjects = function(item) {
		var set = function(pageId, obj) {
			var path  = dataStorage.locatePage(pageId);
			var lo = courseStructure.modules[path.module].objects[path.object];
			var subeo = lo.subeos[path.page];
			if(searchResults.objects[lo.eoid]) {
				searchResults.objects[lo.eoid].push({obj : obj, subeoId : subeo.subeoid});
			}
			else {
				searchResults.objects[lo.eoid] = [{obj : obj, subeoId : subeo.subeoid}];
			}
		}
		var elements = [];
		switch(item.smSearchType) {
			case "assets" : 
				elements = dataStorage.getRelationship("assetElement",item.upload_id);
			break;
			case "glosariees" :
				elements = dataStorage.getRelationship("glossaryElement",item.glossary_id);
			break;
			case "citations" :
				if(item.elementId) {
					elements = [item.elementId];
				}else {
					termId = dataStorage.getRelationship("citationGlossary", item.id);
					elements = dataStorage.getRelationship("glossaryElement", termId);
				}
			break;
			case "pages" :
				set(item.pageid, item);
			break;
			case "elements" :
				elements = [item.elementid];
			break;
		}
		for(var i = 0; i < elements.length; i ++) {
			var element = dataStorage.getElement(elements[i]);
			set(element.pageid,item);
		}
	},
	populateResults = function(results, term, clickFilter) {
		searchResults = DKI.clone(defaultSearchResults);
		searchResults.objects = {};
		var sequentialBlocked = false;
		for(var i =0; i < results.length; i ++) {
			var res = results[i];
			if((testForSequential(res))){
				searchResults.categories.top.push(res);
				var type = getType(res.obj);
				for(var j = 0; j < type.length; j ++) {
					searchResults.categories[type[j]].push(res);
				}
			} else {
				sequentialBlocked = true;
			}
		}
		if(sequentialBlocked){
			browser.sequential.show();
		}
		else {
			browser.sequential.hide();
		}
		setFilterResults(searchResults.categories, clickFilter);
	},
	getResultElements = function(item, container){
		var elements = [];
		var type = getType(item)[0];
		if(item.smSearchType == "assets") {
			elements = dataStorage.getRelationship("assetElement", item.id);
		}
		else if(type == "reference"){
			var getElements = function(citation){
				//If a citation has an element id, it is embedded in a text element, otherwise it is a glossary citation
				var elements = [];
				if(citation.elementId){
					elements.push(citation.elementId);
				}
				else {
					termId = dataStorage.getRelationship("citationGlossary", citation.id);
					elements = dataStorage.getRelationship("glossaryElement", termId);
				}
				return elements;
			}
			if(item.smSearchType == "citations"){
				elements = getElements(item);
			}
			else {
				for(var prop in DKI.references.citations) {
					if(DKI.references.citations[prop].referenceId == item.id) {
						elements = elements.concat(getElements(DKI.references.citations[prop]));
					}
				}
			}
		}
		else if(item.smSearchType == "glossaries") {
			elements = dataStorage.getRelationship("glossaryElement",item.glossaryid);
		}
		else if(item.smSearchType == "elements") {
			elements.push(item.elementid);
		}
		return elements;
	},
	testForSequential = function(item){
		var pages = [];
		if(!sequentialFilter) {
			return true;
		}
		var type = getType(item.obj)[0];
		if( type == "transcript") {
			pages.push(item.obj.pageid);
		}
		else if(type =="objects") {
			var obj = dataStorage.findObject(item.obj.id);
			for(var i =0; i < obj.subeos.length; i ++){
				if(obj.subeos[i].complete) {
					return true;
				}
			}
			return false;
		}
		else {
			var elements = getResultElements(item.obj);
			for(var i = 0; i < elements.length; i ++){
				var subeo = dataStorage.getSubeoFromPage(dataStorage.getElement(elements[i]).pageid);
				if(subeo.complete) {
					return true;
				}
			}
			return false;
		}
	},
	getTitle = function(item) {
		var title = "";
		switch(item.smSearchType) {
			case "citations" : 
				title = item.label;
			break;
			case "glossaries" : 
				title  = item.term;
			break;
			case "elements" : 
				if(getType(item)[0] == "text"){
					title = item.elementMeta.length > 50 ? item.elementMeta.substr(0,47) + "..." : item.elementMeta;
				}
				else { 
					title = item.title;
				}
			break;
			default : 
				title = item.title
			break;
		}
		return title;
	},
	getDescription = function(item) {
		switch(item.smSearchType) {
			case "glossaries" : 
				return item.definition;
			break;
			case "citations" :
				return DKI.Reference.playerReferenceUIInterface.getFullCitationText(item.id);
			break;
			case "references" : 
				return item.refText;
			break;
			case "pages"       :
				return item.transcript ? item.transcript.body : item.description;
			break;
			case "elements" : 
				if(getType(item)[0] == "text"){
					return item.elementMeta;
				}
				else { 
					return item.description;
				}
			break;
			default :
				return item.description;
			break;
		}
	},
	setFilterResults =  function(categories, clickFilter) {
		var filterParent = browser.filters.parent();
		var filters = browser.filters.detach();	
		var seq = browser.sequential.detach();	
		var showDivision  = false;
		for(var prop in categories) {
			var li = browser.filters.find("li[data-filter='"  + prop + "']");
			if(li) {
				var showLi = false;
				if(categories[prop].length > 0){
					li.find("span.resCount").html(categories[prop].length);
					showLi = true;
					if(li.data("istextitem")){
						showDivision = true;
					}
				}
				showLi ? li.show() : li.hide();
			}
		}
		showDivision ? browser.filters.find("li.division").show() : browser.filters.find("li.division").hide();
		filterParent.append(filters);
		filterParent.append(seq);
		if(!mobile && clickFilter){
			filterClicked.call(browser.filters.find("li[data-filter='top']")[0]);
		}
	},
	filterClicked  = function(ev) {
		var filter = $(this).data("filter");
		browser.filters.find("li").removeClass("selected");
		browser.container.trigger("filterClicked",[filter]);
		if(searchResults.categories[filter].length > 0){
			$(this).addClass("selected");
		}
		browser.container.addClass("shift");
		browser.details.detailsPanel.removeClass("properties").addClass("list");
	},
	loadAsset = function(asset, content) {
		var dimensions  ={
			width : $(content).width(),
			height : $(content).height()
		}
		switch(asset.type) {
			case "video" : 
				showVideoPlayer(asset, getAssetUrl(asset),content,dimensions);
			break;
			case "audio" :
				dimensions.height = 50;
				$(content).css("height", "50px");
				showAudioPlayer(asset, getAssetUrl(asset),content);
			break;
		}
	},
	loadListPanel = function(filter) {
		var items = searchResults.categories[filter];
		browser.details.listPanel.html("");
		browser.details.listPanel.append("<div tabindex='0' class='backNav'>" + 
			"<span class='icon backChevron'></span><span>" + strings.back + "</span>" +  
		"</div>");
		for(var i = 0; i < items.length; i ++){
			if(filter !="image") {
				var el = generateListItem(items[i]);
				browser.details.listPanel.append(el);
			}else {
				var el = generateImageItem(items[i]);
				browser.details.listPanel.append(el);
			}
			el.on(settings.clickEvent, function(){
				loadPropertiesPanel(dataStorage.searchManager.getItemByStoreIndex($(this).data("ref")));
			});
		}
		browser.details.detailsPanel.append(browser.details.switchContainer);
	},
	generateListItem = function(result, pageLink) {
		var item = result.obj;
		var domEl = $(itemMarkup);
		domEl.data("ref", result.ref);
		domEl.find("h3").html(getTitle(item));
		domEl.find("p").html(getDescription(item));
		domEl.find(".iconContainer .icon").addClass(getType(item)[0]);
		if(pageLink) {
			var itemTitle = getType(item)[0] == "transcript" ? "Jump to this page" : "Jump to the page containing this result";
			domEl.find(".chevron").removeClass("chevron").addClass("jump").attr("title", itemTitle);
		}
		return domEl;
	},
	getAssetUrl  = function(asset) {
		return  asset.filePath ? player.rootURL + asset.filePath : asset.assetURL;
	},
	generateImageItem = function(result) {
		var domEl = $("<div tabindex='0' class='imageThumb' data-ref='" + result.ref + "'></div>");
		domEl.css("background-image", "url(" + getAssetUrl(result.obj) + ")");
		return domEl;
	},
	loadPropertiesPanel = function(item) {
		var parent = browser.details.propertiesPanel;
		var type  = getType(item)[0];
		browser.details.overflow = browser.details.overflow.detach();
		var cont = browser.details.overflow.find(".propertiesContent");
		cont.html("").append(propertiesMarkup);
		if(type != "image" && type !="video" && type !="audio" && type!="richMedia") {
			var preview = cont.find(".preview").hide();
		}
		else {
			var preview = cont.find(".preview").show();
			var height = item.smSearchType == "assets" ? item.h : item.height;
			preview.css("height", height + "px");
			switch(type) { 
				case "image" : 
					preview.css({
						"background-image"    : "url(" + getAssetUrl(item) + ")",
						"background-position" : "center",
						"background-size"     : "contain",
						"background-repeat"   : "no-repeat"
					});
				break;
				case "video"  :
					if(item.smSearchType == "assets"){
						var videoPlayerMarkup = Handlebars.compile("{{> jPlayerVideo}}")({
							videoAncestorId : "search_vidAncestor",
							videoPlayerId   : "search_vidPlayer"
						});
						preview.html(videoPlayerMarkup);
						preview.off();
						preview.on("detailsLoaded", function() {
							loadAsset(item, this);
						});
					} else{
						preview.off();
						setTimeout(function(){
							if(item.meta2 =="dynamic") {
								preview.append("<iframe frameborder='0' scrolling='no' src='" + DKI.getVideoEmbedURL(item.elementid) + "'></iframe>");
								preview.find("iframe").load(function(){
									$("object", $(this).contents()).css({
										"max-width"   : preview.css("max-width"),
										"max-height"  :  preview.css("max-height")
									});
								});
							}
							else{
								preview.html(item.meta);
							}
							preview.find("iframe").css({
								"width"   : "100%",
								"height"  : "100%"
							});
						}, transformTime);
					}
				break;
				case "audio" : 
					var audioPlayerMarkup = Handlebars.compile("{{> jPlayerAudio}}")({
						audioAncestorId : "search_audioAncestor",
						audioPlayerId   : "search_audioPlayer"
					});
					preview.html(audioPlayerMarkup);
					preview.off();
					preview.on("detailsLoaded", function() {
						loadAsset(item, this);
					});
				break;
				case "richMedia" :
					if(item.type =="flash"){
						preview.html(getFlashMarkup(getAssetUrl(item)));
					}else{
						//We use a placeholder, so we need to discard the widthh set earlier based off of asset width
						preview.css("height","96px");
						var url = getAssetUrl(item);
						url = item.filePath ? url : url.substring(0,url.length -1);
						url += "/" + item.parameters.LAUNCHFILE;
						preview.html(getWidgetMarkup(url));
					}
				break;
			}
		}
		cont.find(".propertiesMeta").html("<h3 tabindex='0'>" + getTitle(item) + "</h3><p tabindex='0'>"  + getDescription(item) + "</p>");
		var newLinks = loadPageLinks(browser.details.linksContainer.detach(), item);
		parent.append(browser.details.overflow);
		cont.append(newLinks);
		preview.trigger('detailsLoaded');
		browser.details.detailsPanel.removeClass("list").addClass("properties");
	},
	unloadPreview = function(){
		//If there's an embed, the only way to stop its playback is to reload it
		browser.details.overflow = browser.details.overflow.detach();
	},
	loadPageLinks = function(container, item) {
		var canJump = typeof dataStorage.getCurrentQuestion() == "undefined";
		var elements = [];
		var type = getType(item)[0];
		var links = container.find(".links");
		links.html("");
		var title = container.find("h3.linksTitle").html("");
		if(type =="objects" && searchResults.objects[item.eoid]) {
			title.html("See Also:");
			for(var i = 0; i < searchResults.objects[item.eoid].length; i ++) {
				var related = searchResults.objects[item.eoid][i];
				var el = generateListItem({obj :related.obj, ref: related.subeoId}, true);
				el.on(settings.clickEvent, function() {
					contentApi.jumpToSubeo($(this).data("ref"));
				});
				links.append(el);
			}
		}
		else if( type == "transcript") {
			var subeo =  dataStorage.getSubeoFromPage(item.pageid);
			if((subeo.complete && sequentialFilter) || !sequentialFilter){
				title.html("Found Locations:");
				var el = generateListItem({obj :item, ref: subeo.subeoid}, true);
				el.on(settings.clickEvent, function() {
					contentApi.jumpToSubeo($(this).data("ref"));
				});	
				links.append(el);
			}
		}
		else{
			elements = getResultElements(item, links);
		}
		if(elements.length > 0) {
			title.html("Found Locations:");
		}
		var subeos = [];
		for(var i =0; i < elements.length; i ++) {
			var subeo = dataStorage.getSubeoFromPage(dataStorage.getElement(elements[i]).pageid);
			if((subeo.complete && sequentialFilter) || !sequentialFilter){
				//Prevent duplicate pages showing if there are 2 different elements on the same page displaying this item
				if(subeo && $.inArray(subeo.subeoid, subeos) < 0) {
					var page = subeo.page;
					subeos.push(subeo.subeoid);
					var el = generateListItem({obj : page, ref: subeo.subeoid}, true);
					el.on(settings.clickEvent, function() {
						contentApi.jumpToSubeo($(this).data("ref"));
					});	
					links.append(el);
				}
			}
		}
		return container;
	},
	show = function(term) {
		if(render){
			browser.container.show();			
			var select = browser.search[0];
			if(select){
				select.focus();
				if(typeof term !== 'undefined'){
					browser.search.val(term);
				}
				search();
				var selected = browser.filters.find("li.selected");
				if(selected[0]){
					browser.container.trigger("filterClicked",[selected.data("filter")]);
				}
				if(browser.details.detailsPanel.hasClass("properties")){
					browser.details.propertiesPanel.append(browser.details.overflow);
				}
			}	
		}else if(!render && settings.inPreview){
			if(!DKI.search.isSupportedLanguage()){
				alert("Search is not supported in this language.");
			} else{
				alert("Course searching is not supported in your browser. Please upgrade your internet browser if you wish to use this feature.");
			}
		}
	},

	hide = function() {
		if(render) {
			browser.container.hide();
			unloadPreview();
		}
	},

	toggle = function() {
		if(render){
			if(browser.container.css("display") == "none"){
				this.show();
			}
			else{
				this.hide();
			}
		}
	};

	return {
		init       : initialize,
		show       : show,
		hide       : hide,
		toggle     : toggle
	};
}();

	

