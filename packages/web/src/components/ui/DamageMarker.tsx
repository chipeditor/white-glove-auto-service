'use client';

import { useState, useCallback } from 'react';

interface DamagePoint {
  id: string;
  x: number;
  y: number;
  severity: 'minor' | 'moderate' | 'severe';
  note: string;
}

interface DamageMarkerProps {
  vehicleType?: 'sedan' | 'suv' | 'truck';
  markers: DamagePoint[];
  onChange?: (markers: DamagePoint[]) => void;
  readOnly?: boolean;
}

const SEVERITY_COLORS = {
  minor: { fill: '#c8a45c', stroke: '#a8843c', label: 'Minor' },
  moderate: { fill: '#e89040', stroke: '#c87020', label: 'Moderate' },
  severe: { fill: '#e05050', stroke: '#c03030', label: 'Severe' },
};

function SedanSVG() {
  return (
    <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
      {/* Body outline - top view */}
      <path d="M 160,40 C 160,30 180,20 200,18 L 300,18 C 320,20 340,30 340,40 L 345,80 L 348,140 L 348,260 L 345,320 L 340,360 C 340,370 320,380 300,382 L 200,382 C 180,380 160,370 160,360 L 155,320 L 152,260 L 152,140 L 155,80 Z" />
      {/* Hood */}
      <path d="M 170,80 L 330,80" />
      {/* Windshield */}
      <path d="M 175,120 L 325,120" />
      <path d="M 170,80 C 172,100 175,120 175,120" />
      <path d="M 330,80 C 328,100 325,120 325,120" />
      {/* Roof front */}
      <path d="M 180,155 L 320,155" />
      {/* Roof rear */}
      <path d="M 180,245 L 320,245" />
      {/* Rear window */}
      <path d="M 175,280 L 325,280" />
      <path d="M 175,280 C 172,260 180,245 180,245" />
      <path d="M 325,280 C 328,260 320,245 320,245" />
      {/* Trunk */}
      <path d="M 170,320 L 330,320" />
      {/* Mirrors */}
      <ellipse cx="148" cy="130" rx="8" ry="5" />
      <ellipse cx="352" cy="130" rx="8" ry="5" />
      {/* Front wheels */}
      <rect x="145" y="55" width="18" height="40" rx="4" />
      <rect x="337" y="55" width="18" height="40" rx="4" />
      {/* Rear wheels */}
      <rect x="145" y="300" width="18" height="40" rx="4" />
      <rect x="337" y="300" width="18" height="40" rx="4" />
      {/* Headlights */}
      <ellipse cx="185" cy="30" rx="12" ry="6" />
      <ellipse cx="315" cy="30" rx="12" ry="6" />
      {/* Taillights */}
      <ellipse cx="185" cy="370" rx="12" ry="6" />
      <ellipse cx="315" cy="370" rx="12" ry="6" />
      {/* Center line */}
      <line x1="250" y1="18" x2="250" y2="382" strokeDasharray="4 8" opacity="0.2" />
      {/* Labels */}
      <text x="250" y="55" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">FRONT</text>
      <text x="250" y="355" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">REAR</text>
      <text x="250" y="200" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.2" fontFamily="sans-serif">ROOF</text>
    </g>
  );
}

function SUVSvg() {
  return (
    <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
      {/* Wider body */}
      <path d="M 150,40 C 150,28 175,18 200,16 L 300,16 C 325,18 350,28 350,40 L 354,80 L 356,140 L 356,260 L 354,320 L 350,360 C 350,372 325,382 300,384 L 200,384 C 175,382 150,372 150,360 L 146,320 L 144,260 L 144,140 L 146,80 Z" />
      <path d="M 162,80 L 338,80" />
      <path d="M 168,125 L 332,125" />
      <path d="M 162,80 C 164,102 168,125 168,125" />
      <path d="M 338,80 C 336,102 332,125 332,125" />
      <path d="M 172,155 L 328,155" />
      <path d="M 172,245 L 328,245" />
      <path d="M 168,280 L 332,280" />
      <path d="M 168,280 C 165,260 172,245 172,245" />
      <path d="M 332,280 C 335,260 328,245 328,245" />
      <path d="M 162,320 L 338,320" />
      <ellipse cx="138" cy="132" rx="9" ry="6" />
      <ellipse cx="362" cy="132" rx="9" ry="6" />
      <rect x="135" y="52" width="20" height="45" rx="5" />
      <rect x="345" y="52" width="20" height="45" rx="5" />
      <rect x="135" y="298" width="20" height="45" rx="5" />
      <rect x="345" y="298" width="20" height="45" rx="5" />
      <ellipse cx="185" cy="28" rx="14" ry="7" />
      <ellipse cx="315" cy="28" rx="14" ry="7" />
      <ellipse cx="185" cy="372" rx="14" ry="7" />
      <ellipse cx="315" cy="372" rx="14" ry="7" />
      <line x1="250" y1="16" x2="250" y2="384" strokeDasharray="4 8" opacity="0.2" />
      <text x="250" y="55" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">FRONT</text>
      <text x="250" y="355" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">REAR</text>
      <text x="250" y="200" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.2" fontFamily="sans-serif">ROOF</text>
    </g>
  );
}

