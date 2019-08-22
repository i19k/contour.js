const Domain = require('../lib/Entities/Domain');
const Vertex = require('../lib/Entities/Vertex');
const Triangle = require('../lib/Entities/Triangle');
const Rectangle = require('../lib/Entities/Rectangle');

const start = function (){
    let file = './model1.json';
    $.getJSON(file, function(data){
        let domain = new Domain();

        Object.keys(data.meshes).forEach(function(key){
            let mesh = data.meshes[key];
            let vertices = {};
            let elements = [];

            Object.keys(mesh.nodes).forEach(function(key) {
                let n = mesh.nodes[key];
                vertices[key] = new Vertex(n.point[0], n.point[1], n.point[2], n.u["lc1"][0]);
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

            domain.elements.addElements(elements);

            console.log(domain.elements);
        });
    });
};

start();

module.exports = start;