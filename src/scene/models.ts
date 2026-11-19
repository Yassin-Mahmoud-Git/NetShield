import * as THREE from 'three';
import { NETWORK_NODES, NodeId, OSI_LAYERS } from '../data/curriculum';
import {
  createMonitorScreenTexture,
  createOsiLayerTexture,
  createServerBladeTexture,
  createSwitchFaceplateTexture,
} from './textures';

export interface BuiltNodeModel {
  id: NodeId;
  group: THREE.Group;
  hitbox: THREE.Mesh;
  animatedParts: {
    rings?: THREE.Object3D[];
    beacon?: THREE.Mesh;
    shieldWall?: THREE.Group;
    zeroTrustRing?: THREE.Group;
    interceptBeam?: THREE.Mesh;
    radarDishes?: THREE.Object3D[];
  };
}

export interface BuiltOsiStack {
  root: THREE.Group;
  layers: {
    layerNumber: number;
    group: THREE.Group;
    hitbox: THREE.Mesh;
    baseY: number;
    material: THREE.MeshStandardMaterial;
  }[];
  packetCore: THREE.Mesh;
}

function addContactShadow(parent: THREE.Group, shadowTex: THREE.Texture, radius: number) {
  const geo = new THREE.PlaneGeometry(radius * 2, radius * 2);
  const mat = new THREE.MeshBasicMaterial({
    map: shadowTex,
    transparent: true,
    opacity: 0.6,
    depthWrite: false,
  });
  const shadow = new THREE.Mesh(geo, mat);
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.015;
  parent.add(shadow);
}

function createHitbox(
  width: number,
  height: number,
  depth: number,
  userData: Record<string, unknown>
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(width, height, depth);
  const mat = new THREE.MeshBasicMaterial({ visible: false });
  const box = new THREE.Mesh(geo, mat);
  box.position.y = height / 2;
  box.layers.set(1);
  box.userData = userData;
  return box;
}

function createBeveledRectShape(w: number, h: number, r: number): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

