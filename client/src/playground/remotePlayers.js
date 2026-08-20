import * as THREE from 'three';
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils.js';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { 
    couchSeatTransforms, 
    FACE_SCREEN_POSITION, 
    FACE_SCREEN_ROTATION, 
    FACE_SCREEN_WIDTH, 
    FACE_SCREEN_HEIGHT, 
    FACE_SCREEN_DEPTH_OFFSET,
    FACE_SCREEN_BONE_SCALE
} from './player.js';

export class RemotePlayerSystem {
    constructor(scene, remoteCameraStreams = {}) {
        this.scene = scene;
        this.remoteCameraStreams = remoteCameraStreams;
        this.players = new Map(); // socketId -> { group, spawnIndex, ... }
        this.baseModel = null;
        this.clips = {};
        
        this.spawnPositions = [
            new THREE.Vector3(-2, 1.5, 4),
            new THREE.Vector3(2, 1.5, 4),
            new THREE.Vector3(0, 1.5, 4)
        ];
        this.spawnTaken = [false, false, false];
    }

    setBaseModel(model) {
        this.baseModel = model;
        // Retroactively instantiate models for any players that joined early
        this.players.forEach((player) => {
            if (!player.modelAdded) {
                this._instantiateModel(player);
            }
        });
    }

    addClip(name, clip) {
        this.clips[name] = clip;
        this.players.forEach((player) => {
            if (player.mixer) {
                player.actions[name] = player.mixer.clipAction(clip);
                
                // If this player was waiting to play this animation, play it now
                if (player.targetAnimation === name && player.currentAnimation !== name) {
                    this._playAction(player, name);
                }
            }
        });
    }

    _instantiateModel(player) {
        if (!this.baseModel) return;
        
        const clonedModel = SkeletonUtils.clone(this.baseModel);

        player.group.add(clonedModel);
        player.modelAdded = true;
        
        let headBone = clonedModel.getObjectByName('Head');
        if (headBone && player.faceScreenMesh) {
            // Move face screen from group to head bone
            if (player.faceScreenMesh.parent) {
                player.faceScreenMesh.parent.remove(player.faceScreenMesh);
            }
            headBone.add(player.faceScreenMesh);
            // Compensate for bone's ~0.01 world scale
            player.faceScreenMesh.scale.set(FACE_SCREEN_BONE_SCALE, FACE_SCREEN_BONE_SCALE, FACE_SCREEN_BONE_SCALE);
            // Re-apply position in bone-local coordinates
            player.faceScreenMesh.position.copy(FACE_SCREEN_POSITION);
            player.faceScreenMesh.position.z += FACE_SCREEN_DEPTH_OFFSET;
            player.faceScreenMesh.rotation.copy(FACE_SCREEN_ROTATION);
        }
        
        player.mixer = new THREE.AnimationMixer(clonedModel);
        player.actions = {};
        
        // Bind currently available clips
        for (const [name, clip] of Object.entries(this.clips)) {
            player.actions[name] = player.mixer.clipAction(clip);
        }
        
        // Play current target animation or Idle
        const animToPlay = player.targetAnimation || 'Idle';
        if (player.actions[animToPlay]) {
            player.actions[animToPlay].play();
            player.currentAnimation = animToPlay;
        }

        // Apply stream if available
        if (this.remoteCameraStreams && this.remoteCameraStreams[player.id]) {
            this._applyCameraStream(player, this.remoteCameraStreams[player.id]);
        }
    }

    _playAction(player, name) {
        if (!player.actions || !player.actions[name] || player.currentAnimation === name) return;
        
        const nextAction = player.actions[name];
        const prevAction = player.currentAnimation ? player.actions[player.currentAnimation] : null;
        
        if (prevAction) {
            nextAction.reset().play();
            prevAction.crossFadeTo(nextAction, 0.2, true);
        } else {
            nextAction.reset().play();
        }
        
        player.currentAnimation = name;
    }

