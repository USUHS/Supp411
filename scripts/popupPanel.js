/* globals contentApi: false */
/**
 * Singleton representing the general purpose modal UI in the 
 * Claro course player
 * @singleton
 * @class
 */
DKI.PopupPanel = (function () {
	var showing = false;
	var defaultConfig = {
		html: "",
		autoFocus: false,
		modal: true,
		returnFocus: null,
		title: ""
	};
	var config = {};
	var box = null;
	
	
	var Public = {
		/**
		 * Shows the modal
		 * @member DKI.Modal
		 * @param {Object} cfg
		 * @param {String} [cfg.method = "GET]
		 * @param {String} [cfg.display = "modal"]
		 * @param {String} [cfg.name = "modalWindowName"]
		 */
		show: function (cfg) {
			if (cfg) {
				config = (DKI.applyIf(cfg, defaultConfig));
			}
			$.fancybox({
				type: "html",
				content: '<div class="popup-content" tabIndex="0">' + config.html + '</div>',
				title: config.title != ""? config.title : null,
				tpl: {
					"wrap": '<div class="fancybox-wrap"><div class="fancybox-skin"><div class="fancybox-outer"><div class="fancybox-inner"></div></div></div></div>',
					"closeBtn": '<a title="' + playerStrings.buttonLabelClose + '" class="fancybox-item fancybox-close" href="javascript:;"></a>'
				},
				modal: config.modal,
				autoCenter: false,
				autoResize: false,
				helpers:{
					title: {
						position: "top",
						type: "inside"
					}
				},
				beforeShow: function(){
					box = this;
					if(!config.modal){
						$(".fancybox-overlay").css("background-image", "none");
					}
					
					this.wrap.draggable({
						handle: '.fancybox-title'
					});
					this.wrap.resizable({
						handles: "se",
						alsoResize: ".fancybox-inner"
					});

				},
				afterShow: function(){
					var titleEl = box.wrap.find(".fancybox-title");
					var closeEl = box.wrap.find(".fancybox-close");
					box.outer.before(titleEl.detach());
					titleEl.after(closeEl.detach());
					titleEl.attr("tabindex", 0);
					if(config.autoFocus){				
						box.wrap.find(".popup-content")[0].focus();
					}

					$('.fancybox-title').css('cursor', 'pointer');
					$(window).unbind('resize.fb'); // to ensure that fancybox doesn't try to center the popup as it is being resized
				},
				afterClose: function(){
					if(config.returnFocus){
						config.returnFocus.focus();
					}
					box = null;
				}
			});		
			
			showing = true;
		},
		/**
		 * Hides the modal
		 * @member DKI.Modal
		 */
		hide: function (forceClose) {
			if(box){
				box.close(forceClose);
			}
			showing = false;
		}
	};

	var hideNow = function(){
		Public.hide(true);
	};
	$(document).on(DKI.ContentPage.events.started, hideNow);
	$(document).on(DKI.EndModule.events.started, hideNow);
	$(document).on(DKI.EndCourse.events.started, hideNow);
	$(document).on(DKI.EndTest.events.started, hideNow);	

	return Public;
}());
