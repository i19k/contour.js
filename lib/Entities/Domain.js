const eTriangleType = require('./eTriangleType');
const Triangle = require('./Triangle');
const ColorMap = require('./ColorMap');

Domain.prototype = Object();

Domain.prototype.constructor = function () {
    this.elements = [];
    this.colorMap = null;
    this.vals = [];
};

Domain.prototype.getGeometry = function () {
    let maxValue = Math.max.apply(Math, this.elements.map(o => Math.max.apply(Math, o.vertices.map(v => v.val))));
    let minValue = Math.min.apply(Math, this.elements.map(o => Math.min.apply(Math, o.vertices.map(v => v.val))));

    this.colorMap = new ColorMap();

    if (!Array.isArray(this.vals)) {
        this.colorMap.init(10, minValue, maxValue);
    } else {
        this.colorMap.init(this.vals, minValue, maxValue);
    }

    let colorTriangles = [];
    let triangles = [];

    for (let i = 0; i < this.elements.length; i++) {
        let elm = this.elements[i];
        let rects = this.getSubRectangles(elm);

        let elementTriangles = [];
        for (let r = 0; r < rects.length; r++) {
            elementTriangles = elementTriangles.concat(rects[r].getTriangles());
        }

        let elementColorTriangles = [];
        for (let j = 0; j < elementTriangles.length; j++) {
            elementColorTriangles = elementColorTriangles.concat(this.getSubTriangles(elementTriangles[j]));
        }
        elementColorTriangles.forEach(function(tri) {tri.element = elm});


        triangles = triangles.concat(elementColorTriangles);
    }

    for (let i = 0; i < triangles.length; i++) {
        let tri = triangles[i];

        let mean = 0;
        for (let j = 0; j < tri.vertices.length; j++) {
            mean = mean + parseFloat(tri.vertices[j].val);
        }
        mean = mean / tri.vertices.length;

        let color = this.colorMap.getColor(this.colorMap.getMappedValue(mean));

        let colorTriangle = new ColorTriangle(tri.vertices[0], tri.vertices[1], tri.vertices[2], color);
        colorTriangle.model = tri;
        colorTriangles.push(colorTriangle);
    }

    let geo = new THREE.Geometry();
    for (let i = 0; i < colorTriangles.length; i++) {

        for (let j = 0; j < colorTriangles[i].vertices.length; j++) {
            if (!(colorTriangles[i].vertices[j] in geo.vertices)) {
                geo.vertices.push(colorTriangles[i].vertices[j]);
            }
        }

        let face = new THREE.Face3(
            geo.vertices.indexOf(colorTriangles[i].vertices[0]),
            geo.vertices.indexOf(colorTriangles[i].vertices[1]),
            geo.vertices.indexOf(colorTriangles[i].vertices[2])
        );
        face.tri = colorTriangles[i];
        face.color = colorTriangles[i].color;
        geo.faces.push(face);
    }
    geo.computeBoundingSphere();

    return geo;
};

Domain.prototype.getSubTriangles = function (tri) {
    let sortedVertices = tri.vertices.slice().sort(function(a, b) { return a.val - b.val });

    let triType = tri.getType();

    switch (triType) {
        case eTriangleType.scalene: {
            let pMid = findCoordinate(sortedVertices[0], sortedVertices[2], sortedVertices[1].val);

            let ret = [];
            ret = ret.concat(this.getSubTriangles(new Triangle(sortedVertices[0], sortedVertices[1], pMid)));
            ret = ret.concat(this.getSubTriangles(new Triangle(pMid, sortedVertices[1], sortedVertices[2])));

            return ret;
        }

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
                let interval = this.getValueInterval(sortedVertices[0].val, sortedVertices[2].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(a)-parseFloat(b); });
            }
            else {
                let interval = this.getValueInterval(sortedVertices[2].val, sortedVertices[0].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(b)-parseFloat(a); });
            }

            let intervalVertices = [];

            intervalVertices.push(sortedVertices[0]);
            intervalVertices.push(sortedVertices[1]);

            // bottom line of big triangle
            for (i = 0; i < intervalKeys.length; i++){
                let vertex = findCoordinate(sortedVertices[0], sortedVertices[2], intervalKeys[i]);
                let vertex2 = findCoordinate(sortedVertices[1], sortedVertices[2], intervalKeys[i]);

                intervalVertices.push(vertex);
                intervalVertices.push(vertex2);
            }

            let ret = [];
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


            return ret;
        }

        case eTriangleType.equilateral: {
            return [tri];
        }
    }

};

