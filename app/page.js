"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

const ThreeScene = () => {
  // reference the div to draw the canvas
  const canvasRef = useRef(null);
  // declare constants and variables
  const intersectionPoint = new THREE.Vector3();
  const planeNormal = new THREE.Vector3();
  const plane = new THREE.Plane();
  let draggable;
  let objects = [];
  const mouse = new THREE.Vector2();

  useEffect(() => {
    // CAMERA
    const camera = new THREE.PerspectiveCamera(
      30,
      window.innerWidth / window.innerHeight,
      1,
      1500
    );
    camera.position.set(-35, 70, 100);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // RENDERER
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    canvasRef.current.appendChild(renderer.domElement);

    // WINDOW RESIZE HANDLING
    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onWindowResize);

    // SCENE
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xbfd1e5);

    // CONTROLS
    const controls = new OrbitControls(camera, renderer.domElement);

    // AMBIENT LIGHT
    const hemiLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(hemiLight);

    // DIRECTIONAL LIGHT
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(-30, 50, -30);
    scene.add(dirLight);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -70;
    dirLight.shadow.camera.right = 70;
    dirLight.shadow.camera.top = 70;
    dirLight.shadow.camera.bottom = -70;

    // FLOOR
    const createFloor = () => {
      const pos = { x: 10, y: -6, z: 3 };
      const scale = { x: 100, y: 2, z: 100 };

      const blockPlane = new THREE.Mesh(
        new THREE.BoxBufferGeometry(),
        new THREE.MeshPhongMaterial({ color: 0xf9c834 })
      );
      blockPlane.position.set(pos.x, pos.y, pos.z);
      blockPlane.scale.set(scale.x, scale.y, scale.z);
      blockPlane.castShadow = true;
      blockPlane.receiveShadow = true;
      scene.add(blockPlane);

      blockPlane.userData.ground = true;
    };
    createFloor();

    // SPHERE
    const createSphere = () => {
      const radius = 3;

      const sphere = new THREE.Mesh(
        new THREE.SphereBufferGeometry(radius, 32, 32),
        new THREE.MeshPhongMaterial({ color: "#9b1919" })
      );
      // sphere.position.set(pos.x, pos.y, pos.z);
      sphere.castShadow = true;
      sphere.receiveShadow = true;
      scene.add(sphere);

      sphere.userData.draggable = true;
      sphere.userData.name = "SPHERE";
      objects.push(sphere);
      sphere.position.copy(intersectionPoint);
    };
    createSphere();

    //  use dat.GUI for changing properties

    const changeSphereProperties = () => {
      const gui = new GUI();
      var palette = {
        color: "#9b1919", // CSS string
      };
      var sphereRadius = {
        radius: 3,
      };
      var spherePosition = {
        x: 0,
        y: 0,
        z: 0,
      };
      // change sphere colour
      var folder = gui.addFolder("Sphere Colour");
      folder
        .addColor(palette, "color")
        .name("Sphere Color")
        .onChange(function () {
          for (var i = 0; i < objects.length; i++) {
            objects[i].material.color.set(palette.color);
          }
        });
      // change sphere scale/size
      folder
        .add(sphereRadius, "radius", 1, 10)
        .name("Sphere radius")
        .onChange(function () {
          for (var i = 0; i < objects.length; i++) {
            objects[i].scale.x = sphereRadius.radius;
            objects[i].scale.y = sphereRadius.radius;
            objects[i].scale.z = sphereRadius.radius;
            console.log(sphereRadius.radius);
          }
        });
      // change sphere position
      folder
        .add(spherePosition, "x", 0, 10)
        .name("position x")
        .onChange(function () {
          for (var i = 0; i < objects.length; i++) {
            objects[i].position.x = spherePosition.x;
          }
        });
      folder
        .add(spherePosition, "y", 0, Math.PI * 2)
        .name("position y")
        .onChange(function () {
          for (var i = 0; i < objects.length; i++) {
            objects[i].position.y = spherePosition.y;
          }
        });
      folder
        .add(spherePosition, "z", 0, Math.PI * 2)
        .name("position z")
        .onChange(function () {
          for (var i = 0; i < objects.length; i++) {
            objects[i].position.z = spherePosition.z;
          }
        });
      folder.open();
    };
    changeSphereProperties();

    // INTERSECTION
    const raycaster = new THREE.Raycaster();
    const clickMouse = new THREE.Vector2();
    const moveMouse = new THREE.Vector2();

    const intersect = (pos) => {
      raycaster.setFromCamera(pos, camera);
      return raycaster.intersectObjects(scene.children);
    };

    // create new sphere if there isn't a draggable sphere on cursor
    const handleClick = (e) => {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      planeNormal.copy(camera.position).normalize();
      plane.setFromNormalAndCoplanarPoint(planeNormal, scene.position);
      raycaster.setFromCamera(mouse, camera);
      raycaster.ray.intersectPlane(plane, intersectionPoint);

      const intersects = raycaster.intersectObjects(objects);
      if (intersects.length > 0) {
        // intersects[0].object.material.color.setHex(Math.random() * 0xffffff);

        if (draggable != null) {
          console.log(`dropping draggable ${draggable.userData.name}`);
          draggable = null;
          return;
        }

        clickMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        clickMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

        const found = intersect(clickMouse);
        if (found.length > 0) {
          if (found[0].object.userData.draggable) {
            draggable = found[0].object;
            console.log(`found draggable ${draggable.userData.name}`);
          }
        }
      } else {
        if (draggable != null) {
          console.log(`dropping draggable ${draggable.userData.name}`);
          draggable = null;
          return;
        } else {
          createSphere();
        }
      }
    };
    window.addEventListener("click", handleClick);
    document.addEventListener("dblclick", ondblclick, false);

    // remove sphere on double click
    function ondblclick(event) {
      const intersects = raycaster.intersectObjects(objects);
      if (intersects.length > 0) {
        // alert("hit");
        intersects[0].object.geometry.dispose();
        intersects[0].object.material.dispose();
        scene.remove(intersects[0].object);
        renderer.renderLists.dispose();
        renderer.render(scene, camera);
      }
    }
    const handleMouseMove = (event) => {
      moveMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      moveMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // drag objects around
    const dragObject = () => {
      if (draggable != null) {
        const found = intersect(moveMouse);
        if (found.length > 0) {
          for (let i = 0; i < found.length; i++) {
            if (!found[i].object.userData.ground) continue;

            const target = found[i].point;
            draggable.position.x = target.x;
            draggable.position.z = target.z;
          }
        }
      }
    };

    // check if any of the spheres collide
    const checkCollision = () => {
      let firstSphere;
      let secondSphere;
      let allSpheres = [];
      for (let i = 0; i < objects.length; i++) {
        allSpheres.push(new THREE.Box3().setFromObject(objects[i]));
      }

      // at each frame,  check if some objects are colliding :
      allSpheres.forEach((sphere) => {
        // Filter out  from Spheres
        const otherSpheres = allSpheres.filter((other) => other !== sphere);

        // Check if any of the other Spheres intersects with this Sphere
        otherSpheres.forEach((other) => {
          if (sphere.intersectsBox(other)) {
            firstSphere = objects.filter(
              (object) =>
                JSON.stringify(new THREE.Box3().setFromObject(object)) ===
                JSON.stringify(sphere)
            );
            secondSphere = objects.filter(
              (object) =>
                JSON.stringify(new THREE.Box3().setFromObject(object)) ===
                JSON.stringify(other)
            );
            // let combinedGeometry = BufferGeometryUtils.mergeGeometries([
            //   firstSphere[0].geometry,
            //   secondSphere[0].geometry,
            // ]);
            // const combinedMaterial = new THREE.MeshStandardMaterial({
            //   color: "#184c9b",
            // });
            // const combinedSphere = new THREE.Mesh(
            //   combinedGeometry,
            //   combinedMaterial
            // );
            // scene.add(combinedSphere);

            // firstSphere[0].geometry.dispose();
            // firstSphere[0].material.dispose();

            // remove colliding sphere
            scene.remove(firstSphere[0]);
            renderer.renderLists.dispose();
            renderer.render(scene, camera);
            console.log(objects);
            draggable = null;
            allSpheres = allSpheres.filter((object) => object !== sphere);
            return (objects = objects.filter(
              (object) => object !== firstSphere[0]
            ));
          }
        });
      });
    };
    // ANIMATION
    const animate = () => {
      checkCollision();
      dragObject();
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();
  }, []);

  return <div ref={canvasRef} />;
};

export default ThreeScene;
