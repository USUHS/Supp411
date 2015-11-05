var DKI;
if (!DKI) {
	DKI = {};
}



/**
 * Represents a set of tabs & content
 * @class DKI.TabSet
 * @constructor
 * @param {Object} cfg
 * @param {String} cfg.elementID Id of the container element
 * @param {DKI.PresentationPlayer} cfg.player
 */
DKI.TabSet = function (cfg) {
	var elementID = cfg.elementID;
	var clickEvent = cfg.player.settings.clickEvent;
	var that = this;
	this.config = cfg;
	var content = [];
	var contentRef = {};	
	/* Private methods */
	function createTabStrip() {
		that.tabStrip = document.createElement("ul");
		that.tabStrip.id = elementID + "_tabStrip";
		that.tabStrip.role = "tablist";
		$(that.tabStrip).addClass("tabStrip menuTabs");
		if (that.container.childNodes.length > 0) {
			that.container.insertBefore(that.container.firstChild);
		}
		else {
			that.container.appendChild(that.tabStrip);
		}
	};

	/**
	 * Pulls tabs from current DOM
	 * @method collectTabs
	 * @member DKI.TabSet
	 * @private
	 */
	function collectTabs() {
		var childNodes = that.tabStrip.childNodes;
		var contentID;
		var tabContent;
		var tabs = [];
		//Loop through tabs, ensure each has a content div and an ID
		for (var i = 0; i < childNodes.length; i++) {
			if (childNodes[i].tagName === "LI") {
				tabs[tabs.length] = childNodes[i];
				if (!childNodes[i].id) {
					childNodes[i].id = "tab_" + DKI.TabSet.tabCounter;
				}
				contentID = $(childNodes[i]).attr("data-contentid");

				if (contentID === undefined || contentID === null || contentID === "") {
					contentID = childNodes[i].id + "Content";
					childNodes[i].setAttribute("data-contentid", contentID);
				}
				childNodes[i].tabIndex = "0";
				//Setup wai-aria roles
				if (!childNodes[i].role) {
					childNodes[i].role = "tab";	
				}
				if (!childNodes[i]["aria-controls"]) {
					childNodes[i]["aria-controls"] = contentID;
				}
				
				tabContent = $("#" + contentID).addClass("tabContent")[0];

				if (tabContent === null || tabContent === undefined) {
					that.createTabContent(contentID);
				}
				else if (!tabContent.role) {
					tabContent.role = "tabpanel";
				}
				DKI.TabSet.tabCounter += 1;
			}
		}

		if (tabs.length > 0) {
			that.selectTab(tabs[0].id, true);
		}
	};
	/* End private methods */

	/**
	 * The container element
	 * @property {HTMLElement}
	 */
	this.container = document.getElementById(elementID);
	/**
	 * The tabstrip element
	 * @property {HTMLElement}
	 */
	this.tabStrip = $('.tabStrip',this.container)[0];

	if (this.tabStrip == null) {
		createTabStrip();
	}
	
	collectTabs();
	
	this.initEvents();
};

/**
 * Initializes events and handlers
 * @protected
 */
DKI.TabSet.prototype.initEvents = function () {
	var that = this;
	this.tabSelected = "tabSelected";
	$(this.tabStrip).delegate('.tab', clickEvent, function (e) {
		e.stopPropagation();
		if (!$(this).hasClass("disabled")) {
			that.selectTab(this.id);
		}
		return false;
	});
	
};

/**
 * @property {Number}
 * The number of tabs in the tabset
 */
DKI.TabSet.tabCounter = 0;

/**
 * Creates a new tab in the tabset
 * @param {String} label The label to display on the tab
 * @param {String} [id] The id for the new table element. If omitted, a new
 * ID will be generated
 * @returns {Object}
 * @returns {HTMLElement} return.tab
 * The new tab element created
 * @returns {HTMLElement} return.content
 * The tab content element
 */
