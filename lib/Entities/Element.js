

Element.prototype = Object();
Element.prototype.constructor = function () {
    this.vertices = [];
};

Element.prototype.getTriangles = function() { return []};

module.exports = Element;