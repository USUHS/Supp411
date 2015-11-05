/**
 * Renders a disable layer over teh page
 * @class
 * @constructor
 * @param {Object} cfg
 * @param {String} [cfg.text = ""]
 * @param {Function} [cfg.onClick = function(){}]
 * @param {Boolean} [cfg.showSpinner = false]
 */
DKI.disabler = function(cfg){
	var defaults = {
		text : "", 
		onClick : function(){},
		showSpinner: false
	};
	/**
	 * @property {Object}
	 */
	this.config = cfg;
	DKI.applyIf(this.config, defaults);
	/**
	 * @property {jQuery}
	 */
	this.disabler = $("<div />", {
		"class" :  "disabler"			
	});
	this.disabler.on(settings.clickEvent, $.proxy(function(){
		this.config.onClick(this);
	}, this));
	/**
	 * @property {jQuery}
	 */
	this.text = $("<p />", {
		"class" : "disablerMessage",
		html :  this.config.text
	});
	if(this.config.text != ""){
		this.text.attr("tabindex", "0");
	}
	this.disabler.append(this.text);
	if(this.config.showSpinner){
		this.disabler.addClass("spinner");
	}
	$("body").append(this.disabler);
	return this;
};
/**
 * Display the disabler element
 */
DKI.disabler.prototype.show = function() {
	this.disabler.show();	
	this.text[0].focus();
};
/**
 * Hide the disabler element
 */
DKI.disabler.prototype.hide = function() {
	this.disabler.hide();
};
/**
 * Set text for disabler to display
 * @param {String} text
 */
DKI.disabler.prototype.setText =  function(text) {
	this.config = text;
	this.text.html(text);
};