DKI.TabSet.prototype.createTab = function (label, id) {
	var newTab = document.createElement("li");
	var contentID;
	var returnObject = {tab: newTab};
	newTab.className = "tab";
	newTab.role = "tab";
	newTab.tabIndex = 0;
	if (!label) {
		label = "Tab " + DKI.TabSet.tabCounter;
	}
	newTab.innerHTML = "<a>" + label + "</a>";
	if (id !== null && id !== undefined) {
		newTab.id = id;
	}
	else {
		newTab.id = "tab_" + DKI.TabSet.tabCounter;
	}
	contentID = newTab.id + "Content";
	newTab.setAttribute("data-contentid", contentID);
	newTab["aria-controls"] = contentID;
	this.tabStrip.appendChild(newTab);
	returnObject.content = this.createTabContent(contentID);

	return returnObject;
};

/**
 * Creates a new content element for a tab
 * @protected
 * @param {String} contentID The ID to apply to the new element
 * @returns {HTMLElement} The newly created element
 */
DKI.TabSet.prototype.createTabContent = function (contentID) {
	var content = document.createElement("div");
	content.id = contentID;
	content.role = "tabpanel";
	if (content.classList) {
		content.classList.add("tabContent");
		content.classList.add("innerBlockScroll");
		content.classList.add("hidden");		
	}
	else {
		$(content).addClass("tabContent hidden innerBlockScroll");
	}
	this.container.appendChild(content);

	return content;
};

/**
 * Removes a tab from the tabset
 * @param {String|HTMLElement} tab If a string, the ID of the tab element.
 * Otherwise, the tab element to remove.
 */
DKI.TabSet.prototype.removeTab = function (tab) {
	var tabObject;
	if (typeof(tab) === "string") {
		//Assume this is an ID
		tabObject = document.getElementById(tab);
	}
	else {
		//Assume object was passed
		tabObject = tab;
	}
	if (tabObject) {
		this.tabStrip.removeChild(tabObject);
	}
};

/**
 * Select a tab in the tabset
 * @param {String|HTMLElement} tab If a string, the Id of the tab element.
 * @param {Boolean} preventFocus If true, it will prevent the autofocus
 * Otherwise, the tab element to select
 */
DKI.TabSet.prototype.selectTab = function (tab, preventFocus) {
	var elTab;
	if (typeof(tab) == "string") {
		elTab = $('#'+tab) ;
	}
	else {
		elTab = $(tab);
	}
	
	$(this.tabStrip).children().each(function(){
		$(this).removeClass('selected');
		var contentDiv = $('#' + this.getAttribute("data-contentid")).addClass('hidden');	
		$("*[tabindex]", contentDiv).attr("tabIndex", "-1");

	});
	elTab.addClass('selected');

	var tabContent = $('#' + elTab.attr("data-contentid")).removeClass('hidden');
	var tabableContent = $("*[tabIndex]", tabContent).attr("tabIndex", "0");


	if(!preventFocus && tabableContent.length > 0){
		tabableContent[0].focus();
	}
	//$(this).trigger(this.tabSelected, elTab[0].id);
	//elTab.trigger(this.tabSelected);

	return true;
};

/**
 * Get the currently selected tab
 * @returns {HTMLElement}
 */
DKI.TabSet.prototype.selectedTab = function () {
	if (this.tabStrip.querySelector) {
		return this.tabStrip.querySelector(".selected");
	}
	else {
		return $(".selected", this.tabStrip)[0];
	}
};

/**
 * Hide the tabset
 */
DKI.TabSet.prototype.hide = function () {
	$(this.container).hide();
};

/**
 * Show the tabset
 */
DKI.TabSet.prototype.show = function () {
	$(this.container).show();

};

/**
 * @returns {Boolean} True if the tabset is currently hidden
 */
DKI.TabSet.prototype.isHidden = function () {
	return $(this.container).hasClass('hidden');
};
