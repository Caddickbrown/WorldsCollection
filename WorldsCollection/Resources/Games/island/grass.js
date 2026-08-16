/**
 * grass.js — Stylized grass field for Island, adapted from
 * github.com/cortiz2894/stylized-components (MIT licence).
 *
 * Ported from TypeScript/React-Three-Fiber to vanilla Three.js r158.
 * All GLSL is verbatim from the original; only the JS wrapper changed.
 *
 * Exports:
 *   createGrassField(terrainMesh, scene, opts)  → { mesh, update(time, sunLight) }
 */

import * as THREE from 'three';

// ─── Constants ───────────────────────────────────────────────────────────────

const MAX_ROCKS       = 24;
const MAX_SHADOW_TAPS = 4;

// ─── GLSL blocks (verbatim from stylized-components) ─────────────────────────

const GROUND_MASK_UNIFORMS = /* glsl */`
  uniform vec3  uDirtColor;
  uniform float uDirtScale;
  uniform float uDirtCoverage;
  uniform float uDirtSoftness;
  uniform float uDirtWarp;
`;

const GROUND_MASK_GLSL = /* glsl */`
  float _gmHash(vec2 p) {
    p = fract(p * vec2(127.1, 311.7));
    p += dot(p, p + 19.19);
    return fract(p.x * p.y);
  }
  float _gmNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(_gmHash(i), _gmHash(i+vec2(1,0)),u.x),
               mix(_gmHash(i+vec2(0,1)), _gmHash(i+vec2(1,1)),u.x), u.y);
  }
  float _gmFbm(vec2 p) {
    float v=0.,a=.5,n=0.; for(int i=0;i<4;i++){v+=a*_gmNoise(p);n+=a;p=p*2.03+vec2(3.1,7.7);a*=.5;}
    return v/max(n,.001);
  }
  float groundDirt(vec2 worldXZ) {
    vec2 p = worldXZ * uDirtScale;
    if (uDirtWarp > 0.001) {
      vec2 w = vec2(_gmFbm(p+vec2(11.3,2.7)), _gmFbm(p+vec2(5.9,17.1)));
      p += (w - 0.5) * uDirtWarp;
    }
    float n = _gmFbm(p);
    float threshold = 1.0 - uDirtCoverage;
    return smoothstep(threshold - uDirtSoftness, threshold + uDirtSoftness, n);
  }
`;

const GRASS_BLADE_UNIFORMS = /* glsl */`
  uniform float uTime;
  uniform float uWindStrength;
  uniform float uWindSpeed;
  uniform float uWindFreq;
  uniform float uWindTurb;
  uniform float uWindLean;
  uniform vec2  uWindDir;
  varying float vBH;
  varying vec3  vWorldPos;
  varying vec3  vBladeN;
  varying float vDirt;
  varying float vPatch;
  uniform float uPatchScale;
  varying float vRockInfl;
  uniform float uWindFixLocal;
  uniform float uDirtCut;
  uniform float uShadowSampleY;
  uniform float uShadowRadius;
  uniform vec4  uRocks[ ${MAX_ROCKS} ];
  uniform int   uRockCount;
  uniform float uRockRadiusMul;
  uniform float uRockFalloff;
  uniform float uRockFlatten;
  uniform float uRockBend;
`;

