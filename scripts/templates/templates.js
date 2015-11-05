var isMobile = $("body").hasClass("mobile");
var isTablet =  $("body").hasClass("tablet");
var isOnline = $("body").hasClass("online");
if(!DKI){
	var DKI = {};
}
DKI.templates = {};

/************* Player Header and Footer *******************/
DKI.templates.header = "";
DKI.templates.footer = "";
if(isMobile || isTablet || isOnline){
	DKI.templates.header += '<div id="logo"></div>';
}
if(!isMobile){
	DKI.templates.footer += '<div id="info"> ' +
			'<span id="moduleName" tabindex="0"></span> ' +
			'<span id="objectName" tabindex="0"></span> ' +
		'</div> ' +
		'<div class="navButtonContainer"> ' +
			'<a ' + 
				'id="audioButton" ' +
				'class="navButton" ' + 
				'tabindex="0" ' + 
				'role="button" ' +
				'title="{{strings.index.audioButtonLabel}}" ' +
			'> ' +
				'<span class="button-left"></span> ' +
				'<span class="button-middle"><span class="button-label">{{strings.index.audioButtonLabel}}</span></span> ' +
				'<span class="button-right"></span> ' +	
			'</a> ' +
			'<a ' + 
				'id="replayButton" ' + 
				'class="navButton" ' + 
				'tabindex="0" ' + 
				'role="button" ' +
				'title="{{strings.index.replayButtonLabel}}" ' +
			'> ' +
				'<span class="button-left"></span> ' +
				'<span class="button-middle"><span class="button-label">{{strings.index.replayButtonLabel}}</span></span> ' +
				'<span class="button-right"></span> ' +	
			'</a> ' +
			'<div id="navButtons"> ' +
				'<span id="screenCount" tabindex="0"><span id="currentScreen">0</span> / <span id="totalScreens">0</span></span> ' +
				'<a ' + 
					'id="backButton" ' + 
					'class="navButton" ' + 
					'tabindex="0" ' + 
					'role="button" ' +
					'title="{{strings.index.previousButtonLabel}}" ' +
				'> ' +
					'<span class="button-left"></span> ' +
					'<span class="button-middle"><span class="button-label">{{strings.index.previousButtonLabel}}</span></span> ' +
					'<span class="button-right"></span> ' +	
				'</a> ' +
				'<a ' + 
					'id="forwardButton" ' + 
					'class="navButton" ' +
					'tabindex="0" ' + 
					'role="button" ' +
					'title="{{strings.index.nextButtonLabel}}" ' +
				'> ' +
					'<span class="button-left"></span> ' +
					'<span class="button-middle"><span class="button-label">{{strings.index.nextButtonLabel}}</span></span> ' +
					'<span class="button-right"></span> ' +
				'</a> ' +					
			'</div> ' +				
		'</div>	';
	DKI.templates.header += '<div class="navButtonContainer">' + 
		'<a ' +  
			'id="skipToContent" ' + 
			'class="navButton" ' + 
			'tabindex="1" ' + 
			'role="button" ' + 
			'title = "{{strings.index.skipToContent}}" ' + 
		'></a> ' + 

		'<a ' +  
			'id="resourceButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' + 
			'role="button" ' + 
			'title = "{{strings.index.resourcesButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.resourcesButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="glossaryButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title = "{{strings.index.glossaryButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.glossaryButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 
		'<a ' +  
			'id="transcriptButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' +  
			'title="{{strings.index.transcriptButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.transcriptButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 
		'<a ' +  
			'id="menuButton" ' +  
			'class="navButton" ' + 
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.menuButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.menuButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="exitButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.exitButtonLabel}}" ' + 
		'> ' +
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.exitButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 
		'</a> ' + 
	'</div>';
}
else if(isTablet){
	DKI.templates.header += '<a ' +  
		'id="skipToContent" ' +  
		'class="navButton" ' +  
		'tabindex="1" ' +  
		'role="button" ' + 
		'title = "{{strings.index.skipToContent}}" ' + 
	'></a> ' + 
	'<a ' +  
		'id="listButton" ' +  
		'class="navButton" ' +  
		'tabindex="1" ' +  
		'role="button" ' + 
		'title="{{strings.index.listButtonLabel}}" ' + 
	'> ' + 
		'<span>{{strings.index.listButtonLabel}}</span> ' + 
	'</a> ' + 
	'<div id="moreButtons"> ' + 
		'<a ' +  
			'id="exitButton" ' + 
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.exitButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.exitButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="menuButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.menuButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.menuButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="audioButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.audioButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.audioButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="resourceButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title = "{{strings.index.resourcesButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.resourcesButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="glossaryButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title = "{{strings.index.glossaryButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.glossaryButtonLabel}}</span> ' + 	
		'</a> ' + 
		'<a ' +  
			'id="transcriptButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.transcriptButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.transcriptButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="replayButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.replayButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.replayButtonLabel}}</span> ' + 
		'</a> ' + 
	'</div> ' + 
	'<span id="moduleName" tabindex="1"></span> ' + 
	'<span id="objectName" tabindex="1"></span> ' + 
	'<span id="screenCount" tabindex="1"><span id="currentScreen">0</span> / <span id="totalScreens">0</span></span> ' + 
	'<div id="navigationButtons"> ' + 
		'<a ' +  
			'id="backButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.previousButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.previousButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 
		'<a ' +  
			'id="forwardButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.nextButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.nextButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 	
	'</div>';
} 
else{
	DKI.templates.header += '<a ' + 
		'id="skipToContent" ' +  
		'class="navButton" ' +  
		'tabindex="1" ' +  
		'role="button" ' + 
		'title = "{{strings.index.skipToContent}}" ' + 
	'></a> ' + 
	'<a id="listButton" ' +  
			'class="navButton" ' + 
			'tabindex="1" ' +  
			'role="button" ' + 
			'aria-label="{{strings.index.listButtonLabel}}" ' + 
			'aria-haspopup="true" ' + 
			'aria-owns="moreButtons" ' + 
			'title="{{strings.index.listButtonLabel}}" ' + 
		'> ' + 
		'<span class="button-label">{{strings.index.listButtonLabel}}</span> ' + 
	'</a> ' + 
	'<div id="moreButtons"> ' + 
		'<a ' +  
			'id="exitButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.exitButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.exitButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="menuButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' + 
			'role="button" ' + 
			'title="{{strings.index.menuButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.menuButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="resourceButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title = "{{strings.index.resourcesButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.resourcesButtonLabel}}</span> ' + 
		'<a ' +  
			'id="glossaryButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title = "{{strings.index.glossaryButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.glossaryButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="transcriptButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.transcriptButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.transcriptButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="audioButton" ' +  
			'class="navButton" ' + 
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.audioButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.audioButtonLabel}}</span> ' + 
		'</a> ' + 
		'<a ' +  
			'id="replayButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' + 
			'title="{{strings.index.replayButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-label">{{strings.index.replayButtonLabel}}</span> ' + 
		'</a> ' + 
	'</div> ' + 
	'<span id="moduleName" tabindex="1"></span> ' + 
	'<span id="objectName" tabindex="1"></span> ' + 
	'<span id="screenCount" tabindex="1" role="region"><span id="currentScreen">0</span> / <span id="totalScreens">0</span></span> ' + 
	'<div id="navigationButtons"> ' + 
		'<a ' +  
			'id="backButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' + 
			'role="button" ' + 
			'aria-label="{{strings.index.previousButtonLabel}}" ' + 
			'title="{{strings.index.previousButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.previousButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 
		'<a ' +  
			'id="forwardButton" ' +  
			'class="navButton" ' +  
			'tabindex="1" ' +  
			'role="button" ' +  
			'aria-label="{{strings.index.nextButtonLabel}}" ' + 
			'title="{{strings.index.nextButtonLabel}}" ' + 
		'> ' + 
			'<span class="button-left"></span> ' + 
			'<span class="button-middle"><span class="button-label">{{strings.index.nextButtonLabel}}</span></span> ' + 
			'<span class="button-right"></span> ' + 	
		'</a> ' + 	
	'</div>';
}

