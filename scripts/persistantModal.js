/* globals contentApi: false */
/**
 * Singleton representing the general purpose modal UI in the 
 * Claro course player
 * @singleton
 * @class
 */
DKI.Modal = (function () {
	var modalWindow;	
	var defaultConfig = {
		method: "GET"
		,display: "modal"
		,name: "modalWindowName"
	};
	var config = {};
	var postForm = null;
	var postTarget = null;
	
	var Private = {
		/**
		 * @member DKI.Modal
		 * @private
		 */
		appendDataToUrl: function (url) {
			var data = Private.getData();
			if (url.match(/\?/) === null) {
				url += "?";
			}
			else {
				url += "&";
			}
			return url + data;
		},		
		/**
		 * @member DKI.Modal
		 * @private
		 */
		getData: function () {
			var data = "courseID=" + contentApi.getCourseID() + "&" +
				"pageID=" + contentApi.getPageID() + "&" +
				"objectID=" + contentApi.getObjectID() + "&" +
				"userID=" + contentApi.getUserID();
			if (typeof config.parameters == "object") {
				for (var key in config.parameters) {
					if (config.parameters.hasOwnProperty(key)) {
						data += "&" + key + "=" + config.parameters[key];
					}
				}
			}
			return data;
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		loadModalGET: function (config) {
			//Case 48214 - Fancy box seems to fail on mobile devices with preload set to true. I guess we'll have to not do that		
			$.fancybox({
				type: "iframe",
				href: Private.appendDataToUrl(config.url),
				iframe : {
					preload : false
				},
				afterShow: function(){
					modalWindow = this;
					modalFrame = this.content;
					if (config.callback) {
						config.callback();
					}
				}
			});
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		loadModalPOST: function (config) {
			Private.postURL(modalFrame.attr("name"));
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		loadWindowGET: function (config) {
			modalWindow = window.open(Private.appendDataToUrl(config.url), config.name);
			modalWindow.focus();
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		loadWindowPOST: function (config) {
			modalWindow = window.open("about:blank", config.name);
			Private.postURL(modalWindow.name);
			modalWindow.focus();
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		postURL: function (target) {
			if (postForm === null) {
				postForm = document.createElement("form");
				postForm.className = "modalPoster";
				postForm.method = "POST";
				body.append(postForm);
			}
			else {
				postForm.innerHTML = "";
			}
			if (target) {
				postTarget = target;
			}
			postForm.target = postTarget;
			postForm.action = config.url;
			postForm.appendChild(Private.buildHiddenInput("courseID", contentApi.getCourseID()));
			postForm.appendChild(Private.buildHiddenInput("userID", contentApi.getUserID()));
			postForm.appendChild(Private.buildHiddenInput("objectID", contentApi.getObjectID()));
			postForm.appendChild(Private.buildHiddenInput("pageID", contentApi.getPageID()));
			if (typeof config.parameters == "object") {
				for (var key in config.parameters) {
					if (config.parameters.hasOwnProperty(key)) {
						postForm.appendChild(Private.buildHiddenInput(key, config.parameters[key]));
					}
				}
			}
			$.fancybox({
				type: "inline",
				content: postForm,
				afterShow: function(){
					modalWindow = this;					
					postForm.submit();
				}
			})			
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		buildHiddenInput: function (name, value) {
			var input = document.createElement("input");
			input.type = "hidden";
			input.name = name;
			input.value = value;

			return input;
		}
	};

	var Handlers = {
		/**
		 * @member DKI.Modal
		 * @private
		 */
		onPageLoaded: function () {
			if (modalOpen && !config.persist) {
				Public.hide();
			}
			else if (modalOpen === true) {
				if (config.method.toUpperCase() === "GET") {
					modalFrame.attr("src", Private.appendDataToUrl(config.url));
				}
				else {
					Private.postURL();
				}
			}
			else if (modalWindow && !modalWindow.closed) {
				if (config.method.toUpperCase() === "GET") {
					Private.loadWindowGET(config);
				}
				else {
					Private.postURL();
				}
			}
			else {
				contentApi.playerEvent.remove("pageLoaded", Handlers.onPageLoaded);
			}
		},
		/**
		 * @member DKI.Modal
		 * @private
		 */
		onPostCompleteModal: function (jqXHR) {
			modalFrame.on("load.modalPost", function () {
				modalFrame[0].contentWindow.document.write(jqXHR.responseText);
			});
			modalFrame.attr("src", "about:blank");
		}
		/**
		 * @member DKI.Modal
		 * @private
		 */
		,onPostCompleteWindow: function (jqXHR) {
			modalWindow.document.write(jqXHR.responseText);
		}
	};
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

			if (config.display.toLowerCase() === "modal") {				
				if (config.method.toUpperCase() == "GET") {
					Private.loadModalGET(config);
				}
				else {
					Private.loadModalPOST(config);
				}
			}
			else {
				if (config.method.toUpperCase() == "GET") {
					Private.loadWindowGET(config);
				}
				else {
					Private.loadWindowPOST(config);
				}
			}

			if (config.persist === true) {
				contentApi.playerEvent.on("pageLoaded", Handlers.onPageLoaded);
			}
		},
		/**
		 * Hides the modal
		 * @member DKI.Modal
		 */
		hide: function () {
			modalWindow.close();
		}
	};
	
	return Public;
}());