export function buildInfrastructureModels(
  isSoftwareGl: boolean,
  anisotropy: number,
  shadowTex: THREE.Texture
): Record<NodeId, BuiltNodeModel> {
  // Shared calibrated PBR materials (varied roughness >= 0.25 delta)
  const darkAnodized = new THREE.MeshStandardMaterial({
    color: 0x162033,
    roughness: 0.68,
    metalness: 0.35,
  });
  const matteSlate = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.82,
    metalness: 0.15,
  });
  const brushedAluminum = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    roughness: 0.22,
    metalness: 0.88,
  });
  const copperTrim = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.28,
    metalness: 0.85,
  });
  const cyanEmissive = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0ea5e9,
    emissiveIntensity: 1.35,
    roughness: 0.25,
    metalness: 0.2,
  });
  const emeraldEmissive = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.25,
    roughness: 0.25,
    metalness: 0.2,
  });
  const crimsonEmissive = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    emissive: 0xe11d48,
    emissiveIntensity: 1.4,
    roughness: 0.3,
    metalness: 0.2,
  });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0x7dd3fc,
    roughness: 0.08,
    metalness: 0.05,
    transmission: isSoftwareGl ? 0 : 0.72,
    transparent: true,
    opacity: isSoftwareGl ? 0.32 : 0.88,
    ior: 1.5,
    thickness: 0.4,
    clearcoat: 1.0,
    depthWrite: false,
  });

  const result = {} as Record<NodeId, BuiltNodeModel>;

  // 1. CLIENT WORKSTATION
  {
    const info = NETWORK_NODES.client;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.5);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.18, 2.2), matteSlate);
    plinth.position.y = 0.09;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    g.add(plinth);

    const deskRim = new THREE.Mesh(new THREE.BoxGeometry(3.3, 0.05, 2.3), brushedAluminum);
    deskRim.position.y = 0.19;
    g.add(deskRim);

    // Monitor stand + neck
    const standBase = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.48, 0.08, 24), brushedAluminum);
    standBase.position.set(0, 0.24, -0.35);
    g.add(standBase);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.95, 0.12), darkAnodized);
    neck.position.set(0, 0.72, -0.45);
    neck.rotation.x = -0.1;
    g.add(neck);

    // Ultrawide display bezel
    const bezelShape = createBeveledRectShape(2.4, 1.35, 0.08);
    const bezelGeo = new THREE.ExtrudeGeometry(bezelShape, {
      depth: 0.08,
      bevelEnabled: true,
      bevelThickness: 0.02,
      bevelSize: 0.02,
      bevelSegments: 2,
    });
    bezelGeo.center();
    const bezel = new THREE.Mesh(bezelGeo, darkAnodized);
    bezel.position.set(0, 1.48, -0.32);
    bezel.castShadow = true;
    g.add(bezel);

    const screenTex = createMonitorScreenTexture(anisotropy);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.22, 1.18),
      new THREE.MeshBasicMaterial({ map: screenTex })
    );
    screen.position.set(0, 1.48, -0.255);
    g.add(screen);

    // Compact tower chassis
    const tower = new THREE.Mesh(new THREE.BoxGeometry(0.62, 1.18, 1.25), darkAnodized);
    tower.position.set(1.1, 0.78, 0.15);
    tower.castShadow = true;
    g.add(tower);

    const towerStrip = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.88, 0.04), cyanEmissive);
    towerStrip.position.set(0.79, 0.78, 0.78);
    g.add(towerStrip);

    // Keyboard deck
    const keyboard = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.06, 0.48), brushedAluminum);
    keyboard.position.set(-0.25, 0.25, 0.48);
    keyboard.rotation.x = 0.06;
    g.add(keyboard);

    const hitbox = createHitbox(3.5, 2.5, 2.6, { nodeId: 'client' });
    g.add(hitbox);

    result.client = { id: 'client', group: g, hitbox, animatedParts: {} };
  }

  // 2. RECURSIVE DNS RESOLVER TOWER
  {
    const info = NETWORK_NODES.dns;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.2);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.32, 0.34, 6), matteSlate);
    base.position.y = 0.17;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    const coreColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.52, 2.2, 6), darkAnodized);
    coreColumn.position.y = 1.44;
    coreColumn.castShadow = true;
    g.add(coreColumn);

    const rings: THREE.Object3D[] = [];
    for (let i = 0; i < 3; i++) {
      const ringGroup = new THREE.Group();
      ringGroup.position.y = 0.95 + i * 0.62;
      const torus = new THREE.Mesh(
        new THREE.TorusGeometry(0.88 - i * 0.1, 0.055, 12, 36),
        i === 1 ? cyanEmissive : brushedAluminum
      );
      torus.rotation.x = Math.PI / 2;
      ringGroup.add(torus);

      const glassDisc = new THREE.Mesh(new THREE.CylinderGeometry(0.82 - i * 0.1, 0.82 - i * 0.1, 0.04, 24), glassMat);
      glassDisc.renderOrder = 5;
      ringGroup.add(glassDisc);

      g.add(ringGroup);
      rings.push(ringGroup);
    }

    // Lookup crystal cap
    const beacon = new THREE.Mesh(new THREE.OctahedronGeometry(0.32, 0), cyanEmissive);
    beacon.position.y = 2.95;
    g.add(beacon);

    const hitbox = createHitbox(2.8, 3.4, 2.8, { nodeId: 'dns' });
    g.add(hitbox);

    result.dns = { id: 'dns', group: g, hitbox, animatedParts: { rings, beacon } };
  }

  // 3. EDGE ROUTER & NAT GATEWAY
  {
    const info = NETWORK_NODES.router;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.2);

    const pedestal = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.3, 1.7), matteSlate);
    pedestal.position.y = 0.15;
    pedestal.castShadow = true;
    pedestal.receiveShadow = true;
    g.add(pedestal);

    const chassisShape = createBeveledRectShape(2.1, 1.45, 0.12);
    const chassisGeo = new THREE.ExtrudeGeometry(chassisShape, {
      depth: 0.56,
      bevelEnabled: true,
      bevelThickness: 0.04,
      bevelSize: 0.04,
      bevelSegments: 2,
    });
    chassisGeo.rotateX(Math.PI / 2);
    chassisGeo.center();
    const chassis = new THREE.Mesh(chassisGeo, darkAnodized);
    chassis.position.y = 0.62;
    chassis.castShadow = true;
    g.add(chassis);

    // Copper heat-sink fins
    for (let i = -3; i <= 3; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 1.15), copperTrim);
      fin.position.set(i * 0.22, 1.0, 0);
      g.add(fin);
    }

    // 4 articulated MIMO antennas
    const antennaCoords: [number, number][] = [
      [-0.85, -0.58],
      [0.85, -0.58],
      [-0.85, 0.58],
      [0.85, 0.58],
    ];
    antennaCoords.forEach(([ax, az]) => {
      const joint = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.14, 12), brushedAluminum);
      joint.position.set(ax, 0.96, az);
      g.add(joint);

      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.04, 1.15, 12), darkAnodized);
      mast.position.set(ax, 1.56, az);
      mast.castShadow = true;
      g.add(mast);

      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 12), cyanEmissive);
      tip.position.set(ax, 2.16, az);
      g.add(tip);
    });

    // Hovering routing table ring
    const holoRing = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 10, 32), cyanEmissive);
    holoRing.rotation.x = Math.PI / 2;
    holoRing.position.y = 1.48;
    g.add(holoRing);

    const hitbox = createHitbox(2.6, 2.5, 2.2, { nodeId: 'router' });
    g.add(hitbox);

    result.router = { id: 'router', group: g, hitbox, animatedParts: { rings: [holoRing] } };
  }

  // 4. STATEFUL FIREWALL & IDS/IPS MONOLITH + PROTECTIVE BARRIER
  {
    const info = NETWORK_NODES.firewall;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.8);

    // Armored base plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.35, 3.6), matteSlate);
    plinth.position.y = 0.175;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    g.add(plinth);

    // Twin vertical armored pylons
    [-1.3, 1.3].forEach((pz) => {
      const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.95, 2.75, 0.72), darkAnodized);
      pylon.position.set(0, 1.55, pz);
      pylon.castShadow = true;
      g.add(pylon);

      const cap = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.14, 0.82), brushedAluminum);
      cap.position.set(0, 2.98, pz);
      g.add(cap);

      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.2, 0.08), copperTrim);
      trim.position.set(-0.46, 1.55, pz);
      g.add(trim);
    });

    // Top inspection gantry bridge
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.42, 3.35), darkAnodized);
    bridge.position.set(0, 3.16, 0);
    bridge.castShadow = true;
    g.add(bridge);

    // Central IDS scanner core
    const scannerCore = new THREE.Mesh(new THREE.OctahedronGeometry(0.36, 1), copperTrim);
    scannerCore.position.set(0, 2.7, 0);
    g.add(scannerCore);

    // Animated Protective Firewall Barrier Wall (scales Y from 0.02 to 1 when enabled)
    const shieldWall = new THREE.Group();
    shieldWall.position.set(0, 0.35, 0);

    const wallGlass = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 2.55, 8.8),
      new THREE.MeshPhysicalMaterial({
        color: 0xf59e0b,
        emissive: 0xd97706,
        emissiveIntensity: 0.35,
        roughness: 0.12,
        metalness: 0.1,
        transparent: true,
        opacity: 0.24,
        depthWrite: false,
      })
    );
    wallGlass.position.y = 1.275;
    wallGlass.renderOrder = 6;
    shieldWall.add(wallGlass);

    // Horizontal energy rails on barrier
    for (let r = 0; r < 4; r++) {
      const rail = new THREE.Mesh(
        new THREE.BoxGeometry(0.18, 0.04, 8.8),
        new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.72 })
      );
      rail.position.y = 0.45 + r * 0.62;
      shieldWall.add(rail);
    }

    g.add(shieldWall);

    const hitbox = createHitbox(2.2, 3.6, 4.0, { nodeId: 'firewall' });
    g.add(hitbox);

    result.firewall = {
      id: 'firewall',
      group: g,
      hitbox,
      animatedParts: { shieldWall, beacon: scannerCore },
    };
  }

  // 5. CORE L3 SWITCH & LOAD BALANCER
  {
    const info = NETWORK_NODES.switch;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.3);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.28, 2.0), matteSlate);
    plinth.position.y = 0.14;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    g.add(plinth);

    const body = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.35, 1.7), darkAnodized);
    body.position.y = 0.96;
    body.castShadow = true;
    g.add(body);

    // Front patch-panel CanvasTexture
    const faceplateTex = createSwitchFaceplateTexture(anisotropy);
    const frontFace = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 0.72),
      new THREE.MeshBasicMaterial({ map: faceplateTex })
    );
    frontFace.position.set(0, 1.08, 0.855);
    g.add(frontFace);

    // Brushed rack handles
    [-1.02, 1.02].forEach((hx) => {
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.85, 0.14), brushedAluminum);
      handle.position.set(hx, 1.05, 0.9);
      g.add(handle);
    });

    // Top load-balancer distribution prism
    const balancerRing = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 12, 32), emeraldEmissive);
    balancerRing.rotation.x = Math.PI / 2;
    balancerRing.position.y = 1.92;
    g.add(balancerRing);

    const hitbox = createHitbox(2.7, 2.4, 2.3, { nodeId: 'switch' });
    g.add(hitbox);

    result.switch = { id: 'switch', group: g, hitbox, animatedParts: { rings: [balancerRing] } };
  }

  // 6. DMZ WEB & TLS TERMINATION VAULT
  {
    const info = NETWORK_NODES.webserver;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.5);

    const plinth = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.3, 2.4), matteSlate);
    plinth.position.y = 0.15;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    g.add(plinth);

    const rackFrame = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.1, 1.85), darkAnodized);
    rackFrame.position.y = 1.85;
    rackFrame.castShadow = true;
    g.add(rackFrame);

    // 5 stacked 2U compute blades with procedural faceplates
    const bladeTex = createServerBladeTexture(anisotropy);
    const bladeMat = new THREE.MeshBasicMaterial({ map: bladeTex });
    for (let b = 0; b < 5; b++) {
      const bladeFront = new THREE.Mesh(new THREE.PlaneGeometry(1.68, 0.44), bladeMat);
      bladeFront.position.set(0, 0.8 + b * 0.52, 0.93);
      g.add(bladeFront);
    }

    // Smoked glass front door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.78, 2.9, 0.05), glassMat);
    door.position.set(0, 1.85, 0.96);
    door.renderOrder = 5;
    g.add(door);

    // TLS 1.3 Gimbal Shield Halo at top
    const gimbalOuter = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 12, 40), emeraldEmissive);
    gimbalOuter.position.set(0, 3.85, 0);
    g.add(gimbalOuter);

    const gimbalInner = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.035, 12, 32), cyanEmissive);
    gimbalInner.position.set(0, 3.85, 0);
    gimbalInner.rotation.x = Math.PI / 3;
    g.add(gimbalInner);

    const hitbox = createHitbox(2.6, 4.3, 2.6, { nodeId: 'webserver' });
    g.add(hitbox);

    result.webserver = {
      id: 'webserver',
      group: g,
      hitbox,
      animatedParts: { rings: [gimbalOuter, gimbalInner] },
    };
  }

  // 7. ZERO-TRUST DATABASE CLUSTER
  {
    const info = NETWORK_NODES.database;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.7);

    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.15, 2.35, 0.28, 32), matteSlate);
    base.position.y = 0.14;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    // 3 RAID Vault Silos arranged in triangle
    const siloOffsets: [number, number][] = [
      [0, -0.75],
      [-0.72, 0.55],
      [0.72, 0.55],
    ];
    siloOffsets.forEach(([sx, sz]) => {
      const silo = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.52, 2.35, 24), darkAnodized);
      silo.position.set(sx, 1.45, sz);
      silo.castShadow = true;
      g.add(silo);

      const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.14, 24), brushedAluminum);
      cap.position.set(sx, 2.66, sz);
      g.add(cap);

      const band = new THREE.Mesh(new THREE.TorusGeometry(0.54, 0.03, 10, 28), emeraldEmissive);
      band.rotation.x = Math.PI / 2;
      band.position.set(sx, 1.9, sz);
      g.add(band);
    });

    // Zero-Trust Micro-Segmentation Fence
    const zeroTrustRing = new THREE.Group();
    zeroTrustRing.position.y = 0.3;

    const ztCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(2.38, 2.38, 2.6, 32, 1, true),
      new THREE.MeshBasicMaterial({
        color: 0x2dd4bf,
        transparent: true,
        opacity: 0.16,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    ztCylinder.position.y = 1.3;
    ztCylinder.renderOrder = 6;
    zeroTrustRing.add(ztCylinder);

    const ztTopRim = new THREE.Mesh(new THREE.TorusGeometry(2.38, 0.04, 10, 48), emeraldEmissive);
    ztTopRim.rotation.x = Math.PI / 2;
    ztTopRim.position.y = 2.6;
    zeroTrustRing.add(ztTopRim);

    g.add(zeroTrustRing);

    const hitbox = createHitbox(4.6, 3.2, 4.6, { nodeId: 'database' });
    g.add(hitbox);

    result.database = {
      id: 'database',
      group: g,
      hitbox,
      animatedParts: { zeroTrustRing },
    };
  }

  // 8. EXTERNAL THREAT ACTOR & SNIFFER
  {
    const info = NETWORK_NODES.attacker;
    const g = new THREE.Group();
    g.position.set(...info.position);
    addContactShadow(g, shadowTex, 2.2);

    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.4, 0.28, 5), matteSlate);
    plinth.position.y = 0.14;
    plinth.castShadow = true;
    g.add(plinth);

    const stealthHull = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 1.0, 1.65, 5), darkAnodized);
    stealthHull.position.y = 1.1;
    stealthHull.castShadow = true;
    g.add(stealthHull);

    // Parabolic intercept dish aimed toward Client-Router link
    const dishGroup = new THREE.Group();
    dishGroup.position.set(0, 2.15, 0);
    dishGroup.lookAt(-9.8, 1.0, 3.2);

    const dishPoints = [
      new THREE.Vector2(0.01, 0),
      new THREE.Vector2(0.35, 0.08),
      new THREE.Vector2(0.68, 0.28),
    ];
    const dishGeo = new THREE.LatheGeometry(dishPoints, 24);
    dishGeo.rotateX(Math.PI / 2);
    const dish = new THREE.Mesh(dishGeo, brushedAluminum);
    dishGroup.add(dish);

    const needle = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.5, 12), crimsonEmissive);
    needle.rotation.x = Math.PI / 2;
    needle.position.z = 0.35;
    dishGroup.add(needle);

    g.add(dishGroup);

    // Crimson sniffing laser beam (visible during MitM / PortScan / DDoS)
    const beamGeo = new THREE.CylinderGeometry(0.03, 0.09, 12.2, 12);
    beamGeo.translate(0, 6.1, 0);
    beamGeo.rotateX(Math.PI / 2);
    const interceptBeam = new THREE.Mesh(
      beamGeo,
      new THREE.MeshBasicMaterial({
        color: 0xf43f5e,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      })
    );
    interceptBeam.position.set(0, 2.0, 0);
    interceptBeam.lookAt(-9.8, 0.8, 3.2);
    interceptBeam.visible = false;
    g.add(interceptBeam);

    const hitbox = createHitbox(2.6, 2.9, 2.6, { nodeId: 'attacker' });
    g.add(hitbox);

    result.attacker = {
      id: 'attacker',
      group: g,
      hitbox,
      animatedParts: { radarDishes: [dishGroup], interceptBeam },
    };
  }

  return result;
}

