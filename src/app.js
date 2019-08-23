import Contour from "../lib";
import MyThree from "../lib/threejs/MyThree";
import Domain from "../lib/Entities/Domain";
import Vertex from "../lib/Entities/Vertex";
import Triangle from "../lib/Entities/Triangle";
import Rectangle from "../lib/Entities/Rectangle";
import $ from "jquery";

const model = require('./model1.json');

$("body").append("<div id='vp' style='width: 100vw; height: 100vh; position: fixed;'></div>");


const start = function (){

    let three = new MyThree($("#vp"));
    let contour = new Contour(three);

    let domain = new Domain();
    contour.domains.push(domain);

    Object.keys(model.meshes).forEach(function(key){
        let mesh = model.meshes[key];
        let vertices = {};
        let elements = [];

        Object.keys(mesh.nodes).forEach(function(key) {
            let n = mesh.nodes[key];
            vertices[key] = new Vertex(n.point[0], n.point[1], n.point[2], n.u["lc1"][0]);
            vertices[key].name = key;
        });

        Object.keys(mesh.elements).forEach(function(key){
            let element = mesh.elements[key];
            let contourElement = null;

            if (element.nodes.length === 3) {
                contourElement = new Triangle(vertices[element.nodes[0]],
                    vertices[element.nodes[1]],
                    vertices[element.nodes[2]]);
            }

            if (element.nodes.length === 4) {
                contourElement = new Rectangle(vertices[element.nodes[0]],
                    vertices[element.nodes[1]],
                    vertices[element.nodes[2]],
                    vertices[element.nodes[3]]);
            }

            if (contourElement !== null){
                contourElement.name = key;
                elements.push(contourElement);
            }
        });

        domain.addElements(elements);
    });

    contour.Draw();
    three.zoomToFit();
};

start();

export default start()