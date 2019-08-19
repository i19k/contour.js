const Element = require('./Element');
const eTriangleType = require('./eTriangleType');

Triangle.prototype = new Element();

Triangle.prototype.constructor = function (v1, v2, v3) {
    this.vertices = [v1, v2, v3];
};

Triangle.prototype.getTriangles = function() {
    return [this];
};

Triangle.prototype.getType = function(){
    let a = this.vertices[0].val;
    let b = this.vertices[1].val;
    let c = this.vertices[2].val;
    if(a === b && b === c)
        return eTriangleType.equilateral;
    else if(a === b || b === c || a === c)
        return eTriangleType.isosceles;
    else
        return eTriangleType.scalene;
};

module.exports = Triangle;