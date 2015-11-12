!function() {

	var state = {
		audio: true
	};

	var apply = function(dest, src) {
		for (var prop in src) {
			dest[prop] = src[prop];
		}
		return dest;
	};

	var applyIf = function(dest, src) {
		for (var prop in src) {
			if (typeof dest[prop] === 'undefined') {
				dest[prop] = src[prop];
			}
		}
		return dest;
	};

	var Init = {
		restructureButtons: function() {
			// Remove interior spans before detachment
			$('#moreButtons .navButton span').remove();
			$('#navigationButtons a span').remove();

			// Detach menu and exit
			var moreButtons = $('#moreButtons'),
				exitBtn = $('#exitButton').detach(),
				menuBtn = $('#menuButton').detach(),
				dropdownButtons = $('#audioButton,#replayButton,#transcriptButton, #glossaryButton, #resourceButton').detach(),
				navButtons = $('#forwardButton,#backButton'),
				ddBtn,
				dropdown;

			// Reattach menu and exit
			moreButtons.append(exitBtn);
			moreButtons.append(menuBtn);

			// Replace Menu and Exit innards
			$('span', exitBtn).remove();
			exitBtn.append([
				'<span class="button-left"></span>',
				'<span class="button-middle">',
					'<span class="button-label">',
						'Exit',
					'</span>',
				'</span>',
				'<span class="button-right"></span>'
			].join(""));

			$('span', menuBtn).remove();
			menuBtn.append([
				'<span class="button-left"></span>',
				'<span class="button-middle">',
					'<span class="button-label">',
						'Menu',
					'</span>',
				'</span>',
				'<span class="button-right"></span>'
			].join(""));

			// Create the dropdown element and its toggle
			ddBtn = $([
				'<div id="dropdownButton" class="navButton">',
					'<span class="button-left"></span>',
					'<span class="button-middle">',
						'<span class="button-label">',
						'</span>',
					'</span>',
					'<span class="button-right"></span>',
				'</div>'
			].join(""));
			moreButtons.append(ddBtn);

			dropDown = $('<div id="dropdown" class="hidden"></div>');
			$('body').append(dropDown);

			dropdownButtons.each(function() {
				$(this).append([
					'<div class="button-left"></div>',
					'<div class="button-middle"></div>',
					'<div class="button-right"></div>'
				].join(""));
				$(this).addClass('dropdown-button').removeClass('navButton');
				dropDown.append($(this));
			});

			dropdownButtons.last().addClass('last');

			$('#audioButton .button-middle').text('Audio');
			$('#replayButton .button-middle').text('Replay');
			$('#transcriptButton .button-middle').text('Transcript');

			// Nav buttons
			navButtons.each(function() {
				$(this).append($([
					'<span class="button-left"></span>',
					'<span class="button-middle">',
						'<span class="button-label"></span>',
					'</span>',
					'<span class="button-right"></span>'
				].join("")));
			})
			$("#headerContainer *").css("visibility", "visible");
		},

		bindEvents: function() {
			// DOM Events
			if ($('body').hasClass('mobile')) {
				$('#dropdownButton').on(settings.clickEvent, DropDown.toggle);
				$(document).on('click', DropDown.hide);
				$('.dropdown-button').on(settings.clickEvent, DropDown.hide);
			}
			// Player Events
			contentApi.playerEvent.on('pageLoaded',
				ProgressBar.render);
		}
	};

	var DropDown = {
		toggle: function(e) {
			var dropDown = $('#dropdown');
			var position = $(this).offset();
			dropDown.css({
				left: position.left + "px"
			})
			if (dropDown.hasClass('hidden')) {
				dropDown.removeClass('hidden');
			} else {
				dropDown.addClass('hidden');
			}
		},

		hide: function(e) {
			if ($(e.target).closest('#dropdownButton').length === 0) {
				$('#dropdown').addClass('hidden');
			}
		}
	};

	var ProgressBar = {
		maxWidth : null,
		current  : null,
		total    : null,
		init: function() {
			var progressBar = $([
				'<div id="progressBar">',
				'</div>'
			].join(""));

			$('#navigationButtons').after(progressBar);
			//Progress bar width is percentage based... get the int value the long way and make sure to subtract the sizes of the left and right spans	
			$(window).resize(ProgressBar.resize);

			//Hide Progress Bar for end screens
			$(document).on(DKI.EndModule.events.started, ProgressBar.hide);
			$(document).on(DKI.EndTest.events.started, ProgressBar.hide);
			$(document).on(DKI.EndCourse.events.started, ProgressBar.hide);

		},
		render: function() {
			ProgressBar.current = parseFloat($('#screenCount #currentScreen').text());
			ProgressBar.total = parseFloat($('#screenCount #totalScreens').text());
			var container = $("#progressBar");
			container.html("<div class='tickContainer'></div>");

			var tickContainer = $("div.tickContainer");
			for(var i = 0; i < ProgressBar.current; i++) {
				var tick = $("<div />", {
					"class" : "tick"
				});
				tickContainer.append(tick);
			}
			ProgressBar.setWidths();
			$("#progressBar").css("visibility", "visible");
			$("#progressBar *").css("visibility", "visible");

		},
		resize : function(e) {
			ProgressBar.setWidths();
		},
		setWidths : function() {
			ProgressBar.maxWidth = $("#progressBar").width();
			var barWidth = (ProgressBar.current/ProgressBar.total) * ProgressBar.maxWidth,
				tickWidth  = barWidth/ProgressBar.current - 1
			$("#progressBar div.tick").width(tickWidth);
		},
		hide : function() {
			$("#progressBar").css("visibility", "hidden");
			$("#progressBar *").css("visibility", "hidden");
		}
	};

	var init = function(o) {
		themeRoot = o.themeRoot;
		if ($('body').hasClass('mobile')) {
			Init.restructureButtons();
		}

		ProgressBar.init();
		Init.bindEvents();

		if ($.browser.msie && $.browser.version <= 8) {
			contentApi.playerEvent.on('questionPageLoaded', function() {
				$('.submitButton').css('background-image', 'url(' + themeRoot + '/resources/testing/submitButton.gif)');
			});
		}
	}

	window.Theme = init;
}()
