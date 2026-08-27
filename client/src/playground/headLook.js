import * as THREE from 'three';

// How far the head may turn away from the body before it stops following the camera.
export const HEAD_LOOK_MAX_YAW = THREE.MathUtils.degToRad(70);
export const HEAD_LOOK_MAX_PITCH = THREE.MathUtils.degToRad(35);
// Higher = the head catches up to the camera faster. Framerate independent.
export const HEAD_LOOK_RESPONSE = 12;

// The turn is spread up the spine so the upper body leans into it instead of the skull
// pivoting on its own. Weights should add up to 1.
const LOOK_CHAIN = [
    { name: 'neck', weight: 0.4 },
    { name: 'Head', weight: 0.6 }
];

/**
 * Procedural head turning that composes with whatever the AnimationMixer is playing.
 *
 * The clips animate the neck and Head bones directly, so the mixer rewrites their
 * rotations every frame. That means this has to run AFTER mixer.update() — anything
 * written before is simply discarded. It post-multiplies a small offset onto the
 * animated pose rather than replacing it, so the idle head bob and the sit/wave clips
 * survive underneath the look.
 *
 * The offset rotates about the bone's rest-pose vertical and horizontal axes, captured
 * once at construction. Rotating about the raw bone axes would not work on this rig:
 * the Head bone sits ~27 degrees pitched in its bind pose, so a naive local-Y yaw would
 * visibly roll the head as it turned.
 */
export class HeadLook {
    constructor(root, bodyRoot) {
        this.segments = [];
        // Where the head is heading — this is what gets networked.
        this.targetYaw = 0;
        this.targetPitch = 0;
        // What is actually applied to the bones this frame.
        this.yaw = 0;
        this.pitch = 0;

        this._yawQuat = new THREE.Quaternion();
        this._pitchQuat = new THREE.Quaternion();

        if (!root) return;

        const reference = bodyRoot || root;
        reference.updateMatrixWorld(true);

        const bodyInverse = reference.getWorldQuaternion(new THREE.Quaternion()).invert();
        const boneWorld = new THREE.Quaternion();

        for (const { name, weight } of LOOK_CHAIN) {
            const bone = root.getObjectByName(name);
            if (!bone) continue;

            // Rest orientation of this bone measured against the body, inverted: it maps
            // body-space directions into this bone's local space.
            const toBoneSpace = bodyInverse.clone()
                .multiply(bone.getWorldQuaternion(boneWorld))
                .invert();

            this.segments.push({
                bone,
                weight,
                yawAxis: new THREE.Vector3(0, 1, 0).applyQuaternion(toBoneSpace).normalize(),
                // Positive rotation about this axis pitches the face down.
                pitchAxis: new THREE.Vector3(1, 0, 0).applyQuaternion(toBoneSpace).normalize()
            });
        }

        if (this.segments.length === 0) {
            console.warn('[HEAD LOOK] No look bones found on the model, head tracking disabled');
        }
    }

    /** Yaw is relative to the body's facing; positive pitch looks down. Both get clamped. */
    setTarget(yaw, pitch) {
        this.targetYaw = THREE.MathUtils.clamp(yaw, -HEAD_LOOK_MAX_YAW, HEAD_LOOK_MAX_YAW);
        this.targetPitch = THREE.MathUtils.clamp(pitch, -HEAD_LOOK_MAX_PITCH, HEAD_LOOK_MAX_PITCH);
    }

    /** Smooths toward the target and stamps it onto the bones. Call AFTER mixer.update(). */
    update(delta) {
        if (this.segments.length === 0) return;

        const t = 1 - Math.exp(-HEAD_LOOK_RESPONSE * delta);
        this.yaw += (this.targetYaw - this.yaw) * t;
        this.pitch += (this.targetPitch - this.pitch) * t;

        for (const segment of this.segments) {
            this._yawQuat.setFromAxisAngle(segment.yawAxis, this.yaw * segment.weight);
            this._pitchQuat.setFromAxisAngle(segment.pitchAxis, this.pitch * segment.weight);
            segment.bone.quaternion.multiply(this._yawQuat).multiply(this._pitchQuat);
        }
    }
}
