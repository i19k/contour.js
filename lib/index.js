const Domain = require('./Entities/Domain');
const Vertex = require('./Entities/Vertex');
const THREE = require('three');
const MyThree = require('./threejs/MyThree');

export default class Contour {
    constructor (three) {
        this.three = three;
        this.domains = []
    };

    clear () {
        this.three.scene.__objects.forEach(obj => {
            this.three.scene.remove(obj);
            if (obj.geometry) {
                obj.geometry.dispose();
            }
            if (obj.material) {
                if (obj.material instanceof THREE.MeshFaceMaterial) {
                    obj.material.materials.forEach(mat => {
                        mat.dispose();
                    })
                } else {
                    obj.material.dispose();
                }
            }
            if (obj.dispose) {
                obj.dispose();
            }
        });
        this.three.scene.clear();
    };

    render (model, args) {
        /*if (args.drawEdges === true) {
            Object.keys(model.meshes).forEach(function(key){
                let mesh = model.meshes[key];
                this.DrawEdges(mesh, args);
            });
        }

        if (args.drawNodes === true) {
            Object.keys(model.meshes).forEach(function(key){
                let mesh = model.meshes[key];
                this.DrawNodes(mesh, args);
            });
        }*/

        this.Draw(args);
    };

    Draw (args) {
        for (let i = 0; i < this.domains.length; i++) {
            let domain = this.domains[i];

            let geo = domain.getGeometry();
            let material = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );
            let ret = new THREE.Mesh(geo, material);

            this.three.scene.add(ret);
        }
    };

    /*DrawEdges (mesh, args) {
        let mat = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
        let mergeGeometry = new THREE.Geometry();

        Object.keys(mesh.elements).forEach(function(key) {
            let elm = mesh.elements[key];
            let geo = new THREE.Geometry();

            for (let i = 0; i < elm.nodes.length; i++) {
                let j = i + 1 < elm.nodes.length ? i + 1 : 0;

                let n1 = mesh.nodes[elm.nodes[i]];
                let p1 = new THREE.Vector3(n1.point[0], n1.point[1], n1.point[2] + 1);

                if (args.shapeType === "deformed") {
                    p1.x += n1.u["lc1"][0] * myThree.args.scaleFactor;
                    p1.y += n1.u["lc1"][1] * myThree.args.scaleFactor;
                }

                let n2 = mesh.nodes[elm.nodes[j]];
                let p2 = new THREE.Vector3(n2.point[0], n2.point[1], n2.point[2] + 1);

                if (args.shapeType === "deformed") {
                    p2.x += n2.u["lc1"][0] * myThree.args.scaleFactor;
                    p2.y += n2.u["lc1"][1] * myThree.args.scaleFactor;
                }

                geo.vertices.push(p1);
                geo.vertices.push(p2);
            }

            let line = new THREE.LineSegments(geo, mat);
            mergeGeometry.merge(line.geometry, line.matrix);
        });

        this.three.scene.add(new THREE.LineSegments(mergeGeometry, mat));
    };*/

    /*DrawNodes (mesh, args) {
        let geometry = new THREE.SphereGeometry( 5, 32, 32 );
        let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

        Object.keys(mesh.nodes).forEach(function(key){
            let n = mesh.nodes[key];
            let sphere = new THREE.Mesh( geometry, material );
            sphere.position.set(n.point[0], n.point[1], n.point[2]);
            this.three.scene.add( sphere );
        });
    };*/
}