/******************* End Screens **************************/
DKI.templates.endModule = '<div class="endScreenWrapper"> ' + 
		'<div class="endScreen"> ' + 
			'<h1 id="endMod_header" class="section header" tabindex="1"> ' + 
				'<p>{{strings.endMod.headerText}}</p> ' + 
				'<p><b id="endMod_moduleName" class="modname">{{strings.endMod.moduleNameLabel}}</b></p> ' + 
			'</h1> ' + 
			'<div id="endMod_status" class="section dki-section-panel status"> ' + 
				'<ul> ' + 
					'<li id="endMod_learningLine" class="dki-lineitem" tabindex="1"> ' + 
						'<span class="dki-label">{{strings.endMod.learningStatusLabel}}</span><strong id="endMod_learningStatus" class="dki-themeTextColor learningStatus">0%</strong> ' + 
					'</li> ' + 
					'<li id="endMod_scoreLine" class="dki-lineitem dki-lineitem-last" style="border-bottom:0px" tabindex="1"> ' + 
						'<div class="endMod_passStatus"></div> ' + 
						'<span class="dki-label">{{strings.endMod.testStatusLabel}}</span><strong id="endMod_testScore" class="dki-themeTextColor testScore">0%</strong> ' + 
						'<span class="endMod_passingScoreLine"> ' + 
							'<span class="dki-label">{{strings.endMod.passingScoreLabel}}</span> ' + 
							'<strong class="endMod_passingScore dki-themeTextColor"></strong> ' + 
						'</span> ' + 
					'</li> ' + 
				'</ul> ' + 
							
	
			'</div> ' + 
			'<div id="endMod_actions" class="section actions"> ' + 
				'<a class="endMod_learningLink" tabindex="1" role="button">{{strings.endMod.learningLinkLabel}}</a> ' + 
				'<a class="endMod_revisitLink" tabindex="1" role="button">{{strings.endMod.revisitContentButton}}</a> ' + 
				'<a class="endMod_testingLink disabled" id="" tabindex="1" role="button">{{strings.endMod.testingLinkLabel}}</a> ' + 
				'<a class="endMod_reviewLink" tabindex="1" role="button">{{strings.endMod.reviewTestButton}}</a> ' + 
			'</div> ' + 
		'</div> ' + 
	'</div>';
