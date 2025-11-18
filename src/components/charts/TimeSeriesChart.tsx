import { useState, useRef } from "react";
import { Box } from "@chakra-ui/react";
import { designTokens } from "../../theme";

export type ChartSize = "mini" | "medium" | "large";
export type LineStyle = "continuous" | "step";

export interface TimeSeriesDataPoint {
  timestamp: number;
  value: number;
  secondaryValue?: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  size?: ChartSize;
  lineStyle?: LineStyle;
  enableHover?: boolean;
  valueFormatter?: (value: number) => string;
  valueLabel?: string;
  showGrid?: boolean;
  secondaryValueFormatter?: (value: number) => string;
  secondaryValueLabel?: string;
  primaryLineColor?: string;
  secondaryLineColor?: string;
}

const CHART_DIMENSIONS = {
  mini: { width: 240, height: 120, padding: 20, leftPadding: 25, rightPadding: 25 },
  medium: { width: 450, height: 260, padding: 30, leftPadding: 40, rightPadding: 40 },
  large: { width: 700, height: 300, padding: 30, leftPadding: 50, rightPadding: 60 },
};

/**
 * Unified time series chart component with dual y-axis support
 * Replaces MiniRateChart, SreUsdAprChart, and SimpleLineChart
 * Reduces 876 lines of duplicated code to single reusable component
 */
