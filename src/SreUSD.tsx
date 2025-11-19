import { Box, Text, Flex, Stack, Image, Link, Tooltip } from "@chakra-ui/react";
import { ExternalLinkIcon, InfoOutlineIcon } from "@chakra-ui/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import { PageContainer } from "./components/layout/PageContainer";
import { PageFooter } from "./components/layout/PageFooter";
import { LoadingState } from "./components/ui/LoadingState";
import { ErrorState } from "./components/ui/ErrorState";
import { TimeSeriesChart } from "./components/charts/TimeSeriesChart";
import { useResupplyData } from "./hooks/useResupplyData";
import { designTokens, FALLBACK_IMAGE } from "./theme";
import { formatNumberWithAbbreviation } from "./utils/format";

interface SreUsdDataPoint {
  block: number;
  timestamp: number;
  rate: number;
  apr: number;
  total_assets?: number;
}

interface SreUsdMarketData {
  deposit_token_logo: string;
  collateral_token_logo: string;
  deposit_token_symbol: string;
  collateral_token_symbol: string;
  utilization: number;
  liquidity: number;
  borrow_rate: number;
  lend_rate: number;
  global_ltv: number;
  total_debt: number;
}

/**
 * sreUSD Page - Displays current and historical APR for sreUSD
 * Refactored to use shared components and hooks
 * Reduced from ~500 lines to ~120 lines
 */
function SreUSD() {
  // Use centralized data fetching hook for historical data
  const {
    data: sreusdData,
    isLoading,
    error,
    lastUpdated,
    lastUpdateFromApi,
    lastUpdateDate,
  } = useResupplyData<SreUsdDataPoint[]>({
    dataPath: "data.sreusd.historical_data",
  });

  // Fetch market data
  const {
    data: marketData,
    isLoading: isLoadingMarket,
    error: marketError,
  } = useResupplyData<SreUsdMarketData>({
    dataPath: "data.sreusd.market_data",
  });

  // Fetch gauge APR data
  const [gaugeAprRange, setGaugeAprRange] = useState<[number, number] | null>(null);
  const [isLoadingGauge, setIsLoadingGauge] = useState(true);

  useEffect(() => {
    const fetchGaugeData = async () => {
      try {
        setIsLoadingGauge(true);
        const response = await axios.get(
          "https://api.wavey.info/api/gauge/basic?gauge=0x29E9975561fAD3A7988CA96361AB5c5317CB32Af"
        );
        const rawValues = response.data?.data?.apy_data?.gauge_crv_apy?.raw_values;
        if (Array.isArray(rawValues) && rawValues.length === 2) {
          setGaugeAprRange([rawValues[0], rawValues[1]]);
        }
      } catch (err) {
        console.error("Error fetching gauge data:", err);
      } finally {
        setIsLoadingGauge(false);
      }
    };

    fetchGaugeData();
  }, []);

  // Transform data for chart component with dual axes
  const chartData = sreusdData?.map((d) => ({
    timestamp: d.timestamp,
    value: d.apr * 100, // Convert to percentage for left axis
    secondaryValue: d.total_assets, // TVL for right axis
  })) || [];

  const currentApr = sreusdData && sreusdData.length > 0
    ? (sreusdData[sreusdData.length - 1].apr * 100).toFixed(2)
    : "0.00";

  const currentTvl = sreusdData && sreusdData.length > 0
    ? (sreusdData[sreusdData.length - 1].total_assets !== undefined
        ? `${(sreusdData[sreusdData.length - 1].total_assets! / 1000000).toFixed(2)}M`
        : "N/A")
    : "0";

  return (
    <PageContainer maxWidth="wide">
      <Flex justify="center" mb={2} direction="column" align="center" px={{ base: 2, md: 0 }}>
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
          ) : !sreusdData || sreusdData.length === 0 ? (
            <Text fontFamily="monospace" textAlign="center" color="gray.500">
              No sreUSD data available
            </Text>
          ) : (
            <Stack spacing={designTokens.spacing.sectionGap}>
              {/* Current Metrics Display */}
              <Flex
                direction="row"
                justify="center"
                align="center"
                gap={{ base: 4, md: 8 }}
                textAlign="center"
              >
                <Box>
                  <Text
                    fontSize={{ base: "xs", md: "sm" }}
                    fontFamily="monospace"
                    color="gray.600"
                    mb={1}
                    {...designTokens.typography.caption}
                  >
                    APR
                  </Text>
                  <Text
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontFamily="monospace"
                    fontWeight="400"
                    color="green.500"
                  >
                    {currentApr}%
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontSize={{ base: "xs", md: "sm" }}
                    fontFamily="monospace"
                    color="gray.600"
                    mb={1}
                    {...designTokens.typography.caption}
                  >
                    TVL
                  </Text>
                  <Text
                    fontSize={{ base: "xl", md: "2xl" }}
                    fontFamily="monospace"
                    fontWeight="400"
                    color="gray.700"
                  >
                    {currentTvl}
                  </Text>
                </Box>
              </Flex>

              {/* Historical Chart with Dual Axes */}
              <Box>
                <Flex justify="center">
                  <TimeSeriesChart
                    data={chartData}
                    size="medium"
                    enableHover={true}
                    valueFormatter={(v) => `${Math.round(v)}%`}
                    valueLabel="APR"
                    secondaryValueFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                    secondaryValueLabel="TVL"
                    primaryLineColor="green"
                    secondaryLineColor="black"
                  />
                </Flex>
              </Box>
            </Stack>
          )}
        </Box>

        {/* Market Data Display */}
        <Box
          w={{ base: "100%", md: "470px" }}
          border="1px solid black"
          borderRadius={designTokens.borderRadius.card}
          overflow="hidden"
          bg="white"
          px={2}
          py={3}
          mt={4}
          boxShadow={designTokens.shadows.card}
          transition={designTokens.transitions.fast}
        >
          {marketError ? (
            <ErrorState message={marketError} />
          ) : isLoadingMarket ? (
            <LoadingState />
          ) : !marketData ? (
            <Text fontFamily="monospace" textAlign="center" color="gray.500">
              No market data available
            </Text>
          ) : (
            <Stack spacing={3}>
              {/* Token Pair Header */}
              <Flex align="center" justify="center" gap={3} mb={2}>
                <Box position="relative" boxSize="32px" flexShrink={0}>
                  <Image
                    src={marketData.deposit_token_logo}
                    boxSize="28px"
                    fallbackSrc={FALLBACK_IMAGE}
                    borderRadius="full"
                  />
                  <Image
                    src={marketData.collateral_token_logo}
                    boxSize="28px"
                    position="absolute"
                    bottom="0px"
                    right="-12px"
                    zIndex={1}
                    fallbackSrc={FALLBACK_IMAGE}
                    borderRadius="full"
                  />
                </Box>
                <Text
                  fontSize={{ base: "md", md: "lg" }}
                  fontFamily="monospace"
                  fontWeight="500"
                >
                  {marketData.deposit_token_symbol}/{marketData.collateral_token_symbol}
                </Text>
                <Link
                  href="https://www.curve.finance/lend/ethereum/markets/0x4F79Fe450a2BAF833E8f50340BD230f5A3eCaFe9/create"
                  isExternal
                  color="blue.500"
                  _hover={{ color: "blue.600" }}
                >
                  <ExternalLinkIcon boxSize={4} />
                </Link>
              </Flex>

              {/* Market Metrics Grid */}
              <Stack spacing={2}>
                {/* Row 1: Debt and Liquidity */}
                <Flex justify="space-around" gap={4}>
                  <Box flex={1} textAlign="center">
                    <Text
                      fontSize="xs"
                      fontFamily="monospace"
                      color="gray.600"
                      mb={1}
                      {...designTokens.typography.caption}
                    >
                      Total Debt
                    </Text>
                    <Text
                      fontSize={{ base: "lg", md: "xl" }}
                      fontFamily="monospace"
                      fontWeight="400"
                      color="gray.700"
                    >
                      ${formatNumberWithAbbreviation(marketData.total_debt)}
                    </Text>
                  </Box>
                  <Box flex={1} textAlign="center">
                    <Text
                      fontSize="xs"
                      fontFamily="monospace"
                      color="gray.600"
                      mb={1}
                      {...designTokens.typography.caption}
                    >
                      Liquidity
                    </Text>
                    <Flex align="center" justify="center" gap={1}>
                      <Text
                        fontSize={{ base: "lg", md: "xl" }}
                        fontFamily="monospace"
                        fontWeight="400"
                        color="gray.700"
                      >
                        ${formatNumberWithAbbreviation(marketData.liquidity)}
                      </Text>
                      <Tooltip
                        label={`Utilization: ${(marketData.utilization * 100).toFixed(1)}%`}
                        fontSize="xs"
                        hasArrow
                        placement="top"
                        bg="gray.700"
                      >
                        <InfoOutlineIcon boxSize={3} color="gray.400" />
                      </Tooltip>
                    </Flex>
                  </Box>
                </Flex>

                {/* Row 2: Borrow and Lend APR */}
                <Flex justify="space-around" gap={4}>
                  <Box flex={1} textAlign="center">
                    <Text
                      fontSize="xs"
                      fontFamily="monospace"
                      color="gray.600"
                      mb={1}
                      {...designTokens.typography.caption}
                    >
                      Borrow APR
                    </Text>
                    <Text
                      fontSize={{ base: "lg", md: "xl" }}
                      fontFamily="monospace"
                      fontWeight="400"
                      color="gray.700"
                    >
                      {(marketData.borrow_rate * 100).toFixed(2)}%
                    </Text>
                  </Box>
                  <Box flex={1} textAlign="center">
                    <Text
                      fontSize="xs"
                      fontFamily="monospace"
                      color="gray.600"
                      mb={1}
                      {...designTokens.typography.caption}
                    >
                      Lend APR
                    </Text>
                    {isLoadingGauge || !gaugeAprRange ? (
                      <Text
                        fontSize={{ base: "lg", md: "xl" }}
                        fontFamily="monospace"
                        fontWeight="400"
                        color="gray.700"
                      >
                        {(marketData.lend_rate * 100).toFixed(2)}%
                      </Text>
                    ) : (
                      <Flex align="center" justify="center" gap={1}>
                        <Text
                          fontSize={{ base: "lg", md: "xl" }}
                          fontFamily="monospace"
                          fontWeight="400"
                          color="gray.700"
                        >
                          {((marketData.lend_rate * 100) + gaugeAprRange[0]).toFixed(2)}% - {((marketData.lend_rate * 100) + gaugeAprRange[1]).toFixed(2)}%
                        </Text>
                        <Tooltip
                          label={
                            <Box fontFamily="monospace" fontSize="xs">
                              <Flex gap={2}>
                                <Text minW="45px" textAlign="right">base:</Text>
                                <Text>{(marketData.lend_rate * 100).toFixed(2)}%</Text>
                              </Flex>
                              <Flex gap={2}>
                                <Text minW="45px" textAlign="right">gauge:</Text>
                                <Text>{gaugeAprRange[0].toFixed(2)}-{gaugeAprRange[1].toFixed(2)}%</Text>
                              </Flex>
                            </Box>
                          }
                          hasArrow
                          placement="top"
                          bg="gray.700"
                        >
                          <InfoOutlineIcon boxSize={3} color="gray.400" />
                        </Tooltip>
                      </Flex>
                    )}
                  </Box>
                </Flex>
              </Stack>
            </Stack>
          )}
        </Box>
      </Flex>

      <PageFooter
        lastUpdateDate={lastUpdateDate}
        lastUpdateFromApi={lastUpdateFromApi}
        lastUpdated={lastUpdated}
      />
    </PageContainer>
  );
}

export default SreUSD;
