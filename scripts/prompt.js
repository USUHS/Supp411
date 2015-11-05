/* global playerStrings */
var DKI;
if (!DKI) {
	DKI = {};
}

/**
 * Replaces the window.prompt function.  However, since this doesn't block, a
 * callback function must be supplied.  Renders a custom dialog with a text input, 
 * 'OK' and 'Cancel' buttons
 * @method DKI.prompt
 * @param {String} message The message to display
 * @param {Function} callback The callback function.  ex.
 * @param {Boolean} callback.result 
 * True if 'OK' was clicked, false if 'Cancel' was clicked
 * @param {String} callback.input
 * Whatever was entered by the user
 * @param {Object} context The object that should be 'this' in the callback 
 * function
 */
 
DKI.prompt = function (message, callback, context) {
	//Hack, we shoudl write a dialog module with classes for alert, etc.
	//Load strings if available
	var labelOK = (playerStrings && playerStrings.buttonLabelOK) ? playerStrings.buttonLabelOK : "OK";
	var labelCancel = (playerStrings && playerStrings.buttonLabelCancel) ? playerStrings.buttonLabelCancel : "Cancel";
	var labelClose = (playerStrings && playerStrings.buttonLabelClose) ? playerStrings.buttonLabelClose : "Close";
	
	var container;
	var inputBox;
	var okButton;
	var cancelButton;
	var modalMask;

	var buttonClicked = function(e) {
		var result = false;
		if (e.target === okButton) {
			result = true;
		}

		callback.call(context, result, inputBox.value);

		destroy();

		return false;
	};

	var show = function () {
		$(container).removeClass("hidden");
		$(modalMask).removeClass("hidden");
		inputBox.focus();
	};

	var render = function () {
		var messageSpan = document.createElement("span");
		var innerContainer = document.createElement("div");
		var buttonContainer = document.createElement("div");

		modalMask = document.createElement("div");
		inputBox = document.createElement("input");
		okButton = document.createElement("a");
		cancelButton = document.createElement("a");
		container = document.createElement("div");
		messageSpan.innerHTML = message;
		okButton.innerHTML = labelOK;
		cancelButton.innerHTML = labelCancel;
		inputBox.type = "text";

		inputBox.tabIndex = "0";
		okButton.tabIndex = "0";
		cancelButton.tabIndex = "0";

		okButton.className = "dkiDialogButton";
		cancelButton.className = "dkiDialogButton";
		messageSpan.className = "dkiDialogMessage";
		innerContainer.className = "dkiDialogBody";
		inputBox.className = "dkiDialogInput";
		buttonContainer.className = "dkiDialogButtons";
		modalMask.className = "dkiDialogMask hidden";

		buttonContainer.appendChild(cancelButton);
		buttonContainer.appendChild(okButton);

		innerContainer.appendChild(messageSpan);
		innerContainer.appendChild(inputBox);
		innerContainer.appendChild(buttonContainer);

		container.className = "dkiPrompt feedbackWrapper ui-draggable hidden";
		$(container).delegate(".dkiDialogButton", settings.clickEvent, buttonClicked);

		container.appendChild(innerContainer);

		document.body.appendChild(container);
		document.body.appendChild(modalMask);
		if (window.getComputedStyle) {
			window.getComputedStyle(container).getPropertyValue("top");
		}

		show();
	};

	var destroy = function () {
		$(container).undelegate();
		document.body.removeChild(container);
		document.body.removeChild(modalMask);
	};

	if (!context) {
		context = window;
	}

	render();
};

