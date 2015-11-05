/**
 * Top-level namespace
 * @static
 */
var DKI;
if (!DKI) {
	DKI = {};
}
var idSeed = 0;

/**
 * Copies the properties from the fromObject to the toObject and returns the toObject
 * @member DKI
 * @static
 * @param {Object} toObject The object to modify
 * @param {Object} fromObject The object to copy into toObject
 * @return {Object} The modified object
 */
DKI.apply = function(toObject, fromObject){
	toObject = typeof toObject != "undefined"? toObject: {};
	fromObject = typeof fromObject != "undefined"? fromObject: {};
	for(prop in fromObject){
		toObject[prop]=fromObject[prop]
	}
	return toObject;
}; //-> end apply


/**
 * Copies the properties from the fromObject to the toObject IF the toObject does not contain them and returns the toObject
 * @member DKI
 * @static
 * @param {Object} toObject The object to modify
 * @param {Object} fromObject The object to copy into toObject
 * @return {Object} The modified object
 */
DKI.applyIf = function(toObject,fromObject){
	toObject = typeof toObject != "undefined"? toObject: {};
	fromObject = typeof fromObject != "undefined"? fromObject: {};
	for(prop in fromObject){
		if(toObject[prop]==undefined){
			toObject[prop]=fromObject[prop]
		}
	}
	return toObject;
}; //-> end applyIf

DKI.id = function(){
	while($(idSeed).length > 0){
		idSeed ++;
	}
	return idSeed;
};
/**
 * Determines the root URL of the current window
 * @member DKI
 * @static
 * @return {String} The current window's root
 */
DKI.determineRoot = function () {
	var currentURL = window.location.href;
	var dirOnly = /\/$/;
	if (dirOnly.test(currentURL)) {
		return currentURL
	}
	else {
		return currentURL.replace(/\?.*$/, "").replace(/\w*\.[a-zA-Z]+$/, "");
	}
};
/**
 * Takes in an element and sends back the url to the video embed
 * element
 * @member global
 * @param {elementid} element The video embed elementid
 * @return {string} proper URL or empty string
 */
DKI.getVideoEmbedURL = function(elementid) {
	var element = dataStorage.getElement(elementid);
	if(element.elementtype == "videoembed") {
		if(element.meta2 = "dynamic") {
			if(settings.inPreview){
				var root = DKI.determineRoot().replace("/preview/", "");
				return root + "ajax/element.cfm/" + elementid + "/videoEmbedTemp.html";
			}else  {
				return "assets/elements/" + elementid + "/tempVideoEmbed.html";
			}	
		}
	}
	return "";
}

/**
 * Strips HTML tags from a string
 * @member DKI
 * @static
 * @param {String} String with HTML tags
 * @returns {String} unformatted string
 */
DKI.stripHTML =  function(htmlString) {
	htmlString = htmlString.toString();
	htmlString = htmlString.replace(/<(?:.|\s)*?>/g, "");
	htmlString = htmlString.replace(/\&nbsp\;/g, " ");
	htmlString = htmlString.replace(/\s+/g, " ");
	//Use shadow down to parse out entity names
	htmlString = $("<div>" + htmlString + "</div>").text();
	return htmlString;   
};

/**
 * Returns all the keys in an object
 * @member DKI
 * @static
 * @param {Object} obj
 * @returns {String[]}
 */
DKI.getObjectKeys = function(obj){
	var keys = [];
	for(var key in obj){
	  keys.push(key);
	}
	return keys;
};

/**
 * Determines if something is an object
 * @member DKI
 * @static
 * @param {Object} o
 * @return {Boolean} True if 'o' is an object
 */
DKI.isObject = function(o) {
	return Object.prototype.toString.call(o) == "[object Object]";
}

/**
 * Determines if something is a function
 * @member DKI
 * @static
 * @param {Object} o
 * @return {Boolean} True if 'o' is a function
 */
DKI.isFunction = function(o) {
	return Object.prototype.toString.call(o) == "[object Function]";
}

/**
 * Determines if something is an array
 * @member DKI
 * @static
 * @method isArray
 * @param {Object} a
 * @return {Boolean} True if 'a' is an array
 */
DKI.isArray = function(a) {
	return Object.prototype.toString.call(a) == "[object Array]";
}

/**
 * Create a clone of an object
 * @member DKI
 * @static
 * @method clone
 * @param {Object} obj
 * @param {Boolean} recurse If true, will perform a deep clone
 * @return {Object} A cloned version of 'obj'
 */