Domain.prototype.getSubRectangles = function (rect) {
    if (rect.vertices.length < 4)
        return [rect];

    let groups = rect.getVertexGroups();

    if (groups.length === 1)
        return [rect];

    if (groups.length === 2) {
        if (groups[0].length === 2 && groups[1].length === 2) {
            let interval = this.getValueInterval(groups[0][0].val, groups[1][0].val);

            let keys1 = Object.keys(interval);
            let ret = [];
            let v1 = groups[0][1];
            let v2 = groups[0][0];
            for (let i = 0; i < keys1.length; i++) {
                let vertex = findCoordinate(groups[0][1], groups[1][0], keys1[i]);
                let vertex2 = findCoordinate(groups[0][0], groups[1][1], keys1[i]);

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
            let vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);

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
                    vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, midGr[0], maxGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(minGr[1], midGr[0], vertex, minGr[0]));
                } else if (minGr === nextGr) {
                    vertex = findCoordinate(minGr[1], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, maxGr[0], midGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(minGr[1], vertex, midGr[0], minGr[0]));
                }
            } else if (maxGr.length === 2) {
                if (maxGr === prevGr) {
                    vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                    tri1 = new Triangle(vertex, midGr[0], minGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(maxGr[1], midGr[0], vertex, maxGr[0]));
                } else if (maxGr === nextGr) {
                    vertex = findCoordinate(minGr[0], maxGr[1], midGr[0].val);
                    tri1 = new Triangle(vertex, minGr[0], midGr[0]);
                    rectangles = this.getSubRectangles(new Rectangle(maxGr[1], vertex, midGr[0], maxGr[0]));
                }
            }

            ret.push(tri1);
            ret = ret.concat(rectangles);
            return ret;
        }
    }

    return [rect];
};

Domain.prototype.getValueInterval = function (value1, value2) {
    let val1 = this.colorMap.getMappedValue(value1);
    let val2 = this.colorMap.getMappedValue(value2);

    let keys = this.colorMap.keys
        .filter(function (key){
            return key < Math.max(val1, val2) && key > Math.min(val1, val2)
        })
        .sort((a,b) => parseFloat(a) - parseFloat(b));

    let ret = {};
    for (let i = 0; i < keys.length; i++){
        ret[this.colorMap.getValue(parseFloat(keys[i]))] = this.colorMap.colors[keys[i]];
    }
    return ret;
};

Domain.prototype.draw = function (scene) {
    let maxValue = Math.max.apply(Math, this.elements.map(o => Math.max.apply(Math, o.vertices.map(v => v.val))));
    let minValue = Math.min.apply(Math, this.elements.map(o => Math.min.apply(Math, o.vertices.map(v => v.val))));

    this.colorMap = new ColorMap();
    if (!Array.isArray(this.vals)) {
        this.colorMap.init(10, minValue, maxValue);
    }
    else {
        this.colorMap.init(this.vals, minValue, maxValue);
    }

    let colorTriangles = [];
    let triangles = [];
    for (let i = 0; i < this.elements.length; i++) {
        let elm = this.elements[i];
        let rects = this.getSubRectangles(elm);

        let elementTriangles = [];
        for (let r = 0; r < rects.length; r++) {
            elementTriangles = elementTriangles.concat(rects[r].getTriangles());
        }

        let elementColorTriangles = [];
        for (let j = 0; j < elementTriangles.length; j++) {
            elementColorTriangles = elementColorTriangles.concat(this.getSubTriangles(elementTriangles[j]));
        }
        elementColorTriangles.forEach(function(tri) {tri.element = elm});


        triangles = triangles.concat(elementColorTriangles);

    }

    for (let i = 0; i < triangles.length; i++) {
        let tri = triangles[i];

        let mean = 0;
        for (let j = 0; j < tri.vertices.length; j++) {
            mean = mean + parseFloat(tri.vertices[j].val);
        }
        mean = mean / tri.vertices.length;

        color = this.colorMap.getColor(this.colorMap.getMappedValue(mean));

        colorTriangle = new ColorTriangle(tri.vertices[0], tri.vertices[1], tri.vertices[2], color);
        colorTriangle.model = tri;
        colorTriangles.push(colorTriangle);
    }

    let geo = new THREE.Geometry();

    for (let i = 0; i < colorTriangles.length; i++) {

        for (let j = 0; j < colorTriangles[i].vertices.length; j++) {
            if (!(colorTriangles[i].vertices[j] in geo.vertices)) {
                geo.vertices.push(colorTriangles[i].vertices[j]);
            }
        }

        let face = new THREE.Face3(
            geo.vertices.indexOf(colorTriangles[i].vertices[0]),
            geo.vertices.indexOf(colorTriangles[i].vertices[1]),
            geo.vertices.indexOf(colorTriangles[i].vertices[2])
        );
        face.tri = colorTriangles[i];
        face.color = colorTriangles[i].color;
        geo.faces.push(face);
    }
    geo.computeBoundingSphere();

    let material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
    let ret = new THREE.Mesh(geo, material);

    scene.add(ret);
};

module.exports =  Domain;
