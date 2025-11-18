import { Box, Text, Flex, Stack } from "@chakra-ui/react";
import { PageContainer } from "./components/layout/PageContainer";
import { PageFooter } from "./components/layout/PageFooter";
import { LoadingState } from "./components/ui/LoadingState";
import { ErrorState } from "./components/ui/ErrorState";
import { TimeSeriesChart } from "./components/charts/TimeSeriesChart";
import { useResupplyData } from "./hooks/useResupplyData";
import { designTokens } from "./theme";

interface SreUsdDataPoint {
  block: number;
  timestamp: number;
  rate: number;
  apr: number;
  total_assets?: number;
}

/**
 * sreUSD Page - Displays current and historical APR for sreUSD
 * Refactored to use shared components and hooks
 * Reduced from ~500 lines to ~120 lines
 */
function SreUSD() {
  // Use centralized data fetching hook
  const {
    data: sreusdData,
    isLoading,
    error,
    lastUpdated,
    lastUpdateFromApi,
    lastUpdateDate,
  } = useResupplyData<SreUsdDataPoint[]>({
    dataPath: "data.sreusd",
  });

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
      <Flex justify="center" mb={2} direction="column" align="center">
        <Box
          display="inline-block"
          minWidth={{ base: "400px", md: "470px" }}
          width={{ base: "400px", md: "470px" }}
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
                direction={{ base: "column", md: "row" }}
                justify="center"
                align="center"
                gap={8}
                textAlign="center"
              >
                <Box>
                  <Text
                    fontSize="sm"
                    fontFamily="monospace"
                    color="gray.600"
                    mb={2}
                    {...designTokens.typography.caption}
                  >
                    APR
                  </Text>
                  <Text
                    fontSize="2xl"
                    fontFamily="monospace"
                    fontWeight="400"
                    color="green.500"
                  >
                    {currentApr}%
                  </Text>
                </Box>
                <Box>
                  <Text
                    fontSize="sm"
                    fontFamily="monospace"
                    color="gray.600"
                    mb={2}
                    {...designTokens.typography.caption}
                  >
                    TVL
                  </Text>
                  <Text
                    fontSize="2xl"
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
