function MyThree() {
    this.camera = null
    this.scene = null
    this.renderer = null
    this.name = ''
    this.cam = null
    this.camHelper = null
    this.controls = null;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.args = null;

    this.zoomToFit = function() {
        var minX = Number.MAX_VALUE;
        var minY = Number.MAX_VALUE;
        var maxX = Number.MIN_VALUE;
        var maxY = Number.MIN_VALUE;
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

        var center = new THREE.Vector3((minX + maxX) / 2.0, (minY + maxY) / 2.0, 0);

        this.camera.lookAt(center);
        this.controls.target.set(center.x, center.y, center.z);

    }
};

var myThree = new MyThree();

function InitViewport(){

    myThree.scene = new THREE.Scene();

    var frustumSize = 500;

    //var aspect = window.innerWidth / window.innerHeight;
    var aspect = $('#vp').width() / $('#vp').height();

    myThree.camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, frustumSize / 2, frustumSize / - 2, 1, 25000 );

    myThree.renderer = new THREE.WebGLRenderer({antialias : true});
    myThree.renderer.setSize( $('#vp').width(), $('#vp').height() );

    //$.body.append( renderer.domElement );
    //document.body.appendChild(  myThree.renderer.domElement );
    $('#vp').append(myThree.renderer.domElement);
    myThree.scene.background = new THREE.Color(1, 1, 1);

    myThree.controls = new THREE.OrbitControls( myThree.camera, myThree.renderer.domElement );

    myThree.camera.position.z = 10000;

    animate();

    window.addEventListener( 'mousemove', onMouseMove, false );

}

function animate(){
    requestAnimationFrame( animate );
    myThree.renderer.render(myThree.scene, myThree.camera);
}

function Draw(model) {
    Object.keys(model.meshes).forEach(function(key){
        var mesh = model.meshes[key];
        DrawNode(mesh);
        DrawElements(mesh);
    });
    //animate();
}

function DrawElements(mesh) {
    var mat_ntos = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );
    Object.keys(mesh.elements).forEach(function(key) {
        var element = mesh.elements[key];
        var geo = new THREE.Geometry();
        var n_node = element.nodes.length;
        for (i=0; i < n_node; i++){
            var n = mesh.nodes[element.nodes[i]];
            geo.vertices.push(new THREE.Vector3(n.point[0], n.point[1], n.point[2]));
        }
         for ( var j = 0; j< n_node - 2; j++) {
            geo.faces.push( new THREE.Face3(0,j+1,j+2));
        }

        var plane = new THREE.Mesh(geo, mat_ntos);
        myThree.scene.add( plane );
    });
}

function DrawEdges(mesh, args) {

    var mat = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide} );
    var mergeGeometry = new THREE.Geometry();

    Object.keys(mesh.elements).forEach(function(key) {
        var elm = mesh.elements[key];
        var geo = new THREE.Geometry();

        for (var i = 0; i < elm.nodes.length; i++) {
            var j = i + 1 < elm.nodes.length ? i + 1 : 0;

            var n1 = mesh.nodes[elm.nodes[i]];
            var p1 = new THREE.Vector3(n1.point[0], n1.point[1], n1.point[2] + 1);

            if (args.shapeType == "deformed") {
                p1.x += n1.u["lc1"][0];
                p1.y += n1.u["lc1"][1];
            }

            var n2 = mesh.nodes[elm.nodes[j]];
            var p2 = new THREE.Vector3(n2.point[0], n2.point[1], n2.point[2] + 1);

            if (args.shapeType == "deformed") {
                p2.x += n2.u["lc1"][0];
                p2.y += n2.u["lc1"][1];
            }

            geo.vertices.push(p1);
            geo.vertices.push(p2);
        }

        var line = new THREE.LineSegments(geo, mat);
        mergeGeometry.merge(line.geometry, line.matrix);
    });

    myThree.scene.add(new THREE.LineSegments(mergeGeometry, mat));
}

