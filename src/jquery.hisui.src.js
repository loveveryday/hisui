/*
    json2.js
    2013-05-26

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (typeof JSON !== 'object') {
    JSON = {};
}

(function () {
    'use strict';

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function () {

            return isFinite(this.valueOf())
                ? this.getUTCFullYear()     + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate())      + 'T' +
                    f(this.getUTCHours())     + ':' +
                    f(this.getUTCMinutes())   + ':' +
                    f(this.getUTCSeconds())   + 'Z'
                : null;
        };

        String.prototype.toJSON      =
            Number.prototype.toJSON  =
            Boolean.prototype.toJSON = function () {
                return this.valueOf();
            };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
            var c = meta[a];
            return typeof c === 'string'
                ? c
                : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        }) + '"' : '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    if (typeof rep[i] === 'string') {
                        k = rep[i];
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0
                ? '{}'
                : gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }


// If the JSON object does not yet have a parse method, give it one.

    if (typeof JSON.parse !== 'function') {
        JSON.parse = function (text, reviver) {

// The parse method takes a text and an optional reviver function, and returns
// a JavaScript value if the text is a valid JSON text.

            var j;

            function walk(holder, key) {

// The walk method is used to recursively walk the resulting structure so
// that modifications can be made.

                var k, v, value = holder[key];
                if (value && typeof value === 'object') {
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = walk(value, k);
                            if (v !== undefined) {
                                value[k] = v;
                            } else {
                                delete value[k];
                            }
                        }
                    }
                }
                return reviver.call(holder, key, value);
            }


// Parsing happens in four stages. In the first stage, we replace certain
// Unicode characters with escape sequences. JavaScript handles many characters
// incorrectly, either silently deleting them, or treating them as line endings.

            text = String(text);
            cx.lastIndex = 0;
            if (cx.test(text)) {
                text = text.replace(cx, function (a) {
                    return '\\u' +
                        ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                });
            }

// In the second stage, we run the text against regular expressions that look
// for non-JSON patterns. We are especially concerned with '()' and 'new'
// because they can cause invocation, and '=' because it can cause mutation.
// But just to be safe, we want to reject all unexpected forms.

// We split the second stage into 4 regexp operations in order to work around
// crippling inefficiencies in IE's and Safari's regexp engines. First we
// replace the JSON backslash pairs with '@' (a non-JSON character). Second, we
// replace all simple value tokens with ']' characters. Third, we delete all
// open brackets that follow a colon or comma or that begin the text. Finally,
// we look to see that the remaining characters are only whitespace or ']' or
// ',' or ':' or '{' or '}'. If that is so, then the text is safe for eval.

            if (/^[\],:{}\s]*$/
                    .test(text.replace(/\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g, '@')
                        .replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']')
                        .replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {

// In the third stage we use the eval function to compile the text into a
// JavaScript structure. The '{' operator is subject to a syntactic ambiguity
// in JavaScript: it can begin a block or an object literal. We wrap the text
// in parens to eliminate the ambiguity.

                j = eval('(' + text + ')');

// In the optional fourth stage, we recursively walk the new structure, passing
// each name/value pair to a reviver function for possible transformation.

                return typeof reviver === 'function'
                    ? walk({'': j}, '')
                    : j;
            }

// If the text is not JSON parseable, then a SyntaxError is thrown.

            throw new SyntaxError('JSON.parse');
        };
    }
}());

/**
 * jQuery HISUI 0.1.0
 * 
 * Copyright (c) 2009-2014 www.jeasyui.com. All rights reserved.
 *
 * Licensed under the GPL license: http://www.gnu.org/licenses/gpl.txt
 * To use it on other terms please contact us at info@jeasyui.com
 *
 */
(function ($) {
    /*-----1.5.js--jquery.parser.js--method-----start---*/
    $.hisui = {
		/**
		 * Get the index of array item, return -1 when the item is not found.
		 */
		indexOfArray: function(a, o, id){
			for(var i=0,len=a.length; i<len; i++){
				if (id == undefined){
					if (a[i] == o){return i;}
				} else {
					if (a[i][o] == id){return i;}
				}
			}
			return -1;
		},
		/**
		 * Remove array item, 'o' parameter can be item object or id field name.
		 * When 'o' parameter is the id field name, the 'id' parameter is valid.
		 */
		removeArrayItem: function(a, o, id){
			if (typeof o == 'string'){
				for(var i=0,len=a.length; i<len; i++){
					if (a[i][o] == id){
						a.splice(i, 1);
						return;
					}
				}
			} else {
				var index = this.indexOfArray(a,o);
				if (index != -1){
					a.splice(index, 1);
				}
			}
		},
		/**
		 * Add un-duplicate array item, 'o' parameter is the id field name, if the 'r' object is exists, deny the action.
		 */
		addArrayItem: function(a, o, r){
			var index = this.indexOfArray(a, o, r ? r[o] : undefined);
			if (index == -1){
				a.push(r ? r : o);
			} else {
				a[index] = r ? r : o;
			}
		},
		getArrayItem: function(a, o, id){
			var index = this.indexOfArray(a, o, id);
			return index==-1 ? null : a[index];
		},
		forEach: function(data, deep, callback){
			var nodes = [];
			for(var i=0; i<data.length; i++){
				nodes.push(data[i]);
			}
			while(nodes.length){
				var node = nodes.shift();
				if (callback(node) == false){return;}
				if (deep && node.children){
					for(var i=node.children.length-1; i>=0; i--){
						nodes.unshift(node.children[i]);
					}
				}
			}
		}
    };
    /*--1.5.js--jquery.parser.js--method-----end---*/
    $.parser = {
        auto: true, onComplete: function (context) {
        }, plugins: ["draggable", "droppable", "resizable", "pagination", "tooltip", "linkbutton", "menu", "menubutton", "splitbutton", "progressbar", "tree", "combobox", "combotree", "combogrid", "numberbox", "validatebox", "searchbox", "numberspinner", "timespinner", "calendar", "datebox", "datetimebox", "slider", "layout", "panel", "datagrid", "propertygrid", "treegrid", "tabs", "accordion", "window", "dialog","checkbox","radio","switchbox","keywords","lookup","triggerbox"], parse: function (context) {
            var aa = [];
            for (var i = 0; i < $.parser.plugins.length; i++) {
                var name = $.parser.plugins[i];
                var r = $(".hisui-" + name, context);
                if (r.length) {
                    if (r[name]) {
                        r[name]();
                    } else {
                        aa.push({ name: name, jq: r });
                    }
                }
            }
            if (aa.length && window.easyloader) {
                var names = [];
                for (var i = 0; i < aa.length; i++) {
                    names.push(aa[i].name);
                }
                easyloader.load(names, function () {
                    for (var i = 0; i < aa.length; i++) {
                        var name = aa[i].name;
                        var jq = aa[i].jq;
                        jq[name]();
                    }
                    $.parser.onComplete.call($.parser, context);
                });
            } else {
                $.parser.onComplete.call($.parser, context);
            }
        }, parseOptions: function (target, properties) {
            var t = $(target);
            var options = {};
            var s = $.trim(t.attr("data-options"));
            if (s) {
                if (s.substring(0, 1) != "{") {
                    s = "{" + s + "}";
                }
                options = (new Function("return " + s))();
            }
            if (properties) {
                var opts = {};
                for (var i = 0; i < properties.length; i++) {
                    var pp = properties[i];
                    if (typeof pp == "string") {
                        if (pp == "width" || pp == "height" || pp == "left" || pp == "top") {
                            opts[pp] = parseInt(target.style[pp]) || undefined;
                        } else {
                            opts[pp] = t.attr(pp);
                        }
                    } else {
                        for (var name in pp) {
                            var type = pp[name];
                            if (type == "boolean") {
                                opts[name] = t.attr(name) ? (t.attr(name) == "true") : undefined;
                            } else {
                                if (type == "number") {
                                    opts[name] = t.attr(name) == "0" ? 0 : parseFloat(t.attr(name)) || undefined;
                                }
                            }
                        }
                    }
                }
                $.extend(options, opts);
            }
            return options;
        }
    };
    $(function () {
        var d = $("<div style=\"position:absolute;top:-1000px;width:100px;height:100px;padding:5px\"></div>").appendTo("body");
        d.width(100);
        $._boxModel = parseInt(d.width()) == 100;
        d.remove();
        if (!window.easyloader && $.parser.auto) {
            $.parser.parse();
        }
    });
    $.fn._outerWidth = function (width) {
        if (width == undefined) {
            if (this[0] == window) {
                return this.width() || document.body.clientWidth;
            }
            return this.outerWidth() || 0;
        }
        return this.each(function () {
            if ($._boxModel) {
                $(this).width(width - ($(this).outerWidth() - $(this).width()));
            } else {
                $(this).width(width);
            }
        });
    };
    $.fn._outerHeight = function (height) {
        if (height == undefined) {
            if (this[0] == window) {
                return this.height() || document.body.clientHeight;
            }
            return this.outerHeight() || 0;
        }
        return this.each(function () {
            if ($._boxModel) {
                $(this).height(height - ($(this).outerHeight() - $(this).height()));
            } else {
                $(this).height(height);
            }
        });
    };
    $.fn._scrollLeft = function (left) {
        if (left == undefined) {
            return this.scrollLeft();
        } else {
            return this.each(function () {
                $(this).scrollLeft(left);
            });
        }
    };
    $.fn._propAttr = $.fn.prop || $.fn.attr;
    $.fn._fit = function (fit) {
        fit = fit == undefined ? true : fit;
        var t = this[0];
        var p = (t.tagName == "BODY" ? t : this.parent()[0]);
        var fcount = p.fcount || 0;
        if (fit) {
            if (!t.fitted) {
                t.fitted = true;
                p.fcount = fcount + 1;
                $(p).addClass("panel-noscroll");
                if (p.tagName == "BODY") {
                    $("html").addClass("panel-fit");
                }
            }
        } else {
            if (t.fitted) {
                t.fitted = false;
                p.fcount = fcount - 1;
                if (p.fcount == 0) {
                    $(p).removeClass("panel-noscroll");
                    if (p.tagName == "BODY") {
                        $("html").removeClass("panel-fit");
                    }
                }
            }
        }
        return { width: $(p).width(), height: $(p).height() };
    };
})(jQuery);
(function ($) {
    var longTouchTimer = null;
    var dblTouchTimer = null;
    var isDblClick = false;
    function onTouchStart(e) {
        if (e.touches.length != 1) {
            return;
        }
        if (!isDblClick) {
            isDblClick = true;
            dblClickTimer = setTimeout(function () {
                isDblClick = false;
            }, 500);
        } else {
            clearTimeout(dblClickTimer);
            isDblClick = false;
            fire(e, "dblclick");
        }
        longTouchTimer = setTimeout(function () {
            fire(e, "contextmenu", 3);
        }, 1000);
        fire(e, "mousedown");
        if ($.fn.draggable.isDragging || $.fn.resizable.isResizing) {
            e.preventDefault();
        }
    };
    function onTouchMove(e) {
        if (e.touches.length != 1) {
            return;
        }
        if (longTouchTimer) {
            clearTimeout(longTouchTimer);
        }
        fire(e, "mousemove");
        if ($.fn.draggable.isDragging || $.fn.resizable.isResizing) {
            e.preventDefault();
        }
    };
    function onTouchEnd(e) {
        if (longTouchTimer) {
            clearTimeout(longTouchTimer);
        }
        fire(e, "mouseup");
        if ($.fn.draggable.isDragging || $.fn.resizable.isResizing) {
            e.preventDefault();
        }
    };
    function fire(e, name, which) {
        var event = new $.Event(name);
        event.pageX = e.changedTouches[0].pageX;
        event.pageY = e.changedTouches[0].pageY;
        event.which = which || 1;
        $(e.target).trigger(event);
    };
    if (document.addEventListener) {
        document.addEventListener("touchstart", onTouchStart, true);
        document.addEventListener("touchmove", onTouchMove, true);
        document.addEventListener("touchend", onTouchEnd, true);
    }
})(jQuery);
(function ($) {   //cryze from 1.5
    function drag(e) {
        var state = $.data(e.data.target, "draggable");
        var opts = state.options;
        var proxy = state.proxy;
        var dragData = e.data;
        var left = dragData.startLeft + e.pageX - dragData.startX;
        var top = dragData.startTop + e.pageY - dragData.startY;
        if (proxy) {
            if (proxy.parent()[0] == document.body) {
                if (opts.deltaX != null && opts.deltaX != undefined) {
                    left = e.pageX + opts.deltaX;
                } else {
                    left = e.pageX - e.data.offsetWidth;
                }
                if (opts.deltaY != null && opts.deltaY != undefined) {
                    top = e.pageY + opts.deltaY;
                } else {
                    top = e.pageY - e.data.offsetHeight;
                }
            } else {
                if (opts.deltaX != null && opts.deltaX != undefined) {
                    left += e.data.offsetWidth + opts.deltaX;
                }
                if (opts.deltaY != null && opts.deltaY != undefined) {
                    top += e.data.offsetHeight + opts.deltaY;
                }
            }
        }
        if (e.data.parent != document.body) {
            left += $(e.data.parent).scrollLeft();
            top += $(e.data.parent).scrollTop();
        }
        if (opts.axis == "h") {
            dragData.left = left;
        } else {
            if (opts.axis == "v") {
                dragData.top = top;
            } else {
                dragData.left = left;
                dragData.top = top;
            }
        }
    };

    function applyDrag(e) {
        var state = $.data(e.data.target, "draggable");
        var opts = state.options;
        var proxy = state.proxy;
        if (!proxy) {
            proxy = $(e.data.target);
        }
        proxy.css({
            left: e.data.left,
            top: e.data.top
        });
        $("body").css("cursor", opts.cursor);
    };

    function doDown(e) {
        if (!$.fn.draggable.isDragging) {
            return false;
        }
        var state = $.data(e.data.target, "draggable");
        var opts = state.options;
        var droppables = $(".droppable:visible").filter(function () {
            return e.data.target != this;
        }).filter(function () {
            var accept = $.data(this, "droppable").options.accept;
            if (accept) {
                return $(accept).filter(function () {
                    return this == e.data.target;
                }).length > 0;
            } else {
                return true;
            }
        });
        state.droppables = droppables;
        var proxy = state.proxy;
        if (!proxy) {
            if (opts.proxy) {
                if (opts.proxy == "clone") {
                    proxy = $(e.data.target).clone().insertAfter(e.data.target);
                } else {
                    proxy = opts.proxy.call(e.data.target, e.data.target);
                }
                state.proxy = proxy;
            } else {
                proxy = $(e.data.target);
            }
        }
        proxy.css("position", "absolute");
        drag(e);
        applyDrag(e);
        opts.onStartDrag.call(e.data.target, e);
        return false;
    };

    function doMove(e) {
        if (!$.fn.draggable.isDragging) {
            return false;
        }
        var state = $.data(e.data.target, "draggable");
        drag(e);
        if (state.options.onDrag.call(e.data.target, e) != false) {
            applyDrag(e);
        }
        var source = e.data.target;
        state.droppables.each(function () {
            var dropObj = $(this);
            if (dropObj.droppable("options").disabled) {
                return;
            }
            var p2 = dropObj.offset();
            if (e.pageX > p2.left && e.pageX < p2.left + dropObj.outerWidth() && e.pageY > p2.top && e.pageY < p2.top + dropObj.outerHeight()) {
                if (!this.entered) {
                    $(this).trigger("_dragenter", [source]);
                    this.entered = true;
                }
                $(this).trigger("_dragover", [source]);
            } else {
                if (this.entered) {
                    $(this).trigger("_dragleave", [source]);
                    this.entered = false;
                }
            }
        });
        return false;
    };

    function doUp(e) {
        if (!$.fn.draggable.isDragging) {
            _4e();
            return false;
        }
        doMove(e);
        var state = $.data(e.data.target, "draggable");
        var proxy = state.proxy;
        var opts = state.options;
        opts.onEndDrag.call(e.data.target, e);
        if (opts.revert) {
            if (checkDrop() == true) {
                $(e.data.target).css({
                    position: e.data.startPosition,
                    left: e.data.startLeft,
                    top: e.data.startTop
                });
            } else {
                if (proxy) {
                    var left, top;
                    if (proxy.parent()[0] == document.body) {
                        left = e.data.startX - e.data.offsetWidth;
                        top = e.data.startY - e.data.offsetHeight;
                    } else {
                        left = e.data.startLeft;
                        top = e.data.startTop;
                    }
                    proxy.animate({
                        left: left,
                        top: top
                    }, function () {
                        removeProxy();
                    });
                } else {
                    $(e.data.target).animate({
                        left: e.data.startLeft,
                        top: e.data.startTop
                    }, function () {
                        $(e.data.target).css("position", e.data.startPosition);
                    });
                }
            }
        } else {
            $(e.data.target).css({
                position: "absolute",
                left: e.data.left,
                top: e.data.top
            });
            checkDrop();
        }
        opts.onStopDrag.call(e.data.target, e);
        _4e();

        function removeProxy() {
            if (proxy) {
                proxy.remove();
            }
            state.proxy = null;
        };

        function checkDrop() {
            var dropped = false;
            state.droppables.each(function () {
                var dropObj = $(this);
                if (dropObj.droppable("options").disabled) {
                    return;
                }
                var p2 = dropObj.offset();
                if (e.pageX > p2.left && e.pageX < p2.left + dropObj.outerWidth() && e.pageY > p2.top && e.pageY < p2.top + dropObj.outerHeight()) {
                    if (opts.revert) {
                        $(e.data.target).css({
                            position: e.data.startPosition,
                            left: e.data.startLeft,
                            top: e.data.startTop
                        });
                    }
                    $(this).triggerHandler("_drop", [e.data.target]);
                    removeProxy();
                    dropped = true;
                    this.entered = false;
                    return false;
                }
            });
            if (!dropped && !opts.revert) {
                removeProxy();
            }
            return dropped;
        };
        return false;
    };

    function _4e() {
        if ($.fn.draggable.timer) {
            clearTimeout($.fn.draggable.timer);
            $.fn.draggable.timer = undefined;
        }
        $(document).unbind(".draggable");
        $.fn.draggable.isDragging = false;
        setTimeout(function () {
            $("body").css("cursor", "");
        }, 100);
    };
    $.fn.draggable = function (options, param) {
        if (typeof options == "string") {
            return $.fn.draggable.methods[options](this, param);
        }
        return this.each(function () {
            var opts;
            var state = $.data(this, "draggable");
            if (state) {
                state.handle.unbind(".draggable");
                opts = $.extend(state.options, options);
            } else {
                opts = $.extend({}, $.fn.draggable.defaults, $.fn.draggable.parseOptions(this), options || {});
            }
            var handle = opts.handle ? (typeof opts.handle == "string" ? $(opts.handle, this) : opts.handle) : $(this);
            $.data(this, "draggable", {
                options: opts,
                handle: handle
            });
            if (opts.disabled) {
                $(this).css("cursor", "");
                return;
            }
            handle.unbind(".draggable").bind("mousemove.draggable", {
                target: this
            }, function (e) {
                if ($.fn.draggable.isDragging) {
                    return;
                }
                var opts = $.data(e.data.target, "draggable").options;
                if (checkArea(e)) {
                    $(this).css("cursor", opts.cursor);
                } else {
                    $(this).css("cursor", "");
                }
            }).bind("mouseleave.draggable", {
                target: this
            }, function (e) {
                $(this).css("cursor", "");
            }).bind("mousedown.draggable", {
                target: this
            }, function (e) {
                if (checkArea(e) == false) {
                    return;
                }
                $(this).css("cursor", "");
                var position = $(e.data.target).position();
                var offset = $(e.data.target).offset();
                var data = {
                    startPosition: $(e.data.target).css("position"),
                    startLeft: position.left,
                    startTop: position.top,
                    left: position.left,
                    top: position.top,
                    startX: e.pageX,
                    startY: e.pageY,
                    width: $(e.data.target).outerWidth(),
                    height: $(e.data.target).outerHeight(),
                    offsetWidth: (e.pageX - offset.left),
                    offsetHeight: (e.pageY - offset.top),
                    target: e.data.target,
                    parent: $(e.data.target).parent()[0]
                };
                $.extend(e.data, data);
                var opts = $.data(e.data.target, "draggable").options;
                if (opts.onBeforeDrag.call(e.data.target, e) == false) {
                    return;
                }
                $(document).bind("mousedown.draggable", e.data, doDown);
                $(document).bind("mousemove.draggable", e.data, doMove);
                $(document).bind("mouseup.draggable", e.data, doUp);
                $.fn.draggable.timer = setTimeout(function () {
                    $.fn.draggable.isDragging = true;
                    doDown(e);
                }, opts.delay);
                return false;
            });

            function checkArea(e) {
                var state = $.data(e.data.target, "draggable");
                var handle = state.handle;
                var offset = $(handle).offset();
                var width = $(handle).outerWidth();
                var height = $(handle).outerHeight();
                var t = e.pageY - offset.top;
                var r = offset.left + width - e.pageX;
                var b = offset.top + height - e.pageY;
                var l = e.pageX - offset.left;
                return Math.min(t, r, b, l) > state.options.edge;
            };
        });
    };
    $.fn.draggable.methods = {
        options: function (jq) {
            return $.data(jq[0], "draggable").options;
        },
        proxy: function (jq) {
            return $.data(jq[0], "draggable").proxy;
        },
        enable: function (jq) {
            return jq.each(function () {
                $(this).draggable({
                    disabled: false
                });
            });
        },
        disable: function (jq) {
            return jq.each(function () {
                $(this).draggable({
                    disabled: true
                });
            });
        }
    };
    $.fn.draggable.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["cursor", "handle", "axis", {
            "revert": "boolean",
            "deltaX": "number",
            "deltaY": "number",
            "edge": "number",
            "delay": "number"
        }]), {
            disabled: (t.attr("disabled") ? true : undefined)
        });
    };
    $.fn.draggable.defaults = {
        proxy: null,
        revert: false,
        cursor: "move",
        deltaX: null,
        deltaY: null,
        handle: null,
        disabled: false,
        edge: 0,
        axis: null,
        delay: 100,
        onBeforeDrag: function (e) {},
        onStartDrag: function (e) {},
        onDrag: function (e) {},
        onEndDrag: function (e) {},
        onStopDrag: function (e) {}
    };
    $.fn.draggable.isDragging = false;
})(jQuery);
(function ($) {     //cryze from 1.5
    function init(target) {
        $(target).addClass("droppable");
        $(target).bind("_dragenter", function (e, source) {
            $.data(target, "droppable").options.onDragEnter.apply(target, [e, source]);
        });
        $(target).bind("_dragleave", function (e, source) {
            $.data(target, "droppable").options.onDragLeave.apply(target, [e, source]);
        });
        $(target).bind("_dragover", function (e, source) {
            $.data(target, "droppable").options.onDragOver.apply(target, [e, source]);
        });
        $(target).bind("_drop", function (e, source) {
            $.data(target, "droppable").options.onDrop.apply(target, [e, source]);
        });
    };
    $.fn.droppable = function (options, param) {
        if (typeof options == "string") {
            return $.fn.droppable.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "droppable");
            if (state) {
                $.extend(state.options, options);
            } else {
                init(this);
                $.data(this, "droppable", {
                    options: $.extend({}, $.fn.droppable.defaults, $.fn.droppable.parseOptions(this), options)
                });
            }
        });
    };
    $.fn.droppable.methods = {
        options: function (jq) {
            return $.data(jq[0], "droppable").options;
        },
        enable: function (jq) {
            return jq.each(function () {
                $(this).droppable({
                    disabled: false
                });
            });
        },
        disable: function (jq) {
            return jq.each(function () {
                $(this).droppable({
                    disabled: true
                });
            });
        }
    };
    $.fn.droppable.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["accept"]), {
            disabled: (t.attr("disabled") ? true : undefined)
        });
    };
    $.fn.droppable.defaults = {
        accept: null,
        disabled: false,
        onDragEnter: function (e, source) {},
        onDragOver: function (e, source) {},
        onDragLeave: function (e, source) {},
        onDrop: function (e, source) {}
    };
})(jQuery);
(function ($) {
    $.fn.resizable = function (options, param) {
        if (typeof options == "string") {
            return $.fn.resizable.methods[options](this, param);
        }
        function resize(e) {
            var resizeData = e.data;
            var options = $.data(resizeData.target, "resizable").options;
            if (resizeData.dir.indexOf("e") != -1) {
                var width = resizeData.startWidth + e.pageX - resizeData.startX;
                width = Math.min(Math.max(width, options.minWidth), options.maxWidth);
                resizeData.width = width;
            }
            if (resizeData.dir.indexOf("s") != -1) {
                var height = resizeData.startHeight + e.pageY - resizeData.startY;
                height = Math.min(Math.max(height, options.minHeight), options.maxHeight);
                resizeData.height = height;
            }
            if (resizeData.dir.indexOf("w") != -1) {
                var width = resizeData.startWidth - e.pageX + resizeData.startX;
                width = Math.min(Math.max(width, options.minWidth), options.maxWidth);
                resizeData.width = width;
                resizeData.left = resizeData.startLeft + resizeData.startWidth - resizeData.width;
            }
            if (resizeData.dir.indexOf("n") != -1) {
                var height = resizeData.startHeight - e.pageY + resizeData.startY;
                height = Math.min(Math.max(height, options.minHeight), options.maxHeight);
                resizeData.height = height;
                resizeData.top = resizeData.startTop + resizeData.startHeight - resizeData.height;
            }
        };
        function applySize(e) {
            var resizeData = e.data;
            var t = $(resizeData.target);
            t.css({ left: resizeData.left, top: resizeData.top });
            if (t.outerWidth() != resizeData.width) {
                t._outerWidth(resizeData.width);
            }
            if (t.outerHeight() != resizeData.height) {
                t._outerHeight(resizeData.height);
            }
        };
        function doDown(e) {
            $.fn.resizable.isResizing = true;
            $.data(e.data.target, "resizable").options.onStartResize.call(e.data.target, e);
            return false;
        };
        function doMove(e) {
            resize(e);
            if ($.data(e.data.target, "resizable").options.onResize.call(e.data.target, e) != false) {
                applySize(e);
            }
            return false;
        };
        function doUp(e) {
            $.fn.resizable.isResizing = false;
            resize(e, true);
            applySize(e);
            $.data(e.data.target, "resizable").options.onStopResize.call(e.data.target, e);
            $(document).unbind(".resizable");
            $("body").css("cursor", "");
            return false;
        };
        return this.each(function () {
            var opts = null;
            var state = $.data(this, "resizable");
            if (state) {
                $(this).unbind(".resizable");
                opts = $.extend(state.options, options || {});
            } else {
                opts = $.extend({}, $.fn.resizable.defaults, $.fn.resizable.parseOptions(this), options || {});
                $.data(this, "resizable", { options: opts });
            }
            if (opts.disabled == true) {
                return;
            }
            $(this).bind("mousemove.resizable", { target: this }, function (e) {
                if ($.fn.resizable.isResizing) {
                    return;
                }
                var dir = getDirection(e);
                if (dir == "") {
                    $(e.data.target).css("cursor", "");
                } else {
                    $(e.data.target).css("cursor", dir + "-resize");
                }
            }).bind("mouseleave.resizable", { target: this }, function (e) {
                $(e.data.target).css("cursor", "");
            }).bind("mousedown.resizable", { target: this }, function (e) {
                var dir = getDirection(e);
                if (dir == "") {
                    return;
                }
                function getCssValue(css) {
                    var val = parseInt($(e.data.target).css(css));
                    if (isNaN(val)) {
                        return 0;
                    } else {
                        return val;
                    }
                };
                var data = { target: e.data.target, dir: dir, startLeft: getCssValue("left"), startTop: getCssValue("top"), left: getCssValue("left"), top: getCssValue("top"), startX: e.pageX, startY: e.pageY, startWidth: $(e.data.target).outerWidth(), startHeight: $(e.data.target).outerHeight(), width: $(e.data.target).outerWidth(), height: $(e.data.target).outerHeight(), deltaWidth: $(e.data.target).outerWidth() - $(e.data.target).width(), deltaHeight: $(e.data.target).outerHeight() - $(e.data.target).height() };
                $(document).bind("mousedown.resizable", data, doDown);
                $(document).bind("mousemove.resizable", data, doMove);
                $(document).bind("mouseup.resizable", data, doUp);
                $("body").css("cursor", dir + "-resize");
            });
            function getDirection(e) {
                var tt = $(e.data.target);
                var dir = "";
                var offset = tt.offset();
                var width = tt.outerWidth();
                var height = tt.outerHeight();
                var edge = opts.edge;
                if (e.pageY > offset.top && e.pageY < offset.top + edge) {
                    dir += "n";
                } else {
                    if (e.pageY < offset.top + height && e.pageY > offset.top + height - edge) {
                        dir += "s";
                    }
                }
                if (e.pageX > offset.left && e.pageX < offset.left + edge) {
                    dir += "w";
                } else {
                    if (e.pageX < offset.left + width && e.pageX > offset.left + width - edge) {
                        dir += "e";
                    }
                }
                var handles = opts.handles.split(",");
                for (var i = 0; i < handles.length; i++) {
                    var handle = handles[i].replace(/(^\s*)|(\s*$)/g, "");
                    if (handle == "all" || handle == dir) {
                        return dir;
                    }
                }
                return "";
            };
        });
    };
    $.fn.resizable.methods = {
        options: function (jq) {
            return $.data(jq[0], "resizable").options;
        }, enable: function (jq) {
            return jq.each(function () {
                $(this).resizable({ disabled: false });
            });
        }, disable: function (jq) {
            return jq.each(function () {
                $(this).resizable({ disabled: true });
            });
        }
    };
    $.fn.resizable.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["handles", { minWidth: "number", minHeight: "number", maxWidth: "number", maxHeight: "number", edge: "number" }]), { disabled: (t.attr("disabled") ? true : undefined) });
    };
    $.fn.resizable.defaults = {
        disabled: false, handles: "n, e, s, w, ne, se, sw, nw, all", minWidth: 10, minHeight: 10, maxWidth: 10000, maxHeight: 10000, edge: 5, onStartResize: function (e) {
        }, onResize: function (e) {
        }, onStopResize: function (e) {
        }
    };
    $.fn.resizable.isResizing = false;
})(jQuery);
(function ($) {
    function createButton(target) {
        var opts = $.data(target, "linkbutton").options;
        var t = $(target).empty();
        t.addClass("l-btn").removeClass("l-btn-plain l-btn-selected l-btn-plain-selected");
        t.removeClass("l-btn-small l-btn-medium l-btn-large").addClass("l-btn-" + opts.size);
        if (opts.plain) {
            t.addClass("l-btn-plain");
        }
        if (opts.selected) {
            t.addClass(opts.plain ? "l-btn-selected l-btn-plain-selected" : "l-btn-selected");
        }
        t.attr("group", opts.group || "");
        t.attr("id", opts.id || "");
        var inner = $("<span class=\"l-btn-left\"></span>").appendTo(t);
        if (opts.text) {
            $("<span class=\"l-btn-text\"></span>").html(opts.text).appendTo(inner);
        } else {
            $("<span class=\"l-btn-text l-btn-empty\">&nbsp;</span>").appendTo(inner);
        }
        if (opts.iconImg){
             //wanghc  add iconImg
            $("<span class=\"l-btn-icon\" style=\"background-image:url('"+opts.iconImg+"');background-position:center;background-repeat:no-repeat;\">&nbsp;</span>").appendTo(inner);
            inner.addClass("l-btn-icon-" + opts.iconAlign);
        }else if (opts.iconCls) {
            $("<span class=\"l-btn-icon\">&nbsp;</span>").addClass(opts.iconCls).appendTo(inner);
            inner.addClass("l-btn-icon-" + opts.iconAlign);
        }
        t.unbind(".linkbutton").bind("focus.linkbutton", function () {
            if (!opts.disabled) {
                $(this).addClass("l-btn-focus");
            }
        }).bind("blur.linkbutton", function () {
            $(this).removeClass("l-btn-focus");
        }).bind("click.linkbutton", function () {
            if (!opts.disabled) {
                if (opts.toggle) {
                    if (opts.selected) {
                        $(this).linkbutton("unselect");
                    } else {
                        $(this).linkbutton("select");
                    }
                }
                opts.onClick.call(this);
            }
            //return false; //不要阻止 cryze 2018-4-10  
            //cryze 2018-4-19 不阻止的话若a href="#" 会有跳转行为   判断是否是filebox的button时不阻止  不是 改为原样 还是阻止吧 
            if (!t.hasClass('filebox-button')) return false;
        });
        //禁用时 通过监听其下面子元素click事件，如果被禁用了，则阻止事件冒泡
        t.children('span').unbind(".linkbutton").bind("click.linkbutton", function () {
            if (opts.disabled && opts.stopAllEventOnDisabled) {
                return false;
            }else{
                return true;
            }
        })
        setSelected(target, opts.selected);
        setDisabled(target, opts.disabled);
    };
    function setSelected(target, selected) {
        var opts = $.data(target, "linkbutton").options;
        if (selected) {
            if (opts.group) {
                $("a.l-btn[group=\"" + opts.group + "\"]").each(function () {
                    var o = $(this).linkbutton("options");
                    if (o.toggle) {
                        $(this).removeClass("l-btn-selected l-btn-plain-selected");
                        o.selected = false;
                    }
                });
            }
            $(target).addClass(opts.plain ? "l-btn-selected l-btn-plain-selected" : "l-btn-selected");
            opts.selected = true;
        } else {
            if (!opts.group) {
                $(target).removeClass("l-btn-selected l-btn-plain-selected");
                opts.selected = false;
            }
        }
    };
    function setDisabled(target, disabled) {
        var state = $.data(target, "linkbutton");
        var opts = state.options;
        $(target).removeClass("l-btn-disabled l-btn-plain-disabled");
        if (disabled) {
            opts.disabled = true;
            var href = $(target).attr("href");
            if (href) {
                state.href = href;
                $(target).attr("href", "javascript:void(0)");
            }
            if (target.onclick) {
                state.onclick = target.onclick;
                target.onclick = null;
            }
            opts.plain ? $(target).addClass("l-btn-disabled l-btn-plain-disabled") : $(target).addClass("l-btn-disabled");
        } else {
            opts.disabled = false;
            if (state.href) {
                $(target).attr("href", state.href);
            }
            if (state.onclick) {
                target.onclick = state.onclick;
            }
        }
    };
    $.fn.linkbutton = function (options, param) {
        if (typeof options == "string") {
            return $.fn.linkbutton.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "linkbutton");
            if (state) {
                $.extend(state.options, options);
            } else {
                $.data(this, "linkbutton", { options: $.extend({}, $.fn.linkbutton.defaults, $.fn.linkbutton.parseOptions(this), options) });
                $(this).removeAttr("disabled");
            }
            createButton(this);
        });
    };
    $.fn.linkbutton.methods = {
        options: function (jq) {
            return $.data(jq[0], "linkbutton").options;
        }, enable: function (jq) {
            return jq.each(function () {
                setDisabled(this, false);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                setDisabled(this, true);
            });
        }, select: function (jq) {
            return jq.each(function () {
                setSelected(this, true);
            });
        }, unselect: function (jq) {
            return jq.each(function () {
                setSelected(this, false);
            });
        }
    };
    $.fn.linkbutton.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["id","iconImg", "iconCls", "iconAlign", "group", "size", { plain: "boolean", toggle: "boolean", selected: "boolean" }]), { disabled: (t.attr("disabled") ? true : undefined), text: $.trim(t.html()), iconCls: (t.attr("icon") || t.attr("iconCls")) });
    };
    $.fn.linkbutton.defaults = {
        //wanghc iconImg:'imgurl' -> background-image:url('../images/uiimages/yellow_paper.png')
        id: null, disabled: false, toggle: false, selected: false, group: null, plain: false, text: "",iconImg:null, iconCls: null, iconAlign: "left", size: "small", onClick: function () {
        },stopAllEventOnDisabled:false //cryze 禁用时,是否禁用其他方式绑定的事件
    };
})(jQuery);
(function ($) {
    function _81(_82) {
        var _83 = $.data(_82, "pagination");
        var _84 = _83.options;
        var bb = _83.bb = {};
        var _85 = $(_82).addClass("pagination").html("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tr></tr></table>");
        var tr = _85.find("tr");
        var aa = $.extend([], _84.layout);
        if (!_84.showPageList) {
            _86(aa, "list");
        }
        if (!_84.showRefresh) {
            _86(aa, "refresh");
        }
        if (aa[0] == "sep") {
            aa.shift();
        }
        if (aa[aa.length - 1] == "sep") {
            aa.pop();
        }
        for (var _87 = 0; _87 < aa.length; _87++) {
            var _88 = aa[_87];
            if (_88 == "list") {
                var ps = $("<select class=\"pagination-page-list\"></select>");
                ps.bind("change", function () {
                    _84.pageSize = parseInt($(this).val());
                    _84.onChangePageSize.call(_82, _84.pageSize);
                    _8e(_82, _84.pageNumber);
                });
                for (var i = 0; i < _84.pageList.length; i++) {
                    $("<option></option>").text(_84.pageList[i]).appendTo(ps);
                }
                $("<td></td>").append(ps).appendTo(tr);
            } else {
                if (_88 == "sep") {
                    $("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
                } else {
                    if (_88 == "first") {
                        bb.first = _89("first");
                    } else {
                        if (_88 == "prev") {
                            bb.prev = _89("prev");
                        } else {
                            if (_88 == "next") {
                                bb.next = _89("next");
                            } else {
                                if (_88 == "last") {
                                    bb.last = _89("last");
                                } else {
                                    if (_88 == "manual") {
                                        $("<span style=\"padding-left:6px;\"></span>").html(_84.beforePageText).appendTo(tr).wrap("<td></td>");
                                        bb.num = $("<input class=\"pagination-num\" type=\"text\" value=\"1\" size=\"2\">").appendTo(tr).wrap("<td></td>");
                                        bb.num.unbind(".pagination").bind("keydown.pagination", function (e) {
                                            if (e.keyCode == 13) {
                                                var _8a = parseInt($(this).val()) || 1;
                                                _8e(_82, _8a);
                                                return false;
                                            }
                                        });
                                        bb.after = $("<span style=\"padding-right:6px;\"></span>").appendTo(tr).wrap("<td></td>");
                                    } else {
                                        if (_88 == "refresh") {
                                            bb.refresh = _89("refresh");
                                        } else {
                                            if (_88 == "links") {
                                                $("<td class=\"pagination-links\"></td>").appendTo(tr);
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        if (_84.buttons) {
            $("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
            if ($.isArray(_84.buttons)) {
                for (var i = 0; i < _84.buttons.length; i++) {
                    var btn = _84.buttons[i];
                    if (btn == "-") {
                        $("<td><div class=\"pagination-btn-separator\"></div></td>").appendTo(tr);
                    } else {
                        var td = $("<td></td>").appendTo(tr);
                        var a = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
                        a[0].onclick = eval(btn.handler || function () {
                        });
                        a.linkbutton($.extend({}, btn, { plain: true }));
                    }
                }
            } else {
                var td = $("<td></td>").appendTo(tr);
                $(_84.buttons).appendTo(td).show();
            }
        }
        $("<div class=\"pagination-info\"></div>").appendTo(_85);
        $("<div style=\"clear:both;\"></div>").appendTo(_85);
        function _89(_8b) {
            var btn = _84.nav[_8b];
            var a = $("<a href=\"javascript:void(0)\"></a>").appendTo(tr);
            a.wrap("<td></td>");
            a.linkbutton({ iconCls: btn.iconCls, plain: true }).unbind(".pagination").bind("click.pagination", function () {
                btn.handler.call(_82);
            });
            return a;
        };
        function _86(aa, _8c) {
            var _8d = $.inArray(_8c, aa);
            if (_8d >= 0) {
                aa.splice(_8d, 1);
            }
            return aa;
        };
    };
    function _8e(_8f, _90) {
        var _91 = $.data(_8f, "pagination").options;
        _92(_8f, { pageNumber: _90 });
        _91.onSelectPage.call(_8f, _91.pageNumber, _91.pageSize);
    };
    function _92(_93, _94) {
        var _95 = $.data(_93, "pagination");
        var _96 = _95.options;
        var bb = _95.bb;
        $.extend(_96, _94 || {});
        var ps = $(_93).find("select.pagination-page-list");
        if (ps.length) {
            ps.val(_96.pageSize + "");
            _96.pageSize = parseInt(ps.val());
        }
        var _97 = Math.ceil(_96.total / _96.pageSize) || 1;
        if (_96.pageNumber < 1) {
            _96.pageNumber = 1;
        }
        if (_96.pageNumber > _97) {
            _96.pageNumber = _97;
        }
        if (bb.num) {
            bb.num.val(_96.pageNumber);
        }
        if (bb.after) {
            bb.after.html(_96.afterPageText.replace(/{pages}/, _97));
        }
        var td = $(_93).find("td.pagination-links");
        if (td.length) {
            td.empty();
            var _98 = _96.pageNumber - Math.floor(_96.links / 2);
            if (_98 < 1) {
                _98 = 1;
            }
            var _99 = _98 + _96.links - 1;
            if (_99 > _97) {
                _99 = _97;
            }
            _98 = _99 - _96.links + 1;
            if (_98 < 1) {
                _98 = 1;
            }
            for (var i = _98; i <= _99; i++) {
                var a = $("<a class=\"pagination-link\" href=\"javascript:void(0)\"></a>").appendTo(td);
                a.linkbutton({ plain: true, text: i });
                if (i == _96.pageNumber) {
                    a.linkbutton("select");
                } else {
                    a.unbind(".pagination").bind("click.pagination", { pageNumber: i }, function (e) {
                        _8e(_93, e.data.pageNumber);
                    });
                }
            }
        }
        var _9a = _96.displayMsg;
        _9a = _9a.replace(/{from}/, _96.total == 0 ? 0 : _96.pageSize * (_96.pageNumber - 1) + 1);
        _9a = _9a.replace(/{to}/, Math.min(_96.pageSize * (_96.pageNumber), _96.total));
        _9a = _9a.replace(/{total}/, _96.total);
        $(_93).find("div.pagination-info").html(_9a);
        if (bb.first) {
            bb.first.linkbutton({ disabled: (_96.pageNumber == 1) });
        }
        if (bb.prev) {
            bb.prev.linkbutton({ disabled: (_96.pageNumber == 1) });
        }
        if (bb.next) {
            bb.next.linkbutton({ disabled: (_96.pageNumber == _97) });
        }
        if (bb.last) {
            bb.last.linkbutton({ disabled: (_96.pageNumber == _97) });
        }
        _9b(_93, _96.loading);
    };
    function _9b(_9c, _9d) {
        var _9e = $.data(_9c, "pagination");
        var _9f = _9e.options;
        _9f.loading = _9d;
        if (_9f.showRefresh && _9e.bb.refresh) {
            _9e.bb.refresh.linkbutton({ iconCls: (_9f.loading ? "pagination-loading" : "pagination-load") });
        }
    };
    $.fn.pagination = function (_a0, _a1) {
        if (typeof _a0 == "string") {
            return $.fn.pagination.methods[_a0](this, _a1);
        }
        _a0 = _a0 || {};
        return this.each(function () {
            var _a2;
            var _a3 = $.data(this, "pagination");
            if (_a3) {
                _a2 = $.extend(_a3.options, _a0);
            } else {
                _a2 = $.extend({}, $.fn.pagination.defaults, $.fn.pagination.parseOptions(this), _a0);
                $.data(this, "pagination", { options: _a2 });
            }
            _81(this);
            _92(this);
        });
    };
    $.fn.pagination.methods = {
        options: function (jq) {
            return $.data(jq[0], "pagination").options;
        }, loading: function (jq) {
            return jq.each(function () {
                _9b(this, true);
            });
        }, loaded: function (jq) {
            return jq.each(function () {
                _9b(this, false);
            });
        }, refresh: function (jq, _a4) {
            return jq.each(function () {
                _92(this, _a4);
            });
        }, select: function (jq, _a5) {
            return jq.each(function () {
                _8e(this, _a5);
            });
        }
    };
    $.fn.pagination.parseOptions = function (_a6) {
        var t = $(_a6);
        return $.extend({}, $.parser.parseOptions(_a6, [{ total: "number", pageSize: "number", pageNumber: "number", links: "number" }, { loading: "boolean", showPageList: "boolean", showRefresh: "boolean" }]), { pageList: (t.attr("pageList") ? eval(t.attr("pageList")) : undefined) });
    };
    $.fn.pagination.defaults = {
        total: 1, pageSize: 10, pageNumber: 1, pageList: [10, 20, 30, 50], loading: false, buttons: null, showPageList: true, showRefresh: true, links: 10, layout: ["list", "sep", "first", "prev", "sep", "manual", "sep", "next", "last", "sep", "refresh"], onSelectPage: function (_a7, _a8) {
        }, onBeforeRefresh: function (_a9, _aa) {
        }, onRefresh: function (_ab, _ac) {
        }, onChangePageSize: function (_ad) {
        }, beforePageText: "Page", afterPageText: "of {pages}", displayMsg: "Displaying {from} to {to} of {total} items", nav: {
            first: {
                iconCls: "pagination-first", handler: function () {
                    var _ae = $(this).pagination("options");
                    if (_ae.pageNumber > 1) {
                        $(this).pagination("select", 1);
                    }
                }
            }, prev: {
                iconCls: "pagination-prev", handler: function () {
                    var _af = $(this).pagination("options");
                    if (_af.pageNumber > 1) {
                        $(this).pagination("select", _af.pageNumber - 1);
                    }
                }
            }, next: {
                iconCls: "pagination-next", handler: function () {
                    var _b0 = $(this).pagination("options");
                    var _b1 = Math.ceil(_b0.total / _b0.pageSize);
                    if (_b0.pageNumber < _b1) {
                        $(this).pagination("select", _b0.pageNumber + 1);
                    }
                }
            }, last: {
                iconCls: "pagination-last", handler: function () {
                    var _b2 = $(this).pagination("options");
                    var _b3 = Math.ceil(_b2.total / _b2.pageSize);
                    if (_b2.pageNumber < _b3) {
                        $(this).pagination("select", _b3);
                    }
                }
            }, refresh: {
                iconCls: "pagination-refresh", handler: function () {
                    var _b4 = $(this).pagination("options");
                    if (_b4.onBeforeRefresh.call(this, _b4.pageNumber, _b4.pageSize) != false) {
                        $(this).pagination("select", _b4.pageNumber);
                        _b4.onRefresh.call(this, _b4.pageNumber, _b4.pageSize);
                    }
                }
            }
        }
    };
})(jQuery);
(function ($) {
    function _b5(_b6) {
        var _b7 = $(_b6);
        _b7.addClass("tree");
        return _b7;
    };
    function _b8(_b9) {
        var _ba = $.data(_b9, "tree").options;
        $(_b9).unbind().bind("mouseover", function (e) {
            var tt = $(e.target);
            var _bb = tt.closest("div.tree-node");
            if (!_bb.length) {
                return;
            }
            _bb.addClass("tree-node-hover");
            if (tt.hasClass("tree-hit")) {
                if (tt.hasClass("tree-expanded")) {
                    tt.addClass("tree-expanded-hover");
                } else {
                    tt.addClass("tree-collapsed-hover");
                }
            }
            e.stopPropagation();
        }).bind("mouseout", function (e) {
            var tt = $(e.target);
            var _bc = tt.closest("div.tree-node");
            if (!_bc.length) {
                return;
            }
            _bc.removeClass("tree-node-hover");
            if (tt.hasClass("tree-hit")) {
                if (tt.hasClass("tree-expanded")) {
                    tt.removeClass("tree-expanded-hover");
                } else {
                    tt.removeClass("tree-collapsed-hover");
                }
            }
            e.stopPropagation();
        }).bind("click", function (e) {
            var tt = $(e.target);
            var _bd = tt.closest("div.tree-node");
            if (!_bd.length) {
                return;
            }
            if (tt.hasClass("tree-hit")) {
                _125(_b9, _bd[0]);
                return false;
            } else {
                if (tt.hasClass("tree-checkbox")) {
                    _e8(_b9, _bd[0], !tt.hasClass("tree-checkbox1"));
                    return false;
                } else {
                    _16a(_b9, _bd[0]);
                    _ba.onClick.call(_b9, _c0(_b9, _bd[0]));
                }
            }
            e.stopPropagation();
        }).bind("dblclick", function (e) {
            var _be = $(e.target).closest("div.tree-node");
            if (!_be.length) {
                return;
            }
            _16a(_b9, _be[0]);
            _ba.onDblClick.call(_b9, _c0(_b9, _be[0]));
            e.stopPropagation();
        }).bind("contextmenu", function (e) {
            var _bf = $(e.target).closest("div.tree-node");
            if (!_bf.length) {
                return;
            }
            _ba.onContextMenu.call(_b9, e, _c0(_b9, _bf[0]));
            e.stopPropagation();
        });
    };
    function _c1(_c2) {
        var _c3 = $.data(_c2, "tree").options;
        _c3.dnd = false;
        var _c4 = $(_c2).find("div.tree-node");
        _c4.draggable("disable");
        _c4.css("cursor", "pointer");
    };
    function _c5(_c6) {
        var _c7 = $.data(_c6, "tree");
        var _c8 = _c7.options;
        var _c9 = _c7.tree;
        _c7.disabledNodes = [];
        _c8.dnd = true;
        _c9.find("div.tree-node").draggable({
            disabled: false, revert: true, cursor: "pointer", proxy: function (_ca) {
                var p = $("<div class=\"tree-node-proxy\"></div>").appendTo("body");
                p.html("<span class=\"tree-dnd-icon tree-dnd-no\">&nbsp;</span>" + $(_ca).find(".tree-title").html());
                p.hide();
                return p;
            }, deltaX: 15, deltaY: 15, onBeforeDrag: function (e) {
                if (_c8.onBeforeDrag.call(_c6, _c0(_c6, this)) == false) {
                    return false;
                }
                if ($(e.target).hasClass("tree-hit") || $(e.target).hasClass("tree-checkbox")) {
                    return false;
                }
                if (e.which != 1) {
                    return false;
                }
                $(this).next("ul").find("div.tree-node").droppable({ accept: "no-accept" });
                var _cb = $(this).find("span.tree-indent");
                if (_cb.length) {
                    e.data.offsetWidth -= _cb.length * _cb.width();
                }
            }, onStartDrag: function () {
                $(this).draggable("proxy").css({ left: -10000, top: -10000 });
                _c8.onStartDrag.call(_c6, _c0(_c6, this));
                var _cc = _c0(_c6, this);
                if (_cc.id == undefined) {
                    _cc.id = "hisui_tree_node_id_temp";
                    _108(_c6, _cc);
                }
                _c7.draggingNodeId = _cc.id;
            }, onDrag: function (e) {
                var x1 = e.pageX, y1 = e.pageY, x2 = e.data.startX, y2 = e.data.startY;
                var d = Math.sqrt((x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2));
                if (d > 3) {
                    $(this).draggable("proxy").show();
                }
                this.pageY = e.pageY;
            }, onStopDrag: function () {
                $(this).next("ul").find("div.tree-node").droppable({ accept: "div.tree-node" });
                for (var i = 0; i < _c7.disabledNodes.length; i++) {
                    $(_c7.disabledNodes[i]).droppable("enable");
                }
                _c7.disabledNodes = [];
                var _cd = _162(_c6, _c7.draggingNodeId);
                if (_cd && _cd.id == "hisui_tree_node_id_temp") {
                    _cd.id = "";
                    _108(_c6, _cd);
                }
                _c8.onStopDrag.call(_c6, _cd);
            }
        }).droppable({
            accept: "div.tree-node", onDragEnter: function (e, _ce) {
                if (_c8.onDragEnter.call(_c6, this, _cf(_ce)) == false) {
                    _d0(_ce, false);
                    $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
                    $(this).droppable("disable");
                    _c7.disabledNodes.push(this);
                }
            }, onDragOver: function (e, _d1) {
                if ($(this).droppable("options").disabled) {
                    return;
                }
                var _d2 = _d1.pageY;
                var top = $(this).offset().top;
                var _d3 = top + $(this).outerHeight();
                _d0(_d1, true);
                $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
                if (_d2 > top + (_d3 - top) / 2) {
                    if (_d3 - _d2 < 5) {
                        $(this).addClass("tree-node-bottom");
                    } else {
                        $(this).addClass("tree-node-append");
                    }
                } else {
                    if (_d2 - top < 5) {
                        $(this).addClass("tree-node-top");
                    } else {
                        $(this).addClass("tree-node-append");
                    }
                }
                if (_c8.onDragOver.call(_c6, this, _cf(_d1)) == false) {
                    _d0(_d1, false);
                    $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
                    $(this).droppable("disable");
                    _c7.disabledNodes.push(this);
                }
            }, onDragLeave: function (e, _d4) {
                _d0(_d4, false);
                $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
                _c8.onDragLeave.call(_c6, this, _cf(_d4));
            }, onDrop: function (e, _d5) {
                var _d6 = this;
                var _d7, _d8;
                if ($(this).hasClass("tree-node-append")) {
                    _d7 = _d9;
                    _d8 = "append";
                } else {
                    _d7 = _da;
                    _d8 = $(this).hasClass("tree-node-top") ? "top" : "bottom";
                }
                if (_c8.onBeforeDrop.call(_c6, _d6, _cf(_d5), _d8) == false) {
                    $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
                    return;
                }
                _d7(_d5, _d6, _d8);
                $(this).removeClass("tree-node-append tree-node-top tree-node-bottom");
            }
        });
        function _cf(_db, pop) {
            return $(_db).closest("ul.tree").tree(pop ? "pop" : "getData", _db);
        };
        function _d0(_dc, _dd) {
            var _de = $(_dc).draggable("proxy").find("span.tree-dnd-icon");
            _de.removeClass("tree-dnd-yes tree-dnd-no").addClass(_dd ? "tree-dnd-yes" : "tree-dnd-no");
        };
        function _d9(_df, _e0) {
            if (_c0(_c6, _e0).state == "closed") {
                _11d(_c6, _e0, function () {
                    _e1();
                });
            } else {
                _e1();
            }
            function _e1() {
                var _e2 = _cf(_df, true);
                $(_c6).tree("append", { parent: _e0, data: [_e2] });
                _c8.onDrop.call(_c6, _e0, _e2, "append");
            };
        };
        function _da(_e3, _e4, _e5) {
            var _e6 = {};
            if (_e5 == "top") {
                _e6.before = _e4;
            } else {
                _e6.after = _e4;
            }
            var _e7 = _cf(_e3, true);
            _e6.data = _e7;
            $(_c6).tree("insert", _e6);
            _c8.onDrop.call(_c6, _e4, _e7, _e5);
        };
    };
    function _e8(_e9, _ea, _eb) {
        var _ec = $.data(_e9, "tree").options;
        if (!_ec.checkbox) {
            return;
        }
        var _ed = _c0(_e9, _ea);
        if (_ec.onBeforeCheck.call(_e9, _ed, _eb) == false) {
            return;
        }
        var _ee = $(_ea);
        var ck = _ee.find(".tree-checkbox");
        ck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
        if (_eb) {
            ck.addClass("tree-checkbox1");
        } else {
            ck.addClass("tree-checkbox0");
        }
        if (_ec.cascadeCheck) {
            _ef(_ee);
            _f0(_ee);
        }
        _ec.onCheck.call(_e9, _ed, _eb);
        function _f0(_f1) {
            var _f2 = _f1.next().find(".tree-checkbox");
            _f2.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
            if (_f1.find(".tree-checkbox").hasClass("tree-checkbox1")) {
                _f2.addClass("tree-checkbox1");
            } else {
                _f2.addClass("tree-checkbox0");
            }
        };
        function _ef(_f3) {
            var _f4 = _130(_e9, _f3[0]);
            if (_f4) {
                var ck = $(_f4.target).find(".tree-checkbox");
                ck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
                if (_f5(_f3)) {
                    ck.addClass("tree-checkbox1");
                } else {
                    if (_f6(_f3)) {
                        ck.addClass("tree-checkbox0");
                    } else {
                        ck.addClass("tree-checkbox2");
                    }
                }
                _ef($(_f4.target));
            }
            function _f5(n) {
                var ck = n.find(".tree-checkbox");
                if (ck.hasClass("tree-checkbox0") || ck.hasClass("tree-checkbox2")) {
                    return false;
                }
                var b = true;
                n.parent().siblings().each(function () {
                    if (!$(this).children("div.tree-node").children(".tree-checkbox").hasClass("tree-checkbox1")) {
                        b = false;
                    }
                });
                return b;
            };
            function _f6(n) {
                var ck = n.find(".tree-checkbox");
                if (ck.hasClass("tree-checkbox1") || ck.hasClass("tree-checkbox2")) {
                    return false;
                }
                var b = true;
                n.parent().siblings().each(function () {
                    if (!$(this).children("div.tree-node").children(".tree-checkbox").hasClass("tree-checkbox0")) {
                        b = false;
                    }
                });
                return b;
            };
        };
    };
    function _f7(_f8, _f9) {
        var _fa = $.data(_f8, "tree").options;
        if (!_fa.checkbox) {
            return;
        }
        var _fb = $(_f9);
        if (_fc(_f8, _f9)) {
            var ck = _fb.find(".tree-checkbox");
            if (ck.length) {
                if (ck.hasClass("tree-checkbox1")) {
                    _e8(_f8, _f9, true);
                } else {
                    _e8(_f8, _f9, false);
                }
            } else {
                if (_fa.onlyLeafCheck) {
                    $("<span class=\"tree-checkbox tree-checkbox0\"></span>").insertBefore(_fb.find(".tree-title"));
                }
            }
        } else {
            var ck = _fb.find(".tree-checkbox");
            if (_fa.onlyLeafCheck) {
                ck.remove();
            } else {
                if (ck.hasClass("tree-checkbox1")) {
                    _e8(_f8, _f9, true);
                } else {
                    if (ck.hasClass("tree-checkbox2")) {
                        var _fd = true;
                        var _fe = true;
                        var _ff = _100(_f8, _f9);
                        for (var i = 0; i < _ff.length; i++) {
                            if (_ff[i].checked) {
                                _fe = false;
                            } else {
                                _fd = false;
                            }
                        }
                        if (_fd) {
                            _e8(_f8, _f9, true);
                        }
                        if (_fe) {
                            _e8(_f8, _f9, false);
                        }
                    }
                }
            }
        }
    };
    function _101(_102, ul, data, _103) {
        var _104 = $.data(_102, "tree");
        var opts = _104.options;
        var _105 = $(ul).prevAll("div.tree-node:first");
        data = opts.loadFilter.call(_102, data, _105[0]);
        var _106 = _107(_102, "domId", _105.attr("id"));
        if (!_103) {
            _106 ? _106.children = data : _104.data = data;
            $(ul).empty();
        } else {
            if (_106) {
                _106.children ? _106.children = _106.children.concat(data) : _106.children = data;
            } else {
                _104.data = _104.data.concat(data);
            }
        }
        opts.view.render.call(opts.view, _102, ul, data);
        if (opts.dnd) {
            _c5(_102);
        }
        if (_106) {
            _108(_102, _106);
        }
        var _109 = [];
        var _10a = [];
        for (var i = 0; i < data.length; i++) {
            var node = data[i];
            if (!node.checked) {
                _109.push(node);
            }
        }
        _10b(data, function (node) {
            if (node.checked) {
                _10a.push(node);
            }
        });
        var _10c = opts.onCheck;
        opts.onCheck = function () {
        };
        if (_109.length) {
            _e8(_102, $("#" + _109[0].domId)[0], false);
        }
        for (var i = 0; i < _10a.length; i++) {
            _e8(_102, $("#" + _10a[i].domId)[0], true);
        }
        opts.onCheck = _10c;
        setTimeout(function () {
            _10d(_102, _102);
        }, 0);
        opts.onLoadSuccess.call(_102, _106, data);
    };
    function _10d(_10e, ul, _10f) {
        var opts = $.data(_10e, "tree").options;
        if (opts.lines) {
            $(_10e).addClass("tree-lines");
        } else {
            $(_10e).removeClass("tree-lines");
            return;
        }
        if (!_10f) {
            _10f = true;
            $(_10e).find("span.tree-indent").removeClass("tree-line tree-join tree-joinbottom");
            $(_10e).find("div.tree-node").removeClass("tree-node-last tree-root-first tree-root-one");
            var _110 = $(_10e).tree("getRoots");
            if (_110.length > 1) {
                $(_110[0].target).addClass("tree-root-first");
            } else {
                if (_110.length == 1) {
                    $(_110[0].target).addClass("tree-root-one");
                }
            }
        }
        $(ul).children("li").each(function () {
            var node = $(this).children("div.tree-node");
            var ul = node.next("ul");
            if (ul.length) {
                if ($(this).next().length) {
                    _111(node);
                }
                _10d(_10e, ul, _10f);
            } else {
                _112(node);
            }
        });
        var _113 = $(ul).children("li:last").children("div.tree-node").addClass("tree-node-last");
        _113.children("span.tree-join").removeClass("tree-join").addClass("tree-joinbottom");
        function _112(node, _114) {
            var icon = node.find("span.tree-icon");
            icon.prev("span.tree-indent").addClass("tree-join");
        };
        function _111(node) {
            var _115 = node.find("span.tree-indent, span.tree-hit").length;
            node.next().find("div.tree-node").each(function () {
                $(this).children("span:eq(" + (_115 - 1) + ")").addClass("tree-line");
            });
        };
    };
    function _116(_117, ul, _118, _119) {
        var opts = $.data(_117, "tree").options;
        _118 = _118 || {};
        var _11a = null;
        if (_117 != ul) {
            var node = $(ul).prev();
            _11a = _c0(_117, node[0]);
        }
        if (opts.onBeforeLoad.call(_117, _11a, _118) == false) {
            return;
        }
        var _11b = $(ul).prev().children("span.tree-folder");
        _11b.addClass("tree-loading");
        var _11c = opts.loader.call(_117, _118, function (data) {
            _11b.removeClass("tree-loading");
            _101(_117, ul, data);
            if (_119) {
                _119();
            }
        }, function () {
            _11b.removeClass("tree-loading");
            opts.onLoadError.apply(_117, arguments);
            if (_119) {
                _119();
            }
        });
        if (_11c == false) {
            _11b.removeClass("tree-loading");
        }
    };
    function _11d(_11e, _11f, _120) {
        var opts = $.data(_11e, "tree").options;
        var hit = $(_11f).children("span.tree-hit");
        if (hit.length == 0) {
            return;
        }
        if (hit.hasClass("tree-expanded")) {
            return;
        }
        var node = _c0(_11e, _11f);
        if (opts.onBeforeExpand.call(_11e, node) == false) {
            return;
        }
        hit.removeClass("tree-collapsed tree-collapsed-hover").addClass("tree-expanded");
        hit.next().addClass("tree-folder-open");
        var ul = $(_11f).next();
        if (ul.length) {
            if (opts.animate) {
                ul.slideDown("normal", function () {
                    node.state = "open";
                    opts.onExpand.call(_11e, node);
                    if (_120) {
                        _120();
                    }
                });
            } else {
                ul.css("display", "block");
                node.state = "open";
                opts.onExpand.call(_11e, node);
                if (_120) {
                    _120();
                }
            }
        } else {
            var _121 = $("<ul style=\"display:none\"></ul>").insertAfter(_11f);
            _116(_11e, _121[0], { id: node.id }, function () {
                if (_121.is(":empty")) {
                    _121.remove();
                }
                if (opts.animate) {
                    _121.slideDown("normal", function () {
                        node.state = "open";
                        opts.onExpand.call(_11e, node);
                        if (_120) {
                            _120();
                        }
                    });
                } else {
                    _121.css("display", "block");
                    node.state = "open";
                    opts.onExpand.call(_11e, node);
                    if (_120) {
                        _120();
                    }
                }
            });
        }
    };
    function _122(_123, _124) {
        var opts = $.data(_123, "tree").options;
        var hit = $(_124).children("span.tree-hit");
        if (hit.length == 0) {
            return;
        }
        if (hit.hasClass("tree-collapsed")) {
            return;
        }
        var node = _c0(_123, _124);
        if (opts.onBeforeCollapse.call(_123, node) == false) {
            return;
        }
        hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
        hit.next().removeClass("tree-folder-open");
        var ul = $(_124).next();
        if (opts.animate) {
            ul.slideUp("normal", function () {
                node.state = "closed";
                opts.onCollapse.call(_123, node);
            });
        } else {
            ul.css("display", "none");
            node.state = "closed";
            opts.onCollapse.call(_123, node);
        }
    };
    function _125(_126, _127) {
        var hit = $(_127).children("span.tree-hit");
        if (hit.length == 0) {
            return;
        }
        if (hit.hasClass("tree-expanded")) {
            _122(_126, _127);
        } else {
            _11d(_126, _127);
        }
    };
    function _128(_129, _12a) {
        var _12b = _100(_129, _12a);
        if (_12a) {
            _12b.unshift(_c0(_129, _12a));
        }
        for (var i = 0; i < _12b.length; i++) {
            _11d(_129, _12b[i].target);
        }
    };
    function _12c(_12d, _12e) {
        var _12f = [];
        var p = _130(_12d, _12e);
        while (p) {
            _12f.unshift(p);
            p = _130(_12d, p.target);
        }
        for (var i = 0; i < _12f.length; i++) {
            _11d(_12d, _12f[i].target);
        }
    };
    function _131(_132, _133) {
        var c = $(_132).parent();
        while (c[0].tagName != "BODY" && c.css("overflow-y") != "auto") {
            c = c.parent();
        }
        var n = $(_133);
        var ntop = n.offset().top;
        if (c[0].tagName != "BODY") {
            var ctop = c.offset().top;
            if (ntop < ctop) {
                c.scrollTop(c.scrollTop() + ntop - ctop);
            } else {
                if (ntop + n.outerHeight() > ctop + c.outerHeight() - 18) {
                    c.scrollTop(c.scrollTop() + ntop + n.outerHeight() - ctop - c.outerHeight() + 18);
                }
            }
        } else {
            c.scrollTop(ntop);
        }
    };
    function _134(_135, _136) {
        var _137 = _100(_135, _136);
        if (_136) {
            _137.unshift(_c0(_135, _136));
        }
        for (var i = 0; i < _137.length; i++) {
            _122(_135, _137[i].target);
        }
    };
    function _138(_139, _13a) {
        var node = $(_13a.parent);
        var data = _13a.data;
        if (!data) {
            return;
        }
        data = $.isArray(data) ? data : [data];
        if (!data.length) {
            return;
        }
        var ul;
        if (node.length == 0) {
            ul = $(_139);
        } else {
            if (_fc(_139, node[0])) {
                var _13b = node.find("span.tree-icon");
                _13b.removeClass("tree-file").addClass("tree-folder tree-folder-open");
                var hit = $("<span class=\"tree-hit tree-expanded\"></span>").insertBefore(_13b);
                if (hit.prev().length) {
                    hit.prev().remove();
                }
            }
            ul = node.next();
            if (!ul.length) {
                ul = $("<ul></ul>").insertAfter(node);
            }
        }
        _101(_139, ul[0], data, true);
        _f7(_139, ul.prev());
    };
    function _13c(_13d, _13e) {
        var ref = _13e.before || _13e.after;
        var _13f = _130(_13d, ref);
        var data = _13e.data;
        if (!data) {
            return;
        }
        data = $.isArray(data) ? data : [data];
        if (!data.length) {
            return;
        }
        _138(_13d, { parent: (_13f ? _13f.target : null), data: data });
        var _140 = _13f ? _13f.children : $(_13d).tree("getRoots");
        for (var i = 0; i < _140.length; i++) {
            if (_140[i].domId == $(ref).attr("id")) {
                for (var j = data.length - 1; j >= 0; j--) {
                    _140.splice((_13e.before ? i : (i + 1)), 0, data[j]);
                }
                _140.splice(_140.length - data.length, data.length);
                break;
            }
        }
        var li = $();
        for (var i = 0; i < data.length; i++) {
            li = li.add($("#" + data[i].domId).parent());
        }
        if (_13e.before) {
            li.insertBefore($(ref).parent());
        } else {
            li.insertAfter($(ref).parent());
        }
    };
    function _141(_142, _143) {
        var _144 = del(_143);
        $(_143).parent().remove();
        if (_144) {
            if (!_144.children || !_144.children.length) {
                var node = $(_144.target);
                node.find(".tree-icon").removeClass("tree-folder").addClass("tree-file");
                node.find(".tree-hit").remove();
                $("<span class=\"tree-indent\"></span>").prependTo(node);
                node.next().remove();
            }
            _108(_142, _144);
            _f7(_142, _144.target);
        }
        _10d(_142, _142);
        function del(_145) {
            var id = $(_145).attr("id");
            var _146 = _130(_142, _145);
            var cc = _146 ? _146.children : $.data(_142, "tree").data;
            for (var i = 0; i < cc.length; i++) {
                if (cc[i].domId == id) {
                    cc.splice(i, 1);
                    break;
                }
            }
            return _146;
        };
    };
    function _108(_147, _148) {
        var opts = $.data(_147, "tree").options;
        var node = $(_148.target);
        var data = _c0(_147, _148.target);
        var _149 = data.checked;
        if (data.iconCls) {
            node.find(".tree-icon").removeClass(data.iconCls);
        }
        $.extend(data, _148);
        node.find(".tree-title").html(opts.formatter.call(_147, data));
        if (data.iconCls) {
            node.find(".tree-icon").addClass(data.iconCls);
        }
        if (_149 != data.checked) {
            _e8(_147, _148.target, data.checked);
        }
    };
    function _14a(_14b) {
        var _14c = _14d(_14b);
        return _14c.length ? _14c[0] : null;
    };
    function _14d(_14e) {
        var _14f = $.data(_14e, "tree").data;
        for (var i = 0; i < _14f.length; i++) {
            _150(_14f[i]);
        }
        return _14f;
    };
    function _100(_151, _152) {
        var _153 = [];
        var n = _c0(_151, _152);
        var data = n ? n.children : $.data(_151, "tree").data;
        _10b(data, function (node) {
            _153.push(_150(node));
        });
        return _153;
    };
    function _130(_154, _155) {
        var p = $(_155).closest("ul").prevAll("div.tree-node:first");
        return _c0(_154, p[0]);
    };
    function _156(_157, _158) {
        _158 = _158 || "checked";
        if (!$.isArray(_158)) {
            _158 = [_158];
        }
        var _159 = [];
        for (var i = 0; i < _158.length; i++) {
            var s = _158[i];
            if (s == "checked") {
                _159.push("span.tree-checkbox1");
            } else {
                if (s == "unchecked") {
                    _159.push("span.tree-checkbox0");
                } else {
                    if (s == "indeterminate") {
                        _159.push("span.tree-checkbox2");
                    }
                }
            }
        }
        var _15a = [];
        $(_157).find(_159.join(",")).each(function () {
            var node = $(this).parent();
            _15a.push(_c0(_157, node[0]));
        });
        return _15a;
    };
    function _15b(_15c) {
        var node = $(_15c).find("div.tree-node-selected");
        return node.length ? _c0(_15c, node[0]) : null;
    };
    function _15d(_15e, _15f) {
        var data = _c0(_15e, _15f);
        if (data && data.children) {
            _10b(data.children, function (node) {
                _150(node);
            });
        }
        return data;
    };
    function _c0(_160, _161) {
        return _107(_160, "domId", $(_161).attr("id"));
    };
    function _162(_163, id) {
        return _107(_163, "id", id);
    };
    function _107(_164, _165, _166) {
        var data = $.data(_164, "tree").data;
        var _167 = null;
        _10b(data, function (node) {
            if (node[_165] == _166) {
                _167 = _150(node);
                return false;
            }
        });
        return _167;
    };
    function _150(node) {
        var d = $("#" + node.domId);
        node.target = d[0];
        node.checked = d.find(".tree-checkbox").hasClass("tree-checkbox1");
        return node;
    };
    function _10b(data, _168) {
        var _169 = [];
        for (var i = 0; i < data.length; i++) {
            _169.push(data[i]);
        }
        while (_169.length) {
            var node = _169.shift();
            if (_168(node) == false) {
                return;
            }
            if (node.children) {
                for (var i = node.children.length - 1; i >= 0; i--) {
                    _169.unshift(node.children[i]);
                }
            }
        }
    };
    function _16a(_16b, _16c) {
        var opts = $.data(_16b, "tree").options;
        var node = _c0(_16b, _16c);
        if (opts.onBeforeSelect.call(_16b, node) == false) {
            return;
        }
        $(_16b).find("div.tree-node-selected").removeClass("tree-node-selected");
        $(_16c).addClass("tree-node-selected");
        opts.onSelect.call(_16b, node);
    };
    function _fc(_16d, _16e) {
        return $(_16e).children("span.tree-hit").length == 0;
    };
    function _16f(_170, _171) {
        var opts = $.data(_170, "tree").options;
        var node = _c0(_170, _171);
        if (opts.onBeforeEdit.call(_170, node) == false) {
            return;
        }
        $(_171).css("position", "relative");
        var nt = $(_171).find(".tree-title");
        var _172 = nt.outerWidth();
        nt.empty();
        var _173 = $("<input class=\"tree-editor\">").appendTo(nt);
        _173.val(node.text).focus();
        _173.width(_172 + 20);
        _173.height(document.compatMode == "CSS1Compat" ? (18 - (_173.outerHeight() - _173.height())) : 18);
        _173.bind("click", function (e) {
            return false;
        }).bind("mousedown", function (e) {
            e.stopPropagation();
        }).bind("mousemove", function (e) {
            e.stopPropagation();
        }).bind("keydown", function (e) {
            if (e.keyCode == 13) {
                _174(_170, _171);
                return false;
            } else {
                if (e.keyCode == 27) {
                    _178(_170, _171);
                    return false;
                }
            }
        }).bind("blur", function (e) {
            e.stopPropagation();
            _174(_170, _171);
        });
    };
    function _174(_175, _176) {
        var opts = $.data(_175, "tree").options;
        $(_176).css("position", "");
        var _177 = $(_176).find("input.tree-editor");
        var val = _177.val();
        _177.remove();
        var node = _c0(_175, _176);
        node.text = val;
        _108(_175, node);
        opts.onAfterEdit.call(_175, node);
    };
    function _178(_179, _17a) {
        var opts = $.data(_179, "tree").options;
        $(_17a).css("position", "");
        $(_17a).find("input.tree-editor").remove();
        var node = _c0(_179, _17a);
        _108(_179, node);
        opts.onCancelEdit.call(_179, node);
    };
    $.fn.tree = function (_17b, _17c) {
        if (typeof _17b == "string") {
            return $.fn.tree.methods[_17b](this, _17c);
        }
        var _17b = _17b || {};
        return this.each(function () {
            var _17d = $.data(this, "tree");
            var opts;
            if (_17d) {
                opts = $.extend(_17d.options, _17b);
                _17d.options = opts;
            } else {
                opts = $.extend({}, $.fn.tree.defaults, $.fn.tree.parseOptions(this), _17b);
                $.data(this, "tree", { options: opts, tree: _b5(this), data: [] });
                var data = $.fn.tree.parseData(this);
                if (data.length) {
                    _101(this, this, data);
                }
            }
            _b8(this);
            if (opts.data) {
                _101(this, this, $.extend(true, [], opts.data));
            }
            _116(this, this);
        });
    };
    $.fn.tree.methods = {
        options: function (jq) {
            return $.data(jq[0], "tree").options;
        }, loadData: function (jq, data) {
            return jq.each(function () {
                _101(this, this, data);
            });
        }, getNode: function (jq, _17e) {
            return _c0(jq[0], _17e);
        }, getData: function (jq, _17f) {
            return _15d(jq[0], _17f);
        }, reload: function (jq, _180) {
            return jq.each(function () {
                if (_180) {
                    var node = $(_180);
                    var hit = node.children("span.tree-hit");
                    hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
                    node.next().remove();
                    _11d(this, _180);
                } else {
                    $(this).empty();
                    _116(this, this);
                }
            });
        }, getRoot: function (jq) {
            return _14a(jq[0]);
        }, getRoots: function (jq) {
            return _14d(jq[0]);
        }, getParent: function (jq, _181) {
            return _130(jq[0], _181);
        }, getChildren: function (jq, _182) {
            return _100(jq[0], _182);
        }, getChecked: function (jq, _183) {
            return _156(jq[0], _183);
        }, getSelected: function (jq) {
            return _15b(jq[0]);
        }, isLeaf: function (jq, _184) {
            return _fc(jq[0], _184);
        }, find: function (jq, id) {
            return _162(jq[0], id);
        }, select: function (jq, _185) {
            return jq.each(function () {
                _16a(this, _185);
            });
        }, check: function (jq, _186) {
            return jq.each(function () {
                _e8(this, _186, true);
            });
        }, uncheck: function (jq, _187) {
            return jq.each(function () {
                _e8(this, _187, false);
            });
        }, collapse: function (jq, _188) {
            return jq.each(function () {
                _122(this, _188);
            });
        }, expand: function (jq, _189) {
            return jq.each(function () {
                _11d(this, _189);
            });
        }, collapseAll: function (jq, _18a) {
            return jq.each(function () {
                _134(this, _18a);
            });
        }, expandAll: function (jq, _18b) {
            return jq.each(function () {
                _128(this, _18b);
            });
        }, expandTo: function (jq, _18c) {
            return jq.each(function () {
                _12c(this, _18c);
            });
        }, scrollTo: function (jq, _18d) {
            return jq.each(function () {
                _131(this, _18d);
            });
        }, toggle: function (jq, _18e) {
            return jq.each(function () {
                _125(this, _18e);
            });
        }, append: function (jq, _18f) {
            return jq.each(function () {
                _138(this, _18f);
            });
        }, insert: function (jq, _190) {
            return jq.each(function () {
                _13c(this, _190);
            });
        }, remove: function (jq, _191) {
            return jq.each(function () {
                _141(this, _191);
            });
        }, pop: function (jq, _192) {
            var node = jq.tree("getData", _192);
            jq.tree("remove", _192);
            return node;
        }, update: function (jq, _193) {
            return jq.each(function () {
                _108(this, _193);
            });
        }, enableDnd: function (jq) {
            return jq.each(function () {
                _c5(this);
            });
        }, disableDnd: function (jq) {
            return jq.each(function () {
                _c1(this);
            });
        }, beginEdit: function (jq, _194) {
            return jq.each(function () {
                _16f(this, _194);
            });
        }, endEdit: function (jq, _195) {
            return jq.each(function () {
                _174(this, _195);
            });
        }, cancelEdit: function (jq, _196) {
            return jq.each(function () {
                _178(this, _196);
            });
        }
    };
    $.fn.tree.parseOptions = function (_197) {
        var t = $(_197);
        return $.extend({}, $.parser.parseOptions(_197, ["url", "method", { checkbox: "boolean", cascadeCheck: "boolean", onlyLeafCheck: "boolean" }, { animate: "boolean", lines: "boolean", dnd: "boolean" }]));
    };
    $.fn.tree.parseData = function (_198) {
        var data = [];
        _199(data, $(_198));
        return data;
        function _199(aa, tree) {
            tree.children("li").each(function () {
                var node = $(this);
                var item = $.extend({}, $.parser.parseOptions(this, ["id", "iconCls", "state"]), { checked: (node.attr("checked") ? true : undefined) });
                item.text = node.children("span").html();
                if (!item.text) {
                    item.text = node.html();
                }
                var _19a = node.children("ul");
                if (_19a.length) {
                    item.children = [];
                    _199(item.children, _19a);
                }
                aa.push(item);
            });
        };
    };
    var _19b = 1;
    var _19c = {
        render: function (_19d, ul, data) {
            var opts = $.data(_19d, "tree").options;
            var virtualNode=$("<div id=\"virtual-node\" class=\"tree-node\" style=\"position:absolute;top:-1000px\">").appendTo('body'); //cryze 2018-09-05 创建一个隐藏着的tree-node 来计算高度
            var _19e = $(ul).prev("div.tree-node").find("span.tree-indent, span.tree-hit").length;
            var cc = _19f(_19e, data);
            $(ul).append(cc.join(""));
            virtualNode.remove();  //cryze 2018-09-05 用完移除
            function _19f(_1a0, _1a1) {
                var cc = [];
                for (var i = 0; i < _1a1.length; i++) {
                    var item = _1a1[i];
                    
                    if (opts.lines && opts.autoNodeHeight){   //cryze 2018-09-05 根据formatter返回计算高度
                        //获取高度
                        virtualNode.empty();
                        var nodeHeight=$("<span class=\"tree-title\">" + opts.formatter.call(_19d, item) + "</span>").appendTo(virtualNode).height();
                    }else{
                        var nodeHeight=0;
                    }

                    if (item.state != "open" && item.state != "closed") {
                        item.state = "open";
                    }
                    item.domId = "_hisui_tree_" + _19b++;
                    cc.push("<li>");
                    cc.push("<div id=\"" + item.domId + "\" class=\"tree-node\">");
                    for (var j = 0; j < _1a0; j++) {
                        cc.push("<span class=\"tree-indent\" "+(nodeHeight>0?('style="height:'+nodeHeight+'px"'):'')+"></span>");   //cryze 2018-09-05 高度
                    }
                    var _1a2 = false;
                    if (item.state == "closed") {
                        cc.push("<span class=\"tree-hit tree-collapsed\" "+(nodeHeight>0?('style="height:'+nodeHeight+'px"'):'')+"></span>");
                        if (nodeHeight>0){ //cryze 2018-09-05 高度
                            cc.push("<span class=\"tree-icon tree-folder tree-icon-lines\" style=\"height:"+nodeHeight+"px\"></span>");                    
                        }else{
                            cc.push("<span class=\"tree-icon tree-folder " + (item.iconCls ? item.iconCls : "") + "\"></span>");
                        }
                        
                    } else {
                        if (item.children && item.children.length) {
                            cc.push("<span class=\"tree-hit tree-expanded\" "+(nodeHeight>0?('style="height:'+nodeHeight+'px"'):'')+"></span>");
                            if(nodeHeight>0){ //cryze 2018-09-05 高度
                                cc.push("<span class=\"tree-icon tree-folder tree-folder-open tree-icon-lines\" style=\"height:"+nodeHeight+"px\"></span>");
                            }else{
                                cc.push("<span class=\"tree-icon tree-folder tree-folder-open " + (item.iconCls ? item.iconCls : "") + "\"></span>");
                            }
                            
                        } else {
                            cc.push("<span class=\"tree-indent\" "+(nodeHeight>0?('style="height:'+nodeHeight+'px"'):'')+"></span>");
                            if(nodeHeight>0){ //cryze 2018-09-05 高度
                                cc.push("<span class=\"tree-icon tree-file tree-icon-lines\" style=\"height:"+nodeHeight+"px\"></span>");
                            }else{
                                cc.push("<span class=\"tree-icon tree-file " + (item.iconCls ? item.iconCls : "") + "\"></span>");
                            }
                            
                            _1a2 = true;
                        }
                    }
                    if (opts.checkbox) {
                        if ((!opts.onlyLeafCheck) || _1a2) {
                            cc.push("<span class=\"tree-checkbox tree-checkbox0\"></span>");
                        }
                    }
                    cc.push("<span class=\"tree-title\">" + opts.formatter.call(_19d, item) + "</span>");
                    cc.push("</div>");
                    if (item.children && item.children.length) {
                        var tmp = _19f(_1a0 + 1, item.children);
                        cc.push("<ul style=\"display:" + (item.state == "closed" ? "none" : "block") + "\">");
                        cc = cc.concat(tmp);
                        cc.push("</ul>");
                    }
                    cc.push("</li>");
                }
                return cc;
            };
        }
    };
    $.fn.tree.defaults = {
        url: null, method: "post", animate: false, checkbox: false, cascadeCheck: true, onlyLeafCheck: false, lines: false, dnd: false, data: null, formatter: function (node) {
            return node.text;
        }, loader: function (_1a3, _1a4, _1a5) {
            var opts = $(this).tree("options");
            if (!opts.url) {
                return false;
            }
            $.ajax({
                type: opts.method, url: opts.url, data: _1a3, dataType: "json", success: function (data) {
                    _1a4(data);
                }, error: function () {
                    _1a5.apply(this, arguments);
                }
            });
        }, loadFilter: function (data, _1a6) {
            return data;
        }, view: _19c, onBeforeLoad: function (node, _1a7) {
        }, onLoadSuccess: function (node, data) {
        }, onLoadError: function () {
        }, onClick: function (node) {
        }, onDblClick: function (node) {
        }, onBeforeExpand: function (node) {
        }, onExpand: function (node) {
        }, onBeforeCollapse: function (node) {
        }, onCollapse: function (node) {
        }, onBeforeCheck: function (node, _1a8) {
        }, onCheck: function (node, _1a9) {
        }, onBeforeSelect: function (node) {
        }, onSelect: function (node) {
        }, onContextMenu: function (e, node) {
        }, onBeforeDrag: function (node) {
        }, onStartDrag: function (node) {
        }, onStopDrag: function (node) {
        }, onDragEnter: function (_1aa, _1ab) {
        }, onDragOver: function (_1ac, _1ad) {
        }, onDragLeave: function (_1ae, _1af) {
        }, onBeforeDrop: function (_1b0, _1b1, _1b2) {
        }, onDrop: function (_1b3, _1b4, _1b5) {
        }, onBeforeEdit: function (node) {
        }, onAfterEdit: function (node) {
        }, onCancelEdit: function (node) {
        }, autoNodeHeight:false
    };
})(jQuery);
(function ($) {
    function init(target) {
        $(target).addClass("progressbar");
        $(target).html("<div class=\"progressbar-text\"></div><div class=\"progressbar-value\"><div class=\"progressbar-text\"></div></div>");
        return $(target);
    };
    function setSize(target, width) {
        var opts = $.data(target, "progressbar").options;
        var bar = $.data(target, "progressbar").bar;
        if (width) {
            opts.width = width;
        }
        bar._outerWidth(opts.width)._outerHeight(opts.height);
        bar.find("div.progressbar-text").width(bar.width());
        bar.find("div.progressbar-text,div.progressbar-value").css({ height: bar.height() + "px", lineHeight: bar.height() + "px" });
    };
    $.fn.progressbar = function (options, param) {
        if (typeof options == "string") {
            var method = $.fn.progressbar.methods[options];
            if (method) {
                return method(this, param);
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "progressbar");
            if (state) {
                $.extend(state.options, options);
            } else {
                state = $.data(this, "progressbar", { options: $.extend({}, $.fn.progressbar.defaults, $.fn.progressbar.parseOptions(this), options), bar: init(this) });
            }
            $(this).progressbar("setValue", state.options.value);
            setSize(this);
        });
    };
    $.fn.progressbar.methods = {
        options: function (jq) {
            return $.data(jq[0], "progressbar").options;
        }, resize: function (jq, width) {
            return jq.each(function () {
                setSize(this, width);
            });
        }, getValue: function (jq) {
            return $.data(jq[0], "progressbar").options.value;
        }, setValue: function (jq, value) {
            if (value < 0) {
                value = 0;
            }
            if (value > 100) {
                value = 100;
            }
            return jq.each(function () {
                var opts = $.data(this, "progressbar").options;
                var text = opts.text.replace(/{value}/, value);
                var oldValue = opts.value;
                opts.value = value;
                $(this).find("div.progressbar-value").width(value + "%");
                $(this).find("div.progressbar-text").html(text);
                if (oldValue != value) {
                    opts.onChange.call(this, value, oldValue);
                }
            });
        }
    };
    $.fn.progressbar.parseOptions = function (target) {
        return $.extend({}, $.parser.parseOptions(target, ["width", "height", "text", { value: "number" }]));
    };
    $.fn.progressbar.defaults = {
        width: "auto", height: 22, value: 0, text: "{value}%", onChange: function (newValue, oldValue) {
        }
    };
})(jQuery);
(function ($) {
    function init(_1c4) {
        $(_1c4).addClass("tooltip-f");
    };
    function _1c5(_1c6) {
        var opts = $.data(_1c6, "tooltip").options;
        $(_1c6).unbind(".tooltip").bind(opts.showEvent + ".tooltip", function (e) {
            _1cd(_1c6, e);
        }).bind(opts.hideEvent + ".tooltip", function (e) {
            _1d3(_1c6, e);
        }).bind("mousemove.tooltip", function (e) {
            if (opts.trackMouse) {
                opts.trackMouseX = e.pageX;
                opts.trackMouseY = e.pageY;
                _1c7(_1c6);
            }
        });
    };
    function _1c8(_1c9) {
        var _1ca = $.data(_1c9, "tooltip");
        if (_1ca.showTimer) {
            clearTimeout(_1ca.showTimer);
            _1ca.showTimer = null;
        }
        if (_1ca.hideTimer) {
            clearTimeout(_1ca.hideTimer);
            _1ca.hideTimer = null;
        }
    };
    function _1c7(_1cb) {
        var _1cc = $.data(_1cb, "tooltip");
        if (!_1cc || !_1cc.tip) {
            return;
        }
        var opts = _1cc.options;
        var tip = _1cc.tip;
        if (opts.trackMouse) {
            t = $();
            var left = opts.trackMouseX + opts.deltaX;
            var top = opts.trackMouseY + opts.deltaY;
        } else {
            var t = $(_1cb);
            var left = t.offset().left + opts.deltaX;
            var top = t.offset().top + opts.deltaY;
        }
        switch (opts.position) {
            case "right":
                left += t._outerWidth() + 12 + (opts.trackMouse ? 12 : 0);
                top -= (tip._outerHeight() - t._outerHeight()) / 2;
                break;
            case "left":
                left -= tip._outerWidth() + 12 + (opts.trackMouse ? 12 : 0);
                top -= (tip._outerHeight() - t._outerHeight()) / 2;
                break;
            case "top":
                left -= (tip._outerWidth() - t._outerWidth()) / 2;
                top -= tip._outerHeight() + 12 + (opts.trackMouse ? 12 : 0);
                break;
            case "bottom":
                left -= (tip._outerWidth() - t._outerWidth()) / 2;
                top += t._outerHeight() + 12 + (opts.trackMouse ? 12 : 0);
                break;
        }
        if (!$(_1cb).is(":visible")) {
            left = -100000;
            top = -100000;
        }
        tip.css({ left: left, top: top, zIndex: (opts.zIndex != undefined ? opts.zIndex : ($.fn.window ? $.fn.window.defaults.zIndex++ : "")) });
        opts.onPosition.call(_1cb, left, top);
    };
    function _1cd(_1ce, e) {
        var _1cf = $.data(_1ce, "tooltip");
        var opts = _1cf.options;
        var tip = _1cf.tip;
        if (!tip) {
            tip = $("<div tabindex=\"-1\" class=\"tooltip\">" + "<div class=\"tooltip-content\"></div>" + "<div class=\"tooltip-arrow-outer\"></div>" + "<div class=\"tooltip-arrow\"></div>" + "</div>").appendTo("body");
            _1cf.tip = tip;
            _1d0(_1ce);
        }
        tip.removeClass("tooltip-top tooltip-bottom tooltip-left tooltip-right").addClass("tooltip-" + opts.position);
        _1c8(_1ce);
        _1cf.showTimer = setTimeout(function () {
            _1c7(_1ce);
            tip.show();
            opts.onShow.call(_1ce, e);
            var _1d1 = tip.children(".tooltip-arrow-outer");
            var _1d2 = tip.children(".tooltip-arrow");
            var bc = "border-" + opts.position + "-color";
            _1d1.add(_1d2).css({ borderTopColor: "", borderBottomColor: "", borderLeftColor: "", borderRightColor: "" });
            _1d1.css(bc, tip.css(bc));
            _1d2.css(bc, tip.css("backgroundColor"));
        }, opts.showDelay);
    };
    function _1d3(_1d4, e) {
        var _1d5 = $.data(_1d4, "tooltip");
        if (_1d5 && _1d5.tip) {
            _1c8(_1d4);
            _1d5.hideTimer = setTimeout(function () {
                _1d5.tip.hide();
                _1d5.options.onHide.call(_1d4, e);
            }, _1d5.options.hideDelay);
        }
    };
    function _1d0(_1d6, _1d7) {
        var _1d8 = $.data(_1d6, "tooltip");
        var opts = _1d8.options;
        if (_1d7) {
            opts.content = _1d7;
        }
        if (!_1d8.tip) {
            return;
        }
        var cc = typeof opts.content == "function" ? opts.content.call(_1d6) : opts.content;
        _1d8.tip.children(".tooltip-content").html(cc);
        opts.onUpdate.call(_1d6, cc);
    };
    function _1d9(_1da) {
        var _1db = $.data(_1da, "tooltip");
        if (_1db) {
            _1c8(_1da);
            var opts = _1db.options;
            if (_1db.tip) {
                _1db.tip.remove();
            }
            if (opts._title) {
                $(_1da).attr("title", opts._title);
            }
            $.removeData(_1da, "tooltip");
            $(_1da).unbind(".tooltip").removeClass("tooltip-f");
            opts.onDestroy.call(_1da);
        }
    };
    $.fn.tooltip = function (_1dc, _1dd) {
        if (typeof _1dc == "string") {
            return $.fn.tooltip.methods[_1dc](this, _1dd);
        }
        _1dc = _1dc || {};
        return this.each(function () {
            var _1de = $.data(this, "tooltip");
            if (_1de) {
                $.extend(_1de.options, _1dc);
            } else {
                $.data(this, "tooltip", { options: $.extend({}, $.fn.tooltip.defaults, $.fn.tooltip.parseOptions(this), _1dc) });
                init(this);
            }
            _1c5(this);
            _1d0(this);
        });
    };
    $.fn.tooltip.methods = {
        options: function (jq) {
            return $.data(jq[0], "tooltip").options;
        }, tip: function (jq) {
            return $.data(jq[0], "tooltip").tip;
        }, arrow: function (jq) {
            return jq.tooltip("tip").children(".tooltip-arrow-outer,.tooltip-arrow");
        }, show: function (jq, e) {
            return jq.each(function () {
                _1cd(this, e);
            });
        }, hide: function (jq, e) {
            return jq.each(function () {
                _1d3(this, e);
            });
        }, update: function (jq, _1df) {
            return jq.each(function () {
                _1d0(this, _1df);
            });
        }, reposition: function (jq) {
            return jq.each(function () {
                _1c7(this);
            });
        }, destroy: function (jq) {
            return jq.each(function () {
                _1d9(this);
            });
        }
    };
    $.fn.tooltip.parseOptions = function (_1e0) {
        var t = $(_1e0);
        var opts = $.extend({}, $.parser.parseOptions(_1e0, ["position", "showEvent", "hideEvent", "content", { deltaX: "number", deltaY: "number", showDelay: "number", hideDelay: "number" }]), { _title: t.attr("title") });
        t.attr("title", "");
        if (!opts.content) {
            opts.content = opts._title;
        }
        return opts;
    };
    $.fn.tooltip.defaults = {
        position: "bottom", content: null, trackMouse: false, deltaX: 0, deltaY: 0, showEvent: "mouseenter", hideEvent: "mouseleave", showDelay: 200, hideDelay: 100, onShow: function (e) {
        }, onHide: function (e) {
        }, onUpdate: function (_1e1) {
        }, onPosition: function (left, top) {
        }, onDestroy: function () {
        }
    };
})(jQuery);
(function ($) {
    $.fn._remove = function () {
        return this.each(function () {
            $(this).remove();
            try {
                this.outerHTML = "";
            }
            catch (err) {
            }
        });
    };
    function _1e2(node) {
        node._remove();
    };
    function _1e3(_1e4, _1e5) {
        var opts = $.data(_1e4, "panel").options;
        var _1e6 = $.data(_1e4, "panel").panel;
        var _1e7 = _1e6.children("div.panel-header");
        var _1e8 = _1e6.children("div.panel-body");
        if (_1e5) {
            $.extend(opts, { width: _1e5.width, height: _1e5.height, left: _1e5.left, top: _1e5.top });
        }
        opts.fit ? $.extend(opts, _1e6._fit()) : _1e6._fit(false);
        _1e6.css({ left: opts.left, top: opts.top });
        if (!isNaN(opts.width)) {
            _1e6._outerWidth(opts.width);
        } else {
            _1e6.width("auto");
        }
        _1e7.add(_1e8)._outerWidth(_1e6.width());
        //wanghc card--
        if (null!=opts.headerCls && "undefined"!=typeof opts.headerCls && opts.headerCls.indexOf("panel-header-card") > -1) {
            if (null!=opts.titleWidth && "undefined"!=typeof opts.titleWidth) {
                _1e7.width(opts.titleWidth);
            }else{
                var headText = _1e7.find(".panel-title").text();
                if (headText.length<=4){
                    _1e7.width(80);
                }else{
                    _1e7.width(headText.length*20);
                }
            }
        }
        if (!isNaN(opts.height)) {
            _1e6._outerHeight(opts.height);
            _1e8._outerHeight(_1e6.height() - _1e7._outerHeight());
        } else {
            _1e8.height("auto");
        }
        _1e6.css("height", "");
        opts.onResize.apply(_1e4, [opts.width, opts.height]);
        $(_1e4).find(">div:visible,>form>div:visible").triggerHandler("_resize");
    };
    function _1e9(_1ea, _1eb) {
        var opts = $.data(_1ea, "panel").options;
        var _1ec = $.data(_1ea, "panel").panel;
        if (_1eb) {
            if (_1eb.left != null) {
                opts.left = _1eb.left;
            }
            if (_1eb.top != null) {
                opts.top = _1eb.top;
            }
        }
        _1ec.css({ left: opts.left, top: opts.top });
        opts.onMove.apply(_1ea, [opts.left, opts.top]);
    };
    function _1ed(_1ee) {
        $(_1ee).addClass("panel-body");
        var _1ef = $("<div class=\"panel\"></div>").insertBefore(_1ee);
        _1ef[0].appendChild(_1ee);
        _1ef.bind("_resize", function () {
            var opts = $.data(_1ee, "panel").options;
            if (opts.fit == true) {
                _1e3(_1ee);
            }
            return false;
        });
        return _1ef;
    };
    function _1f0(_1f1) {
        var opts = $.data(_1f1, "panel").options;
        var _1f2 = $.data(_1f1, "panel").panel;
        if (opts.tools && typeof opts.tools == "string") {
            _1f2.find(">div.panel-header>div.panel-tool .panel-tool-a").appendTo(opts.tools);
        }
        _1e2(_1f2.children("div.panel-header"));
        if (opts.title && !opts.noheader) {
            var _1f3 = $("<div class=\"panel-header\"><div class=\"panel-title\">" + opts.title + "</div></div>").prependTo(_1f2);
            if (opts.iconCls) {
                _1f3.find(".panel-title").addClass("panel-with-icon");
                $("<div class=\"panel-icon\"></div>").addClass(opts.iconCls).appendTo(_1f3);
            }
            var tool = $("<div class=\"panel-tool\"></div>").appendTo(_1f3);
            tool.bind("click", function (e) {
                e.stopPropagation();
            });
            if (opts.tools) {
                if ($.isArray(opts.tools)) {
                    for (var i = 0; i < opts.tools.length; i++) {
                        var t = $("<a href=\"javascript:void(0)\"></a>").addClass(opts.tools[i].iconCls).appendTo(tool);
                        if (opts.tools[i].handler) {
                            t.bind("click", eval(opts.tools[i].handler));
                        }
                    }
                } else {
                    $(opts.tools).children().each(function () {
                        $(this).addClass($(this).attr("iconCls")).addClass("panel-tool-a").appendTo(tool);
                    });
                }
            }
            if (opts.collapsible) {
                $("<a class=\"panel-tool-collapse\" href=\"javascript:void(0)\"></a>").appendTo(tool).bind("click", function () {
                    if (opts.collapsed == true) {
                        _210(_1f1, true);
                    } else {
                        _205(_1f1, true);
                    }
                    return false;
                });
            }
            if (opts.minimizable) {
                $("<a class=\"panel-tool-min\" href=\"javascript:void(0)\"></a>").appendTo(tool).bind("click", function () {
                    _216(_1f1);
                    return false;
                });
            }
            if (opts.maximizable) {
                $("<a class=\"panel-tool-max\" href=\"javascript:void(0)\"></a>").appendTo(tool).bind("click", function () {
                    if (opts.maximized == true) {
                        _219(_1f1);
                    } else {
                        _204(_1f1);
                    }
                    return false;
                });
            }
            if (opts.closable) {
                $("<a class=\"panel-tool-close\" href=\"javascript:void(0)\"></a>").appendTo(tool).bind("click", function () {
                    _1f4(_1f1);
                    return false;
                });
            }
            _1f2.children("div.panel-body").removeClass("panel-body-noheader");
        } else {
            _1f2.children("div.panel-body").addClass("panel-body-noheader");
        }
        var ocxFrame="";
        if (opts.isTopZindex){ //modify panel 使window,dialog,alert,confirm,prompt,progress都支持isTopZindex属性 by wanghc 2018-6-21 
            ocxFrame = '<iframe style="position:absolute;z-index:-1;width:100%;height:100%;top:0;left:0;scrolling:no;" frameborder="0"></iframe>';
            _1f2.prepend(ocxFrame);
        }
    };
    function _1f5(_1f6, _1f7) {
        var _1f8 = $.data(_1f6, "panel");
        var opts = _1f8.options;
        if (_1f9) {
            opts.queryParams = _1f7;
        }
        if (opts.href) {
            if (!_1f8.isLoaded || !opts.cache) {
                var _1f9 = $.extend({}, opts.queryParams);
                if (opts.onBeforeLoad.call(_1f6, _1f9) == false) {
                    return;
                }
                _1f8.isLoaded = false;
                _1fa(_1f6);
                if (opts.loadingMessage) {
                    $(_1f6).html($("<div class=\"panel-loading\"></div>").html(opts.loadingMessage));
                }
                opts.loader.call(_1f6, _1f9, function (data) {
                    _1fb(opts.extractor.call(_1f6, data));
                    opts.onLoad.apply(_1f6, arguments);
                    _1f8.isLoaded = true;
                }, function () {
                    opts.onLoadError.apply(_1f6, arguments);
                });
            }
        } else {
            if (opts.content) {
                if (!_1f8.isLoaded) {
                    _1fa(_1f6);
                    _1fb(opts.content);
                    _1f8.isLoaded = true;
                }
            }
        }
        function _1fb(_1fc) {
            $(_1f6).html(_1fc);
            $.parser.parse($(_1f6));
        };
    };
    function _1fa(_1fd) {
        var t = $(_1fd);
        t.find(".combo-f").each(function () {
            $(this).combo("destroy");
        });
        t.find(".m-btn").each(function () {
            $(this).menubutton("destroy");
        });
        t.find(".s-btn").each(function () {
            $(this).splitbutton("destroy");
        });
        t.find(".tooltip-f").each(function () {
            $(this).tooltip("destroy");
        });
        t.children("div").each(function () {
            $(this)._fit(false);
        });
    };
    function _1fe(_1ff) {
        $(_1ff).find("div.panel:visible,div.accordion:visible,div.tabs-container:visible,div.layout:visible").each(function () {
            $(this).triggerHandler("_resize", [true]);
        });
    };
    function _200(_201, _202) {
        var opts = $.data(_201, "panel").options;
        var _203 = $.data(_201, "panel").panel;
        if (_202 != true) {
            if (opts.onBeforeOpen.call(_201) == false) {
                return;
            }
        }
        _203.show();
        opts.closed = false;
        opts.minimized = false;
        var tool = _203.children("div.panel-header").find("a.panel-tool-restore");
        if (tool.length) {
            opts.maximized = true;
        }
        opts.onOpen.call(_201);
        if (opts.maximized == true) {
            opts.maximized = false;
            _204(_201);
        }
        if (opts.collapsed == true) {
            opts.collapsed = false;
            _205(_201);
        }
        if (!opts.collapsed) {
            _1f5(_201);
            _1fe(_201);
        }
    };
    function _1f4(_206, _207) {
        var opts = $.data(_206, "panel").options;
        var _208 = $.data(_206, "panel").panel;
        if (_207 != true) {
            if (opts.onBeforeClose.call(_206) == false) {
                return;
            }
        }
        _208._fit(false);
        _208.hide();
        opts.closed = true;
        opts.onClose.call(_206);
    };
    function _209(_20a, _20b) {
        var opts = $.data(_20a, "panel").options;
        var _20c = $.data(_20a, "panel").panel;
        if (_20b != true) {
            if (opts.onBeforeDestroy.call(_20a) == false) {
                return;
            }
        }
        _1fa(_20a);
        _1e2(_20c);
        opts.onDestroy.call(_20a);
    };
    function _205(_20d, _20e) {
        var opts = $.data(_20d, "panel").options;
        var _20f = $.data(_20d, "panel").panel;
        var body = _20f.children("div.panel-body");
        var tool = _20f.children("div.panel-header").find("a.panel-tool-collapse");
        if (opts.collapsed == true) {
            return;
        }
        body.stop(true, true);
        if (opts.onBeforeCollapse.call(_20d) == false) {
            return;
        }
        tool.addClass("panel-tool-expand");
        if (_20e == true) {
            body.slideUp("normal", function () {
                opts.collapsed = true;
                opts.onCollapse.call(_20d);
            });
        } else {
            body.hide();
            opts.collapsed = true;
            opts.onCollapse.call(_20d);
        }
    };
    function _210(_211, _212) {
        var opts = $.data(_211, "panel").options;
        var _213 = $.data(_211, "panel").panel;
        var body = _213.children("div.panel-body");
        var tool = _213.children("div.panel-header").find("a.panel-tool-collapse");
        if (opts.collapsed == false) {
            return;
        }
        body.stop(true, true);
        if (opts.onBeforeExpand.call(_211) == false) {
            return;
        }
        tool.removeClass("panel-tool-expand");
        if (_212 == true) {
            body.slideDown("normal", function () {
                opts.collapsed = false;
                opts.onExpand.call(_211);
                _1f5(_211);
                _1fe(_211);
            });
        } else {
            body.show();
            opts.collapsed = false;
            opts.onExpand.call(_211);
            _1f5(_211);
            _1fe(_211);
        }
    };
    function _204(_214) {
        var opts = $.data(_214, "panel").options;
        var _215 = $.data(_214, "panel").panel;
        var tool = _215.children("div.panel-header").find("a.panel-tool-max");
        if (opts.maximized == true) {
            return;
        }
        tool.addClass("panel-tool-restore");
        if (!$.data(_214, "panel").original) {
            $.data(_214, "panel").original = { width: opts.width, height: opts.height, left: opts.left, top: opts.top, fit: opts.fit };
        }
        opts.left = 0;
        opts.top = 0;
        opts.fit = true;
        _1e3(_214);
        opts.minimized = false;
        opts.maximized = true;
        opts.onMaximize.call(_214);
    };
    function _216(_217) {
        var opts = $.data(_217, "panel").options;
        var _218 = $.data(_217, "panel").panel;
        _218._fit(false);
        _218.hide();
        opts.minimized = true;
        opts.maximized = false;
        opts.onMinimize.call(_217);
    };
    function _219(_21a) {
        var opts = $.data(_21a, "panel").options;
        var _21b = $.data(_21a, "panel").panel;
        var tool = _21b.children("div.panel-header").find("a.panel-tool-max");
        if (opts.maximized == false) {
            return;
        }
        _21b.show();
        tool.removeClass("panel-tool-restore");
        $.extend(opts, $.data(_21a, "panel").original);
        _1e3(_21a);
        opts.minimized = false;
        opts.maximized = false;
        $.data(_21a, "panel").original = null;
        opts.onRestore.call(_21a);
    };
    function _21c(_21d) {
        var opts = $.data(_21d, "panel").options;
        var _21e = $.data(_21d, "panel").panel;
        var _21f = $(_21d).panel("header");
        var body = $(_21d).panel("body");
        _21e.css(opts.style);
        _21e.addClass(opts.cls);
        if (opts.border) {
            _21f.removeClass("panel-header-noborder");
            body.removeClass("panel-body-noborder");
        } else {
            _21f.addClass("panel-header-noborder");
            body.addClass("panel-body-noborder");
        }
        _21f.addClass(opts.headerCls);
        body.addClass(opts.bodyCls);
        if (opts.id) {
            $(_21d).attr("id", opts.id);
        } else {
            $(_21d).attr("id", "");
        }
    };
    function _220(_221, _222) {
        $.data(_221, "panel").options.title = _222;
        $(_221).panel("header").find("div.panel-title").html(_222);
    };
    var TO = false;
    var _223 = true;
    $(window).unbind(".panel").bind("resize.panel", function () {
        if (!_223) {
            return;
        }
        if (TO !== false) {
            clearTimeout(TO);
        }
        TO = setTimeout(function () {
            _223 = false;
            var _224 = $("body.layout");
            if (_224.length) {
                _224.layout("resize");
            } else {
                $("body").children("div.panel:visible,div.accordion:visible,div.tabs-container:visible,div.layout:visible").triggerHandler("_resize");
            }
            _223 = true;
            TO = false;
        }, 200);
    });
    $.fn.panel = function (_225, _226) {
        if (typeof _225 == "string") {
            return $.fn.panel.methods[_225](this, _226);
        }
        _225 = _225 || {};
        return this.each(function () {
            var _227 = $.data(this, "panel");
            var opts;
            if (_227) {
                opts = $.extend(_227.options, _225);
                _227.isLoaded = false;
            } else {
                opts = $.extend({}, $.fn.panel.defaults, $.fn.panel.parseOptions(this), _225);
                $(this).attr("title", "");
                _227 = $.data(this, "panel", { options: opts, panel: _1ed(this), isLoaded: false });
            }
            _1f0(this);
            _21c(this);
            if (opts.doSize == true) {
                _227.panel.css("display", "block");
                _1e3(this);
            }
            if (opts.closed == true || opts.minimized == true) {
                _227.panel.hide();
            } else {
                _200(this);
            }
        });
    };
    $.fn.panel.methods = {
        options: function (jq) {
            return $.data(jq[0], "panel").options;
        }, panel: function (jq) {
            return $.data(jq[0], "panel").panel;
        }, header: function (jq) {
            return $.data(jq[0], "panel").panel.find(">div.panel-header");
        }, body: function (jq) {
            return $.data(jq[0], "panel").panel.find(">div.panel-body");
        }, setTitle: function (jq, _228) {
            return jq.each(function () {
                _220(this, _228);
            });
        }, open: function (jq, _229) {
            return jq.each(function () {
                _200(this, _229);
            });
        }, close: function (jq, _22a) {
            return jq.each(function () {
                _1f4(this, _22a);
            });
        }, destroy: function (jq, _22b) {
            return jq.each(function () {
                _209(this, _22b);
            });
        }, refresh: function (jq, href) {
            return jq.each(function () {
                var _22c = $.data(this, "panel");
                _22c.isLoaded = false;
                if (href) {
                    if (typeof href == "string") {
                        _22c.options.href = href;
                    } else {
                        _22c.options.queryParams = href;
                    }
                }
                _1f5(this);
            });
        }, resize: function (jq, _22d) {
            return jq.each(function () {
                _1e3(this, _22d);
            });
        }, move: function (jq, _22e) {
            return jq.each(function () {
                _1e9(this, _22e);
            });
        }, maximize: function (jq) {
            return jq.each(function () {
                _204(this);
            });
        }, minimize: function (jq) {
            return jq.each(function () {
                _216(this);
            });
        }, restore: function (jq) {
            return jq.each(function () {
                _219(this);
            });
        }, collapse: function (jq, _22f) {
            return jq.each(function () {
                _205(this, _22f);
            });
        }, expand: function (jq, _230) {
            return jq.each(function () {
                _210(this, _230);
            });
        }
    };
    $.fn.panel.parseOptions = function (_231) {
        var t = $(_231);
        return $.extend({}, $.parser.parseOptions(_231, ["id", "width", "height", "left", "top", "title","titleWidth", "iconCls", "cls", "headerCls", "bodyCls", "tools", "href", "method", { cache: "boolean", fit: "boolean", border: "boolean", noheader: "boolean" }, { collapsible: "boolean", minimizable: "boolean", maximizable: "boolean" }, { closable: "boolean", collapsed: "boolean", minimized: "boolean", maximized: "boolean", closed: "boolean" }]), { loadingMessage: (t.attr("loadingMessage") != undefined ? t.attr("loadingMessage") : undefined) });
    };
    $.fn.panel.defaults = {
        isTopZindex:false, //by wanghc 2018-6-21
        id: null, title: null, iconCls: null, width: "auto", height: "auto", left: null, top: null, cls: null, headerCls: null, bodyCls: null, style: {}, href: null, cache: true, fit: false, border: true, doSize: true, noheader: false, content: null, collapsible: false, minimizable: false, maximizable: false, closable: false, collapsed: false, minimized: false, maximized: false, closed: false, tools: null, queryParams: {}, method: "get", href: null, loadingMessage: "Loading...", loader: function (_232, _233, _234) {
            var opts = $(this).panel("options");
            if (!opts.href) {
                return false;
            }
            $.ajax({
                type: opts.method, url: opts.href, cache: false, data: _232, dataType: "html", success: function (data) {
                    _233(data);
                }, error: function () {
                    _234.apply(this, arguments);
                }
            });
        }, extractor: function (data) {
            var _235 = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
            var _236 = _235.exec(data);
            if (_236) {
                return _236[1];
            } else {
                return data;
            }
        }, onBeforeLoad: function (_237) {
        }, onLoad: function () {
        }, onLoadError: function () {
        }, onBeforeOpen: function () {
        }, onOpen: function () {
        }, onBeforeClose: function () {
        }, onClose: function () {
        }, onBeforeDestroy: function () {
        }, onDestroy: function () {
        }, onResize: function (_238, _239) {
        }, onMove: function (left, top) {
        }, onMaximize: function () {
        }, onRestore: function () {
        }, onMinimize: function () {
        }, onBeforeCollapse: function () {
        }, onBeforeExpand: function () {
        }, onCollapse: function () {
        }, onExpand: function () {
        }
    };
})(jQuery);
(function ($) {
    function setSize(target, param) {
        var opts = $.data(target, "window").options;
        if (param) {
            $.extend(opts, param);
        }
        $(target).panel("resize", opts);
    };
    function moveWindow(target, param) {
        var state = $.data(target, "window");
        if (param) {
            if (param.left != null) {
                state.options.left = param.left;
            }
            if (param.top != null) {
                state.options.top = param.top;
            }
        }
        $(target).panel("move", state.options);
        if (state.shadow) {
            state.shadow.css({ left: state.options.left, top: state.options.top });
        }
    };
    function hcenter(target, tomove) {
        var state = $.data(target, "window");
        var opts = state.options;
        var width = opts.width;
        if (isNaN(width)) {
            width = state.window._outerWidth();
        }
        if (opts.inline) {
            var parent = state.window.parent();
            opts.left = (parent.width() - width) / 2 + parent.scrollLeft();
        } else {
            opts.left = ($(window)._outerWidth() - width) / 2 + $(document).scrollLeft();
        }
        if (tomove) {
            moveWindow(target);
        }
    };
    function vcenter(target, tomove) {
        var state = $.data(target, "window");
        var opts = state.options;
        var height = opts.height;
        if (isNaN(height)) {
            height = state.window._outerHeight();
        }
        if (opts.inline) {
            var parent = state.window.parent();
            opts.top = (parent.height() - height) / 2 + parent.scrollTop();
        } else {
            opts.top = ($(window)._outerHeight() - height) / 2 + $(document).scrollTop();
        }
        if (tomove) {
            moveWindow(target);
        }
    };
    function create(target) {
        var state = $.data(target, "window");
        var winClosed = state.options.closed;
        var win = $(target).panel($.extend({}, state.options, {
            border: false, doSize: true, closed: true, cls: "window", headerCls: "window-header", bodyCls: "window-body " + (state.options.noheader ? "window-body-noheader" : ""), onBeforeDestroy: function () {
                if (state.options.onBeforeDestroy.call(target) == false) {
                    return false;
                }
                if (state.shadow) {
                    state.shadow.remove();
                }
                if (state.mask) {
                    state.mask.remove();
                }
            }, onClose: function () {
                if (state.shadow) {
                    state.shadow.hide();
                }
                if (state.mask) {
                    state.mask.hide();
                }
                state.options.onClose.call(target);
            }, onOpen: function () {
                if (state.mask) {
                    state.mask.css({ display: "block", zIndex: $.fn.window.defaults.zIndex++ });
                }
                if (state.shadow) {
                    state.shadow.css({ display: "block", zIndex: $.fn.window.defaults.zIndex++, left: state.options.left, top: state.options.top, width: state.window._outerWidth(), height: state.window._outerHeight() });
                }
                state.window.css("z-index", $.fn.window.defaults.zIndex++);
                state.options.onOpen.call(target);
            }, onResize: function (width, height) {
                var opts = $(this).panel("options");
                $.extend(state.options, { width: opts.width, height: opts.height, left: opts.left, top: opts.top });
                if (state.shadow) {
                    state.shadow.css({ left: state.options.left, top: state.options.top, width: state.window._outerWidth(), height: state.window._outerHeight() });
                }
                state.options.onResize.call(target, width, height);
            }, onMinimize: function () {
                if (state.shadow) {
                    state.shadow.hide();
                }
                if (state.mask) {
                    state.mask.hide();
                }
                state.options.onMinimize.call(target);
            }, onBeforeCollapse: function () {
                if (state.options.onBeforeCollapse.call(target) == false) {
                    return false;
                }
                if (state.shadow) {
                    state.shadow.hide();
                }
            }, onExpand: function () {
                if (state.shadow) {
                    state.shadow.show();
                }
                state.options.onExpand.call(target);
            }
        }));
        state.window = win.panel("panel");
        if (state.mask) {
            state.mask.remove();
        }
        if (state.options.modal == true) {
            //wanghc 2017-12-14 ---ocx dll
            var maskFrame = ""; //修改window,使window,dialog,alert,confirm,prompt,progress的mask支持ocx
            if (state.options.isTopZindex){
                maskFrame = '<iframe style="position:absolute;z-index:-1;width:100%;height:100%;top:0;left:0;scrolling:no;" frameborder="0"></iframe>';
            }
            state.mask = $("<div class=\"window-mask\">"+maskFrame+"</div>").insertAfter(state.window);
            state.mask.css({ width: (state.options.inline ? state.mask.parent().width() : getPageArea().width), height: (state.options.inline ? state.mask.parent().height() : getPageArea().height), display: "none" });
        }
        if (state.shadow) {
            state.shadow.remove();
        }
        if (state.options.shadow == true) {
            state.shadow = $("<div class=\"window-shadow\"></div>").insertAfter(state.window);
            state.shadow.css({ display: "none" });
        }
        if (state.options.left == null) {
            hcenter(target);
        }
        if (state.options.top == null) {
            vcenter(target);
        }
        moveWindow(target);
        if (!winClosed) {
            win.window("open");
        }
    };
    function setProperties(target) {
        var state = $.data(target, "window");
        state.window.draggable({
            handle: ">div.panel-header>div.panel-title", disabled: state.options.draggable == false, onStartDrag: function (e) {
                if (state.mask) {
                    state.mask.css("z-index", $.fn.window.defaults.zIndex++);
                }
                if (state.shadow) {
                    state.shadow.css("z-index", $.fn.window.defaults.zIndex++);
                }
                state.window.css("z-index", $.fn.window.defaults.zIndex++);
                if (!state.proxy) {
                    state.proxy = $("<div class=\"window-proxy\"></div>").insertAfter(state.window);
                }
                state.proxy.css({ display: "none", zIndex: $.fn.window.defaults.zIndex++, left: e.data.left, top: e.data.top });
                state.proxy._outerWidth(state.window._outerWidth());
                state.proxy._outerHeight(state.window._outerHeight());
                setTimeout(function () {
                    if (state.proxy) {
                        state.proxy.show();
                    }
                }, 500);
            }, onDrag: function (e) {
                state.proxy.css({ display: "block", left: e.data.left, top: e.data.top });
                return false;
            }, onStopDrag: function (e) {
                state.options.left = e.data.left;
                state.options.top = e.data.top;
                $(target).window("move");
                state.proxy.remove();
                state.proxy = null;
            }
        });
        state.window.resizable({
            disabled: state.options.resizable == false, onStartResize: function (e) {
                state.pmask = $("<div class=\"window-proxy-mask\"></div>").insertAfter(state.window);
                state.pmask.css({ zIndex: $.fn.window.defaults.zIndex++, left: e.data.left, top: e.data.top, width: state.window._outerWidth(), height: state.window._outerHeight() });
                if (!state.proxy) {
                    state.proxy = $("<div class=\"window-proxy\"></div>").insertAfter(state.window);
                }
                state.proxy.css({ zIndex: $.fn.window.defaults.zIndex++, left: e.data.left, top: e.data.top });
                state.proxy._outerWidth(e.data.width);
                state.proxy._outerHeight(e.data.height);
            }, onResize: function (e) {
                state.proxy.css({ left: e.data.left, top: e.data.top });
                state.proxy._outerWidth(e.data.width);
                state.proxy._outerHeight(e.data.height);
                return false;
            }, onStopResize: function (e) {
                $.extend(state.options, { left: e.data.left, top: e.data.top, width: e.data.width, height: e.data.height });
                setSize(target);
                state.pmask.remove();
                state.pmask = null;
                state.proxy.remove();
                state.proxy = null;
            }
        });
    };
    function getPageArea() {
        if (document.compatMode == "BackCompat") {
            return { width: Math.max(document.body.scrollWidth, document.body.clientWidth), height: Math.max(document.body.scrollHeight, document.body.clientHeight) };
        } else {
            return { width: Math.max(document.documentElement.scrollWidth, document.documentElement.clientWidth), height: Math.max(document.documentElement.scrollHeight, document.documentElement.clientHeight) };
        }
    };
    $(window).resize(function () {
        $("body>div.window-mask").css({ width: $(window)._outerWidth(), height: $(window)._outerHeight() });
        setTimeout(function () {
            $("body>div.window-mask").css({ width: getPageArea().width, height: getPageArea().height });
        }, 50);
    });
    $.fn.window = function (options, param) {
        if (typeof options == "string") {
            var method = $.fn.window.methods[options];
            if (method) {
                return method(this, param);
            } else {
                return this.panel(options, param);
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "window");
            if (state) {
                $.extend(state.options, options);
            } else {
                state = $.data(this, "window", { options: $.extend({}, $.fn.window.defaults, $.fn.window.parseOptions(this), options) });
                if (!state.options.inline) {
                    document.body.appendChild(this);
                }
            }
            create(this);
            setProperties(this);
        });
    };
    $.fn.window.methods = {
        options: function (jq) {
            var popts = jq.panel("options");
            var wopts = $.data(jq[0], "window").options;
            return $.extend(wopts, { closed: popts.closed, collapsed: popts.collapsed, minimized: popts.minimized, maximized: popts.maximized });
        }, window: function (jq) {
            return $.data(jq[0], "window").window;
        }, resize: function (jq, param) {
            return jq.each(function () {
                setSize(this, param);
            });
        }, move: function (jq, param) {
            return jq.each(function () {
                moveWindow(this, param);
            });
        }, hcenter: function (jq) {
            return jq.each(function () {
                hcenter(this, true);
            });
        }, vcenter: function (jq) {
            return jq.each(function () {
                vcenter(this, true);
            });
        }, center: function (jq) {
            return jq.each(function () {
                hcenter(this);
                vcenter(this);
                moveWindow(this);
            });
        }
    };
    $.fn.window.parseOptions = function (target) {
        return $.extend({}, $.fn.panel.parseOptions(target), $.parser.parseOptions(target, [{ draggable: "boolean", resizable: "boolean", shadow: "boolean", modal: "boolean", inline: "boolean" }]));
    };
    $.fn.window.defaults = $.extend({}, $.fn.panel.defaults, {zIndex: 9000, draggable: true, resizable: true, shadow: true, modal: false, inline: false, title: "New Window", collapsible: true, minimizable: true, maximizable: true, closable: true, closed: false });
})(jQuery);
(function ($) {
    function _260(_261) {
        var cp = document.createElement("div");
        while (_261.firstChild) {
            cp.appendChild(_261.firstChild);
        }
        _261.appendChild(cp);
        var _262 = $(cp);
        _262.attr("style", $(_261).attr("style"));
        $(_261).removeAttr("style").css("overflow", "hidden");
        _262.panel({ border: false, doSize: false, bodyCls: "dialog-content" });
        return _262;
    };
    function _263(_264) {
        var opts = $.data(_264, "dialog").options;
        var _265 = $.data(_264, "dialog").contentPanel;
        if (opts.toolbar) {
            if ($.isArray(opts.toolbar)) {
                $(_264).find("div.dialog-toolbar").remove();
                var _266 = $("<div class=\"dialog-toolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").prependTo(_264);
                var tr = _266.find("tr");
                for (var i = 0; i < opts.toolbar.length; i++) {
                    var btn = opts.toolbar[i];
                    if (btn == "-") {
                        $("<td><div class=\"dialog-tool-separator\"></div></td>").appendTo(tr);
                    } else {
                        var td = $("<td></td>").appendTo(tr);
                        var tool = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
                        tool[0].onclick = eval(btn.handler || function () {
                        });
                        tool.linkbutton($.extend({}, btn, { plain: true }));
                    }
                }
            } else {
                $(opts.toolbar).addClass("dialog-toolbar").prependTo(_264);
                $(opts.toolbar).show();
            }
        } else {
            $(_264).find("div.dialog-toolbar").remove();
        }
        if (opts.buttons) {
            if ($.isArray(opts.buttons)) {
                $(_264).find("div.dialog-button").remove();
                var _267 = $("<div class=\"dialog-button\"></div>").appendTo(_264);
                for (var i = 0; i < opts.buttons.length; i++) {
                    var p = opts.buttons[i];
                    var _268 = $("<a href=\"javascript:void(0)\"></a>").appendTo(_267);
                    if (p.handler) {
                        _268[0].onclick = p.handler;
                    }
                    _268.linkbutton(p);
                }
            } else {
                $(opts.buttons).addClass("dialog-button").appendTo(_264);
                $(opts.buttons).show();
            }
        } else {
            $(_264).find("div.dialog-button").remove();
        }
        var _269 = opts.href;
        var _26a = opts.content;
        opts.href = null;
        opts.content = null;
        _265.panel({
            closed: opts.closed, cache: opts.cache, href: _269, content: _26a, onLoad: function () {
                if (opts.height == "auto") {
                    $(_264).window("resize");
                }
                opts.onLoad.apply(_264, arguments);
            }
        });
        $(_264).window($.extend({}, opts, {
            onOpen: function () {
                if (_265.panel("options").closed) {
                    _265.panel("open");
                }
                if (opts.onOpen) {
                    opts.onOpen.call(_264);
                }
            }, onResize: function (_26b, _26c) {
                var _26d = $(_264);
                _265.panel("panel").show();
                _265.panel("resize", { width: _26d.width(), height: (_26c == "auto") ? "auto" : _26d.height() - _26d.children("div.dialog-toolbar")._outerHeight() - _26d.children("div.dialog-button")._outerHeight() });
                if (opts.onResize) {
                    opts.onResize.call(_264, _26b, _26c);
                }
            }
        }));
        opts.href = _269;
        opts.content = _26a;
    };
    function _26e(_26f, href) {
        var _270 = $.data(_26f, "dialog").contentPanel;
        _270.panel("refresh", href);
    };
    $.fn.dialog = function (_271, _272) {
        if (typeof _271 == "string") {
            var _273 = $.fn.dialog.methods[_271];
            if (_273) {
                return _273(this, _272);
            } else {
                return this.window(_271, _272);
            }
        }
        _271 = _271 || {};
        return this.each(function () {
            var _274 = $.data(this, "dialog");
            if (_274) {
                $.extend(_274.options, _271);
            } else {
                $.data(this, "dialog", { options: $.extend({}, $.fn.dialog.defaults, $.fn.dialog.parseOptions(this), _271), contentPanel: _260(this) });
            }
            _263(this);
        });
    };
    $.fn.dialog.methods = {
        options: function (jq) {
            var _275 = $.data(jq[0], "dialog").options;
            var _276 = jq.panel("options");
            $.extend(_275, { closed: _276.closed, collapsed: _276.collapsed, minimized: _276.minimized, maximized: _276.maximized });
            var _277 = $.data(jq[0], "dialog").contentPanel;
            return _275;
        }, dialog: function (jq) {
            return jq.window("window");
        }, refresh: function (jq, href) {
            return jq.each(function () {
                _26e(this, href);
            });
        }
    };
    $.fn.dialog.parseOptions = function (_278) {
        return $.extend({}, $.fn.window.parseOptions(_278), $.parser.parseOptions(_278, ["toolbar", "buttons"]));
    };
    $.fn.dialog.defaults = $.extend({}, $.fn.window.defaults, { title: "New Dialog", collapsible: false, minimizable: false, maximizable: false, resizable: false, toolbar: null, buttons: null });
})(jQuery);
(function ($) {
    function show(el, type, _279, _27a) {
        var win = $(el).window("window");
        if (!win) {
            return;
        }
        switch (type) {
            case null:
                win.show();
                break;
            case "slide":
                win.slideDown(_279);
                break;
            case "fade":
                win.fadeIn(_279);
                break;
            case "show":
                win.show(_279);
                break;
        }
        var _27b = null;
        if (_27a > 0) {
            _27b = setTimeout(function () {
                hide(el, type, _279);
            }, _27a);
        }
        win.hover(function () {
            if (_27b) {
                clearTimeout(_27b);
            }
        }, function () {
            if (_27a > 0) {
                _27b = setTimeout(function () {
                    hide(el, type, _279);
                }, _27a);
            }
        });
    };
    function hide(el, type, _27c) {
        if (el.locked == true) {
            return;
        }
        el.locked = true;
        var win = $(el).window("window");
        if (!win) {
            return;
        }
        switch (type) {
            case null:
                win.hide();
                break;
            case "slide":
                win.slideUp(_27c);
                break;
            case "fade":
                win.fadeOut(_27c);
                break;
            case "show":
                win.hide(_27c);
                break;
        }
        setTimeout(function () {
            $(el).window("destroy");
        }, _27c);
    };
    function _27d(_27e) {
        var opts = $.extend({}, $.fn.window.defaults, {
            collapsible: false, minimizable: false, maximizable: false, shadow: false, draggable: false, resizable: false, closed: true, style: { left: "", top: "", right: 0, zIndex: $.fn.window.defaults.zIndex++, bottom: -document.body.scrollTop - document.documentElement.scrollTop }, onBeforeOpen: function () {
                show(this, opts.showType, opts.showSpeed, opts.timeout);
                return false;
            }, onBeforeClose: function () {
                hide(this, opts.showType, opts.showSpeed);
                return false;
            }
        }, { title: "", width: 250, height: 100, showType: "slide", showSpeed: 600, msg: "", timeout: 4000 }, _27e);
        opts.style.zIndex = $.fn.window.defaults.zIndex++;
        var win = $("<div class=\"messager-body\"></div>").html(opts.msg).appendTo("body");
        win.window(opts);
        win.window("window").css(opts.style);
        win.window("open");
        return win;
    };
    function _27f(_280, _281, _282) {
        var win = $("<div class=\"messager-body\"></div>").appendTo("body");
        win.append(_281);
        if (_282) {
            var tb = $("<div class=\"messager-button\"></div>").appendTo(win);
            for (var _283 in _282) {
                $("<a></a>").attr("href", "javascript:void(0)").text(_283).css("margin-left", 10).bind("click", eval(_282[_283])).appendTo(tb).linkbutton();
            }
            //add space and esc key event handler add by wanghc  2018-10-09
            win.on('keydown',function(e){
                if (tb.children().length>1){ //多个按钮可用 <- 与 -> 左右按钮切换
                    if (e.which==37){ //left
                        e.stopPropagation();
                        tb.children().removeClass('active').eq(0).addClass('active');
                    }
                    if (e.which==39){ //right
                        tb.children().removeClass('active').eq(1).addClass('active');
                    }
                }
                if(e.which==32 || e.which==13){
                    e.stopPropagation();
                    if (tb.children(".active").length>0){
                        tb.children(".active").trigger('click');
                    }else{
                        _282[$.messager.defaults.ok]();
                    }
                    return false;
                }
                if(_282[$.messager.defaults.cancel]){ 
                    if(e.which==27){ //Esc
                        e.stopPropagation();
                        _282[$.messager.defaults.cancel]();
                        return false;
                    }
                }
            });
            //end 2018-10-09
        }
        win.window({
            isTopZindex:true, //wanghc
            closable:false, //neer---不显示关闭按钮--事件监听问题
            title: _280, noheader: (_280 ? false : true), width: 300, height: "auto", modal: true, collapsible: false, minimizable: false, maximizable: false, resizable: false, onClose: function () {
                setTimeout(function () {
                    win.window("destroy");
                }, 100);
            }
        });
        win.window("window").addClass("messager-window");
        win.children("div.messager-button").children("a:first").focus();
        return win;
    };
    $.messager = {
        show: function (_284) {
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) _284.msg = $g(_284.msg);
            }
            return _27d(_284);
        }, alert: function (_285, msg, icon, fn) {
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) msg = $g(msg);
            }
            /* 对象文字 add margin-left:42px;*/
            var _286 = "<div style=\"margin-left:42px;\">" + msg + "</div>";
            switch (icon) {
                case "error":
                    _286 = "<div class=\"messager-icon messager-error\"></div>" + _286;
                    break;
                case "info":
                    _286 = "<div class=\"messager-icon messager-info\"></div>" + _286;
                    break;
                case "question":
                    _286 = "<div class=\"messager-icon messager-question\"></div>" + _286;
                    break;
                case "warning":
                    _286 = "<div class=\"messager-icon messager-warning\"></div>" + _286;
                    break;
                case "success":
                    _286 = "<div class=\"messager-icon messager-success\"></div>" + _286;
                    break;
            }
            _286 += "<div style=\"clear:both;\"/>";
            var _287 = {};
            _287[$.messager.defaults.ok] = function () {
                win.window("close");
                if (fn) {
                    fn();
                    return false;
                }
            };
            var win = _27f(_285, _286, _287);
            return win;
        }, confirm: function (_288, msg, fn) {
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) msg = $g(msg);
            }
            var _289 = "<div class=\"messager-icon messager-question\"></div>" + "<div style=\"margin-left:42px;\">" + msg + "</div>" + "<div style=\"clear:both;\"/>";
            var _28a = {};
            _28a[$.messager.defaults.ok] = function () {
                win.window("close");
                if (fn) {
                    fn(true);
                    return false;
                }
            };
            _28a[$.messager.defaults.cancel] = function () {
                win.window("close");
                if (fn) {
                    fn(false);
                    return false;
                }
            };
            var win = _27f(_288, _289, _28a);
            return win;
        }, prompt: function (_28b, msg, fn) {
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) msg = $g(msg);
            }
            var _28c = "<div class=\"messager-icon messager-question\"></div>" + "<div style=\"margin-left:42px;\">" + msg + "</div>" + "<br/>" + "<div style=\"clear:both;\"/>" + "<div><input class=\"messager-input\" type=\"text\"/></div>";
            var _28d = {};
            _28d[$.messager.defaults.ok] = function () {
                win.window("close");
                if (fn) {
                    fn($(".messager-input", win).val());
                    return false;
                }
            };
            _28d[$.messager.defaults.cancel] = function () {
                win.window("close");
                if (fn) {
                    fn();
                    return false;
                }
            };
            var win = _27f(_28b, _28c, _28d);
            win.children("input.messager-input").focus();
            return win;
        }, progress: function (_28e) {
            var _28f = {
                bar: function () {
                    return $("body>div.messager-window").find("div.messager-p-bar");
                }, close: function () {
                    var win = $("body>div.messager-window>div.messager-body:has(div.messager-progress)");
                    if (win.length) {
                        win.window("close");
                    }
                }
            };
            if (typeof _28e == "string") {
                var _290 = _28f[_28e];
                return _290();
            }
            var opts = $.extend({ title: "", msg: "", text: undefined, interval: 300 }, _28e || {});
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) opts.msg = $g(opts.msg);
            }
            var _291 = "<div class=\"messager-progress\"><div class=\"messager-p-msg\"></div><div class=\"messager-p-bar\"></div></div>";
            var win = _27f(opts.title, _291, null);
            win.find("div.messager-p-msg").html(opts.msg);
            var bar = win.find("div.messager-p-bar");
            bar.progressbar({ text: opts.text });
            win.window({
                closable: false, onClose: function () {
                    if (this.timer) {
                        clearInterval(this.timer);
                    }
                    $(this).window("destroy");
                }
            });
            if (opts.interval) {
                win[0].timer = setInterval(function () {
                    var v = bar.progressbar("getValue");
                    v += 10;
                    if (v > 100) {
                        v = 0;
                    }
                    bar.progressbar("setValue", v);
                }, opts.interval);
            }
            return win;
        },popover: function(opt){
            //default top center;
            // top:document.body.scrollTop+document.documentElement.scrollTop+10  modify by wanghc on 2018-10-18
            var defopt = {style:{top:'',left:''},
               msg:'',type:'error',timeout:3000,showSpeed:'fast',showType:'slide'};
            var o = $.extend({},defopt,opt);
            if ("undefined"!=typeof $g) {
                if ($.isFunction($g)) o.msg = $g(o.msg);
            }
            var html = '<div class="messager-popover '+o.type+'" style="display:none;">\
            <span class="messager-popover-icon '+o.type+'"/><span class="content">'+o.msg+'</span>\
            <span class="close"></span>\
            </div>';
            var t = $(html).appendTo("body");
            if (o.style.left==''){
                o.style.left = document.body.clientWidth/2-(t.width()/2)
            }
            if (o.style.top==''){
                o.style.top = document.body.clientHeight/2-(t.height()/2)
            }
            t.css(o.style);
            switch (o.showType) {
                case null:
                    t.show();
                    break;
                case "slide":
                    t.slideDown(o.showSpeed);
                    break;
                case "fade":
                    t.fadeIn(o.showSpeed);
                    break;
                case "show":
                    t.show(o.showSpeed);
                    break;
            }
            t.find('.close').click(function(){
                t.remove();
            });
            if (o.timeout>0){
                var timeoutHandle =  setTimeout(function(){
                    switch (o.showType) {
                        case null:
                            t.hide();
                            break;
                        case "slide":
                            t.slideUp(o.showSpeed);
                            break;
                        case "fade":
                            t.fadeOut(o.showSpeed);
                            break;
                        case "show":
                            t.hide(o.showSpeed);
                            break;
                    }
                    setTimeout(function(){t.remove()},o.timeout);
                },o.timeout);
            }
        }
    };
    $.messager.defaults = { ok: "Ok", cancel: "Cancel" };
})(jQuery);
(function ($) {
    function setSize(container) {
        var state = $.data(container, "accordion");
        var opts = state.options;
        var panels = state.panels;
        var cc = $(container);
        opts.fit ? $.extend(opts, cc._fit()) : cc._fit(false);
        if (!isNaN(opts.width)) {
            cc._outerWidth(opts.width);
        } else {
            cc.css("width", "");
        }
        var headerHeight = 0;
        var bodyHeight = "auto";
        var headers = cc.find(">div.panel>div.accordion-header");
        if (headers.length) {
            headerHeight = $(headers[0]).css("height", "")._outerHeight();
        }
        
        if (!isNaN(opts.height)) {
            cc._outerHeight(opts.height);
            bodyHeight = cc.height() - headerHeight * headers.length;
        } else {
            cc.css("height", "");
        }
        /*
            2018-09-27 add by wanghc 
            accordion-gray ==> margin-top:4px;
        */
        if (cc.hasClass('accordion-gray')){
            bodyHeight -= 4 * (headers.length-1)+1;  // totalHeight - margin-top * (accordionCount-1)
        }
        _resize(true, bodyHeight - _resize(false) + 1);
        function _resize(collapsible, height) {
            var totalHeight = 0;
            for (var i = 0; i < panels.length; i++) {
                var p = panels[i];
                var h = p.panel("header")._outerHeight(headerHeight);
                if (p.panel("options").collapsible == collapsible) {
                    var pheight = isNaN(height) ? undefined : (height + headerHeight * h.length);
                    p.panel("resize", { width: cc.width(), height: (collapsible ? pheight : undefined) });
                    totalHeight += p.panel("panel").outerHeight() - headerHeight;
                }
            }
            return totalHeight;
        };
    };
    function findBy(container, property, value, all) {
        var panels = $.data(container, "accordion").panels;
        var pp = [];
        for (var i = 0; i < panels.length; i++) {
            var p = panels[i];
            if (property) {
                if (p.panel("options")[property] == value) {
                    pp.push(p);
                }
            } else {
                if (p[0] == $(value)[0]) {
                    return i;
                }
            }
        }
        if (property) {
            return all ? pp : (pp.length ? pp[0] : null);
        } else {
            return -1;
        }
    };
    function getSelections(container) {
        return findBy(container, "collapsed", false, true);
    };
    function getSelected(container) {
        var pp = getSelections(container);
        return pp.length ? pp[0] : null;
    };
    function getPanelIndex(container, panel) {
        return findBy(container, null, panel);
    };
    function getPanel(container, which) {
        var panels = $.data(container, "accordion").panels;
        if (typeof which == "number") {
            if (which < 0 || which >= panels.length) {
                return null;
            } else {
                return panels[which];
            }
        }
        return findBy(container, "title", which);
    };
    function setProperties(container) {
        var opts = $.data(container, "accordion").options;
        var cc = $(container);
        if (opts.border) {
            cc.removeClass("accordion-noborder");
        } else {
            cc.addClass("accordion-noborder");
        }
    };
    function init(container) {
        var state = $.data(container, "accordion");
        var cc = $(container);
        cc.addClass("accordion");
        state.panels = [];
        cc.children("div").each(function () {
            var opts = $.extend({}, $.parser.parseOptions(this), { selected: ($(this).attr("selected") ? true : undefined) });
            var pp = $(this);
            state.panels.push(pp);
            createPanel(container, pp, opts);
        });
        cc.bind("_resize", function (e, force) {
            var opts = $.data(container, "accordion").options;
            if (opts.fit == true || force) {
                setSize(container);
            }
            return false;
        });
    };
    function createPanel(container, pp, options) {
        var opts = $.data(container, "accordion").options;
        pp.panel($.extend({}, { collapsible: true, minimizable: false, maximizable: false, closable: false, doSize: false, collapsed: true, headerCls: "accordion-header", bodyCls: "accordion-body" }, options, {
            onBeforeExpand: function () {
                if (options.onBeforeExpand) {
                    if (options.onBeforeExpand.call(this) == false) {
                        return false;
                    }
                }
                if (!opts.multiple) {
                    var all = $.grep(getSelections(container), function (p) {
                        return p.panel("options").collapsible;
                    });
                    for (var i = 0; i < all.length; i++) {
                        unselect(container, getPanelIndex(container, all[i]));
                    }
                }
                var header = $(this).panel("header");
                header.addClass("accordion-header-selected");
                header.find(".accordion-collapse").removeClass("accordion-expand");
            }, onExpand: function () {
                if (options.onExpand) {
                    options.onExpand.call(this);
                }
                opts.onSelect.call(container, $(this).panel("options").title, getPanelIndex(container, this));
            }, onBeforeCollapse: function () {
                if (options.onBeforeCollapse) {
                    if (options.onBeforeCollapse.call(this) == false) {
                        return false;
                    }
                }
                var header = $(this).panel("header");
                header.removeClass("accordion-header-selected");
                header.find(".accordion-collapse").addClass("accordion-expand");
            }, onCollapse: function () {
                if (options.onCollapse) {
                    options.onCollapse.call(this);
                }
                opts.onUnselect.call(container, $(this).panel("options").title, getPanelIndex(container, this));
            }
        }));
        var header = pp.panel("header");
        var tool = header.children("div.panel-tool");
        tool.children("a.panel-tool-collapse").hide();
        var t = $("<a href=\"javascript:void(0)\"></a>").addClass("accordion-collapse accordion-expand").appendTo(tool);
        t.bind("click", function () {
            var index = getPanelIndex(container, pp);
            if (pp.panel("options").collapsed) {
                select(container, index);
            } else {
                unselect(container, index);
            }
            return false;
        });
        pp.panel("options").collapsible ? t.show() : t.hide();
        header.click(function () {
            $(this).find("a.accordion-collapse:visible").triggerHandler("click");
            return false;
        });
    };
    function select(container, which) {
        var p = getPanel(container, which);
        if (!p) {
            return;
        }
        stopAnimate(container);
        var opts = $.data(container, "accordion").options;
        p.panel("expand", opts.animate);
    };
    function unselect(container, which) {
        var p = getPanel(container, which);
        if (!p) {
            return;
        }
        stopAnimate(container);
        var opts = $.data(container, "accordion").options;
        p.panel("collapse", opts.animate);
    };
    function doFirstSelect(container) {
        var opts = $.data(container, "accordion").options;
        var p = findBy(container, "selected", true);
        if (p) {
            _select(getPanelIndex(container, p));
        } else {
            _select(opts.selected);
        }
        function _select(index) {
            var animate = opts.animate;
            opts.animate = false;
            select(container, index);
            opts.animate = animate;
        };
    };
    function stopAnimate(container) {
        var panels = $.data(container, "accordion").panels;
        for (var i = 0; i < panels.length; i++) {
            panels[i].stop(true, true);
        }
    };
    function add(container, options) {
        var state = $.data(container, "accordion");
        var opts = state.options;
        var panels = state.panels;
        if (options.selected == undefined) {
            options.selected = true;
        }
        stopAnimate(container);
        var pp = $("<div></div>").appendTo(container);
        panels.push(pp);
        createPanel(container, pp, options);
        setSize(container);
        opts.onAdd.call(container, options.title, panels.length - 1);
        if (options.selected) {
            select(container, panels.length - 1);
        }
    };
    function remove(container, which) {
        var state = $.data(container, "accordion");
        var opts = state.options;
        var panels = state.panels;
        stopAnimate(container);
        var panel = getPanel(container, which);
        var title = panel.panel("options").title;
        var index = getPanelIndex(container, panel);
        if (!panel) {
            return;
        }
        if (opts.onBeforeRemove.call(container, title, index) == false) {
            return;
        }
        panels.splice(index, 1);
        panel.panel("destroy");
        if (panels.length) {
            setSize(container);
            var curr = getSelected(container);
            if (!curr) {
                select(container, 0);
            }
        }
        opts.onRemove.call(container, title, index);
    };
    $.fn.accordion = function (options, param) {
        if (typeof options == "string") {
            return $.fn.accordion.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "accordion");
            if (state) {
                $.extend(state.options, options);
            } else {
                $.data(this, "accordion", { options: $.extend({}, $.fn.accordion.defaults, $.fn.accordion.parseOptions(this), options), accordion: $(this).addClass("accordion"), panels: [] });
                init(this);
            }
            setProperties(this);
            setSize(this);
            doFirstSelect(this);
        });
    };
    $.fn.accordion.methods = {
        options: function (jq) {
            return $.data(jq[0], "accordion").options;
        }, panels: function (jq) {
            return $.data(jq[0], "accordion").panels;
        }, resize: function (jq) {
            return jq.each(function () {
                setSize(this);
            });
        }, getSelections: function (jq) {
            return getSelections(jq[0]);
        }, getSelected: function (jq) {
            return getSelected(jq[0]);
        }, getPanel: function (jq, which) {
            return getPanel(jq[0], which);
        }, getPanelIndex: function (jq, panel) {
            return getPanelIndex(jq[0], panel);
        }, select: function (jq, which) {
            return jq.each(function () {
                select(this, which);
            });
        }, unselect: function (jq, which) {
            return jq.each(function () {
                unselect(this, which);
            });
        }, add: function (jq, options) {
            return jq.each(function () {
                add(this, options);
            });
        }, remove: function (jq, which) {
            return jq.each(function () {
                remove(this, which);
            });
        }
    };
    $.fn.accordion.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["width", "height", { fit: "boolean", border: "boolean", animate: "boolean", multiple: "boolean", selected: "number" }]));
    };
    $.fn.accordion.defaults = {
        width: "auto", height: "auto", fit: false, border: true, animate: true, multiple: false, selected: 0, onSelect: function (title, index) {
        }, onUnselect: function (title, index) {
        }, onAdd: function (title, index) {
        }, onBeforeRemove: function (title, index) {
        }, onRemove: function (title, index) {
        }
    };
})(jQuery);
(function ($) {
    function setScrollers(container) {
        var opts = $.data(container, "tabs").options;
        if (opts.tabPosition == "left" || opts.tabPosition == "right" || !opts.showHeader) {
            return;
        }
        var header = $(container).children("div.tabs-header");
        var tool = header.children("div.tabs-tool");
        var sLeft = header.children("div.tabs-scroller-left");
        var sRight = header.children("div.tabs-scroller-right");
        var wrap = header.children("div.tabs-wrap");
        var tHeight = header.outerHeight();
        if (opts.plain) {
            tHeight -= tHeight - header.height();
        }
        tool._outerHeight(tHeight);
        var tabsWidth = 0;
        $("ul.tabs li", header).each(function () {
            tabsWidth += $(this).outerWidth(true);
        });
        var cWidth = header.width() - tool._outerWidth();
        if (tabsWidth > cWidth) {
            sLeft.add(sRight).show()._outerHeight(tHeight);
            if (opts.toolPosition == "left") {
                tool.css({ left: sLeft.outerWidth(), right: "" });
                wrap.css({ marginLeft: sLeft.outerWidth() + tool._outerWidth(), marginRight: sRight._outerWidth(), width: cWidth - sLeft.outerWidth() - sRight.outerWidth() });
            } else {
                tool.css({ left: "", right: sRight.outerWidth() });
                wrap.css({ marginLeft: sLeft.outerWidth(), marginRight: sRight.outerWidth() + tool._outerWidth(), width: cWidth - sLeft.outerWidth() - sRight.outerWidth() });
            }
        } else {
            sLeft.add(sRight).hide();
            if (opts.toolPosition == "left") {
                tool.css({ left: 0, right: "" });
                wrap.css({ marginLeft: tool._outerWidth(), marginRight: 0, width: cWidth });
            } else {
                tool.css({ left: "", right: 0 });
                wrap.css({ marginLeft: 0, marginRight: tool._outerWidth(), width: cWidth });
            }
        }
    };
    function addTools(container) {
        var opts = $.data(container, "tabs").options;
        var header = $(container).children("div.tabs-header");
        if (opts.tools) {
            if (typeof opts.tools == "string") {
                $(opts.tools).addClass("tabs-tool").appendTo(header);
                $(opts.tools).show();
            } else {
                header.children("div.tabs-tool").remove();
                var tools = $("<div class=\"tabs-tool\"><table cellspacing=\"0\" cellpadding=\"0\" style=\"height:100%\"><tr></tr></table></div>").appendTo(header);
                var tr = tools.find("tr");
                for (var i = 0; i < opts.tools.length; i++) {
                    var td = $("<td></td>").appendTo(tr);
                    var tool = $("<a href=\"javascript:void(0);\"></a>").appendTo(td);
                    tool[0].onclick = eval(opts.tools[i].handler || function () {
                    });
                    tool.linkbutton($.extend({}, opts.tools[i], { plain: true }));
                }
            }
        } else {
            header.children("div.tabs-tool").remove();
        }
    };
    function setSize(container) {
        var state = $.data(container, "tabs");
        var opts = state.options;
        var cc = $(container);
        opts.fit ? $.extend(opts, cc._fit()) : cc._fit(false);
        cc.width(opts.width).height(opts.height);
        var header = $(container).children("div.tabs-header");
        var panels = $(container).children("div.tabs-panels");
        var wrap = header.find("div.tabs-wrap");
        var ul = wrap.find(".tabs");
        for (var i = 0; i < state.tabs.length; i++) {
            var p_opts = state.tabs[i].panel("options");
            var p_t = p_opts.tab.find("a.tabs-inner");
            var width = parseInt(p_opts.tabWidth || opts.tabWidth) || undefined;
            if (width) {
                p_t._outerWidth(width);
            } else {
                p_t.css("width", "");
            }
            p_t._outerHeight(opts.tabHeight);
            p_t.css("lineHeight", p_t.height() + "px");
        }
        if (opts.tabPosition == "left" || opts.tabPosition == "right") {
            header._outerWidth(opts.showHeader ? opts.headerWidth : 0);
            panels._outerWidth(cc.width() - header.outerWidth());
            header.add(panels)._outerHeight(opts.height);
            wrap._outerWidth(header.width());
            ul._outerWidth(wrap.width()).css("height", "");
        } else {
            var lrt = header.children("div.tabs-scroller-left,div.tabs-scroller-right,div.tabs-tool");
            header._outerWidth(opts.width).css("height", "");
            if (opts.showHeader) {
                header.css("background-color", "");
                wrap.css("height", "");
                lrt.show();
            } else {
                header.css("background-color", "transparent");
                header._outerHeight(0);
                wrap._outerHeight(0);
                lrt.hide();
            }
            ul._outerHeight(opts.tabHeight).css("width", "");
            setScrollers(container);
            var height = opts.height;
            if (!isNaN(height)) {
                panels._outerHeight(height - header.outerHeight());
            } else {
                panels.height("auto");
            }
            var width = opts.width;
            if (!isNaN(width)) {
                panels._outerWidth(width);
            } else {
                panels.width("auto");
            }
        }
    };
    function setSelectedSize(container) {
        var opts = $.data(container, "tabs").options;
        var tab = getSelectedTab(container);
        if (tab) {
            var panels = $(container).children("div.tabs-panels");
            var width = opts.width == "auto" ? "auto" : panels.width();
            var height = opts.height == "auto" ? "auto" : panels.height();
            tab.panel("resize", { width: width, height: height });
        }
    };
    function wrapTabs(container) {
        var tabs = $.data(container, "tabs").tabs;
        var cc = $(container);
        cc.addClass("tabs-container");
        var pp = $("<div class=\"tabs-panels\"></div>").insertBefore(cc);
        cc.children("div").each(function () {
            pp[0].appendChild(this);
        });
        cc[0].appendChild(pp[0]);
        $("<div class=\"tabs-header\">" + "<div class=\"tabs-scroller-left\"></div>" + "<div class=\"tabs-scroller-right\"></div>" + "<div class=\"tabs-wrap\">" + "<ul class=\"tabs\"></ul>" + "</div>" + "</div>").prependTo(container);
        cc.children("div.tabs-panels").children("div").each(function (i) {
            var opts = $.extend({}, $.parser.parseOptions(this), { selected: ($(this).attr("selected") ? true : undefined) });
            var pp = $(this);
            tabs.push(pp);
            createTab(container, pp, opts);
        });
        cc.children("div.tabs-header").find(".tabs-scroller-left, .tabs-scroller-right").hover(function () {
            $(this).addClass("tabs-scroller-over");
        }, function () {
            $(this).removeClass("tabs-scroller-over");
        });
        cc.bind("_resize", function (e, force) {
            var opts = $.data(container, "tabs").options;
            if (opts.fit == true || force) {
                setSize(container);
                setSelectedSize(container);
            }
            return false;
        });
    };
    function bindEvents(container) {
        var state = $.data(container, "tabs");
        var opts = state.options;
        $(container).children("div.tabs-header").unbind().bind("click", function (e) {
            if ($(e.target).hasClass("tabs-scroller-left")) {
                $(container).tabs("scrollBy", -opts.scrollIncrement);
            } else {
                if ($(e.target).hasClass("tabs-scroller-right")) {
                    $(container).tabs("scrollBy", opts.scrollIncrement);
                } else {
                    var li = $(e.target).closest("li");
                    if (li.hasClass("tabs-disabled")) {
                        return;
                    }
                    var a = $(e.target).closest("a.tabs-close");
                    if (a.length) {
                        closeTab(container, getLiIndex(li));
                    } else {
                        if (li.length) {
                            var index = getLiIndex(li);
                            var popts = state.tabs[index].panel("options");
                            if (popts.collapsible) {
                                popts.closed ? selectTab(container, index) : unselectTab(container, index);
                            } else {
                                selectTab(container, index);
                            }
                        }
                    }
                }
            }
        }).bind("contextmenu", function (e) {
            var li = $(e.target).closest("li");
            if (li.hasClass("tabs-disabled")) {
                return;
            }
            if (li.length) {
                opts.onContextMenu.call(container, e, li.find("span.tabs-title").html(), getLiIndex(li));
            }
        });
        function getLiIndex(li) {
            var index = 0;
            li.parent().children("li").each(function (i) {
                if (li[0] == this) {
                    index = i;
                    return false;
                }
            });
            return index;
        };
    };
    function setProperties(container) {
        var opts = $.data(container, "tabs").options;
        var header = $(container).children("div.tabs-header");
        var panels = $(container).children("div.tabs-panels");
        header.removeClass("tabs-header-top tabs-header-bottom tabs-header-left tabs-header-right");
        panels.removeClass("tabs-panels-top tabs-panels-bottom tabs-panels-left tabs-panels-right");
        if (opts.tabPosition == "top") {
            header.insertBefore(panels);
        } else {
            if (opts.tabPosition == "bottom") {
                header.insertAfter(panels);
                header.addClass("tabs-header-bottom");
                panels.addClass("tabs-panels-top");
            } else {
                if (opts.tabPosition == "left") {
                    header.addClass("tabs-header-left");
                    panels.addClass("tabs-panels-right");
                } else {
                    if (opts.tabPosition == "right") {
                        header.addClass("tabs-header-right");
                        panels.addClass("tabs-panels-left");
                    }
                }
            }
        }
        if (opts.plain == true) {
            header.addClass("tabs-header-plain");
        } else {
            header.removeClass("tabs-header-plain");
        }
        if (opts.border == true) {
            header.removeClass("tabs-header-noborder");
            panels.removeClass("tabs-panels-noborder");
        } else {
            header.addClass("tabs-header-noborder");
            panels.addClass("tabs-panels-noborder");
        }
    };
    function createTab(container, pp, options) {
        var state = $.data(container, "tabs");
        options = options || {};
        pp.panel($.extend({}, options, {
            border: false, noheader: true, closed: true, doSize: false, iconCls: (options.icon ? options.icon : undefined), onLoad: function () {
                if (options.onLoad) {
                    options.onLoad.call(this, arguments);
                }
                state.options.onLoad.call(container, $(this));
            }
        }));
        var opts = pp.panel("options");
        var tabs = $(container).children("div.tabs-header").find("ul.tabs");
        
        //cryze 2018-3-15  add class 'tab-brand' to first tab of BrandTabs
        if (!!state.options.isBrandTabs && tabs.children('li').length==0) {
            opts.tab = $("<li class='tabs-brand'></li>").appendTo(tabs);
        }else{
            opts.tab = $("<li></li>").appendTo(tabs);
        }
        
        opts.tab.append("<a href=\"javascript:void(0)\" class=\"tabs-inner\">" + "<span class=\"tabs-title\"></span>" + "<span class=\"tabs-icon\"></span>" + "</a>");
        $(container).tabs("update", { tab: pp, options: opts });
    };
    function addTab(container, options) {
        var opts = $.data(container, "tabs").options;
        var tabs = $.data(container, "tabs").tabs;
        if (options.selected == undefined) {
            options.selected = true;
        }
        var pp = $("<div></div>").appendTo($(container).children("div.tabs-panels"));
        tabs.push(pp);
        createTab(container, pp, options);
        opts.onAdd.call(container, options.title, tabs.length - 1);
        setSize(container);
        if (options.selected) {
            selectTab(container, tabs.length - 1);
        }
    };
    function updateTab(container, param) {
        var selectHis = $.data(container, "tabs").selectHis;
        var pp = param.tab;
        var oldTitle = pp.panel("options").title;
        pp.panel($.extend({}, param.options, { iconCls: (param.options.icon ? param.options.icon : undefined) }));
        var opts = pp.panel("options");
        var tab = opts.tab;
        var s_title = tab.find("span.tabs-title");
        var s_icon = tab.find("span.tabs-icon");
        s_title.html(opts.title);
        s_icon.attr("class", "tabs-icon");
        tab.find("a.tabs-close").remove();
        if (opts.closable) {
            s_title.addClass("tabs-closable");
            $("<a href=\"javascript:void(0)\" class=\"tabs-close\"></a>").appendTo(tab);
        } else {
            s_title.removeClass("tabs-closable");
        }
        if (opts.iconCls) {
            s_title.addClass("tabs-with-icon");
            s_icon.addClass(opts.iconCls);
        } else {
            s_title.removeClass("tabs-with-icon");
        }
        if (oldTitle != opts.title) {
            for (var i = 0; i < selectHis.length; i++) {
                if (selectHis[i] == oldTitle) {
                    selectHis[i] = opts.title;
                }
            }
        }
        tab.find("span.tabs-p-tool").remove();
        if (opts.tools) {
            var p_tool = $("<span class=\"tabs-p-tool\"></span>").insertAfter(tab.find("a.tabs-inner"));
            if ($.isArray(opts.tools)) {
                for (var i = 0; i < opts.tools.length; i++) {
                    var t = $("<a href=\"javascript:void(0)\"></a>").appendTo(p_tool);
                    t.addClass(opts.tools[i].iconCls);
                    if (opts.tools[i].handler) {
                        t.bind("click", { handler: opts.tools[i].handler }, function (e) {
                            if ($(this).parents("li").hasClass("tabs-disabled")) {
                                return;
                            }
                            e.data.handler.call(this);
                        });
                    }
                }
            } else {
                $(opts.tools).children().appendTo(p_tool);
            }
            var pr = p_tool.children().length * 12;
            if (opts.closable) {
                pr += 8;
            } else {
                pr -= 3;
                p_tool.css("right", "5px");
            }
            s_title.css("padding-right", pr + "px");
        }
        setSize(container);
        $.data(container, "tabs").options.onUpdate.call(container, opts.title, getTabIndex(container, pp));
    };
    function closeTab(container, which) {
        var opts = $.data(container, "tabs").options;
        var tabs = $.data(container, "tabs").tabs;
        var selectHis = $.data(container, "tabs").selectHis;
        if (!exists(container, which)) {
            return;
        }
        var tab = getTab(container, which);
        var title = tab.panel("options").title;
        var index = getTabIndex(container, tab);
        if (opts.onBeforeClose.call(container, title, index) == false) {
            return;
        }
        var tab = getTab(container, which, true);
        tab.panel("options").tab.remove();
        tab.panel("destroy");
        opts.onClose.call(container, title, index);
        setSize(container);
        for (var i = 0; i < selectHis.length; i++) {
            if (selectHis[i] == title) {
                selectHis.splice(i, 1);
                i--;
            }
        }
        var hisTitle = selectHis.pop();
        if (hisTitle) {
            selectTab(container, hisTitle);
        } else {
            if (tabs.length) {
                selectTab(container, 0);
            }
        }
    };
    function getTab(container, which, removeit) {
        var tabs = $.data(container, "tabs").tabs;
        if (typeof which == "number") {
            if (which < 0 || which >= tabs.length) {
                return null;
            } else {
                var tab = tabs[which];
                if (removeit) {
                    tabs.splice(which, 1);
                }
                return tab;
            }
        }
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (tab.panel("options").title == which) {
                if (removeit) {
                    tabs.splice(i, 1);
                }
                return tab;
            }
        }
        return null;
    };
    function getTabIndex(container, tab) {
        var tabs = $.data(container, "tabs").tabs;
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i][0] == $(tab)[0]) {
                return i;
            }
        }
        return -1;
    };
    function getSelectedTab(container) {
        var tabs = $.data(container, "tabs").tabs;
        for (var i = 0; i < tabs.length; i++) {
            var tab = tabs[i];
            if (tab.panel("options").closed == false) {
                return tab;
            }
        }
        return null;
    };
    function doFirstSelect(container) {   // init after  select one default selected tab
        var state = $.data(container, "tabs");
        var tabs = state.tabs;
        var isBrandTabs=!!state.options.isBrandTabs;  //cryze 2018-3-15
        for (var i = 0; i < tabs.length; i++) {
            if (tabs[i].panel("options").selected && !(isBrandTabs && i==0)) {  //cryze 2018-3-15
                selectTab(container, i);
                return;
            }
        }
        if(isBrandTabs && state.options.selected==0) state.options.selected=1;   //cryze 2018-3-15
        selectTab(container, state.options.selected);
    };
    function selectTab(container, which) {
        var state = $.data(container, "tabs");
        var opts = state.options;
        var tabs = state.tabs;
        var selectHis = state.selectHis;
        if (tabs.length == 0) {
            return;
        }
        var panel = getTab(container, which);
        if (!panel) {
            return;
        }
        var selected = getSelectedTab(container);
        /*wanghc add onBeforeSelect event*/
        if (opts.onBeforeSelect) {
            if (false == opts.onBeforeSelect.call(container, panel.panel("options").title, getTabIndex(container, panel))) {
                return false;
            }
        }
        if (!!opts.isBrandTabs) { /*first tab  is brand tab  . wanghc */
            if (getTabIndex(container, panel) == 0) {
                return false;
            }
        }
        if (selected) {
            if (panel[0] == selected[0]) {
                setSelectedSize(container);
                return;
            }
            unselectTab(container, getTabIndex(container, selected));
            if (!selected.panel("options").closed) {
                return;
            }
        }
        panel.panel("open");
        var title = panel.panel("options").title;
        selectHis.push(title);
        var tab = panel.panel("options").tab;
        tab.addClass("tabs-selected");
        var wrap = $(container).find(">div.tabs-header>div.tabs-wrap");
        var left = tab.position().left;
        var right = left + tab.outerWidth();
        if (left < 0 || right > wrap.width()) {
            var deltaX = left - (wrap.width() - tab.width()) / 2;
            $(container).tabs("scrollBy", deltaX);
        } else {
            $(container).tabs("scrollBy", 0);
        }
        setSelectedSize(container);
        opts.onSelect.call(container, title, getTabIndex(container, panel));
    };
    function unselectTab(container, which) {
        var state = $.data(container, "tabs");
        var p = getTab(container, which);
        if (p) {
            var opts = p.panel("options");
            if (!opts.closed) {
                p.panel("close");
                if (opts.closed) {
                    opts.tab.removeClass("tabs-selected");
                    state.options.onUnselect.call(container, opts.title, getTabIndex(container, p));
                }
            }
        }
    };
    function exists(container, which) {
        return getTab(container, which) != null;
    };
    function showHeader(container, visible) {
        var opts = $.data(container, "tabs").options;
        opts.showHeader = visible;
        $(container).tabs("resize");
    };
    $.fn.tabs = function (options, param) {
        if (typeof options == "string") {
            return $.fn.tabs.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "tabs");
            var opts;
            if (state) {
                opts = $.extend(state.options, options);
                state.options = opts;
            } else {
                $.data(this, "tabs", { options: $.extend({}, $.fn.tabs.defaults, $.fn.tabs.parseOptions(this), options), tabs: [], selectHis: [] });
                wrapTabs(this);
            }
            addTools(this);
            setProperties(this);
            setSize(this);
            bindEvents(this);
            doFirstSelect(this);
        });
    };
    $.fn.tabs.methods = {
        options: function (jq) {
            var cc = jq[0];
            var opts = $.data(cc, "tabs").options;
            var s = getSelectedTab(cc);
            opts.selected = s ? getTabIndex(cc, s) : -1;
            return opts;
        }, tabs: function (jq) {
            return $.data(jq[0], "tabs").tabs;
        }, resize: function (jq) {
            return jq.each(function () {
                setSize(this);
                setSelectedSize(this);
            });
        }, add: function (jq, options) {
            return jq.each(function () {
                addTab(this, options);
            });
        }, close: function (jq, which) {
            return jq.each(function () {
                closeTab(this, which);
            });
        }, getTab: function (jq, which) {
            return getTab(jq[0], which);
        }, getTabIndex: function (jq, tab) {
            return getTabIndex(jq[0], tab);
        }, getSelected: function (jq) {
            return getSelectedTab(jq[0]);
        }, select: function (jq, which) {
            return jq.each(function () {
                selectTab(this, which);
            });
        }, unselect: function (jq, which) {
            return jq.each(function () {
                unselectTab(this, which);
            });
        }, exists: function (jq, which) {
            return exists(jq[0], which);
        }, update: function (jq, options) {
            return jq.each(function () {
                updateTab(this, options);
            });
        }, enableTab: function (jq, which) {
            return jq.each(function () {
                $(this).tabs("getTab", which).panel("options").tab.removeClass("tabs-disabled");
            });
        }, disableTab: function (jq, which) {
            return jq.each(function () {
                $(this).tabs("getTab", which).panel("options").tab.addClass("tabs-disabled");
            });
        }, showHeader: function (jq) {
            return jq.each(function () {
                showHeader(this, true);
            });
        }, hideHeader: function (jq) {
            return jq.each(function () {
                showHeader(this, false);
            });
        }, scrollBy: function (jq, deltaX) {
            return jq.each(function () {
                var opts = $(this).tabs("options");
                var wrap = $(this).find(">div.tabs-header>div.tabs-wrap");
                var pos = Math.min(wrap._scrollLeft() + deltaX, getMaxScrollWidth());
                wrap.animate({ scrollLeft: pos }, opts.scrollDuration);
                function getMaxScrollWidth() {
                    var w = 0;
                    var ul = wrap.children("ul");
                    ul.children("li").each(function () {
                        w += $(this).outerWidth(true);
                    });
                    return w - wrap.width() + (ul.outerWidth() - ul.width());
                };
            });
        }
    };
    $.fn.tabs.parseOptions = function (target) {
        return $.extend({}, $.parser.parseOptions(target, ["width", "height", "tools", "toolPosition", "tabPosition", { fit: "boolean", border: "boolean", plain: "boolean", headerWidth: "number", tabWidth: "number", tabHeight: "number", selected: "number", showHeader: "boolean" }]));
    };
    $.fn.tabs.defaults = {
        width: "auto", height: "auto", headerWidth: 150, tabWidth: "auto", tabHeight: 27, selected: 0, showHeader: true, plain: false, fit: false, border: true, tools: null, toolPosition: "right", tabPosition: "top", scrollIncrement: 100, scrollDuration: 400, onLoad: function (panel) {
        }, onSelect: function (title, index) {
        }, onUnselect: function (title, index) {
        }, onBeforeClose: function (title, index) {
        }, onClose: function (title, index) {
        }, onAdd: function (title, index) {
        }, onUpdate: function (title, index) {
        }, onContextMenu: function (e, title, index) {
        }
    };
})(jQuery);
(function ($) {
    var _362 = false;
    function _363(_364) {
        var _365 = $.data(_364, "layout");
        var opts = _365.options;
        var _366 = _365.panels;
        var cc = $(_364);
        if (_364.tagName == "BODY") {
            cc._fit();
        } else {
            opts.fit ? cc.css(cc._fit()) : cc._fit(false);
        }
        var cpos = { top: 0, left: 0, width: cc.width(), height: cc.height() };
        var cpos = { top: 0, left: 0, width: cc.width(), height: cc.height() };
		/*在body内实现padding=10px的layout时,底部没有padding问题 by wanghc */
		if (_364.tagName !== "BODY"){
			var _364parent = $(_364).parent();
			if (_364parent[0].tagName==="BODY"){
				cpos.height = cpos.height - parseInt(_364parent.css("padding-top")) - parseInt(_364parent.css("padding-bottom"));
			}
        }
        _367(_368(_366.expandNorth) ? _366.expandNorth : _366.north, "n");
        _367(_368(_366.expandSouth) ? _366.expandSouth : _366.south, "s");
        _369(_368(_366.expandEast) ? _366.expandEast : _366.east, "e");
        _369(_368(_366.expandWest) ? _366.expandWest : _366.west, "w");
        _366.center.panel("resize", cpos);
        function _36a(pp) {
            var opts = pp.panel("options");
            return Math.min(Math.max(opts.height, opts.minHeight), opts.maxHeight);
        };
        function _36b(pp) {
            var opts = pp.panel("options");
            return Math.min(Math.max(opts.width, opts.minWidth), opts.maxWidth);
        };
        function _367(pp, type) {
            if (!pp.length || !_368(pp)) {
                return;
            }
            var opts = pp.panel("options");
            var _36c = _36a(pp);
            pp.panel("resize", { width: cc.width(), height: _36c, left: 0, top: (type == "n" ? 0 : cc.height() - _36c) });
            cpos.height -= _36c;
            if (type == "n") {
                cpos.top += _36c;
                if (!opts.split && opts.border) {
                    cpos.top--;
                }
            }
            if (!opts.split && opts.border) {
                cpos.height++;
            }
        };
        function _369(pp, type) {
            if (!pp.length || !_368(pp)) {
                return;
            }
            var opts = pp.panel("options");
            var _36d = _36b(pp);
            pp.panel("resize", { width: _36d, height: cpos.height, left: (type == "e" ? cc.width() - _36d : 0), top: cpos.top });
            cpos.width -= _36d;
            if (type == "w") {
                cpos.left += _36d;
                if (!opts.split && opts.border) {
                    cpos.left--;
                }
            }
            if (!opts.split && opts.border) {
                cpos.width++;
            }
        };
    };
    function init(_36e) {
        var cc = $(_36e);
        cc.addClass("layout");
        function _36f(cc) {
            cc.children("div").each(function () {
                var opts = $.fn.layout.parsePanelOptions(this);
                if ("north,south,east,west,center".indexOf(opts.region) >= 0) {
                    _371(_36e, opts, this);
                }
            });
        };
        cc.children("form").length ? _36f(cc.children("form")) : _36f(cc);
        cc.append("<div class=\"layout-split-proxy-h\"></div><div class=\"layout-split-proxy-v\"></div>");
        cc.bind("_resize", function (e, _370) {
            var opts = $.data(_36e, "layout").options;
            if (opts.fit == true || _370) {
                _363(_36e);
            }
            return false;
        });
    };
    function _371(_372, _373, el) {
        _373.region = _373.region || "center";
        var _374 = $.data(_372, "layout").panels;
        var cc = $(_372);
        var dir = _373.region;
        if (_374[dir].length) {
            return;
        }
        var pp = $(el);
        if (!pp.length) {
            pp = $("<div></div>").appendTo(cc);
        }
        var _375 = $.extend({}, $.fn.layout.paneldefaults, {
            width: (pp.length ? parseInt(pp[0].style.width) || pp.outerWidth() : "auto"), height: (pp.length ? parseInt(pp[0].style.height) || pp.outerHeight() : "auto"), doSize: false, collapsible: true, cls: ("layout-panel layout-panel-" + dir), bodyCls: "layout-body", onOpen: function () {
                var tool = $(this).panel("header").children("div.panel-tool");
                tool.children("a.panel-tool-collapse").hide();
                var _376 = { north: "up", south: "down", east: "right", west: "left" };
                if (!_376[dir]) {
                    return;
                }
                var _377 = "layout-button-" + _376[dir];
                var t = tool.children("a." + _377);
                if (!t.length) {
                    t = $("<a href=\"javascript:void(0)\"></a>").addClass(_377).appendTo(tool);
                    t.bind("click", { dir: dir }, function (e) {
                        _383(_372, e.data.dir);
                        return false;
                    });
                }
                $(this).panel("options").collapsible ? t.show() : t.hide();
            }
        }, _373);
        pp.panel(_375);
        _374[dir] = pp;
        if (pp.panel("options").split) {
            var _378 = pp.panel("panel");
            _378.addClass("layout-split-" + dir);
            var _379 = "";
            if (dir == "north") {
                _379 = "s";
            }
            if (dir == "south") {
                _379 = "n";
            }
            if (dir == "east") {
                _379 = "w";
            }
            if (dir == "west") {
                _379 = "e";
            }
            _378.resizable($.extend({}, {
                handles: _379, onStartResize: function (e) {
                    _362 = true;
                    if (dir == "north" || dir == "south") {
                        var _37a = $(">div.layout-split-proxy-v", _372);
                    } else {
                        var _37a = $(">div.layout-split-proxy-h", _372);
                    }
                    var top = 0, left = 0, _37b = 0, _37c = 0;
                    var pos = { display: "block" };
                    if (dir == "north") {
                        pos.top = parseInt(_378.css("top")) + _378.outerHeight() - _37a.height();
                        pos.left = parseInt(_378.css("left"));
                        pos.width = _378.outerWidth();
                        pos.height = _37a.height();
                    } else {
                        if (dir == "south") {
                            pos.top = parseInt(_378.css("top"));
                            pos.left = parseInt(_378.css("left"));
                            pos.width = _378.outerWidth();
                            pos.height = _37a.height();
                        } else {
                            if (dir == "east") {
                                pos.top = parseInt(_378.css("top")) || 0;
                                pos.left = parseInt(_378.css("left")) || 0;
                                pos.width = _37a.width();
                                pos.height = _378.outerHeight();
                            } else {
                                if (dir == "west") {
                                    pos.top = parseInt(_378.css("top")) || 0;
                                    pos.left = _378.outerWidth() - _37a.width();
                                    pos.width = _37a.width();
                                    pos.height = _378.outerHeight();
                                }
                            }
                        }
                    }
                    _37a.css(pos);
                    $("<div class=\"layout-mask\"></div>").css({ left: 0, top: 0, width: cc.width(), height: cc.height() }).appendTo(cc);
                }, onResize: function (e) {
                    if (dir == "north" || dir == "south") {
                        var _37d = $(">div.layout-split-proxy-v", _372);
                        _37d.css("top", e.pageY - $(_372).offset().top - _37d.height() / 2);
                    } else {
                        var _37d = $(">div.layout-split-proxy-h", _372);
                        _37d.css("left", e.pageX - $(_372).offset().left - _37d.width() / 2);
                    }
                    return false;
                }, onStopResize: function (e) {
                    cc.children("div.layout-split-proxy-v,div.layout-split-proxy-h").hide();
                    pp.panel("resize", e.data);
                    _363(_372);
                    _362 = false;
                    cc.find(">div.layout-mask").remove();
                }
            }, _373));
        }
    };
    function _37e(_37f, _380) {
        var _381 = $.data(_37f, "layout").panels;
        if (_381[_380].length) {
            _381[_380].panel("destroy");
            _381[_380] = $();
            var _382 = "expand" + _380.substring(0, 1).toUpperCase() + _380.substring(1);
            if (_381[_382]) {
                _381[_382].panel("destroy");
                _381[_382] = undefined;
            }
        }
    };
    function _383(_384, _385, _386) {
        
        if (_386 == undefined) {
            _386 = "normal";
        }
        //add by wanghc 增加点击侧边收起块，展开侧边 2018-05-17
        var layoutObj = $.data(_384,"layout");
        var _387 = layoutObj.panels;
        var opt = layoutObj.options;
        var p = _387[_385];
        var _388 = p.panel("options");
        if (_388.onBeforeCollapse.call(p) == false) {
            return;
        }
        var _389 = "expand" + _385.substring(0, 1).toUpperCase() + _385.substring(1);
        if (!_387[_389]) {
            _387[_389] = _38a(_385);
            _387[_389].panel("panel").bind("click", function () {
                if (opt.clickExpand){
                    _390(_384, _385);
                    return false;
                }else{ 
                    var _38b = _38c();
                    p.panel("expand", false).panel("open").panel("resize", _38b.collapse);
                    p.panel("panel").animate(_38b.expand, function () {
                        $(this).unbind(".layout").bind("mouseleave.layout", { region: _385 }, function (e) {
                            if (_362 == true) {
                                return;
                            }
                            _383(_384, e.data.region);
                        });
                    });
                    return false;
                }
            });
        }
        var _38d = _38c();
        if (!_368(_387[_389])) {
            _387.center.panel("resize", _38d.resizeC);
        }
        p.panel("panel").animate(_38d.collapse, _386, function () {
            p.panel("collapse", false).panel("close");
            _387[_389].panel("open").panel("resize", _38d.expandP);
            $(this).unbind(".layout");
        });
        function _38a(dir) {
            var icon;
            if (dir == "east") {
                icon = "layout-button-left";
            } else {
                if (dir == "west") {
                    icon = "layout-button-right";
                } else {
                    if (dir == "north") {
                        icon = "layout-button-down";
                    } else {
                        if (dir == "south") {
                            icon = "layout-button-up";
                        }
                    }
                }
            }
            var p_title="&nbsp;",p_content="";
            if (_388.title!="" && _388.showCollapsedTitle){
                if(dir == "east" || dir == "west"){
                    p_content=_388.title.split("").join('</div><div>');
                    p_content='<div class="layout-expand-body-title"><div>'+p_content+'</div></div>';
                }else{
                    p_title=_388.title;
                }
            }

            var p = $("<div></div>").appendTo(_384);
            p.panel($.extend({}, $.fn.layout.paneldefaults, {
                cls: ("layout-expand layout-expand-" + dir), title: p_title,content:p_content,headerCls:_388.headerCls,bodyCls:_388.bodyCls, closed: true, minWidth: 0, minHeight: 0, doSize: false, tools: [{
                    iconCls: icon, handler: function () {
                        _390(_384, _385);
                        return false;
                    }
                }]
            }));
            p.panel("panel").hover(function () {
                $(this).addClass("layout-expand-over");
            }, function () {
                $(this).removeClass("layout-expand-over");
            });
            return p;
        };
        function _38c() {
            var cc = $(_384);
            var _38e = _387.center.panel("options");
            var _38f = _388.collapsedSize;
            if (_385 == "east") {
                var ww = _38e.width + _388.width - _38f;
                if (_388.split || !_388.border) {
                    ww++;
                }
                return { resizeC: { width: ww }, expand: { left: cc.width() - _388.width }, expandP: { top: _38e.top, left: cc.width() - _38f, width: _38f, height: _38e.height }, collapse: { left: cc.width(), top: _38e.top, height: _38e.height } };
            } else {
                if (_385 == "west") {
                    var ww = _38e.width + _388.width - _38f;
                    if (_388.split || !_388.border) {
                        ww++;
                    }
                    return { resizeC: { width: ww, left: _38f - 1 }, expand: { left: 0 }, expandP: { left: 0, top: _38e.top, width: _38f, height: _38e.height }, collapse: { left: -_388.width, top: _38e.top, height: _38e.height } };
                } else {
                    if (_385 == "north") {
                        _38f=_388.collapsedHeight ;  //cryze 2018-9-18 
                        var hh = _38e.height;
                        if (!_368(_387.expandNorth)) {
                            hh += _388.height - _38f + ((_388.split || !_388.border) ? 1 : 0);
                        }
                        _387.east.add(_387.west).add(_387.expandEast).add(_387.expandWest).panel("resize", { top: _38f - 1, height: hh });
                        return { resizeC: { top: _38f - 1, height: hh }, expand: { top: 0 }, expandP: { top: 0, left: 0, width: cc.width(), height: _38f }, collapse: { top: -_388.height, width: cc.width() } };
                    } else {
                        if (_385 == "south") {
                            _38f=_388.collapsedHeight ;  //cryze 2018-9-18 
                            var hh = _38e.height;
                            if (!_368(_387.expandSouth)) {
                                hh += _388.height - _38f + ((_388.split || !_388.border) ? 1 : 0);
                            }
                            _387.east.add(_387.west).add(_387.expandEast).add(_387.expandWest).panel("resize", { height: hh });
                            return { resizeC: { height: hh }, expand: { top: cc.height() - _388.height }, expandP: { top: cc.height() - _38f, left: 0, width: cc.width(), height: _38f }, collapse: { top: cc.height(), width: cc.width() } };
                        }
                    }
                }
            }
        };
    };
    function _390(_391, _392) {
        var _393 = $.data(_391, "layout").panels;
        var p = _393[_392];
        var _394 = p.panel("options");
        if (_394.onBeforeExpand.call(p) == false) {
            return;
        }
        var _395 = _396();
        var _397 = "expand" + _392.substring(0, 1).toUpperCase() + _392.substring(1);
        if (_393[_397]) {
            _393[_397].panel("close");
            p.panel("panel").stop(true, true);
            p.panel("expand", false).panel("open").panel("resize", _395.collapse);
            p.panel("panel").animate(_395.expand, function () {
                _363(_391);
            });
        }
        function _396() {
            var cc = $(_391);
            var _398 = _393.center.panel("options");
            if (_392 == "east" && _393.expandEast) {
                return { collapse: { left: cc.width(), top: _398.top, height: _398.height }, expand: { left: cc.width() - _393["east"].panel("options").width } };
            } else {
                if (_392 == "west" && _393.expandWest) {
                    return { collapse: { left: -_393["west"].panel("options").width, top: _398.top, height: _398.height }, expand: { left: 0 } };
                } else {
                    if (_392 == "north" && _393.expandNorth) {
                        return { collapse: { top: -_393["north"].panel("options").height, width: cc.width() }, expand: { top: 0 } };
                    } else {
                        if (_392 == "south" && _393.expandSouth) {
                            return { collapse: { top: cc.height(), width: cc.width() }, expand: { top: cc.height() - _393["south"].panel("options").height } };
                        }
                    }
                }
            }
        };
    };
    function _368(pp) {
        if (!pp) {
            return false;
        }
        if (pp.length) {
            return pp.panel("panel").is(":visible");
        } else {
            return false;
        }
    };
    function _399(_39a) {
        var _39b = $.data(_39a, "layout").panels;
        if (_39b.east.length && _39b.east.panel("options").collapsed) {
            _383(_39a, "east", 0);
        }
        if (_39b.west.length && _39b.west.panel("options").collapsed) {
            _383(_39a, "west", 0);
        }
        if (_39b.north.length && _39b.north.panel("options").collapsed) {
            _383(_39a, "north", 0);
        }
        if (_39b.south.length && _39b.south.panel("options").collapsed) {
            _383(_39a, "south", 0);
        }
    };
    $.fn.layout = function (_39c, _39d) {
        if (typeof _39c == "string") {
            return $.fn.layout.methods[_39c](this, _39d);
        }
        _39c = _39c || {};
        return this.each(function () {
            var _39e = $.data(this, "layout");
            if (_39e) {
                $.extend(_39e.options, _39c);
            } else {
                var opts = $.extend({}, $.fn.layout.defaults, $.fn.layout.parseOptions(this), _39c);
                $.data(this, "layout", { options: opts, panels: { center: $(), north: $(), south: $(), east: $(), west: $() } });
                init(this);
            }
            _363(this);
            _399(this);
        });
    };
    $.fn.layout.methods = {
        resize: function (jq) {
            return jq.each(function () {
                _363(this);
            });
        }, panel: function (jq, _39f) {
            return $.data(jq[0], "layout").panels[_39f];
        }, collapse: function (jq, _3a0) {
            return jq.each(function () {
                _383(this, _3a0);
            });
        }, expand: function (jq, _3a1) {
            return jq.each(function () {
                _390(this, _3a1);
            });
        }, add: function (jq, _3a2) {
            return jq.each(function () {
                _371(this, _3a2);
                _363(this);
                if ($(this).layout("panel", _3a2.region).panel("options").collapsed) {
                    _383(this, _3a2.region, 0);
                }
            });
        }, remove: function (jq, _3a3) {
            return jq.each(function () {
                _37e(this, _3a3);
                _363(this);
            });
        }
    };
    $.fn.layout.parseOptions = function (_3a4) {
        return $.extend({}, $.parser.parseOptions(_3a4, [{ fit: "boolean" }]));
    };
    //add by wanghc 增加点击侧边收起块，展开侧边 2018-05-17
    $.fn.layout.defaults = { fit: false,clickExpand:false };
    $.fn.layout.parsePanelOptions = function (_3a5) {
        var t = $(_3a5);
        return $.extend({}, $.fn.panel.parseOptions(_3a5), $.parser.parseOptions(_3a5, ["region", { split: "boolean",showCollapsedTitle:'boolean', collpasedSize: "number",collapsedHeight:'number', minWidth: "number", minHeight: "number", maxWidth: "number", maxHeight: "number" }]));
    };
    // cryze 2018-9-18 原collapsedSize并不适用于 noth south的折叠高度   ，故新增collapsedHeight表示noth south的折叠高度
    // cryze 2018-9-18 增加 showCollapsedTitle ，控制是否在折叠的时候显示标题
    $.fn.layout.paneldefaults = $.extend({}, $.fn.panel.defaults, { region: null,showCollapsedTitle:false, split: false, collapsedSize: 28,collapsedHeight: 38, minWidth: 10, minHeight: 10, maxWidth: 10000, maxHeight: 10000 });
})(jQuery);
(function ($) {
    function init(target) {
        $(target).appendTo("body");
        $(target).addClass("menu-top");
	var opts = $.data(target,"menu").options;
        if (opts.isTopZindex){
            var ocxFrame = '<iframe style="position:absolute;z-index:-1;width:100%;height:100%;top:0;left:0;scrolling:no;" frameborder="0"></iframe>';
            $(target).prepend(ocxFrame);
        }
        $(document).unbind(".menu").bind("mousedown.menu", function (e) {
            var m = $(e.target).closest("div.menu,div.combo-p");
            if (m.length) {
                return;
            }
            $("body>div.menu-top:visible").menu("hide");
        });
        var menus = splitMenu($(target));
        for (var i = 0; i < menus.length; i++) {
            createMenu(menus[i]);
        }
        function splitMenu(menu) {
            var menus = [];
            menu.addClass("menu");
            menus.push(menu);
            if (!menu.hasClass("menu-content")) {
                menu.children("div").each(function () {
                    var submenu = $(this).children("div");
                    if (submenu.length) {
                        submenu.insertAfter(target);
                        this.submenu = submenu;
                        var mm = splitMenu(submenu);
                        menus = menus.concat(mm);
                    }
                });
            }
            return menus;
        };
        function createMenu(menu) {
            var wh = $.parser.parseOptions(menu[0], ["width", "height"]);
            menu[0].originalHeight = wh.height || 0;
            if (menu.hasClass("menu-content")) {
                menu[0].originalWidth = wh.width || menu._outerWidth();
            } else {
                menu[0].originalWidth = wh.width || 0;
                menu.children("div").each(function () {
                    var item = $(this);
                    var itemOpts = $.extend({}, $.parser.parseOptions(this, ["name", "iconCls", "href", { separator: "boolean" }]), { disabled: (item.attr("disabled") ? true : undefined) });
                    if (itemOpts.separator) {
                        item.addClass("menu-sep");
                    }
                    if (!item.hasClass("menu-sep")) {
                        item[0].itemName = itemOpts.name || "";
                        item[0].itemHref = itemOpts.href || "";
                        var text = item.addClass("menu-item").html();
                        item.empty().append($("<div class=\"menu-text\"></div>").html(text));
                        if (itemOpts.iconCls) {
                            $("<div class=\"menu-icon\"></div>").addClass(itemOpts.iconCls).appendTo(item);
                        }
                        if (itemOpts.disabled) {
                            setDisabled(target, item[0], true);
                        }
                        if (item[0].submenu) {
                            $("<div class=\"menu-rightarrow\"></div>").appendTo(item);
                        }
                        bindMenuItemEvent(target, item);
                    }
                });
                $("<div class=\"menu-line\"></div>").prependTo(menu);
            }
            setMenuWidth(target, menu);
            menu.hide();
            bindMenuEvent(target, menu);
        };
    };
    function setMenuWidth(target, menu) {
        var opts = $.data(target, "menu").options;
        var style = menu.attr("style") || "";
        menu.css({ display: "block", left: -10000, height: "auto", overflow: "hidden" });
        var el = menu[0];
        var width = el.originalWidth || 0;
        if (!width) {
            width = 0;
            menu.find("div.menu-text").each(function () {
                if (width < $(this)._outerWidth()) {
                    width = $(this)._outerWidth();
                }
                $(this).closest("div.menu-item")._outerHeight($(this)._outerHeight() + 2);
            });
            width += 40;
        }
        width = Math.max(width, opts.minWidth);
        var height = el.originalHeight || menu.outerHeight();
        var lineHeight = Math.max(el.originalHeight, menu.outerHeight()) - 2;
        //cryze menu 若是在options指定宽度，则按指定的宽度
        if (opts.width&&opts.width>0) width=opts.width;
        menu._outerWidth(width)._outerHeight(height);
        menu.children("div.menu-line")._outerHeight(lineHeight);
        style += ";width:" + el.style.width + ";height:" + el.style.height;
        menu.attr("style", style);
    };
    function bindMenuEvent(target, menu) {
        var state = $.data(target, "menu");
        menu.unbind(".menu").bind("mouseenter.menu", function () {
            if (state.timer) {
                clearTimeout(state.timer);
                state.timer = null;
            }
        }).bind("mouseleave.menu", function () {
            if (state.options.hideOnUnhover) {
                state.timer = setTimeout(function () {
                    hideAll(target);
                }, 100);
            }
        });
    };
    function bindMenuItemEvent(target, item) {
        if (!item.hasClass("menu-item")) {
            return;
        }
        item.unbind(".menu");
        item.bind("click.menu", function () {
            if ($(this).hasClass("menu-item-disabled")) {
                return;
            }
            if (!this.submenu) {
                hideAll(target);
                var href = $(this).attr("href");
                if (href) {
                    location.href = href;
                }
            }
            var item = $(target).menu("getItem", this);
            $.data(target, "menu").options.onClick.call(target, item);
        }).bind("mouseenter.menu", function (e) {
            item.siblings().each(function () {
                if (this.submenu) {
                    hideMenu(this.submenu);
                }
                $(this).removeClass("menu-active");
            });
            item.addClass("menu-active");
            if ($(this).hasClass("menu-item-disabled")) {
                item.addClass("menu-active-disabled");
                return;
            }
            var submenu = item[0].submenu;
            if (submenu) {
                $(target).menu("show", { menu: submenu, parent: item });
            }
        }).bind("mouseleave.menu", function (e) {
            item.removeClass("menu-active menu-active-disabled");
            var submenu = item[0].submenu;
            if (submenu) {
                if (e.pageX >= parseInt(submenu.css("left"))) {
                    item.addClass("menu-active");
                } else {
                    hideMenu(submenu);
                }
            } else {
                item.removeClass("menu-active");
            }
        });
    };
    function hideAll(target) {
        var state = $.data(target, "menu");
        if (state) {
            if ($(target).is(":visible")) {
                hideMenu($(target));
                state.options.onHide.call(target);
            }
        }
        return false;
    };
    function showMenu(target, param) {
        var left, top;
        param = param || {};
        var menu = $(param.menu || target);
        if (menu.hasClass("menu-top")) {
            var opts = $.data(target, "menu").options;
            $.extend(opts, param);
            left = opts.left;
            top = opts.top;
            if (opts.alignTo) {
                var at = $(opts.alignTo);
                left = at.offset().left;
                top = at.offset().top + at._outerHeight();
                if (opts.align == "right") {
                    left += at.outerWidth() - menu.outerWidth();
                }
            }
            if (left + menu.outerWidth() > $(window)._outerWidth() + $(document)._scrollLeft()) {
                left = $(window)._outerWidth() + $(document).scrollLeft() - menu.outerWidth() - 5;
            }
            if (left < 0) {
                left = 0;
            }
            if (top + menu.outerHeight() > $(window)._outerHeight() + $(document).scrollTop()) {
                top = $(window)._outerHeight() + $(document).scrollTop() - menu.outerHeight() - 5;
            }
        } else {
            var parent = param.parent;
            left = parent.offset().left + parent.outerWidth() - 2;
            if (left + menu.outerWidth() + 5 > $(window)._outerWidth() + $(document).scrollLeft()) {
                left = parent.offset().left - menu.outerWidth() + 2;
            }
            var top = parent.offset().top - 3;
            if (top + menu.outerHeight() > $(window)._outerHeight() + $(document).scrollTop()) {
                top = $(window)._outerHeight() + $(document).scrollTop() - menu.outerHeight() - 5;
            }
        }
        menu.css({ left: left, top: top });
        menu.show(0, function () {
            if (!menu[0].shadow) {
                menu[0].shadow = $("<div class=\"menu-shadow\"></div>").insertAfter(menu);
            }
            menu[0].shadow.css({ display: "block", zIndex: $.fn.menu.defaults.zIndex++, left: menu.css("left"), top: menu.css("top"), width: menu.outerWidth(), height: menu.outerHeight() });
            menu.css("z-index", $.fn.menu.defaults.zIndex++);
            if (menu.hasClass("menu-top")) {
                $.data(menu[0], "menu").options.onShow.call(menu[0]);
            }
        });
    };
    function hideMenu(menu) {
        if (!menu) {
            return;
        }
        hideit(menu);
        menu.find("div.menu-item").each(function () {
            if (this.submenu) {
                hideMenu(this.submenu);
            }
            $(this).removeClass("menu-active");
        });
        function hideit(m) {
            m.stop(true, true);
            if (m[0].shadow) {
                m[0].shadow.hide();
            }
            m.hide();
        };
    };
    function findItem(target, text) {
        var result = null;
        var tmp = $("<div></div>");
        function find(menu) {
            menu.children("div.menu-item").each(function () {
                var item = $(target).menu("getItem", this);
                var s = tmp.empty().html(item.text).text();
                if (text == $.trim(s)) {
                    result = item;
                } else {
                    if (this.submenu && !result) {
                        find(this.submenu);
                    }
                }
            });
        };
        find($(target));
        tmp.remove();
        return result;
    };
    function setDisabled(target, itemEl, disabled) {
        var t = $(itemEl);
        if (!t.hasClass("menu-item")) {
            return;
        }
        if (disabled) {
            t.addClass("menu-item-disabled");
            if (itemEl.onclick) {
                itemEl.onclick1 = itemEl.onclick;
                itemEl.onclick = null;
            }
        } else {
            t.removeClass("menu-item-disabled");
            if (itemEl.onclick1) {
                itemEl.onclick = itemEl.onclick1;
                itemEl.onclick1 = null;
            }
        }
    };
    function appendItem(target, param) {
        var menu = $(target);
        if (param.parent) {
            if (!param.parent.submenu) {
                var submenu = $("<div class=\"menu\"><div class=\"menu-line\"></div></div>").appendTo("body");
                submenu.hide();
                param.parent.submenu = submenu;
                $("<div class=\"menu-rightarrow\"></div>").appendTo(param.parent);
            }
            menu = param.parent.submenu;
        }
        if (param.separator) {
            var item = $("<div class=\"menu-sep\"></div>").appendTo(menu);
        } else {
            var item = $("<div class=\"menu-item\"></div>").appendTo(menu);
            $("<div class=\"menu-text\"></div>").html(param.text).appendTo(item);
        }
        if (param.iconCls) {
            $("<div class=\"menu-icon\"></div>").addClass(param.iconCls).appendTo(item);
        }
        if (param.id) {
            item.attr("id", param.id);
        }
        if (param.name) {
            item[0].itemName = param.name;
        }
        if (param.href) {
            item[0].itemHref = param.href;
        }
        if (param.onclick) {
            if (typeof param.onclick == "string") {
                item.attr("onclick", param.onclick);
            } else {
                item[0].onclick = eval(param.onclick);
            }
        }
        if (param.handler) {
            item[0].onclick = eval(param.handler);
        }
        if (param.disabled) {
            setDisabled(target, item[0], true);
        }
        bindMenuItemEvent(target, item);
        bindMenuEvent(target, menu);
        setMenuWidth(target, menu);
    };
    function removeItem(target, itemEl) {
        function removeit(el) {
            if (el.submenu) {
                el.submenu.children("div.menu-item").each(function () {
                    removeit(this);
                });
                var shadow = el.submenu[0].shadow;
                if (shadow) {
                    shadow.remove();
                }
                el.submenu.remove();
            }
            $(el).remove();
        };
        removeit(itemEl);
    };
    function destroyMenu(target) {
        $(target).children("div.menu-item").each(function () {
            removeItem(target, this);
        });
        if (target.shadow) {
            target.shadow.remove();
        }
        $(target).remove();
    };
    $.fn.menu = function (options, param) {
        if (typeof options == "string") {
            return $.fn.menu.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "menu");
            if (state) {
                $.extend(state.options, options);
            } else {
                state = $.data(this, "menu", { options: $.extend({}, $.fn.menu.defaults, $.fn.menu.parseOptions(this), options) });
                init(this);
            }
            $(this).css({ left: state.options.left, top: state.options.top });
        });
    };
    $.fn.menu.methods = {
        options: function (jq) {
            return $.data(jq[0], "menu").options;
        }, show: function (jq, pos) {
            return jq.each(function () {
                showMenu(this, pos);
            });
        }, hide: function (jq) {
            return jq.each(function () {
                hideAll(this);
            });
        }, destroy: function (jq) {
            return jq.each(function () {
                destroyMenu(this);
            });
        }, setText: function (jq, param) {
            return jq.each(function () {
                $(param.target).children("div.menu-text").html(param.text);
            });
        }, setIcon: function (jq, param) {
            return jq.each(function () {
                $(param.target).children("div.menu-icon").remove();
                if (param.iconCls) {
                    $("<div class=\"menu-icon\"></div>").addClass(param.iconCls).appendTo(param.target);
                }
            });
        }, getItem: function (jq, itemEl) {
            var t = $(itemEl);
            var item = { target: itemEl, id: t.attr("id"), text: $.trim(t.children("div.menu-text").html()), disabled: t.hasClass("menu-item-disabled"), name: itemEl.itemName, href: itemEl.itemHref, onclick: itemEl.onclick };
            var icon = t.children("div.menu-icon");
            if (icon.length) {
                var cc = [];
                var aa = icon.attr("class").split(" ");
                for (var i = 0; i < aa.length; i++) {
                    if (aa[i] != "menu-icon") {
                        cc.push(aa[i]);
                    }
                }
                item.iconCls = cc.join(" ");
            }
            return item;
        }, findItem: function (jq, text) {
            return findItem(jq[0], text);
        }, appendItem: function (jq, param) {
            return jq.each(function () {
                appendItem(this, param);
            });
        }, removeItem: function (jq, itemEl) {
            return jq.each(function () {
                removeItem(this, itemEl);
            });
        }, enableItem: function (jq, itemEl) {
            return jq.each(function () {
                setDisabled(this, itemEl, false);
            });
        }, disableItem: function (jq, itemEl) {
            return jq.each(function () {
                setDisabled(this, itemEl, true);
            });
        }
    };
    $.fn.menu.parseOptions = function (target) {
        return $.extend({}, $.parser.parseOptions(target, ["left", "top", { minWidth: "number", hideOnUnhover: "boolean" }]));
    };
    $.fn.menu.defaults = {
        isTopZindex:false,
        zIndex: 110000, left: 0, top: 0, alignTo: null, align: "left", minWidth: 120, hideOnUnhover: true, onShow: function () {
        }, onHide: function () {
        }, onClick: function (item) {
        }
    };
})(jQuery);
(function ($) {
    function init(_3e0) {
        var opts = $.data(_3e0, "menubutton").options;
        var btn = $(_3e0);
        btn.linkbutton(opts);
        btn.removeClass(opts.cls.btn1 + " " + opts.cls.btn2).addClass("m-btn");
        btn.removeClass("m-btn-small m-btn-medium m-btn-large").addClass("m-btn-" + opts.size);
        var _3e1 = btn.find(".l-btn-left");
        $("<span></span>").addClass(opts.cls.arrow).appendTo(_3e1);
        $("<span></span>").addClass("m-btn-line").appendTo(_3e1);
        
        btn.removeClass('menubutton-toolbar menubutton-blue').addClass(opts.otherCls);  //cryze  menubutton 按钮增加类opts.otherCls
        
        if (opts.menu) {
            $(opts.menu).addClass(opts.otherCls);  //cryze  menubutton 的menu增加类 opts.otherCls
            if ((opts.otherCls=="menubutton-toolbar")||(opts.otherCls=="menubutton-blue")){
                $(opts.menu).menu({width:btn._outerWidth(),isTopZindex:opts.isTopZindex}); //menubutton 支持isTopZindex属性
            }else{
                $(opts.menu).menu({isTopZindex:opts.isTopZindex}); //menubutton 支持isTopZindex属性 20190819
            }
            var _3e2 = $(opts.menu).menu("options");
            var _3e3 = _3e2.onShow;
            var _3e4 = _3e2.onHide;
            $.extend(_3e2, {
                onShow: function () {
                    var _3e5 = $(this).menu("options");
                    var btn = $(_3e5.alignTo);
                    var opts = btn.menubutton("options");
                    btn.addClass((opts.plain == true) ? opts.cls.btn2 : opts.cls.btn1);
                    _3e3.call(this);
                }, onHide: function () {
                    var _3e6 = $(this).menu("options");
                    var btn = $(_3e6.alignTo);
                    var opts = btn.menubutton("options");
                    btn.removeClass((opts.plain == true) ? opts.cls.btn2 : opts.cls.btn1);
                    _3e4.call(this);
                }
            });
        }
        _3e7(_3e0, opts.disabled);
    };
    function _3e7(_3e8, _3e9) {
        var opts = $.data(_3e8, "menubutton").options;
        opts.disabled = _3e9;
        var btn = $(_3e8);
        var t = btn.find("." + opts.cls.trigger);
        if (!t.length) {
            t = btn;
        }
        t.unbind(".menubutton");
        if (_3e9) {
            btn.linkbutton("disable");
        } else {
            btn.linkbutton("enable");
            var _3ea = null;
            t.bind("click.menubutton", function () {
                _3eb(_3e8);
                return false;
            }).bind("mouseenter.menubutton", function () {
                _3ea = setTimeout(function () {
                    _3eb(_3e8);
                }, opts.duration);
                return false;
            }).bind("mouseleave.menubutton", function (e) {
                if (_3ea) {
                    clearTimeout(_3ea);
                }
                //cryze 鼠标放到button上，menu显示，离开button(且不是放到menu上)应该隐藏munu
                if ($(opts.menu).length>0 && $(opts.menu).find(e.toElement).length==0 && !$(opts.menu).is($(e.toElement))){
                    $(opts.menu).menu('hide');
                }
            });
        }
    };
    function _3eb(_3ec) {
        var opts = $.data(_3ec, "menubutton").options;
        if (opts.disabled || !opts.menu) {
            return;
        }
        $("body>div.menu-top").menu("hide");
        var btn = $(_3ec);
        var mm = $(opts.menu);
        if (mm.length) {
            mm.menu("options").alignTo = btn;
            mm.menu("show", { alignTo: btn, align: opts.menuAlign });
        }
        btn.blur();
    };
    $.fn.menubutton = function (_3ed, _3ee) {
        if (typeof _3ed == "string") {
            var _3ef = $.fn.menubutton.methods[_3ed];
            if (_3ef) {
                return _3ef(this, _3ee);
            } else {
                return this.linkbutton(_3ed, _3ee);
            }
        }
        _3ed = _3ed || {};
        return this.each(function () {
            var _3f0 = $.data(this, "menubutton");
            if (_3f0) {
                $.extend(_3f0.options, _3ed);
            } else {
                $.data(this, "menubutton", { options: $.extend({}, $.fn.menubutton.defaults, $.fn.menubutton.parseOptions(this), _3ed) });
                $(this).removeAttr("disabled");
            }
            init(this);
        });
    };
    $.fn.menubutton.methods = {
        options: function (jq) {
            var _3f1 = jq.linkbutton("options");
            var _3f2 = $.data(jq[0], "menubutton").options;
            _3f2.toggle = _3f1.toggle;
            _3f2.selected = _3f1.selected;
            return _3f2;
        }, enable: function (jq) {
            return jq.each(function () {
                _3e7(this, false);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _3e7(this, true);
            });
        }, destroy: function (jq) {
            return jq.each(function () {
                var opts = $(this).menubutton("options");
                if (opts.menu) {
                    $(opts.menu).menu("destroy");
                }
                $(this).remove();
            });
        }
    };
    $.fn.menubutton.parseOptions = function (_3f3) {
        var t = $(_3f3);
        //cryze 解析options 解析otherCls 
        var otherCls="";
        if (t.hasClass('menubutton-blue')) {otherCls="menubutton-blue";}
        else if(t.hasClass('menubutton-toolbar')) {otherCls="menubutton-toolbar";}
        return $.extend({otherCls:otherCls}, $.fn.linkbutton.parseOptions(_3f3), $.parser.parseOptions(_3f3, ["menu", { plain: "boolean", duration: "number" }]));
    };
    $.fn.menubutton.defaults = $.extend({}, $.fn.linkbutton.defaults, {otherCls:'', plain: true, menu: null, menuAlign: "left", duration: 100, cls: { btn1: "m-btn-active", btn2: "m-btn-plain-active", arrow: "m-btn-downarrow", trigger: "m-btn" } });
})(jQuery);
(function ($) {
    function init(_3f4) {
        var opts = $.data(_3f4, "splitbutton").options;
        $(_3f4).menubutton(opts);
        $(_3f4).addClass("s-btn");
    };
    $.fn.splitbutton = function (_3f5, _3f6) {
        if (typeof _3f5 == "string") {
            var _3f7 = $.fn.splitbutton.methods[_3f5];
            if (_3f7) {
                return _3f7(this, _3f6);
            } else {
                return this.menubutton(_3f5, _3f6);
            }
        }
        _3f5 = _3f5 || {};
        return this.each(function () {
            var _3f8 = $.data(this, "splitbutton");
            if (_3f8) {
                $.extend(_3f8.options, _3f5);
            } else {
                $.data(this, "splitbutton", { options: $.extend({}, $.fn.splitbutton.defaults, $.fn.splitbutton.parseOptions(this), _3f5) });
                $(this).removeAttr("disabled");
            }
            init(this);
        });
    };
    $.fn.splitbutton.methods = {
        options: function (jq) {
            var _3f9 = jq.menubutton("options");
            var _3fa = $.data(jq[0], "splitbutton").options;
            $.extend(_3fa, { disabled: _3f9.disabled, toggle: _3f9.toggle, selected: _3f9.selected });
            return _3fa;
        }
    };
    $.fn.splitbutton.parseOptions = function (_3fb) {
        var t = $(_3fb);
        return $.extend({}, $.fn.linkbutton.parseOptions(_3fb), $.parser.parseOptions(_3fb, ["menu", { plain: "boolean", duration: "number" }]));
    };
    $.fn.splitbutton.defaults = $.extend({}, $.fn.linkbutton.defaults, { plain: true, menu: null, duration: 100, cls: { btn1: "m-btn-active s-btn-active", btn2: "m-btn-plain-active s-btn-plain-active", arrow: "m-btn-downarrow", trigger: "m-btn-line" } });
})(jQuery);
(function ($) {
    function init(_3fc) {
        $(_3fc).addClass("searchbox-f").hide();
        var span = $("<span class=\"searchbox\"></span>").insertAfter(_3fc);
        var _3fd = $("<input type=\"text\" class=\"searchbox-text\">").appendTo(span);
        $("<span><span class=\"searchbox-button\"></span></span>").appendTo(span);
        var name = $(_3fc).attr("name");
        if (name) {
            _3fd.attr("name", name);
            $(_3fc).removeAttr("name").attr("searchboxName", name);
        }
        return span;
    };
    function _3fe(_3ff, _400) {
        var opts = $.data(_3ff, "searchbox").options;
        var sb = $.data(_3ff, "searchbox").searchbox;
        if (_400) {
            opts.width = _400;
        }
        sb.appendTo("body");
        if (isNaN(opts.width)) {
            opts.width = sb._outerWidth();
        }
        var _401 = sb.find("span.searchbox-button");
        var menu = sb.find("a.searchbox-menu");
        var _402 = sb.find("input.searchbox-text");
        sb._outerWidth(opts.width)._outerHeight(opts.height);
        _402._outerWidth(sb.width() - menu._outerWidth() - _401._outerWidth());
        _402.css({ height: sb.height() + "px", lineHeight: sb.height() + "px" });
        menu._outerHeight(sb.height());
        _401._outerHeight(sb.height());
        var _403 = menu.find("span.l-btn-left");
        _403._outerHeight(sb.height());
        _403.find("span.l-btn-text").css({ height: _403.height() + "px", lineHeight: _403.height() + "px" });
        sb.insertAfter(_3ff);
    };
    function _404(_405) {
        var _406 = $.data(_405, "searchbox");
        var opts = _406.options;
        if (opts.menu) {
            _406.menu = $(opts.menu).menu({
                onClick: function (item) {
                    _407(item);
                }
            });
            var item = _406.menu.children("div.menu-item:first");
            _406.menu.children("div.menu-item").each(function () {
                var _408 = $.extend({}, $.parser.parseOptions(this), { selected: ($(this).attr("selected") ? true : undefined) });
                if (_408.selected) {
                    item = $(this);
                    return false;
                }
            });
            item.triggerHandler("click");
        } else {
            _406.searchbox.find("a.searchbox-menu").remove();
            _406.menu = null;
        }
        function _407(item) {
            _406.searchbox.find("a.searchbox-menu").remove();
            var mb = $("<a class=\"searchbox-menu\" href=\"javascript:void(0)\"></a>").html(item.text);
            mb.prependTo(_406.searchbox).menubutton({ menu: _406.menu, iconCls: item.iconCls });
            _406.searchbox.find("input.searchbox-text").attr("name", item.name || item.text);
            _3fe(_405);
        };
    };
    function _409(_40a) {
        var _40b = $.data(_40a, "searchbox");
        var opts = _40b.options;
        var _40c = _40b.searchbox.find("input.searchbox-text");
        var _40d = _40b.searchbox.find(".searchbox-button");
        _40c.unbind(".searchbox");
        _40d.unbind(".searchbox");
        if (!opts.disabled) {
            _40c.bind("blur.searchbox", function (e) {
                opts.value = $(this).val();
                if (opts.value == "") {
                    $(this).val(opts.prompt);
                    $(this).addClass("searchbox-prompt");
                } else {
                    $(this).removeClass("searchbox-prompt");
                }
            }).bind("focus.searchbox", function (e) {
                if ($(this).val() != opts.value) {
                    $(this).val(opts.value);
                }
                $(this).removeClass("searchbox-prompt");
            }).bind("keydown.searchbox", function (e) {
                if (e.keyCode == 13) {
                    e.preventDefault();
                    opts.value = $(this).val();
                    opts.searcher.call(_40a, opts.value, _40c._propAttr("name"));
                    return false;
                }
            });
            _40d.bind("click.searchbox", function () {
                opts.searcher.call(_40a, opts.value, _40c._propAttr("name"));
            }).bind("mouseenter.searchbox", function () {
                $(this).addClass("searchbox-button-hover");
            }).bind("mouseleave.searchbox", function () {
                $(this).removeClass("searchbox-button-hover");
            });
        }
    };
    function _40e(_40f, _410) {
        var _411 = $.data(_40f, "searchbox");
        var opts = _411.options;
        var _412 = _411.searchbox.find("input.searchbox-text");
        var mb = _411.searchbox.find("a.searchbox-menu");
        //cryze searchbox 禁用启用 _411.searchbox为 span.searchbox jq对象
        if (_410) {
            opts.disabled = true;
            $(_40f).attr("disabled", true);
            _412.attr("disabled", true);
            if (mb.length) {
                mb.menubutton("disable");
            }
            _411.searchbox.addClass("disabled");
        } else {
            opts.disabled = false;
            $(_40f).removeAttr("disabled");
            _412.removeAttr("disabled");
            if (mb.length) {
                mb.menubutton("enable");
            }
            _411.searchbox.removeClass("disabled");
        }
    };
    function _413(_414) {
        var _415 = $.data(_414, "searchbox");
        var opts = _415.options;
        var _416 = _415.searchbox.find("input.searchbox-text");
        opts.originalValue = opts.value;
        if (opts.value) {
            _416.val(opts.value);
            _416.removeClass("searchbox-prompt");
        } else {
            _416.val(opts.prompt);
            _416.addClass("searchbox-prompt");
        }
    };
    $.fn.searchbox = function (_417, _418) {
        if (typeof _417 == "string") {
            return $.fn.searchbox.methods[_417](this, _418);
        }
        _417 = _417 || {};
        return this.each(function () {
            var _419 = $.data(this, "searchbox");
            if (_419) {
                $.extend(_419.options, _417);
            } else {
                _419 = $.data(this, "searchbox", { options: $.extend({}, $.fn.searchbox.defaults, $.fn.searchbox.parseOptions(this), _417), searchbox: init(this) });
            }
            _404(this);
            _413(this);
            _409(this);
            _40e(this, _419.options.disabled);
            _3fe(this);
        });
    };
    $.fn.searchbox.methods = {
        options: function (jq) {
            return $.data(jq[0], "searchbox").options;
        }, menu: function (jq) {
            return $.data(jq[0], "searchbox").menu;
        }, textbox: function (jq) {
            return $.data(jq[0], "searchbox").searchbox.find("input.searchbox-text");
        }, getValue: function (jq) {
            return $.data(jq[0], "searchbox").options.value;
        }, setValue: function (jq, _41a) {
            return jq.each(function () {
                $(this).searchbox("options").value = _41a;
                $(this).searchbox("textbox").val(_41a);
                $(this).searchbox("textbox").blur();
            });
        }, clear: function (jq) {
            return jq.each(function () {
                $(this).searchbox("setValue", "");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).searchbox("options");
                $(this).searchbox("setValue", opts.originalValue);
            });
        }, getName: function (jq) {
            return $.data(jq[0], "searchbox").searchbox.find("input.searchbox-text").attr("name");
        }, selectName: function (jq, name) {
            return jq.each(function () {
                var menu = $.data(this, "searchbox").menu;
                if (menu) {
                    menu.children("div.menu-item[name=\"" + name + "\"]").triggerHandler("click");
                }
            });
        }, destroy: function (jq) {
            return jq.each(function () {
                var menu = $(this).searchbox("menu");
                if (menu) {
                    menu.menu("destroy");
                }
                $.data(this, "searchbox").searchbox.remove();
                $(this).remove();
            });
        }, resize: function (jq, _41b) {
            return jq.each(function () {
                _3fe(this, _41b);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _40e(this, true);
                _409(this);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                _40e(this, false);
                _409(this);
            });
        }
    };
    $.fn.searchbox.parseOptions = function (_41c) {
        var t = $(_41c);
        return $.extend({}, $.parser.parseOptions(_41c, ["width", "height", "prompt", "menu"]), { value: (t.val() || undefined), disabled: (t.attr("disabled") ? true : undefined), searcher: (t.attr("searcher") ? eval(t.attr("searcher")) : undefined) });
    };
    //wanghc searchbox height:22-->30
    $.fn.searchbox.defaults = {
        width: "auto", height: 30, prompt: "", value: "", menu: null, disabled: false, searcher: function (_41d, name) {
        }
    };
})(jQuery);
(function ($) {
    function init(_41e) {
        $(_41e).addClass("validatebox-text");
    };
    function _41f(_420) {
        var _421 = $.data(_420, "validatebox");
        _421.validating = false;
        if (_421.timer) {
            clearTimeout(_421.timer);
        }
        $(_420).tooltip("destroy");
        $(_420).unbind();
        $(_420).remove();
    };
    function _422(_423) {
        var box = $(_423);
        var _424 = $.data(_423, "validatebox");
        box.unbind(".validatebox");
        if (_424.options.novalidate) {
            return;
        }
        box.bind("focus.validatebox", function () {
            _424.validating = true;
            _424.value = undefined;
            (function () {
                if (_424.validating) {
                    if (_424.value != box.val()) {
                        _424.value = box.val();
                        if (_424.timer) {
                            clearTimeout(_424.timer);
                        }
                        _424.timer = setTimeout(function () {
                            $(_423).validatebox("validate");
                        }, _424.options.delay);
                    } else {
                        _429(_423);
                    }
                    setTimeout(arguments.callee, 200);
                }
            })();
        }).bind("blur.validatebox", function () {
            if (_424.timer) {
                clearTimeout(_424.timer);
                _424.timer = undefined;
            }
            _424.validating = false;
            _425(_423);
        }).bind("mouseenter.validatebox", function () {
            if (box.hasClass("validatebox-invalid")) {
                _426(_423);
            }
            ////有prompt也tooltip出来 wanghc 2018-2-28
            var vbox = $.data(_423,"validatebox");
            if (vbox.options){
                if (vbox.options.prompt && vbox.options.prompt!=""){
                    vbox.message = vbox.options.prompt;
                    _426(_423);
                }
            }
        }).bind("mouseleave.validatebox", function () {
            if (!_424.validating) {
                _425(_423);
            }
        });
    };
    function _426(_427) {
        var _428 = $.data(_427, "validatebox");
        var opts = _428.options;
        $(_427).tooltip($.extend({}, opts.tipOptions, { content: _428.message, position: opts.tipPosition, deltaX: opts.deltaX })).tooltip("show");
        _428.tip = true;
    };
    function _429(_42a) {
        var _42b = $.data(_42a, "validatebox");
        if (_42b && _42b.tip) {
            $(_42a).tooltip("reposition");
        }
    };
    function _425(_42c) {
        var _42d = $.data(_42c, "validatebox");
        _42d.tip = false;
        $(_42c).tooltip("hide");
    };
    function _42e(_42f) {
        var _430 = $.data(_42f, "validatebox");
        var opts = _430.options;
        var box = $(_42f);
        var _431 = box.val();

        function _432(msg) {
            _430.message = msg;
        };
        function _433(_434, _435) {
            var _436 = /([a-zA-Z_]+)(.*)/.exec(_434);
            var rule = opts.rules[_436[1]];
            if (rule && _431) {
                var _437 = _435 || opts.validParams || eval(_436[2]);
                if (!rule["validator"].call(_42f, _431, _437)) {
                    box.addClass("validatebox-invalid");
                    var _438 = rule["message"];
                    if (_437) {
                        for (var i = 0; i < _437.length; i++) {
                            _438 = _438.replace(new RegExp("\\{" + i + "\\}", "g"), _437[i]);
                        }
                    }
                    _432(opts.invalidMessage || _438);
                    if (_430.validating) {
                        _426(_42f);
                    }
                    return false;
                }
            }
            return true;
        };
        box.removeClass("validatebox-invalid");
        _425(_42f);
        if (opts.novalidate || box.is(":disabled")) {
            return true;
        }
        if (opts.required) {
            if (_431 == "") {
                box.addClass("validatebox-invalid");
                _432(opts.missingMessage);
                if (_430.validating) {
                    _426(_42f);
                }
                return false;
            }
        }
        if (opts.validType) {
            if ($.isArray(opts.validType)) {
                for (var i = 0; i < opts.validType.length; i++) {
                    if (!_433(opts.validType[i])) {
                        return false;
                    }
                }
            } else {
                if (typeof opts.validType == "string") {
                    if (!_433(opts.validType)) {
                        return false;
                    }
                } else {
                    for (var _439 in opts.validType) {
                        var _43a = opts.validType[_439];
                        if (!_433(_439, _43a)) {
                            return false;
                        }
                    }
                }
            }
        }
        return true;
    };
    function _43b(_43c, _43d) {
        var opts = $.data(_43c, "validatebox").options;
        if (_43d != undefined) {
            opts.novalidate = _43d;
        }
        if (opts.novalidate) {
            $(_43c).removeClass("validatebox-invalid");
            _425(_43c);
        }
        /*输入框支持placeholder属性 wanghc 2018-6-30*/
        if (opts.placeholder!=""){
            $(_43c).attr("placeholder",opts.placeholder);
        }
        _422(_43c);
    };
    $.fn.validatebox = function (_43e, _43f) {
        if (typeof _43e == "string") {
            return $.fn.validatebox.methods[_43e](this, _43f);
        }
        _43e = _43e || {};
        return this.each(function () {
            var _440 = $.data(this, "validatebox");
            if (_440) {
                $.extend(_440.options, _43e);
            } else {
                init(this);
                $.data(this, "validatebox", { options: $.extend({}, $.fn.validatebox.defaults, $.fn.validatebox.parseOptions(this), _43e) });
            }
            _43b(this);
            _42e(this);
        });
    };
    $.fn.validatebox.methods = {
        options: function (jq) {
            return $.data(jq[0], "validatebox").options;
        }, destroy: function (jq) {
            return jq.each(function () {
                _41f(this);
            });
        }, validate: function (jq) {
            return jq.each(function () {
                _42e(this);
            });
        }, isValid: function (jq) {
            return _42e(jq[0]);
        }, enableValidation: function (jq) {
            return jq.each(function () {
                _43b(this, false);
            });
        }, disableValidation: function (jq) {
            return jq.each(function () {
                _43b(this, true);
            });
        }
    };
    $.fn.validatebox.parseOptions = function (_441) {
        var t = $(_441);
        return $.extend({}, $.parser.parseOptions(_441, ["placeholder","validType", "missingMessage", "invalidMessage", "tipPosition", { delay: "number", deltaX: "number" }]), { required: (t.attr("required") ? true : undefined), novalidate: (t.attr("novalidate") != undefined ? true : undefined) });
    };
    $.fn.validatebox.defaults = {
        placeholder:"",/*输入框支持placeholder属性 wanghc 2018-10-18*/
        required: false, validType: null, validParams: null, delay: 200, missingMessage: "This field is required.", invalidMessage: null, tipPosition: "right", deltaX: 0, novalidate: false, tipOptions: {
            showEvent: "none", hideEvent: "none", showDelay: 0, hideDelay: 0, zIndex: "", onShow: function () {
                $(this).tooltip("tip").css({ color: "#000", borderColor: "#CC9933", backgroundColor: "#FFFFCC" });
            }, onHide: function () {
                $(this).tooltip("destroy");
            }
        }, rules: {
            email: {
                validator: function (_442) {
                    return /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?$/i.test(_442);
                }, message: "Please enter a valid email address."
            }, url: {
                validator: function (_443) {
                    return /^(https?|ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(\#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(_443);
                }, message: "Please enter a valid URL."
            }, length: {
                validator: function (_444, _445) {
                    var len = $.trim(_444).length;
                    return len >= _445[0] && len <= _445[1];
                }, message: "Please enter a value between {0} and {1}."
            }, remote: {
                validator: function (_446, _447) {
                    var data = {};
                    data[_447[1]] = _446;
                    var _448 = $.ajax({ url: _447[0], dataType: "json", data: data, async: false, cache: false, type: "post" }).responseText;
                    return _448 == "true";
                }, message: "Please fix this field."
            }
        }
    };
})(jQuery);
(function ($) {
    function ajaxSubmit(target, options) {
        options = options || {};
        var param = {};
        if (options.onSubmit) {
            if (options.onSubmit.call(target, param) == false) {
                return;
            }
        }
        var form = $(target);
        if (options.url) {
            form.attr("action", options.url);
        }
        var frameId = "hisui_frame_" + (new Date().getTime());
        var frame = $("<iframe id=" + frameId + " name=" + frameId + "></iframe>").attr("src", window.ActiveXObject ? "javascript:false" : "about:blank").css({ position: "absolute", top: -1000, left: -1000 });
        var t = form.attr("target"), a = form.attr("action");
        form.attr("target", frameId);
        var paramFields = $();
        try {
            frame.appendTo("body");
            frame.bind("load", cb);
            for (var n in param) {
                var f = $("<input type=\"hidden\" name=\"" + n + "\">").val(param[n]).appendTo(form);
                paramFields = paramFields.add(f);
            }
            checkState();
            form[0].submit();
        }
        finally {
            form.attr("action", a);
            t ? form.attr("target", t) : form.removeAttr("target");
            paramFields.remove();
        }
        function checkState() {
            var f = $("#" + frameId);
            if (!f.length) {
                return;
            }
            try {
                var s = f.contents()[0].readyState;
                if (s && s.toLowerCase() == "uninitialized") {
                    setTimeout(checkState, 100);
                }
            }
            catch (e) {
                cb();
            }
        };
        var checkCount = 10;
        function cb() {
            var frame = $("#" + frameId);
            if (!frame.length) {
                return;
            }
            frame.unbind();
            var data = "";
            try {
                var body = frame.contents().find("body");
                data = body.html();
                if (data == "") {
                    if (--checkCount) {
                        setTimeout(cb, 100);
                        return;
                    }
                }
                var ta = body.find(">textarea");
                if (ta.length) {
                    data = ta.val();
                } else {
                    var pre = body.find(">pre");
                    if (pre.length) {
                        data = pre.html();
                    }
                }
            }
            catch (e) {
            }
            if (options.success) {
                options.success(data);
            }
            setTimeout(function () {
                frame.unbind();
                frame.remove();
            }, 100);
        };
    };
    function load(target, data) {
        if (!$.data(target, "form")) {
            $.data(target, "form", { options: $.extend({}, $.fn.form.defaults) });
        }
        var opts = $.data(target, "form").options;
        if (typeof data == "string") {
            var param = {};
            if (opts.onBeforeLoad.call(target, param) == false) {
                return;
            }
            $.ajax({
                url: data, data: param, dataType: "json", success: function (data) {
                    _load(data);
                }, error: function () {
                    opts.onLoadError.apply(target, arguments);
                }
            });
        } else {
            _load(data);
        }
        function _load(data) {
            var form = $(target);
            for (var name in data) {
                var val = data[name];
                var rr = _checkField(name, val);
                if (!rr.length) {
                    var count = _loadOther(name, val);
                    if (!count) {
                        $("input[name=\"" + name + "\"]", form).val(val);
                        $("textarea[name=\"" + name + "\"]", form).val(val);
                        $("select[name=\"" + name + "\"]", form).val(val);
                    }
                }
                _loadCombo(name, val);
            }
            opts.onLoadSuccess.call(target, data);
            validate(target);
        };
        function _checkField(name, val) {
            var rr = $(target).find("input[name=\"" + name + "\"][type=radio], input[name=\"" + name + "\"][type=checkbox]");
            rr._propAttr("checked", false);
            rr.each(function () {
                var f = $(this);
                if (f.val() == String(val) || $.inArray(f.val(), $.isArray(val) ? val : [val]) >= 0) {
                    f._propAttr("checked", true);
                }
            });
            return rr;
        };
        function _loadOther(name, val) {
            var count = 0;
            var pp = ["numberbox", "slider"];
            for (var i = 0; i < pp.length; i++) {
                var p = pp[i];
                var f = $(target).find("input[" + p + "Name=\"" + name + "\"]");
                if (f.length) {
                    f[p]("setValue", val);
                    count += f.length;
                }
            }
            return count;
        };
        function _loadCombo(name, val) {
            var form = $(target);
            var cc = ["combobox", "combotree", "combogrid", "datetimebox", "datebox", "combo"];
            var c = form.find("[comboName=\"" + name + "\"]");
            if (c.length) {
                for (var i = 0; i < cc.length; i++) {
                    var type = cc[i];
                    if (c.hasClass(type + "-f")) {
                        if (c[type]("options").multiple) {
                            c[type]("setValues", val);
                        } else {
                            c[type]("setValue", val);
                        }
                        return;
                    }
                }
            }
        };
    };
    function clear(target) {
        $("input,select,textarea", target).each(function () {
            var t = this.type, tag = this.tagName.toLowerCase();
            if (t == "text" || t == "hidden" || t == "password" || tag == "textarea") {
                this.value = "";
            } else {
                if (t == "file") {
                    var file = $(this);
                    var newfile = file.clone().val("");
                    newfile.insertAfter(file);
                    if (file.data("validatebox")) {
                        file.validatebox("destroy");
                        newfile.validatebox();
                    } else {
                        file.remove();
                    }
                } else {
                    if (t == "checkbox" || t == "radio") {
                        this.checked = false;
                    } else {
                        if (tag == "select") {
                            this.selectedIndex = -1;
                        }
                    }
                }
            }
        });
        var t = $(target);
        var plugins = ["combo", "combobox", "combotree", "combogrid", "slider","radio","checkbox"];  //cryze 2019-04-04 增加支持封装的radio和checkbox 
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            var r = t.find("." + plugin + "-f");
            if (r.length && r[plugin]) {
                r[plugin]("clear");
            }
        }
        validate(target);
    };
    function reset(target) {
        target.reset();
        var t = $(target);
        var plugins = ["combo", "combobox", "combotree", "combogrid", "datebox", "datetimebox", "spinner", "timespinner", "numberbox", "numberspinner", "slider","radio","checkbox"]; //cryze 2019-04-04 增加支持封装的radio和checkbox 
        for (var i = 0; i < plugins.length; i++) {
            var plugin = plugins[i];
            var r = t.find("." + plugin + "-f");
            if (r.length && r[plugin]) {
                r[plugin]("reset");
            }
        }
        validate(target);
    };
    function setForm(target) {
        var options = $.data(target, "form").options;
        var form = $(target);
        form.unbind(".form").bind("submit.form", function () {
            setTimeout(function () {
                ajaxSubmit(target, options);
            }, 0);
            return false;
        });
    };
    function validate(target) {
        if ($.fn.validatebox) {
            var t = $(target);
            t.find(".validatebox-text:not(:disabled)").validatebox("validate");
            var invalidbox = t.find(".validatebox-invalid");
            invalidbox.filter(":not(:disabled):first").focus();
            return invalidbox.length == 0;
        }
        return true;
    };
    function setValidation(target, novalidate) {
        $(target).find(".validatebox-text:not(:disabled)").validatebox(novalidate ? "disableValidation" : "enableValidation");
    };
    $.fn.form = function (options, param) {
        if (typeof options == "string") {
            return $.fn.form.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            if (!$.data(this, "form")) {
                $.data(this, "form", { options: $.extend({}, $.fn.form.defaults, options) });
            }
            setForm(this);
        });
    };
    $.fn.form.methods = {
        submit: function (jq, options) {
            return jq.each(function () {
                var opts = $.extend({}, $.fn.form.defaults, $.data(this, "form") ? $.data(this, "form").options : {}, options || {});
                ajaxSubmit(this, opts);
            });
        }, load: function (jq, data) {
            return jq.each(function () {
                load(this, data);
            });
        }, clear: function (jq) {
            return jq.each(function () {
                clear(this);
            });
        }, reset: function (jq) {
            return jq.each(function () {
                reset(this);
            });
        }, validate: function (jq) {
            return validate(jq[0]);
        }, disableValidation: function (jq) {
            return jq.each(function () {
                setValidation(this, true);
            });
        }, enableValidation: function (jq) {
            return jq.each(function () {
                setValidation(this, false);
            });
        }
    };
    $.fn.form.defaults = {
        url: null, onSubmit: function (_470) {
            return $(this).form("validate");
        }, success: function (data) {
        }, onBeforeLoad: function (param) {
        }, onLoadSuccess: function (data) {
        }, onLoadError: function () {
        }
    };
})(jQuery);
(function ($) {
    function init(_472) {
        $(_472).addClass("numberbox numberbox-f");
        var v = $("<input type=\"hidden\">").insertAfter(_472);
        var name = $(_472).attr("name");
        if (name) {
            v.attr("name", name);
            $(_472).removeAttr("name").attr("numberboxName", name);
        }
        return v;
    };
    function _473(_474) {
        var opts = $.data(_474, "numberbox").options;
        var fn = opts.onChange;
        opts.onChange = function () {
        };
        _475(_474, opts.parser.call(_474, opts.value));
        opts.onChange = fn;
        opts.originalValue = _476(_474);
    };
    function _477(_478, _479) {
        var opts = $.data(_478, "numberbox").options;
        if (_479) {
            opts.width = _479;
        }
        var t = $(_478);
        var _47a = $("<div style=\"display:none\"></div>").insertBefore(t);
        t.appendTo("body");
        if (isNaN(opts.width)) {
            opts.width = t.outerWidth();
        }
        t._outerWidth(opts.width)._outerHeight(opts.height);
        t.css("line-height", t.height() + "px");
        t.insertAfter(_47a);
        _47a.remove();
    };
    function _476(_47b) {
        return $.data(_47b, "numberbox").field.val();
    };
    function _475(_47c, _47d) {
        var _47e = $.data(_47c, "numberbox");
        var opts = _47e.options;
        var _47f = _476(_47c);
        _47d = opts.parser.call(_47c, _47d);
        opts.value = _47d;
        _47e.field.val(_47d);
        $(_47c).val(opts.formatter.call(_47c, _47d));
        if (_47f != _47d) {
            opts.onChange.call(_47c, _47d, _47f);
        }
    };
    function _480(_481) {
        var opts = $.data(_481, "numberbox").options;
        $(_481).unbind(".numberbox").bind("keypress.numberbox", function (e) {
            return opts.filter.call(_481, e);
        }).bind("blur.numberbox", function () {
            _475(_481, $(this).val());
            $(this).val(opts.formatter.call(_481, _476(_481)));
        }).bind("focus.numberbox", function () {
            var vv = _476(_481);
            if (vv != opts.parser.call(_481, $(this).val())) {
                $(this).val(opts.formatter.call(_481, vv));
            }
        })
        if (opts.isKeyupChange){
            $(_481).bind("keyup.numberbox",function(e){ 
                // neer 2019-04-18 add keydown.numberbox事件 
                // $(dom).on("keydown",function(){
                //   $(this).numberbox("getValue");  //拿到的是上一次的值
                // })
                //console.log("src="+$(this).val());
                _475(_481, $(this).val());
                $(this).val(opts.formatter.call(_481, _476(_481)));
            });
        }
    };
    function _482(_483) {
        if ($.fn.validatebox) {
            var opts = $.data(_483, "numberbox").options;
            $(_483).validatebox(opts);
        }
    };
    function _484(_485, _486) {
        var opts = $.data(_485, "numberbox").options;
        if (_486) {
            opts.disabled = true;
            $(_485).attr("disabled", true);
        } else {
            opts.disabled = false;
            $(_485).removeAttr("disabled");
        }
    };
    $.fn.numberbox = function (_487, _488) {
        if (typeof _487 == "string") {
            var _489 = $.fn.numberbox.methods[_487];
            if (_489) {
                return _489(this, _488);
            } else {
                return this.validatebox(_487, _488);
            }
        }
        _487 = _487 || {};
        return this.each(function () {
            var _48a = $.data(this, "numberbox");
            if (_48a) {
                $.extend(_48a.options, _487);
            } else {
                _48a = $.data(this, "numberbox", { options: $.extend({}, $.fn.numberbox.defaults, $.fn.numberbox.parseOptions(this), _487), field: init(this) });
                $(this).removeAttr("disabled");
                $(this).css({ imeMode: "disabled" });
            }
            _484(this, _48a.options.disabled);
            _477(this);
            _480(this);
            _482(this);
            _473(this);
        });
    };
    $.fn.numberbox.methods = {
        options: function (jq) {
            return $.data(jq[0], "numberbox").options;
        }, destroy: function (jq) {
            return jq.each(function () {
                $.data(this, "numberbox").field.remove();
                $(this).validatebox("destroy");
                $(this).remove();
            });
        }, resize: function (jq, _48b) {
            return jq.each(function () {
                _477(this, _48b);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _484(this, true);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                _484(this, false);
            });
        }, fix: function (jq) {
            return jq.each(function () {
                _475(this, $(this).val());
            });
        }, setValue: function (jq, _48c) {
            return jq.each(function () {
                _475(this, _48c);
            });
        }, getValue: function (jq) {
            return _476(jq[0]);
        }, clear: function (jq) {
            return jq.each(function () {
                var _48d = $.data(this, "numberbox");
                _48d.field.val("");
                $(this).val("");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).numberbox("options");
                $(this).numberbox("setValue", opts.originalValue);
            });
        }
    };
    $.fn.numberbox.parseOptions = function (_48e) {
        var t = $(_48e);
        return $.extend({}, $.fn.validatebox.parseOptions(_48e), $.parser.parseOptions(_48e, ["width", "height", "decimalSeparator", "groupSeparator", "suffix", { min: "number", max: "number", precision: "number" }]), { prefix: (t.attr("prefix") ? t.attr("prefix") : undefined), disabled: (t.attr("disabled") ? true : undefined), value: (t.val() || undefined) });
    };
    $.fn.numberbox.defaults = $.extend({}, $.fn.validatebox.defaults, {
        isKeyupChange:false, /*是否在按键时就同步组件的值。默认是blur时同步值 */
        /**wanghc height:22修改成30*/
        width: "auto", height: 30, disabled: false, value: "", min: null, max: null, precision: 0, decimalSeparator: ".", groupSeparator: "", prefix: "", suffix: "", filter: function (e) {
            var opts = $(this).numberbox("options");
            if (e.which == 45) {
                return ($(this).val().indexOf("-") == -1 ? true : false);
            }
            var c = String.fromCharCode(e.which);
            if (c == opts.decimalSeparator) {
                return ($(this).val().indexOf(c) == -1 ? true : false);
            } else {
                if (c == opts.groupSeparator) {
                    return true;
                } else {
                    if ((e.which >= 48 && e.which <= 57 && e.ctrlKey == false && e.shiftKey == false) || e.which == 0 || e.which == 8) {
                        return true;
                    } else {
                        if (e.ctrlKey == true && (e.which == 99 || e.which == 118)) {
                            return true;
                        } else {
                            return false;
                        }
                    }
                }
            }
        }, formatter: function (_48f) {
            if (!_48f) {
                return _48f;
            }
            _48f = _48f + "";
            var opts = $(this).numberbox("options");
            var s1 = _48f, s2 = "";
            var dpos = _48f.indexOf(".");
            if (dpos >= 0) {
                s1 = _48f.substring(0, dpos);
                s2 = _48f.substring(dpos + 1, _48f.length);
            }
            if (opts.groupSeparator) {
                var p = /(\d+)(\d{3})/;
                while (p.test(s1)) {
                    s1 = s1.replace(p, "$1" + opts.groupSeparator + "$2");
                }
            }
            if (s2) {
                return opts.prefix + s1 + opts.decimalSeparator + s2 + opts.suffix;
            } else {
                return opts.prefix + s1 + opts.suffix;
            }
        }, parser: function (s) {
            s = s + "";
            var opts = $(this).numberbox("options");
            if (parseFloat(s) != s) {
                if (opts.prefix) {
                    s = $.trim(s.replace(new RegExp("\\" + $.trim(opts.prefix), "g"), ""));
                }
                if (opts.suffix) {
                    s = $.trim(s.replace(new RegExp("\\" + $.trim(opts.suffix), "g"), ""));
                }
                if (opts.groupSeparator) {
                    s = $.trim(s.replace(new RegExp("\\" + opts.groupSeparator, "g"), ""));
                }
                if (opts.decimalSeparator) {
                    s = $.trim(s.replace(new RegExp("\\" + opts.decimalSeparator, "g"), "."));
                }
                s = s.replace(/\s/g, "");
            }
            var val = parseFloat(s).toFixed(opts.precision);
            if (isNaN(val)) {
                val = "";
            } else {
                if (typeof (opts.min) == "number" && val < opts.min) {
                    val = opts.min.toFixed(opts.precision);
                } else {
                    if (typeof (opts.max) == "number" && val > opts.max) {
                        val = opts.max.toFixed(opts.precision);
                    }
                }
            }
            return val;
        }, onChange: function (_490, _491) {
        }
    });
})(jQuery);
(function ($) {
    function setSize(target) {
        var opts = $.data(target, "calendar").options;
        var t = $(target);
        opts.fit ? $.extend(opts, t._fit()) : t._fit(false);
        var header = t.find(".calendar-header");
        t._outerWidth(opts.width);
        t._outerHeight(opts.height);
        t.find(".calendar-body")._outerHeight(t.height() - header._outerHeight());
    };
    function init(target) {
        $(target).addClass("calendar").html("<div class=\"calendar-header\">" + "<div class=\"calendar-prevmonth\"></div>" + "<div class=\"calendar-nextmonth\"></div>" + "<div class=\"calendar-prevyear\"></div>" + "<div class=\"calendar-nextyear\"></div>" + "<div class=\"calendar-title\">" + "<span>Aprial 2010</span>" + "</div>" + "</div>" + "<div class=\"calendar-body\">" + "<div class=\"calendar-menu\">" + "<div class=\"calendar-menu-year-inner\">" + "<span class=\"calendar-menu-prev\"></span>" + "<span><input class=\"calendar-menu-year\" type=\"text\"></input></span>" + "<span class=\"calendar-menu-next\"></span>" + "</div>" + "<div class=\"calendar-menu-month-inner\">" + "</div>" + "</div>" + "</div>");
        $(target).find(".calendar-title span").hover(function () {
            $(this).addClass("calendar-menu-hover");
        }, function () {
            $(this).removeClass("calendar-menu-hover");
        }).click(function () {
            var menu = $(target).find(".calendar-menu");
            if (menu.is(":visible")) {
                menu.hide();
            } else {
                showSelectMenus(target);
            }
        });
        $(".calendar-prevmonth,.calendar-nextmonth,.calendar-prevyear,.calendar-nextyear", target).hover(function () {
            $(this).addClass("calendar-nav-hover");
        }, function () {
            $(this).removeClass("calendar-nav-hover");
        });
        $(target).find(".calendar-nextmonth").click(function () {
            showMonth(target, 1);
        });
        $(target).find(".calendar-prevmonth").click(function () {
            showMonth(target, -1);
        });
        $(target).find(".calendar-nextyear").click(function () {
            showYear(target, 1);
        });
        $(target).find(".calendar-prevyear").click(function () {
            showYear(target, -1);
        });
        $(target).bind("_resize", function () {
            var opts = $.data(target, "calendar").options;
            if (opts.fit == true) {
                setSize(target);
            }
            return false;
        });
    };
    function showMonth(target, delta) {
        var opts = $.data(target, "calendar").options;
        opts.month += delta;
        if (opts.month > 12) {
            opts.year++;
            opts.month = 1;
        } else {
            if (opts.month < 1) {
                opts.year--;
                opts.month = 12;
            }
        }
        show(target);
        var menu = $(target).find(".calendar-menu-month-inner");
        menu.find("td.calendar-selected").removeClass("calendar-selected");
        menu.find("td:eq(" + (opts.month - 1) + ")").addClass("calendar-selected");
    };
    function showYear(target, delta) {
        var opts = $.data(target, "calendar").options;
        opts.year += delta;
        show(target);
        var menu = $(target).find(".calendar-menu-year");
        menu.val(opts.year);
    };
    function showSelectMenus(target) {
        var opts = $.data(target, "calendar").options;
        $(target).find(".calendar-menu").show();
        if ($(target).find(".calendar-menu-month-inner").is(":empty")) {
            $(target).find(".calendar-menu-month-inner").empty();
            var t = $("<table class=\"calendar-mtable\"></table>").appendTo($(target).find(".calendar-menu-month-inner"));
            var idx = 0;
            for (var i = 0; i < 3; i++) {
                var tr = $("<tr></tr>").appendTo(t);
                for (var j = 0; j < 4; j++) {
                    $("<td class=\"calendar-menu-month\"></td>").html(opts.months[idx++]).attr("abbr", idx).appendTo(tr);
                }
            }
            $(target).find(".calendar-menu-prev,.calendar-menu-next").hover(function () {
                $(this).addClass("calendar-menu-hover");
            }, function () {
                $(this).removeClass("calendar-menu-hover");
            });
            $(target).find(".calendar-menu-next").click(function () {
                var y = $(target).find(".calendar-menu-year");
                if (!isNaN(y.val())) {
                    y.val(parseInt(y.val()) + 1);
                    setDate();
                }
            });
            $(target).find(".calendar-menu-prev").click(function () {
                var y = $(target).find(".calendar-menu-year");
                if (!isNaN(y.val())) {
                    y.val(parseInt(y.val() - 1));
                    setDate();
                }
            });
            $(target).find(".calendar-menu-year").keypress(function (e) {
                if (e.keyCode == 13) {
                    setDate(true);
                }
            });
            $(target).find(".calendar-menu-month").hover(function () {
                $(this).addClass("calendar-menu-hover");
            }, function () {
                $(this).removeClass("calendar-menu-hover");
            }).click(function () {
                var menu = $(target).find(".calendar-menu");
                menu.find(".calendar-selected").removeClass("calendar-selected");
                $(this).addClass("calendar-selected");
                setDate(true);
            });
        }
        function setDate(hideMenu) {
            var menu = $(target).find(".calendar-menu");
            var year = menu.find(".calendar-menu-year").val();
            var month = menu.find(".calendar-selected").attr("abbr");
            if (!isNaN(year)) {
                opts.year = parseInt(year);
                opts.month = parseInt(month);
                show(target);
            }
            if (hideMenu) {
                menu.hide();
            }
        };
        var body = $(target).find(".calendar-body");
        var sele = $(target).find(".calendar-menu");
        var seleYear = sele.find(".calendar-menu-year-inner");
        var seleMonth = sele.find(".calendar-menu-month-inner");
        seleYear.find("input").val(opts.year).focus();
        seleMonth.find("td.calendar-selected").removeClass("calendar-selected");
        seleMonth.find("td:eq(" + (opts.month - 1) + ")").addClass("calendar-selected");
        sele._outerWidth(body._outerWidth());
        sele._outerHeight(body._outerHeight());
        seleMonth._outerHeight(sele.height() - seleYear._outerHeight());
    };
    function getWeeks(target, year, month) {
        var opts = $.data(target, "calendar").options;
        var dates = [];
        var lastDay = new Date(year, month, 0).getDate();
        for (var i = 1; i <= lastDay; i++) {
            dates.push([year, month, i]);
        }
        var weeks = [], week = [];
        var memoDay = -1;
        while (dates.length > 0) {
            var date = dates.shift();
            week.push(date);
            var day = new Date(date[0], date[1] - 1, date[2]).getDay();
            if (memoDay == day) {
                day = 0;
            } else {
                if (day == (opts.firstDay == 0 ? 7 : opts.firstDay) - 1) {
                    weeks.push(week);
                    week = [];
                }
            }
            memoDay = day;
        }
        if (week.length) {
            weeks.push(week);
        }
        var firstWeek = weeks[0];
        if (firstWeek.length < 7) {
            while (firstWeek.length < 7) {
                var firstDate = firstWeek[0];
                var date = new Date(firstDate[0], firstDate[1] - 1, firstDate[2] - 1);
                firstWeek.unshift([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
            }
        } else {
            var firstDate = firstWeek[0];
            var week = [];
            for (var i = 1; i <= 7; i++) {
                var date = new Date(firstDate[0], firstDate[1] - 1, firstDate[2] - i);
                week.unshift([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
            }
            weeks.unshift(week);
        }
        var lastWeek = weeks[weeks.length - 1];
        while (lastWeek.length < 7) {
            var lastDate = lastWeek[lastWeek.length - 1];
            var date = new Date(lastDate[0], lastDate[1] - 1, lastDate[2] + 1);
            lastWeek.push([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
        }
        if (weeks.length < 6) {
            var lastDate = lastWeek[lastWeek.length - 1];
            var week = [];
            for (var i = 1; i <= 7; i++) {
                var date = new Date(lastDate[0], lastDate[1] - 1, lastDate[2] + i);
                week.push([date.getFullYear(), date.getMonth() + 1, date.getDate()]);
            }
            weeks.push(week);
        }
        return weeks;
    };
    function show(target) {
        var opts = $.data(target, "calendar").options;
        if (opts.current && !opts.validator.call(target, opts.current)) {
            opts.current = null;
        }
        var now = new Date();
        var todayInfo = now.getFullYear() + "," + (now.getMonth() + 1) + "," + now.getDate();
        var currentInfo = opts.current ? (opts.current.getFullYear() + "," + (opts.current.getMonth() + 1) + "," + opts.current.getDate()) : "";
        var saIndex = 6 - opts.firstDay;
        var suIndex = saIndex + 1;
        if (saIndex >= 7) {
            saIndex -= 7;
        }
        if (suIndex >= 7) {
            suIndex -= 7;
        }
        $(target).find(".calendar-title span").html(opts.months[opts.month - 1] + " " + opts.year);
        var body = $(target).find("div.calendar-body");
        body.children("table").remove();
        var data = ["<table class=\"calendar-dtable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\">"];
        data.push("<thead><tr>");
        for (var i = opts.firstDay; i < opts.weeks.length; i++) {
            data.push("<th>" + opts.weeks[i] + "</th>");
        }
        for (var i = 0; i < opts.firstDay; i++) {
            data.push("<th>" + opts.weeks[i] + "</th>");
        }
        data.push("</tr></thead>");
        data.push("<tbody>");
        var weeks = getWeeks(target, opts.year, opts.month);
        for (var i = 0; i < weeks.length; i++) {
            var week = weeks[i];
            var cls = "";
            if (i == 0) {
                cls = "calendar-first";
            } else {
                if (i == weeks.length - 1) {
                    cls = "calendar-last";
                }
            }
            data.push("<tr class=\"" + cls + "\">");
            for (var j = 0; j < week.length; j++) {
                var day = week[j];
                var s = day[0] + "," + day[1] + "," + day[2];
                var dvalue = new Date(day[0], parseInt(day[1]) - 1, day[2]);
                var d = opts.formatter.call(target, dvalue);
                var css = opts.styler.call(target, dvalue);
                var classValue = "";
                var styleValue = "";
                if (typeof css == "string") {
                    styleValue = css;
                } else {
                    if (css) {
                        classValue = css["class"] || "";
                        styleValue = css["style"] || "";
                    }
                }
                var cls = "calendar-day";
                if (!(opts.year == day[0] && opts.month == day[1])) {
                    cls += " calendar-other-month";
                }
                if (s == todayInfo) {
                    cls += " calendar-today";
                }
                if (s == currentInfo) {
                    cls += " calendar-selected";
                }
                if (j == saIndex) {
                    cls += " calendar-saturday";
                } else {
                    if (j == suIndex) {
                        cls += " calendar-sunday";
                    }
                }
                if (j == 0) {
                    cls += " calendar-first";
                } else {
                    if (j == week.length - 1) {
                        cls += " calendar-last";
                    }
                }
                cls += " " + classValue;
                if (!opts.validator.call(target, dvalue)) {
                    cls += " calendar-disabled";
                }
                data.push("<td class=\"" + cls + "\" abbr=\"" + s + "\" style=\"" + styleValue + "\">" + d + "</td>");
            }
            data.push("</tr>");
        }
        data.push("</tbody>");
        data.push("</table>");
        body.append(data.join(""));
        var t = body.children("table.calendar-dtable").prependTo(body);
        t.find("td.calendar-day:not(.calendar-disabled)").hover(function () {
            $(this).addClass("calendar-hover");
        }, function () {
            $(this).removeClass("calendar-hover");
        }).click(function () {
            var oldValue = opts.current;
            t.find(".calendar-selected").removeClass("calendar-selected");
            $(this).addClass("calendar-selected");
            var parts = $(this).attr("abbr").split(",");
            opts.current = new Date(parts[0], parseInt(parts[1]) - 1, parts[2]);
            opts.onSelect.call(target, opts.current);
            if (!oldValue || oldValue.getTime() != opts.current.getTime()) {
                opts.onChange.call(target, opts.current, oldValue);
            }
        });
    };
    $.fn.calendar = function (options, param) {
        if (typeof options == "string") {
            return $.fn.calendar.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "calendar");
            if (state) {
                $.extend(state.options, options);
            } else {
                state = $.data(this, "calendar", { options: $.extend({}, $.fn.calendar.defaults, $.fn.calendar.parseOptions(this), options) });
                init(this);
            }
            if (state.options.border == false) {
                $(this).addClass("calendar-noborder");
            }
            setSize(this);
            show(this);
            $(this).find("div.calendar-menu").hide();
        });
    };
    $.fn.calendar.methods = {
        options: function (jq) {
            return $.data(jq[0], "calendar").options;
        }, resize: function (jq) {
            return jq.each(function () {
                setSize(this);
            });
        }, moveTo: function (jq, date) {
            return jq.each(function () {
                var opts = $(this).calendar("options");
                if (opts.validator.call(this, date)) {
                    var oldValue = opts.current;
                    $(this).calendar({ year: date.getFullYear(), month: date.getMonth() + 1, current: date });
                    if (!oldValue || oldValue.getTime() != date.getTime()) {
                        opts.onChange.call(this, opts.current, oldValue);
                    }
                }
            });
        }
    };
    $.fn.calendar.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["width", "height", { firstDay: "number", fit: "boolean", border: "boolean" }]));
    };
    $.fn.calendar.defaults = {
        width: 180, height: 180, fit: false, border: true, firstDay: 0, weeks: ["S", "M", "T", "W", "T", "F", "S"], months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"], year: new Date().getFullYear(), month: new Date().getMonth() + 1, current: (function () {
            var d = new Date();
            return new Date(d.getFullYear(), d.getMonth(), d.getDate());
        })(), formatter: function (date) {
            return date.getDate();
        }, styler: function (date) {
            return "";
        }, validator: function (date) {
            return true;
        }, onSelect: function (date) {
        }, onChange: function (newDate, oldDate) {
        }
    };
})(jQuery);
(function ($) {
    function init(_4c0) {
        var _4c1 = $("<span class=\"spinner\">" + "<span class=\"spinner-arrow\">" + "<span class=\"spinner-arrow-up\"></span>" + "<span class=\"spinner-arrow-down\"></span>" + "</span>" + "</span>").insertAfter(_4c0);
        $(_4c0).addClass("spinner-text spinner-f").prependTo(_4c1);
        return _4c1;
    };
    function _4c2(_4c3, _4c4) {
        var opts = $.data(_4c3, "spinner").options;
        var _4c5 = $.data(_4c3, "spinner").spinner;
        if (_4c4) {
            opts.width = _4c4;
        }
        var _4c6 = $("<div style=\"display:none\"></div>").insertBefore(_4c5);
        _4c5.appendTo("body");
        if (isNaN(opts.width)) {
            opts.width = $(_4c3).outerWidth();
        }
        var _4c7 = _4c5.find(".spinner-arrow");
        _4c5._outerWidth(opts.width)._outerHeight(opts.height);
        $(_4c3)._outerWidth(_4c5.width() - _4c7.outerWidth());
        $(_4c3).css({ height: _4c5.height() + "px", lineHeight: _4c5.height() + "px" });
        _4c7._outerHeight(_4c5.height());
        _4c7.find("span")._outerHeight(_4c7.height() / 2);
        _4c5.insertAfter(_4c6);
        _4c6.remove();
    };
    function _4c8(_4c9) {
        var opts = $.data(_4c9, "spinner").options;
        var _4ca = $.data(_4c9, "spinner").spinner;
        $(_4c9).unbind(".spinner");
        _4ca.find(".spinner-arrow-up,.spinner-arrow-down").unbind(".spinner");
        if (!opts.disabled && !opts.readonly) {
            _4ca.find(".spinner-arrow-up").bind("mouseenter.spinner", function () {
                $(this).addClass("spinner-arrow-hover");
            }).bind("mouseleave.spinner", function () {
                $(this).removeClass("spinner-arrow-hover");
            }).bind("click.spinner", function () {
                opts.spin.call(_4c9, false);
                opts.onSpinUp.call(_4c9);
                $(_4c9).validatebox("validate");
            });
            _4ca.find(".spinner-arrow-down").bind("mouseenter.spinner", function () {
                $(this).addClass("spinner-arrow-hover");
            }).bind("mouseleave.spinner", function () {
                $(this).removeClass("spinner-arrow-hover");
            }).bind("click.spinner", function () {
                opts.spin.call(_4c9, true);
                opts.onSpinDown.call(_4c9);
                $(_4c9).validatebox("validate");
            });
            $(_4c9).bind("change.spinner", function () {
                $(this).spinner("setValue", $(this).val());
            });
            _4ca.find('.spinner-text').unbind("keydown.spinner").bind("keydown.spinner", function (e) {
                if ("undefined" ==typeof e.keyCode){return ;}
                switch (e.keyCode) {
                    case 38:
                        opts.keyHandler.up.call(_4c9, e);
                        break;
                    case 40:
                        opts.keyHandler.down.call(_4c9, e);
                        break;
                    case 13:
                        e.preventDefault();
                        opts.keyHandler.enter.call(_4c9, e);
                        return false;
                    default:;
                }
            });
        }
    };
    function _4cb(_4cc, _4cd) {
        var opts = $.data(_4cc, "spinner").options;
        if (_4cd) {
            opts.disabled = true;
            $(_4cc).attr("disabled", true);
            $.data(_4cc, "spinner").spinner.addClass("disabled");  //cryze spinner addClass disabled
        } else {
            opts.disabled = false;
            $(_4cc).removeAttr("disabled");
            $.data(_4cc, "spinner").spinner.removeClass("disabled");  //cryze spinner removeClass disabled
        }
    };
    function _4ce(_4cf, mode) {
        var _4d0 = $.data(_4cf, "spinner");
        var opts = _4d0.options;
        opts.readonly = mode == undefined ? true : mode;
        var _4d1 = opts.readonly ? true : (!opts.editable);
        $(_4cf).attr("readonly", _4d1).css("cursor", _4d1 ? "pointer" : "");
    };
    $.fn.spinner = function (_4d2, _4d3) {
        if (typeof _4d2 == "string") {
            var _4d4 = $.fn.spinner.methods[_4d2];
            if (_4d4) {
                return _4d4(this, _4d3);
            } else {
                return this.validatebox(_4d2, _4d3);
            }
        }
        _4d2 = _4d2 || {};
        return this.each(function () {
            var _4d5 = $.data(this, "spinner");
            if (_4d5) {
                $.extend(_4d5.options, _4d2);
            } else {
                _4d5 = $.data(this, "spinner", { options: $.extend({}, $.fn.spinner.defaults, $.fn.spinner.parseOptions(this), _4d2), spinner: init(this) });
                $(this).removeAttr("disabled");
            }
            _4d5.options.originalValue = _4d5.options.value;
            $(this).val(_4d5.options.value);
            _4cb(this, _4d5.options.disabled);
            _4ce(this, _4d5.options.readonly);
            // _4c2为resize方法,render后不用再resize //neer 2019-03-26 增加if判断
            if (true !== $(this).data("rendered")) _4c2(this);
            $(this).validatebox(_4d5.options);
            _4c8(this);
            $(this).data("rendered", true); //neer 2019-03-26
        });
    };
    $.fn.spinner.methods = {
        options: function (jq) {
            var opts = $.data(jq[0], "spinner").options;
            return $.extend(opts, { value: jq.val() });
        }, destroy: function (jq) {
            return jq.each(function () {
                var _4d6 = $.data(this, "spinner").spinner;
                $(this).validatebox("destroy");
                _4d6.remove();
            });
        }, resize: function (jq, _4d7) {
            return jq.each(function () {
                _4c2(this, _4d7);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                _4cb(this, false);
                _4c8(this);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _4cb(this, true);
                _4c8(this);
            });
        }, readonly: function (jq, mode) {
            return jq.each(function () {
                _4ce(this, mode);
                _4c8(this);
            });
        }, getValue: function (jq) {
            return jq.val();
        }, setValue: function (jq, _4d8) {
            return jq.each(function () {
                var opts = $.data(this, "spinner").options;
                var _4d9 = opts.value;
                opts.value = _4d8;
                $(this).val(_4d8);
                if (_4d9 != _4d8) {
                    opts.onChange.call(this, _4d8, _4d9);
                }
            });
        }, clear: function (jq) {
            return jq.each(function () {
                var opts = $.data(this, "spinner").options;
                opts.value = "";
                $(this).val("");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).spinner("options");
                $(this).spinner("setValue", opts.originalValue);
            });
        }
    };
    $.fn.spinner.parseOptions = function (_4da) {
        var t = $(_4da);
        return $.extend({}, $.fn.validatebox.parseOptions(_4da), $.parser.parseOptions(_4da, ["width", "height", "min", "max", { increment: "number", editable: "boolean" }]), { value: (t.val() || undefined), disabled: (t.attr("disabled") ? true : undefined), readonly: (t.attr("readonly") ? true : undefined) });
    };
    $.fn.spinner.defaults = $.extend({}, $.fn.validatebox.defaults, {
        /** wanghc height 22--->30*/
        width: "auto", height: 30, deltaX: 19, value: "", min: null, max: null, increment: 1, editable: true, disabled: false, readonly: false, spin: function (down) {
        }, onSpinUp: function () {
        }, onSpinDown: function () {
        }, onChange: function (_4db, _4dc) {
        },keyHandler: {
            up: function (e) {
            }, down: function (e) {
            }, enter: function (e) {
            }
        }
    });
})(jQuery);
(function ($) {
    function _4dd(_4de) {
        $(_4de).addClass("numberspinner-f");
        var opts = $.data(_4de, "numberspinner").options;
        $(_4de).spinner(opts).numberbox($.extend({}, opts, { width: "auto" }));
    };
    function _4df(_4e0, down) {
        var opts = $.data(_4e0, "numberspinner").options;
        var v = parseFloat($(_4e0).numberbox("getValue") || opts.value) || 0;
        if (down == true) {
            v -= opts.increment;
        } else {
            v += opts.increment;
        }
        $(_4e0).numberbox("setValue", v);
    };
    $.fn.numberspinner = function (_4e1, _4e2) {
        if (typeof _4e1 == "string") {
            var _4e3 = $.fn.numberspinner.methods[_4e1];
            if (_4e3) {
                return _4e3(this, _4e2);
            } else {
                return this.spinner(_4e1, _4e2);
            }
        }
        _4e1 = _4e1 || {};
        return this.each(function () {
            var _4e4 = $.data(this, "numberspinner");
            if (_4e4) {
                $.extend(_4e4.options, _4e1);
            } else {
                $.data(this, "numberspinner", { options: $.extend({}, $.fn.numberspinner.defaults, $.fn.numberspinner.parseOptions(this), _4e1) });
            }
            _4dd(this);
        });
    };
    $.fn.numberspinner.methods = {
        options: function (jq) {
            var opts = $.data(jq[0], "numberspinner").options;
            return $.extend(opts, { value: jq.numberbox("getValue"), originalValue: jq.numberbox("options").originalValue });
        }, setValue: function (jq, _4e5) {
            return jq.each(function () {
                $(this).numberbox("setValue", _4e5);
            });
        }, getValue: function (jq) {
            return jq.numberbox("getValue");
        }, clear: function (jq) {
            return jq.each(function () {
                $(this).spinner("clear");
                $(this).numberbox("clear");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).numberspinner("options");
                $(this).numberspinner("setValue", opts.originalValue);
            });
        }
    };
    $.fn.numberspinner.parseOptions = function (_4e6) {
        return $.extend({}, $.fn.spinner.parseOptions(_4e6), $.fn.numberbox.parseOptions(_4e6), {});
    };
    $.fn.numberspinner.defaults = $.extend({}, $.fn.spinner.defaults, $.fn.numberbox.defaults, {
        spin: function (down) {
            _4df(this, down);
        }
    });
})(jQuery);
(function ($) {
    function _4e7(_4e8) {
        var opts = $.data(_4e8, "timespinner").options;
        $(_4e8).addClass("timespinner-f");
        $(_4e8).spinner(opts);
        $(_4e8).unbind(".timespinner");
        $(_4e8).bind("click.timespinner", function () {
            var _4e9 = 0;
            if (this.selectionStart != null) {
                _4e9 = this.selectionStart;
            } else {
                if (this.createTextRange) {
                    var _4ea = _4e8.createTextRange();
                    var s = document.selection.createRange();
                    s.setEndPoint("StartToStart", _4ea);
                    _4e9 = s.text.length;
                }
            }
            opts.highlight = calHighlightTypeByPosi(_4e9);
            _4ec(_4e8);
        }).bind("blur.timespinner", function () {
            _4eb(_4e8);
        });
    };
    /** 通过光标位置计算出,应该高亮的类型0,1,2*/
    function calHighlightTypeByPosi(posi){
        if (posi >= 0 && posi <= 2) {
            return 0;
        } else {
            if (posi >= 3 && posi <= 5) {
                return 1;
            } else {
                if (posi >= 6 && posi <= 8) {
                    return 2;
                }
            }
        }
        return 0;
    }
    //highlight光标所在区
    function _4ec(_4ed) {
        var opts = $.data(_4ed, "timespinner").options;
        var _4ee = 0, end = 0;
        if (_4ed.selectionStart!=null){
            // 光标在哪,哪就高亮
            opts.highlight = calHighlightTypeByPosi(_4ed.selectionStart);
        }
        if (opts.highlight == 0) {
            _4ee = 0;
            end = 2;
        } else {
            if (opts.highlight == 1) {
                _4ee = 3;
                end = 5;
            } else {
                if (opts.highlight == 2) {
                    _4ee = 6;
                    end = 8;
                }
            }
        }
        if (_4ed.selectionStart != null) {
            _4ed.setSelectionRange(_4ee, end);
        } else {
            if (_4ed.createTextRange) {
                var _4ef = _4ed.createTextRange();
                _4ef.collapse();
                _4ef.moveEnd("character", end);
                _4ef.moveStart("character", _4ee);
                _4ef.select();
            }
        }
        $(_4ed).focus();
    };
    function getHMSArr(tm) {
        var arr = [];
        if (tm){
            tm = tm.replace(/\s/g,"");
            var reg = /^([0-2][0-9])([0-6][0-9])([0-9]*)$/;
            var reg1 = /^([3-9])([0-6][0-9])([0-6]*)$/;
            var reg2 = /^([0-2][0-9])$/  /*hour*/
            if(reg2.test(tm)){
                arr = tm.match(reg2);
                arr.splice(0,1);
            }else if(reg.test(tm)){
                arr = tm.match(reg);
                arr.splice(0,1);
            }else if(reg1.test(tm)){
                arr = tm.match(reg1);
                arr.splice(0,1);
            }
        }
        return arr;
    }
    function _4f0(_4f1, _4f2) {
        var opts = $.data(_4f1, "timespinner").options;
        if (!_4f2) {
            return null;
        }
        var vv = [];
        if (_4f2.indexOf(opts.separator)>-1){
            vv = _4f2.split(opts.separator);
            for (var i = 0; i < vv.length; i++) {
                if (isNaN(vv[i])) {
                    return null;
                }
            }
        }else{
            vv = getHMSArr(_4f2);
        }
        
        while (vv.length < 3) {
            vv.push(0);
        }
        return new Date(1900, 0, 0, vv[0], vv[1], vv[2]);
    };
    function _4eb(_4f3) {
        var opts = $.data(_4f3, "timespinner").options;
        var _4f4 = $(_4f3).val();
        var time = _4f0(_4f3, _4f4);
        if (!time) {
            opts.value = "";
            $(_4f3).spinner("setValue", "");
            return;
        }
        var _4f5 = _4f0(_4f3, opts.min);
        var _4f6 = _4f0(_4f3, opts.max);
        if (_4f5 && _4f5 > time) {
            time = _4f5;
        }
        if (_4f6 && _4f6 < time) {
            time = _4f6;
        }
        var tt = [_4f7(time.getHours()), _4f7(time.getMinutes())];
        if (opts.showSeconds) {
            tt.push(_4f7(time.getSeconds()));
        }
        var val = tt.join(opts.separator);
        opts.value = val;
        $(_4f3).spinner("setValue", val);
        function _4f7(_4f8) {
            return (_4f8 < 10 ? "0" : "") + _4f8;
        };
    };
    function _4f9(_4fa, down) {
        var opts = $.data(_4fa, "timespinner").options;
        var val = $(_4fa).val();
        if (val == "") {
            val = [0, 0, 0].join(opts.separator);
        }
        var vv = val.split(opts.separator);
        for (var i = 0; i < vv.length; i++) {
            vv[i] = parseInt(vv[i], 10);
        }
        if (down == true) {
            vv[opts.highlight] -= opts.increment;
        } else {
            vv[opts.highlight] += opts.increment;
        }
        //赋值前记录光标位置
        var orgStart = _4fa.selectionStart;
        //val方法赋值会修改selectionStart为最右边
        $(_4fa).val(vv.join(opts.separator));
        _4eb(_4fa);
        // 赋值结束后,重置光标位置
        _4fa.selectionStart = orgStart;
        _4ec(_4fa);
    };
    $.fn.timespinner = function (_4fb, _4fc) {
        if (typeof _4fb == "string") {
            var _4fd = $.fn.timespinner.methods[_4fb];
            if (_4fd) {
                return _4fd(this, _4fc);
            } else {
                return this.spinner(_4fb, _4fc);
            }
        }
        _4fb = _4fb || {};
        return this.each(function () {
            var _4fe = $.data(this, "timespinner");
            if (_4fe) {
                $.extend(_4fe.options, _4fb);
            } else {
                $.data(this, "timespinner", { options: $.extend({}, $.fn.timespinner.defaults, $.fn.timespinner.parseOptions(this), _4fb) });
            }
            _4e7(this);
        });
    };
    $.fn.timespinner.methods = {
        options: function (jq) {
            var opts = $.data(jq[0], "timespinner").options;
            return $.extend(opts, { value: jq.val(), originalValue: jq.spinner("options").originalValue });
        }, setValue: function (jq, _4ff) {
            return jq.each(function () {
                $(this).val(_4ff);
                _4eb(this);
            });
        }, getHours: function (jq) {
            var opts = $.data(jq[0], "timespinner").options;
            var vv = jq.val().split(opts.separator);
            return parseInt(vv[0], 10);
        }, getMinutes: function (jq) {
            var opts = $.data(jq[0], "timespinner").options;
            var vv = jq.val().split(opts.separator);
            return parseInt(vv[1], 10);
        }, getSeconds: function (jq) {
            var opts = $.data(jq[0], "timespinner").options;
            var vv = jq.val().split(opts.separator);
            return parseInt(vv[2], 10) || 0;
        }
    };
    $.fn.timespinner.parseOptions = function (_500) {
        return $.extend({}, $.fn.spinner.parseOptions(_500), $.parser.parseOptions(_500, ["separator", { showSeconds: "boolean", highlight: "number" }]));
    };
    $.fn.timespinner.defaults = $.extend({}, $.fn.spinner.defaults, {
        separator: ":", showSeconds: false, highlight: 0, spin: function (down) {
            _4f9(this, down);
        },keyHandler: {
            up: function (e) {
                e.preventDefault();
                _4ec(this);  //highlight光标所在区
                _4f9(this, false);
                return false;
            }, down: function (e) {
                e.preventDefault();
                _4ec(this); //highlight光标所在区
                _4f9(this, true);
                return false;
            }, enter: function (e) {
                _4eb(this);
            }
        }
    });
})(jQuery);
(function ($) {
    var _501 = 0;
    function _502(a, o) {
        for (var i = 0, len = a.length; i < len; i++) {
            if (a[i] == o) {
                return i;
            }
        }
        return -1;
    };
    function _503(a, o, id) {
        if (typeof o == "string") {
            for (var i = 0, len = a.length; i < len; i++) {
                if (a[i][o] == id) {
                    a.splice(i, 1);
                    return;
                }
            }
        } else {
            var _504 = _502(a, o);
            if (_504 != -1) {
                a.splice(_504, 1);
            }
        }
    };
    function _505(a, o, r) {
        for (var i = 0, len = a.length; i < len; i++) {
            if (a[i][o] == r[o]) {
                return;
            }
        }
        a.push(r);
    };
    function _506(_507) {
        var _508 = $.data(_507, "datagrid");
        var opts = _508.options;
        var _509 = _508.panel;
        var dc = _508.dc;
        var ss = null;
        if (opts.sharedStyleSheet) {
            ss = typeof opts.sharedStyleSheet == "boolean" ? "head" : opts.sharedStyleSheet;
        } else {
            ss = _509.closest("div.datagrid-view");
            if (!ss.length) {
                ss = dc.view;
            }
        }
        var cc = $(ss);
        var _50a = $.data(cc[0], "ss");
        if (!_50a) {
            _50a = $.data(cc[0], "ss", { cache: {}, dirty: [] });
        }
        return {
            add: function (_50b) {
                var ss = ["<style type=\"text/css\" hisui=\"true\">"];
                for (var i = 0; i < _50b.length; i++) {
                    _50a.cache[_50b[i][0]] = { width: _50b[i][1] };
                }
                var _50c = 0;
                for (var s in _50a.cache) {
                    var item = _50a.cache[s];
                    item.index = _50c++;
                    ss.push(s + "{width:" + item.width + "}");
                }
                ss.push("</style>");
                $(ss.join("\n")).appendTo(cc);
                cc.children("style[hisui]:not(:last)").remove();
            }, getRule: function (_50d) {
                var _50e = cc.children("style[hisui]:last")[0];
                var _50f = _50e.styleSheet ? _50e.styleSheet : (_50e.sheet || document.styleSheets[document.styleSheets.length - 1]);
                var _510 = _50f.cssRules || _50f.rules;
                return _510[_50d];
            }, set: function (_511, _512) {
                var item = _50a.cache[_511];
                if (item) {
                    item.width = _512;
                    var rule = this.getRule(item.index);
                    if (rule) {
                        rule.style["width"] = _512;
                    }
                }
            }, remove: function (_513) {
                var tmp = [];
                for (var s in _50a.cache) {
                    if (s.indexOf(_513) == -1) {
                        tmp.push([s, _50a.cache[s].width]);
                    }
                }
                _50a.cache = {};
                this.add(tmp);
            }, dirty: function (_514) {
                if (_514) {
                    _50a.dirty.push(_514);
                }
            }, clean: function () {
                for (var i = 0; i < _50a.dirty.length; i++) {
                    this.remove(_50a.dirty[i]);
                }
                _50a.dirty = [];
            }
        };
    };
    function _515(_516, _517) {
        var opts = $.data(_516, "datagrid").options;
        var _518 = $.data(_516, "datagrid").panel;
        if (_517) {
            if (_517.width) {
                opts.width = _517.width;
            }
            if (_517.height) {
                opts.height = _517.height;
            }
        }
        if (opts.fit == true) {
            var p = _518.panel("panel").parent();
            opts.width = p.width();
            opts.height = p.height();
        }
        _518.panel("resize", { width: opts.width, height: opts.height });
    };
    function _519(_51a) {
        var opts = $.data(_51a, "datagrid").options;
        var dc = $.data(_51a, "datagrid").dc;
        var wrap = $.data(_51a, "datagrid").panel;
        var _51b = wrap.width();
        var _51c = wrap.height();
        var view = dc.view;
        var _51d = dc.view1;
        var _51e = dc.view2;
        var _51f = _51d.children("div.datagrid-header");
        var _520 = _51e.children("div.datagrid-header");
        var _521 = _51f.find("table");
        var _522 = _520.find("table");
        view.width(_51b);
        var _523 = _51f.children("div.datagrid-header-inner").show();
        //console.log("rownumber-数字列的宽");
        //console.log(_523.find("table").width());
        _51d.width(_523.find("table").width());
        if (!opts.showHeader) {
            _523.hide();
        }
        _51e.width(_51b - _51d._outerWidth());
        _51d.children("div.datagrid-header,div.datagrid-body,div.datagrid-footer").width(_51d.width());
        _51e.children("div.datagrid-header,div.datagrid-body,div.datagrid-footer").width(_51e.width());
        var hh;
        _51f.css("height", "");
        _520.css("height", "");
        _521.css("height", "");
        _522.css("height", "");
        hh = Math.max(_521.height(), _522.height());
        _521.height(hh);
        _522.height(hh);
        _51f.add(_520)._outerHeight(hh);
        if (opts.height != "auto") {
            var _524 = _51c - _51e.children("div.datagrid-header")._outerHeight() - _51e.children("div.datagrid-footer")._outerHeight() - wrap.children("div.datagrid-toolbar")._outerHeight()- wrap.children("div.datagrid-btoolbar")._outerHeight();
            wrap.children("div.datagrid-pager").each(function () {
                _524 -= $(this)._outerHeight();
            });
            dc.body1.add(dc.body2).children("table.datagrid-btable-frozen").css({ position: "absolute", top: dc.header2._outerHeight() });
            var _525 = dc.body2.children("table.datagrid-btable-frozen")._outerHeight();
            _51d.add(_51e).children("div.datagrid-body").css({ marginTop: _525, height: (_524 - _525) });
        }
        view.height(_51e.height());
    };
    function _526(_527, _528, _529) {
        var rows = $.data(_527, "datagrid").data.rows;
        var opts = $.data(_527, "datagrid").options;
        var dc = $.data(_527, "datagrid").dc;
        if (!dc.body1.is(":empty") && (!opts.nowrap || opts.autoRowHeight || _529)) {
            if (_528 != undefined) {
                var tr1 = opts.finder.getTr(_527, _528, "body", 1);
                var tr2 = opts.finder.getTr(_527, _528, "body", 2);
                _52a(tr1, tr2);
            } else {
                var tr1 = opts.finder.getTr(_527, 0, "allbody", 1);
                var tr2 = opts.finder.getTr(_527, 0, "allbody", 2);
                _52a(tr1, tr2);
                if (opts.showFooter) {
                    var tr1 = opts.finder.getTr(_527, 0, "allfooter", 1);
                    var tr2 = opts.finder.getTr(_527, 0, "allfooter", 2);
                    _52a(tr1, tr2);
                }
            }
        }
        _519(_527);
        if (opts.height == "auto") {
            var _52b = dc.body1.parent();
            var _52c = dc.body2;
            var _52d = _52e(_52c);
            var _52f = _52d.height;
            if (_52d.width > _52c.width()) {
                _52f += 18;
            }
            _52b.height(_52f);
            _52c.height(_52f);
            dc.view.height(dc.view2.height());
        }
        dc.body2.triggerHandler("scroll");
        function _52a(trs1, trs2) {
            for (var i = 0; i < trs2.length; i++) {
                var tr1 = $(trs1[i]);
                var tr2 = $(trs2[i]);
                tr1.css("height", "");
                tr2.css("height", "");
                var _530 = Math.max(tr1.height(), tr2.height());
                tr1.css("height", _530);
                tr2.css("height", _530);
            }
        };
        function _52e(cc) {
            var _531 = 0;
            var _532 = 0;
            $(cc).children().each(function () {
                var c = $(this);
                if (c.is(":visible")) {
                    _532 += c._outerHeight();
                    if (_531 < c._outerWidth()) {
                        _531 = c._outerWidth();
                    }
                }
            });
            return { width: _531, height: _532 };
        };
    };
    function _533(_534, _535) {
        var _536 = $.data(_534, "datagrid");
        var opts = _536.options;
        var dc = _536.dc;
        if (!dc.body2.children("table.datagrid-btable-frozen").length) {
            dc.body1.add(dc.body2).prepend("<table class=\"datagrid-btable datagrid-btable-frozen\" cellspacing=\"0\" cellpadding=\"0\"></table>");
        }
        _537(true);
        _537(false);
        _519(_534);
        function _537(_538) {
            var _539 = _538 ? 1 : 2;
            var tr = opts.finder.getTr(_534, _535, "body", _539);
            (_538 ? dc.body1 : dc.body2).children("table.datagrid-btable-frozen").append(tr);
        };
    };
    function _53a(_53b, _53c) {
        function _53d() {
            var _53e = [];
            var _53f = [];
            $(_53b).children("thead").each(function () {
                var opt = $.parser.parseOptions(this, [{ frozen: "boolean" }]);
                $(this).find("tr").each(function () {
                    var cols = [];
                    $(this).find("th").each(function () {
                        var th = $(this);
                        var col = $.extend({}, $.parser.parseOptions(this, ["field", "align", "halign", "order", { sortable: "boolean", checkbox: "boolean", resizable: "boolean", fixed: "boolean" }, { rowspan: "number", colspan: "number", width: "number" }]), { title: (th.html() || undefined), hidden: (th.attr("hidden") ? true : undefined), formatter: (th.attr("formatter") ? eval(th.attr("formatter")) : undefined), styler: (th.attr("styler") ? eval(th.attr("styler")) : undefined), sorter: (th.attr("sorter") ? eval(th.attr("sorter")) : undefined) });
                        if (th.attr("editor")) {
                            var s = $.trim(th.attr("editor"));
                            if (s.substr(0, 1) == "{") {
                                col.editor = eval("(" + s + ")");
                            } else {
                                col.editor = s;
                            }
                        }
                        cols.push(col);
                    });
                    opt.frozen ? _53e.push(cols) : _53f.push(cols);
                });
            });
            return [_53e, _53f];
        };
        var _540 = $("<div class=\"datagrid-wrap\">" + "<div class=\"datagrid-view\">" + "<div class=\"datagrid-view1\">" + "<div class=\"datagrid-header\">" + "<div class=\"datagrid-header-inner\"></div>" + "</div>" + "<div class=\"datagrid-body\">" + "<div class=\"datagrid-body-inner\"></div>" + "</div>" + "<div class=\"datagrid-footer\">" + "<div class=\"datagrid-footer-inner\"></div>" + "</div>" + "</div>" + "<div class=\"datagrid-view2\">" + "<div class=\"datagrid-header\">" + "<div class=\"datagrid-header-inner\"></div>" + "</div>" + "<div class=\"datagrid-body\"></div>" + "<div class=\"datagrid-footer\">" + "<div class=\"datagrid-footer-inner\"></div>" + "</div>" + "</div>" + "</div>" + "</div>").insertAfter(_53b);
        _540.panel({ doSize: false });
        _540.panel("panel").addClass("datagrid").bind("_resize", function (e, _541) {
            var opts = $.data(_53b, "datagrid").options;
            if (opts.fit == true || _541) {
                _515(_53b);
                setTimeout(function () {
                    if ($.data(_53b, "datagrid")) {
                        _542(_53b);
                    }
                }, 0);
            }
            return false;
        });
        //wanghc 2018-1-11 add code --> addClass("datagrid-f") ---> treegrid->checkbox-bind rowevent
        $(_53b).addClass("datagrid-f").hide().appendTo(_540.children("div.datagrid-view"));
        var cc = _53d();
        var view = _540.children("div.datagrid-view");
        var _543 = view.children("div.datagrid-view1");
        var _544 = view.children("div.datagrid-view2");
        return { panel: _540, frozenColumns: cc[0], columns: cc[1], dc: { view: view, view1: _543, view2: _544, header1: _543.children("div.datagrid-header").children("div.datagrid-header-inner"), header2: _544.children("div.datagrid-header").children("div.datagrid-header-inner"), body1: _543.children("div.datagrid-body").children("div.datagrid-body-inner"), body2: _544.children("div.datagrid-body"), footer1: _543.children("div.datagrid-footer").children("div.datagrid-footer-inner"), footer2: _544.children("div.datagrid-footer").children("div.datagrid-footer-inner") } };
    };
    function _545(_546) {
        var _547 = $.data(_546, "datagrid");
        var opts = _547.options;
        var dc = _547.dc;
        var _548 = _547.panel;
        _547.ss = $(_546).datagrid("createStyleSheet");
        _548.panel($.extend({}, opts, {
            id: null, doSize: false, onResize: function (_549, _54a) {
                setTimeout(function () {
                    if ($.data(_546, "datagrid")) {
                        _519(_546);
                        _579(_546);
                        opts.onResize.call(_548, _549, _54a);
                    }
                }, 0);
            }, onExpand: function () {
                _526(_546);
                opts.onExpand.call(_548);
            }
        }));
        _547.rowIdPrefix = "datagrid-row-r" + (++_501);
        _547.cellClassPrefix = "datagrid-cell-c" + _501;
        _54b(dc.header1, opts.frozenColumns, true);
        _54b(dc.header2, opts.columns, false);
        _54c();
        dc.header1.add(dc.header2).css("display", opts.showHeader ? "block" : "none");
        dc.footer1.add(dc.footer2).css("display", opts.showFooter ? "block" : "none");
        if (opts.toolbar) {
            if ($.isArray(opts.toolbar)) {
                $("div.datagrid-toolbar", _548).remove();
                var tb = $("<div class=\"datagrid-toolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").prependTo(_548);
                var tr = tb.find("tr");
                for (var i = 0; i < opts.toolbar.length; i++) {
                    var btn = opts.toolbar[i];
                    if (btn == "-") {
                        $("<td><div class=\"datagrid-btn-separator\"></div></td>").appendTo(tr);
                    } else {
                        var td = $("<td></td>").appendTo(tr);
                        var tool = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
                        tool[0].onclick = eval(btn.handler || function () {
                        });
                        tool.linkbutton($.extend({}, btn, { plain: true }));
                    }
                }
            } else {
                $(opts.toolbar).addClass("datagrid-toolbar").prependTo(_548);
                $(opts.toolbar).show();
            }
        } else {
            $("div.datagrid-toolbar", _548).remove();
        }
        $("div.datagrid-pager", _548).remove();
        if (opts.pagination) {
            var _54d = $("<div class=\"datagrid-pager\"></div>");
            if (opts.pagePosition == "bottom") {
                _54d.appendTo(_548);
            } else {
                if (opts.pagePosition == "top") {
                    _54d.addClass("datagrid-pager-top").prependTo(_548);
                } else {
                    var ptop = $("<div class=\"datagrid-pager datagrid-pager-top\"></div>").prependTo(_548);
                    _54d.appendTo(_548);
                    _54d = _54d.add(ptop);
                }
            }
            _54d.pagination({
                total: (opts.pageNumber * opts.pageSize), 
                pageNumber: opts.pageNumber, 
                showRefresh: opts.showRefresh,  // wanghc 2018-1-29
                showPageList:opts.showPageList, // wanghc 2018-1-29
                afterPageText:opts.afterPageText,// wanghc 2018-1-29
                beforePageText:opts.beforePageText,// wanghc 2018-1-29
                displayMsg:opts.displayMsg,// wanghc 2018-1-29
                pageSize: opts.pageSize, 
                pageList: opts.pageList, 
                onSelectPage: function (_54e, _54f) {
                    opts.pageNumber = _54e;
                    opts.pageSize = _54f;
                    _54d.pagination("refresh", { pageNumber: _54e, pageSize: _54f });
                    _577(_546);
                }
            });
            opts.pageSize = _54d.pagination("options").pageSize;
        }
        // wanghc 初始化时,增加加滚动条 2018-12-20
        dc.body2.html("<div style='width:"+dc.view2.find('.datagrid-header-row').width()+"px;border:solid 0px;height:1px;'></div>");
        //_54b => renderGridHeader
        function _54b(_550, _551, _552) {
            if (!_551) {
                return;
            }
            $(_550).show();
            $(_550).empty();
            var _553 = [];
            var _554 = [];
            if (opts.sortName) {
                _553 = opts.sortName.split(",");
                _554 = opts.sortOrder.split(",");
            }
            //var tmpclone = $(_550).clone()[0];  //add by lan---2018-12-19 先clone一个节点,生成grid,生成完后再置回
            var t = $("<table class=\"datagrid-htable\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\"><tbody></tbody></table>").appendTo(_550);
            for (var i = 0; i < _551.length; i++) {
                var tr = $("<tr class=\"datagrid-header-row\"></tr>").appendTo($("tbody", t));
                var cols = _551[i];
                for (var j = 0; j < cols.length; j++) {
                    var col = cols[j];
                    var attr = "";
                    if (col.rowspan) {
                        attr += "rowspan=\"" + col.rowspan + "\" ";
                    }
                    if (col.colspan) {
                        attr += "colspan=\"" + col.colspan + "\" ";
                    }
                    var td = $("<td " + attr + "></td>").appendTo(tr);
                    if (col.checkbox) {
                        td.attr("field", col.field);
                        $("<div class=\"datagrid-header-check\"></div>").html("<input type=\"checkbox\"/>").appendTo(td);
                    } else {
                        if (col.field) {
                            td.attr("field", col.field);
                            td.append("<div class=\"datagrid-cell\"><span></span><span class=\"datagrid-sort-icon\"></span></div>");
                            $("span", td).html(col.title);
                            $("span.datagrid-sort-icon", td).html(""); //html("&nbsp;");-html(""); neer 2019-4-4 当align:'right'时列头与内容没对齐
                            var cell = td.find("div.datagrid-cell");
                            var pos = _502(_553, col.field);
                            if (pos >= 0) {
                                cell.addClass("datagrid-sort-" + _554[pos]);
                            }
                            if (col.resizable == false) {
                                cell.attr("resizable", "false");
                            }
                            if (col.width) {
                                cell._outerWidth(col.width);
                                col.boxWidth = parseInt(cell[0].style.width);
                            } else {
                                col.auto = true;
                            }
                            cell.css("text-align", (col.halign || col.align || ""));
                            col.cellClass = _547.cellClassPrefix + "-" + col.field.replace(/[\.|\s]/g, "-");
                            cell.addClass(col.cellClass).css("width", "");
                        } else {
                            $("<div class=\"datagrid-cell-group\"></div>").html(col.title).appendTo(td);
                        }
                    }
                    if (col.hidden) {
                        td.hide();
                    }
                }
            }
            if (_552 && opts.rownumbers) {
                var td = $("<td rowspan=\"" + opts.frozenColumns.length + "\"><div class=\"datagrid-header-rownumber\"></div></td>");
                if ($("tr", t).length == 0) {
                    td.wrap("<tr class=\"datagrid-header-row\"></tr>").parent().appendTo($("tbody", t));
                } else {
                    td.prependTo($("tr:first", t));
                }
            }
            //$(_550).replaceWith(tmpclone);  //add lan 2018-12-19
        };
        function _54c() {
            var _555 = [];
            var _556 = _557(_546, true).concat(_557(_546));
            for (var i = 0; i < _556.length; i++) {
                var col = _558(_546, _556[i]);
                if (col && !col.checkbox) {
                    _555.push(["." + col.cellClass, col.boxWidth ? col.boxWidth + "px" : "auto"]);
                }
            }
            _547.ss.add(_555);
            _547.ss.dirty(_547.cellSelectorPrefix);
            _547.cellSelectorPrefix = "." + _547.cellClassPrefix;
        };

        if (opts.btoolbar) {
            if ($.isArray(opts.btoolbar)) {
                $("div.datagrid-btoolbar", _548).remove();
                var tb = $("<div class=\"datagrid-btoolbar\"><table cellspacing=\"0\" cellpadding=\"0\"><tr></tr></table></div>").appendTo(_548);
                var tr = tb.find("tr");
                for (var i = 0; i < opts.btoolbar.length; i++) {
                    var btn = opts.btoolbar[i];
                    if (btn == "-") {
                        $("<td><div class=\"datagrid-btn-separator\"></div></td>").appendTo(tr);
                    } else {
                        var td = $("<td></td>").appendTo(tr);
                        var tool = $("<a href=\"javascript:void(0)\"></a>").appendTo(td);
                        tool[0].onclick = eval(btn.handler || function () {
                        });
                        tool.linkbutton($.extend({}, btn, { plain: true }));
                    }
                }
            } else {
                $(opts.btoolbar).addClass("datagrid-btoolbar").appendTo(_548);
                $(opts.btoolbar).show();
            }
        } else {
            $("div.datagrid-btoolbar", _548).remove();
        }
    };
    function _559(_55a) {
        var _55b = $.data(_55a, "datagrid");
        var _55c = _55b.panel;
        var opts = _55b.options;
        var dc = _55b.dc;
        var _55d = dc.header1.add(dc.header2);
        _55d.find("input[type=checkbox]").unbind(".datagrid").bind("click.datagrid", function (e) {
            if (opts.singleSelect && opts.selectOnCheck) {
                return false;
            }
            if ($(this).is(":checked")) {
                _5df(_55a);
            } else {
                _5e5(_55a);
            }
            e.stopPropagation();
        });
        var _55e = _55d.find("div.datagrid-cell");
        _55e.closest("td").unbind(".datagrid").bind("mouseenter.datagrid", function () {
            if (_55b.resizing) {
                return;
            }
            $(this).addClass("datagrid-header-over");
        }).bind("mouseleave.datagrid", function () {
            $(this).removeClass("datagrid-header-over");
        }).bind("contextmenu.datagrid", function (e) {
            var _55f = $(this).attr("field");
            opts.onHeaderContextMenu.call(_55a, e, _55f);
        }).bind("dblclick.datagrid", function (e) {   //cryze 双击列头事件 和表头右键菜单的监听放在一起
            var _55f = $(this).attr("field");
            opts.onDblClickHeader.call(_55a, e, _55f);
        })
        _55e.unbind(".datagrid").bind("click.datagrid", function (e) {
            var p1 = $(this).offset().left + 5;
            var p2 = $(this).offset().left + $(this)._outerWidth() - 5;
            if (e.pageX < p2 && e.pageX > p1) {
                _56c(_55a, $(this).parent().attr("field"));
            }
        }).bind("dblclick.datagrid", function (e) {
            var p1 = $(this).offset().left + 5;
            var p2 = $(this).offset().left + $(this)._outerWidth() - 5;
            var cond = opts.resizeHandle == "right" ? (e.pageX > p2) : (opts.resizeHandle == "left" ? (e.pageX < p1) : (e.pageX < p1 || e.pageX > p2));
            if (cond) {
                var _560 = $(this).parent().attr("field");
                var col = _558(_55a, _560);
                if (col.resizable == false) {
                    return;
                }
                $(_55a).datagrid("autoSizeColumn", _560);
                col.auto = false;
            }
        });
        var _561 = opts.resizeHandle == "right" ? "e" : (opts.resizeHandle == "left" ? "w" : "e,w");
        _55e.each(function () {
            $(this).resizable({
                handles: _561, disabled: ($(this).attr("resizable") ? $(this).attr("resizable") == "false" : false), minWidth: 25, onStartResize: function (e) {
                    _55b.resizing = true;
                    _55d.css("cursor", $("body").css("cursor"));
                    if (!_55b.proxy) {
                        _55b.proxy = $("<div class=\"datagrid-resize-proxy\"></div>").appendTo(dc.view);
                    }
                    _55b.proxy.css({ left: e.pageX - $(_55c).offset().left - 1, display: "none" });
                    setTimeout(function () {
                        if (_55b.proxy) {
                            _55b.proxy.show();
                        }
                    }, 500);
                }, onResize: function (e) {
                    _55b.proxy.css({ left: e.pageX - $(_55c).offset().left - 1, display: "block" });
                    return false;
                }, onStopResize: function (e) {
                    _55d.css("cursor", "");
                    $(this).css("height", "");
                    $(this)._outerWidth($(this)._outerWidth());
                    var _562 = $(this).parent().attr("field");
                    var col = _558(_55a, _562);
                    col.width = $(this)._outerWidth();
                    col.boxWidth = parseInt(this.style.width);
                    col.auto = undefined;
                    $(this).css("width", "");
                    _542(_55a, _562);
                    _55b.proxy.remove();
                    _55b.proxy = null;
                    if ($(this).parents("div:first.datagrid-header").parent().hasClass("datagrid-view1")) {
                        _519(_55a);
                    }
                    _579(_55a);
                    opts.onResizeColumn.call(_55a, _562, col.width);
                    setTimeout(function () {
                        _55b.resizing = false;
                    }, 0);
                }
            });
        });
        dc.body1.add(dc.body2).unbind().bind("mouseover", function (e) {
            if (_55b.resizing) {
                return;
            }
           /* 2018-11-23 start -- showTip*/
           var td = $(e.target);
           var colname = undefined;
           if ("undefined" == typeof td.attr('field')){
                td = td.closest('td');
           }
           colname = td.attr('field');
           if (colname){
               var tmpdg = $.data(_55a, "datagrid");
               var cm = tmpdg.options.columns;
               for (var i=0;i<cm.length; i++){
                   for(var j=0;j<cm[i].length;j++){
                        if (cm[i][j].field==colname){
                            if (cm[i][j].showTip){
                                var tipWidth = cm[i][j].tipWidth||350;
                                td.tooltip({
                                    content:td.text(),
                                    onShow:function(e1){
                                        $(this).tooltip("tip").css({
                                            width:tipWidth,top:e1.pageY+20,left:e1.pageX-(250/2)
                                        });
                                    }
                                }).tooltip("show",e);
                            }
                        }
                   }
               }
           }
           /** end */
            var tr = $(e.target).closest("tr.datagrid-row");
            if (!_563(tr)) {
                return;
            }
            var _564 = _565(tr);
            _5c7(_55a, _564,true);  //高亮显示 增加isMouse 2019-5-24

            e.stopPropagation();
        }).bind("mouseout", function (e) {
            var tr = $(e.target).closest("tr.datagrid-row");
            if (!_563(tr)) {
                return;
            }
            var _566 = _565(tr);
            opts.finder.getTr(_55a, _566).removeClass("datagrid-row-over");
            e.stopPropagation();
        }).bind("click", function (e) {
            var tt = $(e.target);
            var tr = tt.closest("tr.datagrid-row");
            if (!_563(tr)) {
                return;
            }
            var _567 = _565(tr);
            if (tt.parent().hasClass("datagrid-cell-check")) {
                if (opts.singleSelect && opts.selectOnCheck) {
                    if (!opts.checkOnSelect) {
                        _5e5(_55a, true);
                    }
                    _5d2(_55a, _567);
                } else {
                    if (tt.is(":checked")) {
                        _5d2(_55a, _567);
                    } else {
                        _5d9(_55a, _567);
                    }
                }
            } else {
                var row = opts.finder.getRow(_55a, _567);
                var td = tt.closest("td[field]", tr);
                if (td.length) {
                    var _568 = td.attr("field");
                    opts.onClickCell.call(_55a, _567, _568, row[_568]);
                }
                if (opts.singleSelect == true) {
                    _5cb(_55a, _567);
                } else {
                    if (opts.ctrlSelect) {
                        if (e.ctrlKey) {
                            if (tr.hasClass("datagrid-row-selected")) {
                                _5d3(_55a, _567);
                            } else {
                                _5cb(_55a, _567);
                            }
                        } else {
                            $(_55a).datagrid("clearSelections");
                            _5cb(_55a, _567);
                        }
                    } else {
                        if (tr.hasClass("datagrid-row-selected")) {
                            _5d3(_55a, _567);
                        } else {
                            _5cb(_55a, _567);
                        }
                    }
                }
                opts.onClickRow.call(_55a, _567, row);
            }
            e.stopPropagation();
        }).bind("dblclick", function (e) {
            var tt = $(e.target);
            var tr = tt.closest("tr.datagrid-row");
            if (!_563(tr)) {
                return;
            }
            var _569 = _565(tr);
            var row = opts.finder.getRow(_55a, _569);
            var td = tt.closest("td[field]", tr);
            if (td.length) {
                var _56a = td.attr("field");
                opts.onDblClickCell.call(_55a, _569, _56a, row[_56a]);
            }
            opts.onDblClickRow.call(_55a, _569, row);
            e.stopPropagation();
        }).bind("contextmenu", function (e) {
            var tr = $(e.target).closest("tr.datagrid-row");
            if (!_563(tr)) {
                return;
            }
            var _56b = _565(tr);
            var row = opts.finder.getRow(_55a, _56b);
            opts.onRowContextMenu.call(_55a, e, _56b, row);
            e.stopPropagation();
        });
        dc.body2.bind("scroll", function () {
            var b1 = dc.view1.children("div.datagrid-body");
            b1.scrollTop($(this).scrollTop());
            var c1 = dc.body1.children(":first");
            var c2 = dc.body2.children(":first");
            if (c1.length && c2.length) {
                var top1 = c1.offset().top;
                var top2 = c2.offset().top;
                if (top1 != top2) {
                    b1.scrollTop(b1.scrollTop() + top1 - top2);
                }
            }
            dc.view2.children("div.datagrid-header,div.datagrid-footer")._scrollLeft($(this)._scrollLeft());
            dc.body2.children("table.datagrid-btable-frozen").css("left", -$(this)._scrollLeft());
        });
        function _565(tr) {
            if (tr.attr("datagrid-row-index")) {
                return parseInt(tr.attr("datagrid-row-index"));
            } else {
                return tr.attr("node-id");
            }
        };
        function _563(tr) {
            return tr.length && tr.parent().length;
        };
    };
    function _56c(_56d, _56e) {
        var _56f = $.data(_56d, "datagrid");
        var opts = _56f.options;
        _56e = _56e || {};
        var _570 = { sortName: opts.sortName, sortOrder: opts.sortOrder };
        if (typeof _56e == "object") {
            $.extend(_570, _56e);
        }
        var _571 = [];
        var _572 = [];
        if (_570.sortName) {
            _571 = _570.sortName.split(",");
            _572 = _570.sortOrder.split(",");
        }
        if (typeof _56e == "string") {
            var _573 = _56e;
            var col = _558(_56d, _573);
            if (!col.sortable || _56f.resizing) {
                return;
            }
            var _574 = col.order || "asc";
            var pos = _502(_571, _573);
            if (pos >= 0) {
                var _575 = _572[pos] == "asc" ? "desc" : "asc";
                if (opts.multiSort && _575 == _574) {
                    _571.splice(pos, 1);
                    _572.splice(pos, 1);
                } else {
                    _572[pos] = _575;
                }
            } else {
                if (opts.multiSort) {
                    _571.push(_573);
                    _572.push(_574);
                } else {
                    _571 = [_573];
                    _572 = [_574];
                }
            }
            _570.sortName = _571.join(",");
            _570.sortOrder = _572.join(",");
        }
        if (opts.onBeforeSortColumn.call(_56d, _570.sortName, _570.sortOrder) == false) {
            return;
        }
        $.extend(opts, _570);
        var dc = _56f.dc;
        var _576 = dc.header1.add(dc.header2);
        _576.find("div.datagrid-cell").removeClass("datagrid-sort-asc datagrid-sort-desc");
        for (var i = 0; i < _571.length; i++) {
            var col = _558(_56d, _571[i]);
            _576.find("div." + col.cellClass).addClass("datagrid-sort-" + _572[i]);
        }
        if (opts.remoteSort) {
            _577(_56d);
        } else {
            _578(_56d, $(_56d).datagrid("getData"));
        }
        opts.onSortColumn.call(_56d, opts.sortName, opts.sortOrder);
    };
    function _579(_57a) {
        var _57b = $.data(_57a, "datagrid");
        var opts = _57b.options;
        var dc = _57b.dc;
        dc.body2.css("overflow-x", "");
        if (!opts.fitColumns) {
            return;
        }
        if (!_57b.leftWidth) {
            _57b.leftWidth = 0;
        }
        var _57c = dc.view2.children("div.datagrid-header");
        var _57d = 0;
        var _57e;
        var _57f = _557(_57a, false);
        for (var i = 0; i < _57f.length; i++) {
            var col = _558(_57a, _57f[i]);
            if (_580(col)) {
                _57d += col.width;
                _57e = col;
            }
        }
        if (!_57d) {
            return;
        }
        if (_57e) {
            _581(_57e, -_57b.leftWidth);
        }
        var _582 = _57c.children("div.datagrid-header-inner").show();
        var _583 = _57c.width() - _57c.find("table").width() - opts.scrollbarSize + _57b.leftWidth;
        var rate = _583 / _57d;
        if (!opts.showHeader) {
            _582.hide();
        }
        for (var i = 0; i < _57f.length; i++) {
            var col = _558(_57a, _57f[i]);
            if (_580(col)) {
                var _584 = parseInt(col.width * rate);
                _581(col, _584);
                _583 -= _584;
            }
        }
        _57b.leftWidth = _583;
        if (_57e) {
            _581(_57e, _57b.leftWidth);
        }
        _542(_57a);
        if (_57c.width() >= _57c.find("table").width()) {
            dc.body2.css("overflow-x", "hidden");
        }
        function _581(col, _585) {
            if (col.width + _585 > 0) {
                col.width += _585;
                col.boxWidth += _585;
            }
        };
        function _580(col) {
            if (!col.hidden && !col.checkbox && !col.auto && !col.fixed) {
                return true;
            }
        };
    };
    function _586(_587, _588) {
        var _589 = $.data(_587, "datagrid");
        var opts = _589.options;
        var dc = _589.dc;
        var tmp = $("<div class=\"datagrid-cell\" style=\"position:absolute;left:-9999px\"></div>").appendTo("body");
        if (_588) {
            _515(_588);
            if (opts.fitColumns) {
                _519(_587);
                _579(_587);
            }
        } else {
            if (!!opts.autoSizeColumn){ //wanghc 增加配置 影响grid速度
                var _58a = false;
                var _58b = _557(_587, true).concat(_557(_587, false));
                for (var i = 0; i < _58b.length; i++) {
                    var _588 = _58b[i];
                    var col = _558(_587, _588);
                    if (!col.hidden && col.auto) {  //by wanghc 增加col.hidden判断,隐藏列不用计算 2018-5-3
                        _515(_588);
                        _58a = true;
                    }
                }
                if (_58a && opts.fitColumns) {
                    _519(_587);
                    _579(_587);
                }
            }
        }
        tmp.remove();
        function _515(_58c) {
            var _58d = dc.view.find("div.datagrid-header td[field=\"" + _58c + "\"] div.datagrid-cell");
            _58d.css("width", "");
            var col = $(_587).datagrid("getColumnOption", _58c);
            col.width = undefined;
            col.boxWidth = undefined;
            col.auto = true;
            $(_587).datagrid("fixColumnSize", _58c);
            var _58e = Math.max(_58f("header"), _58f("allbody"), _58f("allfooter"));
            _58d._outerWidth(_58e);
            col.width = _58e;
            col.boxWidth = parseInt(_58d[0].style.width);
            _58d.css("width", "");
            $(_587).datagrid("fixColumnSize", _58c);
            opts.onResizeColumn.call(_587, _58c, col.width);
            function _58f(type) {
                var _590 = 0;
                if (type == "header") {
                    _590 = _591(_58d);
                } else {
                    opts.finder.getTr(_587, 0, type).find("td[field=\"" + _58c + "\"] div.datagrid-cell").each(function () {
                        var w = _591($(this));
                        if (_590 < w) {
                            _590 = w;
                        }
                    });
                }
                return _590;
                function _591(cell) {
                    return cell.is(":visible") ? cell._outerWidth() : tmp.html(cell.html())._outerWidth();
                };
            };
        };
    };
    function _542(_592, _593) {
        var _594 = $.data(_592, "datagrid");
        var opts = _594.options;
        var dc = _594.dc;
        var _595 = dc.view.find("table.datagrid-btable,table.datagrid-ftable");
        _595.css("table-layout", "fixed");
        if (_593) {
            fix(_593);
        } else {
            var ff = _557(_592, true).concat(_557(_592, false));
            for (var i = 0; i < ff.length; i++) {
                fix(ff[i]);
            }
        }
        _595.css("table-layout", "auto");
        _596(_592);
        setTimeout(function () {
            _526(_592);
            _59b(_592);
        }, 0);
        function fix(_597) {
            var col = _558(_592, _597);
            if (!col.checkbox) {
                _594.ss.set("." + col.cellClass, col.boxWidth ? col.boxWidth + "px" : "auto");
            }
        };
    };
    function _596(_598) {
        var dc = $.data(_598, "datagrid").dc;
        dc.body1.add(dc.body2).find("td.datagrid-td-merged").each(function () {
            var td = $(this);
            var _599 = td.attr("colspan") || 1;
            var _59a = _558(_598, td.attr("field")).width;
            for (var i = 1; i < _599; i++) {
                td = td.next();
                _59a += _558(_598, td.attr("field")).width + 1;
            }
            $(this).children("div.datagrid-cell")._outerWidth(_59a);
        });
    };
    function _59b(_59c) {
        var dc = $.data(_59c, "datagrid").dc;
        dc.view.find("div.datagrid-editable").each(function () {
            var cell = $(this);
            var _59d = cell.parent().attr("field");
            var col = $(_59c).datagrid("getColumnOption", _59d);
            cell._outerWidth(col.width);
            var ed = $.data(this, "datagrid.editor");
            if (ed.actions.resize) {
                ed.actions.resize(ed.target, cell.width());
            }
        });
    };
    function _558(_59e, _59f) {
        function find(_5a0) {
            if (_5a0) {
                for (var i = 0; i < _5a0.length; i++) {
                    var cc = _5a0[i];
                    for (var j = 0; j < cc.length; j++) {
                        var c = cc[j];
                        if (c.field == _59f) {
                            return c;
                        }
                    }
                }
            }
            return null;
        };
        var opts = $.data(_59e, "datagrid").options;
        var col = find(opts.columns);
        if (!col) {
            col = find(opts.frozenColumns);
        }
        return col;
    };
    function _557(_5a1, _5a2) {
        var opts = $.data(_5a1, "datagrid").options;
        var _5a3 = (_5a2 == true) ? (opts.frozenColumns || [[]]) : opts.columns;
        if (_5a3.length == 0) {
            return [];
        }
        var _5a4 = [];
        function _5a5(_5a6) {
            var c = 0;
            var i = 0;
            while (true) {
                if (_5a4[i] == undefined) {
                    if (c == _5a6) {
                        return i;
                    }
                    c++;
                }
                i++;
            }
        };
        function _5a7(r) {
            var ff = [];
            var c = 0;
            for (var i = 0; i < _5a3[r].length; i++) {
                var col = _5a3[r][i];
                if (col.field) {
                    ff.push([c, col.field]);
                }
                c += parseInt(col.colspan || "1");
            }
            for (var i = 0; i < ff.length; i++) {
                ff[i][0] = _5a5(ff[i][0]);
            }
            for (var i = 0; i < ff.length; i++) {
                var f = ff[i];
                _5a4[f[0]] = f[1];
            }
        };
        for (var i = 0; i < _5a3.length; i++) {
            _5a7(i);
        }
        return _5a4;
    };
    function _578(_5a8, data) {
        var _5a9 = $.data(_5a8, "datagrid");
        var opts = _5a9.options;
        var dc = _5a9.dc;
        data = opts.loadFilter.call(_5a8, data);
        data.total = parseInt(data.total);
        _5a9.data = data;
        if (data.footer) {
            _5a9.footer = data.footer;
        }
        if (!opts.remoteSort && opts.sortName) {
            var _5aa = opts.sortName.split(",");
            var _5ab = opts.sortOrder.split(",");
            data.rows.sort(function (r1, r2) {
                var r = 0;
                for (var i = 0; i < _5aa.length; i++) {
                    var sn = _5aa[i];
                    var so = _5ab[i];
                    var col = _558(_5a8, sn);
                    var _5ac = col.sorter || function (a, b) {
                        return a == b ? 0 : (a > b ? 1 : -1);
                    };
                    r = _5ac(r1[sn], r2[sn]) * (so == "asc" ? 1 : -1);
                    if (r != 0) {
                        return r;
                    }
                }
                return r;
            });
        }
        if (opts.view.onBeforeRender) {
            opts.view.onBeforeRender.call(opts.view, _5a8, data.rows);
        }
        opts.view.render.call(opts.view, _5a8, dc.body2, false);
        opts.view.render.call(opts.view, _5a8, dc.body1, true);
        if (opts.showFooter) {
            opts.view.renderFooter.call(opts.view, _5a8, dc.footer2, false);
            opts.view.renderFooter.call(opts.view, _5a8, dc.footer1, true);
        }
        if (opts.view.onAfterRender) {
            opts.view.onAfterRender.call(opts.view, _5a8);
        }
        _5a9.ss.clean();
        if (opts.rownumbers && opts.fixRowNumber){
            $(_5a8).datagrid("fixRowNumber");
        }
        opts.onLoadSuccess.call(_5a8, data);
        var _5ad = $(_5a8).datagrid("getPager");
        if (_5ad.length) {
            var _5ae = _5ad.pagination("options");
            if (_5ae.total != data.total) {
                _5ad.pagination("refresh", { total: data.total });
                if (opts.pageNumber != _5ae.pageNumber) {
                    opts.pageNumber = _5ae.pageNumber;
                    _577(_5a8);
                }
            }
        }
        _526(_5a8);
        dc.body2.triggerHandler("scroll");
        _5af(_5a8);
        $(_5a8).datagrid("autoSizeColumn");
    };
    function _5af(_5b0) {
        var _5b1 = $.data(_5b0, "datagrid");
        var opts = _5b1.options;
        if (opts.idField) {
            var _5b2 = $.data(_5b0, "treegrid") ? true : false;
            var _5b3 = opts.onSelect;
            var _5b4 = opts.onCheck;
            opts.onSelect = opts.onCheck = function () {
            };
            var rows = opts.finder.getRows(_5b0);
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var _5b5 = _5b2 ? row[opts.idField] : i;
                //cryze 2019-3-13
                if (opts.view.type == 'scrollview')  _5b5+= (opts.view.index||0);  //index的作用getTr起作用 拼接得到tr的id，scrollview用的是总的index值
                if (_5b6(_5b1.selectedRows, row)) {
                    /*if (opts.view.type == 'scrollview'){
                        // index为datagrid的rows的index.即为当前页数据源对应的数组,不能只从firstRows中取
                        //_5b5为当前数据的index，当为scrollview插件时，rows为所有数据8000
                        //通过id列查询一次
                        for(var w=0; w<_5b1.data.firstRows.length; w++){
                            if (_5b1.data.firstRows[w][opts.idField] == row[opts.idField]) {
                                _5b5 = w ;
                            }
                        }
                    }*/
                    _5cb(_5b0, _5b5, true);
                }
                if (_5b6(_5b1.checkedRows, row)) {
                    /*if (opts.view.type == 'scrollview'){
                        //_5b5为当前数据的index，当为scrollview插件时，rows为所有数据8000
                        // index为datagrid的rows的index.即为当前页数据源对应的数组,不能只从firstRows中取
                        //通过id列查询一次
                        for(var w=0; w<_5b1.data.firstRows.length; w++){
                            if (_5b1.data.firstRows[w][opts.idField] == row[opts.idField]) {
                                _5b5 = w ;
                            }
                        }
                    }*/
                    _5d2(_5b0, _5b5, true);
                }
            }
            opts.onSelect = _5b3;
            opts.onCheck = _5b4;
        }
        function _5b6(a, r) {
            for (var i = 0; i < a.length; i++) {
                if (a[i][opts.idField] == r[opts.idField]) {
                    a[i] = r;
                    return true;
                }
            }
            return false;
        };
    };
    function _5b7(_5b8, row) {
        var _5b9 = $.data(_5b8, "datagrid");
        var opts = _5b9.options;
        var rows = _5b9.data.rows;
        if (typeof row == "object") {
            return _502(rows, row);
        } else {
            for (var i = 0; i < rows.length; i++) {
                if (rows[i][opts.idField] == row) {
                    return i;
                }
            }
            return -1;
        }
    };
    function _5ba(_5bb) {
        var _5bc = $.data(_5bb, "datagrid");
        var opts = _5bc.options;
        var data = _5bc.data;
        if (opts.idField) {
            return _5bc.selectedRows;
        } else {
            var rows = [];
            opts.finder.getTr(_5bb, "", "selected", 2).each(function () {
                rows.push(opts.finder.getRow(_5bb, $(this)));
            });
            return rows;
        }
    };
    function _5bd(_5be) { //getChecked
        var _5bf = $.data(_5be, "datagrid");
        var opts = _5bf.options;
        if (opts.idField) {
            return _5bf.checkedRows;
        } else {
            var rows = [];
            opts.finder.getTr(_5be, "", "checked", 2).each(function () {
                rows.push(opts.finder.getRow(_5be, $(this)));
            });
            return rows;
        }
    };
    function _5c0(_5c1, _5c2) {
        var _5c3 = $.data(_5c1, "datagrid");
        var dc = _5c3.dc;
        var opts = _5c3.options;
        var tr = opts.finder.getTr(_5c1, _5c2);
        if (tr.length) {
            if (tr.closest("table").hasClass("datagrid-btable-frozen")) {
                return;
            }
            var _5c4 = dc.view2.children("div.datagrid-header")._outerHeight();
            var _5c5 = dc.body2;
            var _5c6 = _5c5.outerHeight(true) - _5c5.outerHeight();
            var top = tr.position().top - _5c4 - _5c6;
            if (top < 0) {
                _5c5.scrollTop(_5c5.scrollTop() + top);
            } else {
                if (top + tr._outerHeight() > _5c5.height() - 18) {
                    _5c5.scrollTop(_5c5.scrollTop() + top + tr._outerHeight() - _5c5.height() + 18);
                }
            }
        }
    };

    /**
     * 
     * @param {*} _5c8 target
     * @param {*} _5c9 index
     * @param {*} isMouse 是否是鼠标悬浮高亮 add 2019-5-24
     */
    function _5c7(_5c8, _5c9,isMouse) {
        var _5ca = $.data(_5c8, "datagrid");
        var opts = _5ca.options;
        opts.finder.getTr(_5c8, _5ca.highlightIndex).removeClass("datagrid-row-over");
        opts.finder.getTr(_5c8, _5c9).addClass("datagrid-row-over");
        var previoushighlightIndex=_5ca.highlightIndex;
        _5ca.highlightIndex = _5c9;
        if (isMouse===true && previoushighlightIndex==_5c9 ) {  //鼠标悬浮触发频率很高 是鼠标悬浮且index没改变 不触发onHighlightRow
            
        }else{
            opts.onHighlightRow.call(_5c8,_5c9,_5ca.data.rows[_5c9]); //cryze 2019-5-23 hightlightRow事件
        }
        
    };
    function _5cb(_5cc, _5cd, _5ce) {
        var _5cf = $.data(_5cc, "datagrid");
        var dc = _5cf.dc;
        var opts = _5cf.options;
        var _5d0 = _5cf.selectedRows;
        /*add onBeforeSelect event by wanghc 2018-05-23*/
        var row = opts.finder.getRow(_5cc, _5cd); //提前
        if (false === opts.onBeforeSelect.call(_5cc, _5cd,row)){
            return ;
        }
        if (opts.singleSelect) {
            _5d1(_5cc);
            _5d0.splice(0, _5d0.length);
        }
        if (!_5ce && opts.checkOnSelect) {
            _5d2(_5cc, _5cd, true);
        }
        
        if (opts.idField) {
            _505(_5d0, opts.idField, row);
        }
        opts.finder.getTr(_5cc, _5cd).addClass("datagrid-row-selected");
        opts.onSelect.call(_5cc, _5cd, row);
        _5c0(_5cc, _5cd);
    };
    function _5d3(_5d4, _5d5, _5d6) {
        var _5d7 = $.data(_5d4, "datagrid");
        var dc = _5d7.dc;
        var opts = _5d7.options;
        /*add onBeforeUnselect event by wanghc 2018-05-23*/
        var row = opts.finder.getRow(_5d4, _5d5); //提前
        if (false === opts.onBeforeUnselect.call(_5d4, _5d5, row)){
            return ;
        }
        var _5d8 = $.data(_5d4, "datagrid").selectedRows;
        if (!_5d6 && opts.checkOnSelect) {
            _5d9(_5d4, _5d5, true);
        }
        opts.finder.getTr(_5d4, _5d5).removeClass("datagrid-row-selected");  
        if (opts.idField) {
            _503(_5d8, opts.idField, row[opts.idField]);
        }
        opts.onUnselect.call(_5d4, _5d5, row);
    };
    function _5da(_5db, _5dc) {
        var _5dd = $.data(_5db, "datagrid");
        var opts = _5dd.options;
        var rows = opts.finder.getRows(_5db);
        var _5de = $.data(_5db, "datagrid").selectedRows;
        if (!_5dc && opts.checkOnSelect) {
            _5df(_5db, true);
        }
        opts.finder.getTr(_5db, "", "allbody").addClass("datagrid-row-selected");
        if (opts.idField) {
            for (var _5e0 = 0; _5e0 < rows.length; _5e0++) {
                _505(_5de, opts.idField, rows[_5e0]);
            }
        }
        opts.onSelectAll.call(_5db, rows);
    };
    function _5d1(_5e1, _5e2) {
        var _5e3 = $.data(_5e1, "datagrid");
        var opts = _5e3.options;
        var rows = opts.finder.getRows(_5e1);
        var _5e4 = $.data(_5e1, "datagrid").selectedRows;
        if (!_5e2 && opts.checkOnSelect) {
            _5e5(_5e1, true);
        }
        opts.finder.getTr(_5e1, "", "selected").removeClass("datagrid-row-selected");
        if (opts.idField) {
            for (var _5e6 = 0; _5e6 < rows.length; _5e6++) {
                _503(_5e4, opts.idField, rows[_5e6][opts.idField]);
            }
        }
        opts.onUnselectAll.call(_5e1, rows);
    };
    // checked row(target,index,true|false)
    function _5d2(_5e7, _5e8, _5e9) {
        var _5ea = $.data(_5e7, "datagrid");
        var opts = _5ea.options;
        /*add onBeforeCheck event by wanghc 2018-05-23*/
        var row = opts.finder.getRow(_5e7, _5e8);
        if (false === opts.onBeforeCheck.call(_5e7, _5e8, row)){
            return ;
        }
        if (!_5e9 && opts.selectOnCheck) {
            _5cb(_5e7, _5e8, true);
        }
        var tr = opts.finder.getTr(_5e7, _5e8).addClass("datagrid-row-checked");
        var ck = tr.find("div.datagrid-cell-check input[type=checkbox]");
        ck._propAttr("checked", true);
        tr = opts.finder.getTr(_5e7, "", "checked", 2);
        if (tr.length == opts.finder.getRows(_5e7).length) {
            var dc = _5ea.dc;
            var _5eb = dc.header1.add(dc.header2);
            _5eb.find("input[type=checkbox]")._propAttr("checked", true);
        }
        
        if (opts.idField) {
            _505(_5ea.checkedRows, opts.idField, row);
        }
        opts.onCheck.call(_5e7, _5e8, row);
    };
    function _5d9(_5ec, _5ed, _5ee) {
        var _5ef = $.data(_5ec, "datagrid");
        var opts = _5ef.options;
        /*add onBeforeUncheck event by wanghc 2018-05-23 */
        var row = opts.finder.getRow(_5ec, _5ed);
        if(false===opts.onBeforeUncheck.call(_5ec, _5ed, row)){
            return ;
        }
        if (!_5ee && opts.selectOnCheck) {
            _5d3(_5ec, _5ed, true);
        }
        var tr = opts.finder.getTr(_5ec, _5ed).removeClass("datagrid-row-checked");
        var ck = tr.find("div.datagrid-cell-check input[type=checkbox]");
        ck._propAttr("checked", false);
        var dc = _5ef.dc;
        var _5f0 = dc.header1.add(dc.header2);
        _5f0.find("input[type=checkbox]")._propAttr("checked", false);
        if (opts.idField) {
            _503(_5ef.checkedRows, opts.idField, row[opts.idField]);
        }
        opts.onUncheck.call(_5ec, _5ed, row);
    };
    function _5df(_5f1, _5f2) {
        var _5f3 = $.data(_5f1, "datagrid");
        var opts = _5f3.options;
        var rows = opts.finder.getRows(_5f1);
        if (!_5f2 && opts.selectOnCheck) {
            _5da(_5f1, true);
        }
        var dc = _5f3.dc;
        var hck = dc.header1.add(dc.header2).find("input[type=checkbox]");
        var bck = opts.finder.getTr(_5f1, "", "allbody").addClass("datagrid-row-checked").find("div.datagrid-cell-check input[type=checkbox]");
        hck.add(bck)._propAttr("checked", true);
        if (opts.idField) {
            for (var i = 0; i < rows.length; i++) {
                _505(_5f3.checkedRows, opts.idField, rows[i]);
            }
        }
        opts.onCheckAll.call(_5f1, rows);
    };
    function _5e5(_5f4, _5f5) {
        var _5f6 = $.data(_5f4, "datagrid");
        var opts = _5f6.options;
        var rows = opts.finder.getRows(_5f4);
        if (!_5f5 && opts.selectOnCheck) {
            _5d1(_5f4, true);
        }
        var dc = _5f6.dc;
        var hck = dc.header1.add(dc.header2).find("input[type=checkbox]");
        var bck = opts.finder.getTr(_5f4, "", "checked").removeClass("datagrid-row-checked").find("div.datagrid-cell-check input[type=checkbox]");
        hck.add(bck)._propAttr("checked", false);
        if (opts.idField) {
            for (var i = 0; i < rows.length; i++) {
                _503(_5f6.checkedRows, opts.idField, rows[i][opts.idField]);
            }
        }
        opts.onUncheckAll.call(_5f4, rows);
    };
    function _5f7(_5f8, _5f9) {
        var opts = $.data(_5f8, "datagrid").options;
        var tr = opts.finder.getTr(_5f8, _5f9);
        var row = opts.finder.getRow(_5f8, _5f9);
        if (tr.hasClass("datagrid-row-editing")) {
            return;
        }
        if (opts.onBeforeEdit.call(_5f8, _5f9, row) == false) {
            return;
        }
        tr.addClass("datagrid-row-editing");
        _5fa(_5f8, _5f9);
        _59b(_5f8);
        tr.find("div.datagrid-editable").each(function () {
            var _5fb = $(this).parent().attr("field");
            var ed = $.data(this, "datagrid.editor");
            ed.actions.setValue(ed.target, row[_5fb]);
        });
        _5fc(_5f8, _5f9);
        opts.onBeginEdit.call(_5f8, _5f9, row);
    };
    /// endEdit(t,rowIndex=0,flag)
    function _5fd(_5fe, _5ff, _600) {
        var opts = $.data(_5fe, "datagrid").options;
        var _601 = $.data(_5fe, "datagrid").updatedRows;
        var _602 = $.data(_5fe, "datagrid").insertedRows;
        var tr = opts.finder.getTr(_5fe, _5ff);
        var row = opts.finder.getRow(_5fe, _5ff);
        if (!tr.hasClass("datagrid-row-editing")) {
            return;
        }
        if (!_600) {
            if (!_5fc(_5fe, _5ff)) {
                return;
            }
            var _603 = false;
            var _604 = {};
            tr.find("div.datagrid-editable").each(function () {
                var _605 = $(this).parent().attr("field");
                var ed = $.data(this, "datagrid.editor");
                var _606 = ed.actions.getValue(ed.target);
                if (row[_605] != _606) {
                    row[_605] = _606;
                    _603 = true;
                    _604[_605] = _606;
                }
            });
            if (_603) {
                if (_502(_602, row) == -1) {
                    if (_502(_601, row) == -1) {
                        _601.push(row);
                    }
                }
            }
            opts.onEndEdit.call(_5fe, _5ff, row, _604);
        }
        tr.removeClass("datagrid-row-editing");
        _607(_5fe, _5ff);
        $(_5fe).datagrid("refreshRow", _5ff);
        if (!_600) {
            // datagrid by wanghc 2018-6-21
            if (opts.showChangedStyle){
                for(var i in _604){
                    tr.children('td[field="'+i+'"]').addClass('datagrid-value-changed');
                }
            }
            opts.onAfterEdit.call(_5fe, _5ff, row, _604);
        } else {
            opts.onCancelEdit.call(_5fe, _5ff, row);
        }
    };
    function _608(_609, _60a) {
        var opts = $.data(_609, "datagrid").options;
        var tr = opts.finder.getTr(_609, _60a);
        var _60b = [];
        tr.children("td").each(function () {
            var cell = $(this).find("div.datagrid-editable");
            if (cell.length) {
                var ed = $.data(cell[0], "datagrid.editor");
                _60b.push(ed);
            }
        });
        return _60b;
    };
    function _60c(_60d, _60e) {
        var _60f = _608(_60d, _60e.index != undefined ? _60e.index : _60e.id);
        for (var i = 0; i < _60f.length; i++) {
            if (_60f[i].field == _60e.field) {
                return _60f[i];
            }
        }
        return null;
    };
    function _5fa(_610, _611) {
        var opts = $.data(_610, "datagrid").options;
        var tr = opts.finder.getTr(_610, _611);
        tr.children("td").each(function () {
            var cell = $(this).find("div.datagrid-cell");
            var _612 = $(this).attr("field");
            var col = _558(_610, _612);
            if (col && col.editor) {
                var _613, _614;
                if (typeof col.editor == "string") {
                    _613 = col.editor;
                } else {
                    _613 = col.editor.type;
                    _614 = col.editor.options;
                }
                var _615 = opts.editors[_613];
                if (_615) {
                    var _616 = cell.html();
                    var _617 = cell._outerWidth();
                    cell.addClass("datagrid-editable");
                    cell._outerWidth(_617);
                    cell.html("<table border=\"0\" cellspacing=\"0\" cellpadding=\"1\"><tr><td></td></tr></table>");
                    cell.children("table").bind("click dblclick contextmenu", function (e) {
                        e.stopPropagation();
                    });
                    $.data(cell[0], "datagrid.editor", { actions: _615, target: _615.init(cell.find("td"), _614), field: _612, type: _613, oldHtml: _616 });
                }
            }
        });
        _526(_610, _611, true);
    };
    function _607(_618, _619) {
        var opts = $.data(_618, "datagrid").options;
        var tr = opts.finder.getTr(_618, _619);
        tr.children("td").each(function () {
            var cell = $(this).find("div.datagrid-editable");
            if (cell.length) {
                var ed = $.data(cell[0], "datagrid.editor");
                if (ed.actions.destroy) {
                    ed.actions.destroy(ed.target);
                }
                cell.html(ed.oldHtml);
                $.removeData(cell[0], "datagrid.editor");
                cell.removeClass("datagrid-editable");
                cell.css("width", "");
            }
        });
    };
    function _5fc(_61a, _61b) {
        var tr = $.data(_61a, "datagrid").options.finder.getTr(_61a, _61b);
        if (!tr.hasClass("datagrid-row-editing")) {
            return true;
        }
        var vbox = tr.find(".validatebox-text");
        vbox.validatebox("validate");
        vbox.trigger("mouseleave");
        var _61c = tr.find(".validatebox-invalid");
        return _61c.length == 0;
    };
    function _61d(_61e, _61f) {
        var _620 = $.data(_61e, "datagrid").insertedRows;
        var _621 = $.data(_61e, "datagrid").deletedRows;
        var _622 = $.data(_61e, "datagrid").updatedRows;
        if (!_61f) {
            var rows = [];
            rows = rows.concat(_620);
            rows = rows.concat(_621);
            rows = rows.concat(_622);
            return rows;
        } else {
            if (_61f == "inserted") {
                return _620;
            } else {
                if (_61f == "deleted") {
                    return _621;
                } else {
                    if (_61f == "updated") {
                        return _622;
                    }
                }
            }
        }
        return [];
    };
    function _623(_624, _625) {
        var _626 = $.data(_624, "datagrid");
        var opts = _626.options;
        var data = _626.data;
        var _627 = _626.insertedRows;
        var _628 = _626.deletedRows;
        $(_624).datagrid("cancelEdit", _625);
        var row = opts.finder.getRow(_624, _625);
        if (_502(_627, row) >= 0) {
            _503(_627, row);
        } else {
            _628.push(row);
        }
        _503(_626.selectedRows, opts.idField, row[opts.idField]);
        _503(_626.checkedRows, opts.idField, row[opts.idField]);
        opts.view.deleteRow.call(opts.view, _624, _625);
        if (opts.height == "auto") {
            _526(_624);
        }
        $(_624).datagrid("getPager").pagination("refresh", { total: data.total });
    };
    function _629(_62a, _62b) {
        var data = $.data(_62a, "datagrid").data;
        var view = $.data(_62a, "datagrid").options.view;
        var _62c = $.data(_62a, "datagrid").insertedRows;
        view.insertRow.call(view, _62a, _62b.index, _62b.row);
        _62c.push(_62b.row);
        $(_62a).datagrid("getPager").pagination("refresh", { total: data.total });
    };
    function _62d(_62e, row) {
        var data = $.data(_62e, "datagrid").data;
        var view = $.data(_62e, "datagrid").options.view;
        var _62f = $.data(_62e, "datagrid").insertedRows;
        view.insertRow.call(view, _62e, null, row);
        _62f.push(row);
        $(_62e).datagrid("getPager").pagination("refresh", { total: data.total });
    };
    function _630(_631) {
        var _632 = $.data(_631, "datagrid");
        var data = _632.data;
        var rows = data.rows;
        var _633 = [];
        for (var i = 0; i < rows.length; i++) {
            _633.push($.extend({}, rows[i]));
        }
        _632.originalRows = _633;
        _632.updatedRows = [];
        _632.insertedRows = [];
        _632.deletedRows = [];
    };
    function _634(_635) {
        var data = $.data(_635, "datagrid").data;
        var ok = true;
        for (var i = 0, len = data.rows.length; i < len; i++) {
            if (_5fc(_635, i)) {
                _5fd(_635, i, false);
            } else {
                ok = false;
            }
        }
        if (ok) {
            _630(_635);
        }
    };
    function _636(_637) {
        var _638 = $.data(_637, "datagrid");
        var opts = _638.options;
        var _639 = _638.originalRows;
        var _63a = _638.insertedRows;
        var _63b = _638.deletedRows;
        var _63c = _638.selectedRows;
        var _63d = _638.checkedRows;
        var data = _638.data;
        function _63e(a) {
            var ids = [];
            for (var i = 0; i < a.length; i++) {
                ids.push(a[i][opts.idField]);
            }
            return ids;
        };
        function _63f(ids, _640) {
            for (var i = 0; i < ids.length; i++) {
                var _641 = _5b7(_637, ids[i]);
                if (_641 >= 0) {
                    (_640 == "s" ? _5cb : _5d2)(_637, _641, true);
                }
            }
        };
        for (var i = 0; i < data.rows.length; i++) {
            _5fd(_637, i, true);
        }
        var _642 = _63e(_63c);
        var _643 = _63e(_63d);
        _63c.splice(0, _63c.length);
        _63d.splice(0, _63d.length);
        data.total += _63b.length - _63a.length;
        data.rows = _639;
        _578(_637, data);
        _63f(_642, "s");
        _63f(_643, "c");
        _630(_637);
    };
    function _577(_644, _645) {
        var opts = $.data(_644, "datagrid").options;
        if (_645) {
            opts.queryParams = _645;
        }
        var _646 = $.extend({}, opts.queryParams);
        if (opts.pagination) {
            $.extend(_646, { page: opts.pageNumber, rows: opts.pageSize });
        }
        if (opts.sortName) {
            $.extend(_646, { sort: opts.sortName, order: opts.sortOrder });
        }
        if (opts.onBeforeLoad.call(_644, _646) == false) {
            return;
        }
        $(_644).datagrid("loading");
        /**
         * cryze 2018-9-13 
         * 为啥要通过setTimeout(fn,0)这种方式调用,不理解  
         * 猜测：连续两次调用 第一次为url1,第二次为url2, 这种操作就可以都按url2获取数据了  
         * 矛盾点：queryParams是第一次按照第一次，第二次按照第二次  
         */
        setTimeout(function () {  
            _647();
        }, 0);
        function _647() {
            var _648 = opts.loader.call(_644, _646, function (data) {
                setTimeout(function () {
                    $(_644).datagrid("loaded");
                }, 0);
                _578(_644, data);
                setTimeout(function () {
                    _630(_644);
                }, 0);
            }, function () {
                setTimeout(function () {
                    $(_644).datagrid("loaded");
                }, 0);
                opts.onLoadError.apply(_644, arguments);
            });
            if (_648 == false) {
                $(_644).datagrid("loaded");
            }
        };
    };
    function _649(_64a, _64b) {
        var opts = $.data(_64a, "datagrid").options;
        _64b.rowspan = _64b.rowspan || 1;
        _64b.colspan = _64b.colspan || 1;
        if (_64b.rowspan == 1 && _64b.colspan == 1) {
            return;
        }
        var tr = opts.finder.getTr(_64a, (_64b.index != undefined ? _64b.index : _64b.id));
        if (!tr.length) {
            return;
        }
        var row = opts.finder.getRow(_64a, tr);
        var _64c = row[_64b.field];
        var td = tr.find("td[field=\"" + _64b.field + "\"]");
        td.attr("rowspan", _64b.rowspan).attr("colspan", _64b.colspan);
        td.addClass("datagrid-td-merged");
        for (var i = 1; i < _64b.colspan; i++) {
            td = td.next();
            td.hide();
            row[td.attr("field")] = _64c;
        }
        for (var i = 1; i < _64b.rowspan; i++) {
            tr = tr.next();
            if (!tr.length) {
                break;
            }
            var row = opts.finder.getRow(_64a, tr);
            var td = tr.find("td[field=\"" + _64b.field + "\"]").hide();
            row[td.attr("field")] = _64c;
            for (var j = 1; j < _64b.colspan; j++) {
                td = td.next();
                td.hide();
                row[td.attr("field")] = _64c;
            }
        }
        _596(_64a);
    };
    $.fn.datagrid = function (_64d, _64e) {
        if (typeof _64d == "string") {
            return $.fn.datagrid.methods[_64d](this, _64e);
        }
        _64d = _64d || {};
        return this.each(function () {
            var _64f = $.data(this, "datagrid");
            var opts;
            if (_64f) {
                opts = $.extend(_64f.options, _64d);
                _64f.options = opts;
            } else {
                opts = $.extend({}, $.extend({}, $.fn.datagrid.defaults, { queryParams: {} }), $.fn.datagrid.parseOptions(this), _64d);
                $(this).css("width", "").css("height", "");
                var _650 = _53a(this, opts.rownumbers);
                if (!opts.columns) {
                    opts.columns = _650.columns;
                }
                if (!opts.frozenColumns) {
                    opts.frozenColumns = _650.frozenColumns;
                }
                opts.columns = $.extend(true, [], opts.columns);
                opts.frozenColumns = $.extend(true, [], opts.frozenColumns);
                opts.view = $.extend({}, opts.view);
                $.data(this, "datagrid", { options: opts, panel: _650.panel, dc: _650.dc, ss: null, selectedRows: [], checkedRows: [], data: { total: 0, rows: [] }, originalRows: [], updatedRows: [], insertedRows: [], deletedRows: [] });
            }
            _545(this);
            _559(this);
            _515(this);
            
            if (opts.data) {
                _578(this, opts.data);
                _630(this);
            } else {
                var data = $.fn.datagrid.parseData(this);
                if (data.total > 0) {
                    _578(this, data);
                    _630(this);
                }
            }
            if(!opts.lazy && opts.url){   // lazy为true时  初始化不去远程访问数据  //cryze 2018-9-13  url未配置也不调用 
                _577(this);
            }
            
        });
    };
    var _651 = {
        text: {
            init: function (_652, _653) {
                var _654 = $("<input type=\"text\" class=\"datagrid-editable-input\">").appendTo(_652);
                return _654;
            }, getValue: function (_655) {
                return $(_655).val();
            }, setValue: function (_656, _657) {
                $(_656).val(_657);
            }, resize: function (_658, _659) {
                $(_658)._outerWidth(_659)._outerHeight(30);   //cryze 2018-4-13 height 22-30
            }
        }, textarea: {
            init: function (_65a, _65b) {
                var _65c = $("<textarea class=\"datagrid-editable-input\"></textarea>").appendTo(_65a);
                return _65c;
            }, getValue: function (_65d) {
                return $(_65d).val();
            }, setValue: function (_65e, _65f) {
                $(_65e).val(_65f);
            }, resize: function (_660, _661) {
                $(_660)._outerWidth(_661);
            }
        }, icheckbox:{ /*新的icheckbox*/
            init: function (_662, _663) { 
                var opt = $.extend({on:'on',off:'off'},_663);
                var _664 = $("<input type=\"checkbox\">").appendTo(_662);
                //_664.val(opt.on);
                //_664.attr("offval", opt.off);
                _664.checkbox(opt);
                return _664;
            }, getValue: function (_665) {
                if($(_665).checkbox("getValue")){
                    return $(_665).checkbox("options").on;
                } else {
                    return $(_665).checkbox("options").off;
                }
            }, setValue: function (_666, _667) {
                var _668 = false;
                if ($(_666).checkbox("options").on == _667) {
                    _668 = true;
                }
                $(_666).checkbox("setValue", _668);
            }
        },checkbox:{
            init: function (_662, _663) {
                var _664 = $("<input type=\"checkbox\">").appendTo(_662);
                _664.val(_663.on);
                _664.attr("offval", _663.off);
                return _664;
            }, getValue: function (_665) {
                if ($(_665).is(":checked")) {
                    return $(_665).val();
                } else {
                    return $(_665).attr("offval");
                }
            }, setValue: function (_666, _667) {
                var _668 = false;
                if ($(_666).val() == _667) {
                    _668 = true;
                }
                $(_666)._propAttr("checked", _668);
            }
        }, numberbox: {
            init: function (_669, _66a) {
                var _66b = $("<input type=\"text\" class=\"datagrid-editable-input\">").appendTo(_669);
                _66b.numberbox(_66a);
                return _66b;
            }, destroy: function (_66c) {
                $(_66c).numberbox("destroy");
            }, getValue: function (_66d) {
                $(_66d).blur();
                return $(_66d).numberbox("getValue");
            }, setValue: function (_66e, _66f) {
                $(_66e).numberbox("setValue", _66f);
            }, resize: function (_670, _671) {
                $(_670)._outerWidth(_671)._outerHeight(30);  //cryze 2018-4-13 height 22-30
            }
        }, validatebox: {
            init: function (_672, _673) {
                var _674 = $("<input type=\"text\" class=\"datagrid-editable-input\">").appendTo(_672);
                _674.validatebox(_673);
                return _674;
            }, destroy: function (_675) {
                $(_675).validatebox("destroy");
            }, getValue: function (_676) {
                return $(_676).val();
            }, setValue: function (_677, _678) {
                $(_677).val(_678);
            }, resize: function (_679, _67a) {
                $(_679)._outerWidth(_67a)._outerHeight(30);   //cryze 2018-4-13 height 22-30
            }
        }, datebox: {
            init: function (_67b, _67c) {
                var _67d = $("<input type=\"text\">").appendTo(_67b);
                _67d.datebox(_67c);
                return _67d;
            }, destroy: function (_67e) {
                $(_67e).datebox("destroy");
            }, getValue: function (_67f) {
                return $(_67f).datebox("getValue");
            }, setValue: function (_680, _681) {
                $(_680).datebox("setValue", _681);
            }, resize: function (_682, _683) {
                $(_682).datebox("resize", _683);
            }
        },datetimebox: {    //cryze  行编辑支持datetimebox  直接抄的datebox,变量都加了i,好像没啥意义，主要是看着他们都用的各自的变量名
            init: function (i_67b, i_67c) {
                var i_67d = $("<input type=\"text\">").appendTo(i_67b);
                i_67d.datetimebox(i_67c);
                return i_67d;
            }, destroy: function (i_67e) {
                $(i_67e).datetimebox("destroy");
            }, getValue: function (i_67f) {
                return $(i_67f).datetimebox("getValue");
            }, setValue: function (i_680, i_681) {
                $(i_680).datetimebox("setValue", i_681);
            }, resize: function (i_682, i_683) {
                $(i_682).datetimebox("resize", i_683);
            }
        }, combobox: {
            init: function (_684, _685) {
                var _686 = $("<input type=\"text\">").appendTo(_684);
                _686.combobox(_685 || {});
                return _686;
            }, destroy: function (_687) {
                $(_687).combobox("destroy");
            }, getValue: function (_688) {
                var opts = $(_688).combobox("options");
                if (opts.multiple) {
                    return $(_688).combobox("getValues").join(opts.separator);
                } else {
                    return $(_688).combobox("getValue");
                }
            }, setValue: function (_689, _68a) {
                var opts = $(_689).combobox("options");
                if (opts.multiple) {
                    if (_68a) {
                        $(_689).combobox("setValues", _68a.split(opts.separator));
                    } else {
                        $(_689).combobox("clear");
                    }
                } else {
                    $(_689).combobox("setValue", _68a);
                }
            }, resize: function (_68b, _68c) {
                $(_68b).combobox("resize", _68c);
            }
        }, combotree: {
            init: function (_68d, _68e) {
                var _68f = $("<input type=\"text\">").appendTo(_68d);
                _68f.combotree(_68e);
                return _68f;
            }, destroy: function (_690) {
                $(_690).combotree("destroy");
            }, getValue: function (_691) {
                var opts = $(_691).combotree("options");
                if (opts.multiple) {
                    return $(_691).combotree("getValues").join(opts.separator);
                } else {
                    return $(_691).combotree("getValue");
                }
            }, setValue: function (_692, _693) {
                var opts = $(_692).combotree("options");
                if (opts.multiple) {
                    if (_693) {
                        $(_692).combotree("setValues", _693.split(opts.separator));
                    } else {
                        $(_692).combotree("clear");
                    }
                } else {
                    $(_692).combotree("setValue", _693);
                }
            }, resize: function (_694, _695) {
                $(_694).combotree("resize", _695);
            }
        }, combogrid: {
            init: function (_696, _697) {
                var _698 = $("<input type=\"text\">").appendTo(_696);
                _698.combogrid(_697);
                return _698;
            }, destroy: function (_699) {
                $(_699).combogrid("destroy");
            }, getValue: function (_69a) {
                var opts = $(_69a).combogrid("options");
                if (opts.multiple) {
                    return $(_69a).combogrid("getValues").join(opts.separator);
                } else {
                    return $(_69a).combogrid("getValue");
                }
            }, setValue: function (_69b, _69c) {
                var opts = $(_69b).combogrid("options");
                if (opts.multiple) {
                    if (_69c) {
                        $(_69b).combogrid("setValues", _69c.split(opts.separator));
                    } else {
                        $(_69b).combogrid("clear");
                    }
                } else {
                    $(_69b).combogrid("setValue", _69c);
                }
            }, resize: function (_69d, _69e) {
                $(_69d).combogrid("resize", _69e);
            }
        },linkbutton: { /*增加linkbutton by wanghc 2018-05-30*/
            //{colHandler:desc}
            init: function (_67b, _67c) {
                var _67d = $("<a href='#'></a>").appendTo(_67b);
                _67d.linkbutton(_67c);
                _67d.click(_67c.handler);
                return _67d;
            }, destroy: function (_67e) {
                //$(_67e).linkbutton("destroy");
            }, getValue: function (_67f) {
                return $(_67f).linkbutton("options").text;
            }, setValue: function (_680, _681) {
                $(_680).linkbutton("options").text = _681;
                $(_680).linkbutton({});
            }, resize: function (_682, _683) {
                //$(_682).linkbutton("resize", _683);
            }
        },
        switchbox: { /*增加switchbox by wanghc 2018-05-30*/
            init: function (_67b, _67c) {
                var _67d = $("<div href='#'></div>").appendTo(_67b);
                _67d.switchbox(_67c);
                return _67d;
            }, destroy: function (_67e) {
                $(_67e).switchbox("destroy");
            }, getValue: function (_67f) {
                if ($(_67f).switchbox("getValue")){
                    return $(_67f).switchbox("options").onText;
                }else{
                    return $(_67f).switchbox("options").offText;
                }
            }, setValue: function (_680, _681) {
                //$(_680).switchbox("setActive",false);
                var flag = false;
                if ($(_680).switchbox("options").onText == _681){ flag=true }
                $(_680).switchbox("setValue",flag,false);
                //$(this).find(inputSelector).prop('checked', value).trigger('change', skipOnChange);
                //$(_680).switchbox("setActive",true);
            }, resize: function (_682, _683) {
                //$(_682).linkbutton("resize", _683);
            }
        }
    };
    $.fn.datagrid.methods = {
        options: function (jq) {
            var _69f = $.data(jq[0], "datagrid").options;
            var _6a0 = $.data(jq[0], "datagrid").panel.panel("options");
            var opts = $.extend(_69f, { width: _6a0.width, height: _6a0.height, closed: _6a0.closed, collapsed: _6a0.collapsed, minimized: _6a0.minimized, maximized: _6a0.maximized });
            return opts;
        }, setSelectionState: function (jq) {
            return jq.each(function () {
                _5af(this);
            });
        }, createStyleSheet: function (jq) {
            return _506(jq[0]);
        }, getPanel: function (jq) {
            return $.data(jq[0], "datagrid").panel;
        }, getPager: function (jq) {
            return $.data(jq[0], "datagrid").panel.children("div.datagrid-pager");
        }, getColumnFields: function (jq, _6a1) {
            return _557(jq[0], _6a1);
        }, getColumnOption: function (jq, _6a2) {
            return _558(jq[0], _6a2);
        }, resize: function (jq, _6a3) {
            return jq.each(function () {
                _515(this, _6a3);
            });
        }, load: function (jq, _6a4) {
            return jq.each(function () {
                var opts = $(this).datagrid("options");
                opts.pageNumber = 1;
                var _6a5 = $(this).datagrid("getPager");
                _6a5.pagination("refresh", { pageNumber: 1 });
                _577(this, _6a4);
            });
        }, reload: function (jq, _6a6) {
            return jq.each(function () {
                _577(this, _6a6);
            });
        }, reloadFooter: function (jq, _6a7) {
            return jq.each(function () {
                var opts = $.data(this, "datagrid").options;
                var dc = $.data(this, "datagrid").dc;
                if (_6a7) {
                    $.data(this, "datagrid").footer = _6a7;
                }
                if (opts.showFooter) {
                    opts.view.renderFooter.call(opts.view, this, dc.footer2, false);
                    opts.view.renderFooter.call(opts.view, this, dc.footer1, true);
                    if (opts.view.onAfterRender) {
                        opts.view.onAfterRender.call(opts.view, this);
                    }
                    $(this).datagrid("fixRowHeight");
                }
            });
        }, loading: function (jq) {
            return jq.each(function () {
                var opts = $.data(this, "datagrid").options;
                $(this).datagrid("getPager").pagination("loading");
                if (opts.loadMsg) {
                    var _6a8 = $(this).datagrid("getPanel");
                    if (!_6a8.children("div.datagrid-mask").length) {
                        $("<div class=\"datagrid-mask\" style=\"display:block\"></div>").appendTo(_6a8);
                        var msg = $("<div class=\"datagrid-mask-msg\" style=\"display:block;left:50%\"></div>").html(opts.loadMsg).appendTo(_6a8);
                        msg._outerHeight(40);
                        msg.css({ marginLeft: (-msg.outerWidth() / 2), lineHeight: (msg.height() + "px") });
                    }
                }
            });
        }, loaded: function (jq) {
            return jq.each(function () {
                $(this).datagrid("getPager").pagination("loaded");
                var _6a9 = $(this).datagrid("getPanel");
                _6a9.children("div.datagrid-mask-msg").remove();
                _6a9.children("div.datagrid-mask").remove();
            });
        }, fitColumns: function (jq) {
            return jq.each(function () {
                _579(this);
            });
        }, fixColumnSize: function (jq, _6aa) {
            return jq.each(function () {
                _542(this, _6aa);
            });
        }, fixRowHeight: function (jq, _6ab) {
            return jq.each(function () {
                _526(this, _6ab);
            });
        },fixRowNumber : function (jq) {
                return jq.each(function () {
                    var panel = $(this).datagrid("getPanel");
                    //获取最后一行的number容器,并拷贝一份
                    var clone = $(".datagrid-cell-rownumber", panel).last().clone();
                    //由于在某些浏览器里面,是不支持获取隐藏元素的宽度,所以取巧一下
                    clone.css({
                        "position" : "absolute",
                        left : -1000
                    }).appendTo("body");
                    var width = clone.width("auto").width();
                    //默认宽度是25,所以只有大于25的时候才进行fix
                    if (width > 25) {
                        //多加5个像素,保持一点边距
                        $(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).width(width + 5);
                        //修改了宽度之后,需要对容器进行重新计算,所以调用resize
                        $(this).datagrid("resize");
                        //一些清理工作
                        clone.remove();
                        clone = null;
                    } else {
                        //还原成默认状态
                        $(".datagrid-header-rownumber,.datagrid-cell-rownumber", panel).removeAttr("style");
                    }
                });
            },freezeRow: function (jq, _6ac) {
            return jq.each(function () {
                _533(this, _6ac);
            });
        }, autoSizeColumn: function (jq, _6ad) {
            return jq.each(function () {
                _586(this, _6ad);
            });
        }, loadData: function (jq, data) {
            return jq.each(function () {
                _578(this, data);
                _630(this);
            });
        }, getData: function (jq) {
            return $.data(jq[0], "datagrid").data;
        }, getRows: function (jq) {
            return $.data(jq[0], "datagrid").data.rows;
        }, getFooterRows: function (jq) {
            return $.data(jq[0], "datagrid").footer;
        }, getRowIndex: function (jq, id) {
            return _5b7(jq[0], id);
        }, getChecked: function (jq) {
            return _5bd(jq[0]);
        }, getSelected: function (jq) {
            var rows = _5ba(jq[0]);
            return rows.length > 0 ? rows[0] : null;
        }, getSelections: function (jq) {
            return _5ba(jq[0]);
        }, clearSelections: function (jq) {
            return jq.each(function () {
                var _6ae = $.data(this, "datagrid");
                var _6af = _6ae.selectedRows;
                var _6b0 = _6ae.checkedRows;
                _6af.splice(0, _6af.length);
                _5d1(this);
                if (_6ae.options.checkOnSelect) {
                    _6b0.splice(0, _6b0.length);
                }
            });
        }, clearChecked: function (jq) {
            return jq.each(function () {
                var _6b1 = $.data(this, "datagrid");
                var _6b2 = _6b1.selectedRows;
                var _6b3 = _6b1.checkedRows;
                _6b3.splice(0, _6b3.length);
                _5e5(this);
                if (_6b1.options.selectOnCheck) {
                    _6b2.splice(0, _6b2.length);
                }
            });
        }, scrollTo: function (jq, _6b4) {
            return jq.each(function () {
                _5c0(this, _6b4);
            });
        }, highlightRow: function (jq, _6b5) {
            return jq.each(function () {
                _5c7(this, _6b5);
                _5c0(this, _6b5);
            });
        }, selectAll: function (jq) {
            return jq.each(function () {
                _5da(this);
            });
        }, unselectAll: function (jq) {
            return jq.each(function () {
                _5d1(this);
            });
        }, selectRow: function (jq, _6b6) {
            return jq.each(function () {
                _5cb(this, _6b6);
            });
        }, selectRecord: function (jq, id) {
            return jq.each(function () {
                var opts = $.data(this, "datagrid").options;
                if (opts.idField) {
                    var _6b7 = _5b7(this, id);
                    if (_6b7 >= 0) {
                        $(this).datagrid("selectRow", _6b7);
                    }
                }
            });
        }, unselectRow: function (jq, _6b8) {
            return jq.each(function () {
                _5d3(this, _6b8);
            });
        }, checkRow: function (jq, _6b9) {
            return jq.each(function () {
                _5d2(this, _6b9);
            });
        }, uncheckRow: function (jq, _6ba) {
            return jq.each(function () {
                _5d9(this, _6ba);
            });
        }, checkAll: function (jq) {
            return jq.each(function () {
                _5df(this);
            });
        }, uncheckAll: function (jq) {
            return jq.each(function () {
                _5e5(this);
            });
        }, beginEdit: function (jq, _6bb) {
            return jq.each(function () {
                _5f7(this, _6bb);
            });
        }, endEdit: function (jq, _6bc) {
            return jq.each(function () {
                _5fd(this, _6bc, false);
            });
        }, cancelEdit: function (jq, _6bd) {
            return jq.each(function () {
                _5fd(this, _6bd, true);
            });
        }, getEditors: function (jq, _6be) {
            return _608(jq[0], _6be);
        }, getEditor: function (jq, _6bf) {
            return _60c(jq[0], _6bf);
        }, refreshRow: function (jq, _6c0) {
            return jq.each(function () {
                var opts = $.data(this, "datagrid").options;
                opts.view.refreshRow.call(opts.view, this, _6c0);
            });
        }, validateRow: function (jq, _6c1) {
            return _5fc(jq[0], _6c1);
        }, updateRow: function (jq, _6c2) {
            return jq.each(function () {
                var opts = $.data(this, "datagrid").options;
                opts.view.updateRow.call(opts.view, this, _6c2.index, _6c2.row);
            });
        }, appendRow: function (jq, row) {
            return jq.each(function () {
                _62d(this, row);
            });
        }, insertRow: function (jq, _6c3) {
            return jq.each(function () {
                _629(this, _6c3);
            });
        }, deleteRow: function (jq, _6c4) {
            return jq.each(function () {
                _623(this, _6c4);
            });
        }, getChanges: function (jq, _6c5) {
            return _61d(jq[0], _6c5);
        }, acceptChanges: function (jq) {
            return jq.each(function () {
                _634(this);
            });
        }, rejectChanges: function (jq) {
            return jq.each(function () {
                _636(this);
            });
        }, mergeCells: function (jq, _6c6) {
            return jq.each(function () {
                _649(this, _6c6);
            });
        }, showColumn: function (jq, _6c7) {
            return jq.each(function () {
                var _6c8 = $(this).datagrid("getPanel");
                _6c8.find("td[field=\"" + _6c7 + "\"]").show();
                $(this).datagrid("getColumnOption", _6c7).hidden = false;
                $(this).datagrid("fitColumns");
            });
        }, hideColumn: function (jq, _6c9) {
            return jq.each(function () {
                var _6ca = $(this).datagrid("getPanel");
                _6ca.find("td[field=\"" + _6c9 + "\"]").hide();
                $(this).datagrid("getColumnOption", _6c9).hidden = true;
                $(this).datagrid("fitColumns");
            });
        }, sort: function (jq, _6cb) {
            return jq.each(function () {
                _56c(this, _6cb);
            });
        },setColumnTitle:function(jq,colOpt){
            return jq.each(function(){
                var _69f = $.data($(this)[0], "datagrid").dc.header2;
                //var _6ca = $(this).datagrid("getPanel");
                for(var f in colOpt){
                    _69f.find('.datagrid-header-row td[field="'+f+'"] .datagrid-cell span').first().html(colOpt[f]);
                }
            });
        }
    };
    $.fn.datagrid.parseOptions = function (_6cc) {
        var t = $(_6cc);
        return $.extend({}, $.fn.panel.parseOptions(_6cc), $.parser.parseOptions(_6cc, ["url", "toolbar","btoolbar", "idField", "sortName", "sortOrder", "pagePosition", "resizeHandle", { sharedStyleSheet: "boolean", fitColumns: "boolean", autoRowHeight: "boolean", striped: "boolean", nowrap: "boolean" }, { rownumbers: "boolean", singleSelect: "boolean", ctrlSelect: "boolean", checkOnSelect: "boolean", selectOnCheck: "boolean" }, { pagination: "boolean", pageSize: "number", pageNumber: "number" }, { multiSort: "boolean", remoteSort: "boolean", showHeader: "boolean", showFooter: "boolean" }, { scrollbarSize: "number" }]), { pageList: (t.attr("pageList") ? eval(t.attr("pageList")) : undefined), loadMsg: (t.attr("loadMsg") != undefined ? t.attr("loadMsg") : undefined), rowStyler: (t.attr("rowStyler") ? eval(t.attr("rowStyler")) : undefined) });
    };
    $.fn.datagrid.parseData = function (_6cd) {
        var t = $(_6cd);
        var data = { total: 0, rows: [] };
        var _6ce = t.datagrid("getColumnFields", true).concat(t.datagrid("getColumnFields", false));
        t.find("tbody tr").each(function () {
            data.total++;
            var row = {};
            $.extend(row, $.parser.parseOptions(this, ["iconCls", "state"]));
            for (var i = 0; i < _6ce.length; i++) {
                row[_6ce[i]] = $(this).find("td:eq(" + i + ")").html();
            }
            data.rows.push(row);
        });
        return data;
    };
    var _6cf = {
        render: function (_6d0, _6d1, _6d2) {
            var _6d3 = $.data(_6d0, "datagrid");
            var opts = _6d3.options;
            var rows = _6d3.data.rows;
            var _6d4 = $(_6d0).datagrid("getColumnFields", _6d2);
            if (_6d2) {
                if (!(opts.rownumbers || (opts.frozenColumns && opts.frozenColumns.length))) {
                    return;
                }
            }
            if (rows.length>0){
                var _6d5 = ["<table class=\"datagrid-btable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>"];
                for (var i = 0; i < rows.length; i++) {
                    var css = opts.rowStyler ? opts.rowStyler.call(_6d0, i, rows[i]) : "";
                    var _6d6 = "";
                    var _6d7 = "";
                    if (typeof css == "string") {
                        _6d7 = css;
                    } else {
                        if (css) {
                            _6d6 = css["class"] || "";
                            _6d7 = css["style"] || "";
                        }
                    }
                    var cls = "class=\"datagrid-row " + (i % 2 && opts.striped ? "datagrid-row-alt " : " ") + _6d6 + "\"";
                    var _6d8 = _6d7 ? "style=\"" + _6d7 + "\"" : "";
                    var _6d9 = _6d3.rowIdPrefix + "-" + (_6d2 ? 1 : 2) + "-" + i;
                    _6d5.push("<tr id=\"" + _6d9 + "\" datagrid-row-index=\"" + i + "\" " + cls + " " + _6d8 + ">");
                    _6d5.push(this.renderRow.call(this, _6d0, _6d4, _6d2, i, rows[i]));
                    _6d5.push("</tr>");
                }
                _6d5.push("</tbody></table>");
                $(_6d1).html(_6d5.join(""));
            }else{
                // 增加判断,空数据增加滚动条 2018-12-20 wanghc
                $(_6d1).html("<div style='width:"+_6d3.dc.view2.find(".datagrid-header-row").width()+"px;border:solid 0px;height:1px;'></div>");
            }
        }, renderFooter: function (_6da, _6db, _6dc) {
            var opts = $.data(_6da, "datagrid").options;
            var rows = $.data(_6da, "datagrid").footer || [];
            var _6dd = $(_6da).datagrid("getColumnFields", _6dc);
            var _6de = ["<table class=\"datagrid-ftable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>"];
            for (var i = 0; i < rows.length; i++) {
                _6de.push("<tr class=\"datagrid-row\" datagrid-row-index=\"" + i + "\">");
                _6de.push(this.renderRow.call(this, _6da, _6dd, _6dc, i, rows[i]));
                _6de.push("</tr>");
            }
            _6de.push("</tbody></table>");
            $(_6db).html(_6de.join(""));
        }, renderRow: function (_6df, _6e0, _6e1, _6e2, _6e3) {
            /** 生成tr内的html: <td>...</td> */
            var opts = $.data(_6df, "datagrid").options;
            var cc = [];
            if (_6e1 && opts.rownumbers) {
                var _6e4 = _6e2 + 1;
                if (opts.pagination) {
                    _6e4 += (opts.pageNumber - 1) * opts.pageSize;
                }
                cc.push("<td class=\"datagrid-td-rownumber\"><div class=\"datagrid-cell-rownumber\">" + _6e4 + "</div></td>");
            }
            for (var i = 0; i < _6e0.length; i++) {
                var _6e5 = _6e0[i];
                var col = $(_6df).datagrid("getColumnOption", _6e5);
                if (col) {
                    var _6e6 = _6e3[_6e5];
                    var css = col.styler ? (col.styler(_6e6, _6e3, _6e2) || "") : "";
                    var _6e7 = "";
                    var _6e8 = "";
                    if (typeof css == "string") {
                        _6e8 = css;
                    } else {
                        if (css) {
                            _6e7 = css["class"] || "";
                            _6e8 = css["style"] || "";
                        }
                    }
                    var cls = _6e7 ? "class=\"" + _6e7 + "\"" : "";
                    var _6e9 = col.hidden ? "style=\"display:none;" + _6e8 + "\"" : (_6e8 ? "style=\"" + _6e8 + "\"" : "");
                    cc.push("<td field=\"" + _6e5 + "\" " + cls + " " + _6e9 + ">");
                    var _6e9 = "";
                    if (!col.checkbox) {
                        if (col.align) {
                            _6e9 += "text-align:" + col.align + ";";
                        }
                        if (!opts.nowrap) {
                            _6e9 += "white-space:normal;height:auto;";
                        } else {
                            if (opts.autoRowHeight) {
                                _6e9 += "height:auto;";
                            }
                        }
                    }
                    cc.push("<div style=\"" + _6e9 + "\" ");
                    cc.push(col.checkbox ? "class=\"datagrid-cell-check\"" : "class=\"datagrid-cell " + col.cellClass + "\"");
                    cc.push(">");
                    if (col.checkbox) {
                        cc.push("<input type=\"checkbox\" " + (_6e3.checked ? "checked=\"checked\"" : ""));
                        cc.push(" name=\"" + _6e5 + "\" value=\"" + (_6e6 != undefined ? _6e6 : "") + "\">");
                    } else {
                        if (col.formatter) {
                            cc.push(col.formatter(_6e6, _6e3, _6e2));
                        } else {
                            cc.push(_6e6);
                        }
                    }
                    cc.push("</div>");
                    cc.push("</td>");
                }
            }
            return cc.join("");
        }, refreshRow: function (_6ea, _6eb) {
            this.updateRow.call(this, _6ea, _6eb, {});
        }, updateRow: function (_6ec, _6ed, row) {
            var opts = $.data(_6ec, "datagrid").options;
            var rows = $(_6ec).datagrid("getRows");
            $.extend(rows[_6ed], row);
            var css = opts.rowStyler ? opts.rowStyler.call(_6ec, _6ed, rows[_6ed]) : "";
            var _6ee = "";
            var _6ef = "";
            if (typeof css == "string") {
                _6ef = css;
            } else {
                if (css) {
                    _6ee = css["class"] || "";
                    _6ef = css["style"] || "";
                }
            }
            var _6ee = "datagrid-row " + (_6ed % 2 && opts.striped ? "datagrid-row-alt " : " ") + _6ee  ;
            function _6f0(_6f1) {
                var _6f2 = $(_6ec).datagrid("getColumnFields", _6f1);
                var tr = opts.finder.getTr(_6ec, _6ed, "body", (_6f1 ? 1 : 2));
                var _6f3 = tr.find("div.datagrid-cell-check input[type=checkbox]").is(":checked");
                //wanghc 以前td有datagrid-value-changed样式的,还得加上 实现修改后小红三角
                //---start
                if (opts.showChangedStyle){
                    var changedFields=[];
                    tr.children(".datagrid-value-changed").each(function(){
                        changedFields.push($(this).attr("field"));
                    });
                }
                //---end
                tr.html(this.renderRow.call(this, _6ec, _6f2, _6f1, _6ed, rows[_6ed]));
                //---start 加上样式
                if (opts.showChangedStyle){   
                    for (var i=0;i<changedFields.length;i++){
                        tr.children('td[field="'+changedFields[i]+'"]').addClass("datagrid-value-changed");
                    }
                }
                //---end
                // neer 2019-05-19 如果datagrid的配置项checkbox:true时且为可编辑表格时，endEdit调用时不能清空datagrid-row-checked状态d
                var isRowChecked = tr.hasClass('datagrid-row-checked');
                tr.attr("style", _6ef).attr("class", tr.hasClass("datagrid-row-selected") ? _6ee + " datagrid-row-selected" : _6ee)
                if (isRowChecked){ tr.addClass('datagrid-row-checked');}
                if (_6f3) {
                    tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", true);
                }
            };
            _6f0.call(this, true); /** true表示number列 */
            _6f0.call(this, false); /**false表示内容列 */
            $(_6ec).datagrid("fixRowHeight", _6ed);
        }, insertRow: function (_6f4, _6f5, row) {
            var _6f6 = $.data(_6f4, "datagrid");
            var opts = _6f6.options;
            var dc = _6f6.dc;
            var data = _6f6.data;
            if (_6f5 == undefined || _6f5 == null) {
                _6f5 = data.rows.length;
            }
            if (_6f5 > data.rows.length) {
                _6f5 = data.rows.length;
            }
            function _6f7(_6f8) {
                var _6f9 = _6f8 ? 1 : 2;
                for (var i = data.rows.length - 1; i >= _6f5; i--) {
                    var tr = opts.finder.getTr(_6f4, i, "body", _6f9);
                    tr.attr("datagrid-row-index", i + 1);
                    tr.attr("id", _6f6.rowIdPrefix + "-" + _6f9 + "-" + (i + 1));
                    if (_6f8 && opts.rownumbers) {
                        var _6fa = i + 2;
                        if (opts.pagination) {
                            _6fa += (opts.pageNumber - 1) * opts.pageSize;
                        }
                        tr.find("div.datagrid-cell-rownumber").html(_6fa);
                    }
                    if (opts.striped) {
                        tr.removeClass("datagrid-row-alt").addClass((i + 1) % 2 ? "datagrid-row-alt" : "");
                    }
                }
            };
            function _6fb(_6fc) {
                var _6fd = _6fc ? 1 : 2;
                var _6fe = $(_6f4).datagrid("getColumnFields", _6fc);
                var _6ff = _6f6.rowIdPrefix + "-" + _6fd + "-" + _6f5;
                var tr = "<tr id=\"" + _6ff + "\" class=\"datagrid-row\" datagrid-row-index=\"" + _6f5 + "\"></tr>";
                if (_6f5 >= data.rows.length) {
                    if (data.rows.length) {
                        opts.finder.getTr(_6f4, "", "last", _6fd).after(tr);
                    } else {
                        var cc = _6fc ? dc.body1 : dc.body2;
                        cc.html("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>" + tr + "</tbody></table>");
                    }
                } else {
                    opts.finder.getTr(_6f4, _6f5 + 1, "body", _6fd).before(tr);
                }
            };
            _6f7.call(this, true);
            _6f7.call(this, false);
            _6fb.call(this, true);
            _6fb.call(this, false);
            data.total += 1;
            data.rows.splice(_6f5, 0, row);
            this.refreshRow.call(this, _6f4, _6f5);
        }, deleteRow: function (_700, _701) {
            var _702 = $.data(_700, "datagrid");
            var opts = _702.options;
            var data = _702.data;
            function _703(_704) {
                var _705 = _704 ? 1 : 2;
                for (var i = _701 + 1; i < data.rows.length; i++) {
                    var tr = opts.finder.getTr(_700, i, "body", _705);
                    tr.attr("datagrid-row-index", i - 1);
                    tr.attr("id", _702.rowIdPrefix + "-" + _705 + "-" + (i - 1));
                    if (_704 && opts.rownumbers) {
                        var _706 = i;
                        if (opts.pagination) {
                            _706 += (opts.pageNumber - 1) * opts.pageSize;
                        }
                        tr.find("div.datagrid-cell-rownumber").html(_706);
                    }
                    if (opts.striped) {
                        tr.removeClass("datagrid-row-alt").addClass((i - 1) % 2 ? "datagrid-row-alt" : "");
                    }
                }
            };
            opts.finder.getTr(_700, _701).remove();
            _703.call(this, true);
            _703.call(this, false);
            data.total -= 1;
            data.rows.splice(_701, 1);
        }, onBeforeRender: function (_707, rows) {
        }, onAfterRender: function (_708) {
            var opts = $.data(_708, "datagrid").options;
            if (opts.showFooter) {
                var _709 = $(_708).datagrid("getPanel").find("div.datagrid-footer");
                _709.find("div.datagrid-cell-rownumber,div.datagrid-cell-check").css("visibility", "hidden");
            }
        }
    };
    $.fn.datagrid.defaults = $.extend({}, $.fn.panel.defaults, {
        showChangedStyle:true, /*wanghc editor状态下,是否显示修改后的左上小红三角 */
        fixRowNumber:false, /*wanghc 行号列是否自动适应 */
        autoSizeColumn:true, /*wanghc 速度更新配置成false*/
        sharedStyleSheet: false, frozenColumns: undefined, columns: undefined, fitColumns: false, resizeHandle: "right", autoRowHeight: true, 
        btoolbar:null, /* bottom tool bar*/
        toolbar: null, striped: false, method: "post", nowrap: true, idField: null, url: null, data: null, loadMsg: "Processing, please wait ...", rownumbers: false, singleSelect: false, ctrlSelect: false, selectOnCheck: true, checkOnSelect: true, pagination: false, pagePosition: "bottom", pageNumber: 1, pageSize: 10, pageList: [10, 20, 30, 40, 50], queryParams: {}, sortName: null, sortOrder: "asc", multiSort: false, remoteSort: true, showHeader: true, showFooter: false, scrollbarSize: 18, rowStyler: function (_70a, _70b) {
        }, loader: function (_70c, _70d, _70e) {
            var opts = $(this).datagrid("options");
            if (!opts.url) {
                return false;
            }
            $.ajax({
                type: opts.method, url: opts.url, data: _70c, dataType: "json", success: function (data) {
                    _70d(data);
                }, error: function () {
                    _70e.apply(this, arguments);
                }
            });
        }, loadFilter: function (data) {
            if (typeof data.length == "number" && typeof data.splice == "function") {
                return { total: data.length, rows: data };
            } else {
                return data;
            }
        }, editors: _651, finder: {
            getTr: function (_70f, _710, type, _711) {
                type = type || "body";
                _711 = _711 || 0;
                var _712 = $.data(_70f, "datagrid");
                var dc = _712.dc;
                var opts = _712.options;
                if (_711 == 0) {
                    var tr1 = opts.finder.getTr(_70f, _710, type, 1);
                    var tr2 = opts.finder.getTr(_70f, _710, type, 2);
                    return tr1.add(tr2);
                } else {
                    if (type == "body") {
                        var tr = $("#" + _712.rowIdPrefix + "-" + _711 + "-" + _710);
                        if (!tr.length) {
                            tr = (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index=" + _710 + "]");
                        }
                        return tr;
                    } else {
                        if (type == "footer") {
                            return (_711 == 1 ? dc.footer1 : dc.footer2).find(">table>tbody>tr[datagrid-row-index=" + _710 + "]");
                        } else {
                            if (type == "selected") {
                                return (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-selected");
                            } else {
                                if (type == "highlight") {
                                    return (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-over");
                                } else {
                                    if (type == "checked") {
                                        return (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr.datagrid-row-checked");
                                    } else {
                                        if (type == "last") {
                                            return (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index]:last");
                                        } else {
                                            if (type == "allbody") {
                                                return (_711 == 1 ? dc.body1 : dc.body2).find(">table>tbody>tr[datagrid-row-index]");
                                            } else {
                                                if (type == "allfooter") {
                                                    return (_711 == 1 ? dc.footer1 : dc.footer2).find(">table>tbody>tr[datagrid-row-index]");
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }, getRow: function (_713, p) {
                var _714 = (typeof p == "object") ? p.attr("datagrid-row-index") : p;
                return $.data(_713, "datagrid").data.rows[parseInt(_714)];
            }, getRows: function (_715) {
                return $(_715).datagrid("getRows");
            }
        }, view: _6cf, onBeforeLoad: function (_716) {
        }, onLoadSuccess: function () {
        }, onLoadError: function () {
        }, onClickRow: function (_717, _718) {
        }, onDblClickRow: function (_719, _71a) {
        }, onClickCell: function (_71b, _71c, _71d) {
        }, onDblClickCell: function (_71e, _71f, _720) {
        }, onBeforeSortColumn: function (sort, _721) {
        }, onSortColumn: function (sort, _722) {
        }, onResizeColumn: function (_723, _724) {
        }, onBeforeSelect: function (_725, _726) {
        }, onSelect: function (_725, _726) {
        }, onBeforeUnselect:function(_727, _728){
        }, onUnselect: function (_727, _728) {
        }, onSelectAll: function (rows) {
        }, onUnselectAll: function (rows) {
        }, onBeforeCheck:function (_729, _72a){
        }, onCheck: function (_729, _72a) {
        }, onBeforeUncheck:function (_72b, _72c){
        }, onUncheck: function (_72b, _72c) {
        }, onCheckAll: function (rows) {
        }, onUncheckAll: function (rows) {
        }, onBeforeEdit: function (_72d, _72e) {
        }, onBeginEdit: function (_72f, _730) {
        }, onEndEdit: function (_731, _732, _733) {
        }, onAfterEdit: function (_734, _735, _736) {
        }, onCancelEdit: function (_737, _738) {
        }, onHeaderContextMenu: function (e, _739) {
        }, onRowContextMenu: function (e, _73a, _73b) {
        },onDblClickHeader:function(e,_739){    //cryze 双击表格头事件，默认
        },lazy:false    //cryze 2018-3-22 为true初始化不加载列表数据
        ,onHighlightRow:function(index,row){ //cryze datagrid 高亮行(鼠标悬浮和combogrid上下选时)触发事件
        }
    });
})(jQuery);
(function ($) {
    var currTarget;
    function buildGrid(target) {
        var state = $.data(target, "propertygrid");
        var opts = $.data(target, "propertygrid").options;
        $(target).datagrid($.extend({}, opts, {
            cls: "propertygrid", view: (opts.showGroup ? opts.groupView : opts.view), onClickRow: function (index, row) {
                if (currTarget != this) {
                    stopEditing(currTarget);
                    currTarget = this;
                }
                if (opts.editIndex != index && row.editor) {
                    var col = $(this).datagrid("getColumnOption", "value");
                    col.editor = row.editor;
                    stopEditing(currTarget);
                    $(this).datagrid("beginEdit", index);
                    $(this).datagrid("getEditors", index)[0].target.focus();
                    opts.editIndex = index;
                }
                opts.onClickRow.call(target, index, row);
            }, loadFilter: function (data) {
                stopEditing(this);
                return opts.loadFilter.call(this, data);
            }
        }));
        $(document).unbind(".propertygrid").bind("mousedown.propertygrid", function (e) {
            var p = $(e.target).closest("div.datagrid-view,div.combo-panel");
            if (p.length) {
                return;
            }
            stopEditing(currTarget);
            currTarget = undefined;
        });
    };
    function stopEditing(target) {
        var t = $(target);
        if (!t.length) {
            return;
        }
        var opts = $.data(target, "propertygrid").options;
        var index = opts.editIndex;
        if (index == undefined) {
            return;
        }
        var ed = t.datagrid("getEditors", index)[0];
        if (ed) {
            ed.target.blur();
            if (t.datagrid("validateRow", index)) {
                t.datagrid("endEdit", index);
            } else {
                t.datagrid("cancelEdit", index);
            }
        }
        opts.editIndex = undefined;
    };
    $.fn.propertygrid = function (options, param) {
        if (typeof options == "string") {
            var method = $.fn.propertygrid.methods[options];
            if (method) {
                return method(this, param);
            } else {
                return this.datagrid(options, param);
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "propertygrid");
            if (state) {
                $.extend(state.options, options);
            } else {
                var opts = $.extend({}, $.fn.propertygrid.defaults, $.fn.propertygrid.parseOptions(this), options);
                opts.frozenColumns = $.extend(true, [], opts.frozenColumns);
                opts.columns = $.extend(true, [], opts.columns);
                $.data(this, "propertygrid", { options: opts });
            }
            buildGrid(this);
        });
    };
    $.fn.propertygrid.methods = {
        options: function (jq) {
            return $.data(jq[0], "propertygrid").options;
        }
    };
    $.fn.propertygrid.parseOptions = function (target) {
        return $.extend({}, $.fn.datagrid.parseOptions(target), $.parser.parseOptions(target, [{ showGroup: "boolean" }]));
    };
    var groupview = $.extend({}, $.fn.datagrid.defaults.view, {
        render: function (target, container, frozen) {
            var table = [];
            var groups = this.groups;
            for (var i = 0; i < groups.length; i++) {
                table.push(this.renderGroup.call(this, target, i, groups[i], frozen));
            }
            $(container).html(table.join(""));
        }, renderGroup: function (target, groupIndex, group, frozen) {
            var state = $.data(target, "datagrid");
            var opts = state.options;
            var fields = $(target).datagrid("getColumnFields", frozen);
            var table = [];
            table.push("<div class=\"datagrid-group\" group-index=" + groupIndex + ">");
            table.push("<table cellspacing=\"0\" cellpadding=\"0\" border=\"0\" style=\"height:100%\"><tbody>");
            table.push("<tr>");
            if ((frozen && (opts.rownumbers || opts.frozenColumns.length)) || (!frozen && !(opts.rownumbers || opts.frozenColumns.length))) {
                table.push("<td style=\"border:0;text-align:center;width:25px\"><span class=\"datagrid-row-expander datagrid-row-collapse\" style=\"display:inline-block;width:16px;height:16px;cursor:pointer\">&nbsp;</span></td>");
            }
            table.push("<td style=\"border:0;\">");
            if (!frozen) {
                table.push("<span class=\"datagrid-group-title\">");
                table.push(opts.groupFormatter.call(target, group.value, group.rows));
                table.push("</span>");
            }
            table.push("</td>");
            table.push("</tr>");
            table.push("</tbody></table>");
            table.push("</div>");
            table.push("<table class=\"datagrid-btable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>");
            var index = group.startIndex;
            for (var j = 0; j < group.rows.length; j++) {
                var css = opts.rowStyler ? opts.rowStyler.call(target, index, group.rows[j]) : "";
                var classValue = "";
                var styleValue = "";
                if (typeof css == "string") {
                    styleValue = css;
                } else {
                    if (css) {
                        classValue = css["class"] || "";
                        styleValue = css["style"] || "";
                    }
                }
                var cls = "class=\"datagrid-row " + (index % 2 && opts.striped ? "datagrid-row-alt " : " ") + classValue + "\"";
                var style = styleValue ? "style=\"" + styleValue + "\"" : "";
                var rowId = state.rowIdPrefix + "-" + (frozen ? 1 : 2) + "-" + index;
                table.push("<tr id=\"" + rowId + "\" datagrid-row-index=\"" + index + "\" " + cls + " " + style + ">");
                table.push(this.renderRow.call(this, target, fields, frozen, index, group.rows[j]));
                table.push("</tr>");
                index++;
            }
            table.push("</tbody></table>");
            return table.join("");
        }, bindEvents: function (target) {
            var state = $.data(target, "datagrid");
            var dc = state.dc;
            var body = dc.body1.add(dc.body2);
            var clickHandler = ($.data(body[0], "events") || $._data(body[0], "events")).click[0].handler;
            body.unbind("click").bind("click", function (e) {
                var tt = $(e.target);
                var expander = tt.closest("span.datagrid-row-expander");
                if (expander.length) {
                    var gindex = expander.closest("div.datagrid-group").attr("group-index");
                    if (expander.hasClass("datagrid-row-collapse")) {
                        $(target).datagrid("collapseGroup", gindex);
                    } else {
                        $(target).datagrid("expandGroup", gindex);
                    }
                } else {
                    clickHandler(e);
                }
                e.stopPropagation();
            });
        }, onBeforeRender: function (target, rows) {
            var state = $.data(target, "datagrid");
            var opts = state.options;
            initCss();
            var groups = [];
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var group = getGroup(row[opts.groupField]);
                if (!group) {
                    group = { value: row[opts.groupField], rows: [row] };
                    groups.push(group);
                } else {
                    group.rows.push(row);
                }
            }
            var index = 0;
            var newRows = [];
            for (var i = 0; i < groups.length; i++) {
                var group = groups[i];
                group.startIndex = index;
                index += group.rows.length;
                newRows = newRows.concat(group.rows);
            }
            state.data.rows = newRows;
            this.groups = groups;
            var that = this;
            setTimeout(function () {
                that.bindEvents(target);
            }, 0);
            function getGroup(value) {
                for (var i = 0; i < groups.length; i++) {
                    var group = groups[i];
                    if (group.value == value) {
                        return group;
                    }
                }
                return null;
            };
            function initCss() {
                if (!$("#datagrid-group-style").length) {
                    $("head").append("<style id=\"datagrid-group-style\">" + ".datagrid-group{height:25px;overflow:hidden;font-weight:bold;border-bottom:1px solid #ccc;}" + "</style>");
                }
            };
        }
    });
    $.extend($.fn.datagrid.methods, {
        expandGroup: function (jq, groupIndex) {
            return jq.each(function () {
                var view = $.data(this, "datagrid").dc.view;
                var group = view.find(groupIndex != undefined ? "div.datagrid-group[group-index=\"" + groupIndex + "\"]" : "div.datagrid-group");
                var expander = group.find("span.datagrid-row-expander");
                if (expander.hasClass("datagrid-row-expand")) {
                    expander.removeClass("datagrid-row-expand").addClass("datagrid-row-collapse");
                    group.next("table").show();
                }
                $(this).datagrid("fixRowHeight");
            });
        }, collapseGroup: function (jq, groupIndex) {
            return jq.each(function () {
                var view = $.data(this, "datagrid").dc.view;
                var group = view.find(groupIndex != undefined ? "div.datagrid-group[group-index=\"" + groupIndex + "\"]" : "div.datagrid-group");
                var expander = group.find("span.datagrid-row-expander");
                if (expander.hasClass("datagrid-row-collapse")) {
                    expander.removeClass("datagrid-row-collapse").addClass("datagrid-row-expand");
                    group.next("table").hide();
                }
                $(this).datagrid("fixRowHeight");
            });
        }
    });
    $.fn.propertygrid.defaults = $.extend({}, $.fn.datagrid.defaults, {
        singleSelect: true, remoteSort: false, fitColumns: true, loadMsg: "", frozenColumns: [[{ field: "f", width: 16, resizable: false }]], columns: [[{ field: "name", title: "Name", width: 100, sortable: true }, { field: "value", title: "Value", width: 100, resizable: false }]], showGroup: false, groupView: groupview, groupField: "group", groupFormatter: function (fvalue, rows) {
            return fvalue;
        }
    });
})(jQuery);
/**----wanghc -check-treegrid */
/*treegrid1.5--start*/
(function ($) {
	function _1(_2) {
		var _3 = $.data(_2, "treegrid");
		var _4 = _3.options;
		$(_2).datagrid($.extend({}, _4, {
				url : null,
				data : null,
				loader : function () {
					return false;
				},
				onBeforeLoad : function () {
					return false;
				},
				onLoadSuccess : function () {},
				onResizeColumn : function (_5, _6) {
					_16(_2);
					_4.onResizeColumn.call(_2, _5, _6);
				},
				onBeforeSortColumn : function (_7, _8) {
					if (_4.onBeforeSortColumn.call(_2, _7, _8) == false) {
						return false;
					}
				},
				onSortColumn : function (_9, _a) {
					_4.sortName = _9;
					_4.sortOrder = _a;
					if (_4.remoteSort) {
						_15(_2);
					} else {
						var _b = $(_2).treegrid("getData");
						_4f(_2, null, _b);
					}
					_4.onSortColumn.call(_2, _9, _a);
				},
				onClickCell : function (_c, _d) {
					_4.onClickCell.call(_2, _d, _30(_2, _c));
				},
				onDblClickCell : function (_e, _f) {
					_4.onDblClickCell.call(_2, _f, _30(_2, _e));
				},
				onRowContextMenu : function (e, _10) {
					_4.onContextMenu.call(_2, e, _30(_2, _10));
				}
			}));
		var _11 = $.data(_2, "datagrid").options;
		_4.columns = _11.columns;
		_4.frozenColumns = _11.frozenColumns;
		_3.dc = $.data(_2, "datagrid").dc;
		if (_4.pagination) {
			var _12 = $(_2).datagrid("getPager");
			_12.pagination({
				pageNumber : _4.pageNumber,
				pageSize : _4.pageSize,
				pageList : _4.pageList,
				onSelectPage : function (_13, _14) {
					_4.pageNumber = _13;
					_4.pageSize = _14;
					_15(_2);
				}
			});
			_4.pageSize = _12.pagination("options").pageSize;
		}
	};
	function _16(_17, _18) {
		var _19 = $.data(_17, "datagrid").options;
		var dc = $.data(_17, "datagrid").dc;
		if (!dc.body1.is(":empty") && (!_19.nowrap || _19.autoRowHeight)) {
			if (_18 != undefined) {
				var _1a = _1b(_17, _18);
				for (var i = 0; i < _1a.length; i++) {
					_1c(_1a[i][_19.idField]);
				}
			}
		}
		$(_17).datagrid("fixRowHeight", _18);
		function _1c(_1d) {
			var tr1 = _19.finder.getTr(_17, _1d, "body", 1);
			var tr2 = _19.finder.getTr(_17, _1d, "body", 2);
			tr1.css("height", "");
			tr2.css("height", "");
			var _1e = Math.max(tr1.height(), tr2.height());
			tr1.css("height", _1e);
			tr2.css("height", _1e);
		};
	};
	function _1f(_20) {
		var dc = $.data(_20, "datagrid").dc;
		var _21 = $.data(_20, "treegrid").options;
		if (!_21.rownumbers) {
			return;
		}
		dc.body1.find("div.datagrid-cell-rownumber").each(function (i) {
			$(this).html(i + 1);
		});
	};
	function _22(_23) {
		return function (e) {
			//$.fn.datagrid.defaults.rowEvents[_23 ? "mouseover" : "mouseout"](e); //wanghc 不能修改成treegrid会死循环
			var tt = $(e.target);
			var fn = _23 ? "addClass" : "removeClass";
			if (tt.hasClass("tree-hit")) {
				tt.hasClass("tree-expanded") ? tt[fn]("tree-expanded-hover") : tt[fn]("tree-collapsed-hover");
			}
		};
	};
	function _24(e) {		
		var tt = $(e.target);
		if (tt.hasClass("tree-hit")) {
			_25(_26);
		} else {
			if (tt.hasClass("tree-checkbox")) {
				_25(_27);
			} else {
				//$.fn.datagrid.defaults.rowEvents.click(e);  wanghc--不能修改成treegrid--死循环
			}
		}
		function _25(fn) {
			var tr = tt.closest("tr.datagrid-row");
			var _28 = tr.closest("div.datagrid-view").children(".datagrid-f")[0];
			fn(_28, tr.attr("node-id"));
		};
	};
	function _27(_29, _2a, _2b, _2c) {
		var _2d = $.data(_29, "treegrid");
		var _2e = _2d.checkedRows;
		var _2f = _2d.options;
		if (!_2f.checkbox) {
			return;
		}
		var row = _30(_29, _2a);
		if (!row.checkState) {
			return;
		}
		var tr = _2f.finder.getTr(_29, _2a);
		var ck = tr.find(".tree-checkbox");
		if (_2b == undefined) {
			if (ck.hasClass("tree-checkbox1")) {
				_2b = false;
			} else {
				if (ck.hasClass("tree-checkbox0")) {
					_2b = true;
				} else {
					if (row._checked == undefined) {
						row._checked = ck.hasClass("tree-checkbox1");
					}
					_2b = !row._checked;
				}
			}
		}
		row._checked = _2b;
		if (_2b) {
			if (ck.hasClass("tree-checkbox1")) {
				return;
			}
		} else {
			if (ck.hasClass("tree-checkbox0")) {
				return;
			}
		}
		if (!_2c) {
			if (_2f.onBeforeCheckNode.call(_29, row, _2b) == false) {
				return;
			}
		}
		if (_2f.cascadeCheck) {
			_31(_29, row, _2b);
			_32(_29, row);
		} else {
			_33(_29, row, _2b ? "1" : "0");
		}
		if (!_2c) {
			_2f.onCheckNode.call(_29, row, _2b);
		}
	};
	function _33(_34, row, _35) {
		var _36 = $.data(_34, "treegrid");
		var _37 = _36.checkedRows;
		var _38 = _36.options;
		if (!row.checkState || _35 == undefined) {
			return;
		}
		var tr = _38.finder.getTr(_34, row[_38.idField]);
		var ck = tr.find(".tree-checkbox");
		if (!ck.length) {
			return;
		}
		row.checkState = ["unchecked", "checked", "indeterminate"][_35];
		row.checked = (row.checkState == "checked");
		ck.removeClass("tree-checkbox0 tree-checkbox1 tree-checkbox2");
		ck.addClass("tree-checkbox" + _35);
		if (_35 == 0) {
			$.hisui.removeArrayItem(_37, _38.idField, row[_38.idField]);
		} else {
			$.hisui.addArrayItem(_37, _38.idField, row);
		}
	};
	function _31(_39, row, _3a) {
		var _3b = _3a ? 1 : 0;
		_33(_39, row, _3b);
		$.hisui.forEach(row.children || [], true, function (r) {
			_33(_39, r, _3b);
		});
	};
	function _32(_3c, row) {
		var _3d = $.data(_3c, "treegrid").options;
		var _3e = _3f(_3c, row[_3d.idField]);
		if (_3e) {
			_33(_3c, _3e, _40(_3e));
			_32(_3c, _3e);
		}
	};
	function _40(row) {
		var len = 0;
		var c0 = 0;
		var c1 = 0;
		$.hisui.forEach(row.children || [], false, function (r) {
			if (r.checkState) {
				len++;
				if (r.checkState == "checked") {
					c1++;
				} else {
					if (r.checkState == "unchecked") {
						c0++;
					}
				}
			}
		});
		if (len == 0) {
			return undefined;
		}
		var _41 = 0;
		if (c0 == len) {
			_41 = 0;
		} else {
			if (c1 == len) {
				_41 = 1;
			} else {
				_41 = 2;
			}
		}
		return _41;
	};
	function _42(_43, _44) {
		var _45 = $.data(_43, "treegrid").options;
		if (!_45.checkbox) {
			return;
		}
		var row = _30(_43, _44);
		var tr = _45.finder.getTr(_43, _44);
		var ck = tr.find(".tree-checkbox");
		if (_45.view.hasCheckbox(_43, row)) {
			if (!ck.length) {
				row.checkState = row.checkState || "unchecked";
				$("<span class=\"tree-checkbox\"></span>").insertBefore(tr.find(".tree-title"));
			}
			if (row.checkState == "checked") {
				_27(_43, _44, true, true);
			} else {
				if (row.checkState == "unchecked") {
					_27(_43, _44, false, true);
				} else {
					var _46 = _40(row);
					if (_46 === 0) {
						_27(_43, _44, false, true);
					} else {
						if (_46 === 1) {
							_27(_43, _44, true, true);
						}
					}
				}
			}
		} else {
			ck.remove();
			row.checkState = undefined;
			row.checked = undefined;
			_32(_43, row);
		}
	};
	function _47(_48, _49) {
		var _4a = $.data(_48, "treegrid").options;
		var tr1 = _4a.finder.getTr(_48, _49, "body", 1);
		var tr2 = _4a.finder.getTr(_48, _49, "body", 2);
		var _4b = $(_48).datagrid("getColumnFields", true).length + (_4a.rownumbers ? 1 : 0);
		var _4c = $(_48).datagrid("getColumnFields", false).length;
		_4d(tr1, _4b);
		_4d(tr2, _4c);
		function _4d(tr, _4e) {
			$("<tr class=\"treegrid-tr-tree\">" + "<td style=\"border:0px\" colspan=\"" + _4e + "\">" + "<div></div>" + "</td>" + "</tr>").insertAfter(tr);
		};
    };
    ///cryze 2018-4-23 add 
    //同步checkedRows  删除子节点元素 要把checkedRows中的删掉
    function syncCheckedRows(el,pJq){
        
        var d = $.data(el, "treegrid");
        var opts=d.options;
        var checkedRows=d.checkedRows;
        if( ! $.isArray(checkedRows) ) return;
        for (var i=0;i<checkedRows.length;i++){
            var row=checkedRows[i];
            var rowJq = opts.finder.getTr(el, row[opts.idField], "body", 2);
            if (pJq.find(rowJq).length>0) {
                checkedRows.splice(i,1);
                i--;
            }
        }
        
    }
	function _4f(_50, _51, _52, _53, _54) {
		var _55 = $.data(_50, "treegrid");
		var _56 = _55.options;
		var dc = _55.dc;
		_52 = _56.loadFilter.call(_50, _52, _51);
		var _57 = _30(_50, _51);
		if (_57) {
			var _58 = _56.finder.getTr(_50, _51, "body", 1);
			var _59 = _56.finder.getTr(_50, _51, "body", 2);
			var cc1 = _58.next("tr.treegrid-tr-tree").children("td").children("div");
			var cc2 = _59.next("tr.treegrid-tr-tree").children("td").children("div");
			if (!_53) {
				_57.children = [];
			}
		} else {
			var cc1 = dc.body1;
			var cc2 = dc.body2;
			if (!_53) {
				_55.data = [];
			}
		}
		if (!_53) {
            //cryze 2018-4-23 load 是在这里清空的  那么cc2下面的checkedRow应当从 checkedRows数组移除
            if (!_57) { //全都load
               _55.checkedRows=[];
            }else{  //从某一节点load
                syncCheckedRows(_50,cc2);
            }
			cc1.empty();
            cc2.empty();
            
		}
		if (_56.view.onBeforeRender) {
			_56.view.onBeforeRender.call(_56.view, _50, _51, _52);
		}
		_56.view.render.call(_56.view, _50, cc1, true);
		_56.view.render.call(_56.view, _50, cc2, false);
		if (_56.showFooter) {
			_56.view.renderFooter.call(_56.view, _50, dc.footer1, true);
			_56.view.renderFooter.call(_56.view, _50, dc.footer2, false);
		}
		if (_56.view.onAfterRender) {
			_56.view.onAfterRender.call(_56.view, _50);
		}
		if (!_51 && _56.pagination) {
			var _5a = $.data(_50, "treegrid").total;
			var _5b = $(_50).datagrid("getPager");
			if (_5b.pagination("options").total != _5a) {
				_5b.pagination({
					total : _5a
				});
			}
		}
		_16(_50);
		_1f(_50);
		$(_50).treegrid("showLines");
		$(_50).treegrid("setSelectionState");
		$(_50).treegrid("autoSizeColumn");
		if (!_54) {
			_56.onLoadSuccess.call(_50, _57, _52);
		}
	};
	function _15(_5c, _5d, _5e, _5f, _60) {
		var _61 = $.data(_5c, "treegrid").options;
		var _62 = $(_5c).datagrid("getPanel").find("div.datagrid-body");
		if (_5d == undefined && _61.queryParams) {
			_61.queryParams.id = undefined;
		}
		if (_5e) {
			_61.queryParams = _5e;
		}
		var _63 = $.extend({}, _61.queryParams);
		if (_61.pagination) {
			$.extend(_63, {
				page : _61.pageNumber,
				rows : _61.pageSize
			});
		}
		if (_61.sortName) {
			$.extend(_63, {
				sort : _61.sortName,
				order : _61.sortOrder
			});
		}
		var row = _30(_5c, _5d);
		if (_61.onBeforeLoad.call(_5c, row, _63) == false) {
			return;
		}
		var _64 = _62.find("tr[node-id=\"" + _5d + "\"] span.tree-folder");
		_64.addClass("tree-loading");
		$(_5c).treegrid("loading");
		var _65 = _61.loader.call(_5c, _63, function (_66) {
				_64.removeClass("tree-loading");
				$(_5c).treegrid("loaded");
				_4f(_5c, _5d, _66, _5f);
				if (_60) {
					_60();
				}
			}, function () {
				_64.removeClass("tree-loading");
				$(_5c).treegrid("loaded");
				_61.onLoadError.apply(_5c, arguments);
				if (_60) {
					_60();
				}
			});
		if (_65 == false) {
			_64.removeClass("tree-loading");
			$(_5c).treegrid("loaded");
		}
	};
	function _67(_68) {
		var _69 = _6a(_68);
		return _69.length ? _69[0] : null;
	};
	function _6a(_6b) {
		return $.data(_6b, "treegrid").data;
	};
	function _3f(_6c, _6d) {
		var row = _30(_6c, _6d);
		if (row._parentId) {
			return _30(_6c, row._parentId);
		} else {
			return null;
		}
	};
	function _1b(_6e, _6f) {
		var _70 = $.data(_6e, "treegrid").data;
		if (_6f) {
			var _71 = _30(_6e, _6f);
			_70 = _71 ? (_71.children || []) : [];
		}
		var _72 = [];
		$.hisui.forEach(_70, true, function (_73) {
			_72.push(_73);
		});
		return _72;
	};
	function _74(_75, _76) {
		var _77 = $.data(_75, "treegrid").options;
		var tr = _77.finder.getTr(_75, _76);
		var _78 = tr.children("td[field=\"" + _77.treeField + "\"]");
		return _78.find("span.tree-indent,span.tree-hit").length;
	};
	function _30(_79, _7a) {
		var _7b = $.data(_79, "treegrid");
		var _7c = _7b.options;
		var _7d = null;
		$.hisui.forEach(_7b.data, true, function (_7e) {
			if (_7e[_7c.idField] == _7a) {
				_7d = _7e;
				return false;
			}
		});
		return _7d;
	};
	function _7f(_80, _81) {
		var _82 = $.data(_80, "treegrid").options;
		var row = _30(_80, _81);
		var tr = _82.finder.getTr(_80, _81);
		var hit = tr.find("span.tree-hit");
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-collapsed")) {
			return;
		}
		if (_82.onBeforeCollapse.call(_80, row) == false) {
			return;
		}
		hit.removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
		hit.next().removeClass("tree-folder-open");
		row.state = "closed";
		tr = tr.next("tr.treegrid-tr-tree");
		var cc = tr.children("td").children("div");
		if (_82.animate) {
			cc.slideUp("normal", function () {
				$(_80).treegrid("autoSizeColumn");
				_16(_80, _81);
				_82.onCollapse.call(_80, row);
			});
		} else {
			cc.hide();
			$(_80).treegrid("autoSizeColumn");
			_16(_80, _81);
			_82.onCollapse.call(_80, row);
		}
	};
	function _83(_84, _85) {
        //console.log("这个方法耗时啊"+new Date());  //cryze 2018-3-27
		var _86 = $.data(_84, "treegrid").options;
		var tr = _86.finder.getTr(_84, _85);
		var hit = tr.find("span.tree-hit");
		var row = _30(_84, _85);
		if (hit.length == 0) {
			return;
		}
		if (hit.hasClass("tree-expanded")) {
			return;
		}
		if (_86.onBeforeExpand.call(_84, row) == false) {
			return;
		}
		hit.removeClass("tree-collapsed tree-collapsed-hover").addClass("tree-expanded");
		hit.next().addClass("tree-folder-open");
		var _87 = tr.next("tr.treegrid-tr-tree");
		if (_87.length) {
			var cc = _87.children("td").children("div");
			_88(cc);
		} else {
			_47(_84, row[_86.idField]);
			var _87 = tr.next("tr.treegrid-tr-tree");
			var cc = _87.children("td").children("div");
			cc.hide();
			var _89 = $.extend({}, _86.queryParams || {});
			_89.id = row[_86.idField];
			_15(_84, row[_86.idField], _89, true, function () {
				if (cc.is(":empty")) {
					_87.remove();
				} else {
					_88(cc);
				}
			});
		}
		function _88(cc) {
			row.state = "open";
			if (_86.animate) {
				cc.slideDown("normal", function () {
					$(_84).treegrid("autoSizeColumn");
					_16(_84, _85);
					_86.onExpand.call(_84, row);
				});
			} else {
				cc.show();
				$(_84).treegrid("autoSizeColumn");
				_16(_84, _85);
				_86.onExpand.call(_84, row);
			}
		};
	};
	function _26(_8a, _8b) {
		var _8c = $.data(_8a, "treegrid").options;
		var tr = _8c.finder.getTr(_8a, _8b);
		var hit = tr.find("span.tree-hit");
		if (hit.hasClass("tree-expanded")) {
			_7f(_8a, _8b);
		} else {
			_83(_8a, _8b);
		}
	};
	function _8d(_8e, _8f) {
		var _90 = $.data(_8e, "treegrid").options;
		var _91 = _1b(_8e, _8f);
		if (_8f) {
			_91.unshift(_30(_8e, _8f));
		}
		for (var i = 0; i < _91.length; i++) {
			_7f(_8e, _91[i][_90.idField]);
		}
	};
	function _92(_93, _94) {
		var _95 = $.data(_93, "treegrid").options;
		var _96 = _1b(_93, _94);
		if (_94) {
			_96.unshift(_30(_93, _94));
		}
		for (var i = 0; i < _96.length; i++) {
			_83(_93, _96[i][_95.idField]);
		}
	};
	function _97(_98, _99) {
		var _9a = $.data(_98, "treegrid").options;
		var ids = [];
		var p = _3f(_98, _99);
		while (p) {
			var id = p[_9a.idField];
			ids.unshift(id);
			p = _3f(_98, id);
		}
		for (var i = 0; i < ids.length; i++) {
			_83(_98, ids[i]);
		}
	};
	function _9b(_9c, _9d) {
		var _9e = $.data(_9c, "treegrid");
		var _9f = _9e.options;
		if (_9d.parent) {
			var tr = _9f.finder.getTr(_9c, _9d.parent);
			if (tr.next("tr.treegrid-tr-tree").length == 0) {
				_47(_9c, _9d.parent);
			}
			var _a0 = tr.children("td[field=\"" + _9f.treeField + "\"]").children("div.datagrid-cell");
			var _a1 = _a0.children("span.tree-icon");
			if (_a1.hasClass("tree-file")) {
				_a1.removeClass("tree-file").addClass("tree-folder tree-folder-open");
				var hit = $("<span class=\"tree-hit tree-expanded\"></span>").insertBefore(_a1);
				if (hit.prev().length) {
					hit.prev().remove();
				}
			}
		}
		_4f(_9c, _9d.parent, _9d.data, _9e.data.length > 0, true);
	};
	function _a2(_a3, _a4) {
		var ref = _a4.before || _a4.after;
		var _a5 = $.data(_a3, "treegrid").options;
		var _a6 = _3f(_a3, ref);
		_9b(_a3, {
			parent : (_a6 ? _a6[_a5.idField] : null),
			data : [_a4.data]
		});
		var _a7 = _a6 ? _a6.children : $(_a3).treegrid("getRoots");
		for (var i = 0; i < _a7.length; i++) {
			if (_a7[i][_a5.idField] == ref) {
				var _a8 = _a7[_a7.length - 1];
				_a7.splice(_a4.before ? i : (i + 1), 0, _a8);
				_a7.splice(_a7.length - 1, 1);
				break;
			}
		}
		_a9(true);
		_a9(false);
		_1f(_a3);
		$(_a3).treegrid("showLines");
		function _a9(_aa) {
			var _ab = _aa ? 1 : 2;
			var tr = _a5.finder.getTr(_a3, _a4.data[_a5.idField], "body", _ab);
			var _ac = tr.closest("table.datagrid-btable");
			tr = tr.parent().children();
			var _ad = _a5.finder.getTr(_a3, ref, "body", _ab);
			if (_a4.before) {
				tr.insertBefore(_ad);
			} else {
				var sub = _ad.next("tr.treegrid-tr-tree");
				tr.insertAfter(sub.length ? sub : _ad);
			}
			_ac.remove();
		};
	};
	function _ae(_af, _b0) {
		var _b1 = $.data(_af, "treegrid");
		var _b2 = _b1.options;
		var _b3 = _3f(_af, _b0);
		$(_af).datagrid("deleteRow", _b0);
		$.hisui.removeArrayItem(_b1.checkedRows, _b2.idField, _b0);
		_1f(_af);
		if (_b3) {
			_42(_af, _b3[_b2.idField]);
		}
		_b1.total -= 1;
		$(_af).datagrid("getPager").pagination("refresh", {
			total : _b1.total
		});
		$(_af).treegrid("showLines");
	};
	function _b4(_b5) {
		var t = $(_b5);
		var _b6 = t.treegrid("options");
		if (_b6.lines) {
			t.treegrid("getPanel").addClass("tree-lines");
		} else {
			t.treegrid("getPanel").removeClass("tree-lines");
			return;
		}
		t.treegrid("getPanel").find("span.tree-indent").removeClass("tree-line tree-join tree-joinbottom");
		t.treegrid("getPanel").find("div.datagrid-cell").removeClass("tree-node-last tree-root-first tree-root-one");
		var _b7 = t.treegrid("getRoots");
		if (_b7.length > 1) {
			_b8(_b7[0]).addClass("tree-root-first");
		} else {
			if (_b7.length == 1) {
				_b8(_b7[0]).addClass("tree-root-one");
			}
		}
		_b9(_b7);
		_ba(_b7);
		function _b9(_bb) {
			$.map(_bb, function (_bc) {
				if (_bc.children && _bc.children.length) {
					_b9(_bc.children);
				} else {
					var _bd = _b8(_bc);
					_bd.find(".tree-icon").prev().addClass("tree-join");
				}
			});
			if (_bb.length) {
				var _be = _b8(_bb[_bb.length - 1]);
				_be.addClass("tree-node-last");
				_be.find(".tree-join").removeClass("tree-join").addClass("tree-joinbottom");
			}
		};
		function _ba(_bf) {
			$.map(_bf, function (_c0) {
				if (_c0.children && _c0.children.length) {
					_ba(_c0.children);
				}
			});
			for (var i = 0; i < _bf.length - 1; i++) {
				var _c1 = _bf[i];
				var _c2 = t.treegrid("getLevel", _c1[_b6.idField]);
				var tr = _b6.finder.getTr(_b5, _c1[_b6.idField]);
				var cc = tr.next().find("tr.datagrid-row td[field=\"" + _b6.treeField + "\"] div.datagrid-cell");
				cc.find("span:eq(" + (_c2 - 1) + ")").addClass("tree-line");
			}
		};
		function _b8(_c3) {
			var tr = _b6.finder.getTr(_b5, _c3[_b6.idField]);
			var _c4 = tr.find("td[field=\"" + _b6.treeField + "\"] div.datagrid-cell");
			return _c4;
		};
	};
	$.fn.treegrid = function (_c5, _c6) {
		if (typeof _c5 == "string") {
			var _c7 = $.fn.treegrid.methods[_c5];
			if (_c7) {
				return _c7(this, _c6);
			} else {
				return this.datagrid(_c5, _c6);
			}
		}
		_c5 = _c5 || {};
		return this.each(function () {
			var _c8 = $.data(this, "treegrid");
			if (_c8) {
				$.extend(_c8.options, _c5);
			} else {
				_c8 = $.data(this, "treegrid", {
						options : $.extend({}, $.fn.treegrid.defaults, $.fn.treegrid.parseOptions(this), _c5),
						data : [],
						checkedRows : [],
						tmpIds : []
					});
			}
			_1(this);
			/*wanghc---rowEvent*/
			//var dc=_99.dc;
			var bb = $(_c8.dc.body2);
			//bb.unbind();
			for(var _7b in _c8.options.rowEvents){
				bb.bind(_7b,_c8.options.rowEvents[_7b]);
			}
			if (_c8.options.data) {
				$(this).treegrid("loadData", _c8.options.data);
			}
			_15(this);
		});
	};
	$.fn.treegrid.methods = {
		options : function (jq) {
			return $.data(jq[0], "treegrid").options;
		},
		resize : function (jq, _c9) {
			return jq.each(function () {
				$(this).datagrid("resize", _c9);
			});
		},
		fixRowHeight : function (jq, _ca) {
			return jq.each(function () {
				_16(this, _ca);
			});
		},
		loadData : function (jq, _cb) {
			return jq.each(function () {
				_4f(this, _cb.parent, _cb);
			});
		},
		load : function (jq, _cc) {
			return jq.each(function () {
				$(this).treegrid("options").pageNumber = 1;
				$(this).treegrid("getPager").pagination({
					pageNumber : 1
				});
				$(this).treegrid("reload", _cc);
			});
		},
		reload : function (jq, id) {
			return jq.each(function () {
				var _cd = $(this).treegrid("options");
				var _ce = {};
				if (typeof id == "object") {
					_ce = id;
				} else {
					_ce = $.extend({}, _cd.queryParams);
					_ce.id = id;
				}
				if (_ce.id) {
					var _cf = $(this).treegrid("find", _ce.id);
					if (_cf.children) {
						_cf.children.splice(0, _cf.children.length);
					}
					_cd.queryParams = _ce;
                    var tr = _cd.finder.getTr(this, _ce.id);
                    //cryze 2018-4-23 reload走这里删除下面所有节点元素 checkedRows没清
                    syncCheckedRows(this,tr.next("tr.treegrid-tr-tree"));
                    tr.next("tr.treegrid-tr-tree").remove();
                    
					tr.find("span.tree-hit").removeClass("tree-expanded tree-expanded-hover").addClass("tree-collapsed");
					_83(this, _ce.id);
				} else {
					_15(this, null, _ce);
				}
			});
		},
		reloadFooter : function (jq, _d0) {
			return jq.each(function () {
				var _d1 = $.data(this, "treegrid").options;
				var dc = $.data(this, "datagrid").dc;
				if (_d0) {
					$.data(this, "treegrid").footer = _d0;
				}
				if (_d1.showFooter) {
					_d1.view.renderFooter.call(_d1.view, this, dc.footer1, true);
					_d1.view.renderFooter.call(_d1.view, this, dc.footer2, false);
					if (_d1.view.onAfterRender) {
						_d1.view.onAfterRender.call(_d1.view, this);
					}
					$(this).treegrid("fixRowHeight");
				}
			});
		},
		getData : function (jq) {
			return $.data(jq[0], "treegrid").data;
		},
		getFooterRows : function (jq) {
			return $.data(jq[0], "treegrid").footer;
		},
		getRoot : function (jq) {
			return _67(jq[0]);
		},
		getRoots : function (jq) {
			return _6a(jq[0]);
		},
		getParent : function (jq, id) {
			return _3f(jq[0], id);
		},
		getChildren : function (jq, id) {
			return _1b(jq[0], id);
		},
		getLevel : function (jq, id) {
			return _74(jq[0], id);
		},
		find : function (jq, id) {
			return _30(jq[0], id);
		},
		isLeaf : function (jq, id) {
			var _d2 = $.data(jq[0], "treegrid").options;
			var tr = _d2.finder.getTr(jq[0], id);
			var hit = tr.find("span.tree-hit");
			return hit.length == 0;
		},
		select : function (jq, id) {
			return jq.each(function () {
				$(this).datagrid("selectRow", id);
			});
		},
		unselect : function (jq, id) {
			return jq.each(function () {
				$(this).datagrid("unselectRow", id);
			});
		},
		collapse : function (jq, id) {
			return jq.each(function () {
				_7f(this, id);
			});
		},
		expand : function (jq, id) {
			return jq.each(function () {
				_83(this, id);
			});
		},
		toggle : function (jq, id) {
			return jq.each(function () {
				_26(this, id);
			});
		},
		collapseAll : function (jq, id) {
			return jq.each(function () {
				_8d(this, id);
			});
		},
		expandAll : function (jq, id) {
			return jq.each(function () {
				_92(this, id);
			});
		},
		expandTo : function (jq, id) {
			return jq.each(function () {
				_97(this, id);
			});
		},
		append : function (jq, _d3) {
			return jq.each(function () {
				_9b(this, _d3);
			});
		},
		insert : function (jq, _d4) {
			return jq.each(function () {
				_a2(this, _d4);
			});
		},
		remove : function (jq, id) {
			return jq.each(function () {
				_ae(this, id);
			});
		},
		pop : function (jq, id) {
			var row = jq.treegrid("find", id);
			jq.treegrid("remove", id);
			return row;
		},
		refresh : function (jq, id) {
			return jq.each(function () {
				var _d5 = $.data(this, "treegrid").options;
				_d5.view.refreshRow.call(_d5.view, this, id);
			});
		},
		update : function (jq, _d6) {
			return jq.each(function () {
				var _d7 = $.data(this, "treegrid").options;
				var row = _d6.row;
				_d7.view.updateRow.call(_d7.view, this, _d6.id, row);
				if (row.checked != undefined) {
					row = _30(this, _d6.id);
					$.extend(row, {
						checkState : row.checked ? "checked" : (row.checked === false ? "unchecked" : undefined)
					});
					_42(this, _d6.id);
				}
			});
		},
		beginEdit : function (jq, id) {
			return jq.each(function () {
				$(this).datagrid("beginEdit", id);
				$(this).treegrid("fixRowHeight", id);
			});
		},
		endEdit : function (jq, id) {
			return jq.each(function () {
				$(this).datagrid("endEdit", id);
			});
		},
		cancelEdit : function (jq, id) {
			return jq.each(function () {
				$(this).datagrid("cancelEdit", id);
			});
		},
		showLines : function (jq) {
			return jq.each(function () {
				_b4(this);
			});
		},
		setSelectionState : function (jq) {
			return jq.each(function () {
				$(this).datagrid("setSelectionState");
				var _d8 = $(this).data("treegrid");
				for (var i = 0; i < _d8.tmpIds.length; i++) {
					_27(this, _d8.tmpIds[i], true, true);
				}
				_d8.tmpIds = [];
			});
		},
		getCheckedNodes : function (jq, _d9) {
			_d9 = _d9 || "checked";
			var _da = [];
			$.hisui.forEach(jq.data("treegrid").checkedRows, false, function (row) {
				if (row.checkState == _d9) {
					_da.push(row);
				}
			});
			return _da;
		},
		checkNode : function (jq, id) {
			return jq.each(function () {
				_27(this, id, true);
			});
		},
		uncheckNode : function (jq, id) {
			return jq.each(function () {
				_27(this, id, false);
			});
		},
		clearChecked : function (jq) {
			return jq.each(function () {
				var _db = this;
				var _dc = $(_db).treegrid("options");
				$(_db).datagrid("clearChecked");
				$.map($(_db).treegrid("getCheckedNodes"), function (row) {
					_27(_db, row[_dc.idField], false, true);
				});
			});
		}
	};
	$.fn.treegrid.parseOptions = function (_dd) {
		return $.extend({}, $.fn.datagrid.parseOptions(_dd), $.parser.parseOptions(_dd, ["treeField", {
						checkbox : "boolean",
						cascadeCheck : "boolean",
						onlyLeafCheck : "boolean"
					}, {
						animate : "boolean"
					}
				]));
	};
	var _de = $.extend({}, $.fn.datagrid.defaults.view, {
			/**wanghc 1.5version datagrid.js-method**/
			getStyleValue : function (css) {
				var _225 = "";
				var _226 = "";
				if (typeof css == "string") {
					_226 = css;
				} else {
					if (css) {
						_225 = css["class"] || "";
						_226 = css["style"] || "";
					}
				}
				return {
					c : _225,
					s : _226
				};
			},
			render : function (_df, _e0, _e1) {
				var _e2 = $.data(_df, "treegrid").options;
				var _e3 = $(_df).datagrid("getColumnFields", _e1);
				var _e4 = $.data(_df, "datagrid").rowIdPrefix;
				if (_e1) {
					if (!(_e2.rownumbers || (_e2.frozenColumns && _e2.frozenColumns.length))) {
						return;
					}
				}
				var _e5 = this;
				if (this.treeNodes && this.treeNodes.length) {
					var _e6 = _e7.call(this, _e1, this.treeLevel, this.treeNodes);
					$(_e0).append(_e6.join(""));
				}
				function _e7(_e8, _e9, _ea) {
					var _eb = $(_df).treegrid("getParent", _ea[0][_e2.idField]);
					var _ec = (_eb ? _eb.children.length : $(_df).treegrid("getRoots").length) - _ea.length;
					var _ed = ["<table class=\"datagrid-btable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>"];
					for (var i = 0; i < _ea.length; i++) {
						var row = _ea[i];
						if (row.state != "open" && row.state != "closed") {
							row.state = "open";
						}
						var css = _e2.rowStyler ? _e2.rowStyler.call(_df, row) : "";
						var cs = this.getStyleValue(css);
						var cls = "class=\"datagrid-row " + (_ec++ % 2 && _e2.striped ? "datagrid-row-alt " : " ") + cs.c + "\"";
						var _ee = cs.s ? "style=\"" + cs.s + "\"" : "";
						var _ef = _e4 + "-" + (_e8 ? 1 : 2) + "-" + row[_e2.idField];
						_ed.push("<tr id=\"" + _ef + "\" node-id=\"" + row[_e2.idField] + "\" " + cls + " " + _ee + ">");
						_ed = _ed.concat(_e5.renderRow.call(_e5, _df, _e3, _e8, _e9, row));
						_ed.push("</tr>");
						if (row.children && row.children.length) {
							var tt = _e7.call(this, _e8, _e9 + 1, row.children);
							var v = row.state == "closed" ? "none" : "block";
							_ed.push("<tr class=\"treegrid-tr-tree\"><td style=\"border:0px\" colspan=" + (_e3.length + (_e2.rownumbers ? 1 : 0)) + "><div style=\"display:" + v + "\">");
							_ed = _ed.concat(tt);
							_ed.push("</div></td></tr>");
						}
					}
					_ed.push("</tbody></table>");
					return _ed;
				};
			},
			renderFooter : function (_f0, _f1, _f2) {
				var _f3 = $.data(_f0, "treegrid").options;
				var _f4 = $.data(_f0, "treegrid").footer || [];
				var _f5 = $(_f0).datagrid("getColumnFields", _f2);
				var _f6 = ["<table class=\"datagrid-ftable\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\"><tbody>"];
				for (var i = 0; i < _f4.length; i++) {
					var row = _f4[i];
					row[_f3.idField] = row[_f3.idField] || ("foot-row-id" + i);
					_f6.push("<tr class=\"datagrid-row\" node-id=\"" + row[_f3.idField] + "\">");
					_f6.push(this.renderRow.call(this, _f0, _f5, _f2, 0, row));
					_f6.push("</tr>");
				}
				_f6.push("</tbody></table>");
				$(_f1).html(_f6.join(""));
			},
			renderRow : function (_f7, _f8, _f9, _fa, row) {
				var _fb = $.data(_f7, "treegrid");
				var _fc = _fb.options;
				var cc = [];
				if (_f9 && _fc.rownumbers) {
					cc.push("<td class=\"datagrid-td-rownumber\"><div class=\"datagrid-cell-rownumber\">0</div></td>");
				}
				for (var i = 0; i < _f8.length; i++) {
					var _fd = _f8[i];
					var col = $(_f7).datagrid("getColumnOption", _fd);
					if (col) {
						var css = col.styler ? (col.styler(row[_fd], row) || "") : "";
						var cs = this.getStyleValue(css);
						var cls = cs.c ? "class=\"" + cs.c + "\"" : "";
						var _fe = col.hidden ? "style=\"display:none;" + cs.s + "\"" : (cs.s ? "style=\"" + cs.s + "\"" : "");
						cc.push("<td field=\"" + _fd + "\" " + cls + " " + _fe + ">");
						var _fe = "";
						if (!col.checkbox) {
							if (col.align) {
								_fe += "text-align:" + col.align + ";";
							}
							if (!_fc.nowrap) {
								_fe += "white-space:normal;height:auto;";
							} else {
								if (_fc.autoRowHeight) {
									_fe += "height:auto;";
								}
							}
						}
						cc.push("<div style=\"" + _fe + "\" ");
						if (col.checkbox) {
							cc.push("class=\"datagrid-cell-check ");
						} else {
							cc.push("class=\"datagrid-cell " + col.cellClass);
						}
						cc.push("\">");
						if (col.checkbox) {
							if (row.checked) {
								cc.push("<input type=\"checkbox\" checked=\"checked\"");
							} else {
								cc.push("<input type=\"checkbox\"");
							}
							cc.push(" name=\"" + _fd + "\" value=\"" + (row[_fd] != undefined ? row[_fd] : "") + "\">");
						} else {
							var val = null;
							if (col.formatter) {
								val = col.formatter(row[_fd], row);
							} else {
								val = row[_fd];
							}
							if (_fd == _fc.treeField) {
								for (var j = 0; j < _fa; j++) {
									cc.push("<span class=\"tree-indent\"></span>");
								}
								if (row.state == "closed") {
									cc.push("<span class=\"tree-hit tree-collapsed\"></span>");
									cc.push("<span class=\"tree-icon tree-folder " + (row.iconCls ? row.iconCls : "") + "\"></span>");
								} else {
									if (row.children && row.children.length) {
										cc.push("<span class=\"tree-hit tree-expanded\"></span>");
										cc.push("<span class=\"tree-icon tree-folder tree-folder-open " + (row.iconCls ? row.iconCls : "") + "\"></span>");
									} else {
										cc.push("<span class=\"tree-indent\"></span>");
										cc.push("<span class=\"tree-icon tree-file " + (row.iconCls ? row.iconCls : "") + "\"></span>");
									}
								}
								if (this.hasCheckbox(_f7, row)) {
									var _ff = 0;
									var crow = $.hisui.getArrayItem(_fb.checkedRows, _fc.idField, row[_fc.idField]);
									if (crow) {
                                        _ff = crow.checkState == "checked" ? 1 : 2;
                                        //cryze 2018-4-23 没对 row.checkState赋值，导致后续再点击切换不了状态 
                                        row.checkState=crow.checkState;
									} else {
										var prow = $.hisui.getArrayItem(_fb.checkedRows, _fc.idField, row._parentId);
										if (prow && prow.checkState == "checked" && _fc.cascadeCheck) {
											_ff = 1;
											row.checked = true;
											$.hisui.addArrayItem(_fb.checkedRows, _fc.idField, row);
										} else {
											if (row.checked) {
												$.hisui.addArrayItem(_fb.tmpIds, row[_fc.idField]);
											}
										}
										row.checkState = _ff ? "checked" : "unchecked";
									}
									cc.push("<span class=\"tree-checkbox tree-checkbox" + _ff + "\"></span>");
								} else {
									row.checkState = undefined;
									row.checked = undefined;
								}
								cc.push("<span class=\"tree-title\">" + val + "</span>");
							} else {
								cc.push(val);
							}
						}
						cc.push("</div>");
						cc.push("</td>");
					}
				}
				return cc.join("");
			},
			hasCheckbox : function (_100, row) {
				var opts = $.data(_100, "treegrid").options;
				if (opts.checkbox) {
					if ($.isFunction(opts.checkbox)) {
						if (opts.checkbox.call(_100, row)) {
							return true;
						} else {
							return false;
						}
					} else {
						if (opts.onlyLeafCheck) {
							if (row.state == "open" && !(row.children && row.children.length)) {
								return true;
							}
						} else {
							return true;
						}
					}
				}
				return false;
			},
			refreshRow : function (_101, id) {
				this.updateRow.call(this, _101, id, {});
			},
			updateRow : function (_102, id, row) {
				var opts = $.data(_102, "treegrid").options;
				var _103 = $(_102).treegrid("find", id);
				$.extend(_103, row);
				var _104 = $(_102).treegrid("getLevel", id) - 1;
				var _105 = opts.rowStyler ? opts.rowStyler.call(_102, _103) : "";
				var _106 = $.data(_102, "datagrid").rowIdPrefix;
				var _107 = _103[opts.idField];
				function _108(_109) {
					var _10a = $(_102).treegrid("getColumnFields", _109);
					var tr = opts.finder.getTr(_102, id, "body", (_109 ? 1 : 2));
					var _10b = tr.find("div.datagrid-cell-rownumber").html();
					var _10c = tr.find("div.datagrid-cell-check input[type=checkbox]").is(":checked");
					tr.html(this.renderRow(_102, _10a, _109, _104, _103));
					tr.attr("style", _105 || "");
					tr.find("div.datagrid-cell-rownumber").html(_10b);
					if (_10c) {
						tr.find("div.datagrid-cell-check input[type=checkbox]")._propAttr("checked", true);
					}
					if (_107 != id) {
						tr.attr("id", _106 + "-" + (_109 ? 1 : 2) + "-" + _107);
						tr.attr("node-id", _107);
					}
				};
				_108.call(this, true);
				_108.call(this, false);
				$(_102).treegrid("fixRowHeight", id);
			},
			deleteRow : function (_10d, id) {
				var opts = $.data(_10d, "treegrid").options;
				var tr = opts.finder.getTr(_10d, id);
				tr.next("tr.treegrid-tr-tree").remove();
				tr.remove();
				var _10e = del(id);
				if (_10e) {
					if (_10e.children.length == 0) {
						tr = opts.finder.getTr(_10d, _10e[opts.idField]);
						tr.next("tr.treegrid-tr-tree").remove();
						var cell = tr.children("td[field=\"" + opts.treeField + "\"]").children("div.datagrid-cell");
						cell.find(".tree-icon").removeClass("tree-folder").addClass("tree-file");
						cell.find(".tree-hit").remove();
						$("<span class=\"tree-indent\"></span>").prependTo(cell);
					}
				}
				//this.setEmptyMsg(_10d);   //cryze 2018-3-26 1.3.6还没有setEmptyMsg 
				function del(id) {
					var cc;
					var _10f = $(_10d).treegrid("getParent", id);
					if (_10f) {
						cc = _10f.children;
					} else {
						cc = $(_10d).treegrid("getData");
					}
					for (var i = 0; i < cc.length; i++) {
						if (cc[i][opts.idField] == id) {
							cc.splice(i, 1);
							break;
						}
					}
					return _10f;
				};
			},
			onBeforeRender : function (_110, _111, data) {
				if ($.isArray(_111)) {
					data = {
						total : _111.length,
						rows : _111
					};
					_111 = null;
				}
				if (!data) {
					return false;
				}
				var _112 = $.data(_110, "treegrid");
				var opts = _112.options;
				if (data.length == undefined) {
					if (data.footer) {
						_112.footer = data.footer;
					}
					if (data.total) {
						_112.total = data.total;
					}
					data = this.transfer(_110, _111, data.rows);
				} else {
					function _113(_114, _115) {
						for (var i = 0; i < _114.length; i++) {
							var row = _114[i];
							row._parentId = _115;
							if (row.children && row.children.length) {
								_113(row.children, row[opts.idField]);
							}
						}
					};
					_113(data, _111);
				}
				var node = _30(_110, _111);
				if (node) {
					if (node.children) {
						node.children = node.children.concat(data);
					} else {
						node.children = data;
					}
				} else {
					_112.data = _112.data.concat(data);
				}
				this.sort(_110, data);
				this.treeNodes = data;
				this.treeLevel = $(_110).treegrid("getLevel", _111);
			},
			sort : function (_116, data) {
				var opts = $.data(_116, "treegrid").options;
				if (!opts.remoteSort && opts.sortName) {
					var _117 = opts.sortName.split(",");
					var _118 = opts.sortOrder.split(",");
					_119(data);
				}
				function _119(rows) {
					rows.sort(function (r1, r2) {
						var r = 0;
						for (var i = 0; i < _117.length; i++) {
							var sn = _117[i];
							var so = _118[i];
							var col = $(_116).treegrid("getColumnOption", sn);
							var _11a = col.sorter || function (a, b) {
								return a == b ? 0 : (a > b ? 1 : -1);
							};
							r = _11a(r1[sn], r2[sn]) * (so == "asc" ? 1 : -1);
							if (r != 0) {
								return r;
							}
						}
						return r;
					});
					for (var i = 0; i < rows.length; i++) {
						var _11b = rows[i].children;
						if (_11b && _11b.length) {
							_119(_11b);
						}
					}
				};
			},
			transfer : function (_11c, _11d, data) {
				var opts = $.data(_11c, "treegrid").options;
				var rows = $.extend([], data);
				var _11e = _11f(_11d, rows);
				var toDo = $.extend([], _11e);
				while (toDo.length) {
					var node = toDo.shift();
					var _120 = _11f(node[opts.idField], rows);
					if (_120.length) {
						if (node.children) {
							node.children = node.children.concat(_120);
						} else {
							node.children = _120;
						}
						toDo = toDo.concat(_120);
					}
				}
				return _11e;
				function _11f(_121, rows) {
					var rr = [];
					for (var i = 0; i < rows.length; i++) {
						var row = rows[i];
						if (row._parentId == _121 || isEqual(row._parentId,_121)) { //cryze _parentId="" 当做根节点 2018-4-18
							rr.push(row);
							rows.splice(i, 1);
							i--;
						}
					}
					return rr;
                };
                //cryze _parentId="" 当做根节点 2018-4-18
                function isEqual(a,b){
                    return (typeof a=="undefined" || a==null || a=="")&&(typeof b=="undefined" || b==null);
                }
			}
		});
	$.fn.treegrid.defaults = $.extend({}, $.fn.datagrid.defaults, {
			treeField : null,
			checkbox : false,
			cascadeCheck : true,
			onlyLeafCheck : false,
			lines : false,
			animate : false,
			singleSelect : true,
			view : _de,
			rowEvents : $.extend({}, $.fn.datagrid.defaults.rowEvents, {
				mouseover : _22(true),
				mouseout : _22(false),
				click : _24
			}),
			loader : function (_122, _123, _124) {
				var opts = $(this).treegrid("options");
				if (!opts.url) {
					return false;
				}
				$.ajax({
					type : opts.method,
					url : opts.url,
					data : _122,
					dataType : "json",
					success : function (data) {
						_123(data);
					},
					error : function () {
						_124.apply(this, arguments);
					}
				});
			},
			loadFilter : function (data, _125) {
				return data;
			},
			finder : {
				getTr : function (_126, id, type, _127) {
					type = type || "body";
					_127 = _127 || 0;
					var dc = $.data(_126, "datagrid").dc;
					if (_127 == 0) {
						var opts = $.data(_126, "treegrid").options;
						var tr1 = opts.finder.getTr(_126, id, type, 1);
						var tr2 = opts.finder.getTr(_126, id, type, 2);
						return tr1.add(tr2);
					} else {
						if (type == "body") {
							var tr = $("#" + $.data(_126, "datagrid").rowIdPrefix + "-" + _127 + "-" + id);
							if (!tr.length) {
								tr = (_127 == 1 ? dc.body1 : dc.body2).find("tr[node-id=\"" + id + "\"]");
							}
							return tr;
						} else {
							if (type == "footer") {
								return (_127 == 1 ? dc.footer1 : dc.footer2).find("tr[node-id=\"" + id + "\"]");
							} else {
								if (type == "selected") {
									return (_127 == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-selected");
								} else {
									if (type == "highlight") {
										return (_127 == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-over");
									} else {
										if (type == "checked") {
											return (_127 == 1 ? dc.body1 : dc.body2).find("tr.datagrid-row-checked");
										} else {
											if (type == "last") {
												return (_127 == 1 ? dc.body1 : dc.body2).find("tr:last[node-id]");
											} else {
												if (type == "allbody") {
													return (_127 == 1 ? dc.body1 : dc.body2).find("tr[node-id]");
												} else {
													if (type == "allfooter") {
														return (_127 == 1 ? dc.footer1 : dc.footer2).find("tr[node-id]");
													}
												}
											}
										}
									}
								}
							}
						}
					}
				},
				getRow : function (_128, p) {
					var id = (typeof p == "object") ? p.attr("node-id") : p;
					return $(_128).treegrid("find", id);
				},
				getRows : function (_129) {
					return $(_129).treegrid("getChildren");
				}
			},
			onBeforeLoad : function (row, _12a) {},
			onLoadSuccess : function (row, data) {},
			onLoadError : function () {},
			onBeforeCollapse : function (row) {},
			onCollapse : function (row) {},
			onBeforeExpand : function (row) {},
			onExpand : function (row) {},
			onClickRow : function (row) {},
			onDblClickRow : function (row) {},
			onClickCell : function (_12b, row) {},
			onDblClickCell : function (_12c, row) {},
			onContextMenu : function (e, row) {},
			onBeforeEdit : function (row) {},
			onAfterEdit : function (row, _12d) {},
			onCancelEdit : function (row) {},
			onBeforeCheckNode : function (row, _12e) {},
			onCheckNode : function (row, _12f) {}
		});
})(jQuery);

/*treegrid1.5-- end**/
(function ($) {
    function _83e(_83f, _840) {
        var _841 = $.data(_83f, "combo");
        var opts = _841.options;
        var _842 = _841.combo;
        var _843 = _841.panel;
        if (_840) {
            opts.width = _840;
        }
        if (isNaN(opts.width)) {
            var c = $(_83f).clone();
            c.css("visibility", "hidden");
            c.appendTo("body");
            opts.width = c.outerWidth();
            c.remove();
        }
        _842.appendTo("body");
        var _844 = _842.find("input.combo-text");
        var _845 = _842.find(".combo-arrow");
        var _846 = opts.hasDownArrow ? _845._outerWidth() : 0;
        _842._outerWidth(opts.width)._outerHeight(opts.height);
        _844._outerWidth(_842.width() - _846);
        _844.css({ height: _842.height() + "px", lineHeight: _842.height() + "px" });
        
        _845._outerHeight(_842.height());
        _843.panel("resize", { width: (opts.panelWidth ? opts.panelWidth : _842.outerWidth()), height: opts.panelHeight });
        _842.insertAfter(_83f);
    };
    function init(_847) {
        $(_847).addClass("combo-f").hide();
        var span = $("<span class=\"combo\">" + "<input type=\"text\" class=\"combo-text\" autocomplete=\"off\">" + "<span><span class=\"combo-arrow\"></span></span>" + "<input type=\"hidden\" class=\"combo-value\">" + "</span>").insertAfter(_847);
        var _848 = $("<div class=\"combo-panel\"></div>").appendTo("body");
        _848.panel({
            doSize: false, closed: true, cls: "combo-p", style: { position: "absolute", zIndex: 10 }, onOpen: function () {
                var p = $(this).panel("panel");
                if ($.fn.menu) {
                    p.css("z-index", $.fn.menu.defaults.zIndex++);
                } else {
                    if ($.fn.window) {
                        p.css("z-index", $.fn.window.defaults.zIndex++);
                    }
                }
                $(this).panel("resize");
            }, onBeforeClose: function () {
                _854(this);
            }, onClose: function () {
                var _849 = $.data(_847, "combo");
                if (_849) {
                    _849.options.onHidePanel.call(_847);
                }
            }
        });
        var name = $(_847).attr("name");
        if (name) {
            span.find("input.combo-value").attr("name", name);
            $(_847).removeAttr("name").attr("comboName", name);
        }
        return { combo: span, panel: _848 };
    };
    function _84a(_84b) {
        var _84c = $.data(_84b, "combo");
        var opts = _84c.options;
        var _84d = _84c.combo;
        if (opts.hasDownArrow) {
            _84d.find(".combo-arrow").show();
        } else {
            _84d.find(".combo-arrow").hide();
        }
        _84e(_84b, opts.disabled);
        _84f(_84b, opts.readonly);
    };
    function _850(_851) {
        var _852 = $.data(_851, "combo");
        var _853 = _852.combo.find("input.combo-text");
        _853.validatebox("destroy");
        _852.panel.panel("destroy");
        _852.combo.remove();
        $(_851).remove();
    };
    function _854(_855) {
        $(_855).find(".combo-f").each(function () {
            var p = $(this).combo("panel");
            if (p.is(":visible")) {
                p.panel("close");
            }
        });
    };
    function _856(_857) {
        var _858 = $.data(_857, "combo");
        var opts = _858.options;
        var _859 = _858.panel;
        var _85a = _858.combo;
        var _85b = _85a.find(".combo-text");
        var _85c = _85a.find(".combo-arrow");
        $(document).unbind(".combo").bind("mousedown.combo", function (e) {
            var p = $(e.target).closest("span.combo,div.combo-p");
            if (p.length) {
                _854(p);
                return;
            }
            $("body>div.combo-p>div.combo-panel:visible").panel("close");
        });
        _85b.unbind(".combo");
        _85c.unbind(".combo");
        if (!opts.disabled && !opts.readonly) {
            _85b.bind("click.combo", function (e) {
                if (!opts.editable) {
                    _85d.call(this);
                } else {
                    var p = $(this).closest("div.combo-panel");
                    $("div.combo-panel:visible").not(_859).not(p).panel("close");
                }
            }).bind("keydown.combo paste.combo drop.combo input.combo", function (e) {
                // input.combo在IE下,设置值时触发,造成进入有下拉框界面就弹出下拉panel,2018-10-17 增加return
                if ("undefined" ==typeof e.keyCode){return ;}
                //  wanghc 2018-10-08 add bind("input.combo")--firefox下在汉字输入汉字不能即时查询增加input.combo
                switch (e.keyCode) {
                    case 38:
                        opts.keyHandler.up.call(_857, e);
                        break;
                    case 40:
                        opts.keyHandler.down.call(_857, e);
                        break;
                    case 37:
                        opts.keyHandler.left.call(_857, e);
                        break;
                    case 39:
                        opts.keyHandler.right.call(_857, e);
                        break;
                    case 13:
                        e.preventDefault();
                        opts.keyHandler.enter.call(_857, e);
                        return false;
                    case 9:
                    case 27:
                        _85e(_857);
                        break;
                    default:
                        if (opts.editable) {
                            if (_858.timer) {
                                clearTimeout(_858.timer);
                            }
                            _858.timer = setTimeout(function () {
                                var q = _85b.val();
                                if (_858.previousValue != q) {
                                    _858.previousValue = q;
                                    $(_857).combo("showPanel");
                                    opts.keyHandler.query.call(_857, _85b.val(), e);
                                    $(_857).combo("validate");
                                    //cryze 输入字符 查询过 queryOnFirstArrowDown置为false
                                    opts.queryOnFirstArrowDown=false;
                                }
                            }, opts.delay);
                        }
                }
            });
            _85c.bind("click.combo", function () {
                _85d.call(this);
            }).bind("mouseenter.combo", function () {
                $(this).addClass("combo-arrow-hover");
            }).bind("mouseleave.combo", function () {
                $(this).removeClass("combo-arrow-hover");
            });
        }
        function _85d() {    //cryze  combo 下拉按钮点击事件处理程序
            if (_859.is(":visible")) {
                _85e(_857);
            } else {
                var p = $(this).closest("div.combo-panel");
                $("div.combo-panel:visible").not(_859).not(p).panel("close");
                $(_857).combo("showPanel");
                //cryze  queryOnFirstArrowDown 第一次点击下拉按钮触发查询  并把此标志置为false;
                if (opts.queryOnFirstArrowDown){
                    opts.keyHandler.query.call(_857, _85b.val());
                    opts.queryOnFirstArrowDown=false;
                    $(_857).combo("validate");
                }
            }
            _85b.focus();
        };
    };
    function _85f(_860) {
        var _861 = $.data(_860, "combo");
        var opts = _861.options;
        var _862 = _861.combo;
        var _863 = _861.panel;
        _863.panel("move", { left: _864(), top: _865() });
        if (_863.panel("options").closed) {
            _863.panel("open");
            opts.onShowPanel.call(_860);
        }
        (function () {
            if (_863.is(":visible")) {
                _863.panel("move", { left: _864(), top: _865() });
                setTimeout(arguments.callee, 200);
            }
        })();
        function _864() {
            var left = _862.offset().left;
            if (opts.panelAlign == "right") {
                left += _862._outerWidth() - _863._outerWidth();
            }
            if (left + _863._outerWidth() > $(window)._outerWidth() + $(document).scrollLeft()) {
                left = $(window)._outerWidth() + $(document).scrollLeft() - _863._outerWidth();
            }
            if (left < 0) {
                left = 0;
            }
            return left;
        };
        function _865() {
            var top = _862.offset().top + _862._outerHeight() - 1; //默认向下显示 20190711-1减少1px接逢线
            if (top + _863._outerHeight() > $(window)._outerHeight() + $(document).scrollTop()) {
                top = _862.offset().top - _863._outerHeight() + 1 ; //在上面显示 20190711+1减少1px接逢线
            }
            if (top < $(document).scrollTop()) {
                top = _862.offset().top + _862._outerHeight() - 1; //向下显示 20190711-1减少1px接逢线
            }
            return top;
        };
    };
    function _85e(_866) {
        var _867 = $.data(_866, "combo").panel;
        _867.panel("close");
    };
    function _868(_869) {
        var opts = $.data(_869, "combo").options;
        var _86a = $(_869).combo("textbox");
        _86a.validatebox($.extend({}, opts, { deltaX: (opts.hasDownArrow ? opts.deltaX : (opts.deltaX > 0 ? 1 : -1)) }));
    };
    function _84e(_86b, _86c) {
        var _86d = $.data(_86b, "combo");
        var opts = _86d.options;
        var _86e = _86d.combo;
        //debugger;  //cryze  combo 禁用启用在这控制 _86e为span.combo jq对象 为其增肌或移除 disabled类
        if (_86c) {
            opts.disabled = true;
            $(_86b).attr("disabled", true);
            _86e.find(".combo-value").attr("disabled", true);
            _86e.find(".combo-text").attr("disabled", true);
            _86e.addClass('disabled');
        } else {
            opts.disabled = false;
            $(_86b).removeAttr("disabled");
            _86e.find(".combo-value").removeAttr("disabled");
            _86e.find(".combo-text").removeAttr("disabled");
            _86e.removeClass('disabled');
        }
    };
    function _84f(_86f, mode) {
        var _870 = $.data(_86f, "combo");
        var opts = _870.options;
        opts.readonly = mode == undefined ? true : mode;
        var _871 = opts.readonly ? true : (!opts.editable);
        _870.combo.find(".combo-text").attr("readonly", _871).css("cursor", _871 ? "pointer" : "");
    };
    function _872(_873) {
        var _874 = $.data(_873, "combo");
        var opts = _874.options;
        var _875 = _874.combo;
        if (opts.multiple) {
            _875.find("input.combo-value").remove();
        } else {
            _875.find("input.combo-value").val("");
        }
        _875.find("input.combo-text").val("");
    };
    function _876(_877) {
        var _878 = $.data(_877, "combo").combo;
        return _878.find("input.combo-text").val();
    };
    function _879(_87a, text) {
        var _87b = $.data(_87a, "combo");
        var _87c = _87b.combo.find("input.combo-text");
        if (_87c.val() != text) {
            _87c.val(text);
            $(_87a).combo("validate");
            _87b.previousValue = text;
        }
    };
    function _87d(_87e) {
        var _87f = [];
        var _880 = $.data(_87e, "combo").combo;
        _880.find("input.combo-value").each(function () {
            _87f.push($(this).val());
        });
        return _87f;
    };
    function _881(_882, _883) {
        var opts = $.data(_882, "combo").options;
        var _884 = _87d(_882);
        var _885 = $.data(_882, "combo").combo;
        _885.find("input.combo-value").remove();
        var name = $(_882).attr("comboName");
        for (var i = 0; i < _883.length; i++) {
            var _886 = $("<input type=\"hidden\" class=\"combo-value\">").appendTo(_885);
            if (name) {
                _886.attr("name", name);
            }
            _886.val(_883[i]);
        }
        var tmp = [];
        for (var i = 0; i < _884.length; i++) {
            tmp[i] = _884[i];
        }
        var aa = [];
        for (var i = 0; i < _883.length; i++) {
            for (var j = 0; j < tmp.length; j++) {
                if (_883[i] == tmp[j]) {
                    aa.push(_883[i]);
                    tmp.splice(j, 1);
                    break;
                }
            }
        }
        if (aa.length != _883.length || _883.length != _884.length) {
            if (opts.multiple) {
                opts.onChange.call(_882, _883, _884);
            } else {
                opts.onChange.call(_882, _883[0], _884[0]);
            }
        }
    };
    function _887(_888) {
        var _889 = _87d(_888);
        return _889[0];
    };
    function _88a(_88b, _88c) {
        _881(_88b, [_88c]);
    };
    function _88d(_88e) {
        var opts = $.data(_88e, "combo").options;
        var fn = opts.onChange;
        opts.onChange = function () {
        };
        if (opts.multiple) {
            if (opts.value) {
                if (typeof opts.value == "object") {
                    _881(_88e, opts.value);
                } else {
                    _88a(_88e, opts.value);
                }
            } else {
                _881(_88e, []);
            }
            opts.originalValue = _87d(_88e);
        } else {
            _88a(_88e, opts.value);
            opts.originalValue = opts.value;
        }
        opts.onChange = fn;
    };
    $.fn.combo = function (_88f, _890) {
        if (typeof _88f == "string") {
            var _891 = $.fn.combo.methods[_88f];
            if (_891) {
                return _891(this, _890);
            } else {
                return this.each(function () {
                    var _892 = $(this).combo("textbox");
                    _892.validatebox(_88f, _890);
                });
            }
        }
        _88f = _88f || {};
        return this.each(function () {
            var _893 = $.data(this, "combo");
            if (_893) {
                $.extend(_893.options, _88f);
            } else {
                var r = init(this);
                _893 = $.data(this, "combo", { options: $.extend({}, $.fn.combo.defaults, $.fn.combo.parseOptions(this), _88f), combo: r.combo, panel: r.panel, previousValue: null });
                $(this).removeAttr("disabled");
            }
            _84a(this);
            _83e(this);
            _856(this);
            _868(this);
            _88d(this);
        });
    };
    $.fn.combo.methods = {
        options: function (jq) {
            return $.data(jq[0], "combo").options;
        }, panel: function (jq) {
            return $.data(jq[0], "combo").panel;
        }, textbox: function (jq) {
            return $.data(jq[0], "combo").combo.find("input.combo-text");
        }, destroy: function (jq) {
            return jq.each(function () {
                _850(this);
            });
        }, resize: function (jq, _894) {
            return jq.each(function () {
                _83e(this, _894);
            });
        }, showPanel: function (jq) {
            return jq.each(function () {
                _85f(this);
            });
        }, hidePanel: function (jq) {
            return jq.each(function () {
                _85e(this);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _84e(this, true);
                _856(this);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                _84e(this, false);
                _856(this);
            });
        }, readonly: function (jq, mode) {
            return jq.each(function () {
                _84f(this, mode);
                _856(this);
            });
        }, isValid: function (jq) {
            var _895 = $.data(jq[0], "combo").combo.find("input.combo-text");
            return _895.validatebox("isValid");
        }, clear: function (jq) {
            return jq.each(function () {
                _872(this);
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $.data(this, "combo").options;
                if (opts.multiple) {
                    $(this).combo("setValues", opts.originalValue);
                } else {
                    $(this).combo("setValue", opts.originalValue);
                }
            });
        }, getText: function (jq) {
            return _876(jq[0]);
        }, setText: function (jq, text) {
            return jq.each(function () {
                _879(this, text);
            });
        }, getValues: function (jq) {
            return _87d(jq[0]);
        }, setValues: function (jq, _896) {
            return jq.each(function () {
                _881(this, _896);
            });
        }, getValue: function (jq) {
            return _887(jq[0]);
        }, setValue: function (jq, _897) {
            return jq.each(function () {
                _88a(this, _897);
            });
        }
    };
    $.fn.combo.parseOptions = function (_898) {
        var t = $(_898);
        return $.extend({}, $.fn.validatebox.parseOptions(_898), $.parser.parseOptions(_898, ["blurValidValue","width", "height", "separator", "panelAlign", { panelWidth: "number", editable: "boolean", hasDownArrow: "boolean", delay: "number", selectOnNavigation: "boolean" }]), { panelHeight: (t.attr("panelHeight") == "auto" ? "auto" : parseInt(t.attr("panelHeight")) || undefined), multiple: (t.attr("multiple") ? true : undefined), disabled: (t.attr("disabled") ? true : undefined), readonly: (t.attr("readonly") ? true : undefined), value: (t.val() || undefined) });
    };
    
    $.fn.combo.defaults = $.extend({}, $.fn.validatebox.defaults, {
        blurValidValue:false, /*2018-12-26 wanghc blur时验证组件是否有值,无则清空输入框*/
        /*enterNullValueClear控制 回车时是否清空输入框里的值。by wanghc */
        enterNullValueClear:true,width: "auto", height: 22, panelWidth: null, panelHeight: 200, panelAlign: "left", multiple: false, selectOnNavigation: true, separator: ",", editable: true, disabled: false, readonly: false, hasDownArrow: true, value: "", delay: 200, deltaX: 19, keyHandler: {
            up: function (e) {
            }, down: function (e) {
            }, left: function (e) {
            }, right: function (e) {
            }, enter: function (e) {
            }, query: function (q, e) {
            }
        }, onShowPanel: function () {
        }, onHidePanel: function () {
        }, onChange: function (_899, _89a) {
        }
    });
})(jQuery);
(function ($) {
    var COMBOBOX_SERNO = 0;
    function getRowIndex(target, value) {
        var state = $.data(target, "combobox");
        var opts = state.options;
        var data = state.data;
        for (var i = 0; i < data.length; i++) {
            if (data[i][opts.valueField] == value) {
                return i;
            }
        }
        return -1;
    };
    function scrollTo(target, value) {
        var opts = $.data(target, "combobox").options;
        var panel = $(target).combo("panel");
        var item = opts.finder.getEl(target, value);
        if (item.length) {
            if (item.position().top <= 0) {
                var h = panel.scrollTop() + item.position().top;
                panel.scrollTop(h);
            } else {
                if (item.position().top + item.outerHeight() > panel.height()) {
                    var h = panel.scrollTop() + item.position().top + item.outerHeight() - panel.height();
                    panel.scrollTop(h);
                }
            }
        }
    };
    function nav(target, dir) {
        var opts = $.data(target, "combobox").options;
        var panel = $(target).combobox("panel");
        var item = panel.children("div.combobox-item-hover");
        if (!item.length) {
            item = panel.children("div.combobox-item-selected");
        }
        item.removeClass("combobox-item-hover");
        var firstSelector = "div.combobox-item:visible:not(.combobox-item-disabled):first";
        var lastSelector = "div.combobox-item:visible:not(.combobox-item-disabled):last";
        if (!item.length) {
            item = panel.children(dir == "next" ? firstSelector : lastSelector);
        } else {
            if (dir == "next") {
                item = item.nextAll(firstSelector);
                if (!item.length) {
                    item = panel.children(firstSelector);
                }
            } else {
                item = item.prevAll(firstSelector);
                if (!item.length) {
                    item = panel.children(lastSelector);
                }
            }
        }
        if (item.length) {
            item.addClass("combobox-item-hover");
            var row = opts.finder.getRow(target, item);
            if (row) {
                scrollTo(target, row[opts.valueField]);
                if (opts.selectOnNavigation) {
                    select(target, row[opts.valueField]);
                }
            }
        }
    };
    /**
     *
     *select-row
     * @param {HTMLDocument} target
     * @param {String} value 希望选中的值
     */
    function select(target, value) {
        var opts = $.data(target, "combobox").options;
        var values = $(target).combo("getValues");
        if ($.inArray(value + "", values) == -1) {
            if (opts.multiple) {
                values.push(value);
            } else {
                values = [value];
            }
            setValues(target, values);
            opts.onSelect.call(target, opts.finder.getRow(target, value));
        }else{
            // else内全是新加 neer 20190322
            // 输入ohio,但列表中只有Ohio时,此时value有值,但显示为小写ohio了
            // 当前点击的行值===当前combobox的值,但text不对
            if (opts.multiple){
                
            }else{
                if (value){
                    var row = opts.finder.getRow(target, value);
                    if (row) { 
                        var s = row[opts.textField];
                        if(s!==$(target).combo("getText")){
                            $(target).combo("setText",s);
                        } 
                    }
                }
            }
        }
    };
    function unselect(target, value) {
        var opts = $.data(target, "combobox").options;
        var values = $(target).combo("getValues");
        var index = $.inArray(value + "", values);
        if (index >= 0) {
            values.splice(index, 1);
            setValues(target, values);
            opts.onUnselect.call(target, opts.finder.getRow(target, value));
        }
    };
    /** 
     * neer
     * 20190322
     * setValue方法
     * arg1
     * arg2 选中值
     * arg3 表示是否重置text(显示内容)
    */
    function setValues(target, values, remainText) {
        var opts = $.data(target, "combobox").options;
        var panel = $(target).combo("panel");
        panel.find("div.combobox-item-selected").removeClass("combobox-item-selected");
        var vv = [], ss = [];
        for (var i = 0; i < values.length; i++) {
            var v = values[i];
            var s = v;
            opts.finder.getEl(target, v).addClass("combobox-item-selected");
            var row = opts.finder.getRow(target, v);
            if (row) { 
                s = row[opts.textField];
            }else{
                //2019-1-26.neer 测试发现 remote时,输入查询条件查询不出结果时,getValue()返回的是查询条件即为getText()的值
                // row为undefined时,清空值
                //if (opts.forceValidValue) {v = "";}
            }
            vv.push(v);
            ss.push(s);
        }
        $(target).combo("setValues", vv);
        if (!remainText) {
            $(target).combo("setText", ss.join(opts.separator));
        }
        if(opts.rowStyle && opts.rowStyle=='checkbox'){ 
            //wanghc 2018-10-17 rowStyle=checkbox 选中数据行时,判断是不是应该选中全选勾
            var tmpLen = $.data(target, "combobox").data.length;
            if (vv.length==tmpLen){
                panel.parent().children("._hisui_combobox-selectall").addClass("checked");
            }else{
                panel.parent().children("._hisui_combobox-selectall").removeClass("checked");
            }
        }
    };
    function loadData(target, data, remainText) {
        var state = $.data(target, "combobox");
        var opts = state.options;
        state.data = opts.loadFilter.call(target, data);
        state.groups = [];
        data = state.data;
        var selected = $(target).combobox("getValues");
        var dd = [];
        var group = undefined;
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var v = row[opts.valueField] + "";
            var s = row[opts.textField];
            var g = row[opts.groupField];
            if (g) {
                if (group != g) {
                    group = g;
                    state.groups.push(g);
                    dd.push("<div id=\"" + (state.groupIdPrefix + "_" + (state.groups.length - 1)) + "\" class=\"combobox-group\">");
                    dd.push(opts.groupFormatter ? opts.groupFormatter.call(target, g) : g);
                    dd.push("</div>");
                }
            } else {
                group = undefined;
            }
            var cls = "combobox-item" + (row.disabled ? " combobox-item-disabled" : "") + (g ? " combobox-gitem" : "");
            dd.push("<div id=\"" + (state.itemIdPrefix + "_" + i) + "\" class=\"" + cls + "\">");
            dd.push(opts.formatter ? opts.formatter.call(target, row) : s);
            dd.push("</div>");
            if (row["selected"] && $.inArray(v, selected) == -1) {
                selected.push(v);
            }
        }
        $(target).combo("panel").html(dd.join(""));
        if (opts.multiple) {
            setValues(target, selected, remainText);
            // wanghc 2018-10-17 checkbox all select
            if (opts.rowStyle && opts.rowStyle=='checkbox'){
                
                var myPanelJObj = $(target).combo("panel");
                myPanelJObj.closest('.combo-p').children('._hisui_combobox-selectall').remove();
                var myPanelWidth = myPanelJObj.width() - 5; //5是padding-left
                var myallselJObj = $('<div style="width:'+myPanelWidth+'px" class="_hisui_combobox-selectall"><span class="combobox-checkbox"></span>全选/取消全选</div>')
                .bind('click',function(e){
                    var _t = $(this);
                    if (_t.hasClass('checked')){
                        _t.removeClass('checked');
                        $(target).combobox("setValues",[]);
                    }else{
                        var tmpArr = [];
                        _t.addClass('checked');
                        $.map(data,function(v){
                            tmpArr.push(v[opts.valueField]);
                        });
                        $(target).combobox("setValues",tmpArr);
                    }
                    if (opts.onAllSelectClick){
                        opts.onAllSelectClick.call(target,e);
                    } 
                });
                if (opts.allSelectButtonPosition=='bottom'){
                    //myallselJObj.appendTo($(target).combo("panel"));
                    myallselJObj.insertAfter(myPanelJObj);
                    myallselJObj.parent().addClass('bbtm');
                }else{
                    //myallselJObj.prependTo($(target).combo("panel"));
                    myallselJObj.insertBefore(myPanelJObj);
                    myallselJObj.parent().addClass('btop');
                }
            }
        } else {
            setValues(target, selected.length ? [selected[selected.length - 1]] : [], remainText);
        }
        opts.onLoadSuccess.call(target, data);
    };
    function request(target, url, param, remainText) {
        var opts = $.data(target, "combobox").options;
        if (url) {
            opts.url = url;
        }
        param = param || {};
        if (opts.onBeforeLoad.call(target, param) == false) {
            return;
        }
        opts.loader.call(target, param, function (data) {
            loadData(target, data, remainText);
        }, function () {
            opts.onLoadError.apply(this, arguments);
        });
    };
    function doQuery(target, q) {
        var state = $.data(target, "combobox");
        var opts = state.options;
        if (opts.multiple && !q) {
            setValues(target, [], true);
        } else {
            setValues(target, [q], true);
        }
        if (opts.mode == "remote") {
            request(target, null, { q: q }, true);
        } else {
            var panel = $(target).combo("panel");
            panel.find("div.combobox-item-selected,div.combobox-item-hover").removeClass("combobox-item-selected combobox-item-hover");
            panel.find("div.combobox-item,div.combobox-group").hide();
            var data = state.data;
            var vv = [];
            var qq = opts.multiple ? q.split(opts.separator) : [q];
            $.map(qq, function (q) {
                q = $.trim(q);
                var group = undefined;
                for (var i = 0; i < data.length; i++) {
                    var row = data[i];
                    if (opts.filter.call(target, q, row)) {
                        var v = row[opts.valueField];
                        var s = row[opts.textField];
                        var g = row[opts.groupField];
                        var item = opts.finder.getEl(target, v).show();
                        if (s.toLowerCase() == q.toLowerCase()) {
                            vv.push(v);
                            item.addClass("combobox-item-selected");
                            //opts.onSelect.call(target, opts.finder.getRow(target, v));
                        }
                        if (opts.groupField && group != g) {
                            $("#" + state.groupIdPrefix + "_" + $.inArray(g, state.groups)).show();
                            group = g;
                        }
                    }
                }
            });
            setValues(target, vv, true);
            // wanghc 2018-11-7 输入骨科不能进入onSelect事件，输入骨后选骨科可以进入onSelect问题
            if(vv.length>0) { opts.onSelect.call(target, opts.finder.getRow(target, vv[vv.length-1]));}
        }
    };
    function doEnter(target) {
        var t = $(target);
        var opts = t.combobox("options");
        var panel = t.combobox("panel");
        var item = panel.children("div.combobox-item-hover");
        if (item.length) {
            var row = opts.finder.getRow(target, item);
            var value = row[opts.valueField];
            if (opts.multiple) {
                if (item.hasClass("combobox-item-selected")) {
                    t.combobox("unselect", value);
                } else {
                    t.combobox("select", value);
                }
            } else {
                t.combobox("select", value);
            }
        }
        var vv = [];
        $.map(t.combobox("getValues"), function (v) {
            if (getRowIndex(target, v) >= 0) {
                vv.push(v);
            }
        });
        /*当配匹值为空且enterNullValueClear为flase时不清空输入框。add wanghc 2018-5-22*/
        if(vv.length==0 && !opts.enterNullValueClear){
        }else{
            t.combobox("setValues", vv);
        }
        if (!opts.multiple) {
            t.combobox("hidePanel");
        }
    };
    function create(target) {
        var state = $.data(target, "combobox");
        var opts = state.options;
        COMBOBOX_SERNO++;
        state.itemIdPrefix = "_hisui_combobox_i" + COMBOBOX_SERNO;
        state.groupIdPrefix = "_hisui_combobox_g" + COMBOBOX_SERNO;
        $(target).addClass("combobox-f");
        $(target).combo($.extend({}, opts, {
            onShowPanel: function () {
                $(target).combo("panel").find("div.combobox-item,div.combobox-group").show();
                scrollTo(target, $(target).combobox("getValue"));
                opts.onShowPanel.call(target);
            }
        }));
        $(target).combo("panel").unbind().bind("mouseover", function (e) {
            $(this).children("div.combobox-item-hover").removeClass("combobox-item-hover");
            var item = $(e.target).closest("div.combobox-item");
            if (!item.hasClass("combobox-item-disabled")) {
                item.addClass("combobox-item-hover");
            }
            e.stopPropagation();
        }).bind("mouseout", function (e) {
            $(e.target).closest("div.combobox-item").removeClass("combobox-item-hover");
            e.stopPropagation();
        }).bind("click", function (e) {
            var item = $(e.target).closest("div.combobox-item");
            if (!item.length || item.hasClass("combobox-item-disabled")) {
                return;
            }
            var row = opts.finder.getRow(target, item);
            if (!row) {
                return;
            }
            var value = row[opts.valueField];
            if (opts.multiple) {
                if (item.hasClass("combobox-item-selected")) {
                    unselect(target, value);
                } else {
                    select(target, value);
                }
            } else {
                // 增加allowNull配置,if是增加的 20190218-neer 
                if (opts.allowNull && item.hasClass("combobox-item-selected")){
                    unselect(target, value);
                }else{
                    select(target, value);
                    $(target).combo("hidePanel");
                }
            }
            e.stopPropagation();
        });
    };
    $.fn.combobox = function (options, param) {
        if (typeof options == "string") {
            var method = $.fn.combobox.methods[options];
            if (method) {
                return method(this, param);
            } else {
                return this.combo(options, param);
            }
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "combobox");
            if (state) {
                $.extend(state.options, options);
                create(this);
            } else {
                state = $.data(this, "combobox", { options: $.extend({}, $.fn.combobox.defaults, $.fn.combobox.parseOptions(this), options), data: [] });
                create(this);
                var data = $.fn.combobox.parseData(this);
                if (data.length) {
                    loadData(this, data);
                }
            }
            if (state.options.data) {
                loadData(this, state.options.data);
            }
            request(this);
            if (state.options.blurValidValue){
                state.options.forceValidValue = true; //这时强制设置值检查
                var _t = this;
                $(_t).combo('textbox').bind("blur.combo-text", function (e) {
                    if ($(_t).combo('panel').find(".combobox-item-hover").length==0){ //click---combo-p
                        var val = $(_t).combobox("getValue");
                        if (val==undefined || val=="" || val==null){
                            $(e.target).val("");
                            doQuery(_t, "");
                        }
                        var isContain = 0;
                        var _d = $(_t).combobox('getData');
                        var opts = $(_t).combobox('options');
                        for (var i=0;i<_d.length;i++){
                            if (_d[i][opts.valueField]==val){
                                isContain = 1;
                            }
                        }
                        if (0==isContain){
                            $(e.target).val("");
                            doQuery(_t, "");
                        }
                    }
                });
            }
        });
    };
    $.fn.combobox.methods = {
        options: function (jq) {
            var copts = jq.combo("options");
            return $.extend($.data(jq[0], "combobox").options, { originalValue: copts.originalValue, disabled: copts.disabled, readonly: copts.readonly });
        }, getData: function (jq) {
            return $.data(jq[0], "combobox").data;
        }, setValues: function (jq, values) {
            return jq.each(function () {
                setValues(this, values);
            });
        }, setValue: function (jq, value) {
            return jq.each(function () {
                setValues(this, [value]);
            });
        }, clear: function (jq) {
            return jq.each(function () {
                $(this).combo("clear");
                var panel = $(this).combo("panel");
                panel.find("div.combobox-item-selected").removeClass("combobox-item-selected");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).combobox("options");
                if (opts.multiple) {
                    $(this).combobox("setValues", opts.originalValue);
                } else {
                    $(this).combobox("setValue", opts.originalValue);
                }
            });
        }, loadData: function (jq, data) {
            return jq.each(function () {
                loadData(this, data);
            });
        }, reload: function (jq, url) {
            return jq.each(function () {
                request(this, url);
            });
        }, select: function (jq, value) {
            return jq.each(function () {
                select(this, value);
            });
        }, unselect: function (jq, value) {
            return jq.each(function () {
                unselect(this, value);
            });
        }
    };
    $.fn.combobox.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.fn.combo.parseOptions(target), $.parser.parseOptions(target, ["valueField", "textField", "groupField", "mode", "method", "url"]));
    };
    $.fn.combobox.parseData = function (target) {
        var data = [];
        var opts = $(target).combobox("options");
        $(target).children().each(function () {
            if (this.tagName.toLowerCase() == "optgroup") {
                var group = $(this).attr("label");
                $(this).children().each(function () {
                    _parseItem(this, group);
                });
            } else {
                _parseItem(this);
            }
        });
        return data;
        function _parseItem(el, group) {
            var t = $(el);
            var row = {};
            row[opts.valueField] = t.attr("value") != undefined ? t.attr("value") : t.text();
            row[opts.textField] = t.text();
            row["selected"] = t.is(":selected");
            row["disabled"] = t.is(":disabled");
            if (group) {
                opts.groupField = opts.groupField || "group";
                row[opts.groupField] = group;
            }
            data.push(row);
        };
    };
    $.fn.combobox.defaults = $.extend({}, $.fn.combo.defaults, {
        forceValidValue:false,allowNull:false,
        allSelectButtonPosition:'top',rowStyle:'',valueField: "value", textField: "text", groupField: null, groupFormatter: function (group) {
            return group;
        }, mode: "local", method: "post", url: null, data: null, keyHandler: {
            up: function (e) {
                nav(this, "prev");
                e.preventDefault();
            }, down: function (e) {
                nav(this, "next");
                e.preventDefault();
            }, left: function (e) {
            }, right: function (e) {
            }, enter: function (e) {
                doEnter(this);
            }, query: function (q, e) {
                doQuery(this, q);
            }
        }, filter: function (q, row) {
            var opts = $(this).combobox("options");
            return row[opts.textField].toLowerCase().indexOf(q.toLowerCase()) == 0;
        }, formatter: function (row) {
            var opts = $(this).combobox("options");
            if (opts.rowStyle && opts.rowStyle=='checkbox'){
                return "<span class='combobox-checkbox'></span>"+row[opts.textField];
            }else{
                return row[opts.textField];
            }
        }, loader: function (param, success, error) {
            var opts = $(this).combobox("options");
            if (!opts.url) {
                return false;
            }
            $.ajax({
                type: opts.method, url: opts.url, data: param, dataType: "json", success: function (data) {
                    success(data);
                }, error: function () {
                    error.apply(this, arguments);
                }
            });
        }, loadFilter: function (data) {
            return data;
        }, finder: {
            getEl: function (target, value) {
                var index = getRowIndex(target, value);
                var id = $.data(target, "combobox").itemIdPrefix + "_" + index;
                return $("#" + id);
            }, getRow: function (target, p) {
                var state = $.data(target, "combobox");
                var index = (p instanceof jQuery) ? p.attr("id").substr(state.itemIdPrefix.length + 1) : getRowIndex(target, p);
                return state.data[parseInt(index)];
            }
        }, onBeforeLoad: function (param) {
        }, onLoadSuccess: function () {
        }, onLoadError: function () {
        }, onSelect: function (record) {
        }, onUnselect: function (record) {
        }
    });
})(jQuery);
(function ($) {
    function _8e9(_8ea) {
        var _8eb = $.data(_8ea, "combotree");
        var opts = _8eb.options;
        var tree = _8eb.tree;
        $(_8ea).addClass("combotree-f");
        $(_8ea).combo(opts);
        var _8ec = $(_8ea).combo("panel");
        if (!tree) {
            tree = $("<ul></ul>").appendTo(_8ec);
            $.data(_8ea, "combotree").tree = tree;
        }
        tree.tree($.extend({}, opts, {
            checkbox: opts.multiple, onLoadSuccess: function (node, data) {
                var _8ed = $(_8ea).combotree("getValues");
                if (opts.multiple) {
                    var _8ee = tree.tree("getChecked");
                    for (var i = 0; i < _8ee.length; i++) {
                        var id = _8ee[i].id;
                        (function () {
                            for (var i = 0; i < _8ed.length; i++) {
                                if (id == _8ed[i]) {
                                    return;
                                }
                            }
                            _8ed.push(id);
                        })();
                    }
                }
                var _8ef = $(this).tree("options");
                var _8f0 = _8ef.onCheck;
                var _8f1 = _8ef.onSelect;
                _8ef.onCheck = _8ef.onSelect = function () {
                };
                $(_8ea).combotree("setValues", _8ed);
                _8ef.onCheck = _8f0;
                _8ef.onSelect = _8f1;
                opts.onLoadSuccess.call(this, node, data);
            }, onClick: function (node) {
                if (opts.multiple) {
                    $(this).tree(node.checked ? "uncheck" : "check", node.target);
                } else {
                    $(_8ea).combo("hidePanel");
                }
                _8f3(_8ea);
                opts.onClick.call(this, node);
            }, onCheck: function (node, _8f2) {
                _8f3(_8ea);
                opts.onCheck.call(this, node, _8f2);
            }
        }));
    };
    function _8f3(_8f4) {
        var _8f5 = $.data(_8f4, "combotree");
        var opts = _8f5.options;
        var tree = _8f5.tree;
        var vv = [], ss = [];
        if (opts.multiple) {
            var _8f6 = tree.tree("getChecked");
            for (var i = 0; i < _8f6.length; i++) {
                vv.push(_8f6[i].id);
                ss.push(_8f6[i].text);
            }
        } else {
            var node = tree.tree("getSelected");
            if (node) {
                vv.push(node.id);
                ss.push(node.text);
            }
        }
        $(_8f4).combo("setValues", vv).combo("setText", ss.join(opts.separator));
    };
    function _8f7(_8f8, _8f9) {
        var opts = $.data(_8f8, "combotree").options;
        var tree = $.data(_8f8, "combotree").tree;
        tree.find("span.tree-checkbox").addClass("tree-checkbox0").removeClass("tree-checkbox1 tree-checkbox2");
        var vv = [], ss = [];
        for (var i = 0; i < _8f9.length; i++) {
            var v = _8f9[i];
            var s = v;
            var node = tree.tree("find", v);
            if (node) {
                s = node.text;
                tree.tree("check", node.target);
                tree.tree("select", node.target);
            }
            vv.push(v);
            ss.push(s);
        }
        $(_8f8).combo("setValues", vv).combo("setText", ss.join(opts.separator));
    };
    $.fn.combotree = function (_8fa, _8fb) {
        if (typeof _8fa == "string") {
            var _8fc = $.fn.combotree.methods[_8fa];
            if (_8fc) {
                return _8fc(this, _8fb);
            } else {
                return this.combo(_8fa, _8fb);
            }
        }
        _8fa = _8fa || {};
        return this.each(function () {
            var _8fd = $.data(this, "combotree");
            if (_8fd) {
                $.extend(_8fd.options, _8fa);
            } else {
                $.data(this, "combotree", { options: $.extend({}, $.fn.combotree.defaults, $.fn.combotree.parseOptions(this), _8fa) });
            }
            _8e9(this);
        });
    };
    $.fn.combotree.methods = {
        options: function (jq) {
            var _8fe = jq.combo("options");
            return $.extend($.data(jq[0], "combotree").options, { originalValue: _8fe.originalValue, disabled: _8fe.disabled, readonly: _8fe.readonly });
        }, tree: function (jq) {
            return $.data(jq[0], "combotree").tree;
        }, loadData: function (jq, data) {
            return jq.each(function () {
                var opts = $.data(this, "combotree").options;
                opts.data = data;
                var tree = $.data(this, "combotree").tree;
                tree.tree("loadData", data);
            });
        }, reload: function (jq, url) {
            return jq.each(function () {
                var opts = $.data(this, "combotree").options;
                var tree = $.data(this, "combotree").tree;
                if (url) {
                    opts.url = url;
                }
                tree.tree({ url: opts.url });
            });
        }, setValues: function (jq, _8ff) {
            return jq.each(function () {
                _8f7(this, _8ff);
            });
        }, setValue: function (jq, _900) {
            return jq.each(function () {
                _8f7(this, [_900]);
            });
        }, clear: function (jq) {
            return jq.each(function () {
                var tree = $.data(this, "combotree").tree;
                tree.find("div.tree-node-selected").removeClass("tree-node-selected");
                var cc = tree.tree("getChecked");
                for (var i = 0; i < cc.length; i++) {
                    tree.tree("uncheck", cc[i].target);
                }
                $(this).combo("clear");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).combotree("options");
                if (opts.multiple) {
                    $(this).combotree("setValues", opts.originalValue);
                } else {
                    $(this).combotree("setValue", opts.originalValue);
                }
            });
        }
    };
    $.fn.combotree.parseOptions = function (_901) {
        return $.extend({}, $.fn.combo.parseOptions(_901), $.fn.tree.parseOptions(_901));
    };
    $.fn.combotree.defaults = $.extend({}, $.fn.combo.defaults, $.fn.tree.defaults, { editable: false });
})(jQuery);
(function ($) {
    function _902(_903) {
        var _904 = $.data(_903, "combogrid");
        var opts = _904.options;
        var grid = _904.grid;
        $(_903).addClass("combogrid-f").combo(opts);
        var _905 = $(_903).combo("panel");
        if (!grid) {
            grid = $("<table></table>").appendTo(_905);
            _904.grid = grid;
        }
        if(opts.lazy && $(_903).combo("getValue")=="") $(_903).combo('options').queryOnFirstArrowDown=true;  //cryze 
        grid.datagrid($.extend({}, opts, {
            border: false, fit: true, singleSelect: (!opts.multiple), onLoadSuccess: function (data) {
                var _906 = $(_903).combo("getValues");
                var _907 = opts.onSelect;
                opts.onSelect = function () {
                };
                _911(_903, _906, _904.remainText);
                opts.onSelect = _907;
                opts.onLoadSuccess.apply(_903, arguments);
            }, onClickRow: _908, onSelect: function (_909, row) {
                _90a();
                opts.onSelect.call(this, _909, row);
            }, onUnselect: function (_90b, row) {
                _90a();
                opts.onUnselect.call(this, _90b, row);
            }, onSelectAll: function (rows) {
                _90a();
                opts.onSelectAll.call(this, rows);
            }, onUnselectAll: function (rows) {
                if (opts.multiple) {
                    _90a();
                }
                opts.onUnselectAll.call(this, rows);
            },lazy:(opts.lazy && $(_903).combo("getValue")=="")   //cryze 要让datagrid不要load数据  初始化时没load数据，那么第一次点击下拉按钮 应该load数据 事件绑定应该是在combo上的
        }));
        function _908(_90c, row) {
            _904.remainText = false;
            _90a();
            if (!opts.multiple) {
                $(_903).combo("hidePanel");
            }
            opts.onClickRow.call(this, _90c, row);
        };
        function _90a() {
            var rows = grid.datagrid("getSelections");
            var vv = [], ss = [];
            for (var i = 0; i < rows.length; i++) {
                vv.push(rows[i][opts.idField]);
                ss.push(rows[i][opts.textField]);
            }
            if (!opts.multiple) {
                $(_903).combo("setValues", (vv.length ? vv : [""]));
            } else {
                $(_903).combo("setValues", vv);
            }
            if (!_904.remainText) {
                $(_903).combo("setText", ss.join(opts.separator));
            }
        };
    };
    function nav(_90d, dir) {
        var _90e = $.data(_90d, "combogrid");
        var opts = _90e.options;
        var grid = _90e.grid;
        var _90f = grid.datagrid("getRows").length;
        if (!_90f) {
            return;
        }
        var tr = opts.finder.getTr(grid[0], null, "highlight");
        if (!tr.length) {
            tr = opts.finder.getTr(grid[0], null, "selected");
        }
        var _910;
        if (!tr.length) {
            _910 = (dir == "next" ? 0 : _90f - 1);
        } else {
            var _910 = parseInt(tr.attr("datagrid-row-index"));
            _910 += (dir == "next" ? 1 : -1);
            if (_910 < 0) {
                _910 = _90f - 1;
            }
            if (_910 >= _90f) {
                _910 = 0;
            }
        }
        grid.datagrid("highlightRow", _910);
        if (opts.selectOnNavigation) {
            _90e.remainText = false;
            grid.datagrid("selectRow", _910);
        }
    };
    function _911(_912, _913, _914) {
        var _915 = $.data(_912, "combogrid");
        var opts = _915.options;
        var grid = _915.grid;
        var rows = grid.datagrid("getRows");
        var ss = [];
        var _916 = $(_912).combo("getValues");
        var _917 = $(_912).combo("options");
        var _918 = _917.onChange;
        _917.onChange = function () {
        };
        //if (_913=="") _913=[]; // wanghc setValues("")---error
        if (_913==="") _913=[]; // cryze [""]=="" 返回值是true 2019-06-13
        var vv = $.map(_913, function (_b62) {  //cryze 2018-7-24
            return String(_b62);
        });
        var _b64 = $.grep(grid.datagrid("getSelections"), function (row, _b65) {  //cryze 2018-7-24  先选中，然后翻页，显示成输入框显示成value的问题
            return $.inArray(String(row[opts.idField]), vv) >= 0;
        });
        grid.datagrid("clearSelections");
        grid.data("datagrid").selectedRows = _b64;  //cryze 2018-7-24
        for (var i = 0; i < _913.length; i++) {
            var _919 = grid.datagrid("getRowIndex", _913[i]);
            if (_919 >= 0) {
                grid.datagrid("selectRow", _919);
                ss.push(rows[_919][opts.textField]);
            } else if(_b67(_913[i], _b64)){   //cryze 2018-7-24 
                ss.push(_b67(_913[i], _b64));
            }else {
                ss.push(_913[i]);
            }
        }
        $(_912).combo("setValues", _916);
        _917.onChange = _918;
        $(_912).combo("setValues", _913);
        if (!_914) {
            var s = ss.join(opts.separator);
            if ($(_912).combo("getText") != s) {
                $(_912).combo("setText", s);
            }
        }
        function _b67(_b68, a) {  //cryze 2018-7-24
            var item = $.hisui.getArrayItem(a, opts.idField, _b68);
            return item ? item[opts.textField] : undefined;
        };
    };
    function _91a(_91b, q) {
        var _91c = $.data(_91b, "combogrid");
        var opts = _91c.options;
        var grid = _91c.grid;
        _91c.remainText = true;
        if (opts.multiple && !q) {
            _911(_91b, [], true);
        } else {
            _911(_91b, [q], true);
        }
        if (opts.mode == "remote") {
            grid.datagrid("clearSelections");
            grid.datagrid("load", $.extend({}, opts.queryParams, { q: q }));
        } else {
            if (!q) {
                return;
            }
            grid.datagrid("clearSelections").datagrid("highlightRow", -1);
            var rows = grid.datagrid("getRows");
            var qq = opts.multiple ? q.split(opts.separator) : [q];
            $.map(qq, function (q) {
                q = $.trim(q);
                if (q) {
                    $.map(rows, function (row, i) {
                        if (q == row[opts.textField]) {
                            grid.datagrid("selectRow", i);
                        } else {
                            if (opts.filter.call(_91b, q, row)) {
                                grid.datagrid("highlightRow", i);
                            }
                        }
                    });
                }
            });
        }
    };
    function _91d(_91e) {
        var _91f = $.data(_91e, "combogrid");
        var opts = _91f.options;
        var grid = _91f.grid;
        var tr = opts.finder.getTr(grid[0], null, "highlight");
        _91f.remainText = false;
        if (tr.length) {
            var _920 = parseInt(tr.attr("datagrid-row-index"));
            if (opts.multiple) {
                if (tr.hasClass("datagrid-row-selected")) {
                    grid.datagrid("unselectRow", _920);
                } else {
                    grid.datagrid("selectRow", _920);
                }
            } else {
                grid.datagrid("selectRow", _920);
            }
        }
        var vv = [];
        $.map(grid.datagrid("getSelections"), function (row) {
            vv.push(row[opts.idField]);
        });
        /*当配匹值为空且enterNullValueClear为flase时不清空输入框。add wanghc 2018-5-22*/
        if(vv.length==0 && !opts.enterNullValueClear){
        }else{
            $(_91e).combogrid("setValues", vv);
        }
        if (!opts.multiple) {
            $(_91e).combogrid("hidePanel");
        }
    };
    $.fn.combogrid = function (_921, _922) {
        if (typeof _921 == "string") {
            var _923 = $.fn.combogrid.methods[_921];
            if (_923) {
                return _923(this, _922);
            } else {
                return this.combo(_921, _922);
            }
        }
        _921 = _921 || {};
        return this.each(function () {
            var _924 = $.data(this, "combogrid");
            if (_924) {
                $.extend(_924.options, _921);
            } else {
                _924 = $.data(this, "combogrid", { options: $.extend({}, $.fn.combogrid.defaults, $.fn.combogrid.parseOptions(this), _921) });
            }
            _902(this);
            if (_924.options.blurValidValue){
                var _t = this;
                $(_t).combo('textbox').bind("blur.combo-text", function (e) {
                    var val = $(_t).combogrid("grid").datagrid("getSelected");
                    if (val==undefined || val=="" || val==null){
                        $(e.target).val("");
                        _91a(_t, "");
                    }
                });
            }
        });
    };
    $.fn.combogrid.methods = {
        options: function (jq) {
            var _925 = jq.combo("options");
            return $.extend($.data(jq[0], "combogrid").options, { originalValue: _925.originalValue, disabled: _925.disabled, readonly: _925.readonly });
        }, grid: function (jq) {
            return $.data(jq[0], "combogrid").grid;
        }, setValues: function (jq, _926) {
            return jq.each(function () {
                _911(this, _926);
            });
        }, setValue: function (jq, _927) {
            return jq.each(function () {
                _911(this, [_927]);
            });
        }, clear: function (jq) {
            return jq.each(function () {
                $(this).combogrid("grid").datagrid("clearSelections");
                $(this).combo("clear");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).combogrid("options");
                if (opts.multiple) {
                    $(this).combogrid("setValues", opts.originalValue);
                } else {
                    $(this).combogrid("setValue", opts.originalValue);
                }
            });
        }
    };
    $.fn.combogrid.parseOptions = function (_928) {
        var t = $(_928);
        return $.extend({}, $.fn.combo.parseOptions(_928), $.fn.datagrid.parseOptions(_928), $.parser.parseOptions(_928, ["idField", "textField", "mode"]));
    };
    $.fn.combogrid.defaults = $.extend({}, $.fn.combo.defaults, $.fn.datagrid.defaults, {
        loadMsg: null, idField: null, textField: null, mode: "local", keyHandler: {
            up: function (e) {
                nav(this, "prev");
                e.preventDefault();
            }, down: function (e) {
                nav(this, "next");
                e.preventDefault();
            }, left: function (e) {
            }, right: function (e) {
            }, enter: function (e) {
                _91d(this);
            }, query: function (q, e) {
                _91a(this, q);
            }
        }, filter: function (q, row) {
            var opts = $(this).combogrid("options");
            return row[opts.textField].toLowerCase().indexOf(q.toLowerCase()) == 0;
        },lazy:false   //cryze 2018-3-22
    });
})(jQuery);
(function($){
	/**
	 * create date box
	 */
	function createBox(target){
		var state = $.data(target, 'datebox');
		var opts = state.options;
		
		$(target).addClass('datebox-f').combo($.extend({}, opts, {
			onShowPanel:function(){
				setCalendar();
				setValue(target, $(target).datebox('getText'), true);
//				setValue(target, $(target).datebox('getText'));
				opts.onShowPanel.call(target);
			}
		}));
		$(target).combo('textbox').parent().addClass('datebox');
		
		/**
		 * if the calendar isn't created, create it.
		 */
		if (!state.calendar){
			createCalendar();
		}
		setValue(target, opts.value);
		$(target).combo('textbox').unbind('.datebox').bind("blur.datebox",function(e){
			//calendar-nav-hover
			/*var rt = $(e.relatedTarget) ;
			if (rt.length>0){
				if (rt.closest('.datebox-button').length==0 && rt.closest('.datebox-calendar-inner').length==0){
					doBlur(target);
				}
			}else{
				var cl = $.data(target,'datebox').calendar.closest('.panel-body');
				if (cl.find('.calendar-hover').length==0 && cl.find('.calendar-nav-hover').length==0){
					doBlur(target);
				}
			}*/	
			/** 点击 calendar时不触发doBlur, 点击今天没办法判断(转成setTimeout判断) */
			if ($(target).combo('textbox').parent().find('.combo-arrow-hover').length>0){return ;}
			var cl = $.data(target,'datebox').calendar.closest('.panel-body');
			if (cl.find('.calendar-hover').length>0){return ;}
			if (cl.find('.calendar-nav-hover').length>0){return ;}
			var curVal = $(target).combo('getText'); 
			setTimeout(function(){
				// curVal不为空才去校验日期格式, 为空时调用doEnter会默认上当天日期
				if (curVal!="" && curVal == $(target).combo('getText')){ //没有点击今天,或日历中其它日期
					opts.onBlur(target);
				}
			},200);
		})
		function createCalendar(){
			var panel = $(target).combo('panel').css('overflow','hidden');
			panel.panel('options').onBeforeDestroy = function(){
				var sc = $(this).find('.calendar-shared');
				if (sc.length){
					sc.insertBefore(sc[0].pholder);
				}
			};
			var cc = $('<div class="datebox-calendar-inner"></div>').appendTo(panel);
			if (opts.sharedCalendar){
				var sc = $(opts.sharedCalendar);
				if (!sc[0].pholder){
					sc[0].pholder = $('<div class="calendar-pholder" style="display:none"></div>').insertAfter(sc);
				}
				sc.addClass('calendar-shared').appendTo(cc);
				if (!sc.hasClass('calendar')){
					sc.calendar();
				}
				state.calendar = sc;
//				state.calendar = $(opts.sharedCalendar).appendTo(cc);
//				if (!state.calendar.hasClass('calendar')){
//					state.calendar.calendar();
//				}
			} else {
				state.calendar = $('<div></div>').appendTo(cc).calendar();
			}
			$.extend(state.calendar.calendar('options'), {
				fit:true,
				border:false,
				onSelect:function(date){
					var opts = $(this.target).datebox('options');
					setValue(this.target, opts.formatter.call(this.target, date));
					$(this.target).combo('hidePanel');
					opts.onSelect.call(target, date);
				}
			});
//			setValue(target, opts.value);
			
			var button = $('<div class="datebox-button"><table cellspacing="0" cellpadding="0" style="width:100%"><tr></tr></table></div>').appendTo(panel);
			var tr = button.find('tr');
			for(var i=0; i<opts.buttons.length; i++){
				var td = $('<td></td>').appendTo(tr);
				var btn = opts.buttons[i];
				var t = $('<a href="javascript:void(0)"></a>').html($.isFunction(btn.text) ? btn.text(target) : btn.text).appendTo(td);
				t.bind('click', {target: target, handler: btn.handler}, function(e){
					e.data.handler.call(this, e.data.target);
				});
			}
			tr.find('td').css('width', (100/opts.buttons.length)+'%');
		}
		
		function setCalendar(){
			var panel = $(target).combo('panel');
			var cc = panel.children('div.datebox-calendar-inner');
			panel.children()._outerWidth(panel.width());
			state.calendar.appendTo(cc);
			state.calendar[0].target = target;
			if (opts.panelHeight != 'auto'){
				var height = panel.height();
				panel.children().not(cc).each(function(){
					height -= $(this).outerHeight();
				});
				cc._outerHeight(height);
			}
			state.calendar.calendar('resize');
		}
	}
	
	/**
	 * called when user inputs some value in text box
	 */
	function doQuery(target, q){
		setValue(target, q, true);
	}
	function validDate(s){
        /*t-n , t+n*/
		if (!s) return false;
		if (s.charAt(0).toUpperCase()=='T'){return true;}
		if ("undefined"!=typeof dtformat &&  dtformat == 'DMY'){return true;}
		if (s.charAt(0).toUpperCase()=='T'){
			/*2019-6-6 => 2019-06-06 */
			var ss =  s.split('-');
			var ss1 = parseInt(ss[0],10);
			var ss2 = parseInt(ss[1],10);
			var ss3 = parseInt(ss[2],10);
			if (!isNaN(ss1) && !isNaN(ss2) && !isNaN(ss3)){
				s = ss1+"-"+(ss2>9?ss2:'0'+ss2)+'-'+(ss3>9?ss3:'0'+ss3);
			}else{
				return false;
			}
		}
		var reg = /((?!0000)[0-9]{4}((0[1-9]|1[0-2])(0[1-9]|1[0-9]|2[0-8])|(0[13-9]|1[0-2])(29|30)|(0[13578]|1[02])31)|([0-9]{2}(0[48]|[2468][048]|[13579][26])|(0[48]|[2468][048]|[13579][26])00)0229)/;
		var reg2 = /((?!0000)[0-9]{4}-((0[1-9]|1[0-2])-(0[1-9]|1[0-9]|2[0-8])|(0[13-9]|1[0-2])-(29|30)|(0[13578]|1[02])-31)|([0-9]{2}(0[48]|[2468][048]|[13579][26])|(0[48]|[2468][048]|[13579][26])00)-02-29)/;
        var y=NaN, m=NaN, d=NaN;    
		if (reg.test(s)){
			y = parseInt(s.slice(0,4),10);
			m = parseInt(s.slice(4,6));
			d = parseInt(s.slice(6,8));
		}else if(reg2.test(s)){
			var ss = s.split('-');
			y = parseInt(ss[0],10);
			m = parseInt(ss[1],10);
			d = parseInt(ss[2],10);
		}
		if (!isNaN(y) && !isNaN(m) && !isNaN(d)){
			return true;
		} else {
			return false;
		}
    }
	/**
	 * called when user press enter key
	 */
	function doEnter(target){
		var state = $.data(target, 'datebox');
        var opts = state.options;
		var current = state.calendar.calendar('options').current;
		if (current){
			setValue(target, opts.formatter.call(target, current));
			$(target).combo('hidePanel');
		}
	}
	function doBlur(target){
		$(target).combo('textbox').validatebox('enableValidation');
		if ($(target).combo('textbox').validatebox("isValid")) {
			doEnter(target);
		}
	}
	function setValue(target, value, remainText){
		var state = $.data(target, 'datebox');
		var opts = state.options;
		var calendar = state.calendar;
        $(target).combo('setValue', value);
        calendar.calendar('moveTo', opts.parser.call(target, value));
		if (!remainText){
			if (value){
				value = opts.formatter.call(target, calendar.calendar('options').current);
				$(target).combo('setValue', value).combo('setText', value);
			} else {
				$(target).combo('setText', value);
			}
		}
	}
	
	$.fn.datebox = function(options, param){
		if (typeof options == 'string'){
			var method = $.fn.datebox.methods[options];
			if (method){
				return method(this, param);
			} else {
				return this.combo(options, param);
			}
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'datebox');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'datebox', {
					options: $.extend({}, $.fn.datebox.defaults, $.fn.datebox.parseOptions(this), options)
				});
			}
			createBox(this);
		});
	};
	
	$.fn.datebox.methods = {
		options: function(jq){
			var copts = jq.combo('options');
			return $.extend($.data(jq[0], 'datebox').options, {
				originalValue: copts.originalValue,
				disabled: copts.disabled,
				readonly: copts.readonly
			});
		},
		calendar: function(jq){	// get the calendar object
			return $.data(jq[0], 'datebox').calendar;
		},
		setValue: function(jq, value){
			return jq.each(function(){
				setValue(this, value);
			});
		},
		reset: function(jq){
			return jq.each(function(){
				var opts = $(this).datebox('options');
				$(this).datebox('setValue', opts.originalValue);
			});
		}
	};
	
	$.fn.datebox.parseOptions = function(target){
		return $.extend({}, $.fn.combo.parseOptions(target), $.parser.parseOptions(target, ['sharedCalendar']));
	};
	
	$.fn.datebox.defaults = $.extend({}, $.fn.combo.defaults, {
		panelWidth:180,
		panelHeight:'auto',
		sharedCalendar:null,
		keyHandler: {
			up:function(e){},
			down:function(e){},
			left: function(e){},
			right: function(e){},
			enter:function(e){doBlur(this);},
			query:function(q,e){
				$(this).combo('textbox').validatebox('disableValidation');
				doQuery(this, q);
			}
		},
		
		currentText:'Today',
		closeText:'Close',
		okText:'Ok',
		
		buttons:[{
			text: function(target){return $(target).datebox('options').currentText;},
			handler: function(target){
				$(target).datebox('calendar').calendar({
					year:new Date().getFullYear(),
					month:new Date().getMonth()+1,
					current:new Date()
				});
				doEnter(target);
			}
		},{
			text: function(target){return $(target).datebox('options').closeText;},
			handler: function(target){
				$(this).closest('div.combo-panel').panel('close');
			}
		}],
		formatter:function(date){
			var y = date.getFullYear();
			var m = date.getMonth()+1;
			var d = date.getDate();
			return m+'/'+d+'/'+y;
		},
		parser:function(s){
			var t = Date.parse(s);
			if (!isNaN(t)){
				return new Date(t);
			} else {
				return new Date();
			}
		},
		onBlur:function(target){
			doBlur(target);
		},
        onSelect:function(date){},
		validType:'datebox',
		validParams:"YMD",
        rules: {
            datebox: {
                validator: function (_442,params) {
					if (params=="YMD"){
						return validDate(_442);
					}
					return true;
                }, message:"Please enter a valid date."
            }
        }
	});
})(jQuery);

(function ($) {
    function _949(_94a) {
        var _94b = $.data(_94a, "datetimebox");
        var opts = _94b.options;
        $(_94a).datebox($.extend({}, opts, {
            onShowPanel: function () {
                var _94c = $(_94a).datetimebox("getValue");
                _94e(_94a, _94c, true);
                opts.onShowPanel.call(_94a);
            }, formatter: $.fn.datebox.defaults.formatter, parser: $.fn.datebox.defaults.parser
        }));
        $(_94a).removeClass("datebox-f").addClass("datetimebox-f");
        $(_94a).datebox("calendar").calendar({
            onSelect: function (date) {
                opts.onSelect.call(_94a, date);
            }
        });
        var _94d = $(_94a).datebox("panel");
        if (!_94b.spinner) {
            //cryze datetimebox de timespinner with 80px->100px  height->24px; height强行指定 24px
            var p = $("<div style=\"padding:2px\"><input style=\"width:100px;height:24px\"></div>").insertAfter(_94d.children("div.datebox-calendar-inner"));
            _94b.spinner = p.children("input");
        }
        _94b.spinner.timespinner({ showSeconds: opts.showSeconds, separator: opts.timeSeparator }).unbind(".datetimebox").bind("mousedown.datetimebox", function (e) {
            e.stopPropagation();
        });
        _94e(_94a, opts.value);
    };
    function _94f(_950) {
        var c = $(_950).datetimebox("calendar");
        var t = $(_950).datetimebox("spinner");
        var date = c.calendar("options").current;
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), t.timespinner("getHours"), t.timespinner("getMinutes"), t.timespinner("getSeconds"));
    };
    function _951(_952, q) {
        _94e(_952, q, true);
    };
    function _953(_954) {
        var opts = $.data(_954, "datetimebox").options;
        var date = _94f(_954);
        _94e(_954, opts.formatter.call(_954, date));
        $(_954).combo("hidePanel");
    };
    function _94e(_955, _956, _957) {
        var opts = $.data(_955, "datetimebox").options;
        $(_955).combo("setValue", _956);
        if (!_957) {
            if (_956) {
                var date = opts.parser.call(_955, _956);
                $(_955).combo("setValue", opts.formatter.call(_955, date));
                $(_955).combo("setText", opts.formatter.call(_955, date));
            } else {
                $(_955).combo("setText", _956);
            }
        }
        var date = opts.parser.call(_955, _956);
        $(_955).datetimebox("calendar").calendar("moveTo", date);
        $(_955).datetimebox("spinner").timespinner("setValue", _958(date));
        function _958(date) {
            function _959(_95a) {
                return (_95a < 10 ? "0" : "") + _95a;
            };
            var tt = [_959(date.getHours()), _959(date.getMinutes())];
            if (opts.showSeconds) {
                tt.push(_959(date.getSeconds()));
            }
            return tt.join($(_955).datetimebox("spinner").timespinner("options").separator);
        };
    };
    $.fn.datetimebox = function (_95b, _95c) {
        if (typeof _95b == "string") {
            var _95d = $.fn.datetimebox.methods[_95b];
            if (_95d) {
                return _95d(this, _95c);
            } else {
                return this.datebox(_95b, _95c);
            }
        }
        _95b = _95b || {};
        return this.each(function () {
            var _95e = $.data(this, "datetimebox");
            if (_95e) {
                $.extend(_95e.options, _95b);
            } else {
                $.data(this, "datetimebox", { options: $.extend({}, $.fn.datetimebox.defaults, $.fn.datetimebox.parseOptions(this), _95b) });
            }
            _949(this);
        });
    };
    $.fn.datetimebox.methods = {
        options: function (jq) {
            var _95f = jq.datebox("options");
            return $.extend($.data(jq[0], "datetimebox").options, { originalValue: _95f.originalValue, disabled: _95f.disabled, readonly: _95f.readonly });
        }, spinner: function (jq) {
            return $.data(jq[0], "datetimebox").spinner;
        }, setValue: function (jq, _960) {
            return jq.each(function () {
                _94e(this, _960);
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).datetimebox("options");
                $(this).datetimebox("setValue", opts.originalValue);
            });
        }
    };
    $.fn.datetimebox.parseOptions = function (_961) {
        var t = $(_961);
        return $.extend({}, $.fn.datebox.parseOptions(_961), $.parser.parseOptions(_961, ["timeSeparator", { showSeconds: "boolean" }]));
    };
    $.fn.datetimebox.defaults = $.extend({}, $.fn.datebox.defaults, {
        showSeconds: true, timeSeparator: ":", keyHandler: {
            up: function (e) {
            }, down: function (e) {
            }, left: function (e) {
            }, right: function (e) {
            }, enter: function (e) {
                _953(this);
            }, query: function (q, e) {
                _951(this, q);
            }
        }, buttons: [{
            text: function (_962) {
                return $(_962).datetimebox("options").currentText;
            }, handler: function (_963) {
                $(_963).datetimebox("calendar").calendar({ year: new Date().getFullYear(), month: new Date().getMonth() + 1, current: new Date() });
                _953(_963);
            }
        }, {
            text: function (_964) {
                return $(_964).datetimebox("options").okText;
            }, handler: function (_965) {
                _953(_965);
            }
        }, {
            text: function (_966) {
                return $(_966).datetimebox("options").closeText;
            }, handler: function (_967) {
                $(this).closest("div.combo-panel").panel("close");
            }
        }], formatter: function (date) {
            var h = date.getHours();
            var M = date.getMinutes();
            var s = date.getSeconds();
            function _968(_969) {
                return (_969 < 10 ? "0" : "") + _969;
            };
            var _96a = $(this).datetimebox("spinner").timespinner("options").separator;
            var r = $.fn.datebox.defaults.formatter(date) + " " + _968(h) + _96a + _968(M);
            if ($(this).datetimebox("options").showSeconds) {
                r += _96a + _968(s);
            }
            return r;
        }, parser: function (s) {
            if ($.trim(s) == "") {
                return new Date();
            }
            var dt = s.split(" ");
            var d = $.fn.datebox.defaults.parser(dt[0]);
            if (dt.length < 2) {
                return d;
            }
            var _96b = $(this).datetimebox("spinner").timespinner("options").separator;
            var tt = dt[1].split(_96b);
            var hour = parseInt(tt[0], 10) || 0;
            var _96c = parseInt(tt[1], 10) || 0;
            var _96d = parseInt(tt[2], 10) || 0;
            return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, _96c, _96d);
        }, onHidePanel:function(){ //因为修改t快捷键,datebox中增加了这个方法,datetimebox中不用
        },rules: { //重写datebox方法
        },onBlur:function(target){ //重写datebox方法
		},
    });
})(jQuery);
(function ($) {
    function init(target) {
        var slider = $("<div class=\"slider\">" + "<div class=\"slider-inner\">" + "<a href=\"javascript:void(0)\" class=\"slider-handle\"></a>" + "<span class=\"slider-tip\"></span>" + "</div>" + "<div class=\"slider-rule\"></div>" + "<div class=\"slider-rulelabel\"></div>" + "<div style=\"clear:both\"></div>" + "<input type=\"hidden\" class=\"slider-value\">" + "</div>").insertAfter(target);
        var t = $(target);
        t.addClass("slider-f").hide();
        var name = t.attr("name");
        if (name) {
            slider.find("input.slider-value").attr("name", name);
            t.removeAttr("name").attr("sliderName", name);
        }
        return slider;
    };
    function setSize(target, param) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        if (param) {
            if (param.width) {
                opts.width = param.width;
            }
            if (param.height) {
                opts.height = param.height;
            }
        }
        if (opts.mode == "h") {
            slider.css("height", "");
            slider.children("div").css("height", "");
            if (!isNaN(opts.width)) {
                slider.width(opts.width);
            }
        } else {
            slider.css("width", "");
            slider.children("div").css("width", "");
            if (!isNaN(opts.height)) {
                slider.height(opts.height);
                slider.find("div.slider-rule").height(opts.height);
                slider.find("div.slider-rulelabel").height(opts.height);
                slider.find("div.slider-inner")._outerHeight(opts.height);
            }
        }
        initValue(target);
    };
    function showRule(target) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        var aa = opts.mode == "h" ? opts.rule : opts.rule.slice(0).reverse();
        if (opts.reversed) {
            aa = aa.slice(0).reverse();
        }
        _build(aa);
        function _build(aa) {
            var rule = slider.find("div.slider-rule");
            var label = slider.find("div.slider-rulelabel");
            rule.empty();
            label.empty();
            for (var i = 0; i < aa.length; i++) {
                var distance = i * 100 / (aa.length - 1) + "%";
                var span = $("<span></span>").appendTo(rule);
                span.css((opts.mode == "h" ? "left" : "top"), distance);
                if (aa[i] != "|") {
                    span = $("<span></span>").appendTo(label);
                    span.html(aa[i]);
                    if (opts.mode == "h") {
                        span.css({ left: distance, marginLeft: -Math.round(span.outerWidth() / 2) });
                    } else {
                        span.css({ top: distance, marginTop: -Math.round(span.outerHeight() / 2) });
                    }
                }
            }
        };
    };
    function buildSlider(target) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        slider.removeClass("slider-h slider-v slider-disabled");
        slider.addClass(opts.mode == "h" ? "slider-h" : "slider-v");
        slider.addClass(opts.disabled ? "slider-disabled" : "");
        slider.find("a.slider-handle").draggable({
            axis: opts.mode, cursor: "pointer", disabled: opts.disabled, onDrag: function (e) {
                var left = e.data.left;
                var width = slider.width();
                if (opts.mode != "h") {
                    left = e.data.top;
                    width = slider.height();
                }
                if (left < 0 || left > width) {
                    return false;
                } else {
                    var value = pos2value(target, left);
                    adjustValue(value);
                    return false;
                }
            }, onBeforeDrag: function () {
                state.isDragging = true;
            }, onStartDrag: function () {
                opts.onSlideStart.call(target, opts.value);
            }, onStopDrag: function (e) {
                var value = pos2value(target, (opts.mode == "h" ? e.data.left : e.data.top));
                adjustValue(value);
                opts.onSlideEnd.call(target, opts.value);
                opts.onComplete.call(target, opts.value);
                state.isDragging = false;
            }
        });
        slider.find("div.slider-inner").unbind(".slider").bind("mousedown.slider", function (e) {
            if (state.isDragging) {
                return;
            }
            var pos = $(this).offset();
            var value = pos2value(target, (opts.mode == "h" ? (e.pageX - pos.left) : (e.pageY - pos.top)));
            adjustValue(value);
            opts.onComplete.call(target, opts.value);
        });
        function adjustValue(value) {
            var s = Math.abs(value % opts.step);
            if (s < opts.step / 2) {
                value -= s;
            } else {
                value = value - s + opts.step;
            }
            setValue(target, value);
        };
    };
    function setValue(target, value) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        var oldValue = opts.value;
        if (value < opts.min) {
            value = opts.min;
        }
        if (value > opts.max) {
            value = opts.max;
        }
        opts.value = value;
        $(target).val(value);
        slider.find("input.slider-value").val(value);
        var pos = value2pos(target, value);
        var tip = slider.find(".slider-tip");
        if (opts.showTip) {
            tip.show();
            tip.html(opts.tipFormatter.call(target, opts.value));
        } else {
            tip.hide();
        }
        if (opts.mode == "h") {
            var style = "left:" + pos + "px;";
            slider.find(".slider-handle").attr("style", style);
            tip.attr("style", style + "margin-left:" + (-Math.round(tip.outerWidth() / 2)) + "px");
        } else {
            var style = "top:" + pos + "px;";
            slider.find(".slider-handle").attr("style", style);
            tip.attr("style", style + "margin-left:" + (-Math.round(tip.outerWidth())) + "px");
        }
        if (oldValue != value) {
            opts.onChange.call(target, value, oldValue);
        }
    };
    function initValue(target) {
        var opts = $.data(target, "slider").options;
        var fn = opts.onChange;
        opts.onChange = function () {
        };
        setValue(target, opts.value);
        opts.onChange = fn;
    };
    function value2pos(target, value) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        var size = opts.mode == "h" ? slider.width() : slider.height();
        var pos = opts.converter.toPosition.call(target, value, size);
        if (opts.mode == "v") {
            pos = slider.height() - pos;
        }
        if (opts.reversed) {
            pos = size - pos;
        }
        return pos.toFixed(0);
    };
    function pos2value(target, pos) {
        var state = $.data(target, "slider");
        var opts = state.options;
        var slider = state.slider;
        var size = opts.mode == "h" ? slider.width() : slider.height();
        var value = opts.converter.toValue.call(target, opts.mode == "h" ? (opts.reversed ? (size - pos) : pos) : (size - pos), size);
        return value.toFixed(0);
    };
    $.fn.slider = function (options, param) {
        if (typeof options == "string") {
            return $.fn.slider.methods[options](this, param);
        }
        options = options || {};
        return this.each(function () {
            var state = $.data(this, "slider");
            if (state) {
                $.extend(state.options, options);
            } else {
                state = $.data(this, "slider", { options: $.extend({}, $.fn.slider.defaults, $.fn.slider.parseOptions(this), options), slider: init(this) });
                $(this).removeAttr("disabled");
            }
            var opts = state.options;
            opts.min = parseFloat(opts.min);
            opts.max = parseFloat(opts.max);
            opts.value = parseFloat(opts.value);
            opts.step = parseFloat(opts.step);
            opts.originalValue = opts.value;
            buildSlider(this);
            showRule(this);
            setSize(this);
        });
    };
    $.fn.slider.methods = {
        options: function (jq) {
            return $.data(jq[0], "slider").options;
        }, destroy: function (jq) {
            return jq.each(function () {
                $.data(this, "slider").slider.remove();
                $(this).remove();
            });
        }, resize: function (jq, param) {
            return jq.each(function () {
                setSize(this, param);
            });
        }, getValue: function (jq) {
            return jq.slider("options").value;
        }, setValue: function (jq, value) {
            return jq.each(function () {
                setValue(this, value);
            });
        }, clear: function (jq) {
            return jq.each(function () {
                var opts = $(this).slider("options");
                setValue(this, opts.min);
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).slider("options");
                setValue(this, opts.originalValue);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                $.data(this, "slider").options.disabled = false;
                buildSlider(this);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                $.data(this, "slider").options.disabled = true;
                buildSlider(this);
            });
        }
    };
    $.fn.slider.parseOptions = function (target) {
        var t = $(target);
        return $.extend({}, $.parser.parseOptions(target, ["width", "height", "mode", { reversed: "boolean", showTip: "boolean", min: "number", max: "number", step: "number" }]), { value: (t.val() || undefined), disabled: (t.attr("disabled") ? true : undefined), rule: (t.attr("rule") ? eval(t.attr("rule")) : undefined) });
    };
    $.fn.slider.defaults = {
        width: "auto", height: "auto", mode: "h", reversed: false, showTip: false, disabled: false, value: 0, min: 0, max: 100, step: 1, rule: [], tipFormatter: function (value) {
            return value;
        }, converter: {
            toPosition: function (value, size) {
                var opts = $(this).slider("options");
                return (value - opts.min) / (opts.max - opts.min) * size;
            }, toValue: function (pos, size) {
                var opts = $(this).slider("options");
                return opts.min + (opts.max - opts.min) * (pos / size);
            }
        }, onChange: function (value, oldValue) {
        }, onSlideStart: function (value) {
        }, onSlideEnd: function (value) {
        }, onComplete: function (value) {
        }
    };
})(jQuery);
/*! ============================================================
 * bootstrapSwitch v1.8 by Larentis Mattia @SpiritualGuru
 * http://www.larentis.eu/
 * 
 * Enhanced for radiobuttons by Stein, Peter @BdMdesigN
 * http://www.bdmdesign.org/
 *
 * Project site:
 * http://www.larentis.eu/switch/
 * ============================================================
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 * ============================================================ */

!function ($) {
  "use strict";

  $.fn['bootstrapSwitch'] = function (method) {
    var inputSelector = 'input[type!="hidden"]';
    var methods = {
      init: function () {
        return this.each(function () {
          var $element = $(this)
            , $div
            , $switchLeft
            , $switchRight
            , $label
            , $form = $element.closest('form')
            , myClasses = ""
            , classes = $element.attr('class')
            , color
            , moving
            , onLabel = "ON"
            , offLabel = "OFF"
            , icon = false
            , textLabel = false;

          $.each(['switch-mini', 'switch-small', 'switch-large'], function (i, el) {
            if (classes && classes.indexOf(el) >= 0)  //添加classes undefined保护
              myClasses = el;
          });

          $element.addClass('has-switch');

          if ($element.data('on') !== undefined)
            color = "switch-" + $element.data('on');

          if ($element.data('on-label') !== undefined)
            onLabel = $element.data('on-label');

          if ($element.data('off-label') !== undefined)
            offLabel = $element.data('off-label');

          if ($element.data('label-icon') !== undefined)
            icon = $element.data('label-icon');

          if ($element.data('text-label') !== undefined)
            textLabel = $element.data('text-label');

          $switchLeft = $('<span>')
            .addClass("switch-left")
            .addClass(myClasses)
            .addClass(color)
            .html(onLabel);

          color = '';
          if ($element.data('off') !== undefined)
            color = "switch-" + $element.data('off');

          $switchRight = $('<span>')
            .addClass("switch-right")
            .addClass(myClasses)
            .addClass(color)
            .html(offLabel);

          $label = $('<label>')
            .html("&nbsp;")
            .addClass(myClasses)
            .attr('for', $element.find(inputSelector).attr('id'));

          if (icon) {
            $label.html('<i class="icon ' + icon + '"></i>');
          }

          if (textLabel) {
            $label.html('' + textLabel + '');
          }

          $div = $element.find(inputSelector).wrap($('<div>')).parent().data('animated', false);

          if ($element.data('animated') !== false)
            $div.addClass('switch-animate').data('animated', true);

          $div
            .append($switchLeft)
            .append($label)
            .append($switchRight);

          $element.find('>div').addClass(
            $element.find(inputSelector).is(':checked') ? 'switch-on' : 'switch-off'
          );

          if ($element.find(inputSelector).is(':disabled'))
            $(this).addClass('deactivate');

          var changeStatus = function ($this) {
            if ($element.parent('label').is('.label-change-switch')) {

            } else {
              $this.siblings('label').trigger('mousedown').trigger('mouseup').trigger('click');
            }
          };

          $element.on('keydown', function (e) {
            if (e.keyCode === 32) {
              e.stopImmediatePropagation();
              e.preventDefault();
              changeStatus($(e.target).find('span:first'));
            }
          });

          $switchLeft.on('click', function (e) {
            changeStatus($(this));
          });

          $switchRight.on('click', function (e) {
            changeStatus($(this));
          });

          $element.find(inputSelector).on('change', function (e, skipOnChange) {
            var $this = $(this)
              , $element = $this.parent()
              , thisState = $this.is(':checked')
              , state = $element.is('.switch-off');

            e.preventDefault();

            $element.css('left', '');

            if (state === thisState) {

              if (thisState)
                $element.removeClass('switch-off').addClass('switch-on');
              else $element.removeClass('switch-on').addClass('switch-off');

              if ($element.data('animated') !== false)
                $element.addClass("switch-animate");

              if (typeof skipOnChange === 'boolean' && skipOnChange)
                return;

              $element.parent().trigger('switch-change', { 'el': $this, 'value': thisState })
            }
          });
          
          $element.find('label').on('mousedown touchstart', function (e) {
            var $this = $(this);
            moving = false;

            e.preventDefault();
            e.stopImmediatePropagation();

            $this.closest('div').removeClass('switch-animate');

            if ($this.closest('.has-switch').is('.deactivate')) {
              $this.unbind('click');
            } else if ($this.closest('.switch-on').parent().is('.radio-no-uncheck')) {
              $this.unbind('click');
            } else {
              
              $this.on('mousemove touchmove', function (e) {
                var $element = $(this).closest('.make-switch')
                if ($element.length==0) return ; /*增加判断 add by wanghc 2018-05-23,点击会报错 */
                var relativeX = (e.pageX || e.originalEvent.targetTouches[0].pageX) - $element.offset().left
                  , percent = (relativeX / $element.width()) * 100
                  , left = 25
                  , right = 75;

                moving = true;

                if (percent < left)
                  percent = left;
                else if (percent > right)
                  percent = right;

                $element.find('>div').css('left', (percent - right) + "%")
              });

              $this.on('click touchend', function (e) {
                var $this = $(this)
                  , $target = $(e.target)
                  , $myRadioCheckBox = $target.siblings('input');

                e.stopImmediatePropagation();
                e.preventDefault();

                $this.unbind('mouseleave');

                if (moving)
                  $myRadioCheckBox.prop('checked', !(parseInt($this.parent().css('left')) < -25));
                else
                  $myRadioCheckBox.prop("checked", !$myRadioCheckBox.is(":checked"));

                moving = false;
                $myRadioCheckBox.trigger('change');
              });

              $this.on('mouseleave', function (e) {
                var $this = $(this)
                  , $myInputBox = $this.siblings('input');

                e.preventDefault();
                e.stopImmediatePropagation();

                $this.unbind('mouseleave');
                $this.trigger('mouseup');

                $myInputBox.prop('checked', !(parseInt($this.parent().css('left')) < -25)).trigger('change');
              });

              $this.on('mouseup', function (e) {
                e.stopImmediatePropagation();
                e.preventDefault();

                $(this).unbind('mousemove');
              });
            }
          });
          
          if ($form.data('bootstrapSwitch') !== 'injected') {
            $form.bind('reset', function () {
              setTimeout(function () {
                $form.find('.make-switch').each(function () {
                  var $input = $(this).find(inputSelector);

                  $input.prop('checked', $input.is(':checked')).trigger('change');
                });
              }, 1);
            });
            $form.data('bootstrapSwitch', 'injected');
          }
        }
        );
      },
      toggleActivation: function () {
        var $this = $(this);

        $this.toggleClass('deactivate');
        $this.find(inputSelector).prop('disabled', $this.is('.deactivate'));
      },
      isActive: function () {
        return !$(this).hasClass('deactivate');
      },
      setActive: function (active) {
        var $this = $(this);

        if (active) {
          $this.removeClass('deactivate');
          $this.find(inputSelector).removeAttr('disabled');
        }
        else {
          $this.addClass('deactivate');
          $this.find(inputSelector).attr('disabled', 'disabled');
        }
      },
      toggleState: function (skipOnChange) {
        var $input = $(this).find(':checkbox');
        $input.prop('checked', !$input.is(':checked')).trigger('change', skipOnChange);
      },
      toggleRadioState: function (skipOnChange) {
        var $radioinput = $(this).find(':radio');
        $radioinput.not(':checked').prop('checked', !$radioinput.is(':checked')).trigger('change', skipOnChange);
      },
      toggleRadioStateAllowUncheck: function (uncheck, skipOnChange) {
        var $radioinput = $(this).find(':radio');
        if (uncheck) {
          $radioinput.not(':checked').trigger('change', skipOnChange);
        }
        else {
          $radioinput.not(':checked').prop('checked', !$radioinput.is(':checked')).trigger('change', skipOnChange);
        }
      },
      setState: function (value, skipOnChange) {
        $(this).find(inputSelector).prop('checked', value).trigger('change', skipOnChange);
      },
      setOnLabel: function (value) {
        var $switchLeft = $(this).find(".switch-left");
        $switchLeft.html(value);
      },
      setOffLabel: function (value) {
        var $switchRight = $(this).find(".switch-right");
        $switchRight.html(value);
      },
      setOnClass: function (value) {
        var $switchLeft = $(this).find(".switch-left");
        var color = '';
        if (value !== undefined) {
          if ($(this).attr('data-on') !== undefined) {
            color = "switch-" + $(this).attr('data-on')
          }
          $switchLeft.removeClass(color);
          color = "switch-" + value;
          $switchLeft.addClass(color);
        }
      },
      setOffClass: function (value) {
        var $switchRight = $(this).find(".switch-right");
        var color = '';
        if (value !== undefined) {
          if ($(this).attr('data-off') !== undefined) {
            color = "switch-" + $(this).attr('data-off')
          }
          $switchRight.removeClass(color);
          color = "switch-" + value;
          $switchRight.addClass(color);
        }
      },
      setAnimated: function (value) {
        var $element = $(this).find(inputSelector).parent();
        if (value === undefined) value = false;
        $element.data('animated', value);
        $element.attr('data-animated', value);

        if ($element.data('animated') !== false) {
          $element.addClass("switch-animate");
        } else {
          $element.removeClass("switch-animate");
        }
      },
      setSizeClass: function (value) {
        var $element = $(this);
        var $switchLeft = $element.find(".switch-left");
        var $switchRight = $element.find(".switch-right");
        var $label = $element.find("label");
        $.each(['switch-mini', 'switch-small', 'switch-large'], function (i, el) {
          if (el !== value) {
            $switchLeft.removeClass(el)
            $switchRight.removeClass(el);
            $label.removeClass(el);
          } else {
            $switchLeft.addClass(el);
            $switchRight.addClass(el);
            $label.addClass(el);
          }
        });
      },
      status: function () {
        return $(this).find(inputSelector).is(':checked');
      },
      destroy: function () {
        var $element = $(this)
          , $div = $element.find('div')
          , $form = $element.closest('form')
          , $inputbox;

        $div.find(':not(input)').remove();

        $inputbox = $div.children();
        $inputbox.unwrap().unwrap();

        $inputbox.unbind('change');

        if ($form) {
          $form.unbind('reset');
          $form.removeData('bootstrapSwitch');
        }

        return $inputbox;
      }
    };

    if (methods[method])
      return methods[method].apply(this, Array.prototype.slice.call(arguments, 1));
    else if (typeof method === 'object' || !method)
      return methods.init.apply(this, arguments);
    else
      $.error('Method ' + method + ' does not exist!');
  };
}(jQuery);

// (function ($) {
//   $(function () {
//     $('.hisui-switch')['bootstrapSwitch'](); //make修改为 hisui
//   });
// })(jQuery);

/*
 *  webui popover plugin  - v1.2.17
 *  A lightWeight popover plugin with jquery ,enchance the  popover plugin of bootstrap with some awesome new features. It works well with bootstrap ,but bootstrap is not necessary!
 *  https://github.com/sandywalker/webui-popover
 *
 *  Made by Sandy Duan
 *  Under MIT License
 */
!
function(a, b, c) {
    "use strict"; !
    function(b) {
        "function" == typeof define && define.amd ? define(["jquery"], b) : "object" == typeof exports ? module.exports = b(require("jquery")) : b(a.jQuery)
    } (function(d) {
        function e(a, b) {
            return this.$element = d(a),
            b && ("string" === d.type(b.delay) || "number" === d.type(b.delay)) && (b.delay = {
                show: b.delay,
                hide: b.delay
            }),
            this.options = d.extend({},
            i, b),
            this._defaults = i,
            this._name = f,
            this._targetclick = !1,
            this.init(),
            k.push(this.$element),
            this
        }
        var f = "webuiPopover",
        g = "webui-popover",
        h = "webui.popover",
        i = {
            placement: "auto",
            container: null,
            width: "auto",
            height: "auto",
            trigger: "click",
            style: "",
            selector: !1,
            delay: {
                show: null,
                hide: 300
            },
            async: {
                type: "GET",
                before: null,
                success: null,
                error: null
            },
            cache: !0,
            multi: !1,
            arrow: !0,
            title: "",
            content: "",
            closeable: !1,
            padding: !0,
            url: "",
            type: "html",
            direction: "",
            animation: null,
            template: '<div class="webui-popover"><div class="webui-arrow"></div><div class="webui-popover-inner"><a href="#" class="close"></a><h3 class="webui-popover-title"></h3><div class="webui-popover-content"><i class="icon-refresh"></i> <p>&nbsp;</p></div></div></div>',
            backdrop: !1,
            dismissible: !0,
            onShow: null,
            onHide: null,
            abortXHR: !0,
            autoHide: !1,
            offsetTop: 0,
            offsetLeft: 0,
            iframeOptions: {
                frameborder: "0",
                allowtransparency: "true",
                id: "",
                name: "",
                scrolling: "",
                onload: "",
                height: "",
                width: ""
            },
            hideEmpty: !1
        },
        j = g + "-rtl",
        k = [],
        l = d('<div class="webui-popover-backdrop"></div>'),
        m = 0,
        n = !1,
        o = -2e3,
        p = d(b),
        q = function(a, b) {
            return isNaN(a) ? b || 0 : Number(a)
        },
        r = function(a) {
            return a.data("plugin_" + f)
        },
        s = function() {
            for (var a = null,
            b = 0; b < k.length; b++) a = r(k[b]),
            a && a.hide(!0);
            p.trigger("hiddenAll." + h)
        },
        t = function(a) {
            for (var b = null,
            c = 0; c < k.length; c++) b = r(k[c]),
            b && b.id !== a.id && b.hide(!0);
            p.trigger("hiddenAll." + h)
        },
        u = "ontouchstart" in b.documentElement && /Mobi/.test(navigator.userAgent),
        v = function(a) {
            var b = {
                x: 0,
                y: 0
            };
            if ("touchstart" === a.type || "touchmove" === a.type || "touchend" === a.type || "touchcancel" === a.type) {
                var c = a.originalEvent.touches[0] || a.originalEvent.changedTouches[0];
                b.x = c.pageX,
                b.y = c.pageY
            } else("mousedown" === a.type || "mouseup" === a.type || "click" === a.type) && (b.x = a.pageX, b.y = a.pageY);
            return b
        };
        e.prototype = {
            init: function() {
                if (this.$element[0] instanceof b.constructor && !this.options.selector) throw new Error("`selector` option must be specified when initializing " + this.type + " on the window.document object!");
                "manual" !== this.getTrigger() && (u ? this.$element.off("touchend", this.options.selector).on("touchend", this.options.selector, d.proxy(this.toggle, this)) : "click" === this.getTrigger() ? this.$element.off("click", this.options.selector).on("click", this.options.selector, d.proxy(this.toggle, this)) : "hover" === this.getTrigger() && this.$element.off("mouseenter mouseleave click", this.options.selector).on("mouseenter", this.options.selector, d.proxy(this.mouseenterHandler, this)).on("mouseleave", this.options.selector, d.proxy(this.mouseleaveHandler, this))),
                this._poped = !1,
                this._inited = !0,
                this._opened = !1,
                this._idSeed = m,
                this.id = f + this._idSeed,
                this.options.container = d(this.options.container || b.body).first(),
                this.options.backdrop && l.appendTo(this.options.container).hide(),
                m++,
                "sticky" === this.getTrigger() && this.show(),
                this.options.selector && (this._options = d.extend({},
                this.options, {
                    selector: ""
                }))
            },
            destroy: function() {
                for (var a = -1,
                b = 0; b < k.length; b++) if (k[b] === this.$element) {
                    a = b;
                    break
                }
                k.splice(a, 1),
                this.hide(),
                this.$element.data("plugin_" + f, null),
                "click" === this.getTrigger() ? this.$element.off("click") : "hover" === this.getTrigger() && this.$element.off("mouseenter mouseleave"),
                this.$target && this.$target.remove()
            },
            getDelegateOptions: function() {
                var a = {};
                return this._options && d.each(this._options,
                function(b, c) {
                    i[b] !== c && (a[b] = c)
                }),
                a
            },
            hide: function(a, b) {
                if ((a || "sticky" !== this.getTrigger()) && this._opened) {
                    b && (b.preventDefault(), b.stopPropagation()),
                    this.xhr && this.options.abortXHR === !0 && (this.xhr.abort(), this.xhr = null);
                    var c = d.Event("hide." + h);
                    if (this.$element.trigger(c, [this.$target]), this.$target) {
                        this.$target.removeClass("in").addClass(this.getHideAnimation());
                        var e = this;
                        setTimeout(function() {
                            e.$target.hide(),
                            e.getCache() || e.$target.remove()
                        },
                        e.getHideDelay())
                    }
                    this.options.backdrop && l.hide(),
                    this._opened = !1,
                    this.$element.trigger("hidden." + h, [this.$target]),
                    this.options.onHide && this.options.onHide(this.$target)
                }
            },
            resetAutoHide: function() {
                var a = this,
                b = a.getAutoHide();
                b && (a.autoHideHandler && clearTimeout(a.autoHideHandler), a.autoHideHandler = setTimeout(function() {
                    a.hide()
                },
                b))
            },
            delegate: function(a) {
                var b = d(a).data("plugin_" + f);
                return b || (b = new e(a, this.getDelegateOptions()), d(a).data("plugin_" + f, b)),
                b
            },
            toggle: function(a) {
                var b = this;
                a && (a.preventDefault(), a.stopPropagation(), this.options.selector && (b = this.delegate(a.currentTarget))),
                b[b.getTarget().hasClass("in") ? "hide": "show"]()
            },
            hideAll: function() {
                s()
            },
            hideOthers: function() {
                t(this)
            },
            show: function() {
                if (!this._opened) {
                    var a = this.getTarget().removeClass().addClass(g).addClass(this._customTargetClass);
                    if (this.options.multi || this.hideOthers(), !this.getCache() || !this._poped || "" === this.content) {
                        if (this.content = "", this.setTitle(this.getTitle()), this.options.closeable || a.find(".close").off("click").remove(), this.isAsync() ? this.setContentASync(this.options.content) : this.setContent(this.getContent()), this.canEmptyHide() && "" === this.content) return;
                        a.show()
                    }
                    this.displayContent(),
                    this.options.onShow && this.options.onShow(a),
                    this.bindBodyEvents(),
                    this.options.backdrop && l.show(),
                    this._opened = !0,
                    this.resetAutoHide()
                }
            },
            displayContent: function() {
                var a = this.getElementPosition(),
                b = this.getTarget().removeClass().addClass(g).addClass(this._customTargetClass),
                c = this.getContentElement(),
                e = b[0].offsetWidth,
                f = b[0].offsetHeight,
                i = "bottom",
                k = d.Event("show." + h);
                if (this.canEmptyHide()) {
                    var l = c.children().html();
                    if (null !== l && 0 === l.trim().length) return
                }
                this.$element.trigger(k, [b]);
                var m = this.$element.data("width") || this.options.width;
                "" === m && (m = this._defaults.width),
                "auto" !== m && b.width(m);
                var n = this.$element.data("height") || this.options.height;
                "" === n && (n = this._defaults.height),
                "auto" !== n && c.height(n),
                this.options.style && this.$target.addClass(g + "-" + this.options.style),
                "rtl" !== this.options.direction || c.hasClass(j) || c.addClass(j),
                this.options.arrow || b.find(".webui-arrow").remove(),
                b.detach().css({
                    top: o,
                    left: o,
                    display: "block"
                }),
                this.getAnimation() && b.addClass(this.getAnimation()),
                b.appendTo(this.options.container),
                i = this.getPlacement(a),
                this.$element.trigger("added." + h),
                this.initTargetEvents(),
                this.options.padding || ("auto" !== this.options.height && c.css("height", c.outerHeight()), this.$target.addClass("webui-no-padding")),
                this.options.maxHeight && c.css("maxHeight", this.options.maxHeight),
                this.options.maxWidth && c.css("maxWidth", this.options.maxWidth),
                e = b[0].offsetWidth,
                f = b[0].offsetHeight;
                var p = this.getTargetPositin(a, i, e, f);
                if (this.$target.css(p.position).addClass(i).addClass("in"), "iframe" === this.options.type) {
                    var q = b.find("iframe"),
                    r = b.width(),
                    s = q.parent().height();
                    "" !== this.options.iframeOptions.width && "auto" !== this.options.iframeOptions.width && (r = this.options.iframeOptions.width),
                    "" !== this.options.iframeOptions.height && "auto" !== this.options.iframeOptions.height && (s = this.options.iframeOptions.height),
                    q.width(r).height(s)
                }
                if (this.options.arrow || this.$target.css({
                    margin: 0
                }), this.options.arrow) {
                    var t = this.$target.find(".webui-arrow");
                    t.removeAttr("style"),
                    "left" === i || "right" === i ? t.css({
                        top: this.$target.height() / 2
                    }) : ("top" === i || "bottom" === i) && t.css({
                        left: this.$target.width() / 2
                    }),
                    p.arrowOffset && ( - 1 === p.arrowOffset.left || -1 === p.arrowOffset.top ? t.hide() : t.css(p.arrowOffset))
                }
                this._poped = !0,
                this.$element.trigger("shown." + h, [this.$target])
            },
            isTargetLoaded: function() {
                return 0 === this.getTarget().find("i.glyphicon-refresh").length
            },
            getTriggerElement: function() {
                return this.$element
            },
            getTarget: function() {
                if (!this.$target) {
                    var a = f + this._idSeed;
                    this.$target = d(this.options.template).attr("id", a),
                    this._customTargetClass = this.$target.attr("class") !== g ? this.$target.attr("class") : null,
                    this.getTriggerElement().attr("data-target", a)
                }
                return this.$target.data("trigger-element") || this.$target.data("trigger-element", this.getTriggerElement()),
                this.$target
            },
            removeTarget: function() {
                this.$target.remove(),
                this.$target = null,
                this.$contentElement = null
            },
            getTitleElement: function() {
                return this.getTarget().find("." + g + "-title")
            },
            getContentElement: function() {
                return this.$contentElement || (this.$contentElement = this.getTarget().find("." + g + "-content")),
                this.$contentElement
            },
            getTitle: function() {
                return this.$element.attr("data-title") || this.options.title || this.$element.attr("title")
            },
            getUrl: function() {
                return this.$element.attr("data-url") || this.options.url
            },
            getAutoHide: function() {
                return this.$element.attr("data-auto-hide") || this.options.autoHide
            },
            getOffsetTop: function() {
                return q(this.$element.attr("data-offset-top")) || this.options.offsetTop
            },
            getOffsetLeft: function() {
                return q(this.$element.attr("data-offset-left")) || this.options.offsetLeft
            },
            getCache: function() {
                var a = this.$element.attr("data-cache");
                if ("undefined" != typeof a) switch (a.toLowerCase()) {
                case "true":
                case "yes":
                case "1":
                    return ! 0;
                case "false":
                case "no":
                case "0":
                    return ! 1
                }
                return this.options.cache
            },
            getTrigger: function() {
                return this.$element.attr("data-trigger") || this.options.trigger
            },
            getDelayShow: function() {
                var a = this.$element.attr("data-delay-show");
                return "undefined" != typeof a ? a: 0 === this.options.delay.show ? 0 : this.options.delay.show || 100
            },
            getHideDelay: function() {
                var a = this.$element.attr("data-delay-hide");
                return "undefined" != typeof a ? a: 0 === this.options.delay.hide ? 0 : this.options.delay.hide || 100
            },
            getAnimation: function() {
                var a = this.$element.attr("data-animation");
                return a || this.options.animation
            },
            getHideAnimation: function() {
                var a = this.getAnimation();
                return a ? a + "-out": "out"
            },
            setTitle: function(a) {
                var b = this.getTitleElement();
                a ? ("rtl" !== this.options.direction || b.hasClass(j) || b.addClass(j), b.html(a)) : b.remove()
            },
            hasContent: function() {
                return this.getContent()
            },
            canEmptyHide: function() {
                return this.options.hideEmpty && "html" === this.options.type
            },
            getIframe: function() {
                var a = d("<iframe></iframe>").attr("src", this.getUrl()),
                b = this;
                return d.each(this._defaults.iframeOptions,
                function(c) {
                    "undefined" != typeof b.options.iframeOptions[c] && a.attr(c, b.options.iframeOptions[c])
                }),
                a
            },
            getContent: function() {
                if (this.getUrl()) switch (this.options.type) {
                case "iframe":
                    this.content = this.getIframe();
                    break;
                case "html":
                    try {
                        this.content = d(this.getUrl()),
                        this.content.is(":visible") || this.content.show()
                    } catch(a) {
                        throw new Error("Unable to get popover content. Invalid selector specified.")
                    }
                } else if (!this.content) {
                    var b = "";
                    if (b = d.isFunction(this.options.content) ? this.options.content.apply(this.$element[0], [this]) : this.options.content, this.content = this.$element.attr("data-content") || b, !this.content) {
                        var c = this.$element.next();
                        c && c.hasClass(g + "-content") && (this.content = c)
                    }
                }
                return this.content
            },
            setContent: function(a) {
                var b = this.getTarget(),
                c = this.getContentElement();
                "string" == typeof a ? c.html(a) : a instanceof d && (c.html(""), this.options.cache ? a.removeClass(g + "-content").appendTo(c) : a.clone(!0, !0).removeClass(g + "-content").appendTo(c)),
                this.$target = b
            },
            isAsync: function() {
                return "async" === this.options.type
            },
            setContentASync: function(a) {
                var b = this;
                this.xhr || (this.xhr = d.ajax({
                    url: this.getUrl(),
                    type: this.options.async.type,
                    cache: this.getCache(),
                    beforeSend: function(a, c) {
                        b.options.async.before && b.options.async.before(b, a, c)
                    },
                    success: function(c) {
                        b.bindBodyEvents(),
                        a && d.isFunction(a) ? b.content = a.apply(b.$element[0], [c]) : b.content = c,
                        b.setContent(b.content);
                        var e = b.getContentElement();
                        e.removeAttr("style"),
                        b.displayContent(),
                        b.options.async.success && b.options.async.success(b, c)
                    },
                    complete: function() {
                        b.xhr = null
                    },
                    error: function(a, c) {
                        b.options.async.error && b.options.async.error(b, a, c)
                    }
                }))
            },
            bindBodyEvents: function() {
                n || (this.options.dismissible && "click" === this.getTrigger() ? u ? p.off("touchstart.webui-popover").on("touchstart.webui-popover", d.proxy(this.bodyTouchStartHandler, this)) : (p.off("keyup.webui-popover").on("keyup.webui-popover", d.proxy(this.escapeHandler, this)), p.off("click.webui-popover").on("click.webui-popover", d.proxy(this.bodyClickHandler, this))) : "hover" === this.getTrigger() && p.off("touchend.webui-popover").on("touchend.webui-popover", d.proxy(this.bodyClickHandler, this)))
            },
            mouseenterHandler: function(a) {
                var b = this;
                a && this.options.selector && (b = this.delegate(a.currentTarget)),
                b._timeout && clearTimeout(b._timeout),
                b._enterTimeout = setTimeout(function() {
                    b.getTarget().is(":visible") || b.show()
                },
                this.getDelayShow())
            },
            mouseleaveHandler: function() {
                var a = this;
                clearTimeout(a._enterTimeout),
                a._timeout = setTimeout(function() {
                    a.hide()
                },
                this.getHideDelay())
            },
            escapeHandler: function(a) {
                27 === a.keyCode && this.hideAll()
            },
            bodyTouchStartHandler: function(a) {
                var b = this,
                c = d(a.currentTarget);
                c.on("touchend",
                function(a) {
                    b.bodyClickHandler(a),
                    c.off("touchend")
                }),
                c.on("touchmove",
                function() {
                    c.off("touchend")
                })
            },
            bodyClickHandler: function(a) {
                n = !0;
                for (var b = !0,
                c = 0; c < k.length; c++) {
                    var d = r(k[c]);
                    if (d && d._opened) {
                        var e = d.getTarget().offset(),
                        f = e.left,
                        g = e.top,
                        h = e.left + d.getTarget().width(),
                        i = e.top + d.getTarget().height(),
                        j = v(a),
                        l = j.x >= f && j.x <= h && j.y >= g && j.y <= i;
                        if (l) {
                            b = !1;
                            break
                        }
                    }
                }
                b && s()
            },
            initTargetEvents: function() {
                "hover" === this.getTrigger() && this.$target.off("mouseenter mouseleave").on("mouseenter", d.proxy(this.mouseenterHandler, this)).on("mouseleave", d.proxy(this.mouseleaveHandler, this)),
                this.$target.find(".close").off("click").on("click", d.proxy(this.hide, this, !0))
            },
            getPlacement: function(a) {
                var b, c = this.options.container,
                d = c.innerWidth(),
                e = c.innerHeight(),
                f = c.scrollTop(),
                g = c.scrollLeft(),
                h = Math.max(0, a.left - g),
                i = Math.max(0, a.top - f);
                b = "function" == typeof this.options.placement ? this.options.placement.call(this, this.getTarget()[0], this.$element[0]) : this.$element.data("placement") || this.options.placement;
                var j = "horizontal" === b,
                k = "vertical" === b,
                l = "auto" === b || j || k;
                return l ? b = d / 3 > h ? e / 3 > i ? j ? "right-bottom": "bottom-right": 2 * e / 3 > i ? k ? e / 2 >= i ? "bottom-right": "top-right": "right": j ? "right-top": "top-right": 2 * d / 3 > h ? e / 3 > i ? j ? d / 2 >= h ? "right-bottom": "left-bottom": "bottom": 2 * e / 3 > i ? j ? d / 2 >= h ? "right": "left": e / 2 >= i ? "bottom": "top": j ? d / 2 >= h ? "right-top": "left-top": "top": e / 3 > i ? j ? "left-bottom": "bottom-left": 2 * e / 3 > i ? k ? e / 2 >= i ? "bottom-left": "top-left": "left": j ? "left-top": "top-left": "auto-top" === b ? b = d / 3 > h ? "top-right": 2 * d / 3 > h ? "top": "top-left": "auto-bottom" === b ? b = d / 3 > h ? "bottom-right": 2 * d / 3 > h ? "bottom": "bottom-left": "auto-left" === b ? b = e / 3 > i ? "left-top": 2 * e / 3 > i ? "left": "left-bottom": "auto-right" === b && (b = e / 3 > i ? "right-bottom": 2 * e / 3 > i ? "right": "right-top"),
                b
            },
            getElementPosition: function() {
                var a = this.$element[0].getBoundingClientRect(),
                c = this.options.container,
                e = c.css("position");
                if (c.is(b.body) || "static" === e) return d.extend({},
                this.$element.offset(), {
                    width: this.$element[0].offsetWidth || a.width,
                    height: this.$element[0].offsetHeight || a.height
                });
                if ("fixed" === e) {
                    var f = c[0].getBoundingClientRect();
                    return {
                        top: a.top - f.top + c.scrollTop(),
                        left: a.left - f.left + c.scrollLeft(),
                        width: a.width,
                        height: a.height
                    }
                }
                return "relative" === e ? {
                    top: this.$element.offset().top - c.offset().top,
                    left: this.$element.offset().left - c.offset().left,
                    width: this.$element[0].offsetWidth || a.width,
                    height: this.$element[0].offsetHeight || a.height
                }: void 0
            },
            getTargetPositin: function(a, c, d, e) {
                var f = a,
                g = this.options.container,
                h = this.$element.outerWidth(),
                i = this.$element.outerHeight(),
                j = b.documentElement.scrollTop + g.scrollTop(),
                k = b.documentElement.scrollLeft + g.scrollLeft(),
                l = {},
                m = null,
                n = this.options.arrow ? 20 : 0,
                p = 10,
                q = n + p > h ? n: 0,
                r = n + p > i ? n: 0,
                s = 0,
                t = b.documentElement.clientHeight + j,
                u = b.documentElement.clientWidth + k,
                v = f.left + f.width / 2 - q > 0,
                w = f.left + f.width / 2 + q < u,
                x = f.top + f.height / 2 - r > 0,
                y = f.top + f.height / 2 + r < t;
                switch (c) {
                case "bottom":
                    l = {
                        top: f.top + f.height,
                        left: f.left + f.width / 2 - d / 2
                    };
                    break;
                case "top":
                    l = {
                        top: f.top - e,
                        left: f.left + f.width / 2 - d / 2
                    };
                    break;
                case "left":
                    l = {
                        top: f.top + f.height / 2 - e / 2,
                        left: f.left - d
                    };
                    break;
                case "right":
                    l = {
                        top: f.top + f.height / 2 - e / 2,
                        left: f.left + f.width
                    };
                    break;
                case "top-right":
                    l = {
                        top: f.top - e,
                        left: v ? f.left - q: p
                    },
                    m = {
                        left: v ? Math.min(h, d) / 2 + q: o
                    };
                    break;
                case "top-left":
                    s = w ? q: -p,
                    l = {
                        top: f.top - e,
                        left: f.left - d + f.width + s
                    },
                    m = {
                        left: w ? d - Math.min(h, d) / 2 - q: o
                    };
                    break;
                case "bottom-right":
                    l = {
                        top: f.top + f.height,
                        left: v ? f.left - q: p
                    },
                    m = {
                        left: v ? Math.min(h, d) / 2 + q: o
                    };
                    break;
                case "bottom-left":
                    s = w ? q: -p,
                    l = {
                        top: f.top + f.height,
                        left: f.left - d + f.width + s
                    },
                    m = {
                        left: w ? d - Math.min(h, d) / 2 - q: o
                    };
                    break;
                case "right-top":
                    s = y ? r: -p,
                    l = {
                        top: f.top - e + f.height + s,
                        left: f.left + f.width
                    },
                    m = {
                        top: y ? e - Math.min(i, e) / 2 - r: o
                    };
                    break;
                case "right-bottom":
                    l = {
                        top: x ? f.top - r: p,
                        left: f.left + f.width
                    },
                    m = {
                        top: x ? Math.min(i, e) / 2 + r: o
                    };
                    break;
                case "left-top":
                    s = y ? r: -p,
                    l = {
                        top: f.top - e + f.height + s,
                        left: f.left - d
                    },
                    m = {
                        top: y ? e - Math.min(i, e) / 2 - r: o
                    };
                    break;
                case "left-bottom":
                    l = {
                        top: x ? f.top - r: p,
                        left: f.left - d
                    },
                    m = {
                        top: x ? Math.min(i, e) / 2 + r: o
                    }
                }
                return l.top += this.getOffsetTop(),
                l.left += this.getOffsetLeft(),
                {
                    position: l,
                    arrowOffset: m
                }
            }
        },
        d.fn[f] = function(a, b) {
            var c = [],
            g = this.each(function() {
                var g = d.data(this, "plugin_" + f);
                g ? "destroy" === a ? g.destroy() : "string" == typeof a && c.push(g[a]()) : (a ? "string" == typeof a ? "destroy" !== a && (b || (g = new e(this, null), c.push(g[a]()))) : "object" == typeof a && (g = new e(this, a)) : g = new e(this, null), d.data(this, "plugin_" + f, g))
            });
            return c.length ? c: g
        };
        var w = function() {
            var a = function() {
                s()
            },
            b = function(a, b) {
                b = b || {},
                d(a).webuiPopover(b)
            },
            e = function(a) {
                var b = !0;
                return d(a).each(function(a, e) {
                    b = b && d(e).data("plugin_" + f) !== c
                }),
                b
            },
            g = function(a, b) {
                b ? d(a).webuiPopover(b).webuiPopover("show") : d(a).webuiPopover("show")
            },
            h = function(a) {
                d(a).webuiPopover("hide")
            },
            j = function(a) {
                i = d.extend({},
                i, a)
            },
            k = function(a, b) {
                var c = d(a).data("plugin_" + f);
                if (c) {
                    var e = c.getCache();
                    c.options.cache = !1,
                    c.options.content = b,
                    c._opened ? (c._opened = !1, c.show()) : c.isAsync() ? c.setContentASync(b) : c.setContent(b),
                    c.options.cache = e
                }
            },
            l = function(a, b) {
                var c = d(a).data("plugin_" + f);
                if (c) {
                    var e = c.getCache(),
                    g = c.options.type;
                    c.options.cache = !1,
                    c.options.url = b,
                    c._opened ? (c._opened = !1, c.show()) : (c.options.type = "async", c.setContentASync(c.content)),
                    c.options.cache = e,
                    c.options.type = g
                }
            };
            return {
                show: g,
                hide: h,
                create: b,
                isCreated: e,
                hideAll: a,
                updateContent: k,
                updateContentAsync: l,
                setDefaultOptions: j
            }
        } ();
        a.WebuiPopovers = w
    })
} (window, document);
/**
 * switchbox  在switch插件基础上编写, 写成easyui类接口 
 */
(function($){
	function createSwitchBox(target){
        /*text: 'data-text-label',
        onText: 'data-on-label',
        offText: 'data-off-label',
        onClass: 'data-on',
        offClass: 'data-off',
        sizeClass: function (jq, cls) {
            jq.addClass(cls);
        },
        onSwitchChange: function (jq, fn) {
            jq.on('switch-change', fn);
        }*/
        var t = $(target).empty();
        var opts = $.data(target, 'switchbox').options;
        if (!t.hasClass('has-switch')) {
            var h = '';
            if (opts.disabled){
                h +=' disabled ';
            }
            if (opts.checked){
                h +=' checked '
            }
            t.append('<input type="checkbox"'+h+'>');
        }
        if (opts.size=='mini'){
            t.addClass('switch-mini');
        }else if (opts.size=='small'){
            t.addClass('switch-small');
        }else if(opts.size=='large'){
            t.addClass('switch-large');
        }
        t.attr('data-on',opts.onClass);
        t.attr('data-off',opts.offClass);
        t.attr('data-on-label',opts.onText);
        t.attr('data-off-label',opts.offText);
        t.attr('data-animated',opts.animated);
        t.bootstrapSwitch();
        // switch-change
        t.bind('switch-change',function(e,value){
            if (!opts.disabled){
				opts.onSwitchChange.call(this,e,value);
			}
			return false;
        });
    }
	$.fn.switchbox = function(options, param){
		if (typeof options == 'string'){
			return $.fn.switchbox.methods[options](this, param);
		}
		
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'switchbox');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'switchbox', {
					options: $.extend({}, $.fn.switchbox.defaults, $.fn.switchbox.parseOptions(this), options)
				});
				$(this).removeAttr('disabled');
			}
			createSwitchBox(this);
		});
	};
	
	$.fn.switchbox.methods = {
		options: function(jq){
			return $.data(jq[0], 'switchbox').options;
        },
        /*obj.on = function (eventString, fn) {
            if (eventString === 'switchChange') {
                that.unbind('switch-change');
                that.on('switch-change', fn);
            }
            return jqSwitch;
        };*/
        /* toggle--disabled*/
		toggleActivation:function(jq){
            return jq.each(function(){
                $(this).bootstrapSwitch('toggleActivation');
            });
        },
		/* toggle--isEnabled*/
        isActive:function(jq){
            //cryze 2018-3-8
            //return jq.each(function(){
            //    $(this).bootstrapSwitch('isActive');
            //});
            return jq.eq(0).bootstrapSwitch('isActive');
        },
		/*set enable*/
        setActive:function(jq,value){
            return jq.each(function(){
                $(this).bootstrapSwitch('setActive',value);
            });
        },
        toggle:function(jq){
            return jq.each(function(){
                $(this).bootstrapSwitch('toggleState');
            });
        },
        setValue:function(jq,value,skipOnChange){ /*增加是否触发事件入参skipOnChange*/
            return jq.each(function(){
                $(this).bootstrapSwitch('setState',value,skipOnChange||true);
            });
        },
        getValue:function(jq){
            //cryze 2018-3-8
            //return jq.each(function(){
            //   $(this).bootstrapSwitch('status');
            //});
            return jq.eq(0).bootstrapSwitch('status');
        },
        setOnText:function(jq,value){
            return jq.each(function(){
                $(this).bootstrapSwitch('setOnLabel',value);
            });
        },
        setOffText:function(jq,value){
            return jq.each(function(){
                $(this).bootstrapSwitch('setOffLabel',value);
            });
        },
        setOnClass:function(jq,value){
            return jq.each(function(){
                $(this).bootstrapSwitch('setOnClass',value);
            });
        },
        setOffClass:function(jq,value){
            return jq.each(function(){
                $(this).bootstrapSwitch('setOffClass',value);
            });
        },
		destroy:function(jq){
            return jq.each(function(){
                $(this).bootstrapSwitch('destroy');
            });
        }
    };
    
	$.fn.switchbox.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, 
			['id','iconCls','iconAlign','group','size',{plain:'boolean',toggle:'boolean',selected:'boolean'}]
		), {
			disabled: (t.attr('disabled') ? true : undefined)
		});
	};
	
	$.fn.switchbox.defaults = {
		id: null,
		disabled: false,
        checked:true,
        animated:false,
		size: 'mini',	//mini  small,large
        onText:'开',     // <i class='icon-ok icon-white'></i>
        offText:'关',    // <i class='icon-remove'></i>
        onClass:'success', // primary info success warning danger 
        offClass:'warning',
        onSwitchChange:function(event,value){}
	};
	
})(jQuery);

/**
 * 兼容IE6,IE8
 */
(function($){
	function createCheckBox(target){
        var t = $(target).empty();
        var state= $.data(target, 'checkbox');
        var opts =state.options;
        if (!opts.id){
            opts.id=opts.label;
            t.attr("id",opts.id);
        }
        t.prop("disabled",opts.disabled);
        t.prop("checked",opts.checked);
        opts.originalValue = t.prop("checked");   //将初始状态值记录下来 cryze 2019-04-04
        if (!t.hasClass('checkbox-f')){
            t.addClass('checkbox-f');                //在原dom增加类checkbox-f
            var labelHtml = '<label class="checkbox';
            if (opts.disabled){labelHtml += ' disabled'; }
            if (opts.checked){labelHtml += ' checked'; }
            labelHtml += '">'+opts.label+'</label>';
            var objlabel = $(labelHtml).insertAfter(t);
            objlabel.unbind('click').bind('click.checkbox',function(e){
                if($(target).prop("disabled")==false) setValue(target,!$(this).hasClass('checked'));  
            });
            t.unbind('click').bind('click.checkbox',function(e){ 
                //如果原生checkbox是disabled时,不会进入
                //if ($(this).prop("disabled")==false){
                    var val = $(this).is(':checked');
                    if(val){
                        if (opts.onChecked) opts.onChecked.call(this,e,true);
                    }else{
                        if (opts.onUnchecked) opts.onUnchecked.call(this,e,false);
                    }
                    if (opts.onCheckChange) opts.onCheckChange.call(this,e,val);
                //}
                //e.stopPropagation();
                //return false;
            });
            var assignedLabels=$('label[for="' + opts.id + '"]').add(t.closest('label')) ; //for= 或checkbox在label内
            if (assignedLabels.length) {
                assignedLabels.off('.checkbox').on('click.checkbox mouseover.checkbox mouseout.checkbox ', function (event) {
                  var type = event['type'],
                    item = $(this);
                  if (!$(target).prop("disabled")) {
                    if (type == 'click') {
                      if ($(event.target).is('a')) {
                        return;
                      }
                      setValue(target,!objlabel.hasClass('checked')); //此处也和objlabel 点击取值一致
                    } else {
                      // mouseout|touchend
                      if (/ut|nd/.test(type)) {
                        objlabel.removeClass('hover');
                      } else {
                        objlabel.addClass('hover');
                      }
                    }
                    return false;
                  }
                });
              }


            state.proxy=objlabel; //把objlabel存起来

        }else{
            
            var objlabel=state.proxy; //取到对应label
            if (opts.disabled && !objlabel.hasClass('disabled')) objlabel.addClass('disabled');
            if (!opts.disabled && objlabel.hasClass('disabled')) objlabel.removeClass('disabled');

            if (opts.checked && !objlabel.hasClass('checked')) objlabel.addClass('checked');
            if (!opts.checked && objlabel.hasClass('checked')) objlabel.removeClass('checked');

            if (opts.label!=objlabel.text()) objlabel.text(opts.label);
            
        }
        var lastState=$.data(target, 'checkbox'); //cryze 2019-4-15
        // cryze 2019-4-15 第二次初始化时 调用iCheck 通过$.data(ele,name,data) 缓存的数据会丢失 再存回去
        $.data(target, 'checkbox',lastState);
        t.hide();
    }
    /*通过直接改变checkbox的值，或者用form.reset()  会出现样式和选中状态不一致的现象  
    *如checkbox未选中 样式选中  这时想调用取消选中方法发现无效果 
    *在 check uncheck setValue toggle 后调用 fixCls 同步样式
    *add cryze 2019-04-04
    */
    function fixCls(target){
        //新版如果直接改原生组件值 同样有问题
        var objlabel= ($.data(target, 'checkbox')||$.data(target, 'radio')||{})['proxy'];
        if (objlabel){
            if ($(target).prop('checked') && !objlabel.hasClass('checked')) objlabel.addClass('checked');
            if (!$(target).prop('checked') && objlabel.hasClass('checked')) objlabel.removeClass('checked');
        }
    }
	$.fn.checkbox = function(options, param){
		if (typeof options == 'string'){
			return $.fn.checkbox.methods[options](this, param);
		}
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'checkbox');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'checkbox', {
					options: $.extend({}, $.fn.checkbox.defaults, $.fn.checkbox.parseOptions(this), options)
				});
			}
			createCheckBox(this);
		});
	};
	function setValue(target,val) {
        if (val != $(target).is(":checked")){
            if ($(target).prop("disabled")==true){
                //disabled时: 1.测试发现icheck可以setValue,建卡--默认密码勾; 2.不trigger事件
                $(target).prop("disabled",false);
                $(target).prop("checked",val);
                $(target).prop("disabled",true);
            }
            var objlabel= ($.data(target, 'checkbox')||$.data(target, 'radio')||{})['proxy'];
            if (val){
                objlabel.addClass('checked');
            }else{
                objlabel.removeClass('checked');
            }
            $(target).trigger('click.checkbox');
        }
        fixCls(target);
    }
    function getValue(target){
        return $(target).is(':checked');
    }
    function setDisable(target,value){  //设置禁用状态 cryze 2019-08-27
        value=(value==true);
        var state= $.data(target, 'checkbox')||$.data(target, 'radio')||{};
        var objlabel=state.proxy;
        if (objlabel) {
            $(target).prop("disabled",value);
            if (value) objlabel.addClass('disabled');
            else objlabel.removeClass('disabled');
            state.options.disabled=value;
        }
    }

	$.fn.checkbox.methods = {
		options: function(jq){
			return $.data(jq[0], 'checkbox').options;
        },
        setValue:function(jq,value){
            return jq.each(function(){
                setValue(this,value);
                fixCls(this);
            });
        },
        getValue:function(jq){
            return getValue(jq[0]);
            //return jq.eq(0).is(':checked');  
            //checkbox 是先改变checkBox的状态，触发事件，改变样式 ,原本getValue取是否有样式类,在onChecked事件获取会获取到未选中  所以getValue改为取checked的状态
            //return jq.eq(0).parent().hasClass("checked")?true:false; 
        },
        setDisable:function(jq,value){
            return jq.each(function(){
                setDisable(this,value);
            });
        },
        check:function(jq){
            return jq.each(function(){
                setValue(this,true);
            });
        },
        uncheck:function(jq){
            return jq.each(function(){
                setValue(this,false);
            });
        },
        toggle:function(jq){
            return jq.each(function(){
                setValue(this,!getValue(this));
            });
        },
        disable:function(jq){
            return jq.each(function(){
                setDisable(this,true);
            });
        },
        enable:function(jq){
            return jq.each(function(){
                setDisable(this,false);
            });
        },
        indeterminate:function(jq){ //第三状态
            return jq.each(function(){
                //$(this).iCheck('indeterminate');
            });
        },
        determinate:function(jq){
            return jq.each(function(){
                //$(this).iCheck('determinate');
            });
        },
        update:function(jq){},
        destroy:function(jq){},
        clear:function(jq){ //cryze 2019-04-04 add clear 
            return jq.each(function(){
                setValue(this,false);
            });
        },
        reset:function(jq){  //cryze 2019-04-04 add reset 
            return jq.each(function(){
                var originalValue = $(this).checkbox('options').originalValue||false;
                setValue(this,originalValue);
            });
        }
    };
    
	$.fn.checkbox.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target,["label","name","id","checked"]), {
			disabled: (t.attr('disabled') ? true : undefined)
		});
	};
	
    $.fn.checkbox.defaults = {
        id:null,
        label:'',
		disabled:false,
        checked:false,
        onCheckChange:null,
        onChecked:null,
        onUnchecked:null
	};
})(jQuery);
/**
 * 兼容IE6,IE8 
 */
(function($){
	function createRadio(target){
        var t = $(target).empty();
        var state=$.data(target, 'radio');
        var opts = state.options;
        if (!opts.id){
            opts.id=opts.label;
            t.attr("id",opts.id);
        }
        if(opts.name!="") t.attr("name",opts.name);
        t.prop("disabled",opts.disabled);
        t.prop("checked",opts.checked);
        
        opts.originalValue = t.prop("checked");   //将初始状态值记录下来 cryze 2019-04-04
        if (!t.hasClass('radio-f')){
            t.addClass('radio-f')                //在原dom增加类radio-f
            var labelHtml = '<label class="radio';
            if (opts.radioClass){ labelHtml+=" hischeckbox_square-blue";}
            if (opts.disabled){ labelHtml += ' disabled';}
            if (opts.checked){ labelHtml += ' checked';}
            labelHtml += '">'+opts.label+'</label>';
            var objlabel = $(labelHtml).insertAfter(t);
            /**事件转到input上*/
            objlabel.unbind('click').bind('click.radio',function(e){
                setValue(target,!$(this).hasClass('checked'));
            });
            t.unbind('click').bind('click.radio',function(e){
                if ($(this).prop("disabled")==false){
                    //setValue(this,!$(this).is(':checked'));
                    var val = $(this).is(':checked');
                    if (val){
                        if (opts.onChecked) opts.onChecked.call(this,e,true);
                    }else{
                        //if (opts.onUnchecked) opts.onUnchecked.call(this,e,false);
                    }
                    if (opts.onCheckChange) opts.onCheckChange.call(this,e,val);
                }
                //e.stopPropagation();
                //return false;
            }).bind('ifChecked',function(e,value){ //原生事件太怪了 自定义事件处理
                if (!($(this).prop("disabled"))){
                    if (opts.onChecked) opts.onChecked.call(this,e,value);
                }
                return false;
            }).bind('ifUnchecked',function(e,value){
                if (!($(this).prop("disabled"))){
                    if (opts.onUnchecked) opts.onUnchecked.call(this,e,value);
                }
                return false;
            }).bind('ifToggled',function(e, value){
                if (!($(this).prop("disabled"))){
                    if (opts.onCheckChange) opts.onCheckChange.call(this,e,value);
                }
                return false;            
            });
            var assignedLabels=$('label[for="' + opts.id + '"]').add(t.closest('label')) ; //for= 或radio在label内
            if (assignedLabels.length) {
                assignedLabels.off('.radio').on('click.radio mouseover.radio mouseout.radio ', function (event) {
                  var type = event['type'],
                    item = $(this);
                  if (!$(target).prop("disabled")) {
                    if (type == 'click') {
                      if ($(event.target).is('a')) {
                        return;
                      }
                      setValue(target,!objlabel.hasClass('checked')); //此处也和objlabel 点击取值一致
                    } else {
                      // mouseout|touchend
                      if (/ut|nd/.test(type)) {
                        objlabel.removeClass('hover');
                      } else {
                        objlabel.addClass('hover');
                      }
                    }
                    return false;
                  }
                });
              }


            state.proxy=objlabel; //把objlabel存起来


        }else{
            var objlabel=state.proxy; //取到对应label
            if (opts.disabled && !objlabel.hasClass('disabled')) objlabel.addClass('disabled');
            if (!opts.disabled && objlabel.hasClass('disabled')) objlabel.removeClass('disabled');

            if (opts.checked && !objlabel.hasClass('checked')) objlabel.addClass('checked');
            if (!opts.checked && objlabel.hasClass('checked')) objlabel.removeClass('checked');

            if (opts.label!=objlabel.text()) objlabel.text(opts.label);
        }
        var lastState=$.data(target, 'radio'); //cryze 2019-4-15
        // cryze 2019-4-15 第二次初始化时 调用iCheck 通过$.data(ele,name,data) 缓存的数据会丢失 再存回去
        $.data(target, 'radio',lastState);
        t.hide();
    }
    /*通过直接改变radio的值，或者用form.reset()  会出现样式和选中状态不一致的现象  
    *如radio未选中 样式选中  这时想调用取消选中方法发现无效果 
    *在 check uncheck setValue toggle 后调用 fixCls 同步样式
    *add cryze 2019-04-04
    */
    function fixCls(target){
        //新版如果直接改原生组件值 同样有问题
        var objlabel= ($.data(target, 'radio')||$.data(target, 'checkbox')||{})['proxy'];
        if (objlabel){
            if ($(target).prop('checked') && !objlabel.hasClass('checked')) objlabel.addClass('checked');
            if (!$(target).prop('checked') && objlabel.hasClass('checked')) objlabel.removeClass('checked');
        }
    }
	$.fn.radio = function(options, param){
		if (typeof options == 'string'){
			return $.fn.radio.methods[options](this, param);
		}
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'radio');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'radio', {
					options: $.extend({}, $.fn.radio.defaults, $.fn.radio.parseOptions(this), options)
                });
			}
			createRadio(this);
		});
    };
    /**
     * 
     * @param {*} target 
     * @param {*} val 
     * @param {*} force 通过点击 不允许设置未选中  但是允许通过js调用setValue
     */
	function setValue(target,val,force) {
        var t=$(target);
        if (val!=t.is(":checked")) { 
            var objlabel= ($.data(target, 'radio')||$.data(target, 'checkbox')||{})['proxy'];
            if (val==true){ //on
                var name = $(target).attr('name');
                if (name ){
                    var form = t.closest('form'),
                    inputs = 'input[name="' + name + '"]';
                    inputs = form.length ? form.find(inputs) : $(inputs);

                    inputs.each(function () {
                        if (this !== target && $.data(this,'radio') ) {
                            setValue(this,false,true);
                        }
                    });
                }
                objlabel.addClass('checked');
                $(target).prop('checked',true).trigger('ifChecked',true).trigger('ifToggled',true);
            }else{
                if (force) {
                    objlabel.removeClass('checked');
                    $(target).prop('checked',false).trigger('ifUnchecked',false).trigger('ifToggled',false); 
                }
            }
        }
        fixCls(target); 
    }
    function getValue(target){
        return $(target).is(':checked');
    }
    function setDisable(target,value){  //设置禁用状态 cryze 2019-08-27
        value=(value==true);
        var state= $.data(target, 'radio')||$.data(target, 'checkbox')||{};
        var objlabel=state.proxy;
        if (objlabel) {
            $(target).prop("disabled",value);
            if (value) objlabel.addClass('disabled');
            else objlabel.removeClass('disabled');
            state.options.disabled=value;
        }
    }
	$.fn.radio.methods = {
		options: function(jq){
			return $.data(jq[0], 'radio').options;
        },
        setValue:function(jq,value){
            return jq.each(function(){
                setValue(this,value,true);
            });
        },
        getValue:function(jq){
            return getValue(jq[0]);
            //return jq.eq(0).is(':checked');  //radio 是先改变radio的状态，触发事件，改变样式  所以getValue取checked状态
            //return jq.eq(0).parent().hasClass("checked")?true:false; 
        },
        setDisable:function(jq,value){
            return jq.each(function(){
                setDisable(this,value);
            });
        },
        check:function(jq){
            return jq.each(function(){
                setValue(this,true,true);
            });
        },
        uncheck:function(jq){
            return jq.each(function(){
                setValue(this,false,true);
            });
        },
        toggle:function(jq){
            return jq.each(function(){
                setValue(this,!getValue(this),true);
            });
        },
        disable:function(jq){
            return jq.each(function(){
                setDisable(this,true);
            });
        },
        enable:function(jq){
            return jq.each(function(){
                setDisable(this,false);
            });
        },
        indeterminate:function(jq){ //第三状态
            return jq.each(function(){
                
            });
        },
        determinate:function(jq){
            return jq.each(function(){
                
            });
        },
        update:function(jq){
           
        },
        destroy:function(jq){
            
        },clear:function(jq){ //cryze 2019-04-04 add clear 
            return jq.each(function(){
                setValue(this,false,true);
            });
        },reset:function(jq){  //cryze 2019-04-04 add reset 
            return jq.each(function(){
                var originalValue=$(this).radio('options').originalValue||false;
                setValue(this,originalValue,true);
            });
        }
    };
    
	$.fn.radio.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target,['label','id','name','checked']), {
			disabled: (t.attr('disabled') ? true : undefined)
		});
	};
	
    $.fn.radio.defaults = {
        id:null,
        label:'',
        name:'',
        radioClass:"",
		disabled:false,
        checked:false,
        onCheckChange:null,
        onChecked:null
	};
	
})(jQuery);

/**
 * 仿照easyui1.5 filebox功能 不依赖textbox组件
 */
(function ($) {
    $.parser.plugins.push('filebox');
    var _56e = 0;

    function _56f(_570) {
        var _571 = $.data(_570, "filebox");
        var opts = _571.options;
        opts.fileboxId = "filebox_file_id_" + (++_56e);
        $(_570).addClass("filebox-f").hide();
        var span = $("<span class=\"filebox\">" + "<input class=\"filebox-text\" autocomplete=\"off\">" + "<input type=\"hidden\" class=\"filebox-value\">" + "</span>").insertAfter(_570);
        var name = $(_570).attr("name");
        if (name) {
            span.find("input.filebox-value").attr("name", name);
            $(_570).removeAttr("name").attr("fileboxName", name);
        }
        if(opts.disabled) span.addClass('disabled');
        var btn = $("<a href=\"javascript:;\" class=\"filebox-button\"></a>").prependTo(span);
        btn.addClass("filebox-button-" + opts.buttonAlign).linkbutton({
            text: opts.buttonText,
            iconCls: opts.buttonIcon,
            onClick: function () {
                opts.onClickButton.call(_570);
            },
            disabled:opts.disabled
        });

        var text=span.find("input.filebox-text");
        text.attr("readonly", "readonly").attr('placeholder',opts.prompt||'');
        _571.filebox = $(_570).next();
        var file = _572(_570);

        if (btn.length) {
            $("<label class=\"filebox-label\" for=\"" + opts.fileboxId + "\"></label>").appendTo(btn);
            if (btn.linkbutton("options").disabled) {
                file.attr("disabled", "disabled");
            } else {
                file.removeAttr("disabled");
            }
        }
        span._outerWidth(opts.width)._outerHeight(opts.height);
        var textWidth=span.width()-btn.outerWidth();
        
        text._outerWidth(textWidth).css({height:span.height()+'px',lineHeight:span.height()+'px',marginLeft:(opts.buttonAlign=='left'?btn.outerWidth():0)+'px' });
        
    };

    function _572(_573) {
        var _574 = $.data(_573, "filebox");
        var opts = _574.options;
        _574.filebox.find(".filebox-value").remove();
        opts.oldValue = "";
        var file = $("<input type=\"file\" class=\"filebox-value\">").appendTo(_574.filebox);
        file.attr("id", opts.fileboxId).attr("name", $(_573).attr("fileboxName") || "");
        file.attr("accept", opts.accept);
        file.attr("capture", opts.capture);
        if (opts.multiple) {
            file.attr("multiple", "multiple");
        }
        file.change(function () {
            var _575 = this.value;
            if (this.files) {
                _575 = $.map(this.files, function (file) {
                    return file.name;
                }).join(opts.separator);
            }
            $(_573).filebox("setText", _575);
            opts.onChange.call(_573, _575, opts.oldValue);
            opts.oldValue = _575;
        });
        return file;
    };
    function disable(dom){
        var _574 = $.data(dom, "filebox");
        var opts = _574.options;
        var span=_574.filebox;
        span.addClass('disabled');
        var btn=span.find(".filebox-button");
        btn.linkbutton('disable');
        var file=span.find('.filebox-value');
        file.attr("disabled", "disabled");
        opts.disabled=true;
    }
    function enable(dom){
        var _574 = $.data(dom, "filebox");
        var opts = _574.options;
        var span=_574.filebox;
        span.removeClass('disabled');
        var btn=span.find(".filebox-button");
        btn.linkbutton('enable');
        var file=span.find('.filebox-value');
        file.removeAttr("disabled");
        opts.disabled=false;
    }
    $.fn.filebox = function (_576, _577) {
        if (typeof _576 == "string") {
            var _578 = $.fn.filebox.methods[_576];
            return _578(this, _577);
            
        }
        _576 = _576 || {};
        return this.each(function () {
            var _579 = $.data(this, "filebox");
            if (_579) {
                $.extend(_579.options, _576);
            } else {
                $.data(this, "filebox", {
                    options: $.extend({}, $.fn.filebox.defaults, $.fn.filebox.parseOptions(this), _576)
                });
            }
            _56f(this);
        });
    };
    $.fn.filebox.methods = {
        options: function (jq) {
            return $.data(jq[0], "filebox").options;
        },
        clear: function (jq) {
            return jq.each(function () {
                _572(this);
                $(this).filebox("setText",'');
            });
        },
        reset: function (jq) {
            return jq.each(function () {
                $(this).filebox("clear");
            });
        },
        setValue: function (jq) {
            return jq;
        },
        setValues: function (jq) {
            return jq;
        },
        files: function (jq) {
            return jq.next().find(".filebox-value")[0].files;
        },
        setText:function(jq,text){
            return jq.each(function () {
                $.data(this, "filebox").filebox.find(".filebox-text").val(text);
            });
        },
        button:function(jq){
            return $.data(jq[0], "filebox").filebox.find(".filebox-button");
        },
        disable:function(jq){
            return jq.each(function () {
                disable(this);
            });
        },
        enable:function(jq){
            return jq.each(function () {
                enable(this);
            });
        }
    };
    $.fn.filebox.parseOptions = function (_57a) {
        var t = $(_57a);
        return $.extend({}, $.parser.parseOptions(_57a, ["width","height","prompt","accept", "capture", "separator"]), {
            multiple: (t.attr("multiple") ? true : undefined),
            disabled: (t.attr("disabled") ? true : undefined)
        });
    };
    $.fn.filebox.defaults = $.extend({}, {
        buttonIcon: null,
        buttonText: "Choose File",
        buttonAlign: "right",
        inputEvents: {},
        accept: "",
        capture: "",
        separator: ",",
        multiple: false,
        prompt:'',
        width:'177',
        height:'30',
        disabled:false,
        onClickButton:function(){},
        onChange:function(){}
    });
})(jQuery);
/**
 * popover  在web-popover插件基础上编写, 写成hisui类接口 
 */
(function($){
	function createPopover(target){
        var t = $(target);
        var opts = $.data(target, 'popover').options;
        if (!opts.id){
            opts.id=opts.label;
            t.attr("id",opts.id);
        }
        t.prop("disabled",opts.disabled);
        t.webuiPopover(opts);
        /*t.bind('ifChecked',function(e,value){
            if (!opts.disabled){
                if (opts.onChecked) opts.onChecked.call(this,e,value);
			}
			return false;
        }).bind('ifUnchecked',function(e,value){
            if (!opts.disabled){
                if (opts.onUnchecked) opts.onUnchecked.call(this,e,value);
			}
			return false;
        })*/
    }
	$.fn.popover = function(options, param){
		if (typeof options == 'string'){
			return $.fn.popover.methods[options](this, param);
		}
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'popover');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'popover', {
					options: $.extend({}, $.fn.popover.defaults, $.fn.popover.parseOptions(this), options)
				});
			}
			createPopover(this);
		});
	};
	
	$.fn.popover.methods = {
		options: function(jq){
			return $.data(jq[0], 'popover').options;
        },
        show:function(jq){
            return jq.each(function(){
                var _t = $(this);
                _t.webuiPopover('show');
            });
        },
        hide:function(jq){
            return jq.each(function(){
                var _t = $(this);
                _t.webuiPopover('hide');
            });
        },
        destroy:function(jq){
            return jq.each(function(){
                $(this).webuiPopover('destroy');
            });
        }
    };
	$.fn.popover.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target,["id"]), {
			disabled: (t.attr('disabled') ? true : undefined)
		});
	};
    $.fn.popover.defaults = {
        id:null,
        disabled:false,
        placement:'auto',//values: auto,top,right,bottom,left,top-right,top-left,bottom-right,bottom-left,auto-top,auto-right,auto-bottom,auto-left,horizontal,vertical
        container: document.body,// The container in which the popover will be added (i.e. The parent scrolling area). May be a jquery object, a selector string or a HTML element. See https://jsfiddle.net/1x21rj9e/1/
        width:'auto',//can be set with  number
        height:'auto',//can be set with  number
        trigger:'click',//values:  click,hover,manual(handle events by your self),sticky(always show after popover is created);
        selector:false,// jQuery selector, if a selector is provided, popover objects will be delegated to the specified. 
        style:'',//values:'',inverse
        animation:null, //pop with animation,values: pop,fade (only take effect in the browser which support css3 transition)
        delay: {//show and hide delay time of the popover, works only when trigger is 'hover',the value can be number or object
            show: null,
            hide: 300
        },
        async: {
            type:'GET', // ajax request method type, default is GET
            before: function(that, xhr) {},//executed before ajax request
            success: function(that, data) {},//executed after successful ajax request
            error: function(that, xhr, data) {} //executed after error ajax request
        },
        cache:true,//if cache is set to false,popover will destroy and recreate
        multi:false,//allow other popovers in page at same time
        arrow:true,//show arrow or not
        title:'',//the popover title, if title is set to empty string,title bar will auto hide
        content:'',//content of the popover,content can be function
        closeable:false,//display close button or not
        direction:'', // direction of the popover content default is ltr ,values:'rtl';
        padding:true,//content padding
        type:'html',//content type, values:'html','iframe','async'
        url:'',//if type equals 'html', value should be jQuery selecor.  if type equels 'async' the plugin will load content by url.
        backdrop:false,//if backdrop is set to true, popover will use backdrop on open
        dismissible:true, // if popover can be dismissed by  outside click or escape key
        autoHide:false, // automatic hide the popover by a specified timeout, the value must be false,or a number(1000 = 1s).
        offsetTop:0,  // offset the top of the popover
        offsetLeft:0,  // offset the left of the popover
        onShow: function($element) {}, // callback after show
        onHide: function($element) {} // callback after hide
	};
})(jQuery);

/**
 * HISUI
 * lookup - HISUI
 * 
 * Dependencies:
 *   datagrid
 */
(function ($) {
    $.parser.plugins.push('lookup');

	var GLOBAL_LOOKUP_GRID_ID="hisui_lookup_grid";
    var GLOBAL_LOOKUP_PANEL_ID="hisui_lookup_panel";
    var GLOBAL_LOOKUP_ROWTIP_ID="hisui_lookup_rowtip";
	var GLOBAL_LOOKUP_LAST_TARGET;
	var GLOBAL_LOOKUP_CURRENT_TARGET;
    function create(target) {
        var state = $.data(target, "lookup");
		var opts = state.options;
        $(target).addClass("lookup-text").attr("autocomplete","off"); //.hide();
        $(target).wrap("<span class=\"lookup\"></span>");
		$("<span><span class=\"lookup-arrow\"></span></span>").insertAfter(target);
		state.lookup=$(target).parent('.lookup');
		state.panel=$('#'+GLOBAL_LOOKUP_PANEL_ID);
		state.grid=$('#'+GLOBAL_LOOKUP_GRID_ID);
	};
	function initLookupPanel(){
		if ($('#'+GLOBAL_LOOKUP_PANEL_ID).length>0) return;
        var _848 = $("<div id='"+GLOBAL_LOOKUP_PANEL_ID+"' class=\"lookup-panel\"></div>").appendTo("body");
        _848.panel({
            doSize: false, closed: true, cls: "lookup-p", style: { position: "absolute", zIndex: 10 }, onOpen: function () {
                var p = $(this).panel("panel");
                if ($.fn.menu) {
                    p.css("z-index", $.fn.menu.defaults.zIndex++);
                } else {
                    if ($.fn.window) {
                        p.css("z-index", $.fn.window.defaults.zIndex++);
                    }
                }
				//$(this).panel("resize");
				lookupPanelOnOpen();
            }, onBeforeClose: function () {
                _854(this);
            }, onClose: function () {
                var _849 = $.data(GLOBAL_LOOKUP_CURRENT_TARGET, "lookup");
                if (GLOBAL_LOOKUP_CURRENT_TARGET) {
                    _849.options.onHidePanel.call(GLOBAL_LOOKUP_CURRENT_TARGET);
                }
                $('#'+GLOBAL_LOOKUP_ROWTIP_ID).hide(); //panel关掉时 隐藏提示div
            }
		});
		if ($('#'+GLOBAL_LOOKUP_GRID_ID).length>0) return;
        var grid = $("<table id='"+GLOBAL_LOOKUP_GRID_ID+"'></table>").appendTo(_848);
        $("<div id='"+GLOBAL_LOOKUP_ROWTIP_ID+"' class=\"lookup-rowtip\" style='top:-100px;'></div>").appendTo("body");
	}
	function lookupPanelOnOpen(){
		var lastTarget=GLOBAL_LOOKUP_LAST_TARGET;
		var target=GLOBAL_LOOKUP_CURRENT_TARGET;
		if ($(lastTarget).is($(target)) ) return true;
        doPanelResize(target); //add cryze 2019-07-07 由于共用一个panel,打开时调整大小
        var state = $.data(target, "lookup");
		var opts = state.options;
		var grid = state.grid;
        if (!opts.columns && typeof opts.columnsLoader=="function") opts.columns=opts.columnsLoader();
        try {
            grid.datagrid('options').onLoadSuccess=function(){};
            grid.datagrid('loadData',{total:0,rows:[]});
            grid.datagrid('clearSelections').datagrid('highlightRow',-1);
        }catch (e){
        }
        /** title是input的提示,不是grid的title*/ 
        var gridTitle = "";
        if (opts.gridTitle){
            gridTitle = opts.gridTitle;
        }
		grid.datagrid($.extend({}, opts, {title:gridTitle,
            border: false, fit: true, singleSelect: (!opts.multiple), onLoadSuccess: function (data) {
                if (state.panel.is(':visible')){
                    $(target).focus();
                    grid.datagrid("highlightRow", 0);
                }
                opts.onLoadSuccess.apply(target, arguments);
            }, onClickRow: _908, onSelect: function (_909, row) {
                var t=this;
                setTimeout(function(){
                    _90a();  //直接调用 _90a 内部getSelections实际还无法获取到
                    opts.onSelect.call(t, _909, row);
                },0)

            }, onUnselect: function (_90b, row) {
                _90a();
                opts.onUnselect.call(this, _90b, row);
            }, onSelectAll: function (rows) {
                _90a();
                opts.onSelectAll.call(this, rows);
            }, onUnselectAll: function (rows) {
                if (opts.multiple) {
                    _90a();
                }
                opts.onUnselectAll.call(this, rows);
            },lazy:true
            ,onHighlightRow:function(index,row){
                var html=opts.selectRowRender.call(this,row);
                if (typeof html!='string') html='';
                if (html==''){
                    $('#'+GLOBAL_LOOKUP_ROWTIP_ID).empty().css({'top':'-100px'});
                }else{
                    $('#'+GLOBAL_LOOKUP_ROWTIP_ID).html(html);
                    fixRowtipStyle();
                }
            }
        }));
        state.previousValue=undefined;
		

        function _908(_90c, row) {
            state.remainText = false;
            //触发顺序 点击行 选中行 触发grid的onSelect 设置text 调用lookup配置项onSelect 触发grid onClickRow走到这儿 设置text 触发lookup的onClickRow
            //_90a();  //cryze 2018-7-3 用户自己写的处理放在了onSelect 所以在这儿不再调用_90a设置值
            if (!opts.multiple) {
                $(target).lookup("hidePanel");
            }
            opts.onClickRow.call(this, _90c, row);
        };
        function _90a() {
            var rows = grid.datagrid("getSelections");
            var vv = [], ss = [];
            for (var i = 0; i < rows.length; i++) {
                //vv.push(rows[i][opts.idField]);
                ss.push(rows[i][opts.textField]);
			}
			/*
            if (!opts.multiple) {
                $(target).lookup("setValues", (vv.length ? vv : [""]));
            } else {
                $(target).lookup("setValues", vv);
            }*/
            if (!state.remainText) {
                $(target).lookup("setText", ss.join(opts.separator));
            }
        };
    }
    function fixRowtipStyle(){
        var panel=$('#'+GLOBAL_LOOKUP_PANEL_ID);
        var tip=$('#'+GLOBAL_LOOKUP_ROWTIP_ID);
        if (panel.is(':visible')){
            if (tip.html()=="") {
                tip.css({top:-100});
                return
            }
            tip.show();
            var panelP=panel.parent();
            var left=parseFloat(panelP.css('left')),
                top=parseFloat(panelP.css('top'))+panelP._outerHeight()-1,
                zIndex=panelP.css('z-index'),
                outerWidth=panelP._outerWidth();
                tip.show().css({top:top+'px',left:left+'px','z-index':zIndex})._outerWidth(outerWidth);
        }else{
            tip.hide();
        }
    }
	function doResize(target, t_width) {
        var state = $.data(target, "lookup");
        var opts = state.options;
        var _842 = state.lookup;
        var _843 = state.panel;
        if (t_width) {
            opts.width = t_width;
        }
        if (isNaN(opts.width)) {
            var c = $(target).clone();
            c.css("visibility", "hidden");
            c.appendTo("body");
            opts.width = c.outerWidth();
            c.remove();
        }
        var _844 = _842.find("input.lookup-text");
        var _845 = _842.find(".lookup-arrow");
        var _846 = opts.hasDownArrow ? _845._outerWidth() : 0;
        _842._outerWidth(opts.width)._outerHeight(opts.height);
        _844._outerWidth(_842.width() - _846);
        _844.css({ height: _842.height() + "px", lineHeight: _842.height() + "px" });
        _845._outerHeight(_842.height());
        //_843.panel("resize", { width: (opts.panelWidth ? opts.panelWidth : _842.outerWidth()), height: opts.panelHeight });
        doPanelResize(target); //cryze 2019-07-17

    };
    /**
     * 把调整panel大小独立出来 2019-07-17 cryze
     * @param {*} target 
     */
    function doPanelResize(target){
        var state = $.data(target, "lookup");
        var opts = state.options;
        var $lookup = state.lookup;
        var $panel = state.panel;
        var currPanelWidth=$panel.panel('options').width||0,currPanelHeight=$panel.panel('options').height||0;
        var panelWidth=opts.panelWidth ? opts.panelWidth : $lookup.outerWidth(),panelHeight=opts.panelHeight;
        if (currPanelWidth!=panelWidth || currPanelHeight!=panelHeight) {
            opts.panelWidth=panelWidth;
            $panel.panel("resize", { width: panelWidth, height: panelHeight });
        }
        
    }

	function _854(_855) {  //这个在easyui的combogrid 应该是考虑嵌套combo的
		return;  //lookup 先不考虑嵌套的
        $(_855).find(".combo-f").each(function () {
            var p = $(this).combo("panel");
            if (p.is(":visible")) {
                p.panel("close");
            }
        });
    };
	function eventCreate(target) {
        var _858 = $.data(target, "lookup");
        var opts = _858.options;
        var _859 = _858.panel;
        var _85a = _858.lookup;
        var _85b = _85a.find(".lookup-text");
        var _85c = _85a.find(".lookup-arrow");
        $(document).unbind(".lookup").bind("mousedown.lookup", function (e) {
            var p = $(e.target).closest("span.lookup,div.lookup-p");
            if (p.length) {
				_854(p);
				//考虑一种情况 现在显示的是A，点击B输入框 应关闭A
				if (p.find('.lookup-text').length>0 && !p.find('.lookup-text').is($(GLOBAL_LOOKUP_CURRENT_TARGET)) ) $("body>div.lookup-p>div.lookup-panel:visible").panel("close");
                return;
			}
            $("body>div.lookup-p>div.lookup-panel:visible").panel("close");
        });
        _85b.unbind(".lookup");
        _85c.unbind(".lookup");
        if (!opts.disabled && !opts.readonly) {
            _85b.bind("click.lookup", function (e) {
                if (!opts.editable) {
                    _85d.call(this);
                } else {
                    var p = $(this).closest("div.lookup-panel");
                    $("div.lookup-panel:visible").not(_859).not(p).panel("close");
                }
            }).bind("keydown.lookup paste.lookup drop.lookup", function (e) {
                switch (e.keyCode) {
                    case 33:
                        opts.keyHandler.pageUp.call(target, e);
                        break;
                    case 34:
                        opts.keyHandler.pageDown.call(target, e);
                        break;
                    case 38:
                        opts.keyHandler.up.call(target, e);
                        break;
                    case 40:
                        opts.keyHandler.down.call(target, e);
                        break;
                    case 37:
                        opts.keyHandler.left.call(target, e);
                        break;
                    case 39:
                        opts.keyHandler.right.call(target, e);
                        break;
                    case 13:
                        e.preventDefault();
                        opts.keyHandler.enter.call(target, e);
                        return false;
                    case 9:
                    case 27:
                        hidePanel(target);
                        break;
                    default:
                        //输入字符查询走的是这儿   要判断长度 所以要用setTimeout(fn,0)
                        setTimeout(
                            function (){
                                if (!opts.isCombo) return;
                                if (opts.minQueryLen>0 && _85b.val().length<opts.minQueryLen) return;
                                if (opts.editable) {
                                    if (_858.timer) {
                                        clearTimeout(_858.timer);
                                    }
                                    _858.timer = setTimeout(function () {
                                        var q = _85b.val();
                                        if (_858.previousValue != q) {
                                            _858.previousValue = q;
                                            if (opts.onBeforeShowPanel.call(target)===false) return;  //cryze 2018-6-14
                                            $(target).lookup("showPanel");
                                            opts.keyHandler.query.call(target, _85b.val(), e);
                                            $(target).lookup("validate");
                                        }
                                    }, opts.delay);
                                }
                            },0);
                }
            });
            _85c.bind("click.lookup", function () {
                _85d.call(this);
            }).bind("mouseenter.lookup", function () {
                $(this).addClass("lookup-arrow-hover");
            }).bind("mouseleave.lookup", function () {
                $(this).removeClass("lookup-arrow-hover");
            });
        }

        function _85d() {    
            if (_859.is(":visible")) {
                hidePanel(target);
            } else {
                var p = $(this).closest("div.lookup-panel");
                $("div.lookup-panel:visible").not(_859).not(p).panel("close");
                
                if (opts.onBeforeShowPanel.call(target)===false) return;  //cryze 2018-6-14
				$(target).lookup("showPanel");
				//下拉走查询
				var q = _85b.val();
				if (opts.queryOnSameQueryString ||_858.previousValue != q) {
					_858.previousValue = q;
					opts.keyHandler.query.call(target, _85b.val());
				}
				$(target).lookup("validate");
            }
            _85b.focus();
        };
	};
	/**
	 * 下拉面板显示
	 */
    function showPanel(_860) {
        var _861 = $.data(_860, "lookup");
        var opts = _861.options;
        //if(opts.onBeforeShowPanel.call(_860)===false) return; // 不能单纯地在这儿阻止,有些是和showPanel完全在一起的动作，不打开panel,那些动作也不要
		GLOBAL_LOOKUP_LAST_TARGET=GLOBAL_LOOKUP_CURRENT_TARGET;
		GLOBAL_LOOKUP_CURRENT_TARGET=_860;
        var _862 = _861.lookup;
		var _863 = _861.panel;
		var panelOpts=_863.panel('options');
		panelOpts.lookupTarget=_860;
        _863.panel("move", { left: _864(), top: _865() });
        if (_863.panel("options").closed) {
            _863.panel("open");
            opts.onShowPanel.call(_860);
        }
        fixRowtipStyle();
        (function () {
            if (panelOpts.lookupTarget == _860 && _863.is(":visible")) {
                _863.panel("move", { left: _864(), top: _865() });
                fixRowtipStyle();
                setTimeout(arguments.callee, 200);
            }
        })();
        function _864() {
            var left = _862.offset().left;
            if (opts.panelAlign == "right") {
                left += _862._outerWidth() - _863._outerWidth();
            }
            if (left + _863._outerWidth() > $(window)._outerWidth() + $(document).scrollLeft()) {
                left = $(window)._outerWidth() + $(document).scrollLeft() - _863._outerWidth();
            }
            if (left < 0) {
                left = 0;
            }
            return left;
        };
        function _865() {
            var top = _862.offset().top + _862._outerHeight();
            if (top + _863._outerHeight() > $(window)._outerHeight() + $(document).scrollTop()) {
                top = _862.offset().top - _863._outerHeight();
            }
            if (top < $(document).scrollTop()) {
                top = _862.offset().top + _862._outerHeight();
            }
            return top;
        };
	};
	/**
	 * 下拉面板隐藏
	 */
    function hidePanel(_866) {
        var _867 = $.data(_866, "lookup").panel;
        _867.panel("close");
        
	};
	/**
	 * 上下移动选择
	 * @param {*} _90d 
	 * @param {*} dir 
	 */
    function nav(_90d, dir) {
        var _90e = $.data(_90d, "lookup");
        var opts = _90e.options;
        var grid = _90e.grid;
        var _90f = grid.datagrid("getRows").length;
        if (!_90f) {
            return;
        }
        var tr = opts.finder.getTr(grid[0], null, "highlight");
        if (!tr.length) {
            tr = opts.finder.getTr(grid[0], null, "selected");
        }
        var _910;
        if (!tr.length) {
            _910 = (dir == "next" ? 0 : _90f - 1);
        } else {
            var _910 = parseInt(tr.attr("datagrid-row-index"));
            _910 += (dir == "next" ? 1 : -1);
            if (_910 < 0) {
                _910 = _90f - 1;
            }
            if (_910 >= _90f) {
                _910 = 0;
            }
        }
        grid.datagrid("highlightRow", _910);
        if (opts.selectOnNavigation) {   //selectOnNavigation 上下移动是否选择行 
            _90e.remainText = false;
            grid.datagrid("selectRow", _910);
        }
    };
    /**
     * 翻页
     */
    function page(target,dir){
        var state = $.data(target, "lookup");
        var opts = state.options;
        var grid = state.grid;
        dir=(dir=="prev"?"prev":"next");
        var btn=grid.datagrid('getPager').find('.l-btn-icon.pagination-'+dir)
        if (btn.parents('.l-btn-disabled').length==0){
            btn.click();
            //grid.datagrid("highlightRow", 0);   //cryze  加上样式应在loadSuccess
        }
    }
    function _911(_912, _913, _914) {
        var _915 = $.data(_912, "lookup");
        var opts = _915.options;
        var grid = _915.grid;
        var rows = grid.datagrid("getRows");
        var ss = [];
        //var _916 = $(_912).combo("getValues");
		//var _917 = $(_912).combo("options");
		var _917=opts;
        var _918 = _917.onChange;
        _917.onChange = function () {
        };
        grid.datagrid("clearSelections");
        for (var i = 0; i < _913.length; i++) {
            var _919 = grid.datagrid("getRowIndex", _913[i]);
            if (_919 >= 0) {
                grid.datagrid("selectRow", _919);
                ss.push(rows[_919][opts.textField]);
            } else {
                ss.push(_913[i]);
            }
        }
        //$(_912).combo("setValues", _916);
        _917.onChange = _918;
        //$(_912).combo("setValues", _913);
        if (!_914) {
            var s = ss.join(opts.separator);
            if ($(_912).lookup("getText") != s) {
                $(_912).lookup("setText", s);
            }
        }
	};
	/**
	 * query 
	 */
    function _91a(_91b, q) {
        var _91c = $.data(_91b, "lookup");
        var opts = _91c.options;
        var grid = _91c.grid;
        
        _91c.remainText = true;
        if (opts.multiple && !q) {
            _911(_91b, [], true);
        } else {
            _911(_91b, [q], true);
        }
        if (opts.mode == "remote") {
            grid.datagrid('loadData',{rows:[],total:0});  //重新从后台查数据前，清空数据
            grid.datagrid("clearSelections");
            grid.datagrid("load", $.extend({}, opts.queryParams, { q: q }));
        } else {
            if (!q) {
                return;
            }
            grid.datagrid("clearSelections").datagrid("highlightRow", -1);
            var rows = grid.datagrid("getRows");
            var qq = opts.multiple ? q.split(opts.separator) : [q];
            $.map(qq, function (q) {
                q = $.trim(q);
                if (q) {
                    $.map(rows, function (row, i) {
                        if (q == row[opts.textField]) {
                            grid.datagrid("selectRow", i);
                        } else {
                            if (opts.filter.call(_91b, q, row)) {
                                grid.datagrid("highlightRow", i);
                            }
                        }
                    });
                }
            });
        }
	};
	/**
	 * 回车事件
	 */
    function _91d(target) {
        var state = $.data(target, "lookup");
        var opts = state.options;
		var grid = state.grid;
		var panel =state.panel;
		if(panel.is(':visible') && $(target).is($(GLOBAL_LOOKUP_CURRENT_TARGET))){
			var tr = opts.finder.getTr(grid[0], null, "highlight");
			state.remainText = false;
			if (tr.length) {
				var _920 = parseInt(tr.attr("datagrid-row-index"));
				if (opts.multiple) {
					if (tr.hasClass("datagrid-row-selected")) {
						grid.datagrid("unselectRow", _920);
					} else {
						grid.datagrid("selectRow", _920);
					}
				} else {
					grid.datagrid("selectRow", _920);
				}
			}
			var vv = [];
			$.map(grid.datagrid("getSelections"), function (row) {
				vv.push(row[opts.idField]);
			});
			//$(target).lookup("setValues", vv);
			if (!opts.multiple) {
				$(target).lookup("hidePanel");
			}
		}else{
			if (panel.is(':visible')) {
				$(target).lookup("hidePanel");
				
            }
            if (opts.onBeforeShowPanel.call(target)===false) return;  //cryze 2018-6-14
			$(target).lookup("showPanel");
            var q = $(target).val();
			if (opts.queryOnSameQueryString ||state.previousValue != q) {
				state.previousValue = q;
				opts.keyHandler.query.call(target, q);
			}
			$(target).lookup("validate");
		}	

	};
	/**
	 *  初始化validatebox
	 */
	function initValidatebox(_869) {
        var opts = $.data(_869, "lookup").options;
        $(_869).validatebox($.extend({}, opts, { deltaX: (opts.hasDownArrow ? opts.deltaX : (opts.deltaX > 0 ? 1 : -1)) }));
	};
	function setText(_87a, text) {
        var _87b = $.data(_87a, "lookup");
        var _87c = _87b.lookup.find("input.lookup-text");
        if (_87c.val() != text) {
            _87c.val(text);
            $(_87a).lookup("validate");
            _87b.previousValue = text;
        }
    };
    /**
     * 切换disabled状态 修改样式
     */
    function toggleDisabled(target, disabled) {
        var _86d = $.data(target, "lookup");
        var opts = _86d.options;
        var _86e = _86d.lookup;
        if (disabled) {
            opts.disabled = true;
            $(target).attr("disabled", true);
            _86e.find(".lookup-value").attr("disabled", true);
            _86e.find(".lookup-text").attr("disabled", true);
            _86e.addClass('disabled');
        } else {
            opts.disabled = false;
            $(target).removeAttr("disabled");
            _86e.find(".lookup-value").removeAttr("disabled");
            _86e.find(".lookup-text").removeAttr("disabled");
            _86e.removeClass('disabled');
        }
    };
    function toggleReadonly(target, mode) {
        var _870 = $.data(target, "lookup");
        var opts = _870.options;
        opts.readonly = mode == undefined ? true : mode;
        var _871 = opts.readonly ? true : (!opts.editable);
        _870.lookup.find(".lookup-text").attr("readonly", _871).css("cursor", _871 ? "pointer" : "");
    };
    /**
     * 初始化 readonly 和 disabled
     */
    function initState(target) {
        var _84c = $.data(target, "lookup");
        var opts = _84c.options;
        var _84d = _84c.lookup;
        if (opts.hasDownArrow) {
            _84d.find(".lookup-arrow").show();
        } else {
            _84d.find(".lookup-arrow").hide();
        }
        toggleDisabled(target, opts.disabled);
        toggleReadonly(target, opts.readonly);
    };
    $.fn.lookup = function (_921, _922) {
        if (typeof _921 == "string") {
            var _923 = $.fn.lookup.methods[_921];
            if (_923) {
                return _923(this, _922);
            } else {
				//return this.combo(_921, _922);
				return this.each(function () {
                    $(this).validatebox(_921, _922);
                });
            }
        }
        _921 = _921 || {};
        return this.each(function () {
            var _924 = $.data(this, "lookup");
            if (_924) {
                $.extend(_924.options, _921);
                initLookupPanel();
                GLOBAL_LOOKUP_CURRENT_TARGET=null;  //cryze 2018-07-31
                GLOBAL_LOOKUP_LAST_TARGET=this;
            } else {
                _924 = $.data(this, "lookup", { options: $.extend({}, $.fn.lookup.defaults, $.fn.lookup.parseOptions(this), _921) });
                initLookupPanel();
                create(this);
            }
			//initLookupPanel();
            //create(this);
            initState(this);
			doResize(this);
			eventCreate(this);
			initValidatebox(this);

        });
	};

    $.fn.lookup.methods = {
        options: function (jq) {
            return $.data(jq[0], "lookup").options;
        }, grid: function (jq) {   //此方法虽存在，但是获取的grid未必对应此lookup 因为所有的lookup都使用一个grid
            return $.data(jq[0], "lookup").grid;
        }, panel:function(jq){   //此方法虽存在，但是获取的panel未必对应此lookup 因为所有的lookup都使用一个panel
            return $.data(jq[0], "lookup").panel;
        },setText: function (jq, text) {
            return jq.each(function () {
                setText(this, text);
            });
        }, getText:function(jq){
            return jq.eq(0).val();
        },clear: function (jq) {
            return jq.each(function () {
                $(this).lookup("grid").datagrid("clearSelections");
                $(this).val('');
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).lookup("options");
                $(this).lookup("setText", opts.originalValue);
            });
        } ,resize: function (jq,width) {
            return jq.each(function () {
                doResize(this,width);
            });
        }, showPanel: function (jq) {
            return jq.each(function () {
                var opts=$.data(this,"lookup").options;
                if (opts.onBeforeShowPanel.call(this)===false) return;  //cryze 2018-6-14
                showPanel(this);
            });
        }, hidePanel: function (jq) {
            return jq.each(function () {
                hidePanel(this);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                toggleDisabled(this, true);
                eventCreate(this);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                toggleDisabled(this, false);
                eventCreate(this);
            });
        }, readonly: function (jq, mode) {
            return jq.each(function () {
                toggleReadonly(this, mode);
                eventCreate(this);
            });
        }, isValid: function (jq) {
            return jq.eq(0).validatebox("isValid");
        }
    };
    $.fn.lookup.parseOptions = function (_928) {
		var t = $(_928);
        var temp= $.extend({}, $.fn.validatebox.parseOptions(_928), $.parser.parseOptions(_928, ["title","width", "height", "separator", "panelAlign", { panelWidth: "number", editable: "boolean", hasDownArrow: "boolean", delay: "number", selectOnNavigation: "boolean" }]), { panelHeight: (t.attr("panelHeight") == "auto" ? "auto" : parseInt(t.attr("panelHeight")) || undefined), multiple: (t.attr("multiple") ? true : undefined), disabled: (t.attr("disabled") ? true : undefined), readonly: (t.attr("readonly") ? true : undefined), value: (t.val() || undefined) });
        temp.originalValue=temp.value;
        return $.extend({}, temp, $.fn.datagrid.parseOptions(_928), $.parser.parseOptions(_928, ["idField", "textField", "mode",{isCombo:"boolean",minQueryLen:'number'}]));
    };
    $.fn.lookup.defaults = $.extend({}, $.fn.combo.defaults, $.fn.datagrid.defaults, {
        loadMsg: null, idField: null, textField: null, mode: "local", keyHandler: {
            up: function (e) {
                nav(this, "prev");
                e.preventDefault();
            }, down: function (e) {
                nav(this, "next");
                e.preventDefault();
            }, left: function (e) {
            }, right: function (e) {
            }, enter: function (e) {
                _91d(this);
            }, query: function (q, e) {
                _91a(this, q);
            },pageUp: function(e){
                page(this,"prev");
                e.preventDefault();
            },pageDown: function(e){
                page(this,"next");
                e.preventDefault();
            }
        }, filter: function (q, row) {
            var opts = $(this).lookup("options");
            return row[opts.textField].toLowerCase().indexOf(q.toLowerCase()) == 0;
		},width: "auto", height: 30, panelWidth: 350, panelHeight: 200, panelAlign: "left", multiple: false, selectOnNavigation: false, separator: ",", editable: true, disabled: false, readonly: false, hasDownArrow: true, value: "", delay: 200, deltaX: 19
		, onShowPanel: function () {
        }, onHidePanel: function () {
        }, onChange: function (_899, _89a) {  //以前combo有，现在没有 考虑..
        },
        isCombo:false,
        minQueryLen:0,
        queryOnSameQueryString: true //当查询条件相同时，在回车和点击按钮是否查询
        ,onBeforeShowPanel:function(){
        },selectRowRender:function(row){ //高亮一行数据时 显示提示内容html
        }
    });
})(jQuery);

(function($){
	/**
	 * @param {Document} target
	 * @param {String} labedid id1-id2-id3
	 * @returns 返回id对应的json
	*/
	function getLabelItem(target, labelid){
		var opts = $.data(target, 'keywords').options;
		var items = opts.items;
		var labelidArr = labelid.split("-");
		if (labelidArr.length==1){
			return items[labelidArr[0]];
		}
		if(labelidArr.length==2){
			return items[labelidArr[0]].items[labelidArr[1]];
		}
		if (labelidArr.length==3){
			return items[labelidArr[0]].items[labelidArr[1]].items[labelidArr[2]];
		}
	}
	function createKeywords(target){
		var t = $(target).empty();
		var opts = $.data(target, 'keywords').options;
		if(opts.labelCls!='blue') t.addClass("keywords-label"+opts.labelCls);
		var html = '';
		$.each(opts.items,function(indc,chp){
			if(chp.type=="chapter"){
				html +='<div class="kw-chapter">';
				if(chp.text!="") html += '<a></a>'+chp.text; //章节为空时,不显示前台蓝条
				html +='</div><div class="kw-line"></div>';
				$.each(chp.items,function(inds,sec){
					if(sec.type=='section'){
						html +='<div class="kw-section"><div class="kw-section-header">'+sec.text+'</div>';
						if (sec.items){
							html += '<ul class="kw-section-list keywords">';
						}
						$.each(sec.items, function(indl,lbl){
							var s = lbl.selected?'class="selected"':'';
							html += '<li id="'+(lbl.id||lbl.text)+'" rowid="'+indc+'-'+inds+'-'+indl+'" '+s+'><a>'+lbl.text+'</a></li>'
						});
						if (sec.items){
							html +='</ul>'
						}
						html += '</div>' //kw-section end
					}else{ //默认label
						if (inds==0) {html += '<ul class="kw-section-list keywords">';}
						var s = sec.selected?'class="selected"':'';
						html += '<li id="'+(sec.id||sec.text)+'" rowid="'+indc+'-'+inds+'" '+s+'><a>'+sec.text+'</a></li>';
						if (inds==(chp.items.length-1)) html +='</ul>';
					}
				});
			}else if(chp.type=="section"){
				html +='<div class="kw-section"><div class="kw-section-header">'+chp.text+'</div>';
				if (chp.items){
					html += '<ul class="kw-section-list keywords">';
				}
				$.each(chp.items, function(indl,lbl){
					var s = lbl.selected?'class="selected"':'';
					html += '<li id="'+(lbl.id||lbl.text)+'" rowid="'+indc+'-'+indl+'" '+s+'><a>'+lbl.text+'</a></li>'
				});
				if (chp.items){
					html +='</ul>'
				}
				html += '</div>' //kw-section end
			}else{
				if (indc==0) {html += '<ul class="kw-section-list keywords">';}
				var s = chp.selected?'class="selected"':'';
				html += '<li id="'+(chp.id||chp.text)+'" rowid="'+indc+'" '+s+'><a>'+chp.text+'</a></li>';
				if (indc==(opts.items.length-1)) html +='</ul>';
			}
		});
		t.append(html);
        t.off('click').on('click','ul.kw-section-list>li',function(e,value){
			var id = $(this).attr('id');
			selectById(target,id);
			return false;
        });
	}
	
	$.fn.keywords = function(options, param){
		if (typeof options == 'string'){
			return $.fn.keywords.methods[options](this, param);
		}
		options = options || {};
		return this.each(function(){
			var state = $.data(this, 'keywords');
			if (state){
				$.extend(state.options, options);
			} else {
				$.data(this, 'keywords', {
					options: $.extend({}, $.fn.keywords.defaults, $.fn.keywords.parseOptions(this), options)
				});
			}
			createKeywords(this);
		});
	};
	function selectById(t,id){
		var target = $(t);
		var opts = $.data(t, 'keywords').options;
		if(opts.singleSelect){
			target.find('li.selected').removeClass('selected');
		}
		var _t = target.find('li#'+id);
		_t.toggleClass('selected');
		var item = getLabelItem(t, _t.attr("rowid"));
		opts.onClick.call(this, item);
		if (!opts.singleSelect){ //单选不进入select与unselect事件
			if(_t.hasClass('selected')){
				opts.onSelect.call(this,item);
			}else{
				opts.onUnselect.call(this,item);
			}
		}
	}
	function clearSelected(target){
		console.log(target);
		$(target).find('li.selected').removeClass('selected');
	}
	function getAllSelected(target){
		var rs=[];
		$(target).find('li.selected').each(function(){
			rs.push(getLabelItem(target, $(this).attr("rowid")));
		});
		return rs;
	}
	$.fn.keywords.methods = {
		options: function(jq){
			return $.data(jq[0], 'keywords').options;
		},
		getSelected:function(jq){
			return getAllSelected(jq[0]);
		},
		select:function(jq,id){
			return selectById(jq[0],id);
		},
		switchById:function(jq,id){
			return selectById(jq[0],id);
		},
		clearAllSelected:function(jq,id){
			jq.each(function(ind,item){
				clearSelected(item);
			});
		}
    };
    
	$.fn.keywords.parseOptions = function(target){
		var t = $(target);
		return $.extend({}, $.parser.parseOptions(target, 
			['id','iconCls','iconAlign','group','size',{plain:'boolean',toggle:'boolean',selected:'boolean'}]
		), {
			disabled: (t.attr('disabled') ? true : undefined)
		});
	};
	
	$.fn.keywords.defaults = {
		singleSelect:false,
        labelCls:'blue', //red
		onClick:function(value){},
		onUnselect:function(value){},
		onSelect:function(value){}
	};
})(jQuery);

(function ($) {
    function init(_3fc) {
        $(_3fc).addClass("triggerbox-f").hide();
        var span = $("<span class=\"triggerbox\"></span>").insertAfter(_3fc);
        var _3fd = $("<input type=\"text\" class=\"triggerbox-text\">").appendTo(span);
        $("<span><span class=\"triggerbox-button\"></span></span>").appendTo(span);
        var name = $(_3fc).attr("name");
        if (name) {
            _3fd.attr("name", name);
            $(_3fc).removeAttr("name").attr("triggerboxName", name);
        }
        return span;
    };
    function _3fe(_3ff, _400) {
        var opts = $.data(_3ff, "triggerbox").options;
        var sb = $.data(_3ff, "triggerbox").triggerbox;
        if (_400) {
            opts.width = _400;
        }
        sb.appendTo("body");
        if (isNaN(opts.width)) {
            opts.width = sb._outerWidth();
        }
        var _401 = sb.find("span.triggerbox-button");
        if (_401 && 'string' == typeof opts.icon){
            _401.addClass(opts.icon);
        }
        var _402 = sb.find("input.triggerbox-text");
        sb._outerWidth(opts.width)._outerHeight(opts.height);
        _402._outerWidth(sb.width() - _401._outerWidth());
        _402.css({ height: sb.height() + "px", lineHeight: sb.height() + "px" });
       
        _401._outerHeight(sb.height());
        sb.insertAfter(_3ff);
    };
    function _409(_40a) {
        var _40b = $.data(_40a, "triggerbox");
        var opts = _40b.options;
        var _40c = _40b.triggerbox.find("input.triggerbox-text");
        var _40d = _40b.triggerbox.find(".triggerbox-button");
        _40c.unbind(".triggerbox");
        _40d.unbind(".triggerbox");
        if (!opts.disabled) {
            _40c.bind("blur.triggerbox", function (e) {
                opts.value = $(this).val();
                if (opts.value == "") {
                    $(this).val(opts.prompt);
                    $(this).addClass("triggerbox-prompt");
                } else {
                    $(this).removeClass("triggerbox-prompt");
                }
            }).bind("focus.triggerbox", function (e) {
                if ($(this).val() != opts.value) {
                    $(this).val(opts.value);
                }
                $(this).removeClass("triggerbox-prompt");
            });
            _40d.bind("click.triggerbox", function () {
                opts.handler.call(_40a, opts.value, _40c._propAttr("name"));
            }).bind("mouseenter.triggerbox", function () {
                $(this).addClass("triggerbox-button-hover");
            }).bind("mouseleave.triggerbox", function () {
                $(this).removeClass("triggerbox-button-hover");
            });
        }
    };
    function _40e(_40f, _410) {
        var _411 = $.data(_40f, "triggerbox");
        var opts = _411.options;
        var _412 = _411.triggerbox.find("input.triggerbox-text");
        if (_410) {
            opts.disabled = true;
            $(_40f).attr("disabled", true);
            _412.attr("disabled", true);
            _411.triggerbox.addClass("disabled");
        } else {
            opts.disabled = false;
            $(_40f).removeAttr("disabled");
            _412.removeAttr("disabled");
            _411.triggerbox.removeClass("disabled");
        }
    };
    function _413(_414) {
        var _415 = $.data(_414, "triggerbox");
        var opts = _415.options;
        var _416 = _415.triggerbox.find("input.triggerbox-text");
        opts.originalValue = opts.value;
        if (opts.value) {
            _416.val(opts.value);
            _416.removeClass("triggerbox-prompt");
        } else {
            _416.val(opts.prompt);
            _416.addClass("triggerbox-prompt");
        }
    };
    $.fn.triggerbox = function (_417, _418) {
        if (typeof _417 == "string") {
            return $.fn.triggerbox.methods[_417](this, _418);
        }
        _417 = _417 || {};
        return this.each(function () {
            var _419 = $.data(this, "triggerbox");
            if (_419) {
                $.extend(_419.options, _417);
            } else {
                _419 = $.data(this, "triggerbox", { options: $.extend({}, $.fn.triggerbox.defaults, $.fn.triggerbox.parseOptions(this), _417), triggerbox: init(this) });
            }
            _413(this);
            _409(this);
            _40e(this, _419.options.disabled);
            _3fe(this);
        });
    };
    $.fn.triggerbox.methods = {
        options: function (jq) {
            return $.data(jq[0], "triggerbox").options;
        }, textbox: function (jq) {
            return $.data(jq[0], "triggerbox").triggerbox.find("input.triggerbox-text");
        }, getValue: function (jq) {
            return $.data(jq[0], "triggerbox").options.value;
        }, setValue: function (jq, _41a) {
            return jq.each(function () {
                $(this).triggerbox("options").value = _41a;
                $(this).triggerbox("textbox").val(_41a);
                $(this).triggerbox("textbox").blur();
            });
        }, clear: function (jq) {
            return jq.each(function () {
                $(this).triggerbox("setValue", "");
            });
        }, reset: function (jq) {
            return jq.each(function () {
                var opts = $(this).triggerbox("options");
                $(this).triggerbox("setValue", opts.originalValue);
            });
        }, getName: function (jq) {
            return $.data(jq[0], "triggerbox").triggerbox.find("input.triggerbox-text").attr("name");
        }, destroy: function (jq) {
            return jq.each(function () {
                $.data(this, "triggerbox").triggerbox.remove();
                $(this).remove();
            });
        }, resize: function (jq, _41b) {
            return jq.each(function () {
                _3fe(this, _41b);
            });
        }, disable: function (jq) {
            return jq.each(function () {
                _40e(this, true);
                _409(this);
            });
        }, enable: function (jq) {
            return jq.each(function () {
                _40e(this, false);
                _409(this);
            });
        }
    };
    $.fn.triggerbox.parseOptions = function (_41c) {
        var t = $(_41c);
        var w = t._outerWidth(); //wanghc 增加宽度定义
        return $.extend({}, $.parser.parseOptions(_41c, ["width", "height", "prompt"]), { width:w,value: (t.val() || undefined), disabled: (t.attr("disabled") ? true : undefined), handler: (t.attr("handler") ? eval(t.attr("handler")) : undefined) });
    };
    $.fn.triggerbox.defaults = {
        icon:"icon-w-trigger-box",width: "auto", height: 30, prompt: "", value: "", disabled: false, handler: function (_41d, name) {}
    };
})(jQuery);
/**
 * 获取首字母 
 * 源自web/scripts/GetPY.js
 */
(function ($) {
    //汉字拼音首字母列表 本列表包含了20902个汉字,用于配合 ToChineseSpell 
    //函数使用,本表收录的字符的Unicode编码范围为19968至40869, XDesigner 整理
    var strChineseFirstPY = "YDYQSXMWZSSXJBYMGCCZQPSSQBYCDSCDQLDYLYBSSJGYZZJJFKCCLZDHWDWZJLJPFYYNWJJTMYHZWZHFLZPPQHGSCYYYNJQYXXGJHHSDSJNKKTMOMLCRXYPSNQSECCQZGGLLYJLMYZZSECYKYYHQWJSSGGYXYZYJWWKDJHYCHMYXJTLXJYQBYXZLDWRDJRWYSRLDZJPCBZJJBRCFTLECZSTZFXXZHTRQHYBDLYCZSSYMMRFMYQZPWWJJYFCRWFDFZQPYDDWYXKYJAWJFFXYPSFTZYHHYZYSWCJYXSCLCXXWZZXNBGNNXBXLZSZSBSGPYSYZDHMDZBQBZCWDZZYYTZHBTSYYBZGNTNXQYWQSKBPHHLXGYBFMJEBJHHGQTJCYSXSTKZHLYCKGLYSMZXYALMELDCCXGZYRJXSDLTYZCQKCNNJWHJTZZCQLJSTSTBNXBTYXCEQXGKWJYFLZQLYHYXSPSFXLMPBYSXXXYDJCZYLLLSJXFHJXPJBTFFYABYXBHZZBJYZLWLCZGGBTSSMDTJZXPTHYQTGLJSCQFZKJZJQNLZWLSLHDZBWJNCJZYZSQQYCQYRZCJJWYBRTWPYFTWEXCSKDZCTBZHYZZYYJXZCFFZZMJYXXSDZZOTTBZLQWFCKSZSXFYRLNYJMBDTHJXSQQCCSBXYYTSYFBXDZTGBCNSLCYZZPSAZYZZSCJCSHZQYDXLBPJLLMQXTYDZXSQJTZPXLCGLQTZWJBHCTSYJSFXYEJJTLBGXSXJMYJQQPFZASYJNTYDJXKJCDJSZCBARTDCLYJQMWNQNCLLLKBYBZZSYHQQLTWLCCXTXLLZNTYLNEWYZYXCZXXGRKRMTCNDNJTSYYSSDQDGHSDBJGHRWRQLYBGLXHLGTGXBQJDZPYJSJYJCTMRNYMGRZJCZGJMZMGXMPRYXKJNYMSGMZJYMKMFXMLDTGFBHCJHKYLPFMDXLQJJSMTQGZSJLQDLDGJYCALCMZCSDJLLNXDJFFFFJCZFMZFFPFKHKGDPSXKTACJDHHZDDCRRCFQYJKQCCWJDXHWJLYLLZGCFCQDSMLZPBJJPLSBCJGGDCKKDEZSQCCKJGCGKDJTJDLZYCXKLQSCGJCLTFPCQCZGWPJDQYZJJBYJHSJDZWGFSJGZKQCCZLLPSPKJGQJHZZLJPLGJGJJTHJJYJZCZMLZLYQBGJWMLJKXZDZNJQSYZMLJLLJKYWXMKJLHSKJGBMCLYYMKXJQLBMLLKMDXXKWYXYSLMLPSJQQJQXYXFJTJDXMXXLLCXQBSYJBGWYMBGGBCYXPJYGPEPFGDJGBHBNSQJYZJKJKHXQFGQZKFHYGKHDKLLSDJQXPQYKYBNQSXQNSZSWHBSXWHXWBZZXDMNSJBSBKBBZKLYLXGWXDRWYQZMYWSJQLCJXXJXKJEQXSCYETLZHLYYYSDZPAQYZCMTLSHTZCFYZYXYLJSDCJQAGYSLCQLYYYSHMRQQKLDXZSCSSSYDYCJYSFSJBFRSSZQSBXXPXJYSDRCKGJLGDKZJZBDKTCSYQPYHSTCLDJDHMXMCGXYZHJDDTMHLTXZXYLYMOHYJCLTYFBQQXPFBDFHHTKSQHZYYWCNXXCRWHOWGYJLEGWDQCWGFJYCSNTMYTOLBYGWQWESJPWNMLRYDZSZTXYQPZGCWXHNGPYXSHMYQJXZTDPPBFYHZHTJYFDZWKGKZBLDNTSXHQEEGZZYLZMMZYJZGXZXKHKSTXNXXWYLYAPSTHXDWHZYMPXAGKYDXBHNHXKDPJNMYHYLPMGOCSLNZHKXXLPZZLBMLSFBHHGYGYYGGBHSCYAQTYWLXTZQCEZYDQDQMMHTKLLSZHLSJZWFYHQSWSCWLQAZYNYTLSXTHAZNKZZSZZLAXXZWWCTGQQTDDYZTCCHYQZFLXPSLZYGPZSZNGLNDQTBDLXGTCTAJDKYWNSYZLJHHZZCWNYYZYWMHYCHHYXHJKZWSXHZYXLYSKQYSPSLYZWMYPPKBYGLKZHTYXAXQSYSHXASMCHKDSCRSWJPWXSGZJLWWSCHSJHSQNHCSEGNDAQTBAALZZMSSTDQJCJKTSCJAXPLGGXHHGXXZCXPDMMHLDGTYBYSJMXHMRCPXXJZCKZXSHMLQXXTTHXWZFKHCCZDYTCJYXQHLXDHYPJQXYLSYYDZOZJNYXQEZYSQYAYXWYPDGXDDXSPPYZNDLTWRHXYDXZZJHTCXMCZLHPYYYYMHZLLHNXMYLLLMDCPPXHMXDKYCYRDLTXJCHHZZXZLCCLYLNZSHZJZZLNNRLWHYQSNJHXYNTTTKYJPYCHHYEGKCTTWLGQRLGGTGTYGYHPYHYLQYQGCWYQKPYYYTTTTLHYHLLTYTTSPLKYZXGZWGPYDSSZZDQXSKCQNMJJZZBXYQMJRTFFBTKHZKBXLJJKDXJTLBWFZPPTKQTZTGPDGNTPJYFALQMKGXBDCLZFHZCLLLLADPMXDJHLCCLGYHDZFGYDDGCYYFGYDXKSSEBDHYKDKDKHNAXXYBPBYYHXZQGAFFQYJXDMLJCSQZLLPCHBSXGJYNDYBYQSPZWJLZKSDDTACTBXZDYZYPJZQSJNKKTKNJDJGYYPGTLFYQKASDNTCYHBLWDZHBBYDWJRYGKZYHEYYFJMSDTYFZJJHGCXPLXHLDWXXJKYTCYKSSSMTWCTTQZLPBSZDZWZXGZAGYKTYWXLHLSPBCLLOQMMZSSLCMBJCSZZKYDCZJGQQDSMCYTZQQLWZQZXSSFPTTFQMDDZDSHDTDWFHTDYZJYQJQKYPBDJYYXTLJHDRQXXXHAYDHRJLKLYTWHLLRLLRCXYLBWSRSZZSYMKZZHHKYHXKSMDSYDYCJPBZBSQLFCXXXNXKXWYWSDZYQOGGQMMYHCDZTTFJYYBGSTTTYBYKJDHKYXBELHTYPJQNFXFDYKZHQKZBYJTZBXHFDXKDASWTAWAJLDYJSFHBLDNNTNQJTJNCHXFJSRFWHZFMDRYJYJWZPDJKZYJYMPCYZNYNXFBYTFYFWYGDBNZZZDNYTXZEMMQBSQEHXFZMBMFLZZSRXYMJGSXWZJSPRYDJSJGXHJJGLJJYNZZJXHGXKYMLPYYYCXYTWQZSWHWLYRJLPXSLSXMFSWWKLCTNXNYNPSJSZHDZEPTXMYYWXYYSYWLXJQZQXZDCLEEELMCPJPCLWBXSQHFWWTFFJTNQJHJQDXHWLBYZNFJLALKYYJLDXHHYCSTYYWNRJYXYWTRMDRQHWQCMFJDYZMHMYYXJWMYZQZXTLMRSPWWCHAQBXYGZYPXYYRRCLMPYMGKSJSZYSRMYJSNXTPLNBAPPYPYLXYYZKYNLDZYJZCZNNLMZHHARQMPGWQTZMXXMLLHGDZXYHXKYXYCJMFFYYHJFSBSSQLXXNDYCANNMTCJCYPRRNYTYQNYYMBMSXNDLYLYSLJRLXYSXQMLLYZLZJJJKYZZCSFBZXXMSTBJGNXYZHLXNMCWSCYZYFZLXBRNNNYLBNRTGZQYSATSWRYHYJZMZDHZGZDWYBSSCSKXSYHYTXXGCQGXZZSHYXJSCRHMKKBXCZJYJYMKQHZJFNBHMQHYSNJNZYBKNQMCLGQHWLZNZSWXKHLJHYYBQLBFCDSXDLDSPFZPSKJYZWZXZDDXJSMMEGJSCSSMGCLXXKYYYLNYPWWWGYDKZJGGGZGGSYCKNJWNJPCXBJJTQTJWDSSPJXZXNZXUMELPXFSXTLLXCLJXJJLJZXCTPSWXLYDHLYQRWHSYCSQYYBYAYWJJJQFWQCQQCJQGXALDBZZYJGKGXPLTZYFXJLTPADKYQHPMATLCPDCKBMTXYBHKLENXDLEEGQDYMSAWHZMLJTWYGXLYQZLJEEYYBQQFFNLYXRDSCTGJGXYYNKLLYQKCCTLHJLQMKKZGCYYGLLLJDZGYDHZWXPYSJBZKDZGYZZHYWYFQYTYZSZYEZZLYMHJJHTSMQWYZLKYYWZCSRKQYTLTDXWCTYJKLWSQZWBDCQYNCJSRSZJLKCDCDTLZZZACQQZZDDXYPLXZBQJYLZLLLQDDZQJYJYJZYXNYYYNYJXKXDAZWYRDLJYYYRJLXLLDYXJCYWYWNQCCLDDNYYYNYCKCZHXXCCLGZQJGKWPPCQQJYSBZZXYJSQPXJPZBSBDSFNSFPZXHDWZTDWPPTFLZZBZDMYYPQJRSDZSQZSQXBDGCPZSWDWCSQZGMDHZXMWWFYBPDGPHTMJTHZSMMBGZMBZJCFZWFZBBZMQCFMBDMCJXLGPNJBBXGYHYYJGPTZGZMQBQTCGYXJXLWZKYDPDYMGCFTPFXYZTZXDZXTGKMTYBBCLBJASKYTSSQYYMSZXFJEWLXLLSZBQJJJAKLYLXLYCCTSXMCWFKKKBSXLLLLJYXTYLTJYYTDPJHNHNNKBYQNFQYYZBYYESSESSGDYHFHWTCJBSDZZTFDMXHCNJZYMQWSRYJDZJQPDQBBSTJGGFBKJBXTGQHNGWJXJGDLLTHZHHYYYYYYSXWTYYYCCBDBPYPZYCCZYJPZYWCBDLFWZCWJDXXHYHLHWZZXJTCZLCDPXUJCZZZLYXJJTXPHFXWPYWXZPTDZZBDZCYHJHMLXBQXSBYLRDTGJRRCTTTHYTCZWMXFYTWWZCWJWXJYWCSKYBZSCCTZQNHXNWXXKHKFHTSWOCCJYBCMPZZYKBNNZPBZHHZDLSYDDYTYFJPXYNGFXBYQXCBHXCPSXTYZDMKYSNXSXLHKMZXLYHDHKWHXXSSKQYHHCJYXGLHZXCSNHEKDTGZXQYPKDHEXTYKCNYMYYYPKQYYYKXZLTHJQTBYQHXBMYHSQCKWWYLLHCYYLNNEQXQWMCFBDCCMLJGGXDQKTLXKGNQCDGZJWYJJLYHHQTTTNWCHMXCXWHWSZJYDJCCDBQCDGDNYXZTHCQRXCBHZTQCBXWGQWYYBXHMBYMYQTYEXMQKYAQYRGYZSLFYKKQHYSSQYSHJGJCNXKZYCXSBXYXHYYLSTYCXQTHYSMGSCPMMGCCCCCMTZTASMGQZJHKLOSQYLSWTMXSYQKDZLJQQYPLSYCZTCQQPBBQJZCLPKHQZYYXXDTDDTSJCXFFLLCHQXMJLWCJCXTSPYCXNDTJSHJWXDQQJSKXYAMYLSJHMLALYKXCYYDMNMDQMXMCZNNCYBZKKYFLMCHCMLHXRCJJHSYLNMTJZGZGYWJXSRXCWJGJQHQZDQJDCJJZKJKGDZQGJJYJYLXZXXCDQHHHEYTMHLFSBDJSYYSHFYSTCZQLPBDRFRZTZYKYWHSZYQKWDQZRKMSYNBCRXQBJYFAZPZZEDZCJYWBCJWHYJBQSZYWRYSZPTDKZPFPBNZTKLQYHBBZPNPPTYZZYBQNYDCPJMMCYCQMCYFZZDCMNLFPBPLNGQJTBTTNJZPZBBZNJKLJQYLNBZQHKSJZNGGQSZZKYXSHPZSNBCGZKDDZQANZHJKDRTLZLSWJLJZLYWTJNDJZJHXYAYNCBGTZCSSQMNJPJYTYSWXZFKWJQTKHTZPLBHSNJZSYZBWZZZZLSYLSBJHDWWQPSLMMFBJDWAQYZTCJTBNNWZXQXCDSLQGDSDPDZHJTQQPSWLYYJZLGYXYZLCTCBJTKTYCZJTQKBSJLGMGZDMCSGPYNJZYQYYKNXRPWSZXMTNCSZZYXYBYHYZAXYWQCJTLLCKJJTJHGDXDXYQYZZBYWDLWQCGLZGJGQRQZCZSSBCRPCSKYDZNXJSQGXSSJMYDNSTZTPBDLTKZWXQWQTZEXNQCZGWEZKSSBYBRTSSSLCCGBPSZQSZLCCGLLLZXHZQTHCZMQGYZQZNMCOCSZJMMZSQPJYGQLJYJPPLDXRGZYXCCSXHSHGTZNLZWZKJCXTCFCJXLBMQBCZZWPQDNHXLJCTHYZLGYLNLSZZPCXDSCQQHJQKSXZPBAJYEMSMJTZDXLCJYRYYNWJBNGZZTMJXLTBSLYRZPYLSSCNXPHLLHYLLQQZQLXYMRSYCXZLMMCZLTZSDWTJJLLNZGGQXPFSKYGYGHBFZPDKMWGHCXMSGDXJMCJZDYCABXJDLNBCDQYGSKYDQTXDJJYXMSZQAZDZFSLQXYJSJZYLBTXXWXQQZBJZUFBBLYLWDSLJHXJYZJWTDJCZFQZQZZDZSXZZQLZCDZFJHYSPYMPQZMLPPLFFXJJNZZYLSJEYQZFPFZKSYWJJJHRDJZZXTXXGLGHYDXCSKYSWMMZCWYBAZBJKSHFHJCXMHFQHYXXYZFTSJYZFXYXPZLCHMZMBXHZZSXYFYMNCWDABAZLXKTCSHHXKXJJZJSTHYGXSXYYHHHJWXKZXSSBZZWHHHCWTZZZPJXSNXQQJGZYZYWLLCWXZFXXYXYHXMKYYSWSQMNLNAYCYSPMJKHWCQHYLAJJMZXHMMCNZHBHXCLXTJPLTXYJHDYYLTTXFSZHYXXSJBJYAYRSMXYPLCKDUYHLXRLNLLSTYZYYQYGYHHSCCSMZCTZQXKYQFPYYRPFFLKQUNTSZLLZMWWTCQQYZWTLLMLMPWMBZSSTZRBPDDTLQJJBXZCSRZQQYGWCSXFWZLXCCRSZDZMCYGGDZQSGTJSWLJMYMMZYHFBJDGYXCCPSHXNZCSBSJYJGJMPPWAFFYFNXHYZXZYLREMZGZCYZSSZDLLJCSQFNXZKPTXZGXJJGFMYYYSNBTYLBNLHPFZDCYFBMGQRRSSSZXYSGTZRNYDZZCDGPJAFJFZKNZBLCZSZPSGCYCJSZLMLRSZBZZLDLSLLYSXSQZQLYXZLSKKBRXBRBZCYCXZZZEEYFGKLZLYYHGZSGZLFJHGTGWKRAAJYZKZQTSSHJJXDCYZUYJLZYRZDQQHGJZXSSZBYKJPBFRTJXLLFQWJHYLQTYMBLPZDXTZYGBDHZZRBGXHWNJTJXLKSCFSMWLSDQYSJTXKZSCFWJLBXFTZLLJZLLQBLSQMQQCGCZFPBPHZCZJLPYYGGDTGWDCFCZQYYYQYSSCLXZSKLZZZGFFCQNWGLHQYZJJCZLQZZYJPJZZBPDCCMHJGXDQDGDLZQMFGPSYTSDYFWWDJZJYSXYYCZCYHZWPBYKXRYLYBHKJKSFXTZJMMCKHLLTNYYMSYXYZPYJQYCSYCWMTJJKQYRHLLQXPSGTLYYCLJSCPXJYZFNMLRGJJTYZBXYZMSJYJHHFZQMSYXRSZCWTLRTQZSSTKXGQKGSPTGCZNJSJCQCXHMXGGZTQYDJKZDLBZSXJLHYQGGGTHQSZPYHJHHGYYGKGGCWJZZYLCZLXQSFTGZSLLLMLJSKCTBLLZZSZMMNYTPZSXQHJCJYQXYZXZQZCPSHKZZYSXCDFGMWQRLLQXRFZTLYSTCTMJCXJJXHJNXTNRZTZFQYHQGLLGCXSZSJDJLJCYDSJTLNYXHSZXCGJZYQPYLFHDJSBPCCZHJJJQZJQDYBSSLLCMYTTMQTBHJQNNYGKYRQYQMZGCJKPDCGMYZHQLLSLLCLMHOLZGDYYFZSLJCQZLYLZQJESHNYLLJXGJXLYSYYYXNBZLJSSZCQQCJYLLZLTJYLLZLLBNYLGQCHXYYXOXCXQKYJXXXYKLXSXXYQXCYKQXQCSGYXXYQXYGYTQOHXHXPYXXXULCYEYCHZZCBWQBBWJQZSCSZSSLZYLKDESJZWMYMCYTSDSXXSCJPQQSQYLYYZYCMDJDZYWCBTJSYDJKCYDDJLBDJJSODZYSYXQQYXDHHGQQYQHDYXWGMMMAJDYBBBPPBCMUUPLJZSMTXERXJMHQNUTPJDCBSSMSSSTKJTSSMMTRCPLZSZMLQDSDMJMQPNQDXCFYNBFSDQXYXHYAYKQYDDLQYYYSSZBYDSLNTFQTZQPZMCHDHCZCWFDXTMYQSPHQYYXSRGJCWTJTZZQMGWJJTJHTQJBBHWZPXXHYQFXXQYWYYHYSCDYDHHQMNMTMWCPBSZPPZZGLMZFOLLCFWHMMSJZTTDHZZYFFYTZZGZYSKYJXQYJZQBHMBZZLYGHGFMSHPZFZSNCLPBQSNJXZSLXXFPMTYJYGBXLLDLXPZJYZJYHHZCYWHJYLSJEXFSZZYWXKZJLUYDTMLYMQJPWXYHXSKTQJEZRPXXZHHMHWQPWQLYJJQJJZSZCPHJLCHHNXJLQWZJHBMZYXBDHHYPZLHLHLGFWLCHYYTLHJXCJMSCPXSTKPNHQXSRTYXXTESYJCTLSSLSTDLLLWWYHDHRJZSFGXTSYCZYNYHTDHWJSLHTZDQDJZXXQHGYLTZPHCSQFCLNJTCLZPFSTPDYNYLGMJLLYCQHYSSHCHYLHQYQTMZYPBYWRFQYKQSYSLZDQJMPXYYSSRHZJNYWTQDFZBWWTWWRXCWHGYHXMKMYYYQMSMZHNGCEPMLQQMTCWCTMMPXJPJJHFXYYZSXZHTYBMSTSYJTTQQQYYLHYNPYQZLCYZHZWSMYLKFJXLWGXYPJYTYSYXYMZCKTTWLKSMZSYLMPWLZWXWQZSSAQSYXYRHSSNTSRAPXCPWCMGDXHXZDZYFJHGZTTSBJHGYZSZYSMYCLLLXBTYXHBBZJKSSDMALXHYCFYGMQYPJYCQXJLLLJGSLZGQLYCJCCZOTYXMTMTTLLWTGPXYMZMKLPSZZZXHKQYSXCTYJZYHXSHYXZKXLZWPSQPYHJWPJPWXQQYLXSDHMRSLZZYZWTTCYXYSZZSHBSCCSTPLWSSCJCHNLCGCHSSPHYLHFHHXJSXYLLNYLSZDHZXYLSXLWZYKCLDYAXZCMDDYSPJTQJZLNWQPSSSWCTSTSZLBLNXSMNYYMJQBQHRZWTYYDCHQLXKPZWBGQYBKFCMZWPZLLYYLSZYDWHXPSBCMLJBSCGBHXLQHYRLJXYSWXWXZSLDFHLSLYNJLZYFLYJYCDRJLFSYZFSLLCQYQFGJYHYXZLYLMSTDJCYHBZLLNWLXXYGYYHSMGDHXXHHLZZJZXCZZZCYQZFNGWPYLCPKPYYPMCLQKDGXZGGWQBDXZZKZFBXXLZXJTPJPTTBYTSZZDWSLCHZHSLTYXHQLHYXXXYYZYSWTXZKHLXZXZPYHGCHKCFSYHUTJRLXFJXPTZTWHPLYXFCRHXSHXKYXXYHZQDXQWULHYHMJTBFLKHTXCWHJFWJCFPQRYQXCYYYQYGRPYWSGSUNGWCHKZDXYFLXXHJJBYZWTSXXNCYJJYMSWZJQRMHXZWFQSYLZJZGBHYNSLBGTTCSYBYXXWXYHXYYXNSQYXMQYWRGYQLXBBZLJSYLPSYTJZYHYZAWLRORJMKSCZJXXXYXCHDYXRYXXJDTSQFXLYLTSFFYXLMTYJMJUYYYXLTZCSXQZQHZXLYYXZHDNBRXXXJCTYHLBRLMBRLLAXKYLLLJLYXXLYCRYLCJTGJCMTLZLLCYZZPZPCYAWHJJFYBDYYZSMPCKZDQYQPBPCJPDCYZMDPBCYYDYCNNPLMTMLRMFMMGWYZBSJGYGSMZQQQZTXMKQWGXLLPJGZBQCDJJJFPKJKCXBLJMSWMDTQJXLDLPPBXCWRCQFBFQJCZAHZGMYKPHYYHZYKNDKZMBPJYXPXYHLFPNYYGXJDBKXNXHJMZJXSTRSTLDXSKZYSYBZXJLXYSLBZYSLHXJPFXPQNBYLLJQKYGZMCYZZYMCCSLCLHZFWFWYXZMWSXTYNXJHPYYMCYSPMHYSMYDYSHQYZCHMJJMZCAAGCFJBBHPLYZYLXXSDJGXDHKXXTXXNBHRMLYJSLTXMRHNLXQJXYZLLYSWQGDLBJHDCGJYQYCMHWFMJYBMBYJYJWYMDPWHXQLDYGPDFXXBCGJSPCKRSSYZJMSLBZZJFLJJJLGXZGYXYXLSZQYXBEXYXHGCXBPLDYHWETTWWCJMBTXCHXYQXLLXFLYXLLJLSSFWDPZSMYJCLMWYTCZPCHQEKCQBWLCQYDPLQPPQZQFJQDJHYMMCXTXDRMJWRHXCJZYLQXDYYNHYYHRSLSRSYWWZJYMTLTLLGTQCJZYABTCKZCJYCCQLJZQXALMZYHYWLWDXZXQDLLQSHGPJFJLJHJABCQZDJGTKHSSTCYJLPSWZLXZXRWGLDLZRLZXTGSLLLLZLYXXWGDZYGBDPHZPBRLWSXQBPFDWOFMWHLYPCBJCCLDMBZPBZZLCYQXLDOMZBLZWPDWYYGDSTTHCSQSCCRSSSYSLFYBFNTYJSZDFNDPDHDZZMBBLSLCMYFFGTJJQWFTMTPJWFNLBZCMMJTGBDZLQLPYFHYYMJYLSDCHDZJWJCCTLJCLDTLJJCPDDSQDSSZYBNDBJLGGJZXSXNLYCYBJXQYCBYLZCFZPPGKCXZDZFZTJJFJSJXZBNZYJQTTYJYHTYCZHYMDJXTTMPXSPLZCDWSLSHXYPZGTFMLCJTYCBPMGDKWYCYZCDSZZYHFLYCTYGWHKJYYLSJCXGYWJCBLLCSNDDBTZBSCLYZCZZSSQDLLMQYYHFSLQLLXFTYHABXGWNYWYYPLLSDLDLLBJCYXJZMLHLJDXYYQYTDLLLBUGBFDFBBQJZZMDPJHGCLGMJJPGAEHHBWCQXAXHHHZCHXYPHJAXHLPHJPGPZJQCQZGJJZZUZDMQYYBZZPHYHYBWHAZYJHYKFGDPFQSDLZMLJXKXGALXZDAGLMDGXMWZQYXXDXXPFDMMSSYMPFMDMMKXKSYZYSHDZKXSYSMMZZZMSYDNZZCZXFPLSTMZDNMXCKJMZTYYMZMZZMSXHHDCZJEMXXKLJSTLWLSQLYJZLLZJSSDPPMHNLZJCZYHMXXHGZCJMDHXTKGRMXFWMCGMWKDTKSXQMMMFZZYDKMSCLCMPCGMHSPXQPZDSSLCXKYXTWLWJYAHZJGZQMCSNXYYMMPMLKJXMHLMLQMXCTKZMJQYSZJSYSZHSYJZJCDAJZYBSDQJZGWZQQXFKDMSDJLFWEHKZQKJPEYPZYSZCDWYJFFMZZYLTTDZZEFMZLBNPPLPLPEPSZALLTYLKCKQZKGENQLWAGYXYDPXLHSXQQWQCQXQCLHYXXMLYCCWLYMQYSKGCHLCJNSZKPYZKCQZQLJPDMDZHLASXLBYDWQLWDNBQCRYDDZTJYBKBWSZDXDTNPJDTCTQDFXQQMGNXECLTTBKPWSLCTYQLPWYZZKLPYGZCQQPLLKCCYLPQMZCZQCLJSLQZDJXLDDHPZQDLJJXZQDXYZQKZLJCYQDYJPPYPQYKJYRMPCBYMCXKLLZLLFQPYLLLMBSGLCYSSLRSYSQTMXYXZQZFDZUYSYZTFFMZZSMZQHZSSCCMLYXWTPZGXZJGZGSJSGKDDHTQGGZLLBJDZLCBCHYXYZHZFYWXYZYMSDBZZYJGTSMTFXQYXQSTDGSLNXDLRYZZLRYYLXQHTXSRTZNGZXBNQQZFMYKMZJBZYMKBPNLYZPBLMCNQYZZZSJZHJCTZKHYZZJRDYZHNPXGLFZTLKGJTCTSSYLLGZRZBBQZZKLPKLCZYSSUYXBJFPNJZZXCDWXZYJXZZDJJKGGRSRJKMSMZJLSJYWQSKYHQJSXPJZZZLSNSHRNYPZTWCHKLPSRZLZXYJQXQKYSJYCZTLQZYBBYBWZPQDWWYZCYTJCJXCKCWDKKZXSGKDZXWWYYJQYYTCYTDLLXWKCZKKLCCLZCQQDZLQLCSFQCHQHSFSMQZZLNBJJZBSJHTSZDYSJQJPDLZCDCWJKJZZLPYCGMZWDJJBSJQZSYZYHHXJPBJYDSSXDZNCGLQMBTSFSBPDZDLZNFGFJGFSMPXJQLMBLGQCYYXBQKDJJQYRFKZTJDHCZKLBSDZCFJTPLLJGXHYXZCSSZZXSTJYGKGCKGYOQXJPLZPBPGTGYJZGHZQZZLBJLSQFZGKQQJZGYCZBZQTLDXRJXBSXXPZXHYZYCLWDXJJHXMFDZPFZHQHQMQGKSLYHTYCGFRZGNQXCLPDLBZCSCZQLLJBLHBZCYPZZPPDYMZZSGYHCKCPZJGSLJLNSCDSLDLXBMSTLDDFJMKDJDHZLZXLSZQPQPGJLLYBDSZGQLBZLSLKYYHZTTNTJYQTZZPSZQZTLLJTYYLLQLLQYZQLBDZLSLYYZYMDFSZSNHLXZNCZQZPBWSKRFBSYZMTHBLGJPMCZZLSTLXSHTCSYZLZBLFEQHLXFLCJLYLJQCBZLZJHHSSTBRMHXZHJZCLXFNBGXGTQJCZTMSFZKJMSSNXLJKBHSJXNTNLZDNTLMSJXGZJYJCZXYJYJWRWWQNZTNFJSZPZSHZJFYRDJSFSZJZBJFZQZZHZLXFYSBZQLZSGYFTZDCSZXZJBQMSZKJRHYJZCKMJKHCHGTXKXQGLXPXFXTRTYLXJXHDTSJXHJZJXZWZLCQSBTXWXGXTXXHXFTSDKFJHZYJFJXRZSDLLLTQSQQZQWZXSYQTWGWBZCGZLLYZBCLMQQTZHZXZXLJFRMYZFLXYSQXXJKXRMQDZDMMYYBSQBHGZMWFWXGMXLZPYYTGZYCCDXYZXYWGSYJYZNBHPZJSQSYXSXRTFYZGRHZTXSZZTHCBFCLSYXZLZQMZLMPLMXZJXSFLBYZMYQHXJSXRXSQZZZSSLYFRCZJRCRXHHZXQYDYHXSJJHZCXZBTYNSYSXJBQLPXZQPYMLXZKYXLXCJLCYSXXZZLXDLLLJJYHZXGYJWKJRWYHCPSGNRZLFZWFZZNSXGXFLZSXZZZBFCSYJDBRJKRDHHGXJLJJTGXJXXSTJTJXLYXQFCSGSWMSBCTLQZZWLZZKXJMLTMJYHSDDBXGZHDLBMYJFRZFSGCLYJBPMLYSMSXLSZJQQHJZFXGFQFQBPXZGYYQXGZTCQWYLTLGWSGWHRLFSFGZJMGMGBGTJFSYZZGZYZAFLSSPMLPFLCWBJZCLJJMZLPJJLYMQDMYYYFBGYGYZMLYZDXQYXRQQQHSYYYQXYLJTYXFSFSLLGNQCYHYCWFHCCCFXPYLYPLLZYXXXXXKQHHXSHJZCFZSCZJXCPZWHHHHHAPYLQALPQAFYHXDYLUKMZQGGGDDESRNNZLTZGCHYPPYSQJJHCLLJTOLNJPZLJLHYMHEYDYDSQYCDDHGZUNDZCLZYZLLZNTNYZGSLHSLPJJBDGWXPCDUTJCKLKCLWKLLCASSTKZZDNQNTTLYYZSSYSSZZRYLJQKCQDHHCRXRZYDGRGCWCGZQFFFPPJFZYNAKRGYWYQPQXXFKJTSZZXSWZDDFBBXTBGTZKZNPZZPZXZPJSZBMQHKCYXYLDKLJNYPKYGHGDZJXXEAHPNZKZTZCMXCXMMJXNKSZQNMNLWBWWXJKYHCPSTMCSQTZJYXTPCTPDTNNPGLLLZSJLSPBLPLQHDTNJNLYYRSZFFJFQWDPHZDWMRZCCLODAXNSSNYZRESTYJWJYJDBCFXNMWTTBYLWSTSZGYBLJPXGLBOCLHPCBJLTMXZLJYLZXCLTPNCLCKXTPZJSWCYXSFYSZDKNTLBYJCYJLLSTGQCBXRYZXBXKLYLHZLQZLNZCXWJZLJZJNCJHXMNZZGJZZXTZJXYCYYCXXJYYXJJXSSSJSTSSTTPPGQTCSXWZDCSYFPTFBFHFBBLZJCLZZDBXGCXLQPXKFZFLSYLTUWBMQJHSZBMDDBCYSCCLDXYCDDQLYJJWMQLLCSGLJJSYFPYYCCYLTJANTJJPWYCMMGQYYSXDXQMZHSZXPFTWWZQSWQRFKJLZJQQYFBRXJHHFWJJZYQAZMYFRHCYYBYQWLPEXCCZSTYRLTTDMQLYKMBBGMYYJPRKZNPBSXYXBHYZDJDNGHPMFSGMWFZMFQMMBCMZZCJJLCNUXYQLMLRYGQZCYXZLWJGCJCGGMCJNFYZZJHYCPRRCMTZQZXHFQGTJXCCJEAQCRJYHPLQLSZDJRBCQHQDYRHYLYXJSYMHZYDWLDFRYHBPYDTSSCNWBXGLPZMLZZTQSSCPJMXXYCSJYTYCGHYCJWYRXXLFEMWJNMKLLSWTXHYYYNCMMCWJDQDJZGLLJWJRKHPZGGFLCCSCZMCBLTBHBQJXQDSPDJZZGKGLFQYWBZYZJLTSTDHQHCTCBCHFLQMPWDSHYYTQWCNZZJTLBYMBPDYYYXSQKXWYYFLXXNCWCXYPMAELYKKJMZZZBRXYYQJFLJPFHHHYTZZXSGQQMHSPGDZQWBWPJHZJDYSCQWZKTXXSQLZYYMYSDZGRXCKKUJLWPYSYSCSYZLRMLQSYLJXBCXTLWDQZPCYCYKPPPNSXFYZJJRCEMHSZMSXLXGLRWGCSTLRSXBZGBZGZTCPLUJLSLYLYMTXMTZPALZXPXJTJWTCYYZLBLXBZLQMYLXPGHDSLSSDMXMBDZZSXWHAMLCZCPJMCNHJYSNSYGCHSKQMZZQDLLKABLWJXSFMOCDXJRRLYQZKJMYBYQLYHETFJZFRFKSRYXFJTWDSXXSYSQJYSLYXWJHSNLXYYXHBHAWHHJZXWMYLJCSSLKYDZTXBZSYFDXGXZJKHSXXYBSSXDPYNZWRPTQZCZENYGCXQFJYKJBZMLJCMQQXUOXSLYXXLYLLJDZBTYMHPFSTTQQWLHOKYBLZZALZXQLHZWRRQHLSTMYPYXJJXMQSJFNBXYXYJXXYQYLTHYLQYFMLKLJTMLLHSZWKZHLJMLHLJKLJSTLQXYLMBHHLNLZXQJHXCFXXLHYHJJGBYZZKBXSCQDJQDSUJZYYHZHHMGSXCSYMXFEBCQWWRBPYYJQTYZCYQYQQZYHMWFFHGZFRJFCDPXNTQYZPDYKHJLFRZXPPXZDBBGZQSTLGDGYLCQMLCHHMFYWLZYXKJLYPQHSYWMQQGQZMLZJNSQXJQSYJYCBEHSXFSZPXZWFLLBCYYJDYTDTHWZSFJMQQYJLMQXXLLDTTKHHYBFPWTYYSQQWNQWLGWDEBZWCMYGCULKJXTMXMYJSXHYBRWFYMWFRXYQMXYSZTZZTFYKMLDHQDXWYYNLCRYJBLPSXCXYWLSPRRJWXHQYPHTYDNXHHMMYWYTZCSQMTSSCCDALWZTCPQPYJLLQZYJSWXMZZMMYLMXCLMXCZMXMZSQTZPPQQBLPGXQZHFLJJHYTJSRXWZXSCCDLXTYJDCQJXSLQYCLZXLZZXMXQRJMHRHZJBHMFLJLMLCLQNLDXZLLLPYPSYJYSXCQQDCMQJZZXHNPNXZMEKMXHYKYQLXSXTXJYYHWDCWDZHQYYBGYBCYSCFGPSJNZDYZZJZXRZRQJJYMCANYRJTLDPPYZBSTJKXXZYPFDWFGZZRPYMTNGXZQBYXNBUFNQKRJQZMJEGRZGYCLKXZDSKKNSXKCLJSPJYYZLQQJYBZSSQLLLKJXTBKTYLCCDDBLSPPFYLGYDTZJYQGGKQTTFZXBDKTYYHYBBFYTYYBCLPDYTGDHRYRNJSPTCSNYJQHKLLLZSLYDXXWBCJQSPXBPJZJCJDZFFXXBRMLAZHCSNDLBJDSZBLPRZTSWSBXBCLLXXLZDJZSJPYLYXXYFTFFFBHJJXGBYXJPMMMPSSJZJMTLYZJXSWXTYLEDQPJMYGQZJGDJLQJWJQLLSJGJGYGMSCLJJXDTYGJQJQJCJZCJGDZZSXQGSJGGCXHQXSNQLZZBXHSGZXCXYLJXYXYYDFQQJHJFXDHCTXJYRXYSQTJXYEFYYSSYYJXNCYZXFXMSYSZXYYSCHSHXZZZGZZZGFJDLTYLNPZGYJYZYYQZPBXQBDZTZCZYXXYHHSQXSHDHGQHJHGYWSZTMZMLHYXGEBTYLZKQWYTJZRCLEKYSTDBCYKQQSAYXCJXWWGSBHJYZYDHCSJKQCXSWXFLTYNYZPZCCZJQTZWJQDZZZQZLJJXLSBHPYXXPSXSHHEZTXFPTLQYZZXHYTXNCFZYYHXGNXMYWXTZSJPTHHGYMXMXQZXTSBCZYJYXXTYYZYPCQLMMSZMJZZLLZXGXZAAJZYXJMZXWDXZSXZDZXLEYJJZQBHZWZZZQTZPSXZTDSXJJJZNYAZPHXYYSRNQDTHZHYYKYJHDZXZLSWCLYBZYECWCYCRYLCXNHZYDZYDYJDFRJJHTRSQTXYXJRJHOJYNXELXSFSFJZGHPZSXZSZDZCQZBYYKLSGSJHCZSHDGQGXYZGXCHXZJWYQWGYHKSSEQZZNDZFKWYSSTCLZSTSYMCDHJXXYWEYXCZAYDMPXMDSXYBSQMJMZJMTZQLPJYQZCGQHXJHHLXXHLHDLDJQCLDWBSXFZZYYSCHTYTYYBHECXHYKGJPXHHYZJFXHWHBDZFYZBCAPNPGNYDMSXHMMMMAMYNBYJTMPXYYMCTHJBZYFCGTYHWPHFTWZZEZSBZEGPFMTSKFTYCMHFLLHGPZJXZJGZJYXZSBBQSCZZLZCCSTPGXMJSFTCCZJZDJXCYBZLFCJSYZFGSZLYBCWZZBYZDZYPSWYJZXZBDSYUXLZZBZFYGCZXBZHZFTPBGZGEJBSTGKDMFHYZZJHZLLZZGJQZLSFDJSSCBZGPDLFZFZSZYZYZSYGCXSNXXCHCZXTZZLJFZGQSQYXZJQDCCZTQCDXZJYQJQCHXZTDLGSCXZSYQJQTZWLQDQZTQCHQQJZYEZZZPBWKDJFCJPZTYPQYQTTYNLMBDKTJZPQZQZZFPZSBNJLGYJDXJDZZKZGQKXDLPZJTCJDQBXDJQJSTCKNXBXZMSLYJCQMTJQWWCJQNJNLLLHJCWQTBZQYDZCZPZZDZYDDCYZZZCCJTTJFZDPRRTZTJDCQTQZDTJNPLZBCLLCTZSXKJZQZPZLBZRBTJDCXFCZDBCCJJLTQQPLDCGZDBBZJCQDCJWYNLLZYZCCDWLLXWZLXRXNTQQCZXKQLSGDFQTDDGLRLAJJTKUYMKQLLTZYTDYYCZGJWYXDXFRSKSTQTENQMRKQZHHQKDLDAZFKYPBGGPZREBZZYKZZSPEGJXGYKQZZZSLYSYYYZWFQZYLZZLZHWCHKYPQGNPGBLPLRRJYXCCSYYHSFZFYBZYYTGZXYLXCZWXXZJZBLFFLGSKHYJZEYJHLPLLLLCZGXDRZELRHGKLZZYHZLYQSZZJZQLJZFLNBHGWLCZCFJYSPYXZLZLXGCCPZBLLCYBBBBUBBCBPCRNNZCZYRBFSRLDCGQYYQXYGMQZWTZYTYJXYFWTEHZZJYWLCCNTZYJJZDEDPZDZTSYQJHDYMBJNYJZLXTSSTPHNDJXXBYXQTZQDDTJTDYYTGWSCSZQFLSHLGLBCZPHDLYZJYCKWTYTYLBNYTSDSYCCTYSZYYEBHEXHQDTWNYGYCLXTSZYSTQMYGZAZCCSZZDSLZCLZRQXYYELJSBYMXSXZTEMBBLLYYLLYTDQYSHYMRQWKFKBFXNXSBYCHXBWJYHTQBPBSBWDZYLKGZSKYHXQZJXHXJXGNLJKZLYYCDXLFYFGHLJGJYBXQLYBXQPQGZTZPLNCYPXDJYQYDYMRBESJYYHKXXSTMXRCZZYWXYQYBMCLLYZHQYZWQXDBXBZWZMSLPDMYSKFMZKLZCYQYCZLQXFZZYDQZPZYGYJYZMZXDZFYFYTTQTZHGSPCZMLCCYTZXJCYTJMKSLPZHYSNZLLYTPZCTZZCKTXDHXXTQCYFKSMQCCYYAZHTJPCYLZLYJBJXTPNYLJYYNRXSYLMMNXJSMYBCSYSYLZYLXJJQYLDZLPQBFZZBLFNDXQKCZFYWHGQMRDSXYCYTXNQQJZYYPFZXDYZFPRXEJDGYQBXRCNFYYQPGHYJDYZXGRHTKYLNWDZNTSMPKLBTHBPYSZBZTJZSZZJTYYXZPHSSZZBZCZPTQFZMYFLYPYBBJQXZMXXDJMTSYSKKBJZXHJCKLPSMKYJZCXTMLJYXRZZQSLXXQPYZXMKYXXXJCLJPRMYYGADYSKQLSNDHYZKQXZYZTCGHZTLMLWZYBWSYCTBHJHJFCWZTXWYTKZLXQSHLYJZJXTMPLPYCGLTBZZTLZJCYJGDTCLKLPLLQPJMZPAPXYZLKKTKDZCZZBNZDYDYQZJYJGMCTXLTGXSZLMLHBGLKFWNWZHDXUHLFMKYSLGXDTWWFRJEJZTZHYDXYKSHWFZCQSHKTMQQHTZHYMJDJSKHXZJZBZZXYMPAGQMSTPXLSKLZYNWRTSQLSZBPSPSGZWYHTLKSSSWHZZLYYTNXJGMJSZSUFWNLSOZTXGXLSAMMLBWLDSZYLAKQCQCTMYCFJBSLXCLZZCLXXKSBZQCLHJPSQPLSXXCKSLNHPSFQQYTXYJZLQLDXZQJZDYYDJNZPTUZDSKJFSLJHYLZSQZLBTXYDGTQFDBYAZXDZHZJNHHQBYKNXJJQCZMLLJZKSPLDYCLBBLXKLELXJLBQYCXJXGCNLCQPLZLZYJTZLJGYZDZPLTQCSXFDMNYCXGBTJDCZNBGBQYQJWGKFHTNPYQZQGBKPBBYZMTJDYTBLSQMPSXTBNPDXKLEMYYCJYNZCTLDYKZZXDDXHQSHDGMZSJYCCTAYRZLPYLTLKXSLZCGGEXCLFXLKJRTLQJAQZNCMBYDKKCXGLCZJZXJHPTDJJMZQYKQSECQZDSHHADMLZFMMZBGNTJNNLGBYJBRBTMLBYJDZXLCJLPLDLPCQDHLXZLYCBLCXZZJADJLNZMMSSSMYBHBSQKBHRSXXJMXSDZNZPXLGBRHWGGFCXGMSKLLTSJYYCQLTSKYWYYHYWXBXQYWPYWYKQLSQPTNTKHQCWDQKTWPXXHCPTHTWUMSSYHBWCRWXHJMKMZNGWTMLKFGHKJYLSYYCXWHYECLQHKQHTTQKHFZLDXQWYZYYDESBPKYRZPJFYYZJCEQDZZDLATZBBFJLLCXDLMJSSXEGYGSJQXCWBXSSZPDYZCXDNYXPPZYDLYJCZPLTXLSXYZYRXCYYYDYLWWNZSAHJSYQYHGYWWAXTJZDAXYSRLTDPSSYYFNEJDXYZHLXLLLZQZSJNYQYQQXYJGHZGZCYJCHZLYCDSHWSHJZYJXCLLNXZJJYYXNFXMWFPYLCYLLABWDDHWDXJMCXZTZPMLQZHSFHZYNZTLLDYWLSLXHYMMYLMBWWKYXYADTXYLLDJPYBPWUXJMWMLLSAFDLLYFLBHHHBQQLTZJCQJLDJTFFKMMMBYTHYGDCQRDDWRQJXNBYSNWZDBYYTBJHPYBYTTJXAAHGQDQTMYSTQXKBTZPKJLZRBEQQSSMJJBDJOTGTBXPGBKTLHQXJJJCTHXQDWJLWRFWQGWSHCKRYSWGFTGYGBXSDWDWRFHWYTJJXXXJYZYSLPYYYPAYXHYDQKXSHXYXGSKQHYWFDDDPPLCJLQQEEWXKSYYKDYPLTJTHKJLTCYYHHJTTPLTZZCDLTHQKZXQYSTEEYWYYZYXXYYSTTJKLLPZMCYHQGXYHSRMBXPLLNQYDQHXSXXWGDQBSHYLLPJJJTHYJKYPPTHYYKTYEZYENMDSHLCRPQFDGFXZPSFTLJXXJBSWYYSKSFLXLPPLBBBLBSFXFYZBSJSSYLPBBFFFFSSCJDSTZSXZRYYSYFFSYZYZBJTBCTSBSDHRTJJBYTCXYJEYLXCBNEBJDSYXYKGSJZBXBYTFZWGENYHHTHZHHXFWGCSTBGXKLSXYWMTMBYXJSTZSCDYQRCYTWXZFHMYMCXLZNSDJTTTXRYCFYJSBSDYERXJLJXBBDEYNJGHXGCKGSCYMBLXJMSZNSKGXFBNBPTHFJAAFXYXFPXMYPQDTZCXZZPXRSYWZDLYBBKTYQPQJPZYPZJZNJPZJLZZFYSBTTSLMPTZRTDXQSJEHBZYLZDHLJSQMLHTXTJECXSLZZSPKTLZKQQYFSYGYWPCPQFHQHYTQXZKRSGTTSQCZLPTXCDYYZXSQZSLXLZMYCPCQBZYXHBSXLZDLTCDXTYLZJYYZPZYZLTXJSJXHLPMYTXCQRBLZSSFJZZTNJYTXMYJHLHPPLCYXQJQQKZZSCPZKSWALQSBLCCZJSXGWWWYGYKTJBBZTDKHXHKGTGPBKQYSLPXPJCKBMLLXDZSTBKLGGQKQLSBKKTFXRMDKBFTPZFRTBBRFERQGXYJPZSSTLBZTPSZQZSJDHLJQLZBPMSMMSXLQQNHKNBLRDDNXXDHDDJCYYGYLXGZLXSYGMQQGKHBPMXYXLYTQWLWGCPBMQXCYZYDRJBHTDJYHQSHTMJSBYPLWHLZFFNYPMHXXHPLTBQPFBJWQDBYGPNZTPFZJGSDDTQSHZEAWZZYLLTYYBWJKXXGHLFKXDJTMSZSQYNZGGSWQSPHTLSSKMCLZXYSZQZXNCJDQGZDLFNYKLJCJLLZLMZZNHYDSSHTHZZLZZBBHQZWWYCRZHLYQQJBEYFXXXWHSRXWQHWPSLMSSKZTTYGYQQWRSLALHMJTQJSMXQBJJZJXZYZKXBYQXBJXSHZTSFJLXMXZXFGHKZSZGGYLCLSARJYHSLLLMZXELGLXYDJYTLFBHBPNLYZFBBHPTGJKWETZHKJJXZXXGLLJLSTGSHJJYQLQZFKCGNNDJSSZFDBCTWWSEQFHQJBSAQTGYPQLBXBMMYWXGSLZHGLZGQYFLZBYFZJFRYSFMBYZHQGFWZSYFYJJPHZBYYZFFWODGRLMFTWLBZGYCQXCDJYGZYYYYTYTYDWEGAZYHXJLZYYHLRMGRXXZCLHNELJJTJTPWJYBJJBXJJTJTEEKHWSLJPLPSFYZPQQBDLQJJTYYQLYZKDKSQJYYQZLDQTGJQYZJSUCMRYQTHTEJMFCTYHYPKMHYZWJDQFHYYXWSHCTXRLJHQXHCCYYYJLTKTTYTMXGTCJTZAYYOCZLYLBSZYWJYTSJYHBYSHFJLYGJXXTMZYYLTXXYPZLXYJZYZYYPNHMYMDYYLBLHLSYYQQLLNJJYMSOYQBZGDLYXYLCQYXTSZEGXHZGLHWBLJHEYXTWQMAKBPQCGYSHHEGQCMWYYWLJYJHYYZLLJJYLHZYHMGSLJLJXCJJYCLYCJPCPZJZJMMYLCQLNQLJQJSXYJMLSZLJQLYCMMHCFMMFPQQMFYLQMCFFQMMMMHMZNFHHJGTTHHKHSLNCHHYQDXTMMQDCYZYXYQMYQYLTDCYYYZAZZCYMZYDLZFFFMMYCQZWZZMABTBYZTDMNZZGGDFTYPCGQYTTSSFFWFDTZQSSYSTWXJHXYTSXXYLBYQHWWKXHZXWZNNZZJZJJQJCCCHYYXBZXZCYZTLLCQXYNJYCYYCYNZZQYYYEWYCZDCJYCCHYJLBTZYYCQWMPWPYMLGKDLDLGKQQBGYCHJXY";

    //此处收录了929个多音字,数据来自于http://www.51window.net/page/pinyin
    var oMultiDiff = { "19969": "DZ", "19975": "WM", "19988": "QJ", "20048": "YL", "20056": "SC", "20060": "NM", "20094": "QG", "20127": "QJ", "20167": "QC", "20193": "YG", "20250": "KH", "20256": "ZC", "20282": "SC", "20285": "QJG", "20291": "TD", "20314": "YD", "20340": "NE", "20375": "TD", "20389": "YJ", "20391": "CZ", "20415": "PB", "20446": "YS", "20447": "SQ", "20504": "TC", "20608": "KG", "20854": "QJ", "20857": "ZC", "20911": "PF", "20504": "TC", "20608": "KG", "20854": "QJ", "20857": "ZC", "20911": "PF", "20985": "AW", "21032": "PB", "21048": "XQ", "21049": "SC", "21089": "YS", "21119": "JC", "21242": "SB", "21273": "SC", "21305": "YP", "21306": "QO", "21330": "ZC", "21333": "SDC", "21345": "QK", "21378": "CA", "21397": "SC", "21414": "XS", "21442": "SC", "21477": "JG", "21480": "TD", "21484": "ZS", "21494": "YX", "21505": "YX", "21512": "HG", "21523": "XH", "21537": "PB", "21542": "PF", "21549": "KH", "21571": "E", "21574": "DA", "21588": "TD", "21589": "O", "21618": "ZC", "21621": "KHA", "21632": "ZJ", "21654": "KG", "21679": "LKG", "21683": "KH", "21710": "A", "21719": "YH", "21734": "WOE", "21769": "A", "21780": "WN", "21804": "XH", "21834": "A", "21899": "ZD", "21903": "RN", "21908": "WO", "21939": "ZC", "21956": "SA", "21964": "YA", "21970": "TD", "22003": "A", "22031": "JG", "22040": "XS", "22060": "ZC", "22066": "ZC", "22079": "MH", "22129": "XJ", "22179": "XA", "22237": "NJ", "22244": "TD", "22280": "JQ", "22300": "YH", "22313": "XW", "22331": "YQ", "22343": "YJ", "22351": "PH", "22395": "DC", "22412": "TD", "22484": "PB", "22500": "PB", "22534": "ZD", "22549": "DH", "22561": "PB", "22612": "TD", "22771": "KQ", "22831": "HB", "22841": "JG", "22855": "QJ", "22865": "XQ", "23013": "ML", "23081": "WM", "23487": "SX", "23558": "QJ", "23561": "YW", "23586": "YW", "23614": "YW", "23615": "SN", "23631": "PB", "23646": "ZS", "23663": "ZT", "23673": "YG", "23762": "TD", "23769": "ZS", "23780": "QJ", "23884": "QK", "24055": "XH", "24113": "DC", "24162": "ZC", "24191": "GA", "24273": "QJ", "24324": "NL", "24377": "TD", "24378": "QJ", "24439": "PF", "24554": "ZS", "24683": "TD", "24694": "WE", "24733": "LK", "24925": "TN", "25094": "ZG", "25100": "XQ", "25103": "XH", "25153": "PB", "25170": "PB", "25179": "KG", "25203": "PB", "25240": "ZS", "25282": "FB", "25303": "NA", "25324": "KG", "25341": "ZY", "25373": "WZ", "25375": "XJ", "25384": "A", "25457": "A", "25528": "SD", "25530": "SC", "25552": "TD", "25774": "ZC", "25874": "ZC", "26044": "YW", "26080": "WM", "26292": "PB", "26333": "PB", "26355": "ZY", "26366": "CZ", "26397": "ZC", "26399": "QJ", "26415": "ZS", "26451": "SB", "26526": "ZC", "26552": "JG", "26561": "TD", "26588": "JG", "26597": "CZ", "26629": "ZS", "26638": "YL", "26646": "XQ", "26653": "KG", "26657": "XJ", "26727": "HG", "26894": "ZC", "26937": "ZS", "26946": "ZC", "26999": "KJ", "27099": "KJ", "27449": "YQ", "27481": "XS", "27542": "ZS", "27663": "ZS", "27748": "TS", "27784": "SC", "27788": "ZD", "27795": "TD", "27812": "O", "27850": "PB", "27852": "MB", "27895": "SL", "27898": "PL", "27973": "QJ", "27981": "KH", "27986": "HX", "27994": "XJ", "28044": "YC", "28065": "WG", "28177": "SM", "28267": "QJ", "28291": "KH", "28337": "ZQ", "28463": "TL", "28548": "DC", "28601": "TD", "28689": "PB", "28805": "JG", "28820": "QG", "28846": "PB", "28952": "TD", "28975": "ZC", "29100": "A", "29325": "QJ", "29575": "SL", "29602": "FB", "30010": "TD", "30044": "CX", "30058": "PF", "30091": "YSP", "30111": "YN", "30229": "XJ", "30427": "SC", "30465": "SX", "30631": "YQ", "30655": "QJ", "30684": "QJG", "30707": "SD", "30729": "XH", "30796": "LG", "30917": "PB", "31074": "NM", "31085": "JZ", "31109": "SC", "31181": "ZC", "31192": "MLB", "31293": "JQ", "31400": "YX", "31584": "YJ", "31896": "ZN", "31909": "ZY", "31995": "XJ", "32321": "PF", "32327": "ZY", "32418": "HG", "32420": "XQ", "32421": "HG", "32438": "LG", "32473": "GJ", "32488": "TD", "32521": "QJ", "32527": "PB", "32562": "ZSQ", "32564": "JZ", "32735": "ZD", "32793": "PB", "33071": "PF", "33098": "XL", "33100": "YA", "33152": "PB", "33261": "CX", "33324": "BP", "33333": "TD", "33406": "YA", "33426": "WM", "33432": "PB", "33445": "JG", "33486": "ZN", "33493": "TS", "33507": "QJ", "33540": "QJ", "33544": "ZC", "33564": "XQ", "33617": "YT", "33632": "QJ", "33636": "XH", "33637": "YX", "33694": "WG", "33705": "PF", "33728": "YW", "33882": "SR", "34067": "WM", "34074": "YW", "34121": "QJ", "34255": "ZC", "34259": "XL", "34425": "JH", "34430": "XH", "34485": "KH", "34503": "YS", "34532": "HG", "34552": "XS", "34558": "YE", "34593": "ZL", "34660": "YQ", "34892": "XH", "34928": "SC", "34999": "QJ", "35048": "PB", "35059": "SC", "35098": "ZC", "35203": "TQ", "35265": "JX", "35299": "JX", "35782": "SZ", "35828": "YS", "35830": "E", "35843": "TD", "35895": "YG", "35977": "MH", "36158": "JG", "36228": "QJ", "36426": "XQ", "36466": "DC", "36710": "JC", "36711": "ZYG", "36767": "PB", "36866": "SK", "36951": "YW", "37034": "YX", "37063": "XH", "37218": "ZC", "37325": "ZC", "38063": "PB", "38079": "TD", "38085": "QY", "38107": "DC", "38116": "TD", "38123": "YD", "38224": "HG", "38241": "XTC", "38271": "ZC", "38415": "YE", "38426": "KH", "38461": "YD", "38463": "AE", "38466": "PB", "38477": "XJ", "38518": "YT", "38551": "WK", "38585": "ZC", "38704": "XS", "38739": "LJ", "38761": "GJ", "38808": "SQ", "39048": "JG", "39049": "XJ", "39052": "HG", "39076": "CZ", "39271": "XT", "39534": "TD", "39552": "TD", "39584": "PB", "39647": "SB", "39730": "LG", "39748": "TPB", "40109": "ZQ", "40479": "ND", "40516": "HG", "40536": "HG", "40583": "QJ", "40765": "YQ", "40784": "QJ", "40840": "YK", "40863": "QJG" };

    //参数,中文字符串
    //返回值:拼音首字母串数组
    function makePy(str) {
        if (typeof (str) != "string")
            throw new Error(-1, "函数makePy需要字符串类型参数!");
        var arrResult = new Array(); //保存中间结果的数组
        for (var i = 0, len = str.length; i < len; i++) {
            //获得unicode码
            var ch = str.charAt(i);
            //检查该unicode码是否在处理范围之内,在则返回该码对映汉字的拼音首字母,不在则调用其它函数处理
            arrResult.push(checkCh(ch));
        }
        //处理arrResult,返回所有可能的拼音首字母串数组
        return mkRslt(arrResult);
    }
    function checkCh(ch) {
        var uni = ch.charCodeAt(0);
        //如果不在汉字处理范围之内,返回原字符,也可以调用自己的处理函数
        if (uni > 40869 || uni < 19968)
            return ch; //dealWithOthers(ch);
        //检查是否是多音字,是按多音字处理,不是就直接在strChineseFirstPY字符串中找对应的首字母
        return (oMultiDiff[uni] ? oMultiDiff[uni] : (strChineseFirstPY.charAt(uni - 19968)));
    }
    function mkRslt(arr) {
        var arrRslt = [""];
        for (var i = 0, len = arr.length; i < len; i++) {
            var str = arr[i];
            var strlen = str.length;
            if (strlen == 1) {
                for (var k = 0; k < arrRslt.length; k++) {
                    arrRslt[k] += str;
                }
            } else {
                var tmpArr = arrRslt.slice(0);
                arrRslt = [];
                for (k = 0; k < strlen; k++) {
                    //复制一个相同的arrRslt
                    var tmp = tmpArr.slice(0);
                    //把当前字符str[k]添加到每个元素末尾
                    for (var j = 0; j < tmp.length; j++) {
                        tmp[j] += str.charAt(k);
                    }
                    //把复制并修改后的数组连接到arrRslt上
                    arrRslt = arrRslt.concat(tmp);
                }
            }
        }
        return arrRslt;
    }
    function getPinyin(ss) {
        var str = $.trim(ss);
        if (str != "") {
            var arrRslt = makePy(str);
            return arrRslt[0];
        } else { return ""; }
    }
    //获取拼音首字母
    $.hisui.toChineseSpell=getPinyin;
    //考虑多音字情况 获取多组拼音首字母
    $.hisui.getChineseSpellArray=makePy;

})(jQuery);


/**
 * 扩展combobox
 */
(function ($) {
    $.extend($.fn.combobox.defaults, {
        defaultFilter:1,
        filter:function(q,row){
            var opts = $(this).combobox("options");
            var text=row[opts.textField];
            var defaultFilter=opts.defaultFilter||1;

            if (defaultFilter==2){ // 包含 不区分大小写
                return text.toLowerCase().indexOf(q.toLowerCase()) >- 1;
            }else if (defaultFilter==3){   // 左匹配 或拼音首字母左匹配 
                return text.toLowerCase().indexOf(q.toLowerCase()) ==0 || 
                        $.hisui.toChineseSpell(text).toLowerCase().indexOf(q.toLowerCase()) ==0;
            }else if (defaultFilter==4){  // 包含  或拼音首字母包含   不区分大小写
                return text.toLowerCase().indexOf(q.toLowerCase()) >-1 || 
                        $.hisui.toChineseSpell(text).toLowerCase().indexOf(q.toLowerCase()) >-1;
            }else{  //默认的  左匹配 不区分大小写
                return text.toLowerCase().indexOf(q.toLowerCase()) == 0;
            }
            
        }
    })
})(jQuery);

/**
*IE8--- console=undefined 
*logger.level=1; // debug,info,warn,error ---print
*logger.level=2; // info,warn,error ---print
*logger.level=3; // warn,error ---print
*logger.level=4; // error ---print
*logger.debug("debug");
*logger.info("info");
*logger.warn("warn");
*logger.error("error");
*/
$URL="websys.Broker.cls";
var Level = {
    DEBUG: 1,
    INFO: 2,
    WARN: 3,
    ERROR: 4
};
(function(){	
	if ("undefined" === typeof console){		
		var emptyFn = function(){}; 
		console = {
			log: emptyFn,
			debug: emptyFn,
			info: emptyFn,
			warn: emptyFn,
			error: emptyFn,
			assert: emptyFn,
			dir: emptyFn,
			dirxml: emptyFn,
			trace: emptyFn,
			group: emptyFn,
			groupCollapsed: emptyFn,
			time: emptyFn,
			timeEnd: emptyFn,
			profile: emptyFn,
			profileEnd: emptyFn,
			count: emptyFn,
			clear: emptyFn
		};
	}
    var Logger = function () {
        this.level = Level.ERROR; //Level.DEBUG;
    };
    Logger.prototype = {
        log: function (msg) {
            try { console.log(msg); } catch (ex) { }
        },
        debug: function (msg) {
            if (this.level <= Level.DEBUG) {
                this.log(msg);
				//console.trace();
            }
        },
        info: function (msg) {
            if (this.level <= Level.INFO) {
                this.log(msg);
            }
        },
        warn: function (msg) {
            if (this.level <= Level.WARN) {
                console.warn(msg);
				//console.trace();
            }
        },
        error: function (msg) {
            if (this.level <= Level.ERROR) {
                this.log(msg);
				console.trace();
            }
        }
	};
	logger = new Logger();
})();
/**
 * hisui---easyui 
*/
(function (a, $) {
    var HUIObject = {};
    // jquery.validatebox.js中写死了color
    $.fn.validatebox.defaults.tipOptions.onShow = function () {
        $(this).tooltip("tip");
    };
	//websys.combo.defaults.height=22修改成30
	$.fn.combo.defaults.width=177;
    $.fn.combo.defaults.height = 30;
	$.fn.combobox.defaults.height = 30;
	$.fn.combotree.defaults.height = 30;
	$.fn.combogrid.defaults.height = 30;
	$.fn.datebox.defaults.height = 30;
	$.fn.datetimebox.defaults.height = 30;
	$.fn.tabs.defaults.tabHeight=36;
    /*var cardHandler = function(){
        $(".panel-header.panel-header-card,.panel-header.panel-header-card-gray").each(function(){
			var _t = $(this);
			var opts = _t.parent().panel("options");
			if ("undefined"!=opts.titleWidth){
				_t.width(headText.length*20);
			}
            var headText = _t.find(".panel-title").text();
            if (headText.length<=4){
                _t.width(80);
            }else{
                _t.width(headText.length*20);
            }
        });
	}*/
	var mo ={
		numberbox:{
			superui:'validatebox'
		}
		,spinner:{
			superui:'validatebox'
		}
		,timespinner:{
			superui:'spinner'
		}
		,numberspinner:{
			superui:'spinner'
		}
		,combo:{
			superui:'validatebox'
		},
		combobox:{
			superui:'combo'
		},
		combogrid:{
			superui:'combo'
		},
		combotree:{
			superui:'combo'
		},
		window:{
            superui:'panel'
		},
		dialog:{
			superui:'window'
		},
		datebox:{
			superui:'combo'
		}
		,datetimebox:{
			superui:'datebox'
		}
		,menubutton:{
			superui:'linkbutton'
		}
		,splitbutton:{
			superui:'menubutton'
		}
		,propertygrid:{
			superui:'datagrid'
		}
		,treegrid:{
			superui:'datagrid'
		},lookup:{  //cryze 2018-5-10  新增lookup
			superui:'validatebox'
		}
		//,datagrid:{ //$.fn.datagrid.defaults=$.extend({},$.fn.panel.defaults,{...});
			//superui:'panel' 
		//}
	}
	//cryze 在combobox前增加combo
    var comps = ["draggable","droppable","resizable","pagination","tooltip","linkbutton","menu","menubutton","splitbutton","progressbar","tree","combo","combobox","combotree","combogrid","numberbox","validatebox","searchbox","numberspinner","timespinner","calendar","datebox","datetimebox","slider","layout","panel","datagrid","propertygrid","treegrid","tabs","accordion","window","dialog","checkbox","radio","switchbox",'filebox','popover','lookup','keywords','triggerbox'];
	$.each(comps, function (index, comp) {
        //index comp ---let
        HUIObject[comp] = function (selector, options) {
            if (!selector) return;
			var jqobj = $(selector);
			// options!=undefined --> render
            if ("undefined" != typeof options) {
                jqobj[comp](options);
            }
			// {jdata:data对象, jqselect:选择器, 祖先方法名:祖先方法, 父方法名:父方法, 方法名:方法}
			var obj = $.extend({ jdata: jqobj.data(comp) }, { jqselector: selector });
			function jqmth2objmth(){

			}
			// loop祖方法
			if (mo[comp] && mo[comp].superui && mo[mo[comp].superui] && mo[mo[comp].superui].superui ){
				$.each($.fn[ mo[mo[comp].superui].superui ].methods,function(mth,f){
					// if (mth=="getValue"){
					// 	console.log(comp+"的 getValue方法，来自"+mo[comp].superui+"的父"+mo[mo[comp].superui].superui+",f="+f);
					// }
					obj[mth] = function () {
						//es6 // $.fn[comp].methods[mth](jqobj,...arguments);
						var jo = $(this.jqselector); //this --->obj
						Array.prototype.splice.call(arguments,0,0,jo);
						var rtn = f.apply(jo,arguments);
						return rtn;
					}
				});
			}
			// loop parent component method 
			if (mo[comp] && mo[comp].superui){
				$.each($.fn[ mo[comp].superui ].methods,function(mth,f){
					// if (mth=="getValue"){
					// 	console.log(comp+"的 getValue方法，来自"+mo[comp].superui+",f="+f);
					// }
					obj[mth] = function () {
						//es6 // $.fn[comp].methods[mth](jqobj,...arguments);
						var jo = $(this.jqselector); //this --->obj
						Array.prototype.splice.call(arguments,0,0,jo);
						var rtn = f.apply(jo,arguments);
						return rtn;
					}
				});
			}
			// loop component method
			$.each($.fn[comp].methods, function(mth,f){
                obj[mth] = function () {
                    //es6 // $.fn[comp].methods[mth](jqobj,...arguments);
					var jo = $(this.jqselector); //this --->obj
					Array.prototype.splice.call(arguments,0,0,jo);
					var rtn = f.apply(jo,arguments);
					return rtn;
					/*
                    var param = [];
                    param.push(jo);
                    for (var j=0;j<arguments.length;j++){
                        param.push(arguments[j]);
					}
					//f.apply(jo,Array.prototype.slice.call(arguments))
                    var rtn = f.apply(jo, param); //$.fn[comp].methods[mth]
                    return rtn;*/
                }
			});
            return obj;
        }
    });
    /* 
    for(var c=0;c<comps.length;c++){
        var comp = comps[c];
        HUI.prototype[comp]=(function(comp){
            return function(selector,options){
                        if (!selector) return;
                        var jqobj = $(selector);
                        if ("undefined"!=typeof options){
                            jqobj[comp](options);
                        }		
                        var obj = $.extend({jdata:jqobj.data(comp)},{jqselector:selector});
                        for (var m in $.fn[comp].methods){ 
                            // let--var ; let时可以不用闭包返回
                            obj[m]=(function ($,mth){
                                return function(){
                                //es6 // $.fn[comp].methods[mth](jqobj,...arguments);
                                var jo = $(this.jqselector); //this --->obj
                                var param = [];
                                param.push(jo);
                                for (var j =0;j<arguments.length;j++){
                                    param.push(arguments[j]);
                                }
                                var rtn = $.fn[comp].methods[mth].apply(jo, param);
                                return rtn;
                            }
                        })(jQuery,m);
                        }
                        return obj;
                    }
        })(comp); 
    }	*/
    a.$HUI = HUIObject ; //$.extend(new HUI(), HUIObject);
    /*$.parser.onComplete = function(context){
        //cardHandler();
        // 第一次context为undefined,不为空跳出.
        if (!!context) return ;
        $("#Loading").fadeOut("fast");
        //ShowDHCMessageCount();
    }*/
})(window, jQuery);