    addPlayer(id, name = "Remote Player") {
        if (this.players.has(id)) return;

        // Find available spawn position
        let spawnIndex = this.spawnTaken.findIndex(taken => !taken);
        if (spawnIndex === -1) spawnIndex = 0; // Fallback
        this.spawnTaken[spawnIndex] = true;

        const spawnPos = this.spawnPositions[spawnIndex];

        const group = new THREE.Group();
        group.position.copy(spawnPos);

        this.scene.add(group);
        
        const player = { 
            id,
            group, 
            spawnIndex,
            targetPosition: new THREE.Vector3().copy(spawnPos),
            targetRotationY: 0,
            currentRotationY: 0,
            modelAdded: false,
            mixer: null,
            actions: null,
            currentAnimation: null,
            targetAnimation: 'Idle',
            faceScreenMaterial: null,
            faceScreenMesh: null,
            videoElement: null,
            videoTexture: null
        };
        
        // Create face screen plane
        const geometry = new THREE.PlaneGeometry(FACE_SCREEN_WIDTH, FACE_SCREEN_HEIGHT);
        player.faceScreenMaterial = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: false,
            toneMapped: false,
            side: THREE.BackSide
        });
        player.faceScreenMesh = new THREE.Mesh(geometry, player.faceScreenMaterial);
        
        // Position relative to group root
        player.faceScreenMesh.position.copy(FACE_SCREEN_POSITION);
        player.faceScreenMesh.position.z += FACE_SCREEN_DEPTH_OFFSET;
        player.faceScreenMesh.rotation.copy(FACE_SCREEN_ROTATION);
        group.add(player.faceScreenMesh);

        this.players.set(id, player);

        // Eagerly apply camera stream if available (material exists even before model loads)
        if (this.remoteCameraStreams && this.remoteCameraStreams[id]) {
            this._applyCameraStream(player, this.remoteCameraStreams[id]);
        }

        if (this.baseModel) {
            this._instantiateModel(player);
        }

        // Create name label
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

        const nameLabel = new CSS2DObject(nameDiv);
        nameLabel.position.set(0, 0.5, 0);
        group.add(nameLabel);
        player.nameLabel = nameLabel;

        console.log("[RemotePlayer] spawned", {
            id,
            position: group.position,
            scale: group.scale
        });
    }

    removePlayer(id) {
        const player = this.players.get(id);
        if (!player) return;

        // Free spawn point
        if (player.spawnIndex >= 0 && player.spawnIndex < this.spawnTaken.length) {
            if (this.spawnTaken[player.spawnIndex]) {
                this.spawnTaken[player.spawnIndex] = false;
            }
        }

        this._cleanupPlayerVideo(player);

        if (player.nameLabel && player.nameLabel.element) {
            player.nameLabel.element.remove();
        }

        if (player.group) {
            this.scene.remove(player.group);
        }

        this.players.delete(id);
    }

    updatePlayer(data) {
        const player = this.players.get(data.id);
        if (!player) return;

        if (player.isSitting) {
            // Ignore position/rotation updates while sitting
            return;
        }

        if (data.position) {
            player.targetPosition.set(data.position.x, data.position.y, data.position.z);
        }
        
        if (data.rotation && typeof data.rotation.y === 'number') {
            player.targetRotationY = data.rotation.y;
        }
        
        if (data.animation && player.targetAnimation !== data.animation) {
            player.targetAnimation = data.animation;
            this._playAction(player, data.animation);
        }
    }

    update(delta) {
        for (const player of this.players.values()) {
            if (player.isSitting) {
                if (player.mixer) player.mixer.update(delta);
                continue;
            }

            // Check for large position desync (teleport snap if > 5 units)
            if (player.group.position.distanceToSquared(player.targetPosition) > 25) {
                player.group.position.copy(player.targetPosition);
            } else {
                // Smooth interpolation for position
                player.group.position.lerp(player.targetPosition, 10 * delta);
            }

            // Smooth interpolation for rotation, resolving -PI/PI wraparound
            let diff = player.targetRotationY - player.currentRotationY;
            // Normalize to [-PI, PI] without allocating new vectors/quaternions
            diff = Math.atan2(Math.sin(diff), Math.cos(diff)); 
            
            player.currentRotationY += diff * 10 * delta;
            player.group.rotation.y = player.currentRotationY;
            
            // Update animation mixer
            if (player.mixer) {
                player.mixer.update(delta);
            }
        }
    }

    sit(id, seatId) {
        const player = this.players.get(id);
        if (!player) return;

        player.isSitting = true;
        const seat = couchSeatTransforms[seatId];
        player.group.position.copy(seat.position);
        player.group.position.y += 1.5;
        player.group.rotation.y = seat.rotationY;
        player.targetAnimation = 'Sit';
        this._playAction(player, 'Sit');
    }

    stand(id) {
        const player = this.players.get(id);
        if (!player) return;

        player.isSitting = false;
        player.targetAnimation = 'Idle';
        this._playAction(player, 'Idle');
    }

    destroy() {
        // Remove all players
        for (const [id, player] of this.players.entries()) {
            this._cleanupPlayerVideo(player);
            if (player.nameLabel && player.nameLabel.element) {
                player.nameLabel.element.remove();
            }
            this.scene.remove(player.group);
        }
        this.players.clear();
        this.spawnTaken.fill(false);
    }

    updateCameraStreams(streams) {
        this.remoteCameraStreams = streams;
        for (const [id, player] of this.players.entries()) {
            this._applyCameraStream(player, streams[id] || null);
        }
    }

    _applyCameraStream(player, stream) {
        if (!player.faceScreenMaterial) return;

        if (!stream) {
            // Dark/Blank face
            player.faceScreenMaterial.map = null;
            player.faceScreenMaterial.color.setHex(0x000000);
            player.faceScreenMaterial.needsUpdate = true;
            return;
        }

        if (!player.videoElement) {
            player.videoElement = document.createElement('video');
            player.videoElement.crossOrigin = 'anonymous';
            player.videoElement.playsInline = true;
            player.videoElement.muted = true;
            player.videoElement.autoplay = true;
        }

        if (player.videoElement.srcObject !== stream) {
            player.videoElement.srcObject = stream;
            player.videoElement.play().catch(err => {
                console.warn('[REMOTE FACE VIDEO] video.play() failed:', err);
            });
        }

        if (!player.videoTexture) {
            player.videoTexture = new THREE.VideoTexture(player.videoElement);
            player.videoTexture.colorSpace = THREE.SRGBColorSpace;
        }

        player.faceScreenMaterial.map = player.videoTexture;
        player.faceScreenMaterial.color.setHex(0xffffff);
        player.faceScreenMaterial.needsUpdate = true;
    }

    _cleanupPlayerVideo(player) {
        if (player.faceScreenMesh) {
            if (player.group) player.group.remove(player.faceScreenMesh);
            player.faceScreenMesh.geometry.dispose();
            player.faceScreenMaterial.dispose();
            player.faceScreenMesh = null;
        }
        if (player.videoTexture) {
            player.videoTexture.dispose();
            player.videoTexture = null;
        }
        if (player.videoElement) {
            player.videoElement.srcObject = null;
            player.videoElement.pause();
            player.videoElement = null;
        }
    }
}
