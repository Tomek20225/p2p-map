import * as THREE from 'three';

// Renderer (canvas) configuration
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setPixelRatio( window.devicePixelRatio );
document.body.appendChild( renderer.domElement );

// Setup the scene and the camera
const scene = new THREE.Scene();

// Adding lightning
scene.add(new THREE.HemisphereLight(0xffffff,0xffffff,1.0))

// Setup the map
const map = [
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
];
const sizeMultiplier = 1;
let mapLongestSide = 0;

for (let y = 0; y < map.length; y++) {
    let lengthHolder = 0;
    let startingX = -1;

    mapLongestSide = (map[y].length > mapLongestSide) ? map[y].length : mapLongestSide;

    for (let x = 0; x < map[y].length; x++) {
        if (map[y][x] == 1) {
            lengthHolder++;
            startingX = (startingX == -1) ? x : startingX;
            if (x != map[y].length - 1) continue;
        }

        if (map[y][x] == 0 && lengthHolder == 0) continue;

        const wallGeometry = new THREE.BoxGeometry( lengthHolder, 1, 2 );
        wallGeometry.translate( lengthHolder / 2, 1 / 2, 1 / 2 );
        const wallMaterial = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
        const wall = new THREE.Mesh( wallGeometry, wallMaterial );

        scene.add( wall );
        wall.position.set(startingX * sizeMultiplier, -y * sizeMultiplier, 0);

        lengthHolder = 0;
        startingX = -1;
    }
}


// Setup the camera
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set((mapLongestSide - 1) / 2, -((map.length - 1) / 2), 50);

// The main loop
function animate() {
	requestAnimationFrame( animate );
	render();
}

function render() {
    renderer.render(scene, camera)
}

// Resize window when its size has changed
window.addEventListener('resize', onWindowResize, false)
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    render()
}

animate();
