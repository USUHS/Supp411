/**
 * DKI.uri namespace
 * @extends DKI
 * @class uri
 * @singleton
 */
DKI.uri = DKI.apply({}, {

	/**
	 * Represents an error where a complex value tried to be encoded in URI
	 * query syntax.
	 *
	 * @param {any} v The value that was trying to be encoded
	 */
	ComplexValueError: function() {
		var constructor = function(v) {
			this.value = v;
			this.name = 'ComplexValueError';
			this.message = 'Could not encode complex value';
		};
		DKI.apply(constructor.prototype, {
			toString: function() {
				return [name, ': ', message, ' ', value].join('');
			}
		});
		return constructor;
	}(),

	/**
	 * Encodes a JavaScript object in URI query syntax.
	 *
	 * Important, you cannot encode complex values and data structures
	 * with this method.
	 *
	 * @param {Object} o The object to be encoded
	 */
	encode: function(o) {
		var output = [];

		DKI.iterate(o, function(k, v) {
			if (DKI.isString(v)) {
				// Strings are a special case since they might contain
				// special characters
				this.output.push(encodeURIComponent(k) + '=' + encodeURIComponent(v));
			}
			else if (DKI.isDate(v)) {
				this.output.push(encodeURIComponent(k) + '=' + encodeURIComponent(v.toString()));
			}
			else if (DKI.isPrimitive(v)) {
				// Number or Boolean
				this.output.push(encodeURIComponent(k) + '=' + v.toString());
			}
			else {
				// Cannot encode complex values!
				throw new DKI.uri.ComplexValueError(v);
			}
		}, {output: output});

		return output.join('&');
	},
	decode: function(encodedString) {
		var returnObj = {};
		var pairs = encodedString.split('&');
		var pairLength = pairs.length;
		var i;
		var vals;
		for (i = 0; i < pairLength; i += 1) {
			if (/=/.test(pairs[i])) {
				vals = pairs[i].split('=');
				//Don't add an undefined key
				returnObj[vals[0]] = vals[1];
			}
		}

		return returnObj;
	},
	decodeCurrentLocation: function () {
		return this.decode(window.location.search.replace(/^\?/, ''));
	}

});