DKI.templates.endCourse = '<div class="endScreenWrapper"> ' + 
	'<div class="endScreen"> ' + 
		
		'<h1 id="endCourse_header" class="section header" tabindex="1"> ' + 
			'<p>{{strings.endCourse.headerLabel}}</p> ' + 
			'<p><b id="endCourse_courseName">{{contentApi "getCourseName"}}</b></p> ' + 
		'</h1> ' + 
		
		'<div id="endCourse_status" class="dki-section-panel status"> ' + 
			'<ul> ' + 
				'<li id="endCourse_learningLine" class="dki-lineitem" tabindex="1"> ' + 
					'<span class="dki-label">{{strings.endCourse.LearningStatusLabel}}</span><strong id="endCourse_learningStatus" class="dki-themeTextColor learningStatus">0%</strong> ' + 
				'</li> ' + 
				'<li id="testingLine" class="dki-lineitem dki-lineitem-last" tabindex="1"> ' + 
					'<div id="course_passing_status"></div> ' + 
					'<span id="endCourse_testingStatusLabel" class="dki-label">{{strings.endCourse.testingStatusLabel}}</span> ' + 
					'<strong id="endCourse_testingStatus" class="dki-themeTextColor testingStatus"> ' + 
					'<span id="course_score">0%</span> ' + 
					'</strong> ' + 
					'<span class="passing_score_container"> ' + 
						'<span class="dki-label passing_score_label">{{strings.endCourse.passingScoreLabel}}</span> ' +  
						'<span class="course_passing_score dki-themeTextColor">{{contentApi "getCoursePassMark"}}%</span> ' + 
					'</span> ' + 
				'</li> ' + 
			'</ul> ' + 
		'</div> ' + 

		'<div id="endCourse_actions" class="section actions"> ' + 
			'<a id="endCourse_certificateLink" class="disabled" tabindex="0" role="button">{{strings.endCourse.viewCertificate}}' + 
				'<span id="endCourse_certificateNotAvailable">{{strings.endCourse.certNotAvailable}}</span> ' + 
			'</a> ' + 
			'<a id="endCourse_bibliographyLink" tabindex="0" role="button">{{strings.endCourse.viewBibliography}}</a> ' + 
			'<a class="endCourse_revisitLink" tabindex="0" role="button">{{strings.endMod.revisitContentButton}}</a> ' + 
		'</div> ' + 
		
		'<div id="endCourse_testing" class="dki-section-panel testing" style="display:block;"> ' + 
			'<div class="dki-title">&nbsp;</div> ' + 
			'<div class="dki-scroller"> ' + 
				'<ul> ' + 
				'</ul> ' + 
			'</div> ' + 
		'</div> ' + 
	'</div> ' + 
'</div>';

/******************** UI Windows **************************/

