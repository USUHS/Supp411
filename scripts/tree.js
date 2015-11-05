var DKI;
if (!DKI) {
	DKI = {};
}

/**
 * This file provides for the tree in the left hand panel of the player
 * Given that this tree is written in jquery and is ONLY ever created once it is written as a singletong
 * using the Crockford module patter. This is done in order to reduce the memory footprint of the tree
 * If need be this can easily be converted into a proper instantiable class with a few minor changes
 *
 * The tree is initialized via the init method which is passed the elementID and dataStorage oject
 * @class
 * @static
 */
DKI.PlayerTree= function(){
	
	/*
	 * Private declarations
	 */
	var _elementID = null;		// passed element id on init
	var _container = null;		// root container of tree
	var _isVisible = false;		// indicates if the menu is displayed
	var hidePages = null;
	var store = null;			// DKI.courseStore pointer rather than full path
	var presentationPlayer;	
	/*
	 * Renders the course data based on the passed dataStorage
	 * @member DKI.PlayerTree
	 * @private
	 * @return null
	 */
	var _renderCourseTree = function (){

		// TODO: Destroy the dom properly, although is should ALWAYS be empty
		_container.html("");		
		var forceSequential=playerBehaviour.forceSequential;
		hidePages = playerBehaviour.hidePagesFromMenu;
		if (store !== undefined && store !== null) {
			
			// Create the root node of the tree
			var course = store.course.get();
			
			var cEl = document.createElement("div");
			cEl.id = course.key
			cEl.className = 'treeNode collapse ' + store.NodeType.course;			
			var child=cEl.appendChild(document.createElement("a"));
			child.setAttribute("tabindex", 0);
			
			child.innerHTML += "<span class='tree-icon collapse'></span><span title=\"" + course.coursename + "\"><span class='tree-icon status'></span><span class='label'>" + course.coursename + "</span></span>";
			if (course.complete) {
				child.className = "finished";
			}
			else if (course.started) {
				child.className = "started";
			}
			else {
				child.className = "unstarted";
			}
			child.className += " collapse";
			child.id = course.key + 'link';
			
			// enumerate the modules
			for(var mI in course.childKeys){
				
				// Create the module node
				var module = store.module.get(course.childKeys[mI]);
				
				var mEl = document.createElement("div");						
				mEl.id = module.key;
				mEl.className = 'treeNode collapse ' + store.NodeType.module;				
				
				// create the child node
				var child=mEl.appendChild(document.createElement("a"));
				child.setAttribute("tabindex", 0);
				child.innerHTML = "<span class='tree-icon collapse'></span><span title=\"" + module.name + "\"><span class='tree-icon status'></span><span class='label'>" + module.name + "</span></span>";
				if (module.complete) {
					child.className = 'finished';
				}
				else if (module.started) {
					child.className = 'started';
				}
				else {
					child.className = 'unstarted';
				}
				child.className += ' collapse';
				child.id = module.key + "link";
				
				cEl.appendChild(mEl)
				
				// enumerate the objects
				for(var oI in module.childKeys){

					var object = store.get(module.childKeys[oI]);
										
					// create the object node
					var oEl = document.createElement("div");
					oEl.className = 'treeNode collapse ' + store.NodeType.object;	
					oEl.id = object.key;
					if(hidePages){
						oEl.className += " pagesHidden";
					}
					
					// create the child anchor node
					var child=oEl.appendChild(document.createElement("a"));
					child.setAttribute("tabindex", 0);
					child.innerHTML = "<span class='tree-icon collapse'></span><span title=\"" + object.name + "\"><span class='tree-icon status'></span><span class='label'>" + object.name + "</span></span>";
					if (object.complete) {
						child.className = 'finished';
					}
					else if (object.started) {
						child.className = 'started';
					}
					else {
						child.className = 'unstarted';
					}
					child.className += ' collapse';
					child.id = object.key + "link";
					mEl.appendChild(oEl);	
					for(var pI in object.childKeys){
						var page = store.get(object.childKeys[pI])
						if(page.nodeType==store.NodeType.page && !hidePages){
						
							var pEl = document.createElement("div");
							pEl.id = page.key;
							pEl.className = 'treeNode ' + store.NodeType.page + (forceSequential && !page.complete?' disabled':'');
	
							var child = pEl.appendChild(document.createElement("a"));
							child.setAttribute("tabindex", 0);
							child.innerHTML = "<span title=\"" + page.page.title + "\"><span class='tree-icon status'></span><span class='label'>" + page.page.title + "</span></span>";
							if (page.complete) {
								child.className = 'finished';
							}
							else {
								child.className = 'unstarted';
							}
							child.id = page.key + "link";
							
							oEl.appendChild(pEl);				
						}
					};	// end page loop			
				}; // end object loop
			}; // end module loop
			_container.append(cEl);
		}
		else {
			_container.html("No outline available");
		};
		return null;
	}; //-> end _renderCourseTree
				
	/*
	 * Binds the click methods to the tree
	 * @member DKI.PlayerTree
	 * @private
	 * @returns null
	 */
	var _initEvents = function (){
		$(_container).delegate(".module,.object,.course,.page", "click", function (e) {
			_onNodeClick(this);
			return false;
		});
		return null;
	}; //-> end _initEvents

	/*
	 * Processes the passed el dom element and collapses or expands the child elements with a css class
	 * @member DKI.PlayerTree
	 * @private
	 * @param {HTMLElement} el dom object pointer
	 * @return {Boolean} Always returns true
	 */
	var _onNodeClick = function(el){
		
		var oEl = $(el);
		var node = store.get(el.id)

		
		if(node.nodeType==store.NodeType.page){
			
			if(oEl.hasClass('disabled')){return}
			
			SelectPage(node.page.pageid)
			DKI.PlayerTree.pageClicked(DKI.PlayerTree.pageClicked, node.page.pageid);	
			DKI.FeedbackPanel.menuNavigate()
		}
		else if(node.nodeType==store.NodeType.object && hidePages){
			
			//get first page
			var object = node;
			var pageIdToLoad = null;
			for(var i = object.childKeys.length - 1; i >= 0; i--){
				var subeo = store.get(object.childKeys[i]);
				if(subeo.nodeType == store.NodeType.page && subeo.complete){
					pageIdToLoad = subeo.page.pageid;
					break;
				}
			}			
			if(!pageIdToLoad){				
				pageIdToLoad = store.get(object.childKeys[0]).page_id;
			}
			SelectPage(pageIdToLoad);
			DKI.PlayerTree.pageClicked(DKI.PlayerTree.pageClicked, pageIdToLoad);
			DKI.FeedbackPanel.menuNavigate()
		}
		else{
			oEl.toggleClass('collapse')
			$(oEl.children()[0]).toggleClass('collapse')
		};
				
		return true;
	}; //-> end _onNodeClick
	
	/*
	 * Public Methods
	 */
	
	/**
	 * Initializes the tree at passed dom element based on based course store
	 * @method init
	 * @member DKI.PlayerTree
	 * @param {DKI.PresentationPlayer} player The course player object
	 * @param {String} elementID ID of existing dom element 
	 * @param {DKI.DataStorage} dataStorage object representing the course store
	 * @return	null
	 */
	var InitializeTree = function(player, elementID, dataStorage){
		
		presentationPlayer = player;
		//strings = player.strings;
		if(elementID==null || dataStorage==null || elementID==undefined || dataStorage==undefined){
			//throw {'Missing required parameters'};
			return
		};
		
		// set the global scopped variables 
		_container = $("#" + elementID);
		_container.addClass("dki-PlayerTree");
		
		// where datastore is a DKI.courseStore
		store = dataStorage;
		
		// called the private methods 
		_renderCourseTree();
		_initEvents();
		return null
	}; //-> end InitalizeTree

	/**
	 * Sets the complete status icon based on the passed object type and id
	 * @method setComplete
	 * @member DKI.PlayerTree
	 * @param {Object} config
	 * @param {String} config.type see exposed nodeType
	 * @param {String} config.id id of object
	 * @return null
	 */
	var SetComplete = function(config){
		// get the element of the passed type id  and set the status to complete
		var node=$('#'+config.type+config.id+'link');
		node.removeClass("unstarted");
		node.removeClass("started");
		node.addClass("finished");
		
		// we only EVER need to deal with nodes of type page for the trickle up
		if(config.type==store.NodeType.page){
		var page = store.page.get(config.type+config.id)
			setUIState(
				store.module.get(
					setUIState(store.object.get(page.parentId))	// object
				)
			)
			setUIState(store.course.get())
		}
		return;
 
		/*
		 * applies the appropriate styles to the node, returns the parentId as 
		 * a string
		 */
		function setUIState(node){
			var el=$($('#'+node.key).children()[0]);
			el.removeClass('unstarted').removeClass('finished').removeClass('started')
			el.addClass(node.complete ? 'finished':'started')
			return node.parentId
		};
	}; //-> end SetComplete
	
	
	/**
	 * Selects the passed page id ensures any other page id is not selected and expands parent nodes
	 * @method selectPage
	 * @member DKI.PlayerTree
	 * @param {Number} id page id
	 * @return null
	 */
	var SelectPage = function(id){
		var selectedNode = null;
		if (hidePages) {
			var object = store.object.get(store.NodeType.object + id);
			if (!object) {
				object = store.object.getForPage(store.NodeType.page + id);
			}
			selectedNode = $("#" + store.NodeType.object + object.id + "link");			
		}
		else {
			selectedNode = $("#" + store.NodeType.page + id + "link");
		}
		var outline = $("#outlineContent");
		var root = $(".treeNode.course", outline);
		//var parentObject = selectedNode.attr("data-parentid");
		
		// make sure no other page node is selected
		$("a.selected", _container).each(function (i) {
			$(this).removeClass("selected");
		});
		
		// select the passed page
		selectedNode.addClass("selected");
		selectedNode.parent().removeClass("disabled");
		
		// ensure we scroll to the node so that it is visible
		scrollToSelected();
		
		// we also need to bold the parent object node so remove the active class then apply to the current
		$("div.object a", _container).each(function (i) {
			$(this).removeClass("active");
		});
		$($('#'+store.NodeType.page+id).parent().children()[0]).addClass('active')
		
		// move up the dom tree until no more parents and ensure they are
		// expanded		
		var pNode=selectedNode.parent()
		while(pNode!=null){
			if(pNode.hasClass('treeNode')){
				pNode.removeClass('collapse')
				$(pNode.children()[0]).removeClass('collapse')
				pNode=pNode.parent()
			}else{
				pNode=null
			}
		};
		return null;
	}; //-> end SelectPage

	/**
	 * Scrolls to selected tree node
	 * @method scrollToSelected
	 * @member DKI.PlayerTree
	 */
	var scrollToSelected = function () {
		var outline = $(document.getElementById("outlineContent"));
		var selectedNode = $("a.selected", outline);
		if(selectedNode.length){
			var root = $(".treeNode.course", outline);

			//We can't use the position() method, as it changes based on scroll position.
			//So we calculate the top of the outline and the selected node based on the document, and
			//scroll by the difference
			outline.scrollTop(selectedNode.offset().top - root.offset().top);
		}
	};
	
		
	return {
		init				: InitializeTree,
		scrollToSelected	: scrollToSelected,
		setComplete			: SetComplete,
		selectPage			: SelectPage,
		setCourse			: InitializeTree,
		
		
		// empty event binding for menu
		pageClicked			: null		
	};
		
}(); //-> end PlayerTree
