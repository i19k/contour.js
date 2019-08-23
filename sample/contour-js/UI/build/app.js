function MyThree() {
    this.camera = null;
    this.scene = null;
    this.renderer = null;
    this.name = '';
    this.cam = null;
    this.camHelper = null;
    this.controls = null;
    this.mouse = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this.args = new DrawContourArgs();

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
}

var myThree = new MyThree();

function InitViewport(){

    myThree.scene = new THREE.Scene();
    myThree.scene.clear = function() {
        while(this.children.length > 0){
            this.remove(this.children[0]);
        }
    }

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
                p1.x += n1.u["lc1"][0] * myThree.args.scaleFactor;
                p1.y += n1.u["lc1"][1] * myThree.args.scaleFactor;
            }

            var n2 = mesh.nodes[elm.nodes[j]];
            var p2 = new THREE.Vector3(n2.point[0], n2.point[1], n2.point[2] + 1);

            if (args.shapeType == "deformed") {
                p2.x += n2.u["lc1"][0] * myThree.args.scaleFactor;
                p2.y += n2.u["lc1"][1] * myThree.args.scaleFactor;
            }

            geo.vertices.push(p1);
            geo.vertices.push(p2);
        }

        var line = new THREE.LineSegments(geo, mat);
        mergeGeometry.merge(line.geometry, line.matrix);
    });

    myThree.scene.add(new THREE.LineSegments(mergeGeometry, mat));
}

function DrawElements(mesh, args, meshColor) {
    var mat = new THREE.MeshBasicMaterial( {side: THREE.DoubleSide, vertexColors: THREE.FaceColors} );

    var geometry = new THREE.Geometry();


    Object.keys(mesh.elements).forEach(function(key) {
        var elm = mesh.elements[key];

        var start = geometry.vertices.length;

        for (var i = 0; i < elm.nodes.length; i++) {
            var n = mesh.nodes[elm.nodes[i]];
            if (args.shapeType == "deformed") {
                geometry.vertices.push(new THREE.Vector3(n.point[0] + n.u["lc1"][0] * args.scaleFactor,
                                                        n.point[1] + n.u["lc1"][1] * args.scaleFactor,
                                                        n.point[2]));
            } else if (args.shapeType == "undeformed") {
                geometry.vertices.push(new THREE.Vector3(n.point[0], n.point[1], n.point[2]));
            }
        }

        i += 1;
        faceColor = colorMap.colors[i];


        for (var j = 0; j< elm.nodes.length - 2; j++) {
            var face = new THREE.Face3(start, start+j+1, start+j+2);
            face.tri = {model: {element: {name: key}}};
            face.color = meshColor;
            geometry.faces.push(face);
        }

    });

    var ret = new THREE.Mesh(geometry, mat);
    myThree.scene.add(ret);

    myThree.args = args;
}

