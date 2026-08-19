import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { Player } from '../player.js';
import { RemotePlayerSystem } from '../remotePlayers.js';
import { initNetwork, onNetworkEvents, cleanupNetwork } from '../network.js';

export function initThreeJsGame({
    container,
    roomCode = "local-standalone",
    socket = null,
    screenShareStream = null,
    localCameraStream = null,
    remoteCameraStreams = {},
    playerName = "Local Player"
} = {}) {
    window.__gameInstanceCount = (window.__gameInstanceCount || 0) + 1;
    console.log(`Game initialized: ${window.__gameInstanceCount}`);

    // Create Scene early so we can attach remote players
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);

    // Initialize remote players
    const remotePlayers = new RemotePlayerSystem(scene, remoteCameraStreams);
    let player = null; // Declare early for network callbacks

    onNetworkEvents({
        onPlayerJoined: (p) => {
            console.log("Game level: remote player joined", p.id, p.name);
            remotePlayers.addPlayer(p.id, p.name);
        },
        onPlayerLeft: (id) => {
            console.log("Game level: remote player left", id);
            remotePlayers.removePlayer(id);
        },
        onRoomFull: () => {
            console.warn("Game level: room is full!");
            // Optional: show UI message here
        },
        onPlayerUpdate: (data) => {
            remotePlayers.updatePlayer(data);
        },
        onRemotePlayerSat: (data) => {
            remotePlayers.sit(data.id, data.seatId);
        },
        onRemotePlayerStood: (id) => {
            remotePlayers.stand(id);
        },
        onLocalPlayerSat: (seatId) => {
            if (player) player.sit(seatId);
        },
        onLocalPlayerStood: () => {
            if (player) player.stand();
        }
    });

    // Initialize networking conditionally
    initNetwork(roomCode, socket);

    // Dynamically create ui-prompt if it doesn't exist within container
    let uiPrompt = container.querySelector('#ui-prompt');
    let promptCreated = false;
    
    if (!uiPrompt) {
        uiPrompt = document.createElement('div');
        uiPrompt.id = 'ui-prompt';
        uiPrompt.style.display = 'none';
        uiPrompt.style.position = 'absolute';
        uiPrompt.style.bottom = '15%';
        uiPrompt.style.width = '100%';
        uiPrompt.style.textAlign = 'center';
        uiPrompt.style.color = 'white';
        uiPrompt.style.fontFamily = 'sans-serif';
        uiPrompt.style.fontSize = '24px';
        uiPrompt.style.fontWeight = 'bold';
        uiPrompt.style.textShadow = '2px 2px 4px #000';
        uiPrompt.style.pointerEvents = 'none';
        uiPrompt.style.zIndex = '10';
        uiPrompt.innerText = 'Press E to interact';
        
        // Ensure container is positioned so absolute elements sit inside it
        if (getComputedStyle(container).position === 'static') {
            container.style.position = 'relative';
        }
        
        container.appendChild(uiPrompt);
        promptCreated = true;
    }

    // 1. Scene setup (already done above)

    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);

    // 3. Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    
    // Cap pixel ratio to save fill-rate/GPU
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    renderer.shadowMap.enabled = true; // Enable shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Constrain the canvas to the container to prevent page growth
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    
    container.appendChild(renderer.domElement);

    // CSS2DRenderer for name labels
    const labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(container.clientWidth, container.clientHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.style.pointerEvents = 'none';
    container.appendChild(labelRenderer.domElement);

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); 
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 0.8, 25);
    pointLight.position.set(0, 3.8, 0); // Near ceiling, center
    pointLight.castShadow = true;
    pointLight.shadow.mapSize.width = 1024;
    pointLight.shadow.mapSize.height = 1024;
    pointLight.shadow.bias = -0.001;
    scene.add(pointLight);

    // 5. Room Construction
    const createMesh = (geometry, material, castShadow = true, receiveShadow = true) => {
        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = castShadow;
        mesh.receiveShadow = receiveShadow;
        return mesh;
    };

    // Materials
    const matWall = new THREE.MeshStandardMaterial({ color: 0xe0e0e0, roughness: 0.9 });
    const matFloor = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.8 }); 
    const matCeiling = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1.0 });
    const matWood = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.8 }); 
    const matCouch = new THREE.MeshStandardMaterial({ color: 0x4a7c59, roughness: 0.9 }); 
    const matTVFrame = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 });
    const matTVScreen = new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.1 }); 
    const matGlass = new THREE.MeshStandardMaterial({ color: 0xadd8e6, transparent: true, opacity: 0.4 });
    const matDoor = new THREE.MeshStandardMaterial({ color: 0x654321, roughness: 0.7 });

    const roomGroup = new THREE.Group();
    const t = 0.2; 
    const W = 12, D = 14, H = 4; 

    // Floor
    const floorGeo = new THREE.BoxGeometry(W, t, D);
    const floor = createMesh(floorGeo, matFloor, false, true);
    floor.position.y = -t/2;
    roomGroup.add(floor);

    // Ceiling
    const ceilingGeo = new THREE.BoxGeometry(W, t, D);
    const ceiling = createMesh(ceilingGeo, matCeiling, false, true);
    ceiling.position.y = H + t/2;
    roomGroup.add(ceiling);

    // Walls
    const wallNSGeo = new THREE.BoxGeometry(W, H, t);
    const wallEWGeo = new THREE.BoxGeometry(t, H, D);

    const wallNorth = createMesh(wallNSGeo, matWall, false, true);
    wallNorth.position.set(0, H/2, -D/2 - t/2);
    roomGroup.add(wallNorth);

    const wallSouth = createMesh(wallNSGeo, matWall, false, true);
    wallSouth.position.set(0, H/2, D/2 + t/2);
    roomGroup.add(wallSouth);

    const wallEast = createMesh(wallEWGeo, matWall, false, true);
    wallEast.position.set(W/2 + t/2, H/2, 0);
    roomGroup.add(wallEast);

    const wallWest = createMesh(wallEWGeo, matWall, false, true);
    wallWest.position.set(-W/2 - t/2, H/2, 0);
    roomGroup.add(wallWest);

    // Window 
    const windowGeo = new THREE.BoxGeometry(t + 0.1, 1.8, 3);
    const windowMesh = createMesh(windowGeo, matGlass, false, false);
    windowMesh.position.set(-W/2 - t/2, 2, 0); 
    roomGroup.add(windowMesh);

    // Door 
    const doorGeo = new THREE.BoxGeometry(1.8, 2.5, t + 0.1);
    const door = createMesh(doorGeo, matDoor, true, false);
    door.position.set(-W/2 + 2, 2.5/2, D/2 + t/2);
    roomGroup.add(door);


    // ==========================================
    // ARRANGING FURNITURE TO MATCH DIAGRAM
    // ==========================================

    // TV (Top)
    const tvGroup = new THREE.Group();
    const standGeo = new THREE.BoxGeometry(4, 0.5, 1);
    const stand = createMesh(standGeo, matWood);
    stand.position.set(0, 0.25, 0);
    tvGroup.add(stand);

    const tvFrameGeo = new THREE.BoxGeometry(3.6, 2.0, 0.1);
    const tvFrame = createMesh(tvFrameGeo, matTVFrame);
    tvFrame.position.set(0, 1.5, 0);
    tvGroup.add(tvFrame);

    const tvScreenGeo = new THREE.BoxGeometry(3.5, 1.9, 0.11);
    const tvScreen = createMesh(tvScreenGeo, matTVScreen, false, false);
    tvScreen.position.set(0, 1.5, 0);
    tvGroup.add(tvScreen);

    tvGroup.position.set(0, 0, -4);
    roomGroup.add(tvGroup);

    // ==========================================
    // VIRTUAL TV SCREEN-SHARE SETUP
    // ==========================================
    let tvVideo = document.createElement('video');
    tvVideo.crossOrigin = 'anonymous';
    tvVideo.playsInline = true;
    tvVideo.muted = true;
    tvVideo.autoplay = true;
    let tvVideoTexture = null;
    let matTVVideo = null;

    let isTVRenderingEnabled = true;

    // Toggle button for TV Rendering
    const tvToggleBtn = document.createElement('button');
    tvToggleBtn.innerText = 'Toggle TV Render (Test B)';
    tvToggleBtn.style.position = 'absolute';
    tvToggleBtn.style.top = '10px';
    tvToggleBtn.style.left = '200px';
    tvToggleBtn.style.zIndex = '1000';
    tvToggleBtn.style.padding = '5px';
    tvToggleBtn.style.cursor = 'pointer';
    container.appendChild(tvToggleBtn);
    tvToggleBtn.addEventListener('click', () => {
        isTVRenderingEnabled = !isTVRenderingEnabled;
        tvToggleBtn.innerText = isTVRenderingEnabled ? 'Disable TV Render (Test B)' : 'Enable TV Render (Test A)';
        if (tvVideo.srcObject) {
            tvScreen.material = isTVRenderingEnabled ? matTVVideo : matTVScreen;
        }
    });

    let videoFrameCount = 0;
    
    const applyScreenShareStream = (stream) => {
        if (stream) {
            tvVideo.srcObject = stream;
            tvVideo.play().catch(e => console.warn('Video play blocked', e));
            if (!tvVideoTexture) {
                tvVideoTexture = new THREE.VideoTexture(tvVideo);
                tvVideoTexture.colorSpace = THREE.SRGBColorSpace;
                tvVideoTexture.minFilter = THREE.LinearFilter;
                tvVideoTexture.magFilter = THREE.LinearFilter;
                tvVideoTexture.generateMipmaps = false;
            }
            
            if (!matTVVideo) {
                matTVVideo = new THREE.MeshBasicMaterial({ map: tvVideoTexture });
                matTVVideo.toneMapped = false;
            }
            
            tvScreen.material = isTVRenderingEnabled ? matTVVideo : matTVScreen;

            if ('requestVideoFrameCallback' in tvVideo) {
                tvVideo.requestVideoFrameCallback(function callback(now, meta) {
                    if (tvVideo.srcObject) {
                        videoFrameCount++;
                        tvVideo.requestVideoFrameCallback(callback);
                    }
                });
            }
        } else {
            tvVideo.srcObject = null;
            if (tvVideoTexture) {
                tvVideoTexture.dispose();
                tvVideoTexture = null;
            }
            if (matTVVideo) {
                matTVVideo.dispose();
                matTVVideo = null;
            }
            
            // Revert to original dark TV screen state
            tvScreen.material = matTVScreen;
        }
    };

    // Apply initial stream if provided
    applyScreenShareStream(screenShareStream);


    // Couch (Middle)
    const couchGroup = new THREE.Group();
    const seatGeo = new THREE.BoxGeometry(5, 0.5, 1.8);
    const seat = createMesh(seatGeo, matCouch);
    seat.position.set(0, 0.25, 0);
    couchGroup.add(seat);

    const backrestGeo = new THREE.BoxGeometry(5, 1.2, 0.4);
    const backrest = createMesh(backrestGeo, matCouch);
    backrest.position.set(0, 0.85, -0.7); // Backrest is at the back of the couch (facing away from TV side)
    couchGroup.add(backrest);

    const armrestGeo = new THREE.BoxGeometry(0.5, 0.8, 1.8);
    const armLeft = createMesh(armrestGeo, matCouch);
    armLeft.position.set(-2.25, 0.4, 0);
    couchGroup.add(armLeft);

    const armRight = createMesh(armrestGeo, matCouch);
    armRight.position.set(2.25, 0.4, 0);
    couchGroup.add(armRight);

    couchGroup.position.set(0, 0, 2);
    couchGroup.rotation.y = Math.PI; // Rotate 180 degrees so the front faces the TV
    roomGroup.add(couchGroup);


    // Table (Bottom)
    const tableGroup = new THREE.Group();
    const tableTopGeo = new THREE.BoxGeometry(2.5, 0.1, 1.5);
    const tableTop = createMesh(tableTopGeo, matWood);
    tableTop.position.set(0, 0.6, 0);
    tableGroup.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.1, 0.6, 0.1);
    for(let x of [-1.15, 1.15]) {
        for(let z of [-0.65, 0.65]) {
            const leg = createMesh(legGeo, matWood);
            leg.position.set(x, 0.3, z);
            tableGroup.add(leg);
        }
    }
    tableGroup.position.set(0, 0, -1.0); // Place between the couch and the TV
    roomGroup.add(tableGroup);

    scene.add(roomGroup);

    // ==========================================
    // SETUP COLLISION BOXES
    // ==========================================
    // Update all matrices so bounding boxes are accurate
    roomGroup.updateMatrixWorld(true);

    const colliders = [];
    const raycastMeshes = [];
    const addCollider = (obj) => {
        colliders.push(new THREE.Box3().setFromObject(obj));
        raycastMeshes.push(obj);
    };

    // Add solid objects to collision array
    addCollider(wallNorth);
    addCollider(wallSouth);
    addCollider(wallEast);
    addCollider(wallWest);
    addCollider(tvGroup);
    addCollider(couchGroup);
    addCollider(tableGroup);

    // Define interaction points
    const interactables = [];

    // Initialize player with collision boxes, interactables, and raycast meshes
    player = new Player(camera, scene, colliders, interactables, raycastMeshes, container, uiPrompt, playerName, localCameraStream);
    
    // Wire asset loading to RemotePlayerSystem
    player.onBaseModelLoaded = (model) => {
        remotePlayers.setBaseModel(model);
    };
    player.onClipLoaded = (name, clip) => {
        remotePlayers.addClip(name, clip);
    };

    player.loadModels();

    // 6. Handle resizing via ResizeObserver
    const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
                labelRenderer.setSize(width, height);
            }
        }
    });
    resizeObserver.observe(container);

    // 7. Diagnostics panel (Temporary)
    const debugPanel = document.createElement('div');
    debugPanel.style.position = 'absolute';
    debugPanel.style.top = '10px';
    debugPanel.style.left = '10px';
    debugPanel.style.padding = '10px';
    debugPanel.style.background = 'rgba(0, 0, 0, 0.7)';
    debugPanel.style.color = '#00ff00';
    debugPanel.style.fontFamily = 'monospace';
    debugPanel.style.fontSize = '12px';
    debugPanel.style.pointerEvents = 'none';
    debugPanel.style.zIndex = '1000';
    container.appendChild(debugPanel);

    // 8. Render loop
    const clock = new THREE.Clock();
    let animationFrameId;
    
    let frameCount = 0;
    let lastTime = performance.now();
    let lastVideoFrameCount = 0;

    // Networking states for local player
    const lastSentPos = new THREE.Vector3();
    let lastSentRot = 0;
    let lastSentAnim = null;
    let lastNetworkUpdate = 0;

    function animate() {
        const frameStart = performance.now();
        animationFrameId = requestAnimationFrame(animate);
        
        const delta = clock.getDelta();
        
        const playerTimings = player.update(delta) || { camera: 0, collision: 0, mixer: 0, total: 0 };
        
        // Update remote players (interpolation)
        remotePlayers.update(delta);

        // Network emission logic
        const now = performance.now();
        const currentAnim = player.currentActionName || 'Idle';
        const animChanged = lastSentAnim !== currentAnim;
        
        if (animChanged || now - lastNetworkUpdate >= 50) { // Send instantly if anim changed, else ~20fps
            const pos = player.body.position;
            const rot = player.characterMesh ? player.characterMesh.rotation.y : 0;
            
            const distSq = pos.distanceToSquared(lastSentPos);
            const rotDiff = Math.abs(rot - lastSentRot);
            
            // Send if position changed by ~0.01 units, rotation by ~0.01 radians, or animation changed
            if (distSq > 0.0001 || rotDiff > 0.01 || animChanged) {
                lastSentPos.copy(pos);
                lastSentRot = rot;
                lastSentAnim = currentAnim;
                lastNetworkUpdate = now;
                
                socket.emit("game-player-update", {
                    roomCode,
                    position: { x: pos.x, y: pos.y, z: pos.z },
                    rotation: { y: rot },
                    animation: currentAnim
                });
            }
        }
        
        const tRenderStart = performance.now();
        renderer.render(scene, camera);
        labelRenderer.render(scene, camera);
        const tRenderTime = performance.now() - tRenderStart;
        
        const totalFrameTime = performance.now() - frameStart;
        
        frameCount++;
        const nowFPS = performance.now();
        if (nowFPS - lastTime >= 500) {
            const fps = Math.round((frameCount * 1000) / (nowFPS - lastTime));
            const incomingVideoFPS = Math.round(((videoFrameCount - lastVideoFrameCount) * 1000) / (nowFPS - lastTime));
            
            debugPanel.innerHTML = `
                <b>FPS: ${fps}</b><br>
                Render Calls: ${renderer.info.render.calls}<br>
                Triangles: ${renderer.info.render.triangles}<br>
                Geometries: ${renderer.info.memory.geometries}<br>
                Textures: ${renderer.info.memory.textures}<br>
                <br>
                <b>CPU Timing (ms):</b><br>
                Total Frame: ${totalFrameTime.toFixed(2)}<br>
                player.update: ${playerTimings.total.toFixed(2)}<br>
                renderer.render: ${tRenderTime.toFixed(2)}<br>
                <br>
                <b>Video Element:</b><br>
                Size: ${tvVideo.videoWidth}x${tvVideo.videoHeight}<br>
                ReadyState: ${tvVideo.readyState}<br>
                Paused: ${tvVideo.paused}<br>
                CurrentTime: ${tvVideo.currentTime.toFixed(2)}<br>
                Incoming FPS (rVFC): ${incomingVideoFPS}
            `;
            
            frameCount = 0;
            lastTime = nowFPS;
            lastVideoFrameCount = videoFrameCount;
        }
    }

    // Start the animation loop
    animate();

    // Return the instance
    return {
        roomCode,
        socket,
        screenShareStream,
        updateScreenShareStream: applyScreenShareStream,
        destroy: () => {
            window.__gameInstanceCount = Math.max(0, (window.__gameInstanceCount || 1) - 1);
            console.log(`Game destroyed. Remaining instances: ${window.__gameInstanceCount}`);

            // Stop animation loop
            cancelAnimationFrame(animationFrameId);

            // Disconnect observers
            resizeObserver.disconnect();

            // Destroy player events and state
            player.destroy();
            
            // Remove debug panel and toggle button
            if (debugPanel.parentElement) debugPanel.parentElement.removeChild(debugPanel);
            if (tvToggleBtn.parentElement) tvToggleBtn.parentElement.removeChild(tvToggleBtn);

            // Clean up TV resources
            applyScreenShareStream(null);
            tvVideo = null;

            // Clean up network and remote players
            cleanupNetwork();
            remotePlayers.destroy();

            // Remove renderer from container
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            if (container.contains(labelRenderer.domElement)) {
                container.removeChild(labelRenderer.domElement);
            }

            // Remove dynamically created prompt
            if (promptCreated && uiPrompt && container.contains(uiPrompt)) {
                container.removeChild(uiPrompt);
            }

            // Cleanup player and remote players
            if (player && typeof player.destroy === 'function') player.destroy();
            remotePlayers.destroy();

            // Dispose Three.js objects
            scene.traverse((object) => {
                if (object.isMesh) {
                    if (object.geometry) object.geometry.dispose();
                    if (object.material) {
                        if (Array.isArray(object.material)) {
                            object.material.forEach(m => m.dispose());
                        } else {
                            object.material.dispose();
                        }
                    }
                }
            });

            // Dispose renderer
            renderer.dispose();
        },
        updateCameraStreams: ({ localCameraStream, remoteCameraStreams }) => {
            if (player && typeof player.updateCameraStream === 'function') {
                player.updateCameraStream(localCameraStream);
            }
            if (remotePlayers && typeof remotePlayers.updateCameraStreams === 'function') {
                remotePlayers.updateCameraStreams(remoteCameraStreams);
            }
        }
    };
}