const GRASS_BLADE_VERTEX = /* glsl */`
  #include <begin_vertex>
  vec2 baseXZ = (modelMatrix * instanceMatrix * vec4(0.,0.,0.,1.)).xz;
  vDirt  = groundDirt(baseXZ);
  vPatch = _gmFbm(baseXZ * uPatchScale);

  float rockInfl = 0.; vec2 rockAway = vec2(1.,0.);
  for (int i=0;i<${MAX_ROCKS};i++){
    if(i>=uRockCount) break;
    vec4 rock=uRocks[i]; vec2 d=baseXZ-rock.xz;
    float dist=length(d); float rad=rock.w*uRockRadiusMul;
    float infl=1.-smoothstep(rad,rad+uRockFalloff,dist);
    if(infl>rockInfl){rockInfl=infl; rockAway=dist>1e-4?d/dist:vec2(1.,0.);}
  }
  vRockInfl = rockInfl;

  float shrink = (1.-uDirtCut*vDirt)*(1.-uRockFlatten*rockInfl);
  transformed.y *= shrink;
  vBH = position.y * shrink;
  float hMask = vBH*vBH;

  vec3 wPos    = (instanceMatrix*vec4(position,1.)).xyz;
  vWorldPos    = (modelMatrix*instanceMatrix*vec4(position,1.)).xyz;

  float primary = sin(dot(wPos.xz,uWindDir)*uWindFreq + uTime*uWindSpeed);
  float second  = sin(dot(wPos.xz,uWindDir)*uWindFreq*2.6+uTime*uWindSpeed*1.8+1.3)*0.35;
  vec2  perp    = vec2(-uWindDir.y,uWindDir.x);
  float turb    = sin(dot(wPos.xz,perp)*uWindFreq*1.9+uTime*uWindSpeed*0.7+2.6)*uWindTurb;
  float swing   = (primary+second+turb)*uWindStrength*hMask;
  float lean    = uWindLean*hMask;

  mat3 instRot = mat3(normalize(vec3(instanceMatrix[0])),
                      normalize(vec3(instanceMatrix[1])),
                      normalize(vec3(instanceMatrix[2])));
  vec3 windWrong = vec3(uWindDir.x,0.,uWindDir.y);
  vec3 windRight = transpose(instRot)*windWrong;
  vec3 windLocal = mix(windWrong,windRight,uWindFixLocal);
  transformed += windLocal*(swing+lean);

  if(rockInfl>0.001){
    vec3 awayLocal=transpose(instRot)*vec3(rockAway.x,0.,rockAway.y);
    transformed += awayLocal*(uRockBend*rockInfl*hMask);
  }
  vBladeN = normalize(mat3(modelMatrix)*instRot*normal);
`;

const GRASS_SHADOW_VERTEX = /* glsl */`
  #if defined(USE_ENVMAP)||defined(DISTANCE)||defined(USE_SHADOWMAP)
    vec4 worldPosition = vec4(1e6,1e6,1e6,1.);
  #endif
  #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0
    vec3 _shBase=(modelMatrix*instanceMatrix*vec4(0.,0.,0.,1.)).xyz;
    vec3 _shTip =(modelMatrix*instanceMatrix*vec4(0.,1.,0.,1.)).xyz;
    vec3 _shCenter=mix(_shBase,_shTip,uShadowSampleY);
    float _rot=fract(sin(dot(_shBase.xz,vec2(12.9898,78.233)))*43758.5453)*6.2831853;
    for(int _k=0;_k<${MAX_SHADOW_TAPS};_k++){
      float _a=_rot+6.2831853*(float(_k)+0.5)/float(${MAX_SHADOW_TAPS});
      vec2 _off=vec2(cos(_a),sin(_a))*uShadowRadius;
      vGrassShCoord[_k]=directionalShadowMatrix[0]*vec4(_shCenter+vec3(_off.x,0.,_off.y),1.);
    }
  #endif
`;

const DEBUG_FRAGMENT_UNIFORMS = /* glsl */`
  varying float vRockInfl;
  uniform int   uDebugChannel;
`;

const DEBUG_VIEW_FRAGMENT = /* glsl */`
  if(uDebugChannel==1) gl_FragColor.rgb=vec3(vBH);
  else if(uDebugChannel==2) gl_FragColor.rgb=vec3(vDirt);
  else if(uDebugChannel==3) gl_FragColor.rgb=vec3(vRockInfl);
`;

// ─── Blade geometry ───────────────────────────────────────────────────────────

function bladeHalfWidth(t) { return 0.5 * Math.pow(1 - t, 1.2); }