function DrawNodes(mesh) {
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
                    $("#pointValue").html(intersect.face.tri.model.element.name);
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

var domain = null;

function Render(model, args) {

    $.each(myThree.scene.__objects, function(idx, obj) {
        myThree.scene.remove(obj);
        if (obj.geometry) {
            obj.geometry.dispose();
        }
        if (obj.material) {
            if (obj.material instanceof THREE.MeshFaceMaterial) {
                $.each(obj.material.materials, function(idx, obj) {
                    obj.dispose();
                });
            } else {
                obj.material.dispose();
            }
        }
        if (obj.dispose) {
            obj.dispose();
        }
    });
    myThree.scene.clear();

    if (args.drawEdges === true) {
        Object.keys(model.meshes).forEach(function(key){
            var mesh = model.meshes[key];
            DrawEdges(mesh, args);
        });
    }
	
	if (args.drawNodes === true) {
        Object.keys(model.meshes).forEach(function(key){
            var mesh = model.meshes[key];
            DrawNodes(mesh, args);
        });
    }

    DrawContour(model, args);
}

function DrawContour(model, args) {
    $("#contourLegend").html("");

    if (args.drawResult == "") {
        colorMap = new ColorMap();
        colorMap.init(10, -1, 1);
        i = 0;

        Object.keys(model.meshes).forEach(function(key){
            var mesh = model.meshes[key];
            if (i % 2 == 0)
                DrawElements(mesh, args, colorMap.colors[i / 2]);
            else
                DrawElements(mesh, args, colorMap.colors[Object.keys(colorMap.colors).length - (i - 1) / 2 - 1]);
            i++;
        });
        return;
    }
    domain = new Domain();
    domain.vals = model.bounds;

    Object.keys(model.meshes).forEach(function(key){
        var mesh = model.meshes[key];
        vertices = {};

        Object.keys(mesh.nodes).forEach(function(key){
            var n = mesh.nodes[key];

            var val = 0;
            var px = n.point[0];
            var py = n.point[1];
            var pz = n.point[2];

            if (args.shapeType == "deformed") {
                px += n.u["lc1"][0] * myThree.args.scaleFactor;
                py += n.u["lc1"][1] * myThree.args.scaleFactor;
            }

            if (args.drawResult == "u0") {
                val = n.u["lc1"][0];
            } else if (args.drawResult == "u1") {
                val = n.u["lc1"][1];
            } else if (args.drawResult == "sx") {
                val = n.sigmax;
            } else if (args.drawResult == "sy") {
                val = n.sigmay;
            } else if (args.drawResult == "txy") {
                val = n.tauxy;
            } else if (args.drawResult == "svm") {
                val = n.sigmavm;
            }


            var vertex = new Vertex(px, py, pz, val);

            vertices[key] = vertex;
        });

        Object.keys(mesh.elements).forEach(function(key){
            var element = mesh.elements[key];
            element.name = key;
            if (element.nodes.length == 3) {
                contourElement = new Triangle(vertices[element.nodes[0]],
                                                vertices[element.nodes[1]],
                                                vertices[element.nodes[2]]);
                contourElement.name = key;
                domain.elements.push(contourElement);
            }

            if (element.nodes.length == 4) {
                contourElement = new Rectangle(vertices[element.nodes[0]],
                                                vertices[element.nodes[1]],
                                                vertices[element.nodes[2]],
                                                vertices[element.nodes[3]]);
                contourElement.name = key;
                domain.elements.push(contourElement);
            }


        });


    });

    domain.draw(myThree.scene);
    animate();


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
}

DrawContourArgs.prototype = Object();
DrawContourArgs.prototype.constructor = DrawContourArgs;
function DrawContourArgs() {
    this.drawResult = "";
    this.drawNodes = false;
    this.drawEdges = true;
    this.shapeType = "undeformed";
    this.display = "elementName";
    this.scaleFactor = 1.0;

    this.update = function(other) {
        if (other == null) return;

        this.drawResult = other.drawResult != null ? other.drawResult : this.drawResult;
        this.drawNodes = other.drawNodes != null ? other.drawNodes : this.drawNodes;
        this.drawEdges = other.drawEdges != null ? other.drawEdges : this.drawEdges;
        this.shapeType = other.shapeType != null ? other.shapeType : this.shapeType;
        this.display = other.display != null ? other.display : this.display;
        this.scaleFactor = other.scaleFactor != null ? other.scaleFactor : this.scaleFactor;
    }
}


var model = null;


function handleOnChange() {
    var selectedFile = document.getElementById("sfd").files[0];
    var reader = new FileReader();
    reader.readAsText(selectedFile, "UTF-8");
    reader.onload = function (evt) {
        model = JSON.parse(evt.target.result);

        Render(model, myThree.args);
        myThree.zoomToFit();
    };
}

$(document).ready(function() {

    InitViewport();

    $('input:radio[name="result"]').change(function(){

        myThree.args.update({
            "drawResult": $(this).data("drawResult")
        });

        Render(model, myThree.args);
    });

    $('input:radio[name="shapeType"]').change(function(){

        myThree.args.update({
            "shapeType": $(this).data("shapeType")
        });

        Render(model, myThree.args);
    });

    $('input:radio[name="display"]').change(function(){

        myThree.args.update({
            "display": $(this).data("display")
        });

        Render(model, myThree.args);
    });

     $('input:checkbox[name="drawEdges"]').change(function(){

        myThree.args.update({
            "drawEdges": $(this).is(":checked")
        });

        Render(model, myThree.args);
     });
	 
	 $('input:checkbox[name="drawNodes"]').change(function() {
		
		myThree.args.update({
			"drawNodes": $(this).is(":checked")
		});
		
        Render(model, myThree.args);
	 });

     $('button[name="refresh"]').click(function(){
        myThree.args.update({
            "scaleFactor": $('input[name="scaleFactor"]').val()
        });

        Render(model, myThree.args);
     });

});