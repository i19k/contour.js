const eTriangleType = require('./eTriangleType');
const Triangle = require('./Triangle');
const ColorMap = require('./ColorMap');

Domain.prototype = Object();
Domain.prototype.constructor = function (opts) {
    this.opts = {
        scaleFactor: 1.0,
        showDeformedShape: false,
        contourValuePath: null,
        displayValuePath: null
    };
    this.opts = Object.assign(this.opts, opts);

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

    for (let i = 0; i < this.elements.length; i++) {
        let elm = this.elements[i];

        let tris = elm.getTriangles();
        tris.forEach(t => colorTriangles.push(t.getColorTriangle(this.colorMap)));
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
        face.colorTriangle = colorTriangles[i];
        face.color = new THREE.Color(colorTriangles[i].color.toRGBString());
        geo.faces.push(face);
    }
    geo.computeBoundingSphere();

    return geo;
};

Domain.prototype.draw = function (scene) {
    let geo = this.getGeometry();

    let material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
    let ret = new THREE.Mesh(geo, material);

    scene.add(ret);
};

module.exports =  Domain;