function makeBladeGeometry(segments = 3) {
  const seg = Math.max(1, Math.round(segments));
  const positions = new Float32Array((seg * 2 + 1) * 3);
  for (let i = 0; i < seg; i++) {
    const t = i / seg, w = bladeHalfWidth(t);
    positions[i*6+0] = -w; positions[i*6+1] = t;
    positions[i*6+3] =  w; positions[i*6+4] = t;
  }
  positions[seg*6+1] = 1;
  const indices = [];
  for (let i = 0; i < seg-1; i++) {
    const l=i*2; indices.push(l,l+2,l+1, l+1,l+2,l+3);
  }
  const lastL=(seg-1)*2; indices.push(lastL,seg*2,lastL+1);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

// ─── Blade material (onBeforeCompile into MeshLambertMaterial) ────────────────

function makeBladeMaterial(u) {
  const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u);

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
      #define MAX_ROCKS ${MAX_ROCKS}
      #define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
      ${GROUND_MASK_UNIFORMS}
      ${GROUND_MASK_GLSL}
      ${GRASS_BLADE_UNIFORMS}`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>', GRASS_BLADE_VERTEX
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <worldpos_vertex>', GRASS_SHADOW_VERTEX
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <defaultnormal_vertex>',
      `#include <defaultnormal_vertex>
      transformedNormal = normalize(mat3(viewMatrix)*vec3(0.,1.,0.));`
    );

    shader.fragmentShader =
      `#define GRASS_SHADOW_TAPS ${MAX_SHADOW_TAPS}
      varying float vBH;
      varying vec3  vWorldPos;
      varying vec3  vBladeN;
      varying float vDirt;
      varying float vPatch;
      ${DEBUG_FRAGMENT_UNIFORMS}
      uniform vec3  uGrassBottom;
      uniform vec3  uGrassTop;
      uniform float uBrightness;
      uniform float uGradStart;
      uniform float uGradEnd;
      uniform float uGradPower;
      uniform vec3  uDirtColor;
      uniform float uDirtBlend;
      uniform vec3  uPatchLush;
      uniform vec3  uPatchDry;
      uniform float uPatchStrength;
      uniform float uPatchBias;
      uniform int   uShadowSamples;
      uniform float uShadowStrength;
      uniform vec3  uSunDir;
      uniform vec3  uSunColor;
      uniform vec3  uTransColor;
      uniform float uTransStrength;
      uniform float uTransPower;
      uniform float uTransTip;
      uniform float uTransShadow;
      #ifdef USE_SHADOWMAP
        varying vec4 vGrassShCoord[GRASS_SHADOW_TAPS];
      #endif\n` + shader.fragmentShader;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <normal_fragment_begin>',
      `#include <normal_fragment_begin>
      normal = normalize(mat3(viewMatrix)*vec3(0.,1.,0.));`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      'vec4 diffuseColor = vec4( diffuse, opacity );',
      `float _gT = clamp((vBH-uGradStart)/max(uGradEnd-uGradStart,0.001),0.,1.);
      _gT = pow(_gT,uGradPower);
      vec3 _bladeCol = mix(uGrassBottom,uGrassTop,_gT);
      float _pt = pow(clamp(vPatch,0.,1.),uPatchBias);
      _bladeCol = mix(_bladeCol,mix(uPatchLush,uPatchDry,_pt),uPatchStrength);
      _bladeCol = mix(_bladeCol,uDirtColor,vDirt*uDirtBlend);
      vec4 diffuseColor = vec4(_bladeCol*uBrightness,opacity);`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
      {
        float _shadow=1.;
        #if defined(USE_SHADOWMAP)&&NUM_DIR_LIGHT_SHADOWS>0
          DirectionalLightShadow _dls=directionalLightShadows[0];
          float _sSum=0.; int _sN=0;
          for(int _k=0;_k<GRASS_SHADOW_TAPS;_k++){
            if(_k>=uShadowSamples) break;
            _sSum+=getShadow(directionalShadowMap[0],_dls.shadowMapSize,
              _dls.shadowIntensity,_dls.shadowBias,_dls.shadowRadius,vGrassShCoord[_k]);
            _sN++;
          }
          _shadow=_sSum/float(max(_sN,1));
        #endif
        gl_FragColor.rgb*=(1.-uShadowStrength*(1.-_shadow));
        vec3 _L=normalize(uSunDir); vec3 _V=normalize(cameraPosition-vWorldPos);
        float _back=pow(max(dot(_V,-_L),0.),uTransPower);
        float _thin=mix(1.,vBH,uTransTip);
        float _edge=1.-abs(dot(normalize(vBladeN),_L));
        float _sh=mix(1.,_shadow,uTransShadow);
        gl_FragColor.rgb+=uTransColor*uSunColor*uTransStrength*_back*_thin*_edge*_sh;
        ${DEBUG_VIEW_FRAGMENT}
      }`
    );
  };
  return mat;
}

// ─── Seeded RNG ───────────────────────────────────────────────────────────────

function seededLcg(seed) {
  let s = (seed * 1664525 + 1013904223) >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 0xffffffff; };
}

// ─── Surface sampler ─────────────────────────────────────────────────────────

function buildSurfaceSampler(mesh) {
  const pos = mesh.geometry.attributes.position;
  const idx = mesh.geometry.index;
  const mw  = mesh.matrixWorld;
  const verts = [], cumArea = [];
  let totalArea = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const ab = new THREE.Vector3(), ac = new THREE.Vector3(), n = new THREE.Vector3();
  const triCount = idx ? idx.count / 3 : pos.count / 3;
  for (let f = 0; f < triCount; f++) {
    const i0 = idx ? idx.getX(f*3)   : f*3;
    const i1 = idx ? idx.getX(f*3+1) : f*3+1;
    const i2 = idx ? idx.getX(f*3+2) : f*3+2;
    a.fromBufferAttribute(pos,i0).applyMatrix4(mw);
    b.fromBufferAttribute(pos,i1).applyMatrix4(mw);
    c.fromBufferAttribute(pos,i2).applyMatrix4(mw);
    ab.subVectors(b,a); ac.subVectors(c,a); n.crossVectors(ab,ac);
    const dbl = n.length();
    if (dbl < 1e-8) continue;
    totalArea += dbl * 0.5;
    cumArea.push(totalArea);
    verts.push(a.x,a.y,a.z, b.x,b.y,b.z, c.x,c.y,c.z);
  }
  return { verts, cumArea, totalArea };
}

function samplePoint(s, rng, out) {
  const r = rng() * s.totalArea;
  let lo = 0, hi = s.cumArea.length - 1;
  while (lo < hi) { const mid = (lo+hi)>>1; if (s.cumArea[mid]<r) lo=mid+1; else hi=mid; }
  const t = lo * 9;
  let u = rng(), v = rng();
  if (u+v>1) { u=1-u; v=1-v; }
  const w = 1-u-v;
  return out.set(
    s.verts[t]*w + s.verts[t+3]*u + s.verts[t+6]*v,
    s.verts[t+1]*w + s.verts[t+4]*u + s.verts[t+7]*v,
    s.verts[t+2]*w + s.verts[t+5]*u + s.verts[t+8]*v,
  );
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * createGrassField(terrainMesh, scene, opts)
 *
 * @param {THREE.Mesh}  terrainMesh   Island terrain mesh — blades scatter on its faces
 * @param {THREE.Scene} scene
 * @param {object}      opts
 * @param {number}      [opts.density=0.8]       blades per m²
 * @param {number}      [opts.maxCount=120000]   hard cap
 * @param {number}      [opts.minWidth=0.04]
 * @param {number}      [opts.maxWidth=0.09]
 * @param {number}      [opts.minLength=0.18]
 * @param {number}      [opts.maxLength=0.38]
 * @param {number}      [opts.tiltMax=0.25]      max random lean (radians)
 * @param {number}      [opts.segments=3]        bend segments per blade
 *
 * @returns {{ mesh, update(time, sunLight) }}
 */
export function createGrassField(terrainMesh, scene, opts = {}) {
  const {
    density   = 0.8,
    maxCount  = 120000,
    minWidth  = 0.04,
    maxWidth  = 0.09,
    minLength = 0.18,
    maxLength = 0.38,
    tiltMax   = 0.25,
    segments  = 3,
  } = opts;

  // Shared uniforms — mutated in update() each frame
  const u = {
    uTime:          { value: 0 },
    uWindStrength:  { value: 0.28 },
    uWindSpeed:     { value: 1.1 },
    uWindFreq:      { value: 0.38 },
    uWindTurb:      { value: 0.28 },
    uWindLean:      { value: 0.45 },
    uWindDir:       { value: new THREE.Vector2(1, 0.3).normalize() },
    uWindFixLocal:  { value: 1 },

    uGrassBottom:   { value: new THREE.Color(0x3a6612) },  // Island's dark grass
    uGrassTop:      { value: new THREE.Color(0x5a9a1e) },  // lighter tip
    uBrightness:    { value: 0.88 },
    uGradStart:     { value: 0.12 },
    uGradEnd:       { value: 1.0 },
    uGradPower:     { value: 1.5 },

    uPatchLush:     { value: new THREE.Color(0x4a8016) },
    uPatchDry:      { value: new THREE.Color(0x9aab52) },
    uPatchStrength: { value: 0.30 },
    uPatchScale:    { value: 0.12 },
    uPatchBias:     { value: 1.8 },

    uShadowStrength: { value: 0.55 },
    uShadowSamples:  { value: 4 },
    uShadowSampleY:  { value: 0.4 },
    uShadowRadius:   { value: 0.28 },

    // Dirt patches — path edges, town square
    uDirtColor:     { value: new THREE.Color(0x8b6f47) },
    uDirtScale:     { value: 0.35 },
    uDirtCoverage:  { value: 0.12 },
    uDirtSoftness:  { value: 0.07 },
    uDirtWarp:      { value: 0.22 },
    uDirtCut:       { value: 0.95 },
    uDirtBlend:     { value: 0.75 },

    // Rock trampling (Island's boulders, cliff faces)
    uRocks:         { value: Array.from({ length: MAX_ROCKS }, () => new THREE.Vector4()) },
    uRockCount:     { value: 0 },
    uRockRadiusMul: { value: 1.0 },
    uRockFalloff:   { value: 0.4 },
    uRockFlatten:   { value: 0.80 },
    uRockBend:      { value: 0.22 },

    uSunDir:        { value: new THREE.Vector3(0.6, 0.8, 0.4) },
    uSunColor:      { value: new THREE.Color(1, 0.97, 0.88) },
    uTransColor:    { value: new THREE.Color(0xb8e04a) },
    uTransStrength: { value: 0.75 },
    uTransPower:    { value: 3.0 },
    uTransTip:      { value: 0.55 },
    uTransShadow:   { value: 1.0 },

    uDebugChannel:  { value: 0 },
  };

  // Scatter blades across the terrain surface
  const sampler = buildSurfaceSampler(terrainMesh);
  const count = sampler.cumArea.length === 0
    ? 0
    : Math.min(Math.max(1, Math.round(density * sampler.totalArea)), maxCount);

  const mat = makeBladeMaterial(u);
  mat.transparent = false;
  mat.depthWrite  = true;

  const mesh = new THREE.InstancedMesh(makeBladeGeometry(segments), mat, count);
  mesh.castShadow    = false;
  mesh.receiveShadow = true;
  mesh.frustumCulled = false;

  const rng   = seededLcg(Math.abs(Math.round(sampler.totalArea * 131)) || 1);
  const dummy = new THREE.Object3D();
  const p     = new THREE.Vector3();

  for (let i = 0; i < count; i++) {
    if (sampler.cumArea.length === 0) { dummy.scale.setScalar(0); }
    else {
      samplePoint(sampler, rng, p);
      // Skip water (below y = -0.3)
      if (p.y < -0.3) { dummy.scale.setScalar(0); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix); continue; }
      dummy.position.copy(p);
      dummy.rotation.set(
        (rng()-0.5)*2*tiltMax,
        rng()*Math.PI*2,
        (rng()-0.5)*tiltMax*0.5
      );
      dummy.scale.set(
        minWidth  + rng()*(maxWidth-minWidth),
        minLength + rng()*(maxLength-minLength),
        1
      );
    }
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  scene.add(mesh);

  console.log(`[grass] ${count.toLocaleString()} blades scattered over ${sampler.totalArea.toFixed(0)}m²`);

  return {
    mesh,
    /**
     * Call every frame from the render loop.
     * @param {number}             time      elapsed seconds
     * @param {THREE.DirectionalLight} sunLight  the scene's sun
     */
    update(time, sunLight) {
      u.uTime.value = time;
      if (sunLight) {
        u.uSunDir.value.copy(sunLight.position).normalize();
        u.uSunColor.value.copy(sunLight.color).multiplyScalar(sunLight.intensity * 0.5);
      }
    },
  };
}
