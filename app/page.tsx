"use client"
import { useEffect } from "react";
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader, DRACO_GLTF_CONFIG } from 'three/addons/loaders/DRACOLoader.js';
import { Sky } from 'three/addons/objects/Sky.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
const colors = [
  0xff6b6b, // Soft Red
  0x4ecdc4, // Mint
  0xffd166, // Pastel Yellow
  0x06d6a0, // Soft Green
  0x118ab2, // Soft Blue
  0xff85a2  // Pink
];
const particleCount = 120;
class PaperFirework {
  group: THREE.Group;
  material: THREE.MeshBasicMaterial;
  particles: { mesh: THREE.Mesh, velocity: THREE.Vector3, rotX: number, rotY: number, rotZ: number }[];
  age: number;
  maxAge: number;
  gravity: number;
  drag: number;
  scene: THREE.Scene;
  constructor(scene: THREE.Scene) {
    this.group = new THREE.Group();
    this.scene = scene;

    // Randomize explosion origin point
    this.group.position.set(
      (Math.random() - 0.5) * 30,
      (Math.random() - 0.5) * 20,
      (Math.random() - 0.5) * 10
    );

    const color = colors[Math.floor(Math.random() * colors.length)];

    // Use MeshLambertMaterial or MeshBasicMaterial with DoubleSide for flat "paper confetti"
    this.material = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1
    });

    this.particles = [];

    for (let i = 0; i < particleCount; i++) {
      // Create diverse paper shapes (Squares and Rectangles)
      const isRectangle = Math.random() > 0.5;
      const w = 0.3 + Math.random() * 0.4;
      const h = isRectangle ? w * 2 : w;
      const geometry = new THREE.PlaneGeometry(w, h);

      const mesh = new THREE.Mesh(geometry, this.material);
      this.group.add(mesh);

      // Calculate explosion velocity vectors (Sphere Distribution)
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = 0.1 + Math.random() * 0.2;

      const vx = Math.sin(phi) * Math.cos(theta) * speed;
      const vy = Math.sin(phi) * Math.sin(theta) * speed;
      const vz = Math.cos(phi) * speed;

      this.particles.push({
        mesh: mesh,
        velocity: new THREE.Vector3(vx, vy, vz),
        // Paper rotation speeds
        rotX: (Math.random() - 0.5) * 0.2,
        rotY: (Math.random() - 0.5) * 0.2,
        rotZ: (Math.random() - 0.5) * 0.1
      });
    }

    scene.add(this.group);
    this.age = 0;
    this.maxAge = 80 + Math.random() * 40; // Lifespan of the firework
    this.gravity = 0.003;
    this.drag = 0.98; // Air resistance makes it feel like paper drifting
  }

  update() {
    this.age++;

    // Fade out near the end of life
    if (this.age > this.maxAge * 0.6) {
      this.material.opacity = 1 - ((this.age - this.maxAge * 0.6) / (this.maxAge * 0.4));
    }

    this.particles.forEach(p => {
      // Apply velocity and drag
      p.velocity.x *= this.drag;
      p.velocity.y *= this.drag;
      p.velocity.z *= this.drag;

      // Apply gravity
      p.velocity.y -= this.gravity;

      // Move meshes
      p.mesh.position.add(p.velocity);

      // Tumble and spin like falling paper
      p.mesh.rotation.x += p.rotX;
      p.mesh.rotation.y += p.rotY;
      p.mesh.rotation.z += p.rotZ;
    });
  }

  isDead() {
    return this.age >= this.maxAge;
  }

  destroy() {
    this.scene.remove(this.group);
    this.group.children.forEach(child => child.dispose());
    this.material.dispose();
  }
}

