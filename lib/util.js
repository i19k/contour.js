
import Vertex from './Entities/Vertex'

module.exports =  {
    equalTol (val1, val2, tolerance = 1e-6) {
        return Math.abs(val1 - val2) < tolerance;
    },
    findCoordinate (v1, v2, value) {
        let dist1 =  Math.abs(value - v1.val);
        let dist2 = Math.abs(value - v2.val);
        let ratio = dist1 / (dist1 + dist2);

        let dx = (v2.x - v1.x) * ratio;
        let dy = (v2.y - v1.y) * ratio;
        let dz = (v2.z - v1.z) * ratio;

        return new Vertex(v1.x + dx, v1.y + dy, v1.z + dz, value);
    }
}