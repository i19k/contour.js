

Element.prototype = Object();
Element.prototype.constructor = function () {
    this.vertices = [];
};

Element.prototype.getTriangles = function(colorMap) { return []};

module.exports = Element;