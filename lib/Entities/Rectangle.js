import Element from './Element';
import Triangle from './Triangle';
import util from '../util';


export default class Rectangle {
    constructor (v1, v2, v3, v4) {
        this.master = null;
        this.vertices = [v1, v2, v3, v4];
    };

    getVertexGroups () {
        let ret = [{
            val: this.vertices[0].val,
            vertices: [this.vertices[0]]
        }];

        for (let i = 1; i < this.vertices.length; i++) {
            let lastGr = ret[ret.length - 1];

            if (util.equalTol(lastGr.val, this.vertices[i].val)) {
                lastGr.vertices.push(this.vertices[i]);
            } else {
                ret.push({
                    val: this.vertices[i].val,
                    vertices: [this.vertices[i]]
                });
            }
        }

        console.log(ret);
        ret = this.normalizeGroups(ret);

        return ret;
    };


    normalizeGroups (groups){
        let ret = groups.slice();
        if (ret.length > 2) {
            let firstGr = ret[0];
            let lastGr = ret[ret.length - 1];

            if(util.equalTol(firstGr.val, lastGr.val)) {
                for (let i = lastGr.vertices.length - 1; i > -1; i--){
                    firstGr.vertices.splice(0, 0, lastGr.vertices[i]);
                }

                ret.splice(ret.length - 1, 1);
                ret = this.normalizeGroups(ret);
            }
        }

        return ret;
    }

    getTriangles (colorMap) {
        let triangles = [];
        let groups = this.getVertexGroups();

        switch (groups.length) {
            case 2: {
                if (groups[0].vertices.length === 2 && groups[1].vertices.length === 2) {
                    let interval = colorMap.getValueInterval(groups[0].val, groups[1].val);
                    let keys1 = Object.keys(interval);

                    if (keys1.length > 2) {
                        let v1 = groups[0].vertices[1];
                        let v2 = groups[0].vertices[0];

                        for (let i = 0; i < keys1.length; i++) {
                            let vertex = util.findCoordinate(groups[0].vertices[1], groups[1].vertices[0], keys1[i]);
                            let vertex2 = util.findCoordinate(groups[0].vertices[0], groups[1].vertices[1], keys1[i]);

                            triangles.push(new Rectangle(v1, vertex, vertex2, v2));

                            v1 = vertex;
                            v2 = vertex2;
                        }
                        triangles.push(new Rectangle(v1, groups[1].vertices[0], groups[1].vertices[1], v2));

                    } else {
                        triangles.push(new Triangle(groups[0].vertices[1], groups[1].vertices[0], groups[1].vertices[1]));
                        triangles.push(new Triangle(groups[0].vertices[1], groups[1].vertices[1], groups[0].vertices[0]));
                    }
                } else {
                    let gr1 = groups.find(gr => gr.vertices.length === 1);
                    let gr3 = groups.find(gr => gr.vertices.length === 3);

                    triangles.push(new Triangle(gr3.vertices[0], gr3.vertices[1], gr3.vertices[2]));
                    triangles.push(new Triangle(gr3.vertices[0], gr3.vertices[2], gr1.vertices[0]));
                }
            } break;

            case 3: {
                console.log(groups);
                let maxGr = groups.sort((a, b) =>  parseFloat(b.val) - parseFloat(a.val))[0];
                let minGr = groups.sort((a, b) => parseFloat(a.val) - parseFloat(b.val))[0];
                let midGr = groups.find(gr => maxGr !== gr && minGr !== gr);
                let midGrIndex = groups.indexOf(midGr);
                let prevGr = groups[midGrIndex - 1 > -1 ? midGrIndex - 1 : groups.length - 1];
                let nextGr = groups[midGrIndex + 1 < groups.length ? midGrIndex + 1 : 0];


                if (midGr.vertices.length === 2) {
                    let vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[0], midGr.val);

                    let tri1 = new Triangle(prevGr.vertices[0], midGr.vertices[0], vertex);
                    let tri2 = new Triangle(vertex, midGr.vertices[0], midGr.vertices[1]);
                    let tri3 = new Triangle(vertex, midGr.vertices[1], nextGr.vertices[0]);
                    triangles.push(tri1);
                    triangles.push(tri2);
                    triangles.push(tri3);
                    //triangles.push(new Triangle(vertex, minGr.vertices[0], midGr.vertices[0]));
                    //triangles.push(new Triangle(vertex, midGr.vertices[0], midGr.vertices[1]));
                    //triangles.push(new Triangle(vertex, midGr.vertices[1], maxGr.vertices[0]));
                } else {
                    let vertex = null;
                    let tri1 = null;
                    let rect = null;

                    if (minGr.vertices.length === 2) {
                        vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[0], midGr.val);
                        tri1 = new Triangle(vertex, midGr.vertices[0], maxGr.vertices[0]);

                        rect = new Rectangle(minGr.vertices[1], midGr.vertices[0], vertex, minGr.vertices[0]);
                    }
                    else if (maxGr.vertices.length === 2) {
                        vertex = util.findCoordinate(minGr.vertices[0], maxGr.vertices[1], midGr.val);
                        tri1 = new Triangle(vertex, minGr.vertices[0], midGr.vertices[0]);

                        rect = new Rectangle(maxGr.vertices[1], vertex, midGr.vertices[0], maxGr.vertices[0]);
                    }

                    //triangles.push(tri1);
                    //triangles.push(rect);
                }
            } break;
            default: {
                triangles.push(new Triangle(this.vertices[0], this.vertices[1], this.vertices[2]));
                triangles.push(new Triangle(this.vertices[0], this.vertices[2], this.vertices[3]));
            }
        }

        let ret = [];
        triangles.forEach(t => ret = ret.concat(t.getTriangles(colorMap)));

        return ret;
    };
}