//Search
DKI.templates.search ="<div id='searchBrowserContainer' class='loading windowContainer'>"+
	"<div id='searchbrowserHeader' class='browserHeader'>" +
		"<span class='headerTitle' tabindex='0'>{{strings.courseSearch.title}}</span>" +
		"<div class='browserCloseButton' tabindex='0'></div>"+
	"</div>" + 
	"<div class='browserContentContainer'>" +
		"<div id='resultList' class='panel browserList'>" +
			"<div class='searchContainer'>" +
			"<input id='courseSearchInput'class='searchInput' type='text' tabindex='0' placeholder='{{strings.courseSearch.inputPlaceholder}}'></input>" +
		"</div>" + 
		"<ul id='results' class='resultList'>" +
				"<li class='searchItem' data-filter='top' tabindex='0' title='{{strings.courseSearch.filterTop}}'><span class='icon top'></span><span class='filterTitle'>{{strings.courseSearch.filterTop}}</span></li>" + 
				"<li class='searchItem' data-filter='image' tabindex='0'title='{{strings.courseSearch.filterImages}}'><span class='icon image'></span><span class='filterTitle'>{{strings.courseSearch.filterImages}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='video' tabindex='0'title='{{strings.courseSearch.filterVideos}}'><span class='icon video'></span><span class='filterTitle'>{{strings.courseSearch.filterVideos}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='audio' tabindex='0'title='{{strings.courseSearch.filterAudio}}'><span class='icon audio'></span><span class='filterTitle'>{{strings.courseSearch.filterAudio}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='richMedia' tabindex='0'title='{{strings.courseSearch.filterRichMedia}}'><span class='icon richMedia'></span><span class='filterTitle'>{{strings.courseSearch.filterRichMedia}}</span><span class='resCount'></span></li>" +
				"<li class='division'></li>" +
				"<li class='searchItem' data-filter='text' data-istextitem='true' tabindex='0'title='{{strings.courseSearch.filterText}}'><span class='icon text'></span><span class='filterTitle'>{{strings.courseSearch.filterText}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='reference'  data-istextitem='true' tabindex='0'title='{{strings.courseSearch.filterReferences}}'><span class='icon reference'></span><span class='filterTitle'>{{strings.courseSearch.filterReferences}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='glossary'  data-istextitem='true' tabindex='0'title='{{strings.courseSearch.filterGlossaries}}'><span class='icon glossary'></span><span class='filterTitle'>{{strings.courseSearch.filterGlossaries}}</span><span class='resCount'></span></li>" + 
				"<li class='searchItem' data-filter='transcript'  data-istextitem='true' tabindex='0'title='{{strings.courseSearch.filterTranscripts}}'><span class='icon transcript'></span><span class='filterTitle'>{{strings.courseSearch.filterTranscripts}}</span><span class='resCount'></span></li>" + 
			"</ul>" +
			"<div class='sequential' title=''>"+
				"<span class='icon alert'></span><h3>{{strings.courseSearch.sequentialWarningTitle}}</h3><p>{{strings.courseSearch.sequentialWarningText}}</p>" +
			"</div>" +
		"</div>" +
		"<div class='panel details list'>" +
			"<div class='switchContainer'>" + 
				"<div class='listPanel'></div>" + 
				"<div class='propertiesPanel'>" +
					"<div tabindex='0' class='backNav'>" + 
						"<span class='icon backChevron'></span><span>{{strings.courseSearch.back}}</span>" +  
					"</div>" + 
					"<div class='overflowContainer'>" +
						"<div class='propertiesContent'></div>" + 
						"<div class='linksContainer'>" + 
							"<h3 class='linksTitle'></h3>" + 
							"<div class='links'></div>" + 
						"</div>"+
					"</div>" + 
				"</div>" +
			"</div>" + 
		"</div>" +
	"</div>" +
"</div>";

//Glossary
DKI.templates.glossaryPopup = '<div id="glossaryPopup" class="popupWindow loading">' +
			'<div class="glossaryPopupHeader">' +
				'<p id="glossaryPopupTerm" tabindex="0" ></p>' +
				'{{> jPlayerAudioSimple}}' + 
				'<div id="glossaryPopupClose" class="glossaryCloseButton" title="{{strings.runtime.buttonLabelClose}}" tabindex="0"></div>' +
			'</div><div class="sectionBreak"></div>' +
			'<div class="glossaryPopupBody">' +
				'<div id="glossaryPopupDefinitionContainer">' +
					'<div id="glossaryPopupDefinition" class="popupContent" tabindex="0"></div>' +
					'<div id="glossaryPopupSource" class="popupContent" tabindex="0"></div>'+
				'</div>' +
			'</div> <div class="sectionBreak"></div>' +
			'<div id="linkContainer">' +
				'<a id="viewBrowserLink" title="{{strings.glossary.viewTermTooltip}}"></a>' +
			'</div>'+
		'</div>' +
		'<div id="glossaryHoverDefinition" class="popupWindow"></div>';
