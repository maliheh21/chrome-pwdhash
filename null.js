
var NullFunction = function(){};
//~ var NullConsole = {dir: function(){}, log: function(){}};
var NullConsole = {dir: function(){}, log: function(e){ console.log(e);}};

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
