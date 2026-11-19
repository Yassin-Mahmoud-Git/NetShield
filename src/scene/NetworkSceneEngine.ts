import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { NETWORK_NODES, NodeId, ThreatScenario } from '../data/curriculum';
import { soundEngine } from '../audio/soundEngine';
import { buildInfrastructureModels, buildOsiStackModel, BuiltNodeModel, BuiltOsiStack } from './models';
import { createContactShadowTexture, createFloorGridTexture } from './textures';

export interface SceneSimulationState {
  firewallEnabled: boolean;
  tlsEnabled: boolean;
  zeroTrustEnabled: boolean;
  threatScenario: ThreatScenario;
  explodeFactor: number;
  speedMultiplier: number;
  selectedNode: NodeId | null;
  selectedOsiLayer: number | null;
}

export interface LiveTelemetry {
  deliveredCount: number;
  blockedCount: number;
  leakedPlaintextCount: number;
  shieldedCipherCount: number;
  lastEventText: string;
  lastEventTone: 'nominal' | 'warning' | 'blocked';
}

export interface SceneCallbacks {
  onSelectNode: (nodeId: NodeId | null) => void;
  onSelectOsiLayer: (layer: number | null) => void;
  onTelemetry: (telemetry: LiveTelemetry) => void;
  onContextLost: (lost: boolean) => void;
}

export type CameraPresetKey = 'overview' | 'osi' | NodeId;

interface RoutePacket {
  active: boolean;
  mesh: THREE.Group;
  coreMat: THREE.MeshStandardMaterial;
  shieldRing: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  progress: number;
  speed: number;
  kind:
    | 'https'
    | 'dns'
    | 'tcp-syn'
    | 'tcp-ack'
    | 'attack-probe'
    | 'sqli'
    | 'dnsspoof'
    | 'phishing'
    | 'bruteforce'
    | 'xss'
    | 'csrf'
    | 'ransomware'
    | 'arpspoof';
  encrypted: boolean;
  blockedAtProgress: number | null;
  triggeredIntercept: boolean;
  label: string;
}

interface SparkParticle {
  active: boolean;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  life: number;
  maxLife: number;
}

// Pre-allocated module-scope scratch objects (Zero GC in render loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _mat4 = new THREE.Matrix4();
const _quat = new THREE.Quaternion();
const _scale = new THREE.Vector3(1, 1, 1);
const _up = new THREE.Vector3(0, 1, 0);
const _proj = new THREE.Vector3();

const OVERVIEW_CAMERA_POS = new THREE.Vector3(-1.5, 16.5, 24.5);
const OVERVIEW_CAMERA_TARGET = new THREE.Vector3(0.5, 1.0, 1.5);

const OSI_CAMERA_POS = new THREE.Vector3(5.6, 5.2, 16.8);
const OSI_CAMERA_TARGET = new THREE.Vector3(0.2, 2.5, 10.6);

export class NetworkSceneEngine {
  private container: HTMLElement;
  private callbacks: SceneCallbacks;
  private isSoftwareGl: boolean;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private clock = new THREE.Clock();

  private frameId = 0;
  private disposed = false;
  private userInteracting = false;

  // Camera transition state
  private cameraTransitionActive = false;
  private targetCamPos = OVERVIEW_CAMERA_POS.clone();
  private targetCamLook = OVERVIEW_CAMERA_TARGET.clone();

  // Simulation state
  private simState: SceneSimulationState = {
    firewallEnabled: true,
    tlsEnabled: true,
    zeroTrustEnabled: true,
    threatScenario: 'normal',
    explodeFactor: 0,
    speedMultiplier: 1,
    selectedNode: null,
    selectedOsiLayer: null,
  };

  private currentFirewallScale = 1;
  private currentZeroTrustOpacity = 1;
  private currentExplode = 0;

  // Scene objects
  private nodes!: Record<NodeId, BuiltNodeModel>;
  private osiStack!: BuiltOsiStack;
  private tlsTunnelMeshes: THREE.Mesh[] = [];
  private clickableMeshes: THREE.Object3D[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private lastHoverCheck = 0;

  // Curves for traffic
  private curves: Record<string, THREE.CatmullRomCurve3> = {};

  // Packet pool
  private packetPool: RoutePacket[] = [];
  private autoSpawnTimer = 0;

  // DDoS InstancedMesh swarm
  private readonly DDOS_COUNT = 110;
  private ddosInstanced!: THREE.InstancedMesh;
  private ddosProgress = new Float32Array(110);
  private ddosLateral = new Float32Array(110);
  private ddosHeight = new Float32Array(110);
  private ddosSpeed = new Float32Array(110);

  // Impact sparks InstancedMesh
  private readonly SPARK_COUNT = 90;
  private sparkInstanced!: THREE.InstancedMesh;
  private sparks: SparkParticle[] = [];

  // Telemetry
  private telemetry: LiveTelemetry = {
    deliveredCount: 0,
    blockedCount: 0,
    leakedPlaintextCount: 0,
    shieldedCipherCount: 0,
    lastEventText: 'Observatory ready — click any 3D device or launch a packet trace.',
    lastEventTone: 'nominal',
  };
  private lastTelemetryEmit = 0;

  // DOM projected label elements
  private labelElements = new Map<NodeId, HTMLElement>();
  private osiLabelElement: HTMLElement | null = null;

  // Disposables tracking
  private disposables: { dispose: () => void }[] = [];

  constructor(container: HTMLElement, callbacks: SceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;

    this.isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;
    this.renderer.setSize(width, height);
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x080d18);
    this.scene.fog = new THREE.FogExp2(0x080d18, 0.0155);

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 180);
    this.camera.position.copy(OVERVIEW_CAMERA_POS);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.copy(OVERVIEW_CAMERA_TARGET);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.06;
    this.controls.maxPolarAngle = Math.PI * 0.46;
    this.controls.minDistance = 5;
    this.controls.maxDistance = 46;
    this.controls.update();

    this.controls.addEventListener('start', () => {
      this.userInteracting = true;
      this.cameraTransitionActive = false;
    });
    this.controls.addEventListener('end', () => {
      this.userInteracting = false;
    });

    // Studio RoomEnvironment reflection map on every device
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    this.scene.environment = envTex;
    this.disposables.push(envTex);
    pmremGenerator.dispose();

    this.setupLighting();
    this.buildStageAndNodes();
    this.buildTrafficAndSwarm();
    this.bindEvents();

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.clock.start();
    this.tick();
  }

  private setupLighting() {
    // Cool sky/ground hemisphere fill
    const hemi = new THREE.HemisphereLight(0x7dd3fc, 0x0f172a, 0.85);
    this.scene.add(hemi);

    // Warm directional Key Light
    const keyLight = new THREE.DirectionalLight(0xfff1dc, 2.15);
    keyLight.position.set(16, 26, 18);
    if (!this.isSoftwareGl) {
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.set(2048, 2048);
      keyLight.shadow.camera.near = 2;
      keyLight.shadow.camera.far = 75;
      keyLight.shadow.camera.left = -24;
      keyLight.shadow.camera.right = 24;
      keyLight.shadow.camera.top = 24;
      keyLight.shadow.camera.bottom = -24;
      keyLight.shadow.bias = -0.0005;
      keyLight.shadow.normalBias = 0.02;
    }
    this.scene.add(keyLight);

    // Cool Rim Backlight
    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.15);
    rimLight.position.set(-18, 14, -20);
    this.scene.add(rimLight);

    // Studio Area Softboxes on GPU
    if (!this.isSoftwareGl) {
      RectAreaLightUniformsLib.init();
      const areaLeft = new THREE.RectAreaLight(0x38bdf8, 2.2, 12, 4);
      areaLeft.position.set(-10, 9, -8);
      areaLeft.lookAt(-6, 1, 2);
      this.scene.add(areaLeft);

      const areaRight = new THREE.RectAreaLight(0x2dd4bf, 2.2, 12, 4);
      areaRight.position.set(14, 9, 8);
      areaRight.lookAt(10, 1, 0);
      this.scene.add(areaRight);
    }
  }

  private buildStageAndNodes() {
    const maxAniso = this.renderer.capabilities.getMaxAnisotropy();
    const floorTex = createFloorGridTexture(maxAniso);
    const shadowTex = createContactShadowTexture();
    this.disposables.push(floorTex, shadowTex);

    // Ground floor architectural grid
    const floorGeo = new THREE.PlaneGeometry(48, 48);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.78,
      metalness: 0.18,
      polygonOffset: true,
      polygonOffsetFactor: 1,
      polygonOffsetUnits: 1,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Subtle recessed architectural rim beneath floor
    const plinthMesh = new THREE.Mesh(
      new THREE.BoxGeometry(48.4, 0.8, 48.4),
      new THREE.MeshStandardMaterial({ color: 0x0a101d, roughness: 0.85, metalness: 0.25 })
    );
    plinthMesh.position.y = -0.42;
    this.scene.add(plinthMesh);

    // Build all 8 infrastructure nodes
    this.nodes = buildInfrastructureModels(this.isSoftwareGl, maxAniso, shadowTex);
    (Object.values(this.nodes) as BuiltNodeModel[]).forEach((node) => {
      this.scene.add(node.group);
      this.clickableMeshes.push(node.hitbox);
    });

    // Build explodable 7-layer OSI Stack
    this.osiStack = buildOsiStackModel(maxAniso, shadowTex);
    this.scene.add(this.osiStack.root);
    this.osiStack.layers.forEach((l) => this.clickableMeshes.push(l.hitbox));

    // Raycaster checks only layer 1 (simplified hitboxes)
    this.raycaster.layers.set(1);

    // Build fiber-optic network links & curves
    const pt = (id: NodeId, y = 0.22) => {
      const [x, , z] = NETWORK_NODES[id].position;
      return new THREE.Vector3(x, y, z);
    };

    this.curves.clientToDns = new THREE.CatmullRomCurve3([
      pt('client', 0.22),
      new THREE.Vector3(-11.5, 0.22, -1.5),
      pt('dns', 0.22),
    ]);
    this.curves.clientToRouter = new THREE.CatmullRomCurve3([
      pt('client', 0.22),
      new THREE.Vector3(-9.8, 0.22, 3.3),
      pt('router', 0.22),
    ]);
    this.curves.routerToWeb = new THREE.CatmullRomCurve3([
      pt('router', 0.22),
      pt('firewall', 0.22),
      pt('switch', 0.22),
      new THREE.Vector3(9.5, 0.22, -1.5),
      pt('webserver', 0.22),
    ]);
    this.curves.webToDb = new THREE.CatmullRomCurve3([
      pt('webserver', 0.22),
      new THREE.Vector3(12.3, 0.22, 0.5),
      pt('database', 0.22),
    ]);
    this.curves.fullHttps = new THREE.CatmullRomCurve3([
      pt('client', 0.35),
      new THREE.Vector3(-9.8, 0.35, 3.3),
      pt('router', 0.35),
      pt('firewall', 0.35),
      pt('switch', 0.35),
      new THREE.Vector3(9.5, 0.35, -1.5),
      pt('webserver', 0.35),
    ]);
    this.curves.attackerToRouter = new THREE.CatmullRomCurve3([
      pt('attacker', 0.35),
      new THREE.Vector3(-4.2, 0.35, -3.5),
      pt('router', 0.35),
    ]);
    this.curves.attackerToFirewallToWeb = new THREE.CatmullRomCurve3([
      pt('attacker', 0.38),
      new THREE.Vector3(-4.0, 0.38, -2.5),
      pt('router', 0.38),
      pt('firewall', 0.38),
      pt('switch', 0.38),
      pt('webserver', 0.38),
    ]);
    this.curves.attackerToDns = new THREE.CatmullRomCurve3([
      pt('attacker', 0.35),
      new THREE.Vector3(-5.2, 0.35, -7.8),
      pt('dns', 0.35),
    ]);
    this.curves.attackerToClient = new THREE.CatmullRomCurve3([
      pt('attacker', 0.42),
      new THREE.Vector3(-8.5, 0.9, -2.5),
      pt('client', 0.42),
    ]);
    this.curves.webToClient = new THREE.CatmullRomCurve3([
      pt('webserver', 0.42),
      new THREE.Vector3(6.4, 0.42, 1.4),
      pt('firewall', 0.42),
      pt('router', 0.42),
      pt('client', 0.42),
    ]);
    this.curves.clientToDb = new THREE.CatmullRomCurve3([
      pt('client', 0.38),
      pt('router', 0.38),
      pt('firewall', 0.38),
      pt('switch', 0.38),
      pt('database', 0.38),
    ]);

    const fiberMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a5f,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.5,
    });
    const threatFiberMat = new THREE.MeshStandardMaterial({
      color: 0x3b1824,
      emissive: 0x9f1239,
      emissiveIntensity: 0.35,
      roughness: 0.4,
      metalness: 0.3,
    });

    [
      this.curves.clientToDns,
      this.curves.clientToRouter,
      this.curves.routerToWeb,
      this.curves.webToDb,
    ].forEach((curve) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 48, 0.06, 8, false);
      const mesh = new THREE.Mesh(tubeGeo, fiberMat);
      this.scene.add(mesh);
    });

    [this.curves.attackerToRouter, this.curves.attackerToDns].forEach((curve) => {
      const tubeGeo = new THREE.TubeGeometry(curve, 32, 0.045, 8, false);
      const mesh = new THREE.Mesh(tubeGeo, threatFiberMat);
      this.scene.add(mesh);
    });

    // TLS 1.3 Protective Tunnel Sleeve over Client -> Router -> Firewall -> Switch -> WebServer
    const tlsGeo = new THREE.TubeGeometry(this.curves.fullHttps, 72, 0.26, 14, false);
    const tlsMat = new THREE.MeshPhysicalMaterial({
      color: 0x2dd4bf,
      emissive: 0x0d9488,
      emissiveIntensity: 0.35,
      roughness: 0.15,
      metalness: 0.1,
      transparent: true,
      opacity: 0.24,
      depthWrite: false,
    });
    const tlsTunnel = new THREE.Mesh(tlsGeo, tlsMat);
    tlsTunnel.renderOrder = 4;
    this.scene.add(tlsTunnel);
    this.tlsTunnelMeshes.push(tlsTunnel);
  }

  private buildTrafficAndSwarm() {
    // Pool of 18 individual inspectable packets
    const coreGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const shieldGeo = new THREE.TorusGeometry(0.28, 0.035, 8, 20);

    for (let i = 0; i < 18; i++) {
      const grp = new THREE.Group();
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x38bdf8,
        emissiveIntensity: 1.5,
        roughness: 0.2,
        metalness: 0.2,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      grp.add(core);

      const shieldRing = new THREE.Mesh(
        shieldGeo,
        new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.9 })
      );
      grp.add(shieldRing);

      grp.visible = false;
      this.scene.add(grp);

      this.packetPool.push({
        active: false,
        mesh: grp,
        coreMat,
        shieldRing,
        curve: this.curves.fullHttps,
        progress: 0,
        speed: 0.28,
        kind: 'https',
        encrypted: true,
        blockedAtProgress: null,
        triggeredIntercept: false,
        label: '',
      });
    }

    // DDoS Volumetric Flood Swarm (InstancedMesh)
    const shardGeo = new THREE.OctahedronGeometry(0.16, 0);
    const shardMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 1.4,
      roughness: 0.25,
      metalness: 0.3,
    });
    this.ddosInstanced = new THREE.InstancedMesh(shardGeo, shardMat, this.DDOS_COUNT);
    this.ddosInstanced.frustumCulled = false;
    this.ddosInstanced.visible = false;
    for (let i = 0; i < this.DDOS_COUNT; i++) {
      this.ddosProgress[i] = Math.random();
      this.ddosLateral[i] = (Math.random() - 0.5) * 1.4;
      this.ddosHeight[i] = 0.3 + Math.random() * 1.3;
      this.ddosSpeed[i] = 0.28 + Math.random() * 0.26;
    }
    this.scene.add(this.ddosInstanced);

    // Impact Sparks InstancedMesh (for Firewall / Zero-Trust blocks)
    const sparkGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const sparkMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    this.sparkInstanced = new THREE.InstancedMesh(sparkGeo, sparkMat, this.SPARK_COUNT);
    this.sparkInstanced.frustumCulled = false;
    for (let i = 0; i < this.SPARK_COUNT; i++) {
      this.sparks.push({
        active: false,
        pos: new THREE.Vector3(),
        vel: new THREE.Vector3(),
        life: 0,
        maxLife: 0.45,
      });
      _mat4.makeScale(0, 0, 0);
      this.sparkInstanced.setMatrixAt(i, _mat4);
    }
    this.sparkInstanced.instanceMatrix.needsUpdate = true;
    this.scene.add(this.sparkInstanced);
  }

  private spawnSparks(x: number, y: number, z: number, count = 8) {
    let spawned = 0;
    for (let i = 0; i < this.SPARK_COUNT && spawned < count; i++) {
      const s = this.sparks[i];
      if (!s.active) {
        s.active = true;
        s.pos.set(x, y, z);
        s.vel.set((Math.random() - 0.5) * 4.5, 1.5 + Math.random() * 3.5, (Math.random() - 0.5) * 4.5);
        s.life = 0;
        s.maxLife = 0.35 + Math.random() * 0.25;
        spawned++;
      }
    }
  }

  public spawnPacket(
    kind: RoutePacket['kind'],
    playAudio = true
  ) {
    const slot = this.packetPool.find((p) => !p.active);
    if (!slot) return;

    slot.active = true;
    slot.progress = 0;
    slot.kind = kind;
    slot.triggeredIntercept = false;
    slot.blockedAtProgress = null;

    if (kind === 'https') {
      slot.curve = this.curves.fullHttps;
      slot.speed = 0.24;
      slot.encrypted = this.simState.tlsEnabled;
      slot.coreMat.color.setHex(this.simState.tlsEnabled ? 0x38bdf8 : 0xf59e0b);
      slot.coreMat.emissive.setHex(this.simState.tlsEnabled ? 0x0ea5e9 : 0xd97706);
      slot.shieldRing.visible = this.simState.tlsEnabled;
      slot.label = this.simState.tlsEnabled ? 'HTTPS (TLS 1.3)' : 'HTTP (Plaintext)';
    } else if (kind === 'dns') {
      slot.curve = this.curves.clientToDns;
      slot.speed = 0.42;
      slot.encrypted = this.simState.tlsEnabled;
      slot.coreMat.color.setHex(0xa78bfa);
      slot.coreMat.emissive.setHex(0x8b5cf6);
      slot.shieldRing.visible = this.simState.tlsEnabled;
      slot.label = this.simState.tlsEnabled ? 'DoH Query (:443)' : 'DNS Query (:53)';
    } else if (kind === 'tcp-syn') {
      slot.curve = this.curves.fullHttps;
      slot.speed = 0.34;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0x34d399);
      slot.coreMat.emissive.setHex(0x10b981);
      slot.shieldRing.visible = false;
      slot.label = 'TCP SYN → 443';
    } else if (kind === 'tcp-ack') {
      slot.curve = this.curves.fullHttps;
      slot.speed = 0.34;
      slot.encrypted = true;
      slot.coreMat.color.setHex(0x2dd4bf);
      slot.coreMat.emissive.setHex(0x14b8a6);
      slot.shieldRing.visible = true;
      slot.label = 'TCP ACK (Session Ready)';
    } else if (kind === 'attack-probe') {
      slot.curve = this.curves.attackerToFirewallToWeb;
      slot.speed = 0.36;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf43f5e);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.firewallEnabled ? 0.5 : null;
      slot.label = 'Port Probe (:22 / :5432)';
    } else if (kind === 'sqli') {
      slot.curve = this.curves.webToDb;
      slot.speed = 0.38;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf43f5e);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.zeroTrustEnabled ? 0.72 : null;
      slot.label = 'SQLi Lateral Pivot';
    } else if (kind === 'phishing') {
      slot.curve = this.curves.attackerToClient;
      slot.speed = 0.35;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xfb7185);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.zeroTrustEnabled ? 0.88 : null;
      slot.label = 'Phishing Credential Lure';
    } else if (kind === 'bruteforce') {
      slot.curve = this.curves.attackerToFirewallToWeb;
      slot.speed = 0.52;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf43f5e);
      slot.coreMat.emissive.setHex(0xbe123c);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.firewallEnabled ? 0.5 : null;
      slot.label = 'Brute-Force Login Burst';
    } else if (kind === 'xss') {
      slot.curve = this.curves.webToClient;
      slot.speed = 0.34;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xfb923c);
      slot.coreMat.emissive.setHex(0xea580c);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.firewallEnabled ? 0.48 : null;
      slot.label = 'XSS Malicious Script';
    } else if (kind === 'csrf') {
      slot.curve = this.curves.fullHttps;
      slot.speed = 0.32;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf59e0b);
      slot.coreMat.emissive.setHex(0xd97706);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.zeroTrustEnabled ? 0.54 : null;
      slot.label = 'CSRF Forged Action';
    } else if (kind === 'ransomware') {
      slot.curve = this.curves.clientToDb;
      slot.speed = 0.31;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf43f5e);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.zeroTrustEnabled
        ? 0.84
        : this.simState.firewallEnabled
          ? 0.48
          : null;
      slot.label = 'Ransomware Lateral Payload';
    } else if (kind === 'arpspoof') {
      slot.curve = this.curves.attackerToRouter;
      slot.speed = 0.46;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xfb7185);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.firewallEnabled ? 0.85 : null;
      slot.label = 'Forged ARP Reply (L2)';
    } else {
      // dnsspoof
      slot.curve = this.curves.attackerToDns;
      slot.speed = 0.45;
      slot.encrypted = false;
      slot.coreMat.color.setHex(0xf43f5e);
      slot.coreMat.emissive.setHex(0xe11d48);
      slot.shieldRing.visible = false;
      slot.blockedAtProgress = this.simState.firewallEnabled ? 0.85 : null;
      slot.label = 'Forged DNS Response';
    }

    slot.mesh.visible = true;
    if (playAudio) {
      soundEngine.playPacketSend(slot.encrypted);
    }
  }

  public triggerTcpHandshake() {
    this.spawnPacket('tcp-syn', true);
    window.setTimeout(() => {
      if (!this.disposed) this.spawnPacket('tcp-ack', true);
    }, 450);
    window.setTimeout(() => {
      if (!this.disposed) this.spawnPacket('https', true);
    }, 900);
    this.pushTelemetryEvent('TCP 3-Way Handshake (SYN → SYN-ACK → ACK) initiated.', 'nominal');
  }

  public updateState(partial: Partial<SceneSimulationState>) {
    const prevFw = this.simState.firewallEnabled;
    const prevTls = this.simState.tlsEnabled;
    const prevZt = this.simState.zeroTrustEnabled;
    this.simState = { ...this.simState, ...partial };

    if (partial.firewallEnabled !== undefined && partial.firewallEnabled !== prevFw) {
      if (partial.firewallEnabled) {
        soundEngine.playShieldChime();
        this.pushTelemetryEvent('Perimeter Stateful Firewall & IDS enabled.', 'nominal');
      } else {
        this.pushTelemetryEvent('Firewall bypassed — perimeter ports & floods exposed.', 'warning');
      }
    }
    if (partial.tlsEnabled !== undefined && partial.tlsEnabled !== prevTls) {
      if (partial.tlsEnabled) {
        soundEngine.playShieldChime();
        this.pushTelemetryEvent('TLS 1.3 Encryption Tunnel active (AES-256-GCM).', 'nominal');
      } else {
        this.pushTelemetryEvent('TLS disabled — HTTP payloads traveling in plaintext!', 'warning');
      }
    }
    if (partial.zeroTrustEnabled !== undefined && partial.zeroTrustEnabled !== prevZt) {
      if (partial.zeroTrustEnabled) {
        soundEngine.playShieldChime();
        this.pushTelemetryEvent('Zero-Trust mTLS Micro-Segmentation active around DB Vault.', 'nominal');
      } else {
        this.pushTelemetryEvent('Zero-Trust segmentation disabled — lateral DB tier exposed.', 'warning');
      }
    }

    // Attacker beam visibility
    if (this.nodes?.attacker?.animatedParts?.interceptBeam) {
      const showBeam =
        this.simState.threatScenario === 'mitm' ||
        this.simState.threatScenario === 'portscan' ||
        this.simState.threatScenario === 'ddos' ||
        this.simState.threatScenario === 'phishing' ||
        this.simState.threatScenario === 'bruteforce' ||
        this.simState.threatScenario === 'arpspoof';
      this.nodes.attacker.animatedParts.interceptBeam.visible = showBeam;
    }

    // DDoS swarm visibility
    if (this.ddosInstanced) {
      this.ddosInstanced.visible = this.simState.threatScenario === 'ddos';
    }
  }

  public focusCamera(preset: CameraPresetKey) {
    this.cameraTransitionActive = true;
    if (preset === 'overview') {
      this.targetCamPos.copy(OVERVIEW_CAMERA_POS);
      this.targetCamLook.copy(OVERVIEW_CAMERA_TARGET);
    } else if (preset === 'osi') {
      this.targetCamPos.copy(OSI_CAMERA_POS);
      this.targetCamLook.copy(OSI_CAMERA_TARGET);
    } else {
      const node = NETWORK_NODES[preset];
      this.targetCamPos.set(...node.cameraPos);
      this.targetCamLook.set(...node.cameraTarget);
    }
  }

  public registerNodeLabelElement(id: NodeId, el: HTMLElement | null) {
    if (el) this.labelElements.set(id, el);
    else this.labelElements.delete(id);
  }

  public registerOsiLabelElement(el: HTMLElement | null) {
    this.osiLabelElement = el;
  }

  private pushTelemetryEvent(text: string, tone: LiveTelemetry['lastEventTone']) {
    this.telemetry.lastEventText = text;
    this.telemetry.lastEventTone = tone;
    this.callbacks.onTelemetry({ ...this.telemetry });
  }

  private bindEvents() {
    window.addEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('webglcontextlost', this.onContextLost);
    canvas.addEventListener('webglcontextrestored', this.onContextRestored);
  }

  private onContextLost = (e: Event) => {
    e.preventDefault();
    this.callbacks.onContextLost(true);
  };

  private onContextRestored = () => {
    this.callbacks.onContextLost(false);
  };

  private pointerDownPos = { x: 0, y: 0 };

  private onPointerDown = (e: PointerEvent) => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
    const onUp = (upEvt: PointerEvent) => {
      window.removeEventListener('pointerup', onUp);
      const dist = Math.hypot(upEvt.clientX - this.pointerDownPos.x, upEvt.clientY - this.pointerDownPos.y);
      if (dist > 6) return; // Ignore orbit drag releases

      const rect = this.renderer.domElement.getBoundingClientRect();
      this.pointer.x = ((upEvt.clientX - rect.left) / rect.width) * 2 - 1;
      this.pointer.y = -((upEvt.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.pointer, this.camera);
      const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
      if (hits.length > 0) {
        const data = hits[0].object.userData;
        if (data.nodeId) {
          soundEngine.playFocus();
          this.focusCamera(data.nodeId as NodeId);
          this.callbacks.onSelectOsiLayer(null);
          this.callbacks.onSelectNode(data.nodeId as NodeId);
        } else if (data.osiLayer) {
          soundEngine.playFocus();
          this.focusCamera('osi');
          this.callbacks.onSelectNode(null);
          this.callbacks.onSelectOsiLayer(data.osiLayer as number);
        }
      }
    };
    window.addEventListener('pointerup', onUp);
  };

  private onPointerMove = (e: PointerEvent) => {
    const now = performance.now();
    if (now - this.lastHoverCheck < 45) return;
    this.lastHoverCheck = now;

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(this.clickableMeshes, false);
    this.renderer.domElement.style.cursor = hits.length > 0 ? 'pointer' : 'grab';
  };

  private onResize = () => {
    if (this.disposed) return;
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
  };

  private afterDraw(cb: () => void) {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = () => {
    if (this.disposed) return;

    const rawDelta = this.clock.getDelta();
    const delta = Math.min(rawDelta, 0.08);
    const elapsed = this.clock.elapsedTime;
    const speed = this.simState.speedMultiplier;

    // 1. Smooth Camera Preset Interpolation
    if (this.cameraTransitionActive && !this.userInteracting) {
      const k = 4.8;
      this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this.targetCamPos.x, k, delta);
      this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this.targetCamPos.y, k, delta);
      this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this.targetCamPos.z, k, delta);
      this.controls.target.x = THREE.MathUtils.damp(this.controls.target.x, this.targetCamLook.x, k, delta);
      this.controls.target.y = THREE.MathUtils.damp(this.controls.target.y, this.targetCamLook.y, k, delta);
      this.controls.target.z = THREE.MathUtils.damp(this.controls.target.z, this.targetCamLook.z, k, delta);

      if (
        this.camera.position.distanceToSquared(this.targetCamPos) < 0.015 &&
        this.controls.target.distanceToSquared(this.targetCamLook) < 0.015
      ) {
        this.cameraTransitionActive = false;
      }
    }
    this.controls.update();

    // 2. Smoothly damp Firewall Barrier, TLS Tunnel, Zero-Trust Fence & OSI Stack Explode
    const fwTarget = this.simState.firewallEnabled ? 1 : 0.03;
    this.currentFirewallScale = THREE.MathUtils.damp(this.currentFirewallScale, fwTarget, 6, delta);
    const fwWall = this.nodes.firewall.animatedParts.shieldWall;
    if (fwWall) {
      fwWall.scale.y = this.currentFirewallScale;
      fwWall.visible = this.currentFirewallScale > 0.04;
    }

    const ztTarget = this.simState.zeroTrustEnabled ? 1 : 0.02;
    this.currentZeroTrustOpacity = THREE.MathUtils.damp(this.currentZeroTrustOpacity, ztTarget, 6, delta);
    const ztRing = this.nodes.database.animatedParts.zeroTrustRing;
    if (ztRing) {
      ztRing.scale.y = this.currentZeroTrustOpacity;
      ztRing.visible = this.currentZeroTrustOpacity > 0.05;
    }

    this.tlsTunnelMeshes.forEach((m) => {
      const mat = m.material as THREE.MeshPhysicalMaterial;
      const targetOp = this.simState.tlsEnabled ? 0.24 : 0;
      mat.opacity = THREE.MathUtils.damp(mat.opacity, targetOp, 6, delta);
      m.visible = mat.opacity > 0.015;
    });

    this.currentExplode = THREE.MathUtils.damp(this.currentExplode, this.simState.explodeFactor, 6.5, delta);
    this.osiStack.layers.forEach((layer, idx) => {
      const targetY = layer.baseY + idx * 0.42 * this.currentExplode;
      layer.group.position.y = targetY;
      const isSelected = this.simState.selectedOsiLayer === layer.layerNumber;
      layer.material.emissiveIntensity = isSelected ? 0.55 : 0.1;
    });
    // Oscillate encapsulation packet up and down the OSI shaft
    const maxOsiY = 0.55 + 6 * (0.38 + 0.42 * this.currentExplode);
    const wave = (Math.sin(elapsed * 1.4 * speed) + 1) * 0.5;
    this.osiStack.packetCore.position.y = THREE.MathUtils.lerp(0.45, maxOsiY, wave);
    this.osiStack.packetCore.rotation.y += delta * 2.1;

    // 3. Animate Infrastructure Rings & Beacons
    if (this.nodes.dns.animatedParts.rings) {
      this.nodes.dns.animatedParts.rings.forEach((r, idx) => {
        r.rotation.y += delta * (0.45 + idx * 0.25) * (idx % 2 === 0 ? 1 : -1);
      });
    }
    if (this.nodes.dns.animatedParts.beacon) {
      this.nodes.dns.animatedParts.beacon.rotation.y += delta * 1.2;
    }
    if (this.nodes.router.animatedParts.rings) {
      this.nodes.router.animatedParts.rings[0].rotation.z += delta * 0.9;
    }
    if (this.nodes.firewall.animatedParts.beacon) {
      this.nodes.firewall.animatedParts.beacon.rotation.y -= delta * 1.4;
    }
    if (this.nodes.switch.animatedParts.rings) {
      this.nodes.switch.animatedParts.rings[0].rotation.z -= delta * 1.1;
    }
    if (this.nodes.webserver.animatedParts.rings) {
      this.nodes.webserver.animatedParts.rings[0].rotation.y += delta * 0.95;
      this.nodes.webserver.animatedParts.rings[1].rotation.x += delta * 1.25;
      this.nodes.webserver.animatedParts.rings[1].rotation.y -= delta * 0.7;
    }

    // 4. Auto-Spawn Background Packets According to Active Scenario
    this.autoSpawnTimer += delta * speed;
    const scen = this.simState.threatScenario;
    const interval = scen === 'normal' ? 1.55 : scen === 'bruteforce' ? 0.48 : 0.95;
    if (this.autoSpawnTimer >= interval) {
      this.autoSpawnTimer = 0;
      if (scen === 'normal') {
        this.spawnPacket(Math.random() < 0.28 ? 'dns' : 'https', false);
      } else if (scen === 'mitm') {
        this.spawnPacket('https', false);
      } else if (scen === 'portscan') {
        this.spawnPacket(Math.random() < 0.65 ? 'attack-probe' : 'https', false);
      } else if (scen === 'sqli') {
        this.spawnPacket(Math.random() < 0.65 ? 'sqli' : 'https', false);
      } else if (scen === 'dnsspoof') {
        this.spawnPacket(Math.random() < 0.65 ? 'dnsspoof' : 'dns', false);
      } else if (scen === 'phishing') {
        this.spawnPacket(Math.random() < 0.65 ? 'phishing' : 'https', false);
      } else if (scen === 'bruteforce') {
        this.spawnPacket(Math.random() < 0.8 ? 'bruteforce' : 'https', false);
      } else if (scen === 'xss') {
        this.spawnPacket(Math.random() < 0.65 ? 'xss' : 'https', false);
      } else if (scen === 'csrf') {
        this.spawnPacket(Math.random() < 0.65 ? 'csrf' : 'https', false);
      } else if (scen === 'ransomware') {
        this.spawnPacket(Math.random() < 0.7 ? 'ransomware' : 'https', false);
      } else if (scen === 'arpspoof') {
        this.spawnPacket(Math.random() < 0.65 ? 'arpspoof' : 'https', false);
      } else if (scen === 'ddos') {
        this.spawnPacket('https', false);
      }
    }

    // 5. Update Active Packet Pool (Zero GC)
    for (let i = 0; i < this.packetPool.length; i++) {
      const p = this.packetPool[i];
      if (!p.active) continue;

      p.progress += delta * p.speed * speed;
      p.shieldRing.rotation.x += delta * 3.0;
      p.shieldRing.rotation.y += delta * 2.2;

      // Check MitM sniffing mid-transit between client and router
      if (
        this.simState.threatScenario === 'mitm' &&
        p.kind === 'https' &&
        !p.triggeredIntercept &&
        p.progress >= 0.24
      ) {
        p.triggeredIntercept = true;
        if (this.simState.tlsEnabled) {
          this.telemetry.shieldedCipherCount++;
          this.telemetry.lastEventText = 'MitM sniffed ciphertext — AES-256-GCM protected payload.';
          this.telemetry.lastEventTone = 'nominal';
        } else {
          this.telemetry.leakedPlaintextCount++;
          this.telemetry.lastEventText = 'ALERT: Unencrypted HTTP credentials intercepted by MitM sniffer!';
          this.telemetry.lastEventTone = 'warning';
        }
      }

      // Check Firewall / Zero-Trust / DNSSEC block point
      if (p.blockedAtProgress !== null && p.progress >= p.blockedAtProgress) {
        p.curve.getPointAt(p.blockedAtProgress, _v1);
        this.spawnSparks(_v1.x, _v1.y + 0.35, _v1.z, 10);
        p.active = false;
        p.mesh.visible = false;
        this.telemetry.blockedCount++;
        this.telemetry.lastEventText = `${p.label} blocked by active security policy.`;
        this.telemetry.lastEventTone = 'blocked';
        soundEngine.playBlock();
        continue;
      }

      if (p.progress >= 1) {
        p.active = false;
        p.mesh.visible = false;
        const isAttackPacket =
          p.kind === 'attack-probe' ||
          p.kind === 'sqli' ||
          p.kind === 'dnsspoof' ||
          p.kind === 'phishing' ||
          p.kind === 'bruteforce' ||
          p.kind === 'xss' ||
          p.kind === 'csrf' ||
          p.kind === 'ransomware' ||
          p.kind === 'arpspoof';
        if (isAttackPacket) {
          this.telemetry.leakedPlaintextCount++;
          this.telemetry.lastEventText = `WARNING: ${p.label} reached target unblocked!`;
          this.telemetry.lastEventTone = 'warning';
        } else {
          this.telemetry.deliveredCount++;
        }
        continue;
      }

      p.curve.getPointAt(p.progress, _v1);
      p.mesh.position.copy(_v1);
      p.mesh.position.y += 0.25;
    }

    // 6. Update DDoS InstancedMesh Swarm
    if (this.ddosInstanced.visible) {
      const curve = this.curves.attackerToFirewallToWeb;
      for (let i = 0; i < this.DDOS_COUNT; i++) {
        this.ddosProgress[i] += delta * this.ddosSpeed[i] * speed;

        // If firewall is enabled, 92% shatter at the barrier (~0.49 progress)
        if (this.simState.firewallEnabled && this.ddosProgress[i] >= 0.49 && i % 12 !== 0) {
          if (i % 5 === 0) {
            curve.getPointAt(0.49, _v1);
            this.spawnSparks(_v1.x, this.ddosHeight[i], _v1.z + this.ddosLateral[i], 1);
          }
          this.ddosProgress[i] = 0;
          this.telemetry.blockedCount++;
        } else if (this.ddosProgress[i] >= 1) {
          this.ddosProgress[i] = 0;
        }

        curve.getPointAt(this.ddosProgress[i], _v1);
        _v2.set(_v1.x, this.ddosHeight[i], _v1.z + this.ddosLateral[i]);
        _quat.setFromAxisAngle(_up, elapsed * 4 + i);
        _mat4.compose(_v2, _quat, _scale);
        this.ddosInstanced.setMatrixAt(i, _mat4);
      }
      this.ddosInstanced.instanceMatrix.needsUpdate = true;
    }

    // 7. Update Sparks InstancedMesh
    let sparksDirty = false;
    for (let i = 0; i < this.SPARK_COUNT; i++) {
      const s = this.sparks[i];
      if (!s.active) continue;
      sparksDirty = true;
      s.life += delta;
      if (s.life >= s.maxLife) {
        s.active = false;
        _mat4.makeScale(0, 0, 0);
        this.sparkInstanced.setMatrixAt(i, _mat4);
        continue;
      }
      s.vel.y -= 9.5 * delta;
      s.pos.addScaledVector(s.vel, delta);
      const shrink = 1 - s.life / s.maxLife;
      _v2.set(shrink, shrink, shrink);
      _quat.identity();
      _mat4.compose(s.pos, _quat, _v2);
      this.sparkInstanced.setMatrixAt(i, _mat4);
    }
    if (sparksDirty) {
      this.sparkInstanced.instanceMatrix.needsUpdate = true;
    }

    // 8. Project 3D Node Labels cleanly to Screen Coordinates (no React re-renders)
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    this.labelElements.forEach((el, nodeId) => {
      const node = NETWORK_NODES[nodeId];
      _proj.set(node.position[0], node.labelOffsetY, node.position[2]);
      _proj.project(this.camera);
      if (_proj.z > 1 || _proj.z < -1) {
        el.style.opacity = '0';
        el.style.pointerEvents = 'none';
      } else {
        const sx = ((_proj.x + 1) * 0.5) * width;
        const sy = ((-_proj.y + 1) * 0.5) * height;
        el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        el.style.opacity = sy < 68 || sy > height - 150 ? '0.25' : '1';
        el.style.pointerEvents = 'auto';
      }
    });

    if (this.osiLabelElement) {
      const topOsiY = 0.85 + 6 * (0.38 + 0.42 * this.currentExplode);
      _proj.set(0.2, topOsiY, 10.6);
      _proj.project(this.camera);
      if (_proj.z > 1 || _proj.z < -1) {
        this.osiLabelElement.style.opacity = '0';
      } else {
        const sx = ((_proj.x + 1) * 0.5) * width;
        const sy = ((-_proj.y + 1) * 0.5) * height;
        this.osiLabelElement.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`;
        this.osiLabelElement.style.opacity = sy < 68 || sy > height - 150 ? '0.25' : '1';
      }
    }

    // 9. Throttled Telemetry Emit (~3.5Hz)
    if (elapsed - this.lastTelemetryEmit > 0.28) {
      this.lastTelemetryEmit = elapsed;
      this.callbacks.onTelemetry({ ...this.telemetry });
    }

    this.renderer.render(this.scene, this.camera);

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);

    window.removeEventListener('resize', this.onResize);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    canvas.removeEventListener('webglcontextlost', this.onContextLost);
    canvas.removeEventListener('webglcontextrestored', this.onContextRestored);

    this.controls.dispose();

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const m = obj as THREE.Mesh;
        m.geometry?.dispose();
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => mat.dispose());
        } else {
          m.material?.dispose();
        }
      }
    });

    this.disposables.forEach((d) => d.dispose());
    this.renderer.dispose();
    if (canvas.parentElement === this.container) {
      this.container.removeChild(canvas);
    }
  }
}