DKI.templates.glossaryBrowser =  "<div id='glossaryBrowserContainer' class='loading windowContainer'>"+
	"<div id='browserHeader' class='browserHeader'>" +
		"<span id='glossaryBrowserTitle' class='headerTitle' tabindex='0'>{{strings.glossary.titleText}}</span>" +
		"<div id='glossaryBrowserClose' class='browserCloseButton' title='{{strings.runtime.buttonLabelClose}}' tabindex='0'></div>"+
	"</div>" +
	"{{#if mobile}}"  +
		"<div id='back' class='backButton' tabindex='0'> Back </div>" + 
		"<div class='searchContainer'>" +
				"<div class='searchIcon'/>" +
				"<input id='searchBox' class='searchInput' type='text'></input>" +
			"</div>" + 
	"{{/if}}" + 
	"<div id='glossaryContentContainer' class='browserContentContainer'>" +
		"<div id='termList' class='panel browserList'>" +
		"{{#unless mobile }}" + 
			"<div class='searchContainer'>" +
				"<div class='searchIcon'/>" +
				"<input id='searchBox' class='searchInput' type='text'></input>" +
			"</div>" + 
		"{{/unless}}" + 
	"<ul id='termUl' class='terms'></ul>" +
		"</div>" +
		"<div id='termDetails' class='panel details'>" +
			"<div class='detailsContent'>" +
				"<div>" +
					"<div id='term' tabindex='0'></div>{{> jPlayerAudioSimple}}" +
				'</div><div class="sectionBreak"></div>' +
				"<div id='definition' tabindex='0'></div><div class='sectionBreak'></div>" +
				"<div id='attribution' tabindex='0'></div>" +
			"</div>" +
		"</div>" +
	"</div>" +
"</div>";

//References
DKI.templates.citationPopup = "<div id='referencePopup' class='popupWindow loading'>" +
		"<div class='referencePopupHeader'>" +
			"<div id='referencePopupClose' class='glossaryCloseButton' tabindex='0' title='{{strings.runtime.buttonLabelClose}}'></div>" +
		"</div><div class='sectionBreak'></div>" +
		"<div class='referencePopupBody'>" +
			"<div id='referencePopupText' class='popupContent' tabindex='0'>" +
				"<div id='referenceTextContainer'></div>" +
			"</div>" +
		"<div class='sectionBreak'></div>" +
		"<div id='linkContainer'>" +
			"<span id='viewBibliographyLink' title = '{{strings.references.viewBibliography}}'tabindex='0'></span>" +
			"<div class='nav'><span class='previous citationNav' tabindex='0'></span><span class='counter' tabindex='0'></span><span class='next citationNav' tabindex='0'></span></div>" +
		"</div>"+
	"</div>";
DKI.templates.bibliography = "<div id='bibliographyContainer' class='loading windowContainer'>"+
		"<div id='bibliographyBrowserHeader' class='browserHeader'>" +
			"<span id='bibliographyTitle' class='headerTitle' tabindex='0'>{{strings.references.bibliographyWindowTitle}}</span>" +
			"<div id='bibliographyClose' class='browserCloseButton' tabindex='0'></div>"+
		"</div>" +
		"<div id='bibliographyContentContainer' class='browserContentContainer'></div>" +
	"</div>";

//Resources
DKI.templates.resourceBrowser = "<div id='resourceWindowContainer' class='loading windowContainer'>"+
		"<div id='searchHead' class='browserHeader'>" +
			"<span id='resourceBrowserTitle' class='headerTitle' tabindex='0'>{{strings.resources.resourceBrowserTitle}}</span>" +
			"<div id='resourceBrowserClose' class='browserCloseButton' title='{{strings.runtime.buttonLabelClose}}' tabindex='0'></div>"+
		"</div>" +
		"{{#if mobile}}" + 
			"<div id='resourceBack' class='backButton' tabindex='0'> Back </div>"  + 
			"<div class='searchContainer'>" +
					"<div class='searchIcon'/>" +
					"<input id='resourceSearchBox'class='searchInput' type='text' tabindex='0'></input>" +
				"</div>" + 
		"{{/if}}" + 
		"<div id='resourceContentContainer' class='browserContentContainer'>" +
			"<div id='resourceList' class='panel browserList'>" + 
		"{{#unless mobile}}" + 
			"<div class='searchContainer'>" +
				"<div class='searchIcon'/>" +
				"<input id='resourceSearchBox'class='searchInput' type='text' tabindex='0'></input>" +
			"</div>" + 
		"{{/unless}}" + 
		"<ul id='list' class='resultList'></ul>" +
			"</div>" +
			"<div id='resourceView' class='panel'>" +
				"<div class='detailsContent border'>" +
					"<div id='resourceDetails'>" +
						"<div id='resourceContent' tabindex='0'></div>" +
						"<div class='assetProperties'>" +
							"<div id='resourceTitle' tabindex='0'></div>" +
							"<div id='resourceDescription' tabindex='0'></div>" +
						"</div>" +
					"</div>" +
				"</div>" +
				
			"</div>" +
		"</div>" +
	"</div>";




