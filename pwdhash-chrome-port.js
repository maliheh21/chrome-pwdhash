/*
  * File : pwdhash-chrome-port.js
  * Author : Christophe Liou Kee On
  * Created on : 01/09/2009
  
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
    
*
*/

var NullFunction = function(){};
var NullConsole = {dir: function(){}, log: function(){}};

var AlternativeDomain = (function () {
	var console = NullConsole;
	var domain = null;
	var domains = {};
	
	//~ localStorage['domains'] = JSON.stringify({'google.com':'toto.fr'});
	if (localStorage['domains'] != undefined) {
		try {
			domains = localStorage['domains'];
			domains = JSON.parse(domains);
		} catch (e) {
			console.log(e);
		}
	}
	console.dir(domains);
	
	var Self = function (get_default) {
		var self = this;
		
		this.setDomain = function (value) {
			domain = null;
			console.log(this.getDomain());
			try {
				domains[this.getDomain()] = value;
				localStorage['domains'] = JSON.stringify(domains);
				domain = value;
			} catch (e) {
				console.log(e);
			}
		};
		this.getDomain = function () {
			if (domain != null) {
				return domain;
			} else {
				var res = get_default();
				
				console.dir(res);
				console.dir(domains[res]);
				
				if (domains[res] != undefined) {
					return domains[res];
				}
				return res;
			}
		};
		
		chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
			if (request.action == "getDomain") {
				sendResponse({domain: self.getDomain()});
				
			} else if (request.action == "setDomain") {
				Self.setDomain(request.domain);
				sendResponse({ok: true});
			}
		});
	};
	
	return Self;
}) ();

var ComplexKeyHooker = (function () {
	//~ var console = NullConsole;
	
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
				//~ console.dir(e);
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
				console.dir(e);
				e.stopPropagation();   // Don't let user JavaScript see this event
				e.preventDefault();    // Do not let the character hit the page
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
		
		var e = document.createEvent("KeyboardEvents");
		//e.initKeyboardEvent("keypress", true, true, window, false, false, false, false, 0, charCode);
		//e.initKeyboardEvent("keypress", true, true, window);
		e.initKeyboardEvent('keypress', true, true, window, false, false, false, false, charCode, charCode);
		//e.charCode = e.keyCode = e.which = charCode;
		console.dir(e);
		e.generatedByKeyHooker = true;
		target.dispatchEvent(e);
	};

	return Self;
}) ();

