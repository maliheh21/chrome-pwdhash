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
const SPH_kPasswordKey2 = VK_F2;

var Self = function (field) {
	this.field = field;
	
	for (var k in Self.registered) {
		if (Self.registered[k].field == field) {
			return;
		}
	}
	var index = Self.registered.length;
	Self.registered.push(this);
	
	field.addEventListener('keydown', this, true);
	field.addEventListener('change', this, true);
	field.addEventListener('focus', this, true);
	field.addEventListener('blur', this, true);
	
	var pwdhashit = false;
	var notyethashed;
	
	var methods = {
		togglePasswordStatus: function (force) {
			if (force == null)
				force = pwdhashit;
			else
				force = !force;
			
			if (force) {
				pwdhashit = false;
				field.style.backgroundColor = '#fff';
			} else {
				pwdhashit = true;
				field.style.backgroundColor = '#ff0';
			}
		},
		
		submitPassword: function () {field
			var password = field.value;
			
			if (password.substr(0,2) == SPH_kPasswordPrefix) {
				password = password.substr(2);
				this.togglePasswordStatus(true);
			}
			
			if (pwdhashit && notyethashed) {
				notyethashed = false;
				
				var uri = new String(field.ownerDocument.location);
				var domain = (new SPH_DomainExtractor()).extractDomain(uri);
				var hashed = (new SPH_HashedPassword(password, domain));
				field.value = (hashed);
			}
		},
		
		handleEvent: function(evt) {
			if (evt.type == 'keydown') {
				if (evt.keyCode == SPH_kPasswordKey2) {
					this.togglePasswordStatus();
				}
				if (evt.keyCode != VK_TAB && evt.keyCode != VK_RETURN) {
					notyethashed = true;
				}
			}
			
			if (evt.type == 'change') {
				if (field.value != '') {
					this.submitPassword();
				}
			}
		
			if (evt.type == 'blur') {
				Self.selected = null;
			}
			
			if (evt.type == 'focus') {
				Self.selected = field;
				Self.selectedIndex = index;
			}
		}
	}
	
	for (var k in methods) {
		this[k] = methods[k];
	}
}

Self.registered = [];
Self.selected = null;

Self.searchInputs = function () {
	var result = document.evaluate('//input[@type="password"]', document, null, 0, null);
	var item; while (item = result.iterateNext()) {
		new Self(item);
	}
}

Self.searchInputs();

document.addEventListener('keydown', function (e) {
	if (e.keyCode == SPH_kPasswordKey2) {
		Self.searchInputs();
		if (Self.selected != null) {
		} else {
			if (Self.registered.length != 0) {
				Self.registered[0].field.focus();
				Self.registered[0].togglePasswordStatus();
			}
		}
	}
});

return Self;

}) ();
