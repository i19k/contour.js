import Element from './Element';
import Triangle from './Triangle';
import util from '../util';


export default class Rectangle {
    constructor (v1, v2, v3, v4) {
        this.master = null;
        this.vertices = [v1, v2, v3, v4];
    };

    getVertexGroups () {
        let ret = [];

        for (let i = 0; i < this.vertices.length; i++) {
            let existingGroup = ret.find(gr => util.equalTol(gr.val, this.vertices[i].val));

            if (!existingGroup) {
                ret.push({
                    val: this.vertices[i].val,
                    vertices: [this.vertices[i]]
                });
            } else {
                existingGroup.vertices.push(this.vertices[i]);
            }
        }

        ret = this.normalizeGroups(ret);

        return ret;
    };

    normalizeGroups (groups){
        let ret = groups.slice();
        if (ret.length > 2) {
            if(util.equalTol(ret[0].val, ret[ret.length - 1].val)) {
                for (let i = ret[ret.length - 1].vertices.length - 1; i > -1; i--){
                    ret[0].splice(0, 0, ret[ret.length - 1].vertices[i] );
                }

                ret.splice(ret.length - 1, 1);
                ret = this.normalizeGroups(ret);
            }
        }

        return ret;
    };

    getTriangles2 (colorMap) {
        let subRects = this.getTriangles(colorMap);
        let subTriangles = [];

        if (subRects.length === 1) {
            subTriangles.push(new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]));
            subTriangles.push(new Triangle(this.vertices[0], this.vertices[2], this.vertices[3]));
        } else {
            for (let i = 0; i < subRects.length; i++) {
                subTriangles = subTriangles.concat(subRects[i].getTriangles(colorMap));
            }

            subTriangles.forEach(st => st.master = this);
        }

        return subTriangles;
    };

    getTriangles  (colorMap) {
        let triangles = [];
        let groups = this.getVertexGroups();

        switch (groups.length) {
            case 1:
            {
                triangles.push(new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]));
                triangles.push(new Triangle(this.vertices[0], this.vertices[2], this.vertices[3]));
            } break;

            case 2: {
                if (groups[0].vertices.length === 2 && groups[1].vertices.length === 2) {
                    let interval = colorMap.getValueInterval(groups[0].val, groups[1].val);

                    let keys1 = Object.keys(interval);
                    let ret = [];
                    let v1 = groups[0].vertices[1];
                    let v2 = groups[0].vertices[0];
                    for (let i = 0; i < keys1.length; i++) {
                        let vertex = util.findCoordinate(groups[0].vertices[1], groups[1].vertices[0], keys1[i]);
                        let vertex2 = util.findCoordinate(groups[0].vertices[0], groups[1].vertices[1], keys1[i]);

                        /*let rect = new Rectangle(v1, vertex, vertex2, v2);
                        ret = ret.concat(rect.getTriangles(colorMap));*/

                        triangles.push(new Triangle(v1, vertex, vertex2));
                        triangles.push(new Triangle(v1, vertex2, v2));

                        v1 = vertex;
                        v2 = vertex2;
                    }

                    triangles.push(new Triangle(v1, groups[1].vertices[0], groups[1].vertices[1]));
                    triangles.push(new Triangle(v1, groups[1].vertices[1], v2));
                    //ret = ret.concat(new Rectangle(v1, groups[1].vertices[0], groups[1].vertices[1], v2));
                }
                else {
                    if (groups[0].length === 1 && groups[1].length === 3) {
                        triangles.push(new Triangle(groups[0].vertices[0], groups[1].vertices[0], groups[1].vertices[2]));
                        triangles.push(new Triangle(groups[1].vertices[0], groups[1].vertices[1], groups[1].vertices[2]));
                    } else  if (groups[0].length === 3 && groups[1].length === 1) {
                        triangles.push(new Triangle(groups[1].vertices[0], groups[0].vertices[0], groups[0].vertices[2]));
                        triangles.push(new Triangle(groups[0].vertices[0], groups[0].vertices[1], groups[0].vertices[2]));
                    }
                }
            } break;

            case 3: {
                let maxGr = groups.sort((a, b) =>  parseFloat(b.val) - parseFloat(a.val))[0];
                let minGr = groups.sort((a, b) => parseFloat(a.val) - parseFloat(b.val))[0];
                let midGr = groups.find(gr => maxGr !== gr && minGr !== gr);

                if (midGr.vertices.length === 2) {
                    let vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[0], midGr.val);

                    triangles.push(new Triangle(minGr.vertices[0], midGr.vertices[0], vertex));
                    triangles.push(new Triangle(vertex, midGr.vertices[0], midGr.vertices[1]));
                    triangles.push(new Triangle(vertex, midGr.vertices[1], maxGr.vertices[0]));
                } else {
                    let vertex = null;
                    let tri1 = null;
                    let rectangleTris = [];

                    if (minGr.vertices.length === 2) {
                        vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[0], midGr.val);
                        tri1 = new Triangle(vertex, midGr.vertices[0], maxGr.vertices[0]);

                        let rect = new Rectangle(minGr.vertices[1], midGr.vertices[0], vertex, minGr.vertices[0]);
                        rectangleTris = rect.getTriangles(colorMap);
                    }
                    else if (maxGr.vertices.length === 2) {
                        console.log("max");
                        vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[1], midGr.val);
                        tri1 = new Triangle(vertex, minGr.vertices[0], midGr.vertices[0]);

                        let rect = new Rectangle(maxGr.vertices[1], vertex, midGr.vertices[0], maxGr.vertices[0]);
                        if (this.name === "mesh2;14;2") {
                            console.log(rect);
                        }
                        rectangleTris = rect.getTriangles(colorMap);
                    }

                    triangles.push(tri1);
                    triangles = triangles.concat(rectangleTris);

                    if (this.name === "mesh2;14;2"){
                        console.log(tri1);
                        console.log(rectangleTris);
                    }
                }
            } break;

            case 4: {
                triangles.push(new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]));
                triangles.push(new Triangle(this.vertices[0], this.vertices[2], this.vertices[3]));
            }
        }

        let ret = [];
        triangles.forEach(t => ret = ret.concat(t.getTriangles(colorMap)));
        /*if (this.name === "mesh2;14;2"){
            console.log(this);
            console.log(ret);
        }*/
        return ret;
    };
}