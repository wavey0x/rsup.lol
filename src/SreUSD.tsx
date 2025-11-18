import { useState, useEffect, useRef } from "react";
import {
  Box,
  Container,
  Text,
  Flex,
  Stack,
  Spinner,
  Center,
  ChakraProvider,
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { customTheme } from "./theme";

// Full-size sreUSD APR Chart component
function SreUsdAprChart({ data }: { data: Array<{timestamp: number, apr: number}> }) {
  const [hoveredPoint, setHoveredPoint] = useState<{timestamp: number, apr: number, x: number, y: number} | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  if (!data || data.length === 0) {
    return (
      <Box
        p={4}
        textAlign="center"
        color="gray.500"
        fontFamily="monospace"
        fontSize="14px"
      >
        No chart data available
      </Box>
    );
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Convert decimal APRs to percentages (0.095773552468 -> 9.58%)
  const aprs = sortedData.map((d) => Number(d.apr) * 100 || 0);
  const minApr = 0;
  const maxApr = Math.max(...aprs);

  // Calculate the display range
  const step = Math.max(1, Math.ceil(maxApr / 5));
  const displayMax = Math.ceil(maxApr / step) * step;
  const aprRange = displayMax - minApr;

  // Chart dimensions - larger for main view
  const width = 700;
  const height = 300;
  const padding = 30;
  const leftPadding = 50;
  const chartWidth = width - leftPadding - padding;
  const chartHeight = height - 2 * padding;

  // Generate path for line chart
  const createPath = () => {
    if (sortedData.length === 0) return "";

    const pathSegments: string[] = [];

    for (let i = 0; i < sortedData.length; i++) {
      const point = sortedData[i];
      const x =
        leftPadding + (i / Math.max(sortedData.length - 1, 1)) * chartWidth;

      let normalizedApr;
      if (aprRange > 0) {
        const aprPercent = Number(point.apr) * 100;
        normalizedApr = (aprPercent - minApr) / aprRange;
      } else {
        normalizedApr = 0.5;
      }
      const y = height - padding - normalizedApr * chartHeight;

      if (i === 0) {
        pathSegments.push(`M ${x},${y}`);
      } else {
        pathSegments.push(`L ${x},${y}`);
      }
    }

    return pathSegments.join(" ");
  };

  const pathData = createPath();

  // Generate date ticks
  const generateDateTicks = () => {
    if (sortedData.length === 0) return [];

    const ticks: { x: number; label: string }[] = [];
    const startTime = sortedData[0].timestamp;
    const endTime = sortedData[sortedData.length - 1].timestamp;
    const timeRange = endTime - startTime;

    // Get unique dates from the data
    const uniqueDates = new Set<string>();
    sortedData.forEach((point) => {
      const date = new Date(point.timestamp * 1000);
      const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
      uniqueDates.add(dateStr);
    });

    // Generate ticks for start, middle, and end dates
    const dateArray = Array.from(uniqueDates) as string[];
    const indices = [0, Math.floor(dateArray.length / 2), dateArray.length - 1];

    indices.forEach((idx) => {
      if (idx < dateArray.length) {
        const dateStr = dateArray[idx];

        // Find the midnight timestamp for this date
        const samplePoint = sortedData.find((p) => {
          const d = new Date(p.timestamp * 1000);
          return `${d.getUTCMonth() + 1}/${d.getUTCDate()}` === dateStr;
        });

        if (samplePoint) {
          const date = new Date(samplePoint.timestamp * 1000);
          // Calculate midnight of this date
          const midnight = new Date(
            Date.UTC(
              date.getUTCFullYear(),
              date.getUTCMonth(),
              date.getUTCDate()
            )
          );
          const midnightTs = midnight.getTime() / 1000;

          // Position the notch based on where midnight falls in our time range
          const timeProgress = (midnightTs - startTime) / timeRange;
          const x =
            leftPadding + Math.max(0, Math.min(1, timeProgress)) * chartWidth;

          ticks.push({ x, label: dateStr });
        }
      }
    });

    return ticks;
  };

  const dateTicks = generateDateTicks();

  // Generate APR ticks
  const generateAprTicks = () => {
    const ticks: { y: number; label: string }[] = [];

    // Always show 0% and the actual peak value
    const values = [0, displayMax];

    // Add intermediate ticks for better readability
    if (displayMax > 0) {
      const step = displayMax <= 5 ? 1 : Math.max(1, Math.ceil(displayMax / 5));
      for (let apr = step; apr < displayMax; apr += step) {
        values.push(apr);
      }
      values.sort((a, b) => a - b);
    }

    for (const apr of values) {
      const normalizedApr = aprRange > 0 ? (apr - minApr) / aprRange : 0.5;
      const y = height - padding - normalizedApr * chartHeight;
      const label = `${apr.toFixed(1)}%`;
      ticks.push({ y, label });
    }

    return ticks;
  };

  const aprTicks = generateAprTicks();

  // Mouse event handlers for tooltip
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current) return;

    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;

    // Find closest data point
    if (mouseX >= leftPadding && mouseX <= width - padding) {
      const dataIndex = Math.round(((mouseX - leftPadding) / chartWidth) * (sortedData.length - 1));
      const point = sortedData[Math.max(0, Math.min(dataIndex, sortedData.length - 1))];

      if (point) {
        const x = leftPadding + (dataIndex / Math.max(sortedData.length - 1, 1)) * chartWidth;
        let normalizedApr;
        if (aprRange > 0) {
          const aprPercent = Number(point.apr) * 100;
          normalizedApr = (aprPercent - minApr) / aprRange;
        } else {
          normalizedApr = 0.5;
        }
        const y = height - padding - normalizedApr * chartHeight;

        setHoveredPoint({ ...point, x, y });
      }
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <Box bg="white" borderRadius="8px" p={4} border="1px solid" borderColor="gray.200" position="relative">
      <svg
        ref={svgRef}
        width={width}
        height={height}
        style={{ background: "white" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* APR labels */}
        {aprTicks.map((tick, i) => (
          <text
            key={i}
            x={leftPadding - 10}
            y={tick.y + 4}
            fontSize="12px"
            fontFamily="monospace"
            textAnchor="end"
            fill="#475569"
          >
            {tick.label}
          </text>
        ))}

        {/* Chart line */}
        <path
          d={pathData}
          stroke="black"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Axes */}
        <line
          x1={leftPadding}
          y1={height - padding}
          x2={width - padding}
          y2={height - padding}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />
        <line
          x1={leftPadding}
          y1={padding}
          x2={leftPadding}
          y2={height - padding}
          stroke="#94a3b8"
          strokeWidth="1.5"
        />

        {/* Date labels with notches */}
        {dateTicks.map((tick, i) => (
          <g key={i}>
            {/* Small notch marking midnight for this date */}
            <line
              x1={tick.x}
              y1={height - padding}
              x2={tick.x}
              y2={height - padding + 8}
              stroke="#475569"
              strokeWidth="1.5"
            />
            {/* Date label */}
            <text
              x={tick.x}
              y={height - padding + 22}
              fontSize="12px"
              fontFamily="monospace"
              textAnchor="middle"
              fill="#475569"
            >
              {tick.label}
            </text>
          </g>
        ))}

        {/* Hover indicators */}
        {hoveredPoint && (
          <g>
            {/* Vertical line at hovered point */}
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
            {/* Circle marker at data point */}
            <circle
              cx={hoveredPoint.x}
              cy={hoveredPoint.y}
              r="5"
              fill="black"
              stroke="white"
              strokeWidth="2"
            />
            {/* Tooltip background */}
            <rect
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 140 : hoveredPoint.x + 10}
              y={hoveredPoint.y - 45}
              width="130"
              height="40"
              fill="white"
              stroke="black"
              strokeWidth="1.5"
              rx="4"
            />
            {/* Tooltip text - Date */}
            <text
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 75 : hoveredPoint.x + 75}
              y={hoveredPoint.y - 25}
              fontSize="11px"
              fontFamily="monospace"
              textAnchor="middle"
              fill="#475569"
            >
              {new Date(hoveredPoint.timestamp * 1000).toLocaleDateString()}
            </text>
            {/* Tooltip text - APR */}
            <text
              x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 75 : hoveredPoint.x + 75}
              y={hoveredPoint.y - 10}
              fontSize="13px"
              fontFamily="monospace"
              fontWeight="bold"
              textAnchor="middle"
              fill="black"
            >
              APR: {(hoveredPoint.apr * 100).toFixed(2)}%
            </text>
          </g>
        )}
      </svg>
    </Box>
  );
}