export function TimeSeriesChart({
  data,
  size = "large",
  lineStyle = "continuous",
  enableHover = false,
  valueFormatter = (v) => v.toFixed(2),
  valueLabel = "Value",
  showGrid = false,
  secondaryValueFormatter = (v) => v.toFixed(2),
  secondaryValueLabel = "Secondary Value",
  primaryLineColor = "black",
  secondaryLineColor = "#3182ce",
}: TimeSeriesChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<(TimeSeriesDataPoint & {
    x: number;
    y: number;
    secondaryY?: number;
  }) | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length === 0) {
    return (
      <Box
        p={4}
        textAlign="center"
        color="gray.500"
        fontFamily="monospace"
        fontSize={size === "mini" ? "10px" : "14px"}
      >
        No chart data
      </Box>
    );
  }

  const dims = CHART_DIMENSIONS[size];
  const { width, height, padding, leftPadding, rightPadding } = dims;
  const chartWidth = width - leftPadding - rightPadding;
  const chartHeight = height - 2 * padding;

  // Sort and normalize data
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Primary axis (left)
  const values = sortedData.map((d) => d.value);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values);
  const step = Math.max(1, Math.ceil(maxValue / 5));
  const displayMax = Math.ceil(maxValue / step) * step;
  const displayRange = displayMax - minValue;

  // Secondary axis (right) - check if we have secondary data
  const hasSecondaryData = sortedData.some((d) => d.secondaryValue !== undefined);
  let secondaryValues: number[] = [];
  let minSecondaryValue = 0;
  let maxSecondaryValue = 0;
  let secondaryStep = 1;
  let displayMaxSecondary = 0;
  let displayRangeSecondary = 0;

  if (hasSecondaryData) {
    secondaryValues = sortedData
      .map((d) => d.secondaryValue)
      .filter((v): v is number => v !== undefined);
    minSecondaryValue = Math.min(...secondaryValues, 0);
    maxSecondaryValue = Math.max(...secondaryValues);
    secondaryStep = Math.max(1, Math.ceil(maxSecondaryValue / 5));
    displayMaxSecondary = Math.ceil(maxSecondaryValue / secondaryStep) * secondaryStep;
    displayRangeSecondary = displayMaxSecondary - minSecondaryValue;
  }

  // Generate primary SVG path
  const generatePrimaryPath = () => {
    if (sortedData.length === 0) return "";

    const pathSegments: string[] = [];

    for (let i = 0; i < sortedData.length; i++) {
      const point = sortedData[i];
      const x = leftPadding + (i / Math.max(sortedData.length - 1, 1)) * chartWidth;

      let normalizedValue;
      if (displayRange > 0) {
        normalizedValue = (point.value - minValue) / displayRange;
      } else {
        normalizedValue = 0.5;
      }
      const y = height - padding - normalizedValue * chartHeight;

      if (i === 0) {
        pathSegments.push(`M ${x},${y}`);
      } else if (lineStyle === "step" && i > 0) {
        const prevY = height - padding - ((sortedData[i - 1].value - minValue) / displayRange) * chartHeight;
        pathSegments.push(`L ${x},${prevY}`);
        pathSegments.push(`L ${x},${y}`);
      } else {
        pathSegments.push(`L ${x},${y}`);
      }
    }

    return pathSegments.join(" ");
  };

  // Generate secondary SVG path
  const generateSecondaryPath = () => {
    if (!hasSecondaryData || sortedData.length === 0) return "";

    const pathSegments: string[] = [];

    for (let i = 0; i < sortedData.length; i++) {
      const point = sortedData[i];
      if (point.secondaryValue === undefined) continue;

      const x = leftPadding + (i / Math.max(sortedData.length - 1, 1)) * chartWidth;

      let normalizedValue;
      if (displayRangeSecondary > 0) {
        normalizedValue = (point.secondaryValue - minSecondaryValue) / displayRangeSecondary;
      } else {
        normalizedValue = 0.5;
      }
      const y = height - padding - normalizedValue * chartHeight;

      if (pathSegments.length === 0) {
        pathSegments.push(`M ${x},${y}`);
      } else {
        pathSegments.push(`L ${x},${y}`);
      }
    }

    return pathSegments.join(" ");
  };

  // Generate date ticks
  const generateDateTicks = () => {
    if (sortedData.length === 0) return [];

    const ticks: { x: number; label: string }[] = [];
    const startTime = sortedData[0].timestamp;
    const endTime = sortedData[sortedData.length - 1].timestamp;
    const timeRange = endTime - startTime;

    // Get unique dates
    const uniqueDates = new Set<string>();
    sortedData.forEach((point) => {
      const date = new Date(point.timestamp * 1000);
      const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
      uniqueDates.add(dateStr);
    });

    const dateArray = Array.from(uniqueDates);
    const indices = [0, Math.floor(dateArray.length / 2), dateArray.length - 1];

    indices.forEach((idx) => {
      if (idx < dateArray.length) {
        const dateStr = dateArray[idx];
        const samplePoint = sortedData.find((p) => {
          const d = new Date(p.timestamp * 1000);
          return `${d.getUTCMonth() + 1}/${d.getUTCDate()}` === dateStr;
        });

        if (samplePoint) {
          const date = new Date(samplePoint.timestamp * 1000);
          const midnight = new Date(
            Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
          );
          const midnightTs = midnight.getTime() / 1000;
          const timeProgress = (midnightTs - startTime) / timeRange;
          const x = leftPadding + Math.max(0, Math.min(1, timeProgress)) * chartWidth;
          ticks.push({ x, label: dateStr });
        }
      }
    });

    return ticks;
  };

  // Generate primary value ticks (left axis)
  const generateValueTicks = () => {
    const ticks: { y: number; label: string }[] = [];
    const values = [0, displayMax];

    if (displayMax > 0) {
      const step = displayMax <= 5 ? 1 : Math.max(1, Math.ceil(displayMax / 5));
      for (let val = step; val < displayMax; val += step) {
        values.push(val);
      }
      values.sort((a, b) => a - b);
    }

    for (const val of values) {
      const normalizedVal = displayRange > 0 ? (val - minValue) / displayRange : 0.5;
      const y = height - padding - normalizedVal * chartHeight;
      ticks.push({ y, label: valueFormatter(val) });
    }

    return ticks;
  };

  // Generate secondary value ticks (right axis)
  const generateSecondaryValueTicks = () => {
    if (!hasSecondaryData) return [];

    const ticks: { y: number; label: string }[] = [];
    const values = [0, displayMaxSecondary];

    if (displayMaxSecondary > 0) {
      const step = displayMaxSecondary <= 5 ? 1 : Math.max(1, Math.ceil(displayMaxSecondary / 5));
      for (let val = step; val < displayMaxSecondary; val += step) {
        values.push(val);
      }
      values.sort((a, b) => a - b);
    }

    for (const val of values) {
      const normalizedVal = displayRangeSecondary > 0 ? (val - minSecondaryValue) / displayRangeSecondary : 0.5;
      const y = height - padding - normalizedVal * chartHeight;
      ticks.push({ y, label: secondaryValueFormatter(val) });
    }

    return ticks;
  };

  const primaryPath = generatePrimaryPath();
  const secondaryPath = generateSecondaryPath();
  const dateTicks = generateDateTicks();
  const valueTicks = generateValueTicks();
  const secondaryValueTicks = generateSecondaryValueTicks();

  // Mouse event handlers for hover
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!enableHover || !svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    if (mouseX >= leftPadding && mouseX <= width - rightPadding) {
      const dataIndex = Math.round(
        ((mouseX - leftPadding) / chartWidth) * (sortedData.length - 1)
      );
      const point = sortedData[Math.max(0, Math.min(dataIndex, sortedData.length - 1))];

      if (point) {
        const x = leftPadding + (dataIndex / Math.max(sortedData.length - 1, 1)) * chartWidth;

        // Calculate primary y
        let normalizedValue;
        if (displayRange > 0) {
          normalizedValue = (point.value - minValue) / displayRange;
        } else {
          normalizedValue = 0.5;
        }
        const y = height - padding - normalizedValue * chartHeight;

        // Calculate secondary y if exists
        let secondaryY: number | undefined;
        if (point.secondaryValue !== undefined && displayRangeSecondary > 0) {
          const normalizedSecondary = (point.secondaryValue - minSecondaryValue) / displayRangeSecondary;
          secondaryY = height - padding - normalizedSecondary * chartHeight;
        }

        setHoveredPoint({ ...point, x, y, secondaryY });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  const fontSize = size === "mini" ? "8px" : size === "medium" ? "10px" : "12px";
  const strokeWidth = size === "mini" ? "1.5" : "2";

  return (
    <Box
      bg="white"
      borderRadius={designTokens.borderRadius.button}
      p={size === "mini" ? 1 : 4}
      position="relative"
      transition={designTokens.transitions.fast}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: "white" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Grid lines */}
        {showGrid && valueTicks.map((tick, i) => (
          <line
            key={`grid-${i}`}
            x1={leftPadding}
            y1={tick.y}
            x2={width - rightPadding}
            y2={tick.y}
            stroke="#E5E5E5"
            strokeWidth="1"
            opacity="0.4"
            strokeDasharray="2,2"
          />
        ))}

        {/* Primary value labels (left) */}
        {valueTicks.map((tick, i) => (
          <text
            key={`left-${i}`}
            x={leftPadding - 10}
            y={tick.y + 4}
            fontSize={fontSize}
            fontFamily="monospace"
            textAnchor="end"
            fill="black"
          >
            {tick.label}
          </text>
        ))}

        {/* Secondary value labels (right) */}
        {hasSecondaryData && secondaryValueTicks.map((tick, i) => (
          <text
            key={`right-${i}`}
            x={width - rightPadding + 10}
            y={tick.y + 4}
            fontSize={fontSize}
            fontFamily="monospace"
            textAnchor="start"
            fill="black"
          >
            {tick.label}
          </text>
        ))}

        {/* Y-axis labels */}
        <text
          x={leftPadding - 10}
          y={padding - 10}
          fontSize="11px"
          fontFamily="monospace"
          textAnchor="end"
          fill="black"
          fontWeight="600"
        >
          {valueLabel}
        </text>
        {hasSecondaryData && (
          <text
            x={width - rightPadding + 10}
            y={padding - 10}
            fontSize="11px"
            fontFamily="monospace"
            textAnchor="start"
            fill="black"
            fontWeight="600"
          >
            {secondaryValueLabel}
          </text>
        )}

        {/* Primary chart line */}
        <path
          d={primaryPath}
          stroke={primaryLineColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Secondary chart line */}
        {hasSecondaryData && (
          <path
            d={secondaryPath}
            stroke={secondaryLineColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* X-axis */}
        <line
          x1={leftPadding}
          y1={height - padding}
          x2={width - rightPadding}
          y2={height - padding}
          stroke="#666666"
          strokeWidth="1.5"
        />

        {/* Date labels */}
        {dateTicks.map((tick, i) => (
          <g key={i}>
            <text
              x={tick.x}
              y={height - padding + (size === "mini" ? 10 : 15)}
              fontSize={fontSize}
              fontFamily="monospace"
              textAnchor="middle"
              fill="black"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Hover indicators */}
        {hoveredPoint && (
          <g>
            <line
              x1={hoveredPoint.x}
              y1={padding}
              x2={hoveredPoint.x}
              y2={height - padding}
              stroke="#64748b"
              strokeWidth="1"
              strokeDasharray="4,4"
              opacity="0.6"
            />
            {/* Primary value circle */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="5"
              fill={primaryLineColor}
              stroke="white"
              strokeWidth="2"
            />
            {/* Secondary value circle */}
            {hoveredPoint.secondaryY !== undefined && (
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.secondaryY}
                r="5"
                fill={secondaryLineColor}
                stroke="white"
                strokeWidth="2"
              />
            )}
            {/* Tooltip */}
            <rect
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 160 : hoveredPoint.x + 10}
              y={hoveredPoint.y - 60}
              width="150"
              height={hasSecondaryData ? "56" : "40"}
              fill="white"
              stroke="black"
              strokeWidth="1.5"
              rx="4"
            />
            <text
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 85 : hoveredPoint.x + 85}
              y={hoveredPoint.y - 40}
              fontSize="11px"
              fontFamily="monospace"
              textAnchor="middle"
              fill="#475569"
            >
              {new Date(hoveredPoint.timestamp * 1000).toLocaleDateString()}
            </text>
            <text
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 85 : hoveredPoint.x + 85}
              y={hoveredPoint.y - 24}
              fontSize="12px"
              fontFamily="monospace"
              textAnchor="middle"
              fill={primaryLineColor}
            >
              <tspan fontWeight="bold">{valueLabel}:</tspan> {valueFormatter(hoveredPoint.value)}
            </text>
            {hoveredPoint.secondaryValue !== undefined && (
              <text
                x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 85 : hoveredPoint.x + 85}
                y={hoveredPoint.y - 8}
                fontSize="12px"
                fontFamily="monospace"
                textAnchor="middle"
                fill={secondaryLineColor}
              >
                <tspan fontWeight="bold">{secondaryValueLabel}:</tspan> {secondaryValueFormatter(hoveredPoint.secondaryValue)}
              </text>
            )}
          </g>
        )}
      </svg>
    </Box>
  );
}
