/**
 * Singleton representation of the feedback panel control
 * @author	Keith Chadwick
 * @singleton
 * @class
 */
DKI.FeedbackPanel = function(){
	var config = {
		animation: {
			effect: "slide",
			options: {
				direction: $("html").hasClass("ltr")? "right" : "left"
			}
		}
	};
	var _layoutComplete = false;	// indicates if the feedback content has been rendered
	var _hidden = true;				// indicates if the feedback panel is displayed
	var _container = null;			// pointer to root el
	var _bWatchForComplete = false;	// used by the _checkState function to indicate one of three vents has occured
	var _bFeedbackState = false;	// holds the view state of the feedback window when it has been hidden by _checkState
	//var _lastPosition = 0;			// holds a placeholder of the last scroll amount in the All feedback tab
	var _oActivePage ={}			// local pointer to the current active page or question object	
	
	var _store = {};				// store pointer
	var _tabStrip;
	var pageFeedbackTab;
	var allFeedbackTab;
	var feedBackInput;
	var presentationPlayer;
	/**
	 * Creates the layout structure for the feeddback interface
	 * @method _createLayoutStructure
	 * @member DKI.FeedbackPanel
	 * @private
	 */
	var _createLayoutStructure = function () {
		var elMenu = document.createElement("div");
		var elCloseButton = document.createElement('a');
		$(elCloseButton).attr("title", playerStrings.buttonLabelClose).attr("tabindex", 0);
		var elPageFeedback = document.createElement('div');
		var elPageFeedAll = document.createElement('div');
		var elInstructions;
		var elTextArea;
		var elBtnSubmit;
		var elBtnCancel;
		var elTitle;
		var elContent;
		$(_container).empty();
		elMenu.className = "menuHeader";
		elMenu.id = "feedbackPanelMenu";
		_container.append(elMenu);
		tabStrip = new DKI.TabSet({
			elementID: elMenu.id,
			player: presentationPlayer
		});
		pageFeedbackTab = tabStrip.createTab(strings.tabLabelPageFeedBk, "pageFeedbackTab");
		allFeedbackTab = tabStrip.createTab(strings.tabLabelAllFeedBk, "allFeedbackTab");
		tabStrip.selectTab(pageFeedbackTab.tab);
		// close button
		elCloseButton.className = 'buttonClose headerButton';
		elCloseButton.innerHTML = strings.buttonLabelClose;
		elMenu.appendChild(elCloseButton);
		
		// create the wrapper for the page feedback area
		elPageFeedback.className = 'dki-feedback dki-feedback-page';
		elPageFeedback.id = 'dki-feedback-page';
		
		// add the instructions in
		elInstructions = elPageFeedback.appendChild(document.createElement('div'));
		elInstructions.className = 'instructions';
		elInstructions.innerHTML = strings.txtInstructionsLabel;
		
		// add the textarea in
		elTextArea = elPageFeedback.appendChild(document.createElement('textarea'));
		elTextArea.className = 'txtArea-feedback';
		feedBackInput = $(elTextArea);
		
		// add the submit button
		elBtnSubmit = elPageFeedback.appendChild(document.createElement('button'));
		elBtnSubmit.className = 'btnSubmit';
		elBtnSubmit.innerHTML = strings.buttonLabelSubmit;		

		// add the cancel button
		elBtnCancel = elPageFeedback.appendChild(document.createElement('button'));
		elBtnCancel.className = 'btnCancel';
		elBtnCancel.innerHTML = strings.buttonLabelCancel;		
		
		// append the title
		elTitle = elPageFeedback.appendChild(document.createElement('div'));
		elTitle.className = 'title';
		elTitle.innerHTML = strings.txtTitleCurrentPage;
	
		// scrollable listing of all page feedback
		elContent = elPageFeedback.appendChild(document.createElement('div'));
		elContent.className = 'content';
					
		pageFeedbackTab.content.appendChild(elPageFeedback);
		$(_container).append($(pageFeedbackTab.content).detach());
		
		// create the main element for all feedback tab area
		elPageFeedAll.className = 'dki-feedback dki-feedback-all';
		elPageFeedAll.id = 'dki-feedback-all';
		
		// title bar
		elTitle = elPageFeedAll.appendChild(document.createElement('div'));
		elTitle.className = 'title';
		elTitle.innerHTML = strings.tabLabelAllFeedBk;		
		
		// scrollable listing of all page feedback
		elContent = elPageFeedAll.appendChild(document.createElement('div'));
		elContent.className = 'content';

		allFeedbackTab.content.appendChild(elPageFeedAll);
		$(_container).append($(allFeedbackTab.content).detach());
		_layoutComplete = true;
		
		return null;
	};
	
	/**
	 * Binds all of the necessary events for the feedback interface
	 * @method _bindEvents
	 * @member DKI.FeedbackPanel
	 * @private
	 * @return	null
	 */
	var _bindEvents = function(){
		// close ui [x] click		
		$('#feedbackPanel .menuHeader').delegate('.buttonClose', presentationPlayer.settings.clickEvent, function (e) {
			Handler.HideFeedback();
			e.stopPropagation();			
		});
		
		// submit button click
		$('#feedbackPanel .dki-feedback-page').delegate('.btnSubmit', presentationPlayer.settings.clickEvent, function (e) {
			Handler.SubmitFeedback();
			e.stopPropagation();			
		});
		
		// cancel button click
		$('#feedbackPanel .dki-feedback-page').delegate('.btnCancel', presentationPlayer.settings.clickEvent, function (e) {
			Handler.ClearFeedback();
			e.stopPropagation();
		});
		$(allFeedbackTab.tab).on(tabStrip.tabSelected, function (e) {
			_highlightFeedbackPage()
		});

		
		$(dataStorage).on(DKI.DataStorage.events.pageSelected, function (e, subeo) {
			Handler.onPageClick(subeo);
		})
		$(dataStorage).on(DKI.DataStorage.events.questionSelected, function (e, question) {
			Handler.onPageClick(question);
		})
		
		var hideTab =  function() {
			$('#feedbackTab').css('display','none');
			hide();
		};
		$(dataStorage).on(DKI.DataStorage.events.pageCompleted, _checkState);
		$(dataStorage).on(DKI.DataStorage.events.changeModule, _checkState);
		$(dataStorage).on(DKI.DataStorage.events.questionSelected, _checkState);
		$(document).on(DKI.EndModule.events.started, _checkState);
		$(document).on(DKI.EndTest.events.started, _checkState);
		$(document).on(DKI.EndCourse.events.started, _checkState);
		$(dataStorage).on(DKI.DataStorage.events.courseEnd, _checkState);
				
		return null;
	}; //-> end _bindEvents
	
	/**
	 * Handler subclass, all methods within the Handler singleton are bound to mouse events
	 * @class DKI.FeedbackPanel.Handler
	 * @static
	 * @private
	 */
	var Handler = {
		
		/**
		 * Rerenders the page feedback current container
		 * @method onPageClick
		 * @member DKI.FeedbackPanel.Handler
		 * @private
		 * @param {Object} e event object
		 * @param {Number} pageID integer id of the page to move to in the feedback area
		 * @return null;
		 */
		onPageClick : function(subeo){
			_oActivePage = subeo.page;
			_renderPageFeedback();
			_highlightFeedbackPage();
			return null;
		}, //-> onPageClick

		/**
		 * Handles The submission of the text
		 * @method SubmitFeedback
		 * @member DKI.FeedbackPanel.Handler
		 * @private
		 */
		SubmitFeedback : function(){
			presentationPlayer.onFeedbackSubmit(
				feedBackInput.val(),
				function(data){
			
					// insert the returned data into the store
					_oActivePage.notes.push(data);
					_oActivePage.notes.sort(function(a,b){
						var dateA = new Date(a.dateFiled);
						var dateB = new Date(b.dateFiled);
						if(dateB < dateA) {
							return -1;
						}
						else if( dateB > dateA) {
							return 1;
						}
						return 0;
					});
					_oActivePage=_store.set(_oActivePage);			
							
					// Update the page feed back	
					_renderPageFeedback();
					
					// if the note length is 1 then under the all feedback tab for that
					// page it will presently say no reviewer feedback so we must first remove that
					if(_oActivePage.notes.length==1){
						$('#feedbackPanel .dki-feedback-all .content .active p').remove()
					}
					
					// append the new note to all feedback tab
					/*
					_insertFeedbackNote({
						el 		: $('#feedbackPanel .dki-feedback-all .content .active')[0],
						note 	: data,
						method	: 'prepend'
					});
					*/
					
					/*
					 * This is very inefficient and a proper prepend would be better but due to the dom
					 * structure in the allfeedback tab this is the easiest way to do it for now.
					 */
					_renderAllFeedback()
					
					
					Handler.ClearFeedback();
					return true;
				}
			)
		}, //-> end SubmitFeedback

		/**
		 * Handles the clearing of the input for on the page feedback ui
		 * @method ClearFeedback
		 * @member DKI.FeedbackPanel.Handler
		 * @private
		 * @returns {Boolean} Always returns true
		 */
		ClearFeedback : function(){
			feedBackInput.val('');
			return true
		}, //-> end ClearFeedback
		
		/**
		 * Handles the close of the feedback window
		 * @method HideFeedback
		 * @member DKI.FeedbackPanel.Handler
		 * @private
		 * @returns true
		 */
		 HideFeedback : function(){
			hide();
		} //-> end _handleCloseEvent
						
	}; //-> end Handler

	/**
	 * Function is fired fia the bound datalayer events in the local _bindEvents method
	 * @method _checkState
	 * @member DKI.FeedbackPanel
	 * @private
	 * @param	oEvent	The event object;
	 * @return	true
	 */
	var _checkState = function(oEvent){
		var sEvent=oEvent.type;
		// this would indicate a end of module page is being displayed so we
		// must disble feedback
		if(sEvent =='changeModule' || sEvent=='courseEnd' || sEvent=='END_MODULE_STARTED' || sEvent=='END_TEST_STARTED' || sEvent=='END_COURSE_STARTED'){	
			_bFeedbackState = _hidden;
			$('#feedbackTab').css('display','none');
			hide();
			_bWatchForComplete = true;
		}else if((sEvent == 'questionSelected' || sEvent=='pageCompleted') && _bWatchForComplete){
			_bWatchForComplete = false;
			$('#feedbackTab').css('display','block');
			_bFeedbackState ? hide() : show();
		};
		
		return true;
	};
	
	/**
	 * Sets the local active page pointer to either the current page or question when in assessmen
	 * @method _setActivePage
	 * @member DKI.FeedbackPanel
	 * @private
	 * @return	null;
	 */
	var _setActivePage = function(){
		_oActivePage = _store.get(presentationPlayer.inAssessment ? 
			_store.NodeType.question + presentationPlayer.dataStorage.assessment.currentQuestion.id : 
			_store.NodeType.page + presentationPlayer.dataStorage.currentPage.id
		);
		return null;		
	};

	/**
	 * Highlights the active page in the all feedback viewport
	 * @method _highlightFeedbackPage
	 * @member DKI.FeedbackPanel
	 * @private
	 * @param	pageId	integer representing the page id to highlight
	 * @return	null
	 */
	var _highlightFeedbackPage = function(){
		
		if(_oActivePage==undefined || _oActivePage==null){return null};
		
		// remove any current selected 
		$('#feedbackPanel .dki-feedback-all .content .active').removeClass('active')
			
		var el=$($('#feedbackPanel .dki-feedback-all .content .slctr-' + _oActivePage.pageid).parent())
		el.addClass('active')
		
		$('#feedbackPanel .dki-feedback-all .content').scrollTop(el.position().top)

		return null;
	}; //-> end _highlightFeedbackPage
	
	/**
	 * Called once on initialization on first render, renders ALL of the existing notes in the All Feedback page
	 * @method _renderAllFeedback
	 * @member DKI.FeedbackPanel
	 * @private
	 * @return	null
	 */
	var _renderAllFeedback = function(){
		
		var el=$('#feedbackPanel .dki-feedback-all .content')
		
		$(el).children().each(function(i){
			$(this).remove()
		});
				
		// grab all the page data and render the subsequent notes and questions
		// NOTE: A module must contain an object with a page in order for the questions to show up
		//		 so we therefore can key of off pages 
		var pages = _store.page.all();
		for(var iPage= 0; iPage < pages.length; iPage++){
			var page = pages[iPage];
			_createPageElements(page);
		}; 		
		
		function _createPageElements(node){
			
			var notes;
			var elPage=document.createElement('div');
			elPage.className = 'page';
			node = node.page;
			notes = node.notes;
							
			var pageTitle=elPage.appendChild(document.createElement('div'));
			pageTitle.innerHTML = node.title;
			pageTitle.className = 'slctr-' + node.pageid
			
			if(notes.length==0){
				var line=elPage.appendChild(document.createElement('p'))
				line.innerHTML= strings.txtTitleNoFeedBack;
				$(line).css('margin-bottom','20px')
			}else{
								
				for(var iNote in notes){
					_insertFeedbackNote({
						el 		: elPage,
						note 	: notes[iNote]
					})
				};				
			};
			el.append(elPage);			
		}
		
		return null;	
	};

	/**
	 * Reders the Page Feedback existing notes
	 * @method _renderPageFeedback
	 * @member DKI.FeedbackPanel
	 * @private
	 * @return	null
	 */
	var _renderPageFeedback = function(){
		
		// clear out any existing elements
		var el=$('#feedbackPanel .dki-feedback-page .content');
		$(el).children().each(function(i){
			$(this).remove()
		});
		
		// create the base element to insert into
		var elPage=document.createElement('div');
		elPage.className = 'page';
			
		// if no notes then display no feedback message
		if(_oActivePage.notes.length==0){
			var line=elPage.appendChild(document.createElement('p'))
			line.innerHTML = strings.txtTitleNoFeedBack;
			$(line).css('margin-bottom','20px')
		}else{
			
			for( var iNote=0; iNote < _oActivePage.notes.length; iNote++){
				_insertFeedbackNote({
					el 		: elPage,
					note 	: _oActivePage.notes[iNote]
				})
			};				
		};
			
		el.append(elPage);
		return null;
	};
	
	/**
	 * Inserts the standard dom structure for a feedback note on either the page feedback or all feedback tabs
	 * @private
	 * @param {Object} oConfig
	 * @param {HTMLElement} oConfig.el The element to append to
	 * @param {Object} oConfig.note note object to append
	 * @return	null
	 */
	var _insertFeedbackNote = function(oConfig){
		var method =oConfig.method==undefined?'append':oConfig.method;
	
		var wrapper = document.createElement('span');
	
		var dtm = new Date(oConfig.note.dateFiled);
		var line1 = (dtm.getMonth()+1) + '/' + dtm.getDate() + '/' + dtm.getFullYear();
		line1 += '&nbsp<i>'+oConfig.note.enteredBy.first + ' ' + oConfig.note.enteredBy.last+ '</i> ' + strings.txtLine1Noted
		wrapper.appendChild(document.createElement('p')).innerHTML=line1;

		var line2=wrapper.appendChild(document.createElement('p'))
		line2.innerHTML=oConfig.note.description.toString().replace(/\n/gi, "<br />");	
		$(line2).css('margin-bottom','20px');
		
		$(oConfig.el)[method](wrapper)
		
		return null;	
	};
	
	/**
	 * Initiates the layout of the feedback interface on FIRST CALL only and toggles its display
	 * @private
	 * @return	true
	 */
	var _doLayout = function(){
		if(!_layoutComplete){
			
			_createLayoutStructure();
			
			_renderAllFeedback();
			
			_bindEvents();
			_layoutComplete=true;
			
			// by default initialize the page tab
			$('#feedbackPanel .menuHeader .menuTabs .selected').click() 
		}
		return true;
	}; //-> end doLayout
		
	/**
	 * Initializes the Feedback panel
	 * @method	init
	 * @member DKI.FeedbackPanel
	 * @param   player The course player object.
	 * @param	elementID	string id of element to render panel content to
	 * @param	dataStore	courseStore object
	 * @return	true
	 */
	var initialize = function(player, elementID,dataStorage,astrings){
		presentationPlayer = player;
		strings = astrings;
		
		if(elementID==null || dataStorage==null || elementID==undefined || dataStorage==undefined){
			throw 'Missing required parameters';
			return false;
		};
				
		// set the global scopped variables 
		_container = $("#" + elementID);
		
		// where datastore is a DKI.courseStore
		_store = dataStorage;	
		
		// render the dom
		_doLayout()
		
		//$(_store).on(_store.ready, _doLayout)
		return true;	
	}; //-> end Initialize	

	/**
	 * Shows the Feedback panel
	 * @method show
	 * @member DKI.FeedbackPanel
	 * @return {Boolean} hidden state
	 */	
	var show = function(){
		_doLayout();
		
		_container.show(config.animation.effect, config.animation.options);
		tabStrip.selectTab(pageFeedbackTab.tab);

		_highlightFeedbackPage();
		feedBackInput[0].focus();
		_hidden=!_hidden;
		return _hidden		
	};
	
	/**
	 * Hides the Feedback panel
	 * @method hide
	 * @member DKI.FeedbackPanel
	 * @return {Boolean} hidden state
	 */
	var hide = function() {		
		_container.hide(config.animation.effect, config.animation.options);
		_hidden=!_hidden;
		return _hidden;				
	};
	
	/**
	 * Toggles the view state of the feedback panel
	 * @method	toggleDisplay
	 * @member DKI.FeedbackPanel
	 * @return	{Boolean} hidden state
	 */
	var toggleDisplay = function(){
		return _hidden ? show():hide();
	};
	
	/**
	 * Determines feedback panel state after page completion
	 * @method menuNavigate
	 * @member DKI.FeedbackPanel
	 */
	var menuNavigate = function(){
		_checkState({type:'pageCompleted'})
	}
	
	return {
		init			: initialize,
		show 			: show,
		hide 			: hide,
		toggleDisplay	: toggleDisplay,
		menuNavigate	: menuNavigate
	};
	
}(); //-> end FeedBackPanel Singleton

