var DKI;
if (!DKI) {
	DKI = {};
}
DKI.Scene = function () {	
	var Private = {	
		startShowMe: function(){			
			var that = this;
			var disabler = new DKI.disabler({
				text : that.strings.clickToShow, 
				onClick : function(disabler) {
					disabler.hide();
					$(".pageElementsWrapper", that.pageContainer).append(that.narrationElement);
					that.mousePointer.show();
					Public.stepForward.call(that);					
				}
			});
			disabler.show();
		},
		startTryMe: function(){					
			var that = this;
			var disabler = new DKI.disabler({text : that.strings.clickToTry, onClick : function(disabler) {						
				disabler.hide();						
				Public.stepForward.call(that);
				var hotspot = $(".dki-hotspot-element", that.pageContainer);
				hotspot.on("click", function(){
					Public.stepForward.call(that);
				});
				$(".pageElementsWrapper", that.pageContainer).append(that.narrationElement);
			}});
			disabler.show();
		}
	};
	var Public = {		
		start: function () {
			var that = this;
			this.groups.hide();
			this.page.start();			
			if(this.parameters.scene.type == "show"){
				Private.startShowMe.call(that);
			}
			else{
				Private.startTryMe.call(that);	
			}
			
		},
		reset: function (cfg) {
			cfg = DKI.applyIf(cfg, {
				timeout: 0			
			});
			var that = this;
			var resetFn = function(){				
				that.currentGroup = null;
				that.currentGroupIndex = -1;
				if(that.highlightInterval){
					clearInterval(that.highlightInterval);
				}
				cfg.timeout = 0;				
				that.page.reset(cfg);				
			}
			if(cfg.timeout > 0){
				setTimeout(resetFn, cfg.timeout);
			}
			else{
				resetFn();
			}
		},
		onWindowResize: function(){
			this.page.onWindowResize();
		},
		stepForward: function(){
			var that = this;
			if(this.highlightInterval){
				clearInterval(this.highlightInterval);
			}
			if(this.currentGroup){
				this.currentGroup.hide();
			}
			this.currentGroupIndex ++;
			if(this.currentGroupIndex >= this.groups.length){				
				this.currentGroup = null;
				this.currentGroupIndex = -1;
				this.mousePointer.hide();
				contentApi.contentGoNext();
			}
			else{
				this.currentGroup = $(this.groups[this.currentGroupIndex]);
				this.currentGroup.show();
				var hotspot = $(".dki-hotspot-element", this.currentGroup);
				if(this.parameters.scene.type == "try"){
					if(hotspot.length){
						this.highlightInterval = setInterval(function(){
							hotspot.effect("highlight", {}, 1500);						
						}, 3500);
					}
					else{
						Public.stepForward.call(this);
					}
				}
				else{	
					var animateMouse = function(){
						if(hotspot.length){
							this.mousePointer.show();
							var coords = hotspot.position();
							coords.top += (hotspot.height() / 2);
							coords.left += (hotspot.width() / 2);
							this.mousePointer.animate(coords, that.parameters.scene.stepDuration - 1500, function(){
								hotspot.effect("highlight", {color:"#FFCC66"}, 1500);
							});
						}
					}	
					if(!hotspot.length){
						this.mousePointer.hide();
					}					
					var narration = $(".dki-audio-element[data-narration=1] .dki-element-content", this.currentGroup);
					if(narration.length){
						var nextStep = function(event){
							setTimeout(function(){
								Public.stepForward.call(that);
							}, 500);
							narration.off($.jPlayer.event.ended, nextStep);
						};
						var startMouse = function(e){
							animateMouse.call(that);
							narration.off($.jPlayer.event.play, startMouse);
						}
						narration.on($.jPlayer.event.ended, nextStep);
						narration.on($.jPlayer.event.play, startMouse);
					}
					else{
						animateMouse.call(that);
						setTimeout(function(){
							Public.stepForward.call(that);
						}, that.parameters.scene.stepDuration);
					}
				}			
			}
		},
		stepBack: function(){
			if(this.currentGroup){
				this.currentGroup.hide();
			}
			this.currentGroupIndex --;			
			if(this.currentGroupIndex == -1){
				this.currentGroup = null;
				this.currentGroupIndex = -1;
			}
			else{
				this.currentGroup = $(this.groups[this.currentGroupIndex]);
				this.currentGroup.show();
			}
		}
	};
	var component = function (playerObj, contentPage) {
		var that = this;			
		this.player = playerObj;			
		//this.strings = playerObj.strings;
		this.strings = {
			clickToShow: "Click to start the simulation.",
			clickToTry: "Click to try the simulation."
		};		

		this.page = contentPage;
		this.parameters = contentPage.page.parameters;
		//Gotta set up a default for duration for a step thats not narrated
		DKI.applyIf(this.parameters, {
			"scene": {
				"stepDuration": 2500
			}
		});
		this.behaviour = this.player.behaviour;
		this.inReview = this.player.inReview;
		this.settings = this.player.settings;
		this.pageContainer = this.page.pageContainer;
		this.mousePointer = $("<div class='scene-mouse-pointer'></div>");
		$(".pageElementsWrapper", this.pageContainer).append(this.mousePointer);
		
		this.groups = $(".dki-authoring-group", this.pageContainer);		
		this.currentGroup = null;
		this.currentGroupIndex = -1;
		this.highlightInterval = null;
		//case 39751: proxying any of the functions from the page scope that aren't defined here to future proof
		$.each(this.page, function(key){
			if(typeof that[key] == "undefined" && DKI.isFunction(this)){
				that[key] = $.proxy(that.page[key], that.page);
			}
		});
	};

	DKI.applyIf(component.prototype, Public);

	return component;
}();

DKI.Scene.events = {
	finished: "SCENE_FINISHED", 
	started: "SCENE_STARTED"	
};
