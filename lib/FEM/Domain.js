

const Domain = function () {
    this.elements = [];
    this.colorMap = null;
    this.vals = [];
};

Domain.getGeometry = function () {
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
        for (var r = 0; r < rects.length; r++) {
            elementTriangles = elementTriangles.concat(rects[r].getTriangles());
        }

        let elementColorTriangles = [];
        for (var j = 0; j < elementTriangles.length; j++) {
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

Domain.getSubTriangles = function (tri) {
    let sortedVertices = tri.vertices.slice().sort(function(a, b) { return a.val - b.val });


}

Domain.prototype = Object();
Domain.prototype.constructor = Domain;

function Domain() {

    this.getSubTriangles = function(tri) {

        if (tri.getType() == 2) {
            return [tri];
        }
        else if (tri.getType() == 1) {

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

            var intervalKeys = null;

            if (sortedVertices[0].val < sortedVertices[2].val) {
                var interval = this.getValueInterval(sortedVertices[0].val, sortedVertices[2].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(a)-parseFloat(b); });
            }
            else {
                var interval = this.getValueInterval(sortedVertices[2].val, sortedVertices[0].val);
                intervalKeys = Object.keys(interval);
                intervalKeys.sort( function (a, b){ return parseFloat(b)-parseFloat(a); });
            }

            var intervalVertices = [];

            intervalVertices.push(sortedVertices[0]);
            intervalVertices.push(sortedVertices[1]);

            // bottom line of big triangle
            for (i = 0; i < intervalKeys.length; i++){
                var vertex = findCoordinate(sortedVertices[0], sortedVertices[2], intervalKeys[i]);
                var vertex2 = findCoordinate(sortedVertices[1], sortedVertices[2], intervalKeys[i]);

                intervalVertices.push(vertex);
                intervalVertices.push(vertex2);
            }

            var ret = [];
            // middle rectangles to triangles
            for (i = 0; i < intervalVertices.length - 2; i = i + 2){
                var tri1 = new Triangle(intervalVertices[i], intervalVertices[i + 1], intervalVertices[i + 2]);
                var tri2 = new Triangle(intervalVertices[i + 2], intervalVertices[i + 1], intervalVertices[i + 3]);

                ret.push(tri1);
                ret.push(tri2);
            }

            // the top triangle
            var tri = new Triangle(intervalVertices[intervalVertices.length - 2], intervalVertices[intervalVertices.length - 1], sortedVertices[2]);
            ret.push(tri);


            return ret;
        }
        else if (tri.getType() == 0) {
            var pMid = findCoordinate(sortedVertices[0], sortedVertices[2], sortedVertices[1].val);

            ret = [];
            ret = ret.concat(this.getSubTriangles(new Triangle(sortedVertices[0], sortedVertices[1], pMid)));
            ret = ret.concat(this.getSubTriangles(new Triangle(pMid, sortedVertices[1], sortedVertices[2])));

            return ret;
        }
    };

    this.getSubRectangles = function(rect) {
        if (rect.vertices.length < 4)
            return [rect];

        var groups = rect.getVertexGroups();

        if (groups.length == 1)
            return [rect]

        if (groups.length == 2) {
            if (groups[0].length == 2 && groups[1].length == 2) {
                var interval = this.getValueInterval(groups[0][0].val, groups[1][0].val);

                var keys1 = Object.keys(interval);
                ret = [];
                var v1 = groups[0][1];
                var v2 = groups[0][0];
                for (var i = 0; i < keys1.length; i++) {
                    var vertex = findCoordinate(groups[0][1], groups[1][0], keys1[i]);
                    var vertex2 = findCoordinate(groups[0][0], groups[1][1], keys1[i]);

                    ret = ret.concat(new Rectangle(v1, vertex, vertex2, v2));

                    v1 = vertex;
                    v2 = vertex2;
                }

                ret = ret.concat(new Rectangle(v1, groups[1][0], groups[1][1], v2));

                return ret;
            }
            else {
                if (groups[0].length == 1 && groups[1].length == 3) {
                    return [new Triangle(groups[0][0], groups[1][0], groups[1][2]),
                        new Triangle(groups[1][0], groups[1][1], groups[1][2])];
                } else  if (groups[0].length == 3 && groups[1].length == 1) {
                    return [new Triangle(groups[1][0], groups[0][0], groups[0][2]),
                        new Triangle(groups[0][0], groups[0][1], groups[0][2])];
                }
            }
        }
        else if (groups.length == 3) {
            var maxGr = groups.slice().sort((a, b) =>  parseFloat(b[0].val) - parseFloat(a[0].val))[0];
            var minGr = groups.slice().sort((a, b) => parseFloat(a[0].val) - parseFloat(b[0].val))[0];
            var midGr = groups.filter(gr => maxGr != gr && minGr != gr)[0];
            var midGrIndex = groups.indexOf(midGr);
            var prevGr = groups[midGrIndex - 1 > -1 ? midGrIndex - 1 : groups.length - 1];
            var nextGr = groups[midGrIndex + 1 < groups.length ? midGrIndex + 1 : 0];

            if (midGr.length == 2) {
                var vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);

                var tri1 = new Triangle(prevGr[0], midGr[0], vertex);
                var tri2 = new Triangle(vertex, midGr[0], midGr[1]);
                var tri3 = new Triangle(vertex, midGr[1], nextGr[0]);

                return [tri1, tri2, tri3];
            } else {
                ret = []

                if (minGr.length == 2) {
                    if (minGr == prevGr) {
                        vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                        tri1 = new Triangle(vertex, midGr[0], maxGr[0]);
                        rectangles = this.getSubRectangles(new Rectangle(minGr[1], midGr[0], vertex, minGr[0]));
                    } else if (minGr == nextGr) {
                        vertex = findCoordinate(minGr[1], maxGr[0], midGr[0].val);
                        tri1 = new Triangle(vertex, maxGr[0], midGr[0]);
                        rectangles = this.getSubRectangles(new Rectangle(minGr[1], vertex, midGr[0], minGr[0]));
                    }
                } else if (maxGr.length == 2) {
                    if (maxGr == prevGr) {
                        vertex = findCoordinate(minGr[0], maxGr[0], midGr[0].val);
                        tri1 = new Triangle(vertex, midGr[0], minGr[0]);
                        rectangles = this.getSubRectangles(new Rectangle(maxGr[1], midGr[0], vertex, maxGr[0]));
                    } else if (maxGr == nextGr) {
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

    this.getValueInterval = function(value1, value2){
        var val1 = this.colorMap.getMappedValue(value1);
        var val2 = this.colorMap.getMappedValue(value2);

        var keys = this.colorMap.keys
            .filter(function (key){
                return key < Math.max(val1, val2) && key > Math.min(val1, val2)
            })
            .sort(function(a, b) { parseFloat(a) - parseFloat(b) });

        ret = {};
        for (i = 0; i < keys.length; i++){
            ret[this.colorMap.getValue(parseFloat(keys[i]))] = this.colorMap.colors[keys[i]];
        }
        return ret;
    }

}