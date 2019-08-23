import ColorMap from './ColorMap'
import ColorTriangle from './ColorTriangle';
import * as THREE from 'three'

export default class Domain {
    constructor (opts) {
        this.opts = {
            scaleFactor: 1.0,
            showDeformedShape: false,
            contourValuePath: null,
            displayValuePath: null
        };
        this.opts = Object.assign(this.opts, opts);

        this.elements = [];
        this.colorMap = null;
        this.vals = null;
    };

    addElement (elm) {
        this.elements.splice(this.elements.length, 0, elm);
    };

    addElements (elms) {
        this.elements.splice(this.elements.length, 0, ...elms);
    };

    getColorTriangles () {
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

            let tris = elm.getTriangles(this.colorMap);
            tris.forEach(t => colorTriangles.push(t.getColorTriangle(this.colorMap)));
        }

        return colorTriangles;
    }

    getGeometry () {
        let colorTriangles = this.getColorTriangles();

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
}
