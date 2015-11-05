(function($){
	/**
	 * Disables the jquery Element
	 * @param {Boolean} If set to true, disables all children elements
	 */
	var disable = function (cascade) {		
		var el = $(this);
		el.prop("disabled", true);
		el.addClass("disabled-element");
		if(cascade) {
			el.find("*").prop("disabled", true);
		}
		return el;
	};

	/**
	 * Enables the domElement
	 * @param {Boolean} If set to true, enables all children elements
	 */
	var enable = function (cascade) {		
		var el = $(this);
		el.prop("disabled", false);
		el.removeClass("disabled-element");
		if(cascade) {
			el.find("*").prop("disabled", false);
		}
		return el;
	};

	/**
	 * Determines if the element is disabled 
	 */
	var isDisabled = function () {
		var el = $(this);
		return el.hasClass("disabled-element") || el.prop("disabled") || el.hasClass("submit-disabled");
	};

	var value = function (newValue) {		
		var el = $(this);
		if (newValue !== undefined && newValue !== null) {
			return el.val(newValue);
		}
		else {
			return el.val();
		}
	};

	var checked = function (checked) {
		var el = $(this);
		if ($.type(checked) == "boolean") {
			el.prop("checked", checked);
		}
		else {
			return el.prop("checked");
		}
	};

	var data = function(property, value, silent){		
		var result = null;
		var attributeValue = null;

		if(value === undefined){			
			result = this.data_super.apply(this, arguments);
			attributeValue = this.attr("data-" + property);
			//if the dom attribute is there, and it has different data, sync jquery
			if(attributeValue !== undefined && attributeValue != result.toString()){
				//cast it if we can.
				attributeValue = attributeValue === "true" ? true :
					attributeValue === "false" ? false :
					attributeValue === "null" ? null :
					// Only convert to a number if it doesn't change the string
					+attributeValue + "" === attributeValue ? +attributeValue :
					attributeValue;
				this.data_super.call(this, property, attributeValue);
				result = attributeValue;
			}			
		}
		else{
			attributeValue = this.data_super.call(this, property);
			result = this.data_super.apply(this, arguments);

			//if there's a DOMAttribute for this property, set it to sync.
			if(this.attr("data-" + property) !== undefined && $.type(value) != "function" && $.type(value) != "object" && $.type(value) != "array"){
				this.attr("data-" + property, value);
			}
			if(!silent){
				this.trigger("changeData", {
					property: property, 
					oldValue: attributeValue,
					newValue: value
				});
			}
		}		
		return result;
	};
	var centerInWindow = function () {
		this.css("position","absolute");
		this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) + $(window).scrollTop()) + "px");
		this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) + $(window).scrollLeft()) + "px");
		return this;
	}

	$.fn.extend({
		disable: disable,
		enable: enable,
		isDisabled: isDisabled,
		checked: checked,
		value: value,
		style: $.fn.css,
		data: data,
		data_super: $.fn.data,
		centerInWindow: centerInWindow
	});	
})(jQuery);
