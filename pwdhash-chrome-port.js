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

var PasswordInputListener = (function () {

const VK_F2 = 113;
const VK_TAB = 9;
const VK_RETURN = 13;
const VK_BACKSPACE = 8;
const SPH_kPasswordKey2 = VK_F2;

var registered = [];
var selected = null;
var domain = null;

//~ var console = {dir: function(){}, log: function(){}};

var domains;

//~ localStorage['domains'] = JSON.stringify({'google.com':'toto.fr'});

if (localStorage['domains'] == undefined)
	domains = {};
else
	domains = JSON.parse(localStorage['domains']);

console.dir(domains);

var classMethods = {
	searchInputs: function () {
		var result = document.evaluate('//input[@type="password"]', document, null, 0, null);
		var items = [];
		var item; while (item = result.iterateNext()) {
			items.push(item);
		}
		for (var k in items) {
			new Self(items[k]);
		}
	},
	
	getDomain: function (field) {
		if (domain != null) {
			return domain;
		} else {
			var uri;
			if (field != null) {
				uri = new String(field.ownerDocument.location);
			} else {
				uri = new String(document.location);
			}
			var res = (new SPH_DomainExtractor()).extractDomain(uri);
			console.dir(res);
			console.dir(domains[res]);
			if (domains[res] != undefined) {
				return domains[res];
			}
			return res;
		}
	},
	
	setDomain: function (value) {
		domain = null;
		console.log(this.getDomain());
		domains[this.getDomain()] = value;
		localStorage['domains'] = JSON.stringify(domains);
		domain = value;
	},
};

var Self = function (field) {
	var pwdhash_enabled = false;
	var pwdhashed = false;
	var lastMyKeyPress = new Date;
	var domain = null;
	var last_password;
	this.field = field;
	var index;
	var inputExt = $('<div></div>');
	
	var methods = {
		initialize: function () {
			for (var k in registered) {
				if (registered[k].field == field) return;
			}
			index = registered.length;
			registered.push(this);
			
			field.addEventListener('keydown', this, true);
			field.addEventListener('change', this, true);
			field.addEventListener('focus', this, true);
			field.addEventListener('blur', this, true);
			
			//~ var inputExt = $('<div></div>');
			//~ $(field).after(inputExt);
			//~ inputExt
				//~ .append();
		},
		
		destroy: function () {
			field.removeEventListener('keydown', this, true);
			field.removeEventListener('change', this, true);
			field.removeEventListener('focus', this, true);
			field.removeEventListener('blur', this, true);
			if (pwdhashed) {
				field.value = last_password;
			}
		},
		
		togglePasswordStatus: function (force) {
			var status;
			
			if (force == null) {
				status = !pwdhash_enabled;
			} else {
				status = force;
			}
			
			if (status) {
				pwdhash_enabled = true;
				field.style.backgroundColor = '#ff0';
			} else {
				pwdhash_enabled = false;
				field.style.backgroundColor = '#fff';
			}
		},
		
		submitPassword: function () {
			var password = field.value;
			
			if (password.substr(0,2) == SPH_kPasswordPrefix) {
				password = password.substr(2);
				this.togglePasswordStatus(true);
			}
			
			if (pwdhash_enabled && !pwdhashed) {
				pwdhashed = true;
				if (domain == null) domain = this.getDomain(field);
				var hashed = (new SPH_HashedPassword(password, domain));
				last_password = password;
				field.value = (hashed);
			}
		},
		
		getDomain: function () {
			return Self.getDomain();
		},
		
		keydown: function(e) {
			/*
			if (e.keyCode == VK_BACKSPACE) {
				if ((new Date) - lastMyKeyPress < 200) {
					if (domain == null) domain = this.getDomain();
					domain = prompt("Enter an alternative domain:", domain, 'Alternative domain');
				}
				lastMyKeyPress = new Date;
			}
			*/
			if (e.keyCode == SPH_kPasswordKey2) {
				console.log('Press on F2');
				this.togglePasswordStatus();
			}
		},
		
		change: function(e) {
			if (field.value != '') {
				this.submitPassword();
			}
		},
		
		blur: function(e) {
			selected = null;
			if (field.value != '') {
				this.submitPassword();
			}
		},
		
		focus: function(e) {
			selected = field;
			
			if (pwdhash_enabled && pwdhashed) {
				field.value = last_password;
				pwdhashed = false;
			}
		},
		
		handleEvent: function(e) {
			console.log('event: ' + e.type + ', pwdhash_enabled: ' + pwdhash_enabled);
			
			if (e.type == 'keydown') {
				this.keydown(e);
			} else if (e.type == 'change') {
				this.change(e);
			} else if (e.type == 'blur') {
				this.blur(e);
			} else if (e.type == 'focus') {
				this.focus(e);
			} else {
			}
		}
	}
	
	for (var k in methods) {
		this[k] = methods[k];
	}
	
	this.initialize();
}

for (var k in classMethods) {
	Self[k] = classMethods[k];
}

/*
Self.searchInputs = function () {
	var result = document.evaluate('//input[@type="password"]', document, null, 0, null);
	var items = [];
	var item; while (item = result.iterateNext()) {
		items.push(item);
	}
	for (var k in items) {
		new Self(items[k]);
	}
}

Self.getDomain = function () {
	var uri = new String(field.ownerDocument.location);
	return (new SPH_DomainExtractor()).extractDomain(uri);
}
*/

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


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
/*
	console.log(sender.tab ?
	"from a content script:" + sender.tab.url :
	"from the extension");
	*/
	if (request.action == "getDomain") {
		sendResponse({domain: Self.getDomain()});
		
	} else if (request.action == "setDomain") {
		Self.setDomain(request.domain);
		sendResponse({ok: true});
	}
	//~ else
		//~ sendResponse({}); // snub them.
});

return Self;

}) ();
