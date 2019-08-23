const THREE = require('three');

export default class ColorTriangle {
    constructor (v1, v2, v3, color) {
        this.vertices = [v1, v2, v3];
        this.color = color;
    };

    draw () {
        let geometry = new THREE.Geometry();
        geometry.vertices = this.vertices;
        geometry.faces.push(new THREE.Face3(0, 1, 2));
        geometry.computeBoundingSphere();

        let material = new THREE.MeshBasicMaterial( {color: this.color.toRGBString(), side: THREE.DoubleSide} );
        let ret = new THREE.Mesh(geometry, material);

        ret.tri = this;

        return ret;
    };

    getInnerValue (x, y) {
        let totalW = 0.0;
        let totalValue = 0.0;

        for (let i = 0; i < this.vertices.length; i++) {
            let d = Math.sqrt(Math.pow(x - this.vertices[i].x, 2) + Math.pow(y - this.vertices[i].y, 2));
            if (d === 0) {
                return this.vertices[i].val;
            }

            let w = 1.0 / d;

            totalW += w;
            totalValue += w * this.vertices[i].val;
        }

        return totalValue / totalW;
    };
}