var SimpleKeyHooker = (function () {
	//~ var console = NullConsole;
	
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
			if (e.generatedByKeyHooker) {
				return;
			}
			if (e.keyCode == 13) {
				return;
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

var NullKeyHooker = function (field) {
	this.intercept = NullFunction;
	this.stop = NullFunction;
	this.setValue = function (str) {
		return str;
	};
	this.getValue = function () {
		return field.value;
	};
};

KeyHooker = SimpleKeyHooker;

var PasswordInputListener = (function () {
	//~ var console = NullConsole;
	//~ var pwdconsole = NullConsole;
	
	const VK_F2 = 113;
	const VK_TAB = 9;
	const VK_RETURN = 13;
	const VK_BACKSPACE = 8;
	const SPH_kPasswordKey2 = VK_F2;

	var registered = [];
	var selected = null;

	var alternativeDomain;

	var Self = function (field) {
		this.field = field; // used to focus field
		var pwdhash_enabled = false;
		var pwdhashed = false;
		var lastMyKeyPress = new Date;
		var domain = null;
		var last_password;
		var index;
		var inputExt = $('<div></div>');
		var self = this;
		
		var evlistener = {
			keypress: function(e) {
				if (e.keyCode == VK_RETURN) {
					this.pwdblur();
				}
			},
			keyup: function(e) {
				if (field.value == '@@') {
					field.value='';
					self.togglePasswordStatus();
				}
			},
			keydown: function(e) {
				if (e.keyCode == SPH_kPasswordKey2) {
					console.log('Press on F2');
					self.togglePasswordStatus();
				}
			},
			change: function(e) {
				this.pwdblur();
			},
			blur: function(e) {
				selected = null;
				this.pwdblur();
			},
			focus: function(e) {
				this.pwdfocus();
			},
			handleEvent: function(e) {
				console.log('event: ' + e.type + ', pwdhash_enabled: ' + pwdhash_enabled);
				
				if (this[e.type] != undefined) this[e.type](e);
			},
			pwdblur: function() {
				if (pwdhash_enabled) {
					if (self.keyhooker.getValue() != '') {
						self.submitPassword();
					}
					self.keyhooker.stop();
				}
			},
			pwdfocus: function() {
				selected = field;
				if (pwdhash_enabled) {
					self.keyhooker.intercept();
					if (pwdhashed) {
						last_password = self.keyhooker.setValue(last_password);
						field.value = last_password;
						pwdhashed = false;
					}
				}
			},
		};
		
		var methods = {
			initialize: function () {
				for (var k in registered) {
					if (registered[k].field == field) return;
				}
				index = registered.length;
				registered.push(this);
				
				field.addEventListener('keydown', evlistener, true);
				field.addEventListener('change', evlistener, true);
				field.addEventListener('focus', evlistener, true);
				field.addEventListener('blur', evlistener, true);
				field.addEventListener('keyup', evlistener, true);
				field.addEventListener('keypress', evlistener, true);
			},
			
			destroy: function () {
				field.removeEventListener('keydown', evlistener, true);
				field.removeEventListener('change', evlistener, true);
				field.removeEventListener('focus', evlistener, true);
				field.removeEventListener('blur', evlistener, true);
				field.removeEventListener('keyup', evlistener, true);
				field.removeEventListener('keypress', evlistener, true);
				if (pwdhashed) {
					field.value = last_password;
				}
			},
			
			togglePasswordStatus: function (force) {
				pwdhash_enabled = (force != undefined ? force : !pwdhash_enabled);
				
				if (pwdhash_enabled) {
					field.style.backgroundColor = '#ff0';
					this.keyhooker = new KeyHooker(field);
					this.keyhooker.intercept();
				} else {
					field.style.backgroundColor = '#fff';
					this.keyhooker.stop();
				}
			},
			
			submitPassword: function () {
				var password = this.keyhooker.getValue();
				/*
				if (password.substr(0,2) == SPH_kPasswordPrefix) {
					password = password.substr(2);
					this.togglePasswordStatus(true);
				}
				*/
				
				if (pwdhash_enabled && !pwdhashed) {
					pwdhashed = true;
					domain = this.getDomain();
					var hashed = (new SPH_HashedPassword(password, domain));
					last_password = password;
					field.value = (hashed);
				}
			},
			
			getDomain: function () {
				if (alternativeDomain != undefined) {
					return alternativeDomain.getDomain();
				} else {
					return Self.getDomain(field);
				}
			},
		}
		
		for (var k in methods) {
			this[k] = methods[k];
		}
		
		if (this.initialize != undefined) this.initialize();
	}
	
	var classMethods = {
		searchInputs: function () {
			this.items = [];
			this.searchFields('//input[@type="password"]');
			this.searchFields('//input[@type="PASSWORD"]');
			this.searchFields('//input[@type="Password"]');
			for (var k in this.items) {
				new Self(this.items[k]);
			}
		},
		searchFields: function (selector) {
			var result = document.evaluate(selector, document, null, 0, null);
			var item; while (item = result.iterateNext()) {
				this.items.push(item);
			}
		},
		getDomain: function (field) {
			var uri;
			if (field != null) {
				uri = new String(field.ownerDocument.location);
			} else {
				uri = new String(document.location);
			}
			var res = (new SPH_DomainExtractor()).extractDomain(uri);
			return res;
		},
	};
	for (var k in classMethods) { Self[k] = classMethods[k]; }
	
	alternativeDomain = new AlternativeDomain(function () { return Self.getDomain(); });
	
	document.addEventListener('keydown', function (e) {
		if (e.keyCode == SPH_kPasswordKey2) {
			if (selected == null) {
				for (var k in registered) {
					registered[k].destroy();
				}
				registered = [];
				
				Self.searchInputs();
				if (registered.length != 0) {
					registered[0].field.focus();
					registered[0].togglePasswordStatus(true);
				}
			}
		}
	});
		
	Self.searchInputs();

	return Self;
}) ();
