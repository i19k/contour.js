const Element = require('./Element');
const util = require('../util');
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
    if(util.equalTol(a, b) && util.equalTol(b, c))
        return eTriangleType.equilateral;
    else if(a === b || b === c || a === c)
        return eTriangleType.isosceles;
    else
        return eTriangleType.scalene;
};

Triangle.prototype.getTriangles = function (colorMap) {

    let ret = [];

    let sortedVertices = this.vertices.slice().sort(function(a, b) { return a.val - b.val });
    let triType = this.getType();

    switch (triType) {
        case eTriangleType.scalene: {
            let pMid = util.findCoordinate(sortedVertices[0], sortedVertices[2], sortedVertices[1].val);

            ret = ret.concat(this.getSubTriangles(new Triangle(sortedVertices[0], sortedVertices[1], pMid)));
            ret = ret.concat(this.getSubTriangles(new Triangle(pMid, sortedVertices[1], sortedVertices[2])));
        } break;

        case eTriangleType.isosceles: {
            let temp = null;

            if(sortedVertices[0].val === sortedVertices[2].val) {
                temp = sortedVertices[1];
                sortedVertices[1] = sortedVertices[2];
                sortedVertices[2] = temp;
            }
            else if(sortedVertices[1].val === sortedVertices[2].val) {
                temp = sortedVertices[0];
                sortedVertices[0] = sortedVertices[2];
                sortedVertices[2] = temp;
            }

            let intervalKeys = null;

            if (sortedVertices[0].val < sortedVertices[2].val) {
                let interval = colorMap.getValueInterval(sortedVertices[0].val, sortedVertices[2].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(a)-parseFloat(b); });
            }
            else {
                let interval = colorMap.getValueInterval(sortedVertices[2].val, sortedVertices[0].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(b)-parseFloat(a); });
            }

            let intervalVertices = [];

            intervalVertices.push(sortedVertices[0]);
            intervalVertices.push(sortedVertices[1]);

            // bottom line of big triangle
            for (let i = 0; i < intervalKeys.length; i++){
                let vertex = util.findCoordinate(sortedVertices[0], sortedVertices[2], intervalKeys[i]);
                let vertex2 = util.findCoordinate(sortedVertices[1], sortedVertices[2], intervalKeys[i]);

                intervalVertices.push(vertex);
                intervalVertices.push(vertex2);
            }

            // middle rectangles to triangles
            for (let i = 0; i < intervalVertices.length - 2; i = i + 2){
                let tri1 = new Triangle(intervalVertices[i], intervalVertices[i + 1], intervalVertices[i + 2]);
                let tri2 = new Triangle(intervalVertices[i + 2], intervalVertices[i + 1], intervalVertices[i + 3]);

                ret.push(tri1);
                ret.push(tri2);
            }

            // the top triangle
            let tri = new Triangle(intervalVertices[intervalVertices.length - 2], intervalVertices[intervalVertices.length - 1], sortedVertices[2]);
            ret.push(tri);


        } break;

        case eTriangleType.equilateral: {
            ret = ret.concat([this]);
        }
    }

    ret.forEach(st => st.master = this);

    return ret;

};

Triangle.prototype.getColorTriangle = function (colorMap) {
    let mean = 0;
    for (let j = 0; j < this.vertices.length; j++) {
        mean = mean + parseFloat(this.vertices[j].val);
    }
    mean = mean / this.vertices.length;

    let color = colorMap.getColor(colorMap.getMappedValue(mean));

    let colorTriangle = new ColorTriangle(this.vertices[0], this.vertices[1], this.vertices[2], color);
    colorTriangle.master = this.master ? this.master : this;

    return colorTriangle;
};

module.exports = Triangle;