;(function ($, window) {
 
var intervals = {};
var removeListener = function(selector) {
 
if (intervals[selector]) {
window.clearInterval(intervals[selector]);
intervals[selector] = null;
}
};
var found = 'waitUntilExists.found';
 
/**
* @function
* @property {object} jQuery plugin which runs handler function once specified
* element is inserted into the DOM
* @param {function|string} handler
* A function to execute at the time when the element is inserted or
* string "remove" to remove the listener from the given selector
* @param {bool} shouldRunHandlerOnce
* Optional: if true, handler is unbound after its first invocation
* @example jQuery(selector).waitUntilExists(function);
*/
$.fn.waitUntilExists = function(handler, shouldRunHandlerOnce, isChild) {
var selector = this.selector;
var $this = $(selector);
var $elements = $this.not(function() { return $(this).data(found); });
console.log($elements); 
if (handler === 'remove') {
// Hijack and remove interval immediately if the code requests
removeListener(selector);
}
else {
 
// Run the handler on all found elements and mark as found
$elements.each(handler).data(found, true);
if (shouldRunHandlerOnce && $this.length) {
// Element was found, implying the handler already ran for all
// matched elements
removeListener(selector);
}
else if (!isChild) {
// If this is a recurring search or if the target has not yet been
// found, create an interval to continue searching for the target
intervals[selector] = window.setInterval(function () {
$this.waitUntilExists(handler, shouldRunHandlerOnce, true);
}, 500);
}
}
return $this;
};
}(jQuery, window));
