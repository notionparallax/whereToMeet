"use strict";
var windowX = window.innerWidth;
var windowY = window.innerHeight;
var windowHalfX = windowX / 2;
var windowHalfY = windowY / 2;
var mouseX = 0, mouseY = 0;

var camera, scene, sceneAnimationClip;
var renderer;
var controls;

var myAtmosphere;

document.addEventListener( 'mousemove', 
    onDocumentMouseMove, false );

init();
animate();

function init(){
    scene = new THREE.Scene();

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(windowX, windowY);
    document.body.appendChild(renderer.domElement);

    var container = document.getElementById( 'container' );
    container.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera(75, windowX / windowY, 0.1, 1000);
    camera.position.z = 4;

    controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.enableZoom = false;    

    var worldRadius = 2;
    var atmosphereFactor = 1.015;
    var personRadius = 0.1;

    var myWorldGeom   = new THREE.SphereGeometry(worldRadius, 32, 16);
    var worldMaterial = new THREE.MeshPhongMaterial({
        map         : new THREE.TextureLoader().load('./images/earthmap1k.jpg'),
        bumpMap     : new THREE.TextureLoader().load('./images/earthbump1k.jpg'),
        bumpScale   : 0.1,
        specularMap : new THREE.TextureLoader().load('./images/earthspec1k.jpg'),
        specular    : new THREE.Color('grey'),
        side        : THREE.DoubleSide,
        transparent : true,
        opacity     : 0.8
    });
    var myWorld = new THREE.Mesh(myWorldGeom, worldMaterial);
    scene.add(myWorld);

    var atmosphereGeom = new THREE.SphereGeometry(worldRadius * atmosphereFactor, 32, 16);
    var atmosphereMaterial = new THREE.MeshPhongMaterial({
        map         : new THREE.TextureLoader().load('./images/earthcloudmap.png'),
        //alphaMap  : new THREE.TextureLoader().load('./images/earthcloudmaptrans.jpg'),
        side        : THREE.DoubleSide,
        transparent : true,
        opacity     : 1.0
    });
    myAtmosphere = new THREE.Mesh(atmosphereGeom, atmosphereMaterial);
    scene.add(myAtmosphere);

    var light = new THREE.HemisphereLight(0xffffbb, 0xAAAAAA, 1);
    scene.add(light);

    function randomVecFromCoreToSurfaceOfSphere(radius) {
        //returns a vector from 0,0,0 to a point 
        //anywhere on a sphere
        let x = Math.random() - 0.5;
        let y = Math.random() - 0.5;
        let z = Math.random() - 0.5;
        return new THREE.Vector3(x, y, z)
            .setLength(radius / 2); //not sure why rad/2
    }

    function vecToLine(vec) {
        let start = new THREE.Vector3(0, 0, 0);
        return new THREE.LineCurve(start, vec.setLength(vec.length() * 2));
    }

    function pipeLine(line, radius) {
        return new THREE.TubeGeometry(
            line, //path
            2, //segments
            radius, //radius
            4, //radiusSegments
            false //closed
        );
    }

    function meanVector(people) {
        let xTotal = 0;
        let yTotal = 0;
        let zTotal = 0;
        let n = people.length
        for (let p of people) {
            xTotal += p.vector.x;
            yTotal += p.vector.y;
            zTotal += p.vector.z;
        }
        return new THREE.Vector3(xTotal / n,
            yTotal / n,
            zTotal / n);
    }

    function addNpeopleToScene(n_people) {
        let colours = [0xa6cee3, 0x1f78b4, 0xb2df8a, 0x33a02c, 0xfb9a99, 0xe31a1c, 0xfdbf6f, 0xff7f00, 0xcab2d6, 0x6a3d9a, 0xffff99, 0xb15928];
        let people = [];
        for (let i = 0; i < n_people; i++) {
            let personMaterial = new THREE.MeshLambertMaterial({
                color: colours[i % 12]
            });
            let personGeom = new THREE.SphereGeometry(personRadius, 8, 4);
            let axis = randomVecFromCoreToSurfaceOfSphere(worldRadius);
            let person = new THREE.Mesh(personGeom, personMaterial);
            person.translateOnAxis(axis, worldRadius);

            let tick = pipeLine(vecToLine(axis), personRadius / 5);
            let t = new THREE.Mesh(tick, personMaterial);

            people.push({
                geom: person,
                vector: axis,
                tick: t
            });

            scene.add(t);
            scene.add(person);
        };
        return people;
    }
    let people = addNpeopleToScene(12);

    let meanVec  = meanVector(people).setLength(worldRadius*0.55);
    let meanTick = pipeLine(vecToLine(meanVec), 0.02);
    let meanT    = new THREE.Mesh(meanTick, new THREE.MeshBasicMaterial({color: 0xffa500 }));

    scene.add(meanT);
}

function onWindowResize() {

    windowHalfX = window.innerWidth / 2;
    windowHalfY = window.innerHeight / 2;

    camera.aspect = windowX / windowY;
    camera.updateProjectionMatrix();

    renderer.setSize(windowX, windowY);
}
function onDocumentMouseMove(event) {

    mouseX = (event.clientX - windowHalfX);
    mouseY = (event.clientY - windowHalfY);
}
function animate() {

    requestAnimationFrame( animate );

    controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true

    myAtmosphere.rotateOnAxis(new THREE.Vector3(0,1,0),0.0002);
    //stats.update();

    render();
}

function render() {
    renderer.render(scene, camera);
}
