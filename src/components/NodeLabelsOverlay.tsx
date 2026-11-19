import { NETWORK_NODES, NodeId } from '../data/curriculum';

interface NodeLabelsOverlayProps {
  visible: boolean;
  selectedNode: NodeId | null;
  selectedOsiLayer: number | null;
  onSelectNode: (id: NodeId) => void;
  onSelectOsiStack: () => void;
  registerNodeRef: (id: NodeId, el: HTMLElement | null) => void;
  registerOsiRef: (el: HTMLElement | null) => void;
}

const NODE_IDS = Object.keys(NETWORK_NODES) as NodeId[];

export function NodeLabelsOverlay({
  visible,
  selectedNode,
  selectedOsiLayer,
  onSelectNode,
  onSelectOsiStack,
  registerNodeRef,
  registerOsiRef,
}: NodeLabelsOverlayProps) {
  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden select-none">
      {NODE_IDS.map((id) => {
        const node = NETWORK_NODES[id];
        const isSelected = selectedNode === id;
        const isThreat = id === 'attacker';

        return (
          <button
            key={id}
            ref={(el) => registerNodeRef(id, el)}
            type="button"
            onClick={() => onSelectNode(id)}
            style={{ left: 0, top: 0 }}
            className={`pointer-events-auto absolute px-2.5 py-1 rounded text-left transition-colors duration-150 cursor-pointer border whitespace-nowrap ${
              isSelected
                ? 'bg-sky-500/95 border-sky-300 text-slate-950 shadow-lg'
                : isThreat
                  ? 'bg-[#1a0d14]/92 border-rose-500/50 text-rose-200 hover:border-rose-400'
                  : 'bg-[#0b111e]/90 border-slate-700/80 text-slate-200 hover:border-sky-400/70 hover:text-white'
            }`}
          >
            <div className="text-[11px] font-semibold leading-tight">{node.shortLabel}</div>
            <div
              className={`text-[10px] font-[family-name:var(--font-mono)] tabular-nums leading-tight ${
                isSelected ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {node.ipAddress}
            </div>
          </button>
        );
      })}

      {/* OSI 7-Layer Stack 3D Label */}
      <button
        ref={registerOsiRef}
        type="button"
        onClick={onSelectOsiStack}
        style={{ left: 0, top: 0 }}
        className={`pointer-events-auto absolute px-2.5 py-1 rounded text-left transition-colors duration-150 cursor-pointer border whitespace-nowrap ${
          selectedOsiLayer !== null
            ? 'bg-sky-500/95 border-sky-300 text-slate-950 shadow-lg'
            : 'bg-[#0b111e]/90 border-slate-700/80 text-slate-200 hover:border-sky-400/70 hover:text-white'
        }`}
      >
        <div className="text-[11px] font-semibold leading-tight">OSI 7-Layer Stack</div>
        <div
          className={`text-[10px] font-[family-name:var(--font-mono)] leading-tight ${
            selectedOsiLayer !== null ? 'text-slate-900' : 'text-slate-400'
          }`}
        >
          L7 Application → L1 Physical
        </div>
      </button>
    </div>
  );
}
