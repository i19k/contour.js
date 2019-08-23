
export default class Vertex {
    constructor (x, y, z, val) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.val = val;
    }

    toString() {
        return "("  + this.x + "," + this.y + "," + this.z + ")" + "[" + this.val + "]"
    }
}

