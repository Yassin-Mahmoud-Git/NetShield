import { useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  RotateCcw,
  Shield,
  ShieldAlert,
  Unlock,
  Volume2,
  VolumeX,
} from 'lucide-react';
import {
  AppMode,
  AUTH_CONCEPTS,
  CYBER_CORE_CONCEPTS,
  MALWARE_GLOSSARY,
  NETWORK_NODES,
  NodeId,
  OSI_LAYERS,
  PACKET_ANATOMY,
  PORT_REFERENCES,
  QUIZ_QUESTIONS,
  THREAT_SCENARIOS,
  ThreatScenario,
  TOUR_STEPS,
} from '../data/curriculum';
import { CameraPresetKey, LiveTelemetry } from '../scene/NetworkSceneEngine';

interface BottomControlDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeMode: AppMode;
  onSelectMode: (mode: AppMode) => void;
  tourActive: boolean;
  tourIndex: number;
  onTourPrev: () => void;
  onTourNext: () => void;
  onExitTour: () => void;
  selectedNode: NodeId | null;
  onClearNode: () => void;
  selectedOsiLayer: number | null;
  onSelectOsiLayer: (layer: number | null) => void;
  firewallEnabled: boolean;
  onToggleFirewall: () => void;
  tlsEnabled: boolean;
  onToggleTls: () => void;
  zeroTrustEnabled: boolean;
  onToggleZeroTrust: () => void;
  threatScenario: ThreatScenario;
  onSelectThreatScenario: (scen: ThreatScenario) => void;
  explodeFactor: number;
  onChangeExplode: (val: number) => void;
  speedMultiplier: number;
  onToggleSpeed: () => void;
  labelsVisible: boolean;
  onToggleLabels: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  telemetry: LiveTelemetry;
  onSendHttps: () => void;
  onSendDns: () => void;
  onRunHandshake: () => void;
  onFocusCamera: (preset: CameraPresetKey) => void;
}

type CyberGuideSubTab = 'concepts' | 'glossary' | 'auth' | 'packet' | 'ports' | 'quiz';

