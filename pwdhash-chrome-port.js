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

/**
  Required : null.js
        "stanford-pwdhash/chrome/content/md5.js",
	"stanford-pwdhash/chrome/content/domain-extractor.js",
	"stanford-pwdhash/chrome/content/hashed-password.js",
	"stanford-pwdhash/chrome/content/stanford-pwdhash.js",
  Optional : AlternativeDomain.js KeyHooker.js
**/

var PasswordInputListener = (function () {
	var console = NullConsole;
	
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
		//~ var inputExt = $('<div></div>');
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
					if (!pwdhash_enabled) {
						e.stopPropagation();
						e.preventDefault();
					}
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
				//console.log('event: ' + e.type + ', pwdhash_enabled: ' + pwdhash_enabled);
				
				if (this[e.type] != undefined) this[e.type](e);
			},
			pwdblur: function() {
				//console.log('pwdblur');
				if (pwdhash_enabled) {
					if (self.keyhooker.getValue() != '') {
						self.submitPassword();
					}
					self.keyhooker.unIntercept();
				}
			},
			pwdfocus: function() {
				//console.log('pwdfocus');
				selected = field;
				if (pwdhash_enabled) {
					self.keyhooker.intercept();
					if (pwdhashed) {
						self.keyhooker.setPassword(last_password);
						pwdhashed = false;
					}
				}
			},
		};
		
		var methods = {
			initialize: function () {
				for (var k in registered) {
					console.log(field);
					if (registered[k].field == field) return;
				}

				if (field.pwdHashListener) {
					return;
				}
				field.pwdHashListener = this;
				
				index = registered.length;
				registered.push(this);
				
				console.log('PwdHash ADD Listeners (count: ' + registered.length + ')');
				field.addEventListener('keydown', evlistener, true);
				field.addEventListener('change', evlistener, true);
				field.addEventListener('focus', evlistener, true);
				field.addEventListener('blur', evlistener, true);
				field.addEventListener('keyup', evlistener, true);
				field.addEventListener('keypress', evlistener, true);
				
				if (typeof Settings != 'undefined') {
					this.settings = new Settings.Remote('GlobalSettings');
				}
				
				if (typeof(KeyHooker) == 'undefined') {
					this.keyhooker = new NullKeyHooker(field);
					
				} else {
					var _this = this;
					this.keyhooker = new KeyHooker(field);
					
					if (typeof this.settings != 'undefined') {
						this.settings.retrieve('noIntercept', function (value) {
							if (value) {
								_this.keyhooker = new NullKeyHooker(field);
							}
						});
					}
				}
			},
			
			destroy: function () {
				console.log('PwdHash REMOVE Listeners (count: ' + registered.length + ')');
				
				field.removeEventListener('keydown', evlistener, true);
				field.removeEventListener('change', evlistener, true);
				field.removeEventListener('focus', evlistener, true);
				field.removeEventListener('blur', evlistener, true);
				field.removeEventListener('keyup', evlistener, true);
				field.removeEventListener('keypress', evlistener, true);
				if (pwdhashed) {
					this.keyhooker.unIntercept();
					field.value = last_password;
				}
				field.pwdHashListener = null;
			},

			isEnabled: function () {
				return pwdhash_enabled;
			},
			
			togglePasswordStatus: function (force) {
				pwdhash_enabled = (force != undefined ? force : !pwdhash_enabled);
				field.value = '';
				
				if (pwdhash_enabled) {
					console.log('PwdHash turn on');
					field.style.backgroundColor = '#ff0';
					this.keyhooker.intercept();
					chrome.extension.sendRequest({controller: 'Background_HTML', action: 'setPwdHashIconOn'});
					
				} else {
					console.log('PwdHash turn off');
					field.style.backgroundColor = '#fff';
					this.keyhooker.unIntercept();
					chrome.extension.sendRequest({controller: 'Background_HTML', action: 'setPwdHashIconOff'});
				}
			},
			
			submitPassword: function () {
				var password = this.keyhooker.getValue();
				
				if (pwdhash_enabled && !pwdhashed) {
					pwdhashed = true;
					domain = this.getDomain();
					var hashed = (new SPH_HashedPassword(password, domain));
					last_password = password;
					
					this.keyhooker.setHashedPassword(hashed);
					
					if (typeof this.settings != 'undefined') {
						this.settings.retrieve('alertPwd', function (value) {
							if (value) {
								prompt("Password / hashed", password + " / " + field.value);
							}
						});
					}
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
		existsInputs: function () {
			this.items = [];
			this.searchFields('//input[@type="password"]');
			this.searchFields('//input[@type="PASSWORD"]');
			this.searchFields('//input[@type="Password"]');
			return this.items.length != 0;
		},
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
	
	if (typeof(AlternativeDomain) != 'undefined') {
		alternativeDomain = new AlternativeDomain(function () { return Self.getDomain(); });
	}
	
	// Auto-detect password inputs
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
					selected = registered[0].field;
					registered[0].togglePasswordStatus(true);
				}
			}
		}
	});
	
	chrome.extension.sendRequest({controller: 'Background_HTML', action: 'setPwdHashIconOff'});
	window.addEventListener('focus', function() {
		if (registered.length != 0 && registered[0].isEnabled()) {
			chrome.extension.sendRequest({controller: 'Background_HTML', action: 'setPwdHashIconOn'});
		} else {
			chrome.extension.sendRequest({controller: 'Background_HTML', action: 'setPwdHashIconOff'});
		}
	});
	
	window.addEventListener('load', function() {
		Self.searchInputs();
		if (Self.existsInputs()) {
			chrome.extension.sendRequest({controller: 'Background_HTML', action: 'showPwdHashIcon'});
		}
	});
	
	return Self;
}) ();
