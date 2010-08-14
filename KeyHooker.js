/*
  * File : KeyHooker.js
  * Author : Christophe Liou Kee On
  * Created on : 06/02/2010
  
    License :
    
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
    
    Description :
    
    KeyHooker help to intercept keyboard event.
*
*/

var KeyHooker = (function () {

const VK_RETURN = 13;
const VK_BACKSPACE = 8;
const VK_NUM_0 = 48;
const VK_DIVIDE = 111;

var KBListeners = {
	listeners: {},
	i: -1,
	addListener: function (handle) {
		this.i++;
		this.listeners[this.i] = handle;
		return this.i;
	},
	removeListener: function (i) {
		delete this.listeners[i];
	},
};
var KBListenerHandler = function (e) {
	for (var i in KBListeners.listeners) {
		KBListeners.listeners[i].handleEvent(e);
	}
};

window.addEventListener('keydown', KBListenerHandler, true);
window.addEventListener('keyup', KBListenerHandler, true);
window.addEventListener('keypress', KBListenerHandler, true);

var ComplexKeyHooker = (function () {
	//var console = NullConsole;
	var CHAR_LIST = 'AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn0123456789';
	var idListener;
	var Self = function (field) {
		this.value = '';
		this.charmap = {};
		this.i = 65;
		this.intercept = function() {
			idListener = KBListeners.addListener(this);
		};
		this.stop = function() {
			KBListeners.removeListener(idListener);
		};
		this.mask = function (c) {
			var i;
			do {
				i = Math.floor(Math.random() * CHAR_LIST.length);
			} while (typeof this.charmap[CHAR_LIST[i]] != 'undefined');
			var m = CHAR_LIST[i];
			this.charmap[m] = c;
			this.value += c;
			return m;
		},
		this.handleEvent = function(e) {
			if (e.generatedByKeyHooker) {
				console.log('intercept a generatedByKeyHooker');
				return;
			}
			
			if (e.keyCode == VK_RETURN) {
				return;
			}
			
			if((e.type == 'keydown' || e.type == 'keyup')
					&& VK_NUM_0 <= e.keyCode && e.keyCode <= VK_DIVIDE)
			{
				console.log('[PwdHash] ' + e.type + ': ' + e.keyCode + ' ' + String.fromCharCode(e.keyCode));
				e.stopImmediatePropagation();   // Don't let user JavaScript see this event
			}
			
			if(e.type == 'keypress' || e.keyCode == 0) {
				var c = String.fromCharCode(e.charCode);
				//console.log('intercept a keyboard event');
				//console.dir(e);
				e.stopImmediatePropagation();   // Don't let user JavaScript see this event
				e.preventDefault();    // Do not let the character hit the page
				var m = this.mask(c);
				Self.fire(e.target, m);
			}
		};
		this.setHashedPassword = function (str) {
			console.log("setHashPassword: " + str);
			this.value = '';
			field.value = str;
		};
		this.setPassword = function (str) {
			console.log("setPassword: " + str);
			this.value = '';
			field.value = '';
			this.charmap = {};
			for (var i = 0; i < str.length; i += 1) {
				var m = this.mask(str[i]);
				Self.fire(field, m);
			}
		};
		this.getValue = function () {
			if (this.value == '') {
				return field.value;
			}
			
			var res = '';
			for (var i = 0; i < field.value.length; i += 1) {
				res += this.charmap[field.value[i]];
			}
			//console.log("Field: " + field.value);
			//console.log("Password: " + res);
			return res;
		};
	}
	
	Self.fire = function(target, str) {
		// DOM 3 keyboard event doc : http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#events-Events-KeyboardEvent-initKeyboardEvent
		// Solution found : http://stackoverflow.com/questions/345454/how-can-i-generate-a-keypress-event-in-safari-with-javascript
		
		var eventObject = document.createEvent('TextEvent');
		eventObject.initTextEvent('textInput', true, true, null, str);
		eventObject.generatedByKeyHooker = true;
		target.dispatchEvent(eventObject);
	};

	return Self;
}) ();

return ComplexKeyHooker;

var SimpleKeyHooker = (function () {
	var console = NullConsole;
	
	var Self = function (field) {
		this.value = '';
		this.intercept = function() {
			field.addEventListener('keydown', this, true);
			field.addEventListener('keyup', this, true);
			field.addEventListener('keypress', this, true);
			console.log('intercept');
		};
		this.stop = function() {
			field.removeEventListener('keydown', this, true);
			field.removeEventListener('keyup', this, true);
			field.removeEventListener('keypress', this, true);
			console.log('stop');
		};
		this.handleEvent = function(e) {
			console.log(e.type);
			if (e.generatedByKeyHooker || e.keyCode == VK_RETURN) {
				return;
			}
			
			if (e.type == 'keyup' && e.keyCode == VK_BACKSPACE) {
				this.value = '';
			}
			
			if((e.type == 'keydown' || e.type == 'keyup') &&
				e.keyCode >= e.DOM_VK_0 && e.keyCode <= e.DOM_VK_DIVIDE) {
				e.stopPropagation();   // Don't let user JavaScript see this event
			}
			
			if(e.type == 'keypress' || e.keyCode == 0) {
				var c = String.fromCharCode(e.charCode);
				this.value += c;
				e.stopPropagation();   // Don't let user JavaScript see this event
				e.preventDefault();    // Do not let the character hit the page
			}
		};
		this.setHashedPassword = function (str) {
			field.value = str;
		};
		this.setPassword = function (str) {
			field.value = '';
		};
		this.getValue = function () {
			return this.value;
		};
	}
	
	Self.fire = function(target, charCode) {};

	return Self;
}) ();

return SimpleKeyHooker;

})();