export function buildOsiStackModel(anisotropy: number, shadowTex: THREE.Texture): BuiltOsiStack {
  const root = new THREE.Group();
  root.position.set(0.2, 0, 10.6);
  addContactShadow(root, shadowTex, 3.6);

  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(4.4, 0.26, 4.4),
    new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.8, metalness: 0.2 })
  );
  plinth.position.y = 0.13;
  plinth.receiveShadow = true;
  plinth.castShadow = true;
  root.add(plinth);

  // Corner guide rods
  const rodMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.3, metalness: 0.85 });
  const rodPositions: [number, number][] = [
    [-1.75, -1.75],
    [1.75, -1.75],
    [-1.75, 1.75],
    [1.75, 1.75],
  ];
  rodPositions.forEach(([rx, rz]) => {
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 5.2, 12), rodMat);
    rod.position.set(rx, 2.86, rz);
    root.add(rod);
  });

  // OSI_LAYERS goes L7 -> L1; build bottom-up (L1 at bottom, L7 at top)
  const ordered = [...OSI_LAYERS].sort((a, b) => a.layer - b.layer);
  const layers: BuiltOsiStack['layers'] = [];

  ordered.forEach((layerInfo, idx) => {
    const layerGroup = new THREE.Group();
    const baseY = 0.45 + idx * 0.38;
    layerGroup.position.y = baseY;

    const topTex = createOsiLayerTexture(
      layerInfo.layer,
      layerInfo.name,
      layerInfo.pdu,
      layerInfo.protocols,
      layerInfo.colorHex,
      anisotropy
    );

    const slabMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.4,
      emissive: new THREE.Color(layerInfo.colorHex),
      emissiveIntensity: 0.08,
    });

    const slab = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.22, 3.2), slabMat);
    slab.castShadow = true;
    slab.receiveShadow = true;
    layerGroup.add(slab);

    // Top etched label plate (offset slightly above slab face to avoid z-fighting)
    const labelPlate = new THREE.Mesh(
      new THREE.PlaneGeometry(3.05, 3.05),
      new THREE.MeshBasicMaterial({ map: topTex })
    );
    labelPlate.rotation.x = -Math.PI / 2;
    labelPlate.position.y = 0.115;
    layerGroup.add(labelPlate);

    // Perimeter accent trim rim
    const trimMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(layerInfo.colorHex),
      emissive: new THREE.Color(layerInfo.colorHex),
      emissiveIntensity: 0.65,
      roughness: 0.25,
      metalness: 0.6,
    });
    const trim = new THREE.Mesh(new THREE.BoxGeometry(3.26, 0.06, 3.26), trimMat);
    layerGroup.add(trim);

    const hitbox = createHitbox(3.4, 0.36, 3.4, { osiLayer: layerInfo.layer });
    hitbox.position.y = 0;
    layerGroup.add(hitbox);

    root.add(layerGroup);
    layers.push({
      layerNumber: layerInfo.layer,
      group: layerGroup,
      hitbox,
      baseY,
      material: slabMat,
    });
  });

  // Animated encapsulation packet traveling up/down center shaft
  const packetCore = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x38bdf8,
      emissiveIntensity: 1.5,
      roughness: 0.2,
      metalness: 0.3,
    })
  );
  packetCore.position.set(0, 1.5, 0);
  root.add(packetCore);

  return { root, layers, packetCore };
}