export default function Home() {
  useEffect(() => {
    const fireworks: PaperFirework[] = [];
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    const scene = new THREE.Scene();
    const sky = new Sky();
    sky.scale.setScalar(1000);
    scene.add(sky);
    const uniforms = sky.material.uniforms;
    uniforms['turbidity'].value = 0;
    uniforms['rayleigh'].value = 3;
    uniforms['mieDirectionalG'].value = 0.7;
    uniforms['cloudElevation'].value = 1;
    uniforms['sunPosition'].value.set(- 0.8, 0.19, 0.56); // elevation: 11, azimuth: -55

    const fontLoader = new FontLoader();
    const textString = "HAPPY BIRTHDAY MY LOVE • ";
    const radius = 3;
    const characters = textString.split('');
    const textGroup = new THREE.Group();
    scene.add(textGroup);
    fontLoader.load('fonts/Arial Unicode MS_Regular.json', function (font) {
      characters.reverse().forEach((char, i) => {
        const angle = (i / characters.length) * Math.PI * 2;

        const geom = new TextGeometry(char, {
          font: font,
          size: 0.4,
          depth: 0.05,
          bevelEnabled: true,
          bevelThickness: 0.02,
          bevelSize: 0.02,
          bevelOffset: 0,
          bevelSegments: 3
        });
        geom.center();
        const color = colors[Math.floor(Math.random() * colors.length)];

        const mat = new THREE.MeshBasicMaterial({ color: color });
        const letterMesh = new THREE.Mesh(geom, mat);
        //letterMesh.rotation.x = 0.5;
        // Position each letter in a circle using trigonometry
        letterMesh.position.x = Math.cos(angle) * radius;
        letterMesh.position.y = Math.sin(angle) * radius;

        // Rotate each letter to face outward or tangent to the circle
        letterMesh.rotation.z = angle - Math.PI / 2;

        textGroup.add(letterMesh);
      });
    });

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const environment = pmremGenerator.fromScene(scene).texture;
    scene.environment = environment;

    renderer.setSize(window.innerWidth, window.innerHeight);
    const canvasContainer = document.getElementById('canvas');
    canvasContainer!.appendChild(renderer.domElement);
    // // 2. Create material
    // const materials = [
    //   new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Side body
    //   new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Top cap
    //   new THREE.MeshBasicMaterial({ color: 0x0000ff })  // Bottom cap
    // ];
    // const cylinderData = [
    //   {
    //     radiusTop: 1.5, radiusBottom: 1.5, height: 1.2, materials: [
    //       new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Side body
    //       new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Top cap
    //       new THREE.MeshBasicMaterial({ color: 0x0000ff })  // Bottom cap
    //     ], childs: []
    //   }, {
    //     radiusTop: 1, radiusBottom: 1, height: 1,
    //     materials: [
    //       new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Side body
    //       new THREE.MeshBasicMaterial({ color: 0x00ffff }), // Top cap
    //       new THREE.MeshBasicMaterial({ color: 0xffff00 })  // Bottom cap
    //     ],
    //     childs: [
    //       { radiusTop: 0.1, radiusBottom: 0.1, height: 0.5 },
    //       { radiusTop: 0.1, radiusBottom: 0.1, height: 0.5 },
    //       { radiusTop: 0.1, radiusBottom: 0.1, height: 0.5 }
    //     ]
    //   }
    // ];

    // let currentY = 0;
    // let currentX = 0;
    // let currentZ = 0;
    // const group = new THREE.Group();
    // let rotateItems: THREE.Mesh[] = [];
    // cylinderData.forEach((data, idx) => {
    //   const geometry = new THREE.CylinderGeometry(
    //     data.radiusTop,
    //     data.radiusBottom,
    //     data.height,
    //     32
    //   );

    //   const mesh = new THREE.Mesh(geometry, data.materials);
    //   // Position the mesh so its bottom aligns with currentY
    //   //geometry.translate(1, currentY / 2, 0);

    //   mesh.position.y = currentY + data.height / 2; // Position the mesh at currentX
    //   mesh.rotation.x = 1; // Rotate 90 degrees around the X-axis
    //   let currentChildY = 0;
    //   data.childs.forEach((childData) => {
    //     geometry.center();
    //     const childGeometry = new THREE.CylinderGeometry(
    //       childData.radiusTop,
    //       childData.radiusBottom,
    //       childData.height,
    //       32
    //     );
    //     const childMesh = new THREE.Mesh(childGeometry, materials);
    //     // Position the child mesh so its bottom aligns with the top of the parent cylinder
    //     childGeometry.center(); // Center the geometry to make positioning easier
    //     childMesh.position.y = currentChildY + data.height + childData.height / 2;
    //     childMesh.rotation.x = 0.8; // Rotate 90 degrees around the X-axis
    //     group.add(childMesh);
    //     currentChildY += childData.height; // Update currentChildY for the next child
    //   });
    //   rotateItems.push(mesh);
    //   const axesHelper = new THREE.AxesHelper(10);
    //   axesHelper.setColors(
    //     new THREE.Color(0xff00ff), // Pink for X
    //     new THREE.Color(0x00ffff), // Cyan for Y
    //     new THREE.Color(0xffff00)  // Yellow for Z
    //   );
    //   mesh.add(axesHelper);
    //   group.add(mesh);

    //   // Advance currentY for the next cylinder in the stack
    //   currentY += data.height;
    //   //currentX += data.radiusTop; // Update currentX for the next cylinder in the stack
    // });
    // scene.add(group);

    // Add it to your scene
    // 3. Combine into a mesh and add to scene
    camera.position.z = 5;
    let mixer: THREE.AnimationMixer;
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath(DRACO_GLTF_CONFIG);

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);
    loader.load('models/birthday_cake.glb', function (gltf) {

      const model = gltf.scene;
      model.position.set(0, -1, 1);
      model.scale.set(8, 8, 8);
      model.rotation.x = 0.5;
      model.name = 'Cake';
      scene.add(model);

      mixer = new THREE.AnimationMixer(model);
      //renderer.setAnimationLoop( animate );

    }, undefined, function (e) {

      console.error(e);

    });
    let spawnTimer = 0;
    function animate() {
      requestAnimationFrame(animate);
      scene.traverse((object) => {
        if (object.name === 'Birthday_Cake_0') {
          object.rotation.y += 0.01;
        }
      });
      textGroup.rotation.z += 0.005; // Spin the whole group
      spawnTimer++;
      if (spawnTimer % 45 === 0) {
        fireworks.push(new PaperFirework(scene));
      }

      // Update and clear dead fireworks
      for (let i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (fireworks[i].isDead()) {
          fireworks[i].destroy();
          fireworks.splice(i, 1);
        }
      }
      renderer.render(scene, camera);
    }

    animate();
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
    return () => {
      renderer.dispose();
      canvasContainer!.removeChild(renderer.domElement);
    };
  }, []);
  return (
    <div id="canvas"></div>
  );
}
