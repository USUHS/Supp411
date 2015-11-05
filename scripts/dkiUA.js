/* exported dkiUA */
/**
 * @class
 * @static
 */
var dkiUA = (function () {
	/**
	 * @property
	 * @member dkiUA
	 */
	var webOS = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var iOS = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var iOSVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var android = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var androidVersion;
	/**
	 * @property
	 * @member dkiUA
	 */
	var blackberry = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var blackberryVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var winPhone = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var webKit = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var windows = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var mac = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var windowsVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var macVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var safari = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var safariVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var mobile = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var ie = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var ieVersion = 0;
	/**
	 * @property
	 * @member dkiUA
	 */
	var chrome = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var firefox = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var firefoxVersion = 0;
	/**
	 * The 'native' player from OnPoint.  Requires content workarounds, so it's important to note
	 * @property
	 * @member dkiUA
	 */
	var cellCast = false;
	/**
	 * @property
	 * @member dkiUA
	 */
	var chromeBook = false;
	
	var cellCastSearch = /CellCast/i;
	var webOSSearch = /webOS/i;
	var iOSSearch = /iphone|ipad|ipod/i;
	var iOSVersionSearch = /OS (\d\_?\d)/i;
	var iOSTabletSearch =  /iPad/i;
	var blackberrySearch = /BlackBerry/i;
	var blackberryVersionSearch = /Version\/(\d\.?\d)/i;
	var androidSearch = /Android/i;
	var androidVersionSearch = /Android (\d\.?\d)/i;
	var androidVersionSearchCellCast = /Android[\/|\d|\.]* *\((\d+\.*\d+)/i;
	var androidVersionSearchCellCast2 = /CellCast[^|]*\|([\d.?]*)\|([^|]*)\|([^|]*)/;
	var androidTabletSearch = /Mobile/i;
	var winPhoneSearch = /Windows Phone OS/i;
	var webKitSearch = /WebKit/i;
	var windowsSearch = /Windows/i;
	var windowsVersionSearch = /NT (\d\.?\d)/i;
	var macSearch = /Mac OS X/i;
	var macVersionSearch = /OS X (\d\.?\d)/i;
	var sarariSearch = /Safari/i;
	var chromeSearch = /Chrome/i;
	var safariVersionSearch = /Version\/([0-9]+)/;
	var ieSearch = /Internet Explorer|ie|IE|Trident/i;
	var ieVersionSearch = /(MSIE |rv:)([0-9]+)/;
	var firefoxSearch = /Firefox/i;
	var firefoxVersionSearch = /Firefox\/([0-9]+)/;
	var cellCastAndroidMatch = null;
	var chromeBookSearch = /CrOs/i;

	var browserProperties = {
		os : "",
		osVersion : "",
		browser : "",
		browserVersion : "",
		platform : ""
	};
	if (cellCastSearch.test(navigator.userAgent)) {
		cellCast = true;
		mobile = true;
	}
	if (webOSSearch.test(navigator.userAgent)) {
		webOS = true;
		webKit = true;
		mobile = true;
		browserProperties.browser = "webkit";
		browserPoperties.os = "webOS";
	}
	else if (iOSSearch.test(navigator.userAgent)) {
		iOS = true;
		iOSVersion = parseFloat(iOSVersionSearch.exec(navigator.userAgent)[1]);
		webKit = true;
		mobile = true;
		browserProperties.browser = "safari";
		browserProperties.os = "ios";
		browserProperties.osVersion = iOSVersion;
		browserProperties.platform = iOSTabletSearch.test(navigator.userAgent) ? "tablet"  : "";
	}
	else if (blackberrySearch.test(navigator.userAgent)) {
		blackberry = true;
		if(blackberryVersionSearch.test(navigator.userAgent)){
			blackberryVersion = parseFloat(blackberryVersionSearch.exec(navigator.userAgent)[1]);
		}
		mobile = true;
	}
	else if (androidSearch.test(navigator.userAgent)) {
		android = true;
		browserProperties.browser = "android";
		browserProperties.os = "android";
		if (!cellCast) {
			androidVersion = parseFloat(androidVersionSearch.exec(navigator.userAgent)[1]);
		}
		else {
			cellCastAndroidMatch = androidVersionSearchCellCast.exec(navigator.userAgent);
			if (cellCastAndroidMatch) {
				//For legacy versions of the CellCast app
				androidVersion = parseFloat(cellCastAndroidMatch[1]);
			}
			else {
				cellCastAndroidMatch = androidVersionSearchCellCast2.exec(navigator.userAgent);
				androidVersion = parseFloat(cellCastAndroidMatch[3]);
			}
		}
		browserProperties.osVersion = androidVersion;
		browserProperties.platform = !androidTabletSearch.test(navigator.userAgent) ? "tablet" : "";
		mobile = true;
	}
	else if (winPhoneSearch.test(navigator.userAgent)) {
		winPhone = true;
		mobile = true;
		browserProperties.browser = "ie";
		browserProperties.os = "windowsPhone";
	}

	if(windowsSearch.test(navigator.userAgent) && !winPhone){
		windows = true;
		windowsVersion = parseFloat(windowsVersionSearch.exec(navigator.userAgent)[1]);
		browserProperties.os = "windows";
		browserProperties.osVersion = windowsVersion;
		browserProperties.platform = "desktop";
	}
	if(macSearch.test(navigator.userAgent) && !iOS){
		mac = true;
		macVersion = parseFloat(macVersionSearch.exec(navigator.userAgent)[1]);
		browserProperties.os = "mac";
		browserProperties.osVersion = macVersion;
		browserProperties.platform = "desktop";
	}

	if(sarariSearch.test(navigator.userAgent) && !chromeSearch.test(navigator.userAgent) && !android){
		safari = true;
		browserProperties.browser = "safari";
		if (safariVersionSearch.test(navigator.userAgent)) {
			safariVersion = parseInt(safariVersionSearch.exec(navigator.userAgent)[1], "10");
			browserProperties.browserVersion = safariVersion;
		}
	}
	if(chromeSearch.test(navigator.userAgent)){
		chrome = true;
		browserProperties.browser = "chrome";
		if(chromeBookSearch.test(navigator.userAgent)){
			chromeBook = true;
			mobile = true;
		}
	}
	if(ieSearch.test(navigator.userAgent)){
		ie = true;
		browserProperties.browser = "ie";
		if (ieVersionSearch.test(navigator.userAgent)) {
			ieVersion = parseInt(ieVersionSearch.exec(navigator.userAgent)[2], "10");
			browserProperties.browserVersion = ieVersion;
		}
	}

	if (webKitSearch.test(navigator.userAgent)) {
		webKit = true;
	}

	if (firefoxSearch.test(navigator.userAgent)) {
		firefox = true;
		browserProperties.browser = "firefox";
		if (firefoxVersionSearch.test(navigator.userAgent)) {
			firefoxVersion = parseInt(firefoxVersionSearch.exec(navigator.userAgent)[1], "10");
			browserProperties.browserVersion = firefoxVersion;
		}
	}
	browserProperties.platform = mobile && browserProperties.platform != "tablet" && !browserProperties.platform != "desktop" ? "smartphone" : browserProperties.platform;


	return {
		webOS: webOS,
		iOS: iOS,
		iOSVersion: iOSVersion,
		blackberry: blackberry,
		blackberryVersion: blackberryVersion,
		android: android,
		androidVersion: androidVersion,
		winPhone: winPhone,
		windows: windows,
		windowsVersion: windowsVersion,
		mac: mac,
		macVersion: macVersion,
		safari: safari,
		safariVersion: safariVersion,
		ie: ie,
		chrome: chrome,
		chromeBook: chromeBook,
		ieVersion: ieVersion,
		firefox: firefox,
		firefoxVersion: firefoxVersion,
		mobile: mobile,
		webKit: webKit,
		touchEnabled: 'ontouchstart' in document.documentElement,
		isIE : function(){
			return (navigator.appVersion.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') !== -1);
		},
		isIE8 : function(){
			return navigator.appVersion.indexOf('MSIE 8')!==-1;
		},
		isIE7 : function(){
			return navigator.appVersion.indexOf('MSIE 7')!==-1;
		},
		isIE6 : function(){
			return navigator.appVersion.indexOf('MSIE 6')!==-1;
		},
		isIE9 : function(){
			return navigator.appVersion.indexOf('MSIE 9')!==-1;
		},
		isIE10 : function(){
			return navigator.appVersion.indexOf('MSIE 10')!==-1;
		},
		isIE11 : function(){
			return (navigator.appVersion.indexOf('MSIE') == -1 && navigator.appVersion.indexOf('Trident/') > 0);
		},
		getUAProperties : function() {
			return browserProperties;
		}

	};
})();