function TruckSVG() {
  return (
    <g stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5">
      {/* Cab */}
      <path d="M 155,40 C 155,28 178,18 200,16 L 300,16 C 322,18 345,28 345,40 L 348,75 L 350,120 L 350,170 L 348,185 L 345,195 L 340,200 L 160,200 L 155,195 L 152,185 L 150,170 L 150,120 L 152,75 Z" />
      <path d="M 165,75 L 335,75" />
      <path d="M 170,115 L 330,115" />
      <path d="M 165,75 C 167,95 170,115 170,115" />
      <path d="M 335,75 C 333,95 330,115 330,115" />
      <path d="M 173,145 L 327,145" />
      {/* Bed */}
      <rect x="150" y="210" width="200" height="175" rx="4" />
      <line x1="150" y1="250" x2="350" y2="250" strokeDasharray="3 6" opacity="0.3" />
      <line x1="150" y1="300" x2="350" y2="300" strokeDasharray="3 6" opacity="0.3" />
      <line x1="150" y1="350" x2="350" y2="350" strokeDasharray="3 6" opacity="0.3" />
      {/* Mirrors */}
      <ellipse cx="142" cy="125" rx="10" ry="5" />
      <ellipse cx="358" cy="125" rx="10" ry="5" />
      {/* Front wheels */}
      <rect x="138" y="48" width="22" height="48" rx="5" />
      <rect x="340" y="48" width="22" height="48" rx="5" />
      {/* Rear wheels */}
      <rect x="138" y="330" width="22" height="48" rx="5" />
      <rect x="340" y="330" width="22" height="48" rx="5" />
      <ellipse cx="185" cy="28" rx="14" ry="7" />
      <ellipse cx="315" cy="28" rx="14" ry="7" />
      <ellipse cx="185" cy="375" rx="10" ry="5" />
      <ellipse cx="315" cy="375" rx="10" ry="5" />
      <line x1="250" y1="16" x2="250" y2="385" strokeDasharray="4 8" opacity="0.2" />
      <text x="250" y="55" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">FRONT</text>
      <text x="250" y="375" textAnchor="middle" fontSize="10" fill="currentColor" opacity="0.3" fontFamily="sans-serif">REAR</text>
      <text x="250" y="160" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.2" fontFamily="sans-serif">CAB</text>
      <text x="250" y="285" textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.2" fontFamily="sans-serif">BED</text>
    </g>
  );
}

const VEHICLE_SVGS = { sedan: SedanSVG, suv: SUVSvg, truck: TruckSVG };

