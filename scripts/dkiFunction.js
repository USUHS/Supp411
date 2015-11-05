if (!DKI.func) {
	DKI.func = {};
}

DKI.func.debounce = function (func, threshold, execAsap) {
	/*
	 * The function was created by John Hahn, at http://unscriptable.com/index.php/2009/03/20/debouncing-javascript-methods/
	 */
    var timeout;

    return function debounced () {
        var obj = this, args = Array.prototype.slice.call(arguments);
		var delayed = function () {
            if (!execAsap)
                func.apply(obj, args);
            timeout = null;
		};

        if (timeout)
            clearTimeout(timeout);
        else if (execAsap)
            func.apply(obj, args);

        timeout = setTimeout(delayed, threshold);
    };
};

DKI.func.bind = function(func, thisArg) {
	if (func.prototype.bind) {
		return func.bind(thisArg);
	}
	else {
		return function () {
			func.apply(thisArg, Array.prototype.slice.call(arguments));
		};
	}
};
