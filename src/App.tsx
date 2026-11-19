import { useCallback, useEffect, useRef, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { BottomControlDock } from './components/BottomControlDock';
import { NodeLabelsOverlay } from './components/NodeLabelsOverlay';
import { TopBar } from './components/TopBar';
import { AppMode, NodeId, ThreatScenario, TOUR_STEPS } from './data/curriculum';
import { CameraPresetKey, LiveTelemetry, NetworkSceneEngine } from './scene/NetworkSceneEngine';

export default function App() {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);
  const engineRef = useRef<NetworkSceneEngine | null>(null);

  const [activeMode, setActiveMode] = useState<AppMode>('network');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [contextLost, setContextLost] = useState(false);

  // Simulation controls
  const [firewallEnabled, setFirewallEnabled] = useState(true);
  const [tlsEnabled, setTlsEnabled] = useState(true);
  const [zeroTrustEnabled, setZeroTrustEnabled] = useState(true);
  const [threatScenario, setThreatScenario] = useState<ThreatScenario>('normal');
  const [explodeFactor, setExplodeFactor] = useState(0);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  // Selections & Guided Tour
  const [selectedNode, setSelectedNode] = useState<NodeId | null>(null);
  const [selectedOsiLayer, setSelectedOsiLayer] = useState<number | null>(null);
  const [tourActive, setTourActive] = useState(false);
  const [tourIndex, setTourIndex] = useState(0);

  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    deliveredCount: 0,
    blockedCount: 0,
    leakedPlaintextCount: 0,
    shieldedCipherCount: 0,
    lastEventText: 'Observatory ready — drag to orbit, scroll to zoom, or click any 3D device.',
    lastEventTone: 'nominal',
  });

  // Initialize Three.js WebGL Engine once
  useEffect(() => {
    const mountEl = canvasMountRef.current;
    if (!mountEl) return;

    const engine = new NetworkSceneEngine(mountEl, {
      onSelectNode: (nodeId) => {
        setTourActive(false);
        setSelectedOsiLayer(null);
        setSelectedNode(nodeId);
        setDockCollapsed(false);
      },
      onSelectOsiLayer: (layer) => {
        setTourActive(false);
        setSelectedNode(null);
        setSelectedOsiLayer(layer);
        if (layer !== null) {
          setActiveMode('osi');
          setExplodeFactor((prev) => (prev < 0.5 ? 0.85 : prev));
        }
        setDockCollapsed(false);
      },
      onTelemetry: (next) => {
        setTelemetry(next);
      },
      onContextLost: (lost) => {
        setContextLost(lost);
      },
    });

    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, []);

  // Push simulation state updates into the 3D engine without remounting
  useEffect(() => {
    engineRef.current?.updateState({
      firewallEnabled,
      tlsEnabled,
      zeroTrustEnabled,
      threatScenario,
      explodeFactor,
      speedMultiplier,
      selectedNode,
      selectedOsiLayer,
    });
  }, [
    firewallEnabled,
    tlsEnabled,
    zeroTrustEnabled,
    threatScenario,
    explodeFactor,
    speedMultiplier,
    selectedNode,
    selectedOsiLayer,
  ]);

  // Keyboard shortcut 'H' for Cinema / Zen mode toggle
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const applyTourStep = useCallback((idx: number) => {
    const step = TOUR_STEPS[idx];
    setTourIndex(idx);
    setActiveMode(step.mode);
    setThreatScenario(step.threatScenario);
    setFirewallEnabled(step.firewallEnabled);
    setTlsEnabled(step.tlsEnabled);
    setZeroTrustEnabled(step.zeroTrustEnabled);
    setExplodeFactor(step.explodeFactor);
    setSelectedNode(null);
    setSelectedOsiLayer(null);
    engineRef.current?.focusCamera(step.focusNode);
  }, []);

  const handleSelectMode = (mode: AppMode) => {
    setTourActive(false);
    setSelectedNode(null);
    setSelectedOsiLayer(null);
    setActiveMode(mode);
    setDockCollapsed(false);

    if (mode === 'osi') {
      setExplodeFactor(0.85);
      engineRef.current?.focusCamera('osi');
    } else if (mode === 'network') {
      setExplodeFactor(0);
      setThreatScenario('normal');
      engineRef.current?.focusCamera('overview');
    } else if (mode === 'security') {
      setExplodeFactor(0);
      engineRef.current?.focusCamera('firewall');
    } else if (mode === 'threats') {
      setExplodeFactor(0);
      if (threatScenario === 'normal') {
        setThreatScenario('ddos');
      }
      engineRef.current?.focusCamera('overview');
    } else {
      setExplodeFactor(0);
      engineRef.current?.focusCamera('overview');
    }
  };

  const handleToggleTour = () => {
    if (tourActive) {
      setTourActive(false);
      engineRef.current?.focusCamera('overview');
    } else {
      setTourActive(true);
      setDockCollapsed(false);
      applyTourStep(0);
    }
  };

  const handleSelectNodeFromLabel = (id: NodeId) => {
    soundEngine.playFocus();
    setTourActive(false);
    setSelectedOsiLayer(null);
    setSelectedNode(id);
    setDockCollapsed(false);
    engineRef.current?.focusCamera(id);
  };

  const handleSelectOsiFromLabel = () => {
    soundEngine.playFocus();
    setTourActive(false);
    setSelectedNode(null);
    setActiveMode('osi');
    setExplodeFactor(0.85);
    setSelectedOsiLayer(7);
    setDockCollapsed(false);
    engineRef.current?.focusCamera('osi');
  };

  const handleFocusCamera = (preset: CameraPresetKey) => {
    soundEngine.playFocus();
    engineRef.current?.focusCamera(preset);
  };

  const registerNodeRef = useCallback((id: NodeId, el: HTMLElement | null) => {
    engineRef.current?.registerNodeLabelElement(id, el);
  }, []);

  const registerOsiRef = useCallback((el: HTMLElement | null) => {
    engineRef.current?.registerOsiLabelElement(el);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#080d18]">
      {/* Dedicated WebGL Mount (Isolated from React overlays) */}
      <div ref={canvasMountRef} className="fixed inset-0 z-0" aria-label="Interactive 3D Network and Cybersecurity Scene" />

      {/* Context Lost Fallback */}
      {contextLost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080d18]/95 p-6">
          <div className="max-w-md rounded-xl border border-slate-700 bg-[#0e1627] p-6 text-center space-y-3">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-50">
              3D Graphics Context Paused
            </h2>
            <p className="text-sm text-slate-300">
              Your browser temporarily suspended the WebGL context. Reload or restore GPU resources to resume the interactive 3D observatory.
            </p>
          </div>
        </div>
      )}

      {/* 3-Zone Top Navigation Bar */}
      <TopBar
        activeMode={activeMode}
        tourActive={tourActive}
        onSelectMode={handleSelectMode}
        onToggleTour={handleToggleTour}
        onResetOverview={() => {
          setTourActive(false);
          setSelectedNode(null);
          setSelectedOsiLayer(null);
          handleFocusCamera('overview');
        }}
      />

      {/* Projected 3D Device Labels */}
      <NodeLabelsOverlay
        visible={labelsVisible && !contextLost}
        selectedNode={selectedNode}
        selectedOsiLayer={selectedOsiLayer}
        onSelectNode={handleSelectNodeFromLabel}
        onSelectOsiStack={handleSelectOsiFromLabel}
        registerNodeRef={registerNodeRef}
        registerOsiRef={registerOsiRef}
      />

      {/* Unified Collapsible Bottom Control Dock */}
      <BottomControlDock
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((c) => !c)}
        activeMode={activeMode}
        onSelectMode={handleSelectMode}
        tourActive={tourActive}
        tourIndex={tourIndex}
        onTourPrev={() => applyTourStep(Math.max(0, tourIndex - 1))}
        onTourNext={() => applyTourStep(Math.min(TOUR_STEPS.length - 1, tourIndex + 1))}
        onExitTour={() => {
          setTourActive(false);
          engineRef.current?.focusCamera('overview');
        }}
        selectedNode={selectedNode}
        onClearNode={() => setSelectedNode(null)}
        selectedOsiLayer={selectedOsiLayer}
        onSelectOsiLayer={(layer) => {
          setSelectedOsiLayer(layer);
          if (layer !== null) {
            setExplodeFactor((prev) => (prev < 0.5 ? 0.85 : prev));
            engineRef.current?.focusCamera('osi');
          }
        }}
        firewallEnabled={firewallEnabled}
        onToggleFirewall={() => setFirewallEnabled((v) => !v)}
        tlsEnabled={tlsEnabled}
        onToggleTls={() => setTlsEnabled((v) => !v)}
        zeroTrustEnabled={zeroTrustEnabled}
        onToggleZeroTrust={() => setZeroTrustEnabled((v) => !v)}
        threatScenario={threatScenario}
        onSelectThreatScenario={(scen) => {
          setThreatScenario(scen);
          if (scen === 'mitm') engineRef.current?.focusCamera('attacker');
          else if (scen === 'phishing') engineRef.current?.focusCamera('client');
          else if (scen === 'sqli' || scen === 'ransomware') engineRef.current?.focusCamera('database');
          else if (scen === 'dnsspoof') engineRef.current?.focusCamera('dns');
          else if (scen === 'xss' || scen === 'csrf') engineRef.current?.focusCamera('webserver');
          else if (scen === 'arpspoof') engineRef.current?.focusCamera('router');
          else if (scen === 'ddos' || scen === 'portscan' || scen === 'bruteforce') {
            engineRef.current?.focusCamera('firewall');
          } else {
            engineRef.current?.focusCamera('overview');
          }
        }}
        explodeFactor={explodeFactor}
        onChangeExplode={setExplodeFactor}
        speedMultiplier={speedMultiplier}
        onToggleSpeed={() => setSpeedMultiplier((s) => (s === 1 ? 1.5 : s === 1.5 ? 2 : 1))}
        labelsVisible={labelsVisible}
        onToggleLabels={() => setLabelsVisible((v) => !v)}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          const next = !soundEnabled;
          soundEngine.setEnabled(next);
          setSoundEnabled(next);
        }}
        telemetry={telemetry}
        onSendHttps={() => engineRef.current?.spawnPacket('https', true)}
        onSendDns={() => engineRef.current?.spawnPacket('dns', true)}
        onRunHandshake={() => engineRef.current?.triggerTcpHandshake()}
        onFocusCamera={handleFocusCamera}
      />
    </div>
  );
}
