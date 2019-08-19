const Domain = require('./Entities/Domain');
const Vertex = require('./Entities/Vertex');
const THREE = require('three');
const MyThree = require('./threejs/MyThree');

Contour.prototype = Object();

Contour.prototype.constructor = function (opts) {
    this.three = new MyThree(opts.$elm);
};

Contour.prototype.clear = function () {
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

Contour.prototype.render = function (model, args) {
    if (args.drawEdges === true) {
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
    }

    this.Draw(model, args);
};

Contour.prototype.Draw = function (model, args) {
        if (args.drawResult === "") {
            let colorMap = new ColorMap();
            colorMap.init(10, -1, 1);
            i = 0;

            Object.keys(model.meshes).forEach(function(key){
                let mesh = model.meshes[key];
                if (i % 2 === 0)
                    DrawElements(mesh, args, colorMap.colors[i / 2]);
                else
                    DrawElements(mesh, args, colorMap.colors[Object.keys(colorMap.colors).length - (i - 1) / 2 - 1]);
                i++;
            });
            return;
        }
        let domain = new Domain();
        domain.vals = model.bounds;

        Object.keys(model.meshes).forEach(function(key){
            let mesh = model.meshes[key];
            let vertices = {};

            Object.keys(mesh.nodes).forEach(function(key){
                let n = mesh.nodes[key];

                let val = 0;
                let px = n.point[0];
                let py = n.point[1];
                let pz = n.point[2];

                if (args.shapeType === "deformed") {
                    px += n.u["lc1"][0] * this.three.args.scaleFactor;
                    py += n.u["lc1"][1] * this.three.args.scaleFactor;
                }

                if (args.drawResult === "u0") {
                    val = n.u["lc1"][0];
                } else if (args.drawResult === "u1") {
                    val = n.u["lc1"][1];
                } else if (args.drawResult === "sx") {
                    val = n.sigmax;
                } else if (args.drawResult === "sy") {
                    val = n.sigmay;
                } else if (args.drawResult === "txy") {
                    val = n.tauxy;
                } else if (args.drawResult === "svm") {
                    val = n.sigmavm;
                }


                let vertex = new Vertex(px, py, pz, val);

                vertices[key] = vertex;
            });

            Object.keys(mesh.elements).forEach(function(key){
                let element = mesh.elements[key];

                if (element.nodes.length === 3) {
                    let contourElement = new Triangle(vertices[element.nodes[0]],
                        vertices[element.nodes[1]],
                        vertices[element.nodes[2]]);
                    contourElement.name = key;
                    domain.elements.push(contourElement);
                }

                if (element.nodes.length === 4) {
                    let contourElement = new Rectangle(vertices[element.nodes[0]],
                        vertices[element.nodes[1]],
                        vertices[element.nodes[2]],
                        vertices[element.nodes[3]]);
                    contourElement.name = key;
                    domain.elements.push(contourElement);
                }


            });
        });

        domain.draw(myThree.scene);
        this.animate();


        var colorCount = domain.colorMap.keys.length;
        for (var i = colorCount - 1; i > -1; i--) {
            var key = domain.colorMap.keys[i];
            var row = document.createElement("div");
            row.style.width = "50px";
            row.style.height = (500 / Object.keys(domain.colorMap.colors).length - 1) + "px";

            if (i != 0) {
                var colorBox = document.createElement("div");
                colorBox.style.width = "20px";
                colorBox.style.height = "100%";
                colorBox.style.float = "left";
                colorBox.style.backgroundColor  = domain.colorMap.rgbColors[i];
                row.appendChild(colorBox);
            }

            var text = document.createElement("div");
            text.className = "legendEntry";
            text.onclick = function(e) {
                console.log(0);
            };
            text.appendChild(document.createTextNode(Math.round(domain.colorMap.getValue(key) * 1e3) / 1e3));
            row.appendChild(text);


            $("#contourLegend").append(row);
        }
};

Contour.prototype.DrawEdges = function (mesh, args) {
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
};

Contour.prototype.DrawNodes = function (mesh, args) {
    let geometry = new THREE.SphereGeometry( 5, 32, 32 );
    let material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

    Object.keys(mesh.nodes).forEach(function(key){
        let n = mesh.nodes[key];
        let sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(n.point[0], n.point[1], n.point[2]);
        this.three.scene.add( sphere );
    });
};

module.exports = Contour;