/********************** Partials **************************/

Handlebars.registerPartial('jPlayerVideo',"<div id='{{videoAncestorId}}' class=\"jp-video\">" +
		"<div class=\"jp-type-single\">" +
			"<div id ='{{videoPlayerId}}' class=\"vidPlayer\" class=\"jp-video-player\"></div>" +
			"<div class=\"jp-video-play\">" +
				"<a class=\"jp-video-play-icon\">play</a>" +
			"</div>" +
			"<div class=\"jp-gui\">"+
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
							"<li><a class=\"jp-pause\" role=\"button\">pause</a></li>" +
							"<li><a class=\"jp-transcript\" role=\"button\">transcript</a></li>" + 
							"<li><a class=\"jp-full-screen\" role=\"button\">full</a></li>" +
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
		"</div>" +
	"</div>");
Handlebars.registerPartial('jPlayerAudio', "<div id = '{{audioAncestorId}}' class='audioContainer mediaContainer jp-audio'>" +
		"<div id ='{{audioPlayerId}}' class='audioPlayer' class='jp-jplayer'></div>"+
		"<div class=\"jp-type-single\">"+
			"<div class=\"jp-gui jp-interface\">" +
				"<div class=\"jp-controls-holder\">" +
					"<ul class=\"jp-controls\">" +
						"<li><a class=\"jp-play\" tabindex=\"0\" role=\"button\">play</a></li>" +
						"<li><a class=\"jp-pause\" tabindex=\"0\" role=\"button\">pause</a></li>"+
						"<li><a class=\"jp-mute\" tabindex=\"0\" role=\"button\">mute</a></li>" +
						"<li><a class=\"jp-unmute\" tabindex=\"0\" role=\"button\">unmute</a></li>"+
					"</ul>" +
					"</div>" +
					"<div class=\"jp-progress\">" +
						"<div class=\"jp-seek-bar\">" +
							"<div class=\"jp-play-bar\"></div>" +
						"</div>" +
					"</div>" +
					"<div class='jp-time-holder'>" +
						"<div class='jp-current-time'></div>" +
						"<div class='jp-duration'></div>" +
				    "</div>" +
				"</div>" +
				"<div class=\"jp-no-solution\">" +
					"<span>No workee</span>" +
				"</div>" +
			"</div>"+
		"</div>" +
	"</div>");
Handlebars.registerPartial('jPlayerAudioSimple', '<div id="{{audioSimpleAncestorId}}" class="jp-basic">' +					
					"<div class=\"jp-type-single\">" +
						"<div id='{{audioSimplePlayerId}}' class=\"jp-audio\"></div>" +
						"<div class=\"jp-gui jp-basic jp-interface\">" +
							"<div class=\"jp-controls-holder\">" +
								"<ul class=\"jp-controls\">" +
									"<li><a class=\"jp-play\" tabindex=\"0\" role=\"button\">play</a></li>" +
									"<li><a class=\"jp-pause\" tabindex=\"0\" role=\"button\">pause</a></li>" +
								"</ul>" +
							"</div>" +
						"</div>" +
					"</div>" +
				'</div>');

/********************** Helpers **************************/
Handlebars.registerHelper("contentApi", function(member){
	if(contentApi && contentApi[member]){
		return typeof contentApi[member] === "function" ? contentApi[member]() : contentApi[member];
	}
	return "";
})
Handlebars.registerHelper("exists", function(member, options){
	var path = member.split(".");
	var exists = true;
	var curMem = this;
	for(var i=0; i < path.length; i++){
		if(typeof curMem[path[i]] === 'undefined'){
			exists = false;
			break;
		}
	}
	if(exists){
		return options.fn(this);
	}
	else{
		return options.inverse(this);
	}
});