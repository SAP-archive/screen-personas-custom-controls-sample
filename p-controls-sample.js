//========== RENDERING FRAMEWORK =========
var SPACE = ' ';

var HTML_TAG = 'html';
var HEAD_TAG = 'head';
var BODY_TAG = 'body';
var SCRIPT_TAG = 'script';
var INPUT_TAG = 'input';

function getStartTag (tagName, attrs) {
	var tag = '<' + tagName;
	if (Array.isArray(attrs)) {
		var outAttrs = [];
		for (var i = 0; i < attrs.length; i++) {
			var attr = attrs[i];
			outAttrs.push(attr.k + '=' + attr.v);
		}
		tag += SPACE + outAttrs.join(SPACE);
	}
	return tag + '>';
}

function getEndTag (tagName) {
	return '</' + tagName + '>';
}

function getAttrObject (key, value) {
	return {k: key, v: value};
}

function wrap (tagName, children) {
	if (!Array.isArray(children)) {
		children = [children];
	}
	return getStartTag(tagName) + children.join('') + getEndTag(tagName);
}

function getInputTag (id, type, value) {
	var attrs = [getAttrObject('id', id), getAttrObject('type', type)];
	if (value) {
		//TODO validate
		attrs.push(getAttrObject('value', value))
	}
	return getStartTag(INPUT_TAG, attrs);
}

function getScript () {
	var code = [];
	for (var i = 0; i < arguments.length; i++) {
		if (typeof arguments[i] === 'function') {
			code.push(arguments[i].toString());
		} else {
			code.push(arguments[i]);
		}
	}
	return wrap(SCRIPT_TAG, code.join(';'));
}

//========== DATE PICKER CONTROL =========

function getDatePicker(iFrameId) {

	function renderDatePicker (date) {
		var getFrameIdFn = 'function getFrameId () {return "' + iFrameId + '"}';

		function getEventObject(eventName, params) {
			return {
				id: getFrameId(),
				eventName: eventName,
				params: params
			};
		}
		function emitEvent(eventName, params) {
			window.parent.postMessage(getEventObject(eventName, params), "*");
		}

		function onIFrameLoad (event) {
			var input = document.getElementById("date");
			input.addEventListener("change",
				function (event) {
					emitEvent("change", {value: input.value});
			});
		}
		var iFrameScript = getScript(getFrameIdFn, getEventObject, emitEvent, onIFrameLoad, 'window.addEventListener("load", onIFrameLoad)');
		var inputTag = getInputTag('date', 'date', date);
		var datePickerHtml = wrap(HTML_TAG, [
			wrap(HEAD_TAG, iFrameScript),
			wrap(BODY_TAG, inputTag)
		]);
		console.log(datePickerHtml);
		return datePickerHtml;
	}

	function setDate (date) {
		console.log('new date set', date)
		iFrame.content = renderDatePicker(date);
	}

	function onDateChange (data) {
		var newDate = data.value;
		setDate(newDate);
		console.log(listeners);
		for (var i = 0; i < listeners.length; i++) {
			listeners[i].call(null, newDate);
		}
	}

	EventListener.addEventListener(iFrameId, 'change', onDateChange, null);

	function addEventListener (fn) {
		listeners.push(fn);
	}

	function destroy () {
		listeners = [];
	}
	
	var iFrame = session.findById(iFrameId);
	iFrame.content = renderDatePicker();
	var listeners = [];
	return {
		setDate: setDate,
		onChange: addEventListener,
		destroy: destroy
	}
}

var EventListener = (function () {

	function onMessage (event) {
		var data = event.data;
		var id = data.id;
		var eventName = data.eventName;
		if (listeners.hasOwnProperty(id) && listeners[id].events.hasOwnProperty(eventName)) {
			var listener = listeners[id].events[eventName];
			listener.fn.call(listener.handler, data.params);
		} 
	}

	function addEventListener (id, eventName, fn, handler) {
		if (!listeners.hasOwnProperty(id)) {
			listeners[id] = {
				id: id,
				events: {}
			};
		}
		listeners[id].events[eventName] = {
			fn: fn,
			handler: handler
		};
	}

	function removeEventListener (id, eventName) {
		if (listeners.hasOwnProperty(id) && listeners[id].events.hasOwnProperty(eventName)) {
			listeners[id].events[eventName] = null;
			delete listeners[id].events[eventName];
		}
	}

	var listeners = null;
	function init () {
		window.addEventListener('message', onMessage);
		listeners = {};
	}
	
	init();

	return {
		addEventListener: addEventListener,
		removeEventListener: removeEventListener
	};
})();

var iFrameId = 'wnd[0]/usr/htmlViewerPersonas_1456789270537';
var iFrameId2 = 'wnd[0]/usr/htmlViewerPersonas_1456871786050';
var datePicker = getDatePicker(iFrameId);
var datePicker2 = getDatePicker(iFrameId2);
datePicker.setDate(session.findById("wnd[0]/usr/txtRF05L-BELNR").text);
datePicker2.setDate('2016-03-03');

datePicker.onChange(
	function (newValue) {
		var date = newValue;
		console.log('doc # outside', date);
		session.findById("wnd[0]/usr/txtRF05L-BELNR").text = date;
	}
);

datePicker2.onChange(
	function (newValue) {
		var date = newValue;
		console.log('company code outside', date);
		session.findById("wnd[0]/usr/ctxtRF05L-BUKRS").text = date;
	}
);