function DrawElements(mesh, args) {
    var mat = new THREE.MeshBasicMaterial( {color: 0xff0000, side: THREE.DoubleSide} );

    var geometry = new THREE.Geometry();

    Object.keys(mesh.elements).forEach(function(key) {
        var elm = mesh.elements[key];

        var start = geometry.vertices.length;

        for (var i = 0; i < elm.nodes.length; i++) {
            var n = mesh.nodes[elm.nodes[i]];
            if (args.shapeType == "deformed") {
                geometry.vertices.push(new THREE.Vector3(n.point[0] + n.u["lc1"][0], n.point[1] + n.u["lc1"][1], n.point[2]));
            } else if (args.shapeType == "undeformed") {
                geometry.vertices.push(new THREE.Vector3(n.point[0], n.point[1], n.point[2]));
            }
        }

        for (var j = 0; j< elm.nodes.length - 2; j++) {
            var face = new THREE.Face3(start, start+j+1, start+j+2);
            face.element = key;
            geometry.faces.push(face);
        }

    });

    var ret = new THREE.Mesh(geometry, mat);
    myThree.scene.add(ret);

    myThree.args = args;
}

function DrawNode(mesh) {
    var geometry = new THREE.SphereGeometry( 5, 32, 32 );
    var material = new THREE.MeshBasicMaterial( {color: 0xffff00} );

    Object.keys(mesh.nodes).forEach(function(key){
        var n = mesh.nodes[key];
        var sphere = new THREE.Mesh( geometry, material );
        sphere.position.set(n.point[0], n.point[1], n.point[2]);
        myThree.scene.add( sphere );
    });
}

function onMouseMove(event) {
    var vpLeft = $('#vp').offset().left;
    var vpTop = $('#vp').offset().top;

    var left  = event.clientX - vpLeft;
    var top  = event.clientY - vpTop;

    myThree.mouse.x = ( left / $('#vp').width() ) * 2 - 1;
	myThree.mouse.y = - ( top / $('#vp').height() ) * 2 + 1;

    // update the picking ray with the camera and mouse position
	myThree.raycaster.setFromCamera( myThree.mouse, myThree.camera );

	// calculate objects intersecting the picking ray
	var intersects = myThree.raycaster.intersectObjects( myThree.scene.children );
	if (intersects.length > 0) {
	    for (var i = 0; i < intersects.length; i++) {
	        var intersect = intersects[i];
            if(intersect.face != null) {
                if (myThree.args.display == "elementName") {
                    $("#pointValue").html(intersect.face.tri.element.name);
                    $("#pointValue").css({"top": event.clientY - 25,
                                            "left": event.clientX + 10,
                                            "background-color": "#ccc",
                                            "color": "black"
                                            });
                    $("#pointValue").show();
                } else if (myThree.args.display == "contourValue") {
                    if (intersect.face.tri instanceof ColorTriangle) {
                        val = intersect.face.tri.getInnerValue(myThree.mouse.x, myThree.mouse.y);
                        bgColor = domain.colorMap.getRGBColor(domain.colorMap.getMappedValue(val));
                        $("#pointValue").html(Math.round(val * 1e3) / 1e3);
                        $("#pointValue").css({"top": event.clientY - 25,
                                            "left": event.clientX + 10,
                                            "background-color": bgColor,
                                            "color": setContrast(bgColor)
                                            });
                        $("#pointValue").show();
                        break;
                    } else {
                        $("#pointValue").hide();
                    }
                }

            }
	    }
	} else {
	    $("#pointValue").hide();
	}
}

function setContrast(rgb) {
  var s = rgb.toString();
  rgb = s.substring(s.indexOf('(') + 1, s.lastIndexOf(')')).split(/,\s*/);
  var o = Math.round(((parseInt(rgb[0]) * 299) +
                      (parseInt(rgb[1]) * 587) +
                      (parseInt(rgb[2]) * 114)) / 1000);
  var fore = (o > 125) ? 'black' : 'white';
  return fore;
}
