import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GAME_ASSET_BASE_URL } from './config.js';
import { networkState, requestSit, leaveSeat } from './network.js';
import { HeadLook } from './headLook.js';

export const couchSeatTransforms = [
    { id: 0, position: new THREE.Vector3(-1.25, 0.2, 1.0), rotationY: Math.PI },
    { id: 1, position: new THREE.Vector3(-0.4, 0.2, 1.0), rotationY: Math.PI },
    { id: 2, position: new THREE.Vector3(0.4, 0.2, 1.0), rotationY: Math.PI },
    { id: 3, position: new THREE.Vector3(1.25, 0.2, 1.0), rotationY: Math.PI }
];

// Position/rotation in Head bone's LOCAL space (bone uses ~cm scale, so values are ~100x scene units)
// headfront bone is at approx (-0.1, 9.1, 20.6) in Head-local space
export const FACE_SCREEN_POSITION = new THREE.Vector3(0, 28, 9);
export const FACE_SCREEN_ROTATION = new THREE.Euler(-0.46, 0, 0);
export const FACE_SCREEN_WIDTH = 0.45;
export const FACE_SCREEN_HEIGHT = 0.35;
export const FACE_SCREEN_DEPTH_OFFSET = 0.01;
// Scale compensation: bone world scale is ~0.01, so mesh must be 100x to appear at intended size
export const FACE_SCREEN_BONE_SCALE = 100;
// Tagged so the remote clone template can be scrubbed of any stray face plane
export const FACE_SCREEN_NAME = 'FaceScreen';
// A gentle cylindrical bend so the screen still reads from off to the side instead of
// vanishing edge-on the way a flat plane does. Raise this for more wrap.
export const FACE_SCREEN_CURVE = THREE.MathUtils.degToRad(45);
const FACE_SCREEN_CURVE_SEGMENTS = 16;

// First-person scroll zoom. Scroll down zooms in, scroll up eases back to normal.
const FPP_ZOOM_MIN = 1.0;
const FPP_ZOOM_MAX = 2.0;
const FPP_ZOOM_STEP = 0.1;
const FPP_ZOOM_RESPONSE = 12;

/**
 * Builds the face screen surface, shared by the local player and every remote avatar.
 *
 * The screen is a slice of a cylinder whose axis sits behind it, so the middle bulges
 * forward and the edges angle outward, widening the arc it stays visible over. Arc
 * length is held at FACE_SCREEN_WIDTH so the screen keeps its size, and the slice is
 * shifted so its EDGES land exactly where the old flat plane sat - the bulge grows away
 * from the skull rather than sinking into it.
 */
export function createFaceScreenGeometry() {
    if (FACE_SCREEN_CURVE <= 0) {
        return new THREE.PlaneGeometry(FACE_SCREEN_WIDTH, FACE_SCREEN_HEIGHT);
    }

    const radius = FACE_SCREEN_WIDTH / FACE_SCREEN_CURVE;
    const geometry = new THREE.CylinderGeometry(
        radius, radius,
        FACE_SCREEN_HEIGHT,
        FACE_SCREEN_CURVE_SEGMENTS, 1,
        true,                       // open ended - no caps
        -FACE_SCREEN_CURVE / 2,     // centre the arc on +Z
        FACE_SCREEN_CURVE
    );
    geometry.translate(0, 0, -radius * Math.cos(FACE_SCREEN_CURVE / 2));
    return geometry;
}

