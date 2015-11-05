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
			if ($(document.body).hasClass('tablet')) {
				moreButtons.append(ddBtn);
			}
			else{
				moreButtons.before(ddBtn);
			}
			dropDown = $('<div id="dropdown" class="hidden"></div>');
			$('body').append(dropDown);
			if ($(document.body).hasClass('phone')) {
				dropDown.append(exitBtn.addClass('dropdown-button').removeClass('navButton'));
				dropDown.append(menuBtn.addClass('dropdown-button').removeClass('navButton'));
			}
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
			});
			
			if($(document.body).hasClass('tablet')){
				var logo = $('#logo').detach();
				$("#navigationButtons").before(logo);
			}
			
			$("#headerContainer *").css("visibility", "visible");
		},

		bindEvents: function() {
			// DOM Events
			if ($('body').hasClass('mobile')) {
				$('#dropdownButton').on('click', DropDown.toggle);
				$(document).on('click', DropDown.hide);
				$('.dropdown-button').on('click', DropDown.hide);
			}
			// Player Events
			contentApi.playerEvent.on('pageLoaded',
				ProgressBar.render);
		}
	};

	var DropDown = {
		toggle: function(e) {
			var dropDown = $('#dropdown');

			if (dropDown.hasClass('hidden')) {
				dropDown.removeClass('hidden');
			} else {
				dropDown.addClass('hidden');
			}
		},

		hide: function(e) {
			if ($(e.target).closest('#audioButton,#dropdownButton').length === 0) {
				$('#dropdown').addClass('hidden');
			}
		}
	};

	var ProgressBar = {
		maxWidth: null,
		init: function() {
			var progressBar = $([
				'<div id="progressBar">',
					'<div class="background">',
						'<div class="bg-left"></div>',
						'<div class="bg-middle"></div>',
						'<div class="bg-right"></div>',
					'</div>',
					'<div class="scrub-bar"></div>',
					'<div class="ticks"></div>',
				'</div>'
			].join(""));

			if ($('body').hasClass('tablet')) {
				$('#navigationButtons').before(progressBar);
			} else {
				$('#footerContainer').append(progressBar);
			}

			ProgressBar.maxWidth = $('#progressBar .bg-middle').width();
		},
		render: function() {
			var current = parseFloat($('#screenCount #currentScreen').text()),
				total = parseFloat($('#screenCount #totalScreens').text()),
				percentage = (current / total),
				progress = percentage * ProgressBar.maxWidth,
				totalTicks = total - 1,
				tickSize = 1, // Pixel size of the tick marks
				gapWidth = ((ProgressBar.maxWidth - (tickSize * totalTicks)) / total),
				gapRounder = (gapWidth % 1 < 0.5)? 1 : 0,
				ticks = $('#progressBar .ticks'),
				currentGapWidth;

			$('#progressBar .scrub-bar').width(progress);

			// Clear existing ticks
			$('div', ticks).remove();

			// Render gaps and ticks
			for (var i = 0; i < total; i++) {
				currentGapWidth = Math.floor((i % 2 == gapRounder)? gapWidth : gapWidth + 1);

				ticks.append('<div class="gap" style="width:' +
					currentGapWidth + 'px;"></div>');

				if (i < totalTicks) ticks.append('<div class="tick"></div>');
			}
			$("#progressBar").css("visibility", "visible");
			$("#progressBar *").css("visibility", "visible");
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
