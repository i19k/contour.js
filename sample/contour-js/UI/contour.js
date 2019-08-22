Array.prototype.insert = function ( index, item ) {
    this.splice( index, 0, item );
};

Vertex.prototype = new THREE.Vector3();
Vertex.prototype.constructor = Vertex;
function Vertex(x, y, z, val){
    this.x = x;
    this.y = y;
    this.z = z;
    this.val = val;

    this.toString = function(){
        return "("  + this.x + "," + this.y + "," + this.z + ")" + "[" + this.val + "]"
    }
}

ColorTriangle.prototype = new THREE.Face3();
ColorTriangle.prototype.constructor = ColorTriangle;
function ColorTriangle(v1, v2, v3, color) {
    this.vertices = [v1, v2, v3];
    this.color = color;

    this.draw = function(){
        var geometry = new THREE.Geometry();
        geometry.vertices = this.vertices;
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        geometry.computeBoundingSphere();

        var material = new THREE.MeshBasicMaterial( {color: this.color, side: THREE.DoubleSide} );
        var ret = new THREE.Mesh(geometry, material);

        ret.tri = this;

        return ret;
    }

    this.getInnerValue = function(x, y) {
        var totalW = 0.0;
        var totalValue = 0.0;

        for (var i = 0; i < this.vertices.length; i++) {
            var d = Math.sqrt(Math.pow(x - this.vertices[i].x, 2) + Math.pow(y - this.vertices[i].y, 2));
            if (d == 0) {
                return this.vertices[i].val;
            }

            var w = 1.0 / d;

            totalW += w;
            totalValue += w * this.vertices[i].val;
        }

        return totalValue / totalW;
    }
}

ColorMap.prototype = Object();
ColorMap.prototype.constructor = ColorMap;
function ColorMap() {

    this.colors = {};
    this.rgbColors = {};

    this.minValue = 0;
    this.maxValue = 0;

    this.getMain = function(val) {
        var ret = 0.0;

        if (val <= -0.75) ret = 0.0;
        else if (val <= -0.25) ret = this.interpolate(val, 0.0, -0.75, 1.0, -0.25);
        else if (val <= 0.25) ret = 1.0;
        else if (val <= 0.75) ret = this.interpolate(val, 1.0, 0.25, 0.0, 0.75);
        else ret = 0.0;

        return Math.round(ret * 1e6) / 1e6;
    };

    this.interpolate = function(val, y0, x0, y1, x1) {
        return (val - x0) * (y1 - y0) / (x1 - x0) + y0;
    };

    this.init = function(vals, minValue, maxValue) {
        this.keys = [];
        this.colors = [];
        this.rgbColors = [];

        this.minValue = minValue;
        this.maxValue = maxValue;

        if (Array.isArray(vals)) {
            this.keys.push(this.getMappedValue(this.minValue));
            this.keys.push(this.getMappedValue(this.maxValue));

            for (var i = 0; i < vals.length; i++) {
                if (vals[i] > minValue && vals[i] < maxValue) {
                    this.keys.push(this.getMappedValue(vals[i]));
                }
            }
        }
        else {
            var incPos = 1.5 / (vals - 1);
            for (var i = -0.75; i <= 0.75; i+= incPos) {
                this.keys.push(i);
            }
        }

        this.keys.sort(function(a, b) { return a - b });

        var inc = 1.3 / (this.keys.length - 1.0);
        for (var i = 0; i < this.keys.length; i++) {
            var val = i * inc - 0.6;

            var red = this.getMain(val + 0.5);
            var green = this.getMain(val);
            var blue = this.getMain(val - 0.5);

            var color = 'rgb('+ Math.ceil(red * 255.0) + ','
                + Math.ceil(green * 255.0) + ','
                + Math.ceil(blue * 255.0) +')';

            this.colors.push(new THREE.Color(color));
            this.rgbColors.push(color);
        }

        this.colors.reverse();
        this.rgbColors.reverse();

    };

    this.getColor = function(val) {
        for (var i = 0; i < this.keys.length; i++) {
            if(this.keys[i] >= val) {
                return this.colors[i];
            }
        }

        return this.getColor(this.keys[this.keys.length - 1]);
    };

    this.getRGBColor = function(val) {
        for (var i = 0; i < this.keys.length; i++) {
            if(this.keys[i] >= val) {
                return this.rgbColors[i];
            }
        }

        return this.getRGBColor(this.keys[this.keys.length - 1]);
    };

    this.getMappedValue = function(val) {
        var d = this.maxValue - this.minValue;
        return (((val - this.minValue) / d) * 1.5) - 0.75;
    };

    this.getValue = function(mappedValue) {
        var d = this.maxValue - this.minValue;
        return ((mappedValue + 0.75) / 1.5) * (d) + this.minValue;
    };
}

Element.prototype = Object();
Element.prototype.constructor = Element;
function Element() {
    this.vertices = []

    this.getTriangles = function() { return []};
}

Triangle.prototype = new Element();
Triangle.prototype.constructor = Triangle;
function Triangle(v1, v2, v3) {
    this.vertices = [v1, v2, v3];

    this.getTriangles = function() {
        return [this];
    }

    this.getType = function(){
        var a = this.vertices[0].val
        var b = this.vertices[1].val
        var c = this.vertices[2].val
        if(a === b && b === c)
            return 2;
        else if(a === b || b === c || a === c)
            return 1;
        else
            return 0;
    }
}