export class Player {
    constructor(camera, scene, colliders = [], interactables = [], raycastMeshes = [], container = document.body, uiPrompt = null, playerName = "Local Player", localCameraStream = null) {
        this.camera = camera;
        this.scene = scene;
        this.colliders = colliders; 
        this.interactables = interactables; 
        this.raycastMeshes = raycastMeshes;
        this.container = container;
        this.radius = 0.4; 
        
        // Player body - moves in world space, mesh rotates to velocity
        this.body = new THREE.Group();
        this.body.position.set(0, 1.5, 6); 
        this.scene.add(this.body);

        // Decoupled Camera Rig
        this.cameraRig = new THREE.Group();
        this.cameraPitch = new THREE.Group();
        this.cameraRig.add(this.cameraPitch);
        this.cameraPitch.add(this.camera);
        
        // Initialize camera rig at body position
        this.cameraRig.position.copy(this.body.position);
        this.cameraRig.position.y += 0.2; // Head offset
        this.scene.add(this.cameraRig);
        
        // Camera settings
        this.viewMode = 'TPP'; // 'FPP' or 'TPP'
        this.cameraDistance = 3.5;
        this.targetCameraZ = this.cameraDistance;
        this.camera.position.set(0, 0, this.cameraDistance); 

        // FPP scroll zoom state
        this.targetZoom = FPP_ZOOM_MIN;
        this.camera.zoom = FPP_ZOOM_MIN;
        this.camera.updateProjectionMatrix();

        this.moveForward = false;
        this.moveBackward = false;
        this.moveLeft = false;
        this.moveRight = false;
        
        this.speed = 5.0; 

        // Animation and Model state
        this.characterMesh = null;
        this.mixer = null;
        this.actions = {};
        this.currentActionName = null;
        this.headLook = null;

        // Interaction state
        this.isSitting = false;
        this.isGesturing = false;
        this.nearbyInteractable = null;
        this.nearbySeat = null;
        this.preSitPosition = new THREE.Vector3();
        this.preSitRotationY = 0;
        
        this.uiPrompt = uiPrompt || document.getElementById('ui-prompt');

        // Store bound event listeners for cleanup
        this._onKeyDown = this.onKeyDown.bind(this);
        this._onKeyUp = this.onKeyUp.bind(this);
        this._onClick = this.onClick.bind(this);
        this._onMouseMove = this.onMouseMove.bind(this);
        this._onWheel = this.onWheel.bind(this);
        
        // Pre-allocate objects for the render loop to prevent garbage collection spikes
        this._raycaster = new THREE.Raycaster();
        this._cameraDirection = new THREE.Vector3();
        this._quaternion = new THREE.Quaternion();
        this._localVelocity = new THREE.Vector3();
        this._worldVelocity = new THREE.Vector3();
        this._euler = new THREE.Euler();
        this._targetQuat = new THREE.Quaternion();
        this._axisY = new THREE.Vector3(0, 1, 0);
        this._playerBox = new THREE.Box3();
        this._boxMin = new THREE.Vector3();
        this._boxMax = new THREE.Vector3();
        this._targetRigPos = new THREE.Vector3();

        this.clips = {};
        this.currentActionName = null;

        // Video state
        this.localCameraStream = localCameraStream;
        this.videoElement = null;
        this.videoTexture = null;

        // Create face screen
        const geometry = createFaceScreenGeometry();
        this.faceScreenMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: false,
            toneMapped: false,
            side: THREE.FrontSide
        });
        this.faceScreenMesh = new THREE.Mesh(geometry, this.faceScreenMaterial);
        this.faceScreenMesh.name = FACE_SCREEN_NAME;
        
        // Position relative to body root
        this.faceScreenMesh.position.copy(FACE_SCREEN_POSITION);
        this.faceScreenMesh.position.z += FACE_SCREEN_DEPTH_OFFSET;
        this.faceScreenMesh.rotation.copy(FACE_SCREEN_ROTATION);
        // Will attach to this.characterMesh once it loads to inherit rotation

        this.setupControls();
        this.createNameLabel(playerName);
    }

    createNameLabel(name) {
        const nameDiv = document.createElement('div');
        nameDiv.className = 'player-name-label';
        nameDiv.textContent = name;
        nameDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        nameDiv.style.color = 'white';
        nameDiv.style.padding = '2px 6px';
        nameDiv.style.borderRadius = '4px';
        nameDiv.style.fontSize = '12px';
        nameDiv.style.fontFamily = 'sans-serif';
        nameDiv.style.pointerEvents = 'none';

        this.nameLabel = new CSS2DObject(nameDiv);
        this.nameLabel.position.set(0, 0.5, 0);
        this.body.add(this.nameLabel);
    }

    onBaseModelLoaded = null;
    onClipLoaded = null;

    loadModels() {
        const loader = new GLTFLoader();
        
        const idleUrl = new URL('assets/player/idle.glb', GAME_ASSET_BASE_URL).href;
        console.log("Loading GLB (Base + Idle):", idleUrl);
        loader.load(idleUrl, (gltf) => {
            const model = gltf.scene;
            
            // Enable shadows
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // Adjust position so the model's feet sit flush with the floor
            model.position.set(0, -1.5, 0); 
            
            this.characterMesh = new THREE.Group();
            this.characterMesh.add(model);
            // The model's forward is local +Z while the camera looks down its own -Z, so
            // spawn the avatar facing away from the camera. Otherwise the head-look offset
            // starts a full 180 degrees from where the camera points and clamps sideways.
            this.characterMesh.rotation.y = Math.PI;

            const headBone = model.getObjectByName('Head');

            // Snapshot the rig BEFORE the local face screen is parented into it.
            // RemotePlayerSystem clones this template, and Mesh.clone() copies the
            // material by reference - a face plane left in here would paint the
            // local camera onto every remote avatar.
            const baseModelTemplate = SkeletonUtils.clone(model);
            
            if (this.faceScreenMesh) {
                if (headBone) {
                    headBone.add(this.faceScreenMesh);
                    // Compensate for bone's ~0.01 world scale
                    this.faceScreenMesh.scale.set(FACE_SCREEN_BONE_SCALE, FACE_SCREEN_BONE_SCALE, FACE_SCREEN_BONE_SCALE);
                    // Re-apply position in bone-local coordinates
                    this.faceScreenMesh.position.copy(FACE_SCREEN_POSITION);
                    this.faceScreenMesh.position.z += FACE_SCREEN_DEPTH_OFFSET;
                    this.faceScreenMesh.rotation.copy(FACE_SCREEN_ROTATION);
                    console.log('[FACE SCREEN] Attached to Head bone, scale:', FACE_SCREEN_BONE_SCALE);
                } else {
                    console.warn('[FACE SCREEN] Head bone NOT found, falling back to characterMesh');
                    this.characterMesh.add(this.faceScreenMesh);
                }
            }
            
            this.body.add(this.characterMesh);

            // Capture the rest pose now, while the bones are still untouched by the mixer
            this.headLook = new HeadLook(model, this.characterMesh);

            this.mixer = new THREE.AnimationMixer(model);
            
            this.mixer.addEventListener('finished', (e) => {
                this.isGesturing = false;
                if (this.isSitting) {
                    this.playAction('Sit');
                } else if (this.currentActionName !== 'Idle' && this.currentActionName !== 'Walk') {
                    this.playAction('Idle');
                }
            });
            
            // Extract the Idle animation from this first load
            const idleClip = gltf.animations[0];
            if (idleClip) {
                this.clips['Idle'] = idleClip;
                const idleAction = this.mixer.clipAction(idleClip);
                this.actions['Idle'] = idleAction;
                
                if (this.onClipLoaded) {
                    this.onClipLoaded('Idle', idleClip);
                }
                
                this.playAction('Idle');
            }

            if (this.onBaseModelLoaded) {
                this.onBaseModelLoaded(baseModelTemplate);
            }

            // Apply stream immediately if it was passed in the constructor
            if (this.localCameraStream) {
                this.updateCameraStream(this.localCameraStream);
            }
            
            // Load other animations (extracting only the clip)
            this.loadAnimation(loader, 'assets/player/walk.glb', 'Walk', false);
            this.loadAnimation(loader, 'assets/player/sit.glb', 'Sit', false);
            this.loadAnimation(loader, 'assets/player/wave.glb', 'Wave', false, true);
            this.loadAnimation(loader, 'assets/player/point.glb', 'Point', false, true);
            this.loadAnimation(loader, 'assets/player/thumbsup.glb', 'ThumbsUp', false, true);
        });
    }

    loadAnimation(loader, path, name, playOnLoad, isGesture = false) {
        const url = new URL(path, GAME_ASSET_BASE_URL).href;
        console.log(`Loading GLB (${name} animation):`, url);
        loader.load(url, (gltf) => {
            const clip = gltf.animations[0];
            if (clip) {
                this.clips[name] = clip;
                const action = this.mixer.clipAction(clip);
                
                if (isGesture) {
                    action.setLoop(THREE.LoopOnce, 1);
                    action.clampWhenFinished = true;
                }
                
                this.actions[name] = action;
                
                if (this.onClipLoaded) {
                    this.onClipLoaded(name, clip);
                }
                
                if (playOnLoad) {
                    this.playAction(name);
                }
            } else {
                console.warn(`No animation found in ${path}`);
            }
            
            // Explicitly detach and dispose of the unused meshes and materials
            // to prevent memory leaks and unnecessary WebGL buffer uploads.
            if (gltf.scene) {
                gltf.scene.traverse((child) => {
                    if (child.isMesh) {
                        if (child.geometry) child.geometry.dispose();
                        if (child.material) {
                            if (Array.isArray(child.material)) {
                                child.material.forEach(m => {
                                    if (m.map) m.map.dispose();
                                    m.dispose();
                                });
                            } else {
                                if (child.material.map) child.material.map.dispose();
                                child.material.dispose();
                            }
                        }
                    }
                });
            }
        });
    }

    playAction(name) {
        if (!this.actions[name] || this.currentActionName === name) return;
        
        const nextAction = this.actions[name];
        const prevAction = this.currentActionName ? this.actions[this.currentActionName] : null;
        
        if (prevAction) {
            nextAction.reset().play();
            prevAction.crossFadeTo(nextAction, 0.2, true);
        } else {
            nextAction.reset().play();
        }
        
        this.currentActionName = name;
    }

    playGesture(name) {
        if (this.isGesturing) return; // Prevent overlapping gestures
        if (!this.actions[name]) return;
        
        this.isGesturing = true;
        this.playAction(name);
    }

    stopGesture() {
        if (!this.isGesturing) return;
        this.isGesturing = false;
        
        if (this.isSitting) {
            this.playAction('Sit');
        }
        // If not sitting, the next update() tick will automatically transition to Walk/Idle based on movement.
    }

    onKeyDown(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = true; break;
            case 'KeyA': this.moveLeft = true; break;
            case 'KeyS': this.moveBackward = true; break;
            case 'KeyD': this.moveRight = true; break;
            case 'KeyE': this.handleInteract(); break;
            case 'KeyQ': 
                this.viewMode = this.viewMode === 'TPP' ? 'FPP' : 'TPP';
                // Zoom is an FPP-only control, so release it on the way out
                if (this.viewMode !== 'FPP') this.targetZoom = FPP_ZOOM_MIN;
                break;
            case 'Digit1': this.playGesture('Wave'); break;
            case 'Digit2': this.playGesture('Point'); break;
            case 'Digit3': this.playGesture('ThumbsUp'); break;
            case 'Digit0': this.stopGesture(); break;
        }
    }

    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW': this.moveForward = false; break;
            case 'KeyA': this.moveLeft = false; break;
            case 'KeyS': this.moveBackward = false; break;
            case 'KeyD': this.moveRight = false; break;
        }
    }

    onClick() {
        if (document.pointerLockElement !== this.container) {
            this.container.requestPointerLock();
        }
    }

    onMouseMove(event) {
        if (document.pointerLockElement === this.container) {
            const movementX = event.movementX || 0;
            const movementY = event.movementY || 0;

            // Yaw (turning left/right) is applied to the camera rig
            this.cameraRig.rotation.y -= movementX * 0.002;
            
            // Pitch (looking up/down) is applied to the camera pitch object
            this.cameraPitch.rotation.x -= movementY * 0.002;

            // Clamp pitch so the camera can't flip upside down
            this.cameraPitch.rotation.x = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, this.cameraPitch.rotation.x));
        }
    }

    onWheel(event) {
        if (this.viewMode !== 'FPP') return;

        // Stop the page scrolling behind the canvas
        event.preventDefault();

        // Scroll down zooms in, scroll up backs off. Sign only - trackpads and mice
        // report wildly different deltaY magnitudes, so one notch is one step.
        const direction = Math.sign(event.deltaY);
        this.targetZoom = THREE.MathUtils.clamp(
            this.targetZoom + direction * FPP_ZOOM_STEP,
            FPP_ZOOM_MIN,
            FPP_ZOOM_MAX
        );
    }

    // Eases the camera toward the scroll target. Framerate independent.
    _updateZoom(delta) {
        const t = 1 - Math.exp(-FPP_ZOOM_RESPONSE * delta);
        const next = this.camera.zoom + (this.targetZoom - this.camera.zoom) * t;
        if (Math.abs(next - this.camera.zoom) > 0.0001) {
            this.camera.zoom = next;
            this.camera.updateProjectionMatrix();
        }
    }

    setupControls() {
        document.addEventListener('keydown', this._onKeyDown);
        document.addEventListener('keyup', this._onKeyUp);

        // Request pointer lock on container click
        this.container.addEventListener('click', this._onClick);

        // Handle mouse look scoped to the container (fired on the locked element)
        this.container.addEventListener('mousemove', this._onMouseMove);

        // passive:false so preventDefault() can stop the page scrolling
        this.container.addEventListener('wheel', this._onWheel, { passive: false });
    }

    handleInteract() {
        console.log("[COUCH] E pressed, state:", {
            isSitting: this.isSitting,
            nearbySeat: this.nearbySeat ? this.nearbySeat.id : null,
            playerPosition: {
                x: this.body.position.x,
                y: this.body.position.y,
                z: this.body.position.z
            },
            seats: couchSeatTransforms.map(seat => ({
                id: seat.id,
                x: seat.position.x,
                y: seat.position.y,
                z: seat.position.z
            })),
            couchSeats: networkState.couchSeats
        });

        if (this.isSitting) {
            console.log("[COUCH] requesting leaveSeat()");
            leaveSeat();
        } else if (this.nearbySeat) {
            console.log("[COUCH] requesting requestSit() for seat:", this.nearbySeat.id);
            requestSit(this.nearbySeat.id);
        } else if (this.nearbyInteractable) {
            // General interactable (like lamp)
        }
    }

    sit(seatId) {
        console.log("[COUCH] local player sit() called for seat:", seatId);
        this.isSitting = true;
        this.preSitPosition.copy(this.body.position);
        // Store the body's facing, not the camera's - stand() restores this onto the
        // character mesh, and the two are a half turn apart.
        this.preSitRotationY = this.characterMesh ? this.characterMesh.rotation.y : Math.PI;
        
        const seat = couchSeatTransforms[seatId];
        this.body.position.copy(seat.position);
        // Correct for the Y offset so the character isn't pushed into the floor
        this.body.position.y += 1.5;
        
        if (this.characterMesh) {
            this.characterMesh.rotation.set(0, seat.rotationY, 0);
        }
        
        if (this.mixer) this.playAction('Sit');
        if (this.uiPrompt) this.uiPrompt.style.display = 'none';
    }

    stand() {
        this.isSitting = false;
        this.body.position.copy(this.preSitPosition);
        
        if (this.characterMesh) {
            this.characterMesh.rotation.set(0, this.preSitRotationY, 0);
        }
        
        if (this.mixer) this.playAction('Idle');
    }

    update(delta) {
        const timings = { camera: 0, collision: 0, mixer: 0, total: 0 };
        const tStart = performance.now();

        // 1. Smoothly follow the player with the camera rig
        const targetRigPos = this._targetRigPos.copy(this.body.position);
        targetRigPos.y += 0.2; // Offset to shoulder/head height
        this.cameraRig.position.lerp(targetRigPos, 15 * delta);

        // 2. Camera positioning (FPP vs TPP + Raycasting)
        const tCamStart = performance.now();
        if (this.viewMode === 'FPP') {
            this.camera.position.set(0, 0, -0.3); // Push slightly forward to avoid seeing inside the head

            // Hide the character mesh from FPP view to prevent clipping
            if (this.characterMesh && this.characterMesh.visible) {
                this.characterMesh.visible = false;
            }
        } else {
            // Restore visibility in TPP
            if (this.characterMesh && !this.characterMesh.visible) {
                this.characterMesh.visible = true;
            }

            // TPP Mode with basic collision prevention
            let finalZ = this.cameraDistance;
            
            if (this.raycastMeshes && this.raycastMeshes.length > 0) {
                const raycaster = this._raycaster;
                // Direction camera is facing (backwards from character)
                const direction = this._cameraDirection.set(0, 0, 1).applyQuaternion(this.cameraPitch.getWorldQuaternion(this._quaternion));
                direction.normalize();
                
                raycaster.set(this.cameraRig.position, direction);
                
                const intersects = raycaster.intersectObjects(this.raycastMeshes, true);
                if (intersects.length > 0) {
                    const hitDist = intersects[0].distance;
                    if (hitDist < this.cameraDistance) {
                        finalZ = Math.max(0.2, hitDist - 0.2); // Keep slightly in front of the wall
                    }
                }
            }
            
            this.targetCameraZ = finalZ;
            // Smoothly move camera along Z
            this.camera.position.z += (this.targetCameraZ - this.camera.position.z) * 10 * delta;
            this.camera.position.y = 0;
            this.camera.position.x = 0;
        }
        this._updateZoom(delta);
        timings.camera = performance.now() - tCamStart;

        // 3. Early return if sitting (skip movement logic)
        if (this.isSitting) {
            const tMixer = performance.now();
            if (this.mixer) this.mixer.update(delta);
            this._updateHeadLook(delta);
            timings.mixer = performance.now() - tMixer;
            timings.total = performance.now() - tStart;
            return timings;
        }

        // 4. Update interactions
        this.nearbyInteractable = null;
        this.nearbySeat = null;

        let nearestSeat = null;
        let nearestDist = Infinity;
        let allOccupied = true;
        let closeToCouch = false;
        
        for (const seat of couchSeatTransforms) {
            // Use 2D horizontal distance to avoid body Y height (1.5) artificially inflating distance to seat Y (0)
            const dx = this.body.position.x - seat.position.x;
            const dz = this.body.position.z - seat.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist < 2.0) {
                closeToCouch = true;
                const isOccupied = networkState.couchSeats && networkState.couchSeats[seat.id] !== null;
                if (!isOccupied) {
                    allOccupied = false;
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestSeat = seat;
                    }
                }
            }
        }
        
        // Only log when changing proximity state to avoid spam
        if (closeToCouch && !this._lastCloseToCouch) {
            console.log("[COUCH] Approached couch. Nearest free seat:", nearestSeat ? nearestSeat.id : 'None');
            console.log("[COUCH DEBUG]", {
                playerPosition: {
                    x: this.body.position.x,
                    y: this.body.position.y,
                    z: this.body.position.z
                },
                seats: couchSeatTransforms.map(seat => ({
                    id: seat.id,
                    x: seat.position.x,
                    y: seat.position.y,
                    z: seat.position.z
                })),
                couchSeats: networkState.couchSeats
            });
        } else if (!closeToCouch && this._lastCloseToCouch) {
            console.log("[COUCH] Left couch proximity.");
        }
        this._lastCloseToCouch = closeToCouch;
        
        if (!closeToCouch && this.interactables) {
            for (const interactable of this.interactables) {
                if (this.body.position.distanceTo(interactable.position) < interactable.radius) {
                    this.nearbyInteractable = interactable;
                    break;
                }
            }
        }

        if (closeToCouch) {
            if (allOccupied) {
                this.nearbySeat = null;
            } else if (nearestSeat) {
                this.nearbySeat = nearestSeat;
            }
        } else if (this.nearbyInteractable) {
            this.nearbySeat = null;
        } else {
            this.nearbySeat = null;
        }

        if (this.uiPrompt) {
            if (closeToCouch) {
                if (allOccupied) {
                    this.uiPrompt.style.display = 'block';
                    this.uiPrompt.innerText = 'Couch is full';
                } else if (nearestSeat) {
                    this.uiPrompt.style.display = 'block';
                    this.uiPrompt.innerText = 'Press E to sit';
                }
            } else if (this.nearbyInteractable) {
                this.uiPrompt.style.display = 'block';
                this.uiPrompt.innerText = this.nearbyInteractable.promptText || 'Press E to interact';
            } else {
                this.uiPrompt.style.display = 'none';
            }
        }

        // 5. Calculate Movement
        const localVelocity = this._localVelocity.set(0, 0, 0);
        
        if (this.moveForward) localVelocity.z -= 1;
        if (this.moveBackward) localVelocity.z += 1;
        if (this.moveLeft) localVelocity.x -= 1;
        if (this.moveRight) localVelocity.x += 1;
        
        const worldVelocity = this._worldVelocity.copy(localVelocity);

        if (localVelocity.lengthSq() > 0) {
            localVelocity.normalize();
            
            // Apply camera rig's yaw to velocity so 'W' always moves where camera is looking horizontally
            worldVelocity.copy(localVelocity);
            this._euler.set(0, this.cameraRig.rotation.y, 0);
            worldVelocity.applyEuler(this._euler);
            
            // Smoothly rotate character mesh towards movement direction
            if (this.characterMesh) {
                const targetAngle = Math.atan2(worldVelocity.x, worldVelocity.z);
                const targetQuat = this._targetQuat.setFromAxisAngle(this._axisY, targetAngle);
                this.characterMesh.quaternion.slerp(targetQuat, 10 * delta);
            }
            
            if (this.mixer && !this.isGesturing) this.playAction('Walk');
        } else {
            if (this.mixer && !this.isGesturing) this.playAction('Idle');
        }
        
        worldVelocity.multiplyScalar(this.speed * delta);

        // 6. Apply Movement and Collisions
        const tCol = performance.now();
        this.body.position.x += worldVelocity.x;
        if (this.checkCollisions()) {
            this.body.position.x -= worldVelocity.x; 
        }

        this.body.position.z += worldVelocity.z;
        if (this.checkCollisions()) {
            this.body.position.z -= worldVelocity.z; 
        }
        timings.collision = performance.now() - tCol;

        const tMixer = performance.now();
        if (this.mixer) {
            this.mixer.update(delta);
        }
        this._updateHeadLook(delta);
        timings.mixer = performance.now() - tMixer;
        
        timings.total = performance.now() - tStart;
        return timings;
    }

    checkCollisions() {
        const px = this.body.position.x;
        const pz = this.body.position.z;
        const r = this.radius;
        
        // Create an AABB for the player (Y goes from 0 to 2)
        this._boxMin.set(px - r, 0, pz - r);
        this._boxMax.set(px + r, 2, pz + r);
        this._playerBox.set(this._boxMin, this._boxMax);

        for (const box of this.colliders) {
            if (this._playerBox.intersectsBox(box)) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Points the head wherever the camera is looking. Runs after mixer.update() because
     * the clips own the neck/Head bones for the frame — see headLook.js.
     */
    _updateHeadLook(delta) {
        if (!this.headLook) return;

        // FPP only. In TPP the camera orbits the character, so its direction says nothing
        // about where the person is looking - tracking it there just cranks the head
        // sideways every time the camera swings. Target neutral instead and let the
        // smoothing ease the head back rather than snapping it.
        if (this.viewMode !== 'FPP') {
            this.headLook.setTarget(0, 0);
            this.headLook.update(delta);
            return;
        }

        const bodyYaw = this.characterMesh ? this.characterMesh.rotation.y : 0;
        // Body forward is local +Z, the camera looks down its own -Z, hence the PI.
        let yaw = this.cameraRig.rotation.y + Math.PI - bodyYaw;
        yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw)); // wrap into [-PI, PI]

        // Camera pitch is positive looking up; the bone pitch axis is positive looking down.
        this.headLook.setTarget(yaw, -this.cameraPitch.rotation.x);
        this.headLook.update(delta);
    }

    updateCameraStream(stream) {
        this.localCameraStream = stream;
        
        if (!this.faceScreenMaterial) return;

        console.log('[FACE VIDEO] updateCameraStream called, stream:', stream, 'tracks:', stream?.getTracks?.()?.length);

        if (!stream) {
            // Turn face off
            this.faceScreenMaterial.map = null;
            this.faceScreenMaterial.color.setHex(0x000000);
            this.faceScreenMaterial.needsUpdate = true;
            return;
        }

        if (!this.videoElement) {
            this.videoElement = document.createElement('video');
            this.videoElement.crossOrigin = 'anonymous';
            this.videoElement.playsInline = true;
            this.videoElement.muted = true;
            this.videoElement.autoplay = true;
        }
        
        if (this.videoElement.srcObject !== stream) {
            this.videoElement.srcObject = stream;
            this.videoElement.play().catch(err => {
                console.warn('[FACE VIDEO] video.play() failed:', err);
            });
        }

        if (!this.videoTexture) {
            this.videoTexture = new THREE.VideoTexture(this.videoElement);
            this.videoTexture.colorSpace = THREE.SRGBColorSpace;
        }

        this.faceScreenMaterial.map = this.videoTexture;
        this.faceScreenMaterial.color.setHex(0xffffff);
        this.faceScreenMaterial.needsUpdate = true;

        console.log('[FACE VIDEO] Pipeline:', {
            videoSrc: !!this.videoElement.srcObject,
            videoReady: this.videoElement.readyState,
            videoPaused: this.videoElement.paused,
            videoW: this.videoElement.videoWidth,
            videoH: this.videoElement.videoHeight,
            texture: !!this.videoTexture,
            materialMap: this.faceScreenMaterial.map === this.videoTexture,
            materialColor: this.faceScreenMaterial.color.getHexString()
        });
    }

    destroy() {
        // Remove event listeners
        document.removeEventListener('keydown', this._onKeyDown);
        document.removeEventListener('keyup', this._onKeyUp);
        this.container.removeEventListener('click', this._onClick);
        this.container.removeEventListener('mousemove', this._onMouseMove);
        this.container.removeEventListener('wheel', this._onWheel);

        // Exit pointer lock if we own it
        if (document.pointerLockElement === this.container) {
            document.exitPointerLock();
        }

        // Clean up animation mixer
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.mixer.getRoot());
            this.mixer = null;
        }

        if (this.faceScreenMesh) {
            if (this.faceScreenMesh.parent) {
                this.faceScreenMesh.parent.remove(this.faceScreenMesh);
            }
            this.faceScreenMesh.geometry.dispose();
            this.faceScreenMaterial.dispose();
            this.faceScreenMesh = null;
        }
        if (this.videoTexture) {
            this.videoTexture.dispose();
            this.videoTexture = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
            this.videoElement.pause();
            this.videoElement = null;
        }
    }
}
