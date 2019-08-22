const Element = require('./Element');
const Triangle = require('./Triangle');
const util = require('../util');

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
        if (util.equalTol(lastRet[0].val, this.vertices[i].val)) {
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
        if(util.equalTol(ret[0][0].val, ret[ret.length - 1][0].val)) {
            for (let i = ret[ret.length - 1].length - 1; i > -1; i--){
                ret[0].insert(0, ret[ret.length - 1][i]);
            }

            ret.splice(ret.length - 1, 1);
            ret = this.normalizeGroups(ret);
        }
    }

    return ret;
};

Domain.prototype.getTriangles = function (colorMap) {
    let subRects = this.getSubRectangles(colorMap);
    let subTriangles = [];
    for (let i = 0; i < subRects.length; i++) {
        subTriangles = subTriangles.concat(subRects[i].getTriangles());
    }

    subTriangles.forEach(st => st.master = this);

    return subTriangles;
};

Domain.prototype.getSubRectangles = function (colorMap) {
    if (this.vertices.length < 4)
        return [this];

    let groups = this.getVertexGroups();

    if (groups.length === 1)
        return [this];

    if (groups.length === 2) {
        if (groups[0].length === 2 && groups[1].length === 2) {
            let interval = colorMap.getValueInterval(groups[0][0].val, groups[1][0].val);

            let keys1 = Object.keys(interval);
            let ret = [];
            let v1 = groups[0][1];
            let v2 = groups[0][0];
            for (let i = 0; i < keys1.length; i++) {
                let vertex = util.findCoordinate(groups[0][1], groups[1][0], keys1[i]);
                let vertex2 = util.findCoordinate(groups[0][0], groups[1][1], keys1[i]);

                ret = ret.concat(new Rectangle(v1, vertex, vertex2, v2));

                v1 = vertex;
                v2 = vertex2;
            }

            ret = ret.concat(new Rectangle(v1, groups[1][0], groups[1][1], v2));

            return ret;
        }
        else {
            if (groups[0].length === 1 && groups[1].length === 3) {
                return [new Triangle(groups[0][0], groups[1][0], groups[1][2]),
                    new Triangle(groups[1][0], groups[1][1], groups[1][2])];
            } else  if (groups[0].length === 3 && groups[1].length === 1) {
                return [new Triangle(groups[1][0], groups[0][0], groups[0][2]),
                    new Triangle(groups[0][0], groups[0][1], groups[0][2])];
            }
        }
    }
    else if (groups.length === 3) {
        let maxGr = groups.slice().sort((a, b) =>  parseFloat(b[0].val) - parseFloat(a[0].val))[0];
        let minGr = groups.slice().sort((a, b) => parseFloat(a[0].val) - parseFloat(b[0].val))[0];
        let midGr = groups.filter(gr => maxGr !== gr && minGr !== gr)[0];
        let midGrIndex = groups.indexOf(midGr);
        let prevGr = groups[midGrIndex - 1 > -1 ? midGrIndex - 1 : groups.length - 1];
        let nextGr = groups[midGrIndex + 1 < groups.length ? midGrIndex + 1 : 0];

        if (midGr.length === 2) {
            let vertex = util.findCoordinate(minGr[0], maxGr[0], midGr[0].val);

            let tri1 = new Triangle(prevGr[0], midGr[0], vertex);
            let tri2 = new Triangle(vertex, midGr[0], midGr[1]);
            let tri3 = new Triangle(vertex, midGr[1], nextGr[0]);

            return [tri1, tri2, tri3];
        } else {
            let ret = [];
            let vertex = null;
            let tri1 = null;
            let rectangles = [];

            if (minGr.length === 2) {
                if (minGr === prevGr) {
                    vertex = util.findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, midGr[0], maxGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(minGr[1], midGr[0], vertex, minGr[0]));
                } else if (minGr === nextGr) {
                    vertex = util.findCoordinate(minGr[1], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, maxGr[0], midGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(minGr[1], vertex, midGr[0], minGr[0]));
                }
            } else if (maxGr.length === 2) {
                if (maxGr === prevGr) {
                    vertex = util.findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, midGr[0], minGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(maxGr[1], midGr[0], vertex, maxGr[0]));
                } else if (maxGr === nextGr) {
                    vertex = util.findCoordinate(minGr[0], maxGr[1], midGr[0].val);
                    tri1 = new Triangle(vertex, minGr[0], midGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(maxGr[1], vertex, midGr[0], maxGr[0]));
                }
            }

            ret.push(tri1);
            ret = ret.concat(rectangles);
            return ret;
        }
    }

    return [this];
};

module.exports = Rectangle;