export function DamageMarker({ vehicleType = 'sedan', markers, onChange, readOnly = false }: DamageMarkerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [severity, setSeverity] = useState<'minor' | 'moderate' | 'severe'>('moderate');
  const [noteInput, setNoteInput] = useState('');

  const VehicleSVG = VEHICLE_SVGS[vehicleType];

  const handleSvgClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (readOnly || !onChange) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 500;
    const y = ((e.clientY - rect.top) / rect.height) * 400;

    if (x < 130 || x > 370 || y < 10 || y > 390) return;

    const id = `dmg-${Date.now()}`;
    const newMarker: DamagePoint = { id, x, y, severity, note: '' };
    onChange([...markers, newMarker]);
    setSelectedId(id);
    setNoteInput('');
  }, [readOnly, onChange, markers, severity]);

  function removeMarker(id: string) {
    if (!onChange) return;
    onChange(markers.filter(m => m.id !== id));
    if (selectedId === id) setSelectedId(null);
  }

  function updateNote(id: string, note: string) {
    if (!onChange) return;
    onChange(markers.map(m => m.id === id ? { ...m, note } : m));
  }

  const selected = markers.find(m => m.id === selectedId);

  return (
    <div className="space-y-3">
      {/* Severity selector */}
      {!readOnly && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-wg-muted">Severity:</span>
          {(Object.entries(SEVERITY_COLORS) as [typeof severity, typeof SEVERITY_COLORS.minor][]).map(([key, val]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSeverity(key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors border ${
                severity === key
                  ? `border-current`
                  : 'border-transparent'
              }`}
              style={{ color: val.fill, background: severity === key ? `${val.fill}15` : 'transparent' }}
            >
              {val.label}
            </button>
          ))}
          <span className="text-[10px] text-wg-muted ml-auto">Click on the diagram to mark damage</span>
        </div>
      )}

      {/* Vehicle diagram */}
      <div className="bg-wg-bg2 rounded-xl border border-wg-border p-2 flex justify-center">
        <svg
          viewBox="0 0 500 400"
          className="w-full max-w-md cursor-crosshair"
          style={{ maxHeight: 420 }}
          onClick={handleSvgClick}
        >
          <VehicleSVG />

          {/* Damage markers */}
          {markers.map(m => {
            const color = SEVERITY_COLORS[m.severity];
            const isSelected = m.id === selectedId;
            return (
              <g key={m.id} onClick={(e) => { e.stopPropagation(); setSelectedId(m.id); setNoteInput(m.note); }}>
                {isSelected && (
                  <circle cx={m.x} cy={m.y} r="16" fill={color.fill} opacity="0.15">
                    <animate attributeName="r" values="14;18;14" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={m.x} cy={m.y} r="8"
                  fill={color.fill} stroke={isSelected ? '#fff' : color.stroke} strokeWidth={isSelected ? 2 : 1.5}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={m.x} y={m.y + 3.5}
                  textAnchor="middle" fontSize="8" fontWeight="bold" fill="#fff" fontFamily="sans-serif"
                  style={{ pointerEvents: 'none' }}
                >
                  {m.severity === 'minor' ? '!' : m.severity === 'moderate' ? '!!' : '!!!'}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Vehicle type selector */}
      {!readOnly && (
        <div className="flex items-center gap-1">
          <span className="text-xs text-wg-muted mr-1">Body:</span>
          {/* Type selector would need to be controlled by parent - showing current type */}
          <span className="text-xs text-wg-text2 capitalize">{vehicleType}</span>
        </div>
      )}

      {/* Selected marker detail */}
      {selected && (
        <div className="bg-wg-card rounded-lg border border-wg-border p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ background: SEVERITY_COLORS[selected.severity].fill }} />
              <span className="text-xs font-medium text-wg-text">{SEVERITY_COLORS[selected.severity].label} Damage</span>
            </div>
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeMarker(selected.id)}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Remove
              </button>
            )}
          </div>
          {readOnly ? (
            selected.note && <p className="text-xs text-wg-text2">{selected.note}</p>
          ) : (
            <div className="flex gap-2">
              <input
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onBlur={() => updateNote(selected.id, noteInput)}
                onKeyDown={(e) => { if (e.key === 'Enter') updateNote(selected.id, noteInput); }}
                placeholder="Add a note..."
                className="flex-1 px-2 py-1.5 bg-wg-bg2 border border-wg-border rounded text-xs text-wg-text focus:outline-none focus:border-wg-blue placeholder-wg-muted"
              />
            </div>
          )}
        </div>
      )}

      {/* Summary */}
      {markers.length > 0 && (
        <div className="flex items-center gap-3 text-xs text-wg-muted">
          <span>{markers.length} damage point{markers.length !== 1 ? 's' : ''}</span>
          {markers.filter(m => m.severity === 'severe').length > 0 && (
            <span style={{ color: SEVERITY_COLORS.severe.fill }}>
              {markers.filter(m => m.severity === 'severe').length} severe
            </span>
          )}
          {markers.filter(m => m.severity === 'moderate').length > 0 && (
            <span style={{ color: SEVERITY_COLORS.moderate.fill }}>
              {markers.filter(m => m.severity === 'moderate').length} moderate
            </span>
          )}
          {markers.filter(m => m.severity === 'minor').length > 0 && (
            <span style={{ color: SEVERITY_COLORS.minor.fill }}>
              {markers.filter(m => m.severity === 'minor').length} minor
            </span>
          )}
        </div>
      )}
    </div>
  );
}
