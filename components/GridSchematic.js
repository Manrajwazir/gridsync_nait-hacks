/*
 * GridSchematic — Animated Alberta transmission network SVG
 * Used as a background layer on the Operator Dashboard and Subscriber Portal.
 * Props:
 *   opacity  (default 0.07) — overall opacity of the schematic
 *   glow     (default true)  — whether nodes glow brighter
 */

export default function GridSchematic({ opacity = 0.07, glow = true }) {
  // Alberta city nodes: [x, y, label]
  // ViewBox: 0 0 340 460  (roughly proportional to Alberta's shape)
  const nodes = [
    { id: 'gp',  x: 52,  y: 118, label: 'Grande Prairie' },
    { id: 'fmt', x: 290, y: 72,  label: 'Fort McMurray'  },
    { id: 'edm', x: 210, y: 200, label: 'Edmonton'       },
    { id: 'lld', x: 318, y: 210, label: 'Lloydminster'   },
    { id: 'rd',  x: 198, y: 278, label: 'Red Deer'       },
    { id: 'cal', x: 188, y: 358, label: 'Calgary'        },
    { id: 'lbr', x: 210, y: 430, label: 'Lethbridge'     },
    { id: 'mht', x: 316, y: 420, label: 'Medicine Hat'   },
  ]

  // Transmission lines: [from id, to id]
  const lines = [
    ['gp',  'edm'],
    ['fmt', 'edm'],
    ['lld', 'edm'],
    ['edm', 'rd' ],
    ['rd',  'cal'],
    ['cal', 'lbr'],
    ['cal', 'mht'],
    ['lbr', 'mht'],
  ]

  const nodeMap = Object.fromEntries(nodes.map(n => [n.id, n]))

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 0,
      pointerEvents: 'none',
      opacity,
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes gs-dash {
          from { stroke-dashoffset: 0; }
          to   { stroke-dashoffset: -28; }
        }
        @keyframes gs-pulse {
          0%,100% { r: 4; opacity: .9; }
          50%      { r: 7; opacity: .4; }
        }
        @keyframes gs-pulse-outer {
          0%,100% { r: 10; opacity: .15; }
          50%      { r: 18; opacity: 0; }
        }
      `}</style>
      <svg
        viewBox="0 0 340 460"
        preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%' }}
      >
        {/* Transmission lines */}
        {lines.map(([fromId, toId], i) => {
          const a = nodeMap[fromId]
          const b = nodeMap[toId]
          return (
            <g key={i}>
              {/* Static faint base line */}
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="rgba(0,212,255,0.35)"
                strokeWidth="0.6"
              />
              {/* Animated energy-flow dash */}
              <line
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke="rgba(0,212,255,0.6)"
                strokeWidth="0.8"
                strokeDasharray="4 8"
                style={{
                  animation: `gs-dash ${2.2 + i * 0.4}s linear infinite`,
                  animationDelay: `${i * 0.3}s`,
                }}
              />
            </g>
          )
        })}

        {/* City nodes */}
        {nodes.map((node, i) => (
          <g key={node.id}>
            {/* Outer pulse ring */}
            {glow && (
              <circle
                cx={node.x} cy={node.y} r={10}
                fill="rgba(0,212,255,0.1)"
                style={{
                  animation: `gs-pulse-outer 3s ease-in-out infinite`,
                  animationDelay: `${i * 0.4}s`,
                }}
              />
            )}
            {/* Inner dot — pulses */}
            <circle
              cx={node.x} cy={node.y} r={4}
              fill="#00d4ff"
              style={{
                animation: `gs-pulse 3s ease-in-out infinite`,
                animationDelay: `${i * 0.4}s`,
              }}
            />
            {/* City label */}
            <text
              x={node.x + 8} y={node.y + 4}
              fontSize="8" fill="rgba(0,212,255,0.7)"
              fontFamily="'SF Mono','Fira Code',monospace"
              letterSpacing="0.3"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}
