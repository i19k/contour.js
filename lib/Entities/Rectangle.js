const Element = require('./Element');
const Triangle = require('./Triangle');

Rectangle.prototype = new Element();

Rectangle.prototype.constructor = function (v1, v2, v3, v4) {
    this.vertices = [v1, v2, v3, v4];
};

Rectangle.prototype.getTriangles = function() {
    return [new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]),
        new Triangle(this.vertices[0], this.vertices[2], this.vertices[3])];
};

Rectangle.prototype.getVertexGroups = function() {
    let ret = [];
    let lastRet = [];

    lastRet.push(this.vertices[0]);
    for (let i = 1; i < this.vertices.length; i++) {
        if (valueEqual(lastRet[0].val, this.vertices[i].val)) {
            lastRet.push(this.vertices[i]);
        } else {
            ret.push(lastRet);
            lastRet = [this.vertices[i]];
        }
    }

    ret.push(lastRet);

    return this.normalizeGroups(ret);
};

Rectangle.prototype.normalizeGroups = function(groups){
    let ret = groups.slice();
    if (ret.length > 2) {
        if(valueEqual(ret[0][0].val, ret[ret.length - 1][0].val)) {
            for (let i = ret[ret.length - 1].length - 1; i > -1; i--){
                ret[0].insert(0, ret[ret.length - 1][i]);
            }

            ret.splice(ret.length - 1, 1);
            ret = this.normalizeGroups(ret);
        }
    }

    return ret;
};

module.exports = Rectangle;