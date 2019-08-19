
Vertex.prototype = Object();

Vertex.prototype.constructor = function (x, y, z, val) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.val = val;
};

Vertex.prototype.toString = function () {
    return "("  + this.x + "," + this.y + "," + this.z + ")" + "[" + this.val + "]"
};

module.exports = Vertex;