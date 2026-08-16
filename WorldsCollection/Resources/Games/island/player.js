import * as THREE from 'three';

// Try to import island bounds and height function from scene; fall back to defaults
let ISLAND_BOUNDS, getHeight;
try {
  const scene = await import('./scene.js');
  ISLAND_BOUNDS = scene.ISLAND_BOUNDS;
  getHeight = scene.getHeight;
} catch {
  ISLAND_BOUNDS = { minX: -280, maxX: 280, minZ: -280, maxZ: 280 };
  getHeight = () => 0;
}

// ---------------------------------------------------------------------------
// OBB (oriented bounding box) collision — push player out of a rotated rect
// { cx, cz, hw, hd, rot }
//
// Three.js rotation.y = θ transforms local → world as:
//   wx = cos(θ)*lx + sin(θ)*lz
//   wz = -sin(θ)*lx + cos(θ)*lz
//
// Inverse (world → local):
//   lx = cos(θ)*dx - sin(θ)*dz
//   lz = sin(θ)*dx + cos(θ)*dz
// ---------------------------------------------------------------------------
function resolveOBB(px, pz, obb) {
  const cosR = Math.cos(obb.rot), sinR = Math.sin(obb.rot);
  const dx = px - obb.cx, dz = pz - obb.cz;
  // World → local (rotate by -θ)
  const lx =  cosR * dx - sinR * dz;
  const lz =  sinR * dx + cosR * dz;
  const margin = 0.55; // player collision radius
  const ex = obb.hw + margin, ez = obb.hd + margin;
  if (Math.abs(lx) >= ex || Math.abs(lz) >= ez) return [px, pz]; // outside
  const ox = ex - Math.abs(lx), oz = ez - Math.abs(lz);
  let pushLX = 0, pushLZ = 0;
  if (ox < oz) pushLX = lx < 0 ? -ox : ox;
  else         pushLZ = lz < 0 ? -oz : oz;
  // Local → world (rotate by +θ)
  return [px + cosR * pushLX + sinR * pushLZ,
          pz - sinR * pushLX + cosR * pushLZ];
}

export class PlayerController {
  constructor(scene, camera, renderer) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;

    // Movement state
    this.keys = { forward: false, backward: false, left: false, right: false, sprint: false };
    this.moveSpeed = 8;    // units per second (walk)
    this.runSpeed  = 20;   // units per second (sprint)
    this.isMoving = false;

    // Jump / gravity
    this.velocityY   = 0;
    this.isOnGround  = true;
    this.GRAVITY        = -30;
    this.JUMP_IMPULSE   = 9;   // base impulse — gives a short hop on quick tap
    this.JUMP_HOLD_BOOST = 22; // extra upward force applied while Space is held
    this.JUMP_HOLD_MAX   = 0.25; // max seconds the boost lasts
    this.jumpHeld     = false;
    this.jumpHoldTime = 0;

    // Collision
    this.colliders = []; // set externally via setColliders()

    // Camera state
    this.yaw = 0;
    this.pitch = 0.3; // slight downward look
    this.cameraDistance = 10;
    this.cameraHeight = 5;
    this.isDragging = false;
    this.pointerLocked = false;
    this.mouseSensitivity = 0.003;
    this.pitchMin = -1.3;
    this.pitchMax = 1.5;

    // Camera bob
    this.bobTime = 0;
    this.bobAmount = 0.04;
    this.bobSpeed = 8;

    // Build the player mesh — a simple capsule shape
    this.player = this._createPlayerMesh();
    this.player.position.set(0, 0, 0);
    scene.add(this.player);

    // Direction vector (reused)
    this._moveDir = new THREE.Vector3();

    this._bindInput();

    // Mini-game system reference — set externally after construction
    this.miniGame = null;
  }

  /** Call after buildScene() to pass building colliders. */
  setColliders(colliders) {
    this.colliders = colliders;
  }

  _createPlayerMesh() {
    const group = new THREE.Group();

    // Body — cylinder
    const bodyGeo = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 12);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x4a9e8e, roughness: 0.6 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 1.0;
    body.castShadow = true;
    group.add(body);

    // Head — sphere
    const headGeo = new THREE.SphereGeometry(0.3, 12, 10);
    const headMat = new THREE.MeshStandardMaterial({ color: 0xf0d0a0, roughness: 0.5 });
    const head = new THREE.Mesh(headGeo, headMat);
    head.position.y = 1.9;
    head.castShadow = true;
    group.add(head);

    // Eyes
    const eyeMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const eyeGeo = new THREE.SphereGeometry(0.065, 7, 6);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.12, 1.95, 0.26);
    group.add(eyeL);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.12, 1.95, 0.26);
    group.add(eyeR);

    // Feet — two small spheres for a bottom cap look
    const footGeo = new THREE.SphereGeometry(0.35, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
    const footMat = bodyMat;
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.y = 0.4;
    foot.castShadow = true;
    group.add(foot);

    return group;
  }

  _bindInput() {
    // Keyboard
    window.addEventListener('keydown', (e) => this._onKey(e, true));
    window.addEventListener('keyup', (e) => this._onKey(e, false));

    // Mouse look — click to lock pointer, ESC to release
    const canvas = this.renderer.domElement;

    canvas.addEventListener('click', () => {
      canvas.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === canvas;
    });

    // Fallback: drag to look when not pointer-locked
    canvas.addEventListener('mousedown', (e) => {
      if (e.button === 0 && !this.pointerLocked) this.isDragging = true;
    });
    window.addEventListener('mouseup', () => { this.isDragging = false; });

    window.addEventListener('mousemove', (e) => {
      if (!this.pointerLocked && !this.isDragging) return;
      this.yaw -= e.movementX * this.mouseSensitivity;
      this.pitch += e.movementY * this.mouseSensitivity;
      this.pitch = Math.max(this.pitchMin, Math.min(this.pitchMax, this.pitch));
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // CAD-440: Virtual joystick for mobile touch devices
    this._setupVirtualJoystick(canvas);
  }

  // CAD-440: Virtual joystick for mobile
  _setupVirtualJoystick(canvas) {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isTouchDevice) return;

    // Create joystick container CSS
    const style = document.createElement('style');
    style.textContent = `
      .vjoystick-zone { position:fixed; bottom:0; width:50%; height:45%;
        z-index:9000; touch-action:none; pointer-events:auto; }
      .vjoystick-zone.left { left:0; }
      .vjoystick-zone.right { right:0; }
      .vjoystick-base { position:absolute; width:120px; height:120px;
        border-radius:50%; background:rgba(255,255,255,0.12);
        border:2px solid rgba(255,255,255,0.25); display:none;
        pointer-events:none; transform:translate(-50%,-50%); }
      .vjoystick-knob { position:absolute; width:50px; height:50px;
        border-radius:50%; background:rgba(255,255,255,0.35);
        pointer-events:none; transform:translate(-50%,-50%);
        left:50%; top:50%; }
      #vjoystick-interact { position:fixed; bottom:20px; right:20px;
        width:64px; height:64px; border-radius:50%;
        background:rgba(255,200,100,0.25); border:2px solid rgba(255,200,100,0.5);
        color:rgba(255,255,255,0.8); font-size:14px; font-weight:bold;
        display:flex; align-items:center; justify-content:center;
        z-index:9001; touch-action:none; font-family:sans-serif; }
    `;
    document.head.appendChild(style);

    // Left zone (movement joystick)
    const leftZone = document.createElement('div');
    leftZone.className = 'vjoystick-zone left';
    const leftBase = document.createElement('div');
    leftBase.className = 'vjoystick-base';
    const leftKnob = document.createElement('div');
    leftKnob.className = 'vjoystick-knob';
    leftBase.appendChild(leftKnob);
    leftZone.appendChild(leftBase);
    document.body.appendChild(leftZone);

    // Right zone (camera joystick)
    const rightZone = document.createElement('div');
    rightZone.className = 'vjoystick-zone right';
    const rightBase = document.createElement('div');
    rightBase.className = 'vjoystick-base';
    const rightKnob = document.createElement('div');
    rightKnob.className = 'vjoystick-knob';
    rightBase.appendChild(rightKnob);
    rightZone.appendChild(rightBase);
    document.body.appendChild(rightZone);

    // Interact button
    const interactBtn = document.createElement('div');
    interactBtn.id = 'vjoystick-interact';
    interactBtn.textContent = 'E';
    document.body.appendChild(interactBtn);

    // Joystick state
    this._vjMove = { active: false, id: null, cx: 0, cy: 0 };
    this._vjCam = { active: false, id: null, cx: 0, cy: 0 };
    const RADIUS = 50;

    const startJoystick = (vj, base, knob, touch) => {
      vj.active = true;
      vj.id = touch.identifier;
      vj.cx = touch.clientX;
      vj.cy = touch.clientY;
      base.style.display = 'block';
      base.style.left = touch.clientX + 'px';
      base.style.top = touch.clientY + 'px';
      knob.style.left = '50%';
      knob.style.top = '50%';
    };

    const moveJoystick = (vj, knob, touch) => {
      const dx = touch.clientX - vj.cx;
      const dy = touch.clientY - vj.cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const clampDist = Math.min(dist, RADIUS);
      const angle = Math.atan2(dy, dx);
      const nx = Math.cos(angle) * clampDist;
      const ny = Math.sin(angle) * clampDist;
      knob.style.left = `calc(50% + ${nx}px)`;
      knob.style.top = `calc(50% + ${ny}px)`;
      return { x: nx / RADIUS, y: ny / RADIUS };
    };

    const endJoystick = (vj, base, knob) => {
      vj.active = false;
      vj.id = null;
      base.style.display = 'none';
      knob.style.left = '50%';
      knob.style.top = '50%';
    };

    // Left zone — movement
    leftZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!this._vjMove.active) startJoystick(this._vjMove, leftBase, leftKnob, t);
      }
    }, { passive: false });

    leftZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjMove.id) {
          const n = moveJoystick(this._vjMove, leftKnob, t);
          // Map joystick to movement keys
          this.keys.forward  = n.y < -0.3;
          this.keys.backward = n.y > 0.3;
          this.keys.left     = n.x < -0.3;
          this.keys.right    = n.x > 0.3;
          this.keys.sprint   = Math.abs(n.x) > 0.85 || Math.abs(n.y) > 0.85;
        }
      }
    }, { passive: false });

    leftZone.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjMove.id) {
          endJoystick(this._vjMove, leftBase, leftKnob);
          this.keys.forward = this.keys.backward = this.keys.left = this.keys.right = this.keys.sprint = false;
        }
      }
    });
    leftZone.addEventListener('touchcancel', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjMove.id) {
          endJoystick(this._vjMove, leftBase, leftKnob);
          this.keys.forward = this.keys.backward = this.keys.left = this.keys.right = this.keys.sprint = false;
        }
      }
    });

    // Right zone — camera
    rightZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (!this._vjCam.active) startJoystick(this._vjCam, rightBase, rightKnob, t);
      }
    }, { passive: false });

    rightZone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjCam.id) {
          const n = moveJoystick(this._vjCam, rightKnob, t);
          this.yaw -= n.x * 0.04;
          this.pitch += n.y * 0.02;
          this.pitch = Math.max(this.pitchMin, Math.min(this.pitchMax, this.pitch));
        }
      }
    }, { passive: false });

    rightZone.addEventListener('touchend', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjCam.id) endJoystick(this._vjCam, rightBase, rightKnob);
      }
    });
    rightZone.addEventListener('touchcancel', (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === this._vjCam.id) endJoystick(this._vjCam, rightBase, rightKnob);
      }
    });

    // Interact button — dispatches 'E' keydown
    interactBtn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyE', key: 'e', bubbles: true }));
    }, { passive: false });
    interactBtn.addEventListener('touchend', (e) => {
      e.preventDefault();
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyE', key: 'e', bubbles: true }));
    }, { passive: false });
  }

  _onKey(e, pressed) {
    switch (e.code) {
      case 'KeyW': case 'ArrowUp':    this.keys.forward  = pressed; break;
      case 'KeyS': case 'ArrowDown':  this.keys.backward = pressed; break;
      case 'KeyA': case 'ArrowLeft':  this.keys.left     = pressed; break;
      case 'KeyD': case 'ArrowRight': this.keys.right    = pressed; break;
      case 'ShiftLeft': case 'ShiftRight': this.keys.sprint = pressed; break;
      case 'Space':
        if (this.miniGame && this.miniGame.active) { e.preventDefault(); break; }
        if (pressed && this.isOnGround) {
          this.velocityY    = this.JUMP_IMPULSE;
          this.isOnGround   = false;
          this.jumpHeld     = true;
          this.jumpHoldTime = 0;
        }
        if (!pressed) this.jumpHeld = false;
        e.preventDefault();
        break;
    }
  }

  update(delta) {
    // If a mini-game overlay is open, freeze player movement
    if (this.miniGame && this.miniGame.active) {
      // Still update camera so the world stays visible behind the overlay
      if (!this.indoorCamera) {
        const camGroundY = getHeight(this.player.position.x, this.player.position.z);
        const camX = this.player.position.x + Math.sin(this.yaw) * this.cameraDistance * Math.cos(this.pitch);
        const camZ = this.player.position.z + Math.cos(this.yaw) * this.cameraDistance * Math.cos(this.pitch);
        const camY = camGroundY + this.cameraHeight + this.cameraDistance * Math.sin(this.pitch);
        this.camera.position.set(camX, camY, camZ);
        this.camera.lookAt(this.player.position.x, camGroundY + 1.2, this.player.position.z);
      }
      return;
    }

    // Get camera forward direction projected onto XZ plane
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    // Right is perpendicular to forward
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Build movement vector from input
    this._moveDir.set(0, 0, 0);
    if (this.keys.forward)  this._moveDir.add(forward);
    if (this.keys.backward) this._moveDir.sub(forward);
    if (this.keys.left)     this._moveDir.sub(right);
    if (this.keys.right)    this._moveDir.add(right);

    this.isMoving = this._moveDir.lengthSq() > 0;

    if (this.isMoving) {
      this._moveDir.normalize();
      const speed = this.keys.sprint ? this.runSpeed : this.moveSpeed;
      this.player.position.addScaledVector(this._moveDir, speed * delta);
      // Face movement direction
      this.player.rotation.y = Math.atan2(this._moveDir.x, this._moveDir.z);
    }

    // --- Jump & gravity ---
    this.velocityY += this.GRAVITY * delta;

    // Variable jump: while Space held + still rising, partially counteract gravity
    if (this.jumpHeld && this.velocityY > 0) {
      this.jumpHoldTime += delta;
      if (this.jumpHoldTime < this.JUMP_HOLD_MAX) {
        this.velocityY += this.JUMP_HOLD_BOOST * delta;
      } else {
        this.jumpHeld = false; // boost window expired
      }
    }

    this.player.position.y += this.velocityY * delta;

    // Ground check — terrain is the floor
    const groundY = getHeight(this.player.position.x, this.player.position.z);
    if (this.player.position.y <= groundY) {
      this.player.position.y = groundY;
      this.velocityY = 0;
      this.isOnGround = true;
    } else {
      this.isOnGround = false;
    }

    // Clamp to island bounds
    const b = ISLAND_BOUNDS;
    this.player.position.x = Math.max(b.minX, Math.min(b.maxX, this.player.position.x));
    this.player.position.z = Math.max(b.minZ, Math.min(b.maxZ, this.player.position.z));

    // --- Building collision ---
    for (const col of this.colliders) {
      const [nx, nz] = resolveOBB(this.player.position.x, this.player.position.z, col);
      this.player.position.x = nx;
      this.player.position.z = nz;
    }

    // --- Camera bob ---
    if (this.isMoving) {
      this.bobTime += delta * this.bobSpeed * (this.keys.sprint ? 1.5 : 1);
    } else {
      this.bobTime += delta * 2;
    }
    const bobOffset = this.isMoving ? Math.sin(this.bobTime) * this.bobAmount : 0;

    // Third-person camera: completely ignores jump — stays fixed at ground level
    // and doesn't rotate to track the player in the air
    // Skip camera update when the overhead indoor camera is active
    if (!this.indoorCamera) {
      const camGroundY = getHeight(this.player.position.x, this.player.position.z);
      const camX = this.player.position.x + Math.sin(this.yaw) * this.cameraDistance * Math.cos(this.pitch);
      const camZ = this.player.position.z + Math.cos(this.yaw) * this.cameraDistance * Math.cos(this.pitch);
      const camY = camGroundY + this.cameraHeight + this.cameraDistance * Math.sin(this.pitch) + bobOffset;

      this.camera.position.set(camX, camY, camZ);

      // Always look at ground-level player position — never follows jump height
      this.camera.lookAt(
        this.player.position.x,
        camGroundY + 1.2,
        this.player.position.z
      );
    }
  }
}
