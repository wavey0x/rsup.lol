import { Box, Text, Flex, Stack, HStack, Button, Table, Thead, Tbody, Tr, Th, Td, Tooltip } from "@chakra-ui/react";
import { InfoOutlineIcon } from "@chakra-ui/icons";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { PageContainer } from "./components/layout/PageContainer";
import { PageFooter } from "./components/layout/PageFooter";
import { LoadingState } from "./components/ui/LoadingState";
import { ErrorState } from "./components/ui/ErrorState";
import { designTokens } from "./theme";

interface IncentiveDataPoint {
  block_number: number;
  date_str: string;
  epoch: number;
  timestamp: number;
  total_incentives: number;
  votemarket_amount: number;
  votemarket_votes: number;
  votemarket_votes_per_usd: number;
  votium_amount: number;
  votium_votes: number;
  votium_votes_per_usd: number;
}

interface IncentiveApiResponse {
  data: IncentiveDataPoint[];
  success: boolean;
}

/**
 * Incentives Page - Displays voting efficiency over time for Votium vs VoteMarket
 * Shows votes per token spent on each platform
 */
function Incentives() {
  const [data, setData] = useState<IncentiveDataPoint[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  
  // State for hover
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    votiumY: number;
    voteMarketY: number;
    dataPoint: IncentiveDataPoint;
  } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  
  // State for epoch navigation (0 = most recent)
  const [selectedEpochIndex, setSelectedEpochIndex] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<IncentiveApiResponse>(
          "https://api.wavey.info/api/resupply/incentive_report?protocol=resupply"
        );

        if (response.data.success && response.data.data) {
          // Sort by timestamp ascending (oldest to newest)
          const sortedData = [...response.data.data].sort(
            (a, b) => a.timestamp - b.timestamp
          );
          setData(sortedData);
          setLastUpdated(new Date());
          setError(null);
        } else {
          setError("Invalid response from API");
        }
      } catch (err) {
        console.error("Error fetching incentive data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch incentive data"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calculate efficiency values
  const votiumEfficiencies = data?.map((d) => 
    d.votium_amount > 0 ? d.votium_votes / d.votium_amount : 0
  ) || [];
  
  const voteMarketEfficiencies = data?.map((d) => 
    d.votemarket_amount > 0 ? d.votemarket_votes / d.votemarket_amount : 0
  ) || [];

  // Get the selected epoch data (reverse index since data is sorted oldest to newest)
  const selectedEpochData = data && data.length > 0 
    ? data[data.length - 1 - selectedEpochIndex] 
    : null;

  const currentVotiumEfficiency =
    selectedEpochData && selectedEpochData.votium_amount > 0
      ? (selectedEpochData.votium_votes / selectedEpochData.votium_amount).toFixed(2)
      : "0.00";

  const currentVoteMarketEfficiency =
    selectedEpochData && selectedEpochData.votemarket_amount > 0
      ? (selectedEpochData.votemarket_votes / selectedEpochData.votemarket_amount).toFixed(2)
      : "0.00";

  const currentEpoch = selectedEpochData ? selectedEpochData.epoch : 0;
  const totalEpochs = data ? data.length : 0;
  
  const handlePrevEpoch = () => {
    if (selectedEpochIndex < totalEpochs - 1) {
      setSelectedEpochIndex(selectedEpochIndex + 1);
    }
  };
  
  const handleNextEpoch = () => {
    if (selectedEpochIndex > 0) {
      setSelectedEpochIndex(selectedEpochIndex - 1);
    }
  };

  // Render custom chart with single Y-axis
  const renderChart = () => {
    if (!data || data.length === 0) return null;

    const width = 380;
    const height = 280;
    const padding = 30;
    const leftPadding = 50;
    const rightPadding = 20;
    const bottomPadding = 50;
    const chartWidth = width - leftPadding - rightPadding;
    const chartHeight = height - padding - bottomPadding;

    // Calculate unified scale for both lines
    const allValues = [...votiumEfficiencies, ...voteMarketEfficiencies];
    const minValue = 0;
    const maxValue = Math.max(...allValues);
    
    // Round to nice numbers - round up to nearest 100 for tighter fit
    const niceMax = Math.ceil(maxValue / 100) * 100;
    const displayRange = niceMax - minValue;

    // Generate Y-axis ticks with round numbers
    // Helper to format numbers with k abbreviation
    const formatYAxisLabel = (value: number): string => {
      if (value === 0) return "0";
      if (value >= 1000) {
        const k = value / 1000;
        return k % 1 === 0 ? `${k}k` : `${k.toFixed(1)}k`;
      }
      return value.toString();
    };
    
    const yTicks: { y: number; label: string }[] = [];
    const tickCount = 4;
    const tickStep = niceMax / tickCount;
    
    for (let i = 0; i <= tickCount; i++) {
      const value = i * tickStep;
      const normalizedVal = displayRange > 0 ? (value - minValue) / displayRange : 0.5;
      const y = height - bottomPadding - normalizedVal * chartHeight;
      yTicks.push({ y, label: formatYAxisLabel(value) });
    }

    // Generate X-axis date ticks
    const xTicks: { x: number; label: string }[] = [];
    const dateIndices = [0, Math.floor(data.length / 2), data.length - 1];
    
    dateIndices.forEach((idx) => {
      if (idx < data.length) {
        const point = data[idx];
        const date = new Date(point.timestamp * 1000);
        const dateStr = `${date.getUTCMonth() + 1}/${date.getUTCDate()}`;
        const x = leftPadding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
        xTicks.push({ x, label: dateStr });
      }
    });

    // Generate paths
    const generatePath = (efficiencies: number[]) => {
      const pathSegments: string[] = [];
      
      for (let i = 0; i < data.length; i++) {
        const value = efficiencies[i];
        const x = leftPadding + (i / Math.max(data.length - 1, 1)) * chartWidth;
        const normalizedValue = displayRange > 0 ? (value - minValue) / displayRange : 0.5;
        const y = height - bottomPadding - normalizedValue * chartHeight;
        
        if (i === 0) {
          pathSegments.push(`M ${x},${y}`);
        } else {
          pathSegments.push(`L ${x},${y}`);
        }
      }
      
      return pathSegments.join(" ");
    };

    const votiumPath = generatePath(votiumEfficiencies);
    const voteMarketPath = generatePath(voteMarketEfficiencies);

    // Mouse event handlers
    const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;

      if (mouseX >= leftPadding && mouseX <= width - rightPadding) {
        const dataIndex = Math.round(
          ((mouseX - leftPadding) / chartWidth) * (data.length - 1)
        );
        const idx = Math.max(0, Math.min(dataIndex, data.length - 1));
        const point = data[idx];

        const x = leftPadding + (idx / Math.max(data.length - 1, 1)) * chartWidth;
        
        // Calculate Y positions
        const votiumEfficiency = votiumEfficiencies[idx];
        const voteMarketEfficiency = voteMarketEfficiencies[idx];
        
        const votiumNormalized = displayRange > 0 ? (votiumEfficiency - minValue) / displayRange : 0.5;
        const votiumY = height - bottomPadding - votiumNormalized * chartHeight;
        
        const voteMarketNormalized = displayRange > 0 ? (voteMarketEfficiency - minValue) / displayRange : 0.5;
        const voteMarketY = height - bottomPadding - voteMarketNormalized * chartHeight;

        setHoveredPoint({
          index: idx,
          x,
          votiumY,
          voteMarketY,
          dataPoint: point,
        });
      }
    };

    const handleMouseLeave = () => {
      setHoveredPoint(null);
    };

    return (
      <Box>
        <svg
          ref={svgRef}
          width={width}
          height={height}
          style={{ background: "white" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >

          {/* Y-axis ticks and labels */}
          {yTicks.map((tick, i) => (
            <g key={`y-${i}`}>
              <line
                x1={leftPadding - 5}
                y1={tick.y}
                x2={leftPadding}
                y2={tick.y}
                stroke="black"
                strokeWidth="1"
              />
              <text
                x={leftPadding - 10}
                y={tick.y + 4}
                fontSize="10px"
                fontFamily="monospace"
                textAnchor="end"
                fill="black"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Y-axis line */}
          <line
            x1={leftPadding}
            y1={padding}
            x2={leftPadding}
            y2={height - bottomPadding}
            stroke="black"
            strokeWidth="1.5"
          />

          {/* X-axis line */}
          <line
            x1={leftPadding}
            y1={height - bottomPadding}
            x2={width - rightPadding}
            y2={height - bottomPadding}
            stroke="black"
            strokeWidth="1.5"
          />

          {/* X-axis ticks and labels */}
          {xTicks.map((tick, i) => (
            <g key={`x-${i}`}>
              <line
                x1={tick.x}
                y1={height - bottomPadding}
                x2={tick.x}
                y2={height - bottomPadding + 5}
                stroke="black"
                strokeWidth="1"
              />
              <text
                x={tick.x}
                y={height - bottomPadding + 18}
                fontSize="10px"
                fontFamily="monospace"
                textAnchor="middle"
                fill="black"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* VoteMarket line (dark gray) - render first so it's behind */}
          <path
            d={voteMarketPath}
            stroke="#262626"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Votium line (light gray) - render second so it's on top */}
          <path
            d={votiumPath}
            stroke="#A3A3A3"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Hover indicators */}
          {hoveredPoint && (
            <g>
              {/* Vertical line */}
              <line
                x1={hoveredPoint.x}
                y1={padding}
                x2={hoveredPoint.x}
                y2={height - bottomPadding}
                stroke="#64748b"
                strokeWidth="1"
                strokeDasharray="4,4"
                opacity="0.6"
              />
              
              {/* VoteMarket circle */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.voteMarketY}
                r="4"
                fill="#262626"
                stroke="white"
                strokeWidth="2"
              />
              
              {/* Votium circle */}
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.votiumY}
                r="4"
                fill="#A3A3A3"
                stroke="white"
                strokeWidth="2"
              />

              {/* Tooltip */}
              <g>
                <rect
                  x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 150 : hoveredPoint.x + 10}
                  y={padding + 10}
                  width="140"
                  height="70"
                  fill="white"
                  stroke="black"
                  strokeWidth="1.5"
                  rx="4"
                />
                
                {/* Date */}
                <text
                  x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 80 : hoveredPoint.x + 80}
                  y={padding + 25}
                  fontSize="10px"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fill="gray"
                  fontWeight="600"
                >
                  {new Date(hoveredPoint.dataPoint.timestamp * 1000).toLocaleDateString()} (E{hoveredPoint.dataPoint.epoch})
                </text>
                
                {/* Votium data */}
                <text
                  x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 140 : hoveredPoint.x + 20}
                  y={padding + 45}
                  fontSize="10px"
                  fontFamily="monospace"
                  fill="#A3A3A3"
                  fontWeight="600"
                >
                  Votium: {(hoveredPoint.dataPoint.votium_votes / hoveredPoint.dataPoint.votium_amount).toFixed(2)}
                </text>
                
                {/* VoteMarket data */}
                <text
                  x={hoveredPoint.x > width / 2 ? hoveredPoint.x - 140 : hoveredPoint.x + 20}
                  y={padding + 65}
                  fontSize="10px"
                  fontFamily="monospace"
                  fill="#262626"
                  fontWeight="600"
                >
                  VoteMarket: {(hoveredPoint.dataPoint.votemarket_votes / hoveredPoint.dataPoint.votemarket_amount).toFixed(2)}
                </text>
              </g>
            </g>
          )}
        </svg>

        {/* Legend */}
        <HStack spacing={6} justify="center" mt={2}>
          <HStack spacing={2}>
            <Box w="20px" h="2px" bg="#A3A3A3" />
            <Text fontSize="xs" fontFamily="monospace" color="gray.600">
              Votium
            </Text>
          </HStack>
          <HStack spacing={2}>
            <Box w="20px" h="2px" bg="#262626" />
            <Text fontSize="xs" fontFamily="monospace" color="gray.600">
              VoteMarket
            </Text>
          </HStack>
        </HStack>
      </Box>
    );
  };

  return (
    <PageContainer maxWidth="wide">
      <Flex
        justify="center"
        mb={2}
        direction="column"
        align="center"
        px={{ base: 2, md: 0 }}
      >
        <Box
          w={{ base: "100%", md: "470px" }}
          border="1px solid black"
          borderRadius={designTokens.borderRadius.card}
          overflow="hidden"
          bg="white"
          px={2}
          py={3}
          boxShadow={designTokens.shadows.card}
          transition={designTokens.transitions.fast}
        >
          {error ? (
            <ErrorState message={error} />
          ) : isLoading ? (
            <LoadingState />
          ) : !data || data.length === 0 ? (
            <Text fontFamily="monospace" textAlign="center" color="gray.500">
              No incentive data available
            </Text>
          ) : (
            <Stack spacing={designTokens.spacing.sectionGap}>
              {/* Current Metrics Display - Tabular Format */}
              <Box textAlign="center" mb={2}>
                {/* Epoch Navigation */}
                <Flex justify="center" align="center" gap={3} mb={2}>
                  <Button
                    size="xs"
                    onClick={handlePrevEpoch}
                    isDisabled={selectedEpochIndex >= totalEpochs - 1}
                    fontFamily="monospace"
                    variant="ghost"
                    minW="auto"
                    px={2}
                    transition={designTokens.transitions.fast}
                    bg="transparent"
                    _hover={{
                      bg: "transparent",
                      textDecoration: "underline",
                    }}
                    _disabled={{
                      opacity: 0.3,
                      cursor: "not-allowed",
                    }}
                    _active={{
                      bg: "transparent",
                    }}
                  >
                    {"<"}
                  </Button>
                  
                  <Text
                    fontSize="xs"
                    fontFamily="monospace"
                    color="black"
                    minW="100px"
                    textAlign="center"
                    fontWeight="500"
                  >
                    Epoch {currentEpoch}
                  </Text>
                  
                  <Button
                    size="xs"
                    onClick={handleNextEpoch}
                    isDisabled={selectedEpochIndex === 0}
                    fontFamily="monospace"
                    variant="ghost"
                    minW="auto"
                    px={2}
                    transition={designTokens.transitions.fast}
                    bg="transparent"
                    _hover={{
                      bg: "transparent",
                      textDecoration: "underline",
                    }}
                    _disabled={{
                      opacity: 0.3,
                      cursor: "not-allowed",
                    }}
                    _active={{
                      bg: "transparent",
                    }}
                  >
                    {">"}
                  </Button>
                </Flex>
                
                <Box maxW={{ base: "280px", md: "320px" }} mx="auto">
                  <Table variant="unstyled" size="sm">
                    <Thead>
                      <Tr>
                        <Th
                          fontFamily="monospace"
                          fontSize={{ base: "10px", md: "xs" }}
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="left"
                          border="none"
                        >
                          Market
                        </Th>
                        <Th
                          fontFamily="monospace"
                          fontSize={{ base: "10px", md: "xs" }}
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          Votes/Token
                        </Th>
                        <Th
                          fontFamily="monospace"
                          fontSize={{ base: "10px", md: "xs" }}
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          Split
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {/* Votium Row */}
                      <Tr>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          border="none"
                        >
                          <Flex align="center" gap={{ base: 1, md: 2 }}>
                            <Box w="10px" h="2px" bg="#A3A3A3" />
                            <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                              Votium
                            </Text>
                          </Flex>
                        </Td>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                            {currentVotiumEfficiency}
                          </Text>
                        </Td>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          <Flex align="center" justify="flex-end" gap={1}>
                            <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                              {selectedEpochData
                                ? `${((selectedEpochData.votium_amount / selectedEpochData.total_incentives) * 100).toFixed(1)}%`
                                : "-"}
                            </Text>
                            {selectedEpochData && (
                              <Tooltip
                                label={`${Math.round(selectedEpochData.votium_amount).toLocaleString()} tokens`}
                                fontSize="xs"
                                hasArrow
                                placement="top"
                                bg="gray.700"
                              >
                                <InfoOutlineIcon boxSize={2.5} color="gray.400" />
                              </Tooltip>
                            )}
                          </Flex>
                        </Td>
                      </Tr>
                      
                      {/* VoteMarket Row */}
                      <Tr>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          border="none"
                        >
                          <Flex align="center" gap={{ base: 1, md: 2 }}>
                            <Box w="10px" h="2px" bg="#262626" />
                            <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                              VoteMarket
                            </Text>
                          </Flex>
                        </Td>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                            {currentVoteMarketEfficiency}
                          </Text>
                        </Td>
                        <Td
                          px={{ base: 1, md: 2 }}
                          py={{ base: 1, md: 1.5 }}
                          textAlign="right"
                          border="none"
                        >
                          <Flex align="center" justify="flex-end" gap={1}>
                            <Text fontSize={{ base: "11px", md: "sm" }} fontFamily="monospace">
                              {selectedEpochData
                                ? `${((selectedEpochData.votemarket_amount / selectedEpochData.total_incentives) * 100).toFixed(1)}%`
                                : "-"}
                            </Text>
                            {selectedEpochData && (
                              <Tooltip
                                label={`${Math.round(selectedEpochData.votemarket_amount).toLocaleString()} tokens`}
                                fontSize="xs"
                                hasArrow
                                placement="top"
                                bg="gray.700"
                              >
                                <InfoOutlineIcon boxSize={2.5} color="gray.400" />
                              </Tooltip>
                            )}
                          </Flex>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </Box>
              </Box>

              {/* Historical Chart */}
              <Box>
                <Flex justify="center">
                  {renderChart()}
                </Flex>
              </Box>
            </Stack>
          )}
        </Box>
      </Flex>

      <PageFooter
        lastUpdateDate={lastUpdated}
        lastUpdateFromApi={lastUpdated.getTime().toString()}
        lastUpdated={lastUpdated}
      />
    </PageContainer>
  );
}

export default Incentives;
