'use client';

import React, { useEffect, useRef } from 'react';

interface ProgressLegendProps {
  size?: number;
  itemHeight?: number;
  darkMode?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  isMobile?: boolean;
}

const ProgressLegend = ({
  size = 280,
  itemHeight = 60,
  darkMode = true,
  expanded = false,
  onToggle,
  isMobile = false
}: ProgressLegendProps) => {
  const legendRefs = useRef<(HTMLDivElement | null)[]>([]);
  const TAU = Math.PI * 2;

  useEffect(() => {
    legendRefs.current.forEach((ref, index) => {
      if (ref) {
        if (index < 4) {
          // Main legend diamonds (desktop vertical layout)
          drawLegendDiamond(ref, index);
        } else if (index >= 4 && index < 8) {
          // Desktop dropdown diamonds
          drawDropdownDiamond(ref, index - 4, 16);
        } else if (index >= 8 && index < 12) {
          // Mobile expanded diamonds
          drawDropdownDiamond(ref, (index - 8) % 4, 12);
        } else if (index >= 12) {
          // Mobile row diamonds
          drawDropdownDiamond(ref, (index - 12) % 4, 12);
        }
      }
    });
  }, [isMobile]);

  const drawLegendDiamond = (container: HTMLDivElement, index: number) => {
    const colors = [
      'rgb(220, 20, 20)',   // Red - Activated
      'rgb(255, 140, 0)',   // Orange - Rising
      'rgb(255, 220, 0)',   // Yellow - Elevated
      'rgb(50, 205, 50)'    // Green - Limitless
    ];

    container.innerHTML = '';

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "50");
    svg.setAttribute("height", "50");
    svg.setAttribute("viewBox", "0 0 50 50");

    // Create a mini version of one complete star arm
    const cx = 25;
    const cy = 30; // Center it better vertically
    const innerRadius = 5;  // Increased from 4
    const outerRadius = 28; // Increased from 22
    const rings = 5; // Fewer rings for the legend

    // Use the same sector angle as the main star (1/5 of circle)
    const sectorAngle = TAU / 5;
    const angle = -Math.PI / 2; // Point upward

    // Draw the rings for this single arm
    for (let ring = 0; ring < rings; ring++) {
      const ringProgress = (ring + 1) / rings;
      const radius = innerRadius + (outerRadius - innerRadius) * ringProgress;

      // Create the exact same curved diamond path as the main visual
      const tipX = cx + radius * Math.cos(angle);
      const tipY = cy + radius * Math.sin(angle);

      const spread = 0.35;
      const width = radius * 0.42;

      const leftAngle = angle - sectorAngle * spread;
      const leftX = cx + width * Math.cos(leftAngle);
      const leftY = cy + width * Math.sin(leftAngle);

      const rightAngle = angle + sectorAngle * spread;
      const rightX = cx + width * Math.cos(rightAngle);
      const rightY = cy + width * Math.sin(rightAngle);

      // Build the exact same curved path as main visual
      let path = `M ${cx} ${cy}`;

      const cl1x = cx + (leftX - cx) * 0.5 + 2.5 * Math.cos(leftAngle + Math.PI/2);
      const cl1y = cy + (leftY - cy) * 0.5 + 2.5 * Math.sin(leftAngle + Math.PI/2);
      path += ` Q ${cl1x} ${cl1y}, ${leftX} ${leftY}`;

      const cl2x = leftX + (tipX - leftX) * 0.5 - 3.5 * Math.cos(angle - Math.PI/2);
      const cl2y = leftY + (tipY - leftY) * 0.5 - 3.5 * Math.sin(angle - Math.PI/2);
      path += ` Q ${cl2x} ${cl2y}, ${tipX} ${tipY}`;

      const cr1x = tipX + (rightX - tipX) * 0.5 - 3.5 * Math.cos(angle + Math.PI/2);
      const cr1y = tipY + (rightY - tipY) * 0.5 - 3.5 * Math.sin(angle + Math.PI/2);
      path += ` Q ${cr1x} ${cr1y}, ${rightX} ${rightY}`;

      const cr2x = rightX + (cx - rightX) * 0.5 + 2.5 * Math.cos(rightAngle - Math.PI/2);
      const cr2y = rightY + (cy - rightY) * 0.5 + 2.5 * Math.sin(rightAngle - Math.PI/2);
      path += ` Q ${cr2x} ${cr2y}, ${cx} ${cy}`;

      path += ' Z';

      const diamond = document.createElementNS("http://www.w3.org/2000/svg", "path");
      diamond.setAttribute("d", path);
      diamond.setAttribute("fill", "none");
      diamond.setAttribute("stroke", colors[index]);
      diamond.setAttribute("stroke-width", (0.6 + ringProgress * 1.8).toString());
      diamond.setAttribute("stroke-opacity", (0.3 + ringProgress * 0.6).toString());
      diamond.setAttribute("stroke-linecap", "round");
      diamond.setAttribute("stroke-linejoin", "round");

      svg.appendChild(diamond);
    }

    container.appendChild(svg);
  };

  const drawDropdownDiamond = (container: HTMLDivElement, index: number, svgSize: number = 16) => {
    const colors = [
      'rgb(220, 20, 20)',   // Red - Activated
      'rgb(255, 140, 0)',   // Orange - Rising
      'rgb(255, 220, 0)',   // Yellow - Elevated
      'rgb(50, 205, 50)'    // Green - Limitless
    ];

    container.innerHTML = '';

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", svgSize.toString());
    svg.setAttribute("height", svgSize.toString());
    svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

    // Create the exact same curved diamond as the main legend, scaled down
    const TAU = Math.PI * 2;
    const cx = svgSize / 2;
    const cy = svgSize / 2;

    // Scale factors for the dropdown size
    const scale = svgSize / 50; // Main legend uses 50x50 viewBox
    const innerRadius = 5 * scale;
    const outerRadius = 28 * scale;
    const rings = 3; // Fewer rings for dropdown

    const sectorAngle = TAU / 5;
    const angle = -Math.PI / 2; // Point upward

    // Draw multiple rings like the main legend
    for (let ring = 0; ring < rings; ring++) {
      const ringProgress = (ring + 1) / rings;
      const radius = innerRadius + (outerRadius - innerRadius) * ringProgress;

      // Create the exact same curved diamond path as the main visual
      const tipX = cx + radius * Math.cos(angle);
      const tipY = cy + radius * Math.sin(angle);

      const spread = 0.35;
      const width = radius * 0.42;

      const leftAngle = angle - sectorAngle * spread;
      const leftX = cx + width * Math.cos(leftAngle);
      const leftY = cy + width * Math.sin(leftAngle);

      const rightAngle = angle + sectorAngle * spread;
      const rightX = cx + width * Math.cos(rightAngle);
      const rightY = cy + width * Math.sin(rightAngle);

      // Build the exact same curved path as main visual
      let path = `M ${cx} ${cy}`;

      const cl1x = cx + (leftX - cx) * 0.5 + 2.5 * scale * Math.cos(leftAngle + Math.PI/2);
      const cl1y = cy + (leftY - cy) * 0.5 + 2.5 * scale * Math.sin(leftAngle + Math.PI/2);
      path += ` Q ${cl1x} ${cl1y}, ${leftX} ${leftY}`;

      const cl2x = leftX + (tipX - leftX) * 0.5 - 3.5 * scale * Math.cos(angle - Math.PI/2);
      const cl2y = leftY + (tipY - leftY) * 0.5 - 3.5 * scale * Math.sin(angle - Math.PI/2);
      path += ` Q ${cl2x} ${cl2y}, ${tipX} ${tipY}`;

      const cr1x = tipX + (rightX - tipX) * 0.5 - 3.5 * scale * Math.cos(angle + Math.PI/2);
      const cr1y = tipY + (rightY - tipY) * 0.5 - 3.5 * scale * Math.sin(angle + Math.PI/2);
      path += ` Q ${cr1x} ${cr1y}, ${rightX} ${rightY}`;

      const cr2x = rightX + (cx - rightX) * 0.5 + 2.5 * scale * Math.cos(rightAngle - Math.PI/2);
      const cr2y = rightY + (cy - rightY) * 0.5 + 2.5 * scale * Math.sin(rightAngle - Math.PI/2);
      path += ` Q ${cr2x} ${cr2y}, ${cx} ${cy}`;

      path += ' Z';

      const diamond = document.createElementNS("http://www.w3.org/2000/svg", "path");
      diamond.setAttribute("d", path);
      diamond.setAttribute("fill", "none");
      diamond.setAttribute("stroke", colors[index]);
      diamond.setAttribute("stroke-width", (0.6 * scale + ringProgress * 1.8 * scale).toString());
      diamond.setAttribute("stroke-opacity", (0.3 + ringProgress * 0.6).toString());
      diamond.setAttribute("stroke-linecap", "round");
      diamond.setAttribute("stroke-linejoin", "round");

      svg.appendChild(diamond);
    }

    container.appendChild(svg);
  };

  const stages = [
    {
      name: 'Beginner',
      range: '0-24%',
      description: 'Foundation level - First cheat code created. Building initial mental frameworks and awareness.'
    },
    {
      name: 'Rookie',
      range: '25-49%',
      description: 'Development level - Consistent practice building momentum. Skills becoming more natural.'
    },
    {
      name: 'All-Star',
      range: '50-74%',
      description: 'Advanced level - Peak performance moments frequent. Can access cheat codes under pressure.'
    },
    {
      name: 'Hall of Fame',
      range: '75-100%',
      description: 'Elite level - Unconscious competence. Cheat codes integrated and automatic in all situations.'
    }
  ];

  // Mobile layout - vertical like the image
  if (isMobile) {
    return (
      <div
        className="progress-legend animate-fadeIn"
        style={{
          background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '20px',
          border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(10px)',
          fontFamily: 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          transition: 'all 0.3s ease',
          position: 'relative',
          width: '200px'
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          fontSize: '16px',
          fontWeight: '700',
          color: darkMode ? 'white' : 'black',
          marginBottom: '20px',
          letterSpacing: '2px'
        }}>
          LEVELS
        </div>

        {/* Levels List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {stages.map((stage, index) => (
            <div
              key={stage.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              {/* Simple diamond icon */}
              <div style={{
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="12" height="12" viewBox="0 0 12 12">
                  <path
                    d="M6 1 L11 6 L6 11 L1 6 Z"
                    fill={['#DC1414', '#FF8C00', '#FFDC00', '#32CD32'][index]}
                  />
                </svg>
              </div>

              {/* Level info */}
              <div style={{ flex: 1 }}>
                <div style={{
                  color: darkMode ? 'white' : 'black',
                  fontSize: '16px',
                  fontWeight: '600',
                  marginBottom: '2px'
                }}>
                  {stage.name}
                </div>
                <div style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                  fontSize: '12px'
                }}>
                  {stage.range}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Expand/Collapse button at bottom */}
        {onToggle && (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginTop: '20px'
          }}>
            <button
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                cursor: 'pointer',
                transition: 'color 0.2s ease',
                padding: '4px'
              }}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{
                  transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease'
                }}
              >
                <path d="M7 10l5 5 5-5z"/>
              </svg>
            </button>
          </div>
        )}

        {/* Expanded descriptions */}
        {expanded && (
          <div style={{
            marginTop: '20px',
            paddingTop: '20px',
            borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
          }}>
            {stages.map((stage, index) => (
              <div
                key={`expanded-${stage.name}`}
                style={{
                  marginBottom: index < stages.length - 1 ? '12px' : '0'
                }}
              >
                <div style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '4px'
                }}>
                  {stage.name}
                </div>
                <div style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {stage.description}
                </div>
              </div>
            ))}
          </div>
        )}

        <style jsx global>{`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .animate-fadeIn {
            animation: fadeIn 0.6s ease-out;
          }
        `}</style>
      </div>
    );
  }

  // Desktop layout - vertical
  return (
    <div
      className="progress-legend animate-fadeIn"
      style={{
        background: darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.95)',
        borderRadius: '16px',
        padding: '24px',
        width: `${size}px`,
        border: darkMode ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(10px)',
        fontFamily: 'var(--font-dm-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        transition: 'all 0.3s ease'
      }}
    >
      {onToggle && (
        <button
          onClick={onToggle}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'none',
            border: 'none',
            color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
            cursor: 'pointer',
            transition: 'color 0.2s ease',
            padding: '4px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"
            style={{
              transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          >
            <path d="M7 10l5 5 5-5z"/>
          </svg>
        </button>
      )}

      {stages.map((stage, index) => (
        <div
          key={stage.name}
          className="legend-item"
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: index < stages.length - 1 ? '20px' : '0',
            height: `${itemHeight}px`,
            padding: '8px',
            borderRadius: '8px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            animationDelay: `${index * 0.1}s`
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = darkMode
              ? 'rgba(255, 255, 255, 0.03)'
              : 'rgba(0, 0, 0, 0.03)';
            e.currentTarget.style.transform = 'translateX(4px)';

            const diamond = e.currentTarget.querySelector('.legend-diamond') as HTMLElement;
            if (diamond) {
              diamond.style.transform = 'scale(1.1)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.transform = 'translateX(0)';

            const diamond = e.currentTarget.querySelector('.legend-diamond') as HTMLElement;
            if (diamond) {
              diamond.style.transform = 'scale(1)';
            }
          }}
        >
          <div
            ref={el => { legendRefs.current[index] = el; }}
            className="legend-diamond"
            style={{
              width: '50px',
              height: '50px',
              marginRight: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'transform 0.2s ease'
            }}
          />
          <div className="legend-text" style={{ flex: 1 }}>
            <div style={{
              color: darkMode ? '#ffffff' : '#000000',
              fontSize: '18px',
              fontWeight: '600',
              marginBottom: '4px'
            }}>
              {stage.name}
            </div>
            <div style={{
              color: darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              fontSize: '14px'
            }}>
              {stage.range}
            </div>
          </div>
        </div>
      ))}

      {expanded && (
        <div style={{
          marginTop: '20px',
          paddingTop: '20px',
          borderTop: `1px solid ${darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          maxWidth: '256px'
        }}>
          {stages.map((stage, index) => (
            <div
              key={`expanded-${stage.name}`}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginBottom: index < stages.length - 1 ? '12px' : '0'
              }}
            >
              <div
                ref={el => {
                  // Create dropdown diamonds after main ones
                  if (el) {
                    const dropdownIndex = index + 4; // Offset to avoid conflicts
                    legendRefs.current[dropdownIndex] = el;
                    drawDropdownDiamond(el, index);
                  }
                }}
                style={{
                  width: '16px',
                  height: '16px',
                  flexShrink: 0,
                  marginTop: '2px'
                }}
              />
              <div>
                <div style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                  fontSize: '13px',
                  fontWeight: '500',
                  marginBottom: '2px'
                }}>
                  {stage.name}
                </div>
                <div style={{
                  color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                  fontSize: '11px',
                  lineHeight: '1.4'
                }}>
                  {stage.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }

        .legend-item {
          animation: fadeIn 0.6s ease-out;
          animation-fill-mode: both;
        }

        .progress-legend:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default ProgressLegend;