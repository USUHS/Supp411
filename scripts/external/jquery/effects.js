(function($){
	$.effects.fly = function(config){
		return this.queue(function(){
			var el = $(this); 
			var affectedStyles = ["position", "top", "bottom", "left", "right"]; 
			var mode = $.effects.setMode(el, config.options.mode || "show");
			var direction = config.options.direction || "left";			
			$.effects.save(el, affectedStyles);
			var position = el.position();
			if (el.css("display") == "none") {
				el.css({
					"visibility": "hidden",
					"display": "block"
				});
				position = el.position();
				el.css({
					"visibility": "inherit",
					"display": "none"
				});
			}	
			var parent = el.parent();	
			if (el.css("position") != "absolute" && el.css("position") != "relative") {
				el.css({
					"position": "absolute",
					"top": position.top + "px",
					"left": position.left + "px"					
				});
			}				
			if(config.options.mode == "show"){
											
				if (direction == "left") {
					el.css("left", 0 - el.width() + "px");							
				}
				else if (direction == "right") {
					el.css("left", $(document).width() + el.width() + "px");
				}
				else if (direction == "up") {
					el.css("top", 0 - el.height() + "px");														
				}
				else if (direction == "down") {
					el.css("top", $(document).height() + el.height() + "px");							
				}
				el.show();
				var duration =  config.duration != undefined ? config.duration : 1000;
				el.animate(position,{
					duration: duration,
					queue: false,
					easing: "linear",
					complete: function(){{
						$.effects.restore(el, affectedStyles);
						config.callback && config.callback.apply(this, arguments);
						el.dequeue();
					}}
				});
			}
			else{
				var animateConfig = {};
				if (direction == "left") {
					animateConfig.left = 0 - el.width();							
				}
				else if (direction == "right") {							
					animateConfig.left = $(document).width() + el.width();
				}
				else if (direction == "up") {
					animateConfig.top = 0 - el.height();												
				}
				else if (direction == "down") {
					animateConfig.top = $(document).height() + el.height();										
				}	
				var duration = config.duration != undefined ? config.duration : 1000;	
				el.animate(animateConfig,{
					duration: duration,
					queue: false,
					easing: "linear",
					complete: function(){{
						el.hide();			
						$.effects.restore(el, affectedStyles);
						config.callback && config.callback.apply(this, arguments);
						el.dequeue()
					}}
				});
			}
		})
	};
	$.effects.move = function(config){		
		return this.queue(function(){			
			var el = $(this); 
			var affectedStyles = ["position", "top", "bottom", "left", "right"]; 
			var to = config.options.to;	
			$.effects.save(el, affectedStyles);
			var position = el.position();
			var parent = el.parent();								
			var height = parent.css("height");
			if (el.css("position") != "absolute" && el.css("position") != "relative") {
				el.css({
					"position": "absolute",
					"top": position.top + "px",
					"left": position.left + "px"					
				});
			}
			var duration =  config.duration != undefined ? config.duration : 800;
			el.show();
			el.animate(to,{
				duration: duration,
				queue: false,
				easing: "linear",
				complete: function(){{
					if (config.options.restore) {
						$.effects.restore(el, affectedStyles);
					}
					config.callback && config.callback.apply(this, arguments);
					el.dequeue();
				}}
			});
		})
	};

	$.effects.resize  =function(config) {
		return this.queue(function() {
			var el = $(this);
			var to = config.options.to;
			var affectedStyles = ["width", "height"];
			$.effects.save(el, affectedStyles);			
			var height = to.height;
			var css = {};
			if(height != ""){
				height += "%";
				css.height = height;
			}
			else{
				css.height = height;
			}
			var width = to.width;
			if(width != ""){
				width += "%";
				css.width = width;
			}
			else{
				css.width = width;
			}
			el.css(css);
			el.dequeue();
		});
	};
	$.effects.fadeTo = function(config){		
		return this.queue(function(){			
			var el = $(this); 			
			var to = config.options.to;				
			var duration =  config.duration != undefined ? config.duration : 800;
			
			el.animate(to,{
				duration: duration,
				queue: false,
				easing: "linear",
				complete: function(){{					
					config.callback && config.callback.apply(this, arguments);
					el.dequeue();
				}}
			});
		})
	};
	$.effects.fadeTo = $.effects.fadeTo;
	$.effects.moveBy = $.effects.move;
	$.effects.moveTo = $.effects.move;
	$.effects.resizeTo = $.effects.resize;
	$.effects.resizeBy = $.effects.resize;
})(jQuery);
