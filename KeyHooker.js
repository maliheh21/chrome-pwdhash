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

var ComplexKeyHooker = (function () {
	var console = NullConsole;
	
	var Self = function (field) {
		this.value = '';
		this.charmap = {};
		this.i = 65;
		this.intercept = function() {
			field.addEventListener('keydown', this, true);
			field.addEventListener('keyup', this, true);
			field.addEventListener('keypress', this, true);
		};
		this.stop = function() {
			field.removeEventListener('keydown', this, true);
			field.removeEventListener('keyup', this, true);
			field.removeEventListener('keypress', this, true);
		};
		this.mask = function (c) {
		},
		this.handleEvent = function(e) {
			if (e.generatedByKeyHooker) {
				console.log('intercept a generatedByKeyHooker');
				e.keyCode = 97;
				e.which = 97;
				console.dir(e);
				//~ console.log(String.fromCharCode(e.charCode));
				return;
			}
			
			if((e.type == 'keydown' || e.type == 'keyup') &&
				e.keyCode >= e.DOM_VK_0 && e.keyCode <= e.DOM_VK_DIVIDE) {
				e.stopPropagation();   // Don't let user JavaScript see this event
			}
			
			if(e.type == 'keypress' || e.keyCode == 0) {
				var c = String.fromCharCode(e.charCode);
				var m = String.fromCharCode(this.i);
				this.i += 1;
				this.charmap[m] = c;
				this.value += c;
				console.log('intercept a keyboard event');
				console.dir(e);
				e.stopPropagation();   // Don't let user JavaScript see this event
				e.preventDefault();    // Do not let the character hit the page
				//~ $(e.target).keypress();
				Self.fire(e.target, this.i); //this.mask(e.charCode));
			}
		};
		this.setValue = function (str) {
			this.value = '';
			return '';
		};
		this.getValue = function () {
			return this.value;
		};
	}
	
	Self.fire = function(target, charCode) {
		// http://dev.w3.org/2006/webapi/DOM-Level-3-Events/html/DOM3-Events.html#events-Events-KeyboardEvent-initKeyboardEvent
		
		// TODO find a solution
		
		/*
			var e = document.createEvent("KeyEvents");
			console.log('rarara');
			e.initKeyEvent("keypress", true, true, window, false, false, false, false, 0, charCode);
			
		var e = document.createEvent("Events");
		e.initEvent("keypress", true, true, window, false, false, false, false, 0, charCode);
		console.dir(e);
		e.generatedByKeyHooker = true;
		target.dispatchEvent(e);
		*/
		/*
		n DOMString typeArg, 
                                       in boolean canBubbleArg, 
                                       in boolean cancelableArg, 
                                       in views::AbstractView viewArg, 
                                       in DOMString keyIdentifierArg, 
                                       in unsigned long keyLocationArg, 
                                       in boolean ctrlKeyArg, 
                                       in boolean shiftKeyArg, 
                                       in boolean altKeyArg, 
                                       in boolean metaKeyArg, 
                                       in boolean altGraphKeyArg);
		*/
		var e = document.createEvent("KeyboardEvents");
		//e.initKeyboardEvent("keypress", true, true, window, false, false, false, false, 0, charCode);
		//e.initKeyboardEvent("keypress", true, true, window);
		e.initKeyboardEvent('keypress', true, true, window, "U+0041");
		//e.charCode = e.keyCode = e.which = charCode;
		console.log('send a keyboard event');
		e.generatedByKeyHooker = true;
		console.dir(e);
		target.dispatchEvent(e);
	};

	return Self;
}) ();

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
		this.setValue = function (str) {
			this.value = '';
			return '';
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