function SreUSD() {
  const [sreusdData, setSreusdData] = useState<Array<{block: number, timestamp: number, rate: number, apr: number}>>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(null);
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://raw.githubusercontent.com/wavey0x/open-data/master/resupply_market_data.json"
      );

      // Set last update from API if available
      if (response.data.last_update) {
        setLastUpdateFromApi(response.data.last_update);
        const ts = Number(response.data.last_update);
        if (!isNaN(ts) && ts > 1000000000) {
          setLastUpdateDate(new Date(ts * 1000));
        } else {
          setLastUpdateDate(null);
        }
      }

      // Parse sreUSD data if available
      if (response.data?.data?.sreusd && Array.isArray(response.data.data.sreusd)) {
        const sreusdArray = response.data.data.sreusd.map((entry: any) => ({
          block: Number(entry.block) || 0,
          timestamp: Number(entry.timestamp) || 0,
          rate: Number(entry.rate) || 0,
          apr: Number(entry.apr) || 0,
        }));
        setSreusdData(sreusdArray);
      }

      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error("Error fetching sreUSD data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch sreUSD data"
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  return (
    <ChakraProvider theme={customTheme}>
      <Container
        maxW="container.xl"
        py={4}
        minH="100vh"
        pt={24}
        mt={8}
        px={2}
        mx="auto"
      >
        <Flex justify="center" mb={2} direction="column" align="center">
          <Box
            display="inline-block"
            w={{ base: "100%", md: "740px" }}
            border="1px solid black"
            borderRadius="16px"
            overflow="hidden"
            bg="white"
            p={6}
            sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
          >
            {error ? (
              <Text fontFamily="monospace" textAlign="center" color="red.500">
                Error: {error}
              </Text>
            ) : isLoading ? (
              <Center py={8}>
                <Spinner size="xl" />
              </Center>
            ) : sreusdData.length === 0 ? (
              <Text fontFamily="monospace" textAlign="center" color="gray.500">
                No sreUSD data available
              </Text>
            ) : (
              <Stack spacing={6}>
                {/* Current APR Display */}
                <Box textAlign="center">
                  <Text
                    fontSize="sm"
                    fontFamily="monospace"
                    color="gray.600"
                    mb={2}
                  >
                    Current APR
                  </Text>
                  <Text
                    fontSize="4xl"
                    fontFamily="monospace"
                    fontWeight="bold"
                    color="green.500"
                  >
                    {(sreusdData[sreusdData.length - 1].apr * 100).toFixed(2)}%
                  </Text>
                </Box>

                {/* Historical Chart */}
                <Box>
                  <Text
                    fontSize="sm"
                    fontFamily="monospace"
                    color="gray.600"
                    mb={3}
                    textAlign="center"
                  >
                    Historical APR
                  </Text>
                  <Flex justify="center">
                    <SreUsdAprChart data={sreusdData} />
                  </Flex>
                </Box>
              </Stack>
            )}
          </Box>
        </Flex>

        {/* Last updated footer */}
        <Box
          position="fixed"
          bottom={0}
          left={0}
          right={0}
          bg="gray.100"
          p={1}
          textAlign="center"
        >
          <Text fontSize="xs" color="gray.600" fontFamily="monospace">
            Last updated:{" "}
            {lastUpdateDate
              ? formatDistanceToNow(lastUpdateDate, { addSuffix: true })
              : lastUpdateFromApi ||
                formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </Text>
        </Box>
      </Container>
    </ChakraProvider>
  );
}

export default SreUSD;