DKI.clone = function(obj, recurse) {
	var newObj = null;
	var recurseObjs = typeof recurse == "undefined" ? true : recurse;
	if(DKI.isArray(obj)){
		newObj = [];
		for(var i = 0; i < obj.length; i ++) {
			if(recurseObjs) {
				newObj.push(DKI.clone(obj[i]));
			}
			else {
				newObj.push(obj[i]);
			}
		}
	}	
	else if(DKI.isObject(obj)){
		newObj = {};
		for(var key in obj) {
			var origin = obj[key];
			if(recurseObjs) {
				newObj[key] = DKI.clone(origin);
			}
			else {
				newObj[key] = origin;
			}
		}
	}
	else {
		newObj = obj;
	}
	return newObj;
};

/**
* Returns the scroll top of the player (mostly for responsive courses).
 * @member DKI
 * @static
* @returns {Number}
*/
DKI.scrollTop = function() {
	var scrollTop = null;
	if(settings.courseType == 1 && settings.scrolling) {
		scrollTop = $("#contentFrame div.current.slide").scrollTop();
	}
	else {
		if(dkiUA.ie && dkiUA.ieVersion <= 8) {
			var body = document.body; //IE 'quirks'
			var playerDoc = document.documentElement; //IE with doctype
			playerDoc = (playerDoc.clientHeight)? playerDoc: body;
			scrollTop = playerDoc.scrollTop;
		}
		else {
			scrollTop = window.pageYOffset;
		}
	}
	return scrollTop;
};

/**
* Centers a div in the player. Expected is a jQuery representation of a DOM element
 * @member DKI
 * @static
* @param {jQuery} element The element to center
*/
DKI.centerInPlayer = function(element) {
	var width = element.outerWidth(true);
	var height  = element.outerHeight(true);
	var contentFrame  = $("#contentFrame");
	var courseWidth = contentFrame.width();
	var courseHeight = DKI.courseStore ? DKI.courseStore.course.get().height : DKI.PreviewPlayer.contentFrame.height();
	var top = ((courseHeight - height) /2) + DKI.scrollTop();
	var left = (courseWidth - width) /2;
	element.css("top", top + "px").css("margin-left", left + "px");
};


/**
 * Calculates the position on the screen for the popup element
 * @method calculateCoords
 * @member DKI.glossary
 * @private
 * @param {HTMLElement} targetElement The element that triggered the popup
 * @param {HTMLElement} display The popup element to display
 * @param {Number} offset Distance to offest by
 * @returns {Object} 
 * @returns {Number} return.x
 * @returns {Number} return.y
 */
DKI.calculateCoords = function(targetElement, display, offset) {

	// take the smalller of the two values
	var windowHeight = $(window).height() > $("#contentFrame").height()  ? $("#contentFrame").height() : $(window).height();
		courseWidth =$("#contentFrame").width()
	var headerHeight = $("#headerContainer").height();
	var popupHeight = $(display).outerHeight(),
		popupWidth = $(display).outerWidth(),
		bodyLeftOffset = ($("html").width() - $("body").width()) /2,
		coordinates = {"x" : $(targetElement).offset().left - bodyLeftOffset, "y" : ($(targetElement).offset().top + targetElement.offsetHeight + offset) - $("#contentFrame").offset().top};
	var scrollTop = DKI.scrollTop();
	if(coordinates.x + popupWidth > courseWidth) {
		coordinates.x = courseWidth - (popupWidth + 20);
	}
	var maxHeightView = windowHeight + scrollTop - headerHeight;
	if(settings.courseType == 1) {
		maxHeightView = settings.courseHeight;
	}
	if(coordinates.y + popupHeight > maxHeightView)  {
		var originalY = coordinates.y;
		coordinates.y = coordinates.y - popupHeight - $(targetElement).outerHeight() - (offset);

		if(coordinates.y < 0) {
			coordinates.y = windowHeight - headerHeight - popupHeight;
		}
	}
	coordinates.y = (coordinates.y < 0) ? 0 : coordinates.y;

	return coordinates;
}

DKI.setNS = function(prop, obj, value) {
	if (typeof prop === "string"){
		prop = prop.split(".");
	}
	if (prop.length > 1) {
		var e = prop.shift();
		DKI.setNS(prop, obj[e] =
		Object.prototype.toString.call(obj[e]) === "[object Object]"
		? obj[e]
		: {},
		value);
	} 
	else{
		obj[prop[0]] = value;
	}
};