export function BottomControlDock({
  collapsed,
  onToggleCollapse,
  activeMode,
  onSelectMode,
  tourActive,
  tourIndex,
  onTourPrev,
  onTourNext,
  onExitTour,
  selectedNode,
  onClearNode,
  selectedOsiLayer,
  onSelectOsiLayer,
  firewallEnabled,
  onToggleFirewall,
  tlsEnabled,
  onToggleTls,
  zeroTrustEnabled,
  onToggleZeroTrust,
  threatScenario,
  onSelectThreatScenario,
  explodeFactor,
  onChangeExplode,
  speedMultiplier,
  onToggleSpeed,
  labelsVisible,
  onToggleLabels,
  soundEnabled,
  onToggleSound,
  telemetry,
  onSendHttps,
  onSendDns,
  onRunHandshake,
  onFocusCamera,
}: BottomControlDockProps) {
  const [guideTab, setGuideTab] = useState<CyberGuideSubTab>('concepts');
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);

  const activeNodeInfo = selectedNode ? NETWORK_NODES[selectedNode] : null;
  const activeOsiInfo =
    selectedOsiLayer !== null
      ? OSI_LAYERS.find((l) => l.layer === selectedOsiLayer) ?? null
      : null;
  const activeScenarioMeta =
    THREAT_SCENARIOS.find((s) => s.id === threatScenario) ?? THREAT_SCENARIOS[0];
  const currentTourStep = TOUR_STEPS[tourIndex];
  const currentQuestion = QUIZ_QUESTIONS[quizIndex];

  const handleQuizPick = (idx: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(idx);
    if (idx === currentQuestion.correctIndex) {
      setQuizScore((s) => s + 1);
    }
  };

  const handleNextQuestion = () => {
    setSelectedAnswer(null);
    if (quizIndex < QUIZ_QUESTIONS.length - 1) {
      setQuizIndex((i) => i + 1);
    } else {
      setQuizIndex(0);
      setQuizScore(0);
    }
  };

  const handleSimulateFromGlossary = (scen: ThreatScenario) => {
    onSelectMode('threats');
    onSelectThreatScenario(scen);
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 -translate-x-1/2 z-20 w-[min(1020px,95vw)] transition-transform duration-300 ease-out ${
        collapsed ? 'translate-y-[calc(100%-30px)]' : 'translate-y-0'
      }`}
    >
      {/* Top-center Collapse / Expand Handle */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-expanded={!collapsed}
          className="inline-flex items-center gap-1.5 px-4 py-1 text-xs font-medium text-slate-300 bg-[#0b111e]/95 border border-b-0 border-slate-700/80 rounded-t-lg hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
        >
          {collapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          <span>{collapsed ? 'Show Controls (H)' : 'Hide Controls (H)'}</span>
        </button>
      </div>

      {/* Main Dock Container */}
      <div className="bg-[#0b111e]/95 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden">
        {/* Compact Utility & Status Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-800/90 bg-[#0e1627]">
          {/* Mobile mode switcher + Desktop active context label */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex md:hidden items-center gap-1 overflow-x-auto">
              {(
                [
                  ['network', 'Network'],
                  ['osi', 'OSI'],
                  ['security', 'Defense'],
                  ['threats', 'Attacks'],
                  ['crypto', 'Guide'],
                ] as [AppMode, string][]
              ).map(([m, label]) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => onSelectMode(m)}
                  className={`px-2 py-1 text-xs font-medium rounded whitespace-nowrap cursor-pointer ${
                    activeMode === m ? 'bg-sky-500 text-slate-950' : 'text-slate-300 bg-slate-800'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs text-slate-300 truncate max-w-[490px]">
              <span
                className={`font-semibold ${
                  telemetry.lastEventTone === 'warning'
                    ? 'text-rose-400'
                    : telemetry.lastEventTone === 'blocked'
                      ? 'text-amber-300'
                      : 'text-emerald-400'
                }`}
              >
                {telemetry.lastEventTone === 'warning'
                  ? 'EXPOSED'
                  : telemetry.lastEventTone === 'blocked'
                    ? 'BLOCKED'
                    : 'NOMINAL'}
              </span>
              <span aria-hidden="true" className="text-slate-600">
                ·
              </span>
              <span className="truncate text-slate-300">{telemetry.lastEventText}</span>
            </div>
          </div>

          {/* Global Scene Utilities */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onFocusCamera('overview')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset View</span>
            </button>

            <button
              type="button"
              onClick={onToggleSpeed}
              className="px-2.5 py-1 text-xs font-[family-name:var(--font-mono)] tabular-nums text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              {speedMultiplier}x Speed
            </button>

            <button
              type="button"
              onClick={onToggleLabels}
              aria-label={labelsVisible ? 'Hide 3D labels' : 'Show 3D labels'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              {labelsVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Labels</span>
            </button>

            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundEnabled ? 'Mute sound effects' : 'Enable sound effects'}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/80 rounded transition-colors whitespace-nowrap cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-400" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span>Sound</span>
            </button>
          </div>
        </div>

        {/* Contextual Body Area */}
        <div className="p-4 max-h-[325px] overflow-y-auto">
          {tourActive ? (
            /* GUIDED TOUR VIEW */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-[family-name:var(--font-mono)] tabular-nums text-sky-400">
                    Guided Tour · Step {tourIndex + 1} of {TOUR_STEPS.length}
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-50">
                    {currentTourStep.title}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onTourPrev}
                    disabled={tourIndex === 0}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {tourIndex < TOUR_STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={onTourNext}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer"
                    >
                      Next Step
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={onExitTour}
                      className="px-3.5 py-1.5 text-xs font-semibold rounded bg-emerald-400 text-slate-950 hover:bg-emerald-300 cursor-pointer"
                    >
                      Finish Tour
                    </button>
                  )}
                </div>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed">{currentTourStep.explanation}</p>
              <div className="text-xs text-sky-200 bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2">
                <span className="font-semibold text-sky-400">Key takeaway: </span>
                {currentTourStep.keyTakeaway}
              </div>
            </div>
          ) : activeNodeInfo ? (
            /* SELECTED 3D NODE INSPECTOR */
            <div className="space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span>{activeNodeInfo.zone}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeNodeInfo.osiLayer}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-[family-name:var(--font-mono)] tabular-nums text-sky-300">
                      {activeNodeInfo.ipAddress}
                    </span>
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-50 mt-0.5">
                    {activeNodeInfo.name}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onSendHttps}
                    className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer whitespace-nowrap"
                  >
                    Send Live Packet
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onClearNode();
                      onFocusCamera('overview');
                    }}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                  >
                    Close Inspector
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-sky-400">Networking Role</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeNodeInfo.networkRole}</p>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-emerald-400">Cybersecurity Role</div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeNodeInfo.securityRole}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                <div className="text-slate-400">
                  <span className="text-slate-200 font-medium">Protocols: </span>
                  <span className="font-[family-name:var(--font-mono)]">
                    {activeNodeInfo.protocols.join(' · ')}
                  </span>
                </div>
                <div className="text-slate-300">
                  <span className="text-rose-400 font-medium">Threat: </span>
                  {activeNodeInfo.threatsAndDefenses.threat}
                  <span className="mx-2 text-slate-600">/</span>
                  <span className="text-teal-300 font-medium">Defense: </span>
                  {activeNodeInfo.threatsAndDefenses.defense}
                </div>
              </div>
            </div>
          ) : activeOsiInfo ? (
            /* SELECTED OSI LAYER INSPECTOR */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-[family-name:var(--font-mono)] tabular-nums">
                    <span style={{ color: activeOsiInfo.colorHex }}>Layer {activeOsiInfo.layer} of 7</span>
                    <span aria-hidden="true">·</span>
                    <span>PDU: {activeOsiInfo.pdu}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activeOsiInfo.protocols}</span>
                  </div>
                  <h2 className="font-[family-name:var(--font-display)] text-lg font-bold text-slate-50">
                    {activeOsiInfo.name} Layer
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => onSelectOsiLayer(null)}
                  className="px-3 py-1.5 text-xs font-medium rounded border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  Back to OSI Stack
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="font-semibold text-sky-400 mb-1">Networking Function</div>
                  <p className="text-slate-300 leading-relaxed">{activeOsiInfo.networkFunction}</p>
                </div>
                <div>
                  <div className="font-semibold text-rose-400 mb-1">Common Attack Vectors</div>
                  <p className="text-slate-300 leading-relaxed">{activeOsiInfo.attackVector}</p>
                </div>
                <div>
                  <div className="font-semibold text-emerald-400 mb-1">How to Defend</div>
                  <p className="text-slate-300 leading-relaxed">{activeOsiInfo.securityControl}</p>
                </div>
              </div>

              <div className="font-[family-name:var(--font-mono)] text-[11px] text-slate-300 bg-slate-900/90 border border-slate-800 rounded px-3 py-1.5">
                Header Example: {activeOsiInfo.headerExample}
              </div>
            </div>
          ) : activeMode === 'network' ? (
            /* MODE 1: NETWORK BASICS */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-slate-50">
                    Network Basics: Addressing, DNS, Routing &amp; Transport
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Click any 3D device above to inspect it, dispatch live packets, or jump into the 11-attack Attack Lab.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={onSendDns}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-violet-500/50 bg-violet-500/15 text-violet-200 hover:bg-violet-500/25 cursor-pointer whitespace-nowrap"
                  >
                    Send DNS Query
                  </button>
                  <button
                    type="button"
                    onClick={onRunHandshake}
                    className="px-3 py-1.5 text-xs font-medium rounded border border-emerald-500/50 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer whitespace-nowrap"
                  >
                    Run TCP 3-Way Handshake
                  </button>
                  <button
                    type="button"
                    onClick={onSendHttps}
                    className="px-3.5 py-1.5 text-xs font-semibold rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer whitespace-nowrap"
                  >
                    Send HTTPS Packet
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-800/80 text-xs">
                <div>
                  <div className="font-semibold text-slate-100 mb-1">MAC vs. IP Addresses</div>
                  <p className="text-slate-400 leading-relaxed">
                    MAC addresses identify hardware inside one local Ethernet segment (L2 Switches). IP addresses (e.g.{' '}
                    <span className="font-[family-name:var(--font-mono)] text-slate-200">192.168.10.42/24</span>) route packets across separate networks via Routers (L3).
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-slate-100 mb-1">DNS &amp; NAT Gateways</div>
                  <p className="text-slate-400 leading-relaxed">
                    DNS resolves domain names into IP addresses. NAT translates private LAN IPs into public WAN addresses so internal hosts share one edge IP.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-slate-100 mb-1">TCP vs. UDP &amp; Ports</div>
                  <p className="text-slate-400 leading-relaxed">
                    Ports multiplex apps on one IP (443 HTTPS, 53 DNS, 5432 DB). TCP guarantees ordered delivery via SYN/SYN-ACK/ACK; UDP prioritizes low-latency speed.
                  </p>
                </div>
              </div>
            </div>
          ) : activeMode === 'osi' ? (
            /* MODE 2: OSI 7-LAYER STACK */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-slate-50">
                    The 7-Layer OSI Model &amp; Encapsulation
                  </h2>
                  <p className="text-xs text-slate-400">
                    Drag Exploded View to separate layers in 3D, or click any layer to inspect its protocols, attacks, and defenses.
                  </p>
                </div>
                <div className="flex items-center gap-3 min-w-[230px]">
                  <label htmlFor="osi-explode" className="text-xs font-medium text-slate-300 whitespace-nowrap">
                    Exploded View
                  </label>
                  <input
                    id="osi-explode"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={explodeFactor}
                    onChange={(e) => onChangeExplode(parseFloat(e.target.value))}
                    className="studio-range w-28"
                  />
                  <span className="font-[family-name:var(--font-mono)] tabular-nums text-xs text-sky-300 w-9 text-right">
                    {Math.round(explodeFactor * 100)}%
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
                {OSI_LAYERS.map((layer) => (
                  <button
                    key={layer.layer}
                    type="button"
                    onClick={() => onSelectOsiLayer(layer.layer)}
                    className="text-left p-2 rounded-lg bg-slate-900/90 border border-slate-800 hover:border-sky-400/70 transition-colors cursor-pointer"
                  >
                    <div
                      className="text-[11px] font-[family-name:var(--font-mono)] font-semibold tabular-nums"
                      style={{ color: layer.colorHex }}
                    >
                      L{layer.layer} · {layer.pdu}
                    </div>
                    <div className="text-xs font-semibold text-slate-100 truncate">{layer.name}</div>
                    <div className="text-[10px] text-slate-400 truncate mt-0.5">{layer.protocols}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : activeMode === 'security' ? (
            /* MODE 3: CYBER DEFENSE & ARCHITECTURE */
            <div className="space-y-3">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-base font-bold text-slate-50">
                  Cybersecurity Defense-in-Depth Controls
                </h2>
                <p className="text-xs text-slate-400">
                  Toggle security layers in real time to observe how the 3D barrier, TLS encryption tunnel, and Zero-Trust perimeter respond.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={onToggleFirewall}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    firewallEnabled
                      ? 'bg-amber-500/10 border-amber-400/50 text-slate-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <Shield className={`w-4 h-4 ${firewallEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
                      <span>Stateful Firewall &amp; IDS/WAF</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Inspects 5-tuple ACLs, enforces default-deny ports, filters XSS, and drops DDoS floods.
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-[family-name:var(--font-mono)] font-semibold shrink-0 ${
                      firewallEnabled ? 'text-amber-300' : 'text-slate-500'
                    }`}
                  >
                    {firewallEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onToggleTls}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    tlsEnabled
                      ? 'bg-teal-500/10 border-teal-400/50 text-slate-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      {tlsEnabled ? (
                        <Lock className="w-4 h-4 text-teal-400" />
                      ) : (
                        <Unlock className="w-4 h-4 text-rose-400" />
                      )}
                      <span>TLS 1.3 Encryption Tunnel</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Wraps payloads in AES-256-GCM so MitM and ARP sniffers only capture unreadable ciphertext.
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-[family-name:var(--font-mono)] font-semibold shrink-0 ${
                      tlsEnabled ? 'text-teal-300' : 'text-rose-400'
                    }`}
                  >
                    {tlsEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={onToggleZeroTrust}
                  className={`flex items-start justify-between gap-3 p-3 rounded-lg border text-left transition-colors cursor-pointer ${
                    zeroTrustEnabled
                      ? 'bg-emerald-500/10 border-emerald-400/50 text-slate-100'
                      : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold">
                      <ShieldAlert className={`w-4 h-4 ${zeroTrustEnabled ? 'text-emerald-400' : 'text-slate-500'}`} />
                      <span>Zero-Trust &amp; FIDO2 Auth</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Blocks phishing logins, CSRF tokens, SQLi pivots, and ransomware spread into DB Vault.
                    </p>
                  </div>
                  <span
                    className={`text-[11px] font-[family-name:var(--font-mono)] font-semibold shrink-0 ${
                      zeroTrustEnabled ? 'text-emerald-300' : 'text-slate-500'
                    }`}
                  >
                    {zeroTrustEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>
              </div>
            </div>
          ) : activeMode === 'threats' ? (
            /* MODE 4: 12-SCENARIO CYBER ATTACKS & DEFENSE LAB */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {THREAT_SCENARIOS.map((scen) => (
                    <button
                      key={scen.id}
                      type="button"
                      onClick={() => onSelectThreatScenario(scen.id)}
                      className={`px-2 py-1 text-[11px] font-medium rounded border transition-colors cursor-pointer whitespace-nowrap ${
                        threatScenario === scen.id
                          ? scen.id === 'normal'
                            ? 'bg-sky-500 border-sky-400 text-slate-950 font-semibold'
                            : 'bg-rose-500 border-rose-400 text-white font-semibold'
                          : 'bg-slate-900 border-slate-700/90 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      {scen.label}
                    </button>
                  ))}
                </div>

                {/* Live Tabular Counters */}
                <div className="flex items-center gap-3 text-xs font-[family-name:var(--font-mono)] tabular-nums text-slate-300 shrink-0">
                  <span>
                    Delivered: <strong className="text-sky-300">{telemetry.deliveredCount}</strong>
                  </span>
                  <span>
                    Blocked: <strong className="text-amber-300">{telemetry.blockedCount}</strong>
                  </span>
                  <span>
                    Breached: <strong className="text-rose-400">{telemetry.leakedPlaintextCount}</strong>
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-slate-800/80 items-start">
                <div className="md:col-span-5 space-y-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-rose-300">{activeScenarioMeta.title}</span>
                    <span className="text-slate-500">·</span>
                    <span className="font-[family-name:var(--font-mono)] text-[11px] text-slate-400">
                      {activeScenarioMeta.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeScenarioMeta.howAttackWorks}</p>
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-300">Example:</strong> {activeScenarioMeta.realExample}
                  </p>
                </div>

                <div className="md:col-span-5 space-y-1">
                  <div className="text-xs font-semibold text-emerald-300">
                    How to Defend · Target: {activeScenarioMeta.target}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{activeScenarioMeta.howToDefend}</p>
                </div>

                <div className="md:col-span-2 flex flex-col gap-1.5">
                  <button
                    type="button"
                    onClick={onToggleFirewall}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border cursor-pointer ${
                      firewallEnabled
                        ? 'bg-amber-500/20 border-amber-400 text-amber-200'
                        : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    Firewall: {firewallEnabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleTls}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border cursor-pointer ${
                      tlsEnabled
                        ? 'bg-teal-500/20 border-teal-400 text-teal-200'
                        : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    TLS 1.3: {tlsEnabled ? 'ON' : 'OFF'}
                  </button>
                  <button
                    type="button"
                    onClick={onToggleZeroTrust}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded border cursor-pointer ${
                      zeroTrustEnabled
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                        : 'bg-slate-800 border-slate-600 text-slate-300'
                    }`}
                  >
                    Zero-Trust: {zeroTrustEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* MODE 5: COMPLETE CYBERSECURITY HANDBOOK & 8-QUESTION QUIZ */
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-900 rounded-lg border border-slate-800">
                  {(
                    [
                      ['concepts', 'Core Concepts'],
                      ['glossary', 'Malware & Threats'],
                      ['auth', 'Auth & Hashing'],
                      ['packet', 'Packet Anatomy'],
                      ['ports', 'Crypto & Ports'],
                      ['quiz', `Quiz (${QUIZ_QUESTIONS.length})`],
                    ] as [CyberGuideSubTab, string][]
                  ).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setGuideTab(tab)}
                      className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer whitespace-nowrap ${
                        guideTab === tab ? 'bg-sky-500 text-slate-950 font-semibold' : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {guideTab === 'packet' && (
                  <button
                    type="button"
                    onClick={onToggleTls}
                    className={`px-3 py-1 text-xs font-semibold rounded border cursor-pointer ${
                      tlsEnabled
                        ? 'bg-teal-500/15 border-teal-400/60 text-teal-200'
                        : 'bg-rose-500/15 border-rose-400/60 text-rose-200'
                    }`}
                  >
                    {tlsEnabled ? 'TLS 1.3 Encrypted (Toggle)' : 'Plaintext HTTP (Toggle)'}
                  </button>
                )}
              </div>

              {guideTab === 'concepts' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {CYBER_CORE_CONCEPTS.map((card) => (
                    <div key={card.title} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="font-semibold text-sky-300">{card.title}</div>
                      <div className="text-[11px] font-[family-name:var(--font-mono)] text-slate-400">
                        {card.summary}
                      </div>
                      <p className="text-slate-300 leading-relaxed pt-0.5">{card.details}</p>
                    </div>
                  ))}
                </div>
              )}

              {guideTab === 'glossary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                  {MALWARE_GLOSSARY.map((entry) => (
                    <div
                      key={entry.term}
                      className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between gap-1.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-rose-300">{entry.term}</span>
                          <span className="text-[11px] font-[family-name:var(--font-mono)] text-slate-400">
                            {entry.category}
                          </span>
                        </div>
                        <p className="text-slate-300 leading-relaxed mt-1">{entry.description}</p>
                      </div>
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                        <span className="text-[11px] text-emerald-300 truncate">
                          Defense: {entry.defense}
                        </span>
                        {entry.relatedScenario && (
                          <button
                            type="button"
                            onClick={() => handleSimulateFromGlossary(entry.relatedScenario!)}
                            className="text-[11px] font-semibold text-sky-300 hover:text-sky-200 underline shrink-0 cursor-pointer"
                          >
                            Simulate in 3D
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {guideTab === 'auth' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  {AUTH_CONCEPTS.map((card) => (
                    <div key={card.title} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1">
                      <div className="font-semibold text-teal-300">{card.title}</div>
                      <div className="text-[11px] font-[family-name:var(--font-mono)] text-slate-400">
                        {card.summary}
                      </div>
                      <p className="text-slate-300 leading-relaxed pt-0.5">{card.details}</p>
                    </div>
                  ))}
                </div>
              )}

              {guideTab === 'packet' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
                  {PACKET_ANATOMY.map((part) => (
                    <div key={part.layer} className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 space-y-1.5">
                      <div className="text-[11px] font-semibold text-sky-400">{part.layer}</div>
                      {part.encryptedNote && tlsEnabled ? (
                        <div className="font-[family-name:var(--font-mono)] text-[11px] text-teal-300 break-all">
                          {part.encryptedNote}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {part.plaintextFields.map((f) => (
                            <div key={f.label} className="text-[11px] flex justify-between gap-2">
                              <span className="text-slate-400">{f.label}</span>
                              <span
                                className={`font-[family-name:var(--font-mono)] tabular-nums truncate ${
                                  part.encryptedNote && !tlsEnabled ? 'text-rose-300' : 'text-slate-200'
                                }`}
                              >
                                {f.value}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {guideTab === 'ports' && (
                <div className="space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs text-slate-300">
                    <strong className="text-teal-300">Cryptography Summary:</strong> TLS uses{' '}
                    <strong>Asymmetric ECDHE + X.509 Certificates</strong> for key exchange &amp; server identity,{' '}
                    <strong>Symmetric AES-256-GCM</strong> for high-speed bulk encryption, and{' '}
                    <strong>SHA-256</strong> one-way hashing to verify integrity.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                    {PORT_REFERENCES.map((item) => (
                      <div key={item.port} className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col gap-0.5">
                        <div className="flex items-center justify-between">
                          <span className="font-[family-name:var(--font-mono)] tabular-nums font-semibold text-sky-300">
                            :{item.port} · {item.protocol}
                          </span>
                          <span className="font-[family-name:var(--font-mono)] text-[11px] text-slate-400">
                            {item.transport}
                          </span>
                        </div>
                        <div className="text-slate-200 font-medium">{item.service}</div>
                        <div className="text-[11px] text-slate-400">{item.riskNote}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {guideTab === 'quiz' && (
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-xs font-[family-name:var(--font-mono)] tabular-nums text-sky-300">
                      Question {quizIndex + 1} / {QUIZ_QUESTIONS.length} · Score: {quizScore}
                    </div>
                    <button
                      type="button"
                      onClick={() => onFocusCamera(currentQuestion.focusNode)}
                      className="text-xs font-medium text-sky-300 hover:text-sky-200 underline cursor-pointer"
                    >
                      Focus Related 3D Subject
                    </button>
                  </div>
                  <p className="text-sm font-medium text-slate-100">{currentQuestion.question}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentQuestion.options.map((opt, idx) => {
                      const answered = selectedAnswer !== null;
                      const isCorrect = idx === currentQuestion.correctIndex;
                      const isPicked = idx === selectedAnswer;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleQuizPick(idx)}
                          disabled={answered}
                          className={`px-3 py-2 text-xs text-left rounded border transition-colors cursor-pointer ${
                            answered
                              ? isCorrect
                                ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200'
                                : isPicked
                                  ? 'bg-rose-500/20 border-rose-400 text-rose-200'
                                  : 'bg-slate-900 border-slate-800 text-slate-500'
                              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-sky-400'
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {selectedAnswer !== null && (
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                      <p className="text-xs text-slate-300 flex-1">{currentQuestion.explanation}</p>
                      <button
                        type="button"
                        onClick={handleNextQuestion}
                        className="px-3 py-1.5 text-xs font-semibold rounded bg-sky-500 text-slate-950 hover:bg-sky-400 cursor-pointer shrink-0"
                      >
                        {quizIndex < QUIZ_QUESTIONS.length - 1 ? 'Next Question' : 'Restart Quiz'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