Rectangle.prototype = new Element();
Rectangle.prototype.constructor = Rectangle;
function Rectangle(v1, v2, v3, v4) {
    this.vertices = [v1, v2, v3, v4];

    this.getTriangles = function() {
        return [new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]),
                new Triangle(this.vertices[0], this.vertices[2], this.vertices[3])];
    }

    this.getVertexGroups = function() {
        var ret = [];
        var lastRet = [];

        lastRet.push(this.vertices[0]);
        for (var i = 1; i < this.vertices.length; i++) {
            if (valueEqual(lastRet[0].val, this.vertices[i].val)) {
                lastRet.push(this.vertices[i]);
            } else {
                ret.push(lastRet);
                lastRet = [this.vertices[i]];
            }
        }

        ret.push(lastRet);

        return this.normalizeGroups(ret);
    }

    this.normalizeGroups = function(groups){
        var ret = groups.slice();
        if (ret.length > 2) {
            if(valueEqual(ret[0][0].val, ret[ret.length - 1][0].val)) {
                for (var i = ret[ret.length - 1].length - 1; i > -1; i--){
                    ret[0].insert(0, ret[ret.length - 1][i]);
                }

                ret.splice(ret.length - 1, 1);
                ret = this.normalizeGroups(ret);
            }
        }

        return ret;
    }

}

Domain.prototype = Object();
Domain.prototype.constructor = Domain;
function Domain() {
    this.elements = [];
    this.colorMap = null;
    this.vals = [];

    this.draw = function(scene) {

        maxValue = Math.max.apply(Math, this.elements.map(o => Math.max.apply(Math, o.vertices.map(v => v.val))));
        minValue = Math.min.apply(Math, this.elements.map(o => Math.min.apply(Math, o.vertices.map(v => v.val))));

        this.colorMap = new ColorMap();
        if (!Array.isArray(this.vals)) {
            this.colorMap.init(10, minValue, maxValue);
        }
        else {
            this.colorMap.init(this.vals, minValue, maxValue);
        }

        colorTriangles = [];
        triangles = [];
        for (var i = 0; i < this.elements.length; i++) {
            elm = this.elements[i];
            var rects = this.getSubRectangles(elm);

            elementTriangles = [];
            for (var r = 0; r < rects.length; r++) {
                elementTriangles = elementTriangles.concat(rects[r].getTriangles());
            }

            elementColorTriangles = [];
            for (var j = 0; j < elementTriangles.length; j++) {
                elementColorTriangles = elementColorTriangles.concat(this.getSubTriangles(elementTriangles[j]));
            }
            elementColorTriangles.forEach(function(tri) {tri.element = elm});


            triangles = triangles.concat(elementColorTriangles);

        }

        for (var i = 0; i < triangles.length; i++) {
            var tri = triangles[i];

            var mean = 0;
            for (var j = 0; j < tri.vertices.length; j++) {
                mean = mean + parseFloat(tri.vertices[j].val);
            }
            mean = mean / tri.vertices.length;

            color = this.colorMap.getColor(this.colorMap.getMappedValue(mean));

            colorTriangle = new ColorTriangle(tri.vertices[0], tri.vertices[1], tri.vertices[2], color);
            colorTriangle.model = tri;
            colorTriangles.push(colorTriangle);
        }

        var geo = new THREE.Geometry();

        for (var i = 0; i < colorTriangles.length; i++) {

            for (var j = 0; j < colorTriangles[i].vertices.length; j++) {
                if (!(colorTriangles[i].vertices[j] in geo.vertices)) {
                    geo.vertices.push(colorTriangles[i].vertices[j]);
                }
            }

            var face = new THREE.Face3(
                geo.vertices.indexOf(colorTriangles[i].vertices[0]),
                geo.vertices.indexOf(colorTriangles[i].vertices[1]),
                geo.vertices.indexOf(colorTriangles[i].vertices[2])
            );
            face.tri = colorTriangles[i];
            face.color = colorTriangles[i].color;
            geo.faces.push(face);
        }
        geo.computeBoundingSphere();

        var material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
        var ret = new THREE.Mesh(geo, material);

        scene.add(ret);
    }

    this.getSubTriangles = function(tri) {
        var sortedVertices = tri.vertices.slice().sort(function(a, b) { return a.val - b.val });

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

    this.addElement = function (elm) {
        this.elements.splice(this.elements.length - 1, 0, elm);
    };

    this.addElements = function (elms) {
        this.elements.splice(this.elements.length - 1, 0, elms);
    };
}



findCoordinate = function(v1, v2, value) {
    var dist1 =  Math.abs(value - v1.val);
    var dist2 = Math.abs(value - v2.val);
    var ratio = dist1 / (dist1 + dist2);

    var dx = (v2.x - v1.x) * ratio;
    var dy = (v2.y - v1.y) * ratio;
    var dz = (v2.z - v1.z) * ratio;

    return new Vertex(v1.x + dx, v1.y + dy, v1.z + dz, value);
}

valueEqual = function(val1, val2) {
    return Math.abs(val1 - val2) < 1e-6;
}