if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;

var camera, controls, scene, renderer, mesh;
var group;

init();
render();

function animate() {

        requestAnimationFrame(animate);
        controls.update();

}

function init() {

        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
        camera.position.z = 5;

        controls = new THREE.OrbitControls( camera );
//        controls.damping = 0.2;
        controls.addEventListener( 'change', render );

        scene = new THREE.Scene();

        // lights

        light = new THREE.DirectionalLight( 0xffffff );
        light.position.set( 1, 1, 1 );
        scene.add( light );

        light = new THREE.DirectionalLight( 0x002288 );
        light.position.set( -1, -1, -1 );
        scene.add( light );

        light = new THREE.AmbientLight( 0x222222 );
        scene.add( light );


        // texture - texture must not be in same folder or there is an error.
        var texture = THREE.ImageUtils.loadTexture( 'images/texture.jpg', {}, function(){ 
        // use to test when image gets loaded if it does
        render();
        }, 
        function(){ 
            alert('error') 
        });

        material = new THREE.MeshBasicMaterial({map: texture});

        group = new THREE.Object3D();
         
        //load mesh 
        var loader = new THREE.JSONLoader();
        loader.load('models/cube.js', modelLoadedCallback);


        // renderer

        renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
        renderer.setSize( window.innerWidth, window.innerHeight );

        container = document.getElementById( 'container' );
        container.appendChild( renderer.domElement );

        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        stats.domElement.style.zIndex = 100;
        container.appendChild( stats.domElement );

        //

        window.addEventListener( 'resize', onWindowResize, false );

        animate();

}

function modelLoadedCallback(geometry) {

        mesh = new THREE.Mesh( geometry, material );
        group.add(mesh);
        scene.add( group );

}

function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize( window.innerWidth, window.innerHeight );

        render();

}

function render() {
//        requestAnimationFrame(render);
//        mesh.rotation.y += 0.05;
        renderer.render(scene, camera);
        stats.update();

}