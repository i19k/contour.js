const THREE = require('three');
const OrbitControls = require('three-orbitcontrols');

export default class MyThree {
    constructor ($elm) {
        this.camera = null;
        this.scene = null;
        this.renderer = null;
        this.name = '';
        this.cam = null;
        this.camHelper = null;
        this.controls = null;
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        this.init($elm);
    };

    init ($elm) {
        this.scene = new THREE.Scene();
        this.scene.clear = function() {
            while(this.children.length > 0){
                this.remove(this.children[0]);
            }
        };

        let frustumSize = 500;

        //var aspect = window.innerWidth / window.innerHeight;
        let aspect = $elm.width() / $elm.height();

        this.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 25000 );

        this.renderer = new THREE.WebGLRenderer({antialias : true});
        this.renderer.setSize( $elm.width(), $elm.height() );

        $elm.append(this.renderer.domElement);
        this.scene.background = new THREE.Color(1, 1, 1);

        this.controls = new OrbitControls( this.camera, this.renderer.domElement );

        this.camera.position.z = 10000;

        this.animate();

        //window.addEventListener( 'mousemove', onMouseMove, false );
    };

    zoomToFit () {
        let minX = Number.MAX_VALUE;
        let minY = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE;
        let maxY = Number.MIN_VALUE;
        this.scene.traverse(function(obj) {
            if (obj.hasOwnProperty("geometry")) {
                obj.geometry.vertices.forEach(function(vertex) {
                    if (vertex.x < minX) minX = vertex.x;
                    if (vertex.y < minY) minY = vertex.y;
                    if (vertex.x > maxX) maxX = vertex.x;
                    if (vertex.y > maxY) maxY = vertex.y;
                });
            }
        });

        let center = new THREE.Vector3((minX + maxX) / 2.0, (minY + maxY) / 2.0, 0);

        this.camera.lookAt(center);
        this.controls.target.set(center.x, center.y, center.z);

    };

    animate () {
        requestAnimationFrame( () => this.animate() );
        this.renderer.render(this.scene, this.camera);
    };
}