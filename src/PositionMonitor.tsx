import { Box, Flex, Image, Link, Text } from "@chakra-ui/react";
import { ExternalLinkIcon } from "@chakra-ui/icons";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { formatDistanceToNowStrict } from "date-fns";
import { PageContainer } from "./components/layout/PageContainer";
import { designTokens } from "./theme";

const CHART_URL =
  "https://raw.githubusercontent.com/wavey0x/open-data/master/charts/resupply_positions.png";
const META_URL =
  "https://raw.githubusercontent.com/wavey0x/open-data/master/charts/resupply_positions_meta.json";

type PositionMonitorMeta = {
  last_refresh?: string;
};

function PositionMonitor() {
  const [meta, setMeta] = useState<PositionMonitorMeta | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      try {
        setIsMetaLoading(true);
        setMetaError(null);
        const resp = await axios.get(META_URL, { timeout: 12_000 });
        if (!mounted) return;
        setMeta(resp.data ?? null);
      } catch {
        if (!mounted) return;
        setMeta(null);
        setMetaError("Failed to load metadata");
      }
      if (!mounted) return;
      setIsMetaLoading(false);
    };
    run();
    return () => {
      mounted = false;
    };
  }, []);

  const lastRefreshDate = useMemo(() => {
    if (!meta?.last_refresh) return null;
    const d = new Date(meta.last_refresh);
    return isNaN(d.getTime()) ? null : d;
  }, [meta?.last_refresh]);

  const chartSrc = useMemo(() => {
    if (!lastRefreshDate) return CHART_URL;
    return `${CHART_URL}?t=${lastRefreshDate.getTime()}`;
  }, [lastRefreshDate]);

  return (
    <PageContainer maxWidth="full">
      <Flex direction="column" align="center" gap={3}>
        <Box w="100%" maxW={{ base: "100%", md: "1024px" }} textAlign="center">
          <Flex justify="center" gap={3} wrap="wrap">
            <Link
              href="https://etherscan.io/address/0xe5BcBdf9452af0AB4b042D9d8a3c1E527E26419f"
              isExternal
              fontFamily="monospace"
              fontSize="sm"
              color="gray.700"
            >
              0xe5Bc...419f <ExternalLinkIcon mx="2px" />
            </Link>
            <Text fontFamily="monospace" fontSize="sm" color="gray.400">
              |
            </Text>
            <Link
              href="https://github.com/wavey0x/open-data-scripts/blob/master/scripts/resupply/position_monitor.py"
              isExternal
              fontFamily="monospace"
              fontSize="sm"
              color="gray.700"
            >
              code <ExternalLinkIcon mx="2px" />
            </Link>
          </Flex>

          <Text
            mt={1}
            fontFamily="monospace"
            fontSize="sm"
            color={metaError ? "red.500" : "gray.600"}
          >
            {metaError
              ? metaError
              : isMetaLoading
              ? "Loading..."
              : lastRefreshDate
              ? `Last refresh: ${formatDistanceToNowStrict(lastRefreshDate, {
                  addSuffix: true,
                })}`
              : "Last refresh: unknown"}
          </Text>
        </Box>

        <Box
          w="100%"
          maxW={{ base: "100%", md: "1024px" }}
          borderRadius={designTokens.borderRadius.card}
          overflow="hidden"
          bg="white"
          boxShadow={designTokens.shadows.card}
        >
          <Box bg="white" p={{ base: 2, md: 3 }}>
            <Image
              src={chartSrc}
              alt="Resupply Positions Chart"
              w="100%"
              h="auto"
              borderRadius={designTokens.borderRadius.small}
              border="1px solid"
              borderColor="gray.150"
              loading="lazy"
            />
          </Box>
        </Box>
      </Flex>
    </PageContainer>
  );
}

export default PositionMonitor;
