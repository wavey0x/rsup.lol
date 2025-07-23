import { useState, useEffect } from "react";
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  useDisclosure,
  Text,
  Link,
  Flex,
  Container,
  theme,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Center,
  Stack,
  Tooltip,
  ChakraProvider,
  Tabs,
  TabList,
  Tab,
} from "@chakra-ui/react";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  CopyIcon,
  CheckIcon,
} from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import type { MarketData, MarketInfo } from "./types/market";
import {
  formatNumberWithAbbreviation,
  formatPercent3Digits,
} from "./utils/format";

const crvLogo = "/CRV-transparent.svg";
const fraxlendLogo = "/Fraxlend.svg";

// Protocol logos as SVG strings
const CURVE_LOGO = crvLogo;

// Custom theme extension for monospace and compact table
const customTheme = {
  ...theme,
  components: {
    Table: {
      baseStyle: {
        th: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 1, md: 2 },
          px: { base: 1, md: 2 },
          cursor: "pointer",
          userSelect: "none",
          _hover: {
            bg: "gray.50",
          },
        },
        td: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 0.5, md: 1 },
          px: { base: 1, md: 2 },
        },
      },
    },
  },
};

type SortConfig = {
  key: keyof MarketData | null;
  direction: "asc" | "desc";
};

const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23ffffff'/%3E%3Ctext x='12' y='17' text-anchor='middle' font-size='16' font-family='monospace' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E";

// Extend MarketInfo for modal use
interface MarketInfoModal extends MarketInfo {
  depositTokenAddress: string;
  collateralTokenAddress: string;
  resupplyPairAddress: string;
  depositTokenSymbol: string;
  collateralTokenSymbol: string;
  controller: string;
  interestRateContract: string;
  depositTokenLogo: string;
  collateralTokenLogo: string;
}

// Helper to abbreviate addresses
const abbreviateAddress = (addr: string) =>
  addr ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : "";

const SORT_CONFIG_KEY = "resupply_sort_config";

export { customTheme, FALLBACK_IMAGE };

function Markets() {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<MarketInfoModal | null>(
    null
  );
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(
    null
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SORT_CONFIG_KEY);
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return { key: null, direction: "asc" };
  });
  const [resupplyMode, setResupplyMode] = useState(true);
  const [protocolFilter, setProtocolFilter] = useState<
    "all" | "curve" | "frax"
  >("all");
  const [showDeprecated, setShowDeprecated] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [copied, setCopied] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        "https://raw.githubusercontent.com/wavey0x/open-data/master/resupply_market_data.json"
      );

      // Check if data exists and is an array
      if (!response.data?.data || !Array.isArray(response.data.data)) {
        throw new Error(
          "Invalid data format: expected an array under 'data' key"
        );
      }

      // Set last update from API if available
      if (response.data.last_update) {
        setLastUpdateFromApi(response.data.last_update);
        // If it's a number or numeric string, treat as unix timestamp (seconds)
        const ts = Number(response.data.last_update);
        if (!isNaN(ts) && ts > 1000000000) {
          setLastUpdateDate(new Date(ts * 1000));
        } else {
          setLastUpdateDate(null);
        }
      }

      // Validate and transform each market data object
      const validatedData = response.data.data.map((market: any) => {
        if (!market || typeof market !== "object") {
          throw new Error("Invalid market data format");
        }

        const resupplyBorrowLimit = Number(market.resupply_borrow_limit) || 0;
        const deprecated = resupplyBorrowLimit === 0;

        return {
          marketName: `${market.deposit_token_symbol}/${market.collateral_token_symbol}`,
          protocolId: Number(market.protocol_id) || 0,
          depositTokenLogo: market.deposit_token_logo,
          collateralTokenLogo: market.collateral_token_logo,
          protocolLogo: market.protocol_id === 0 ? CURVE_LOGO : fraxlendLogo,
          utilization: Number(market.utilization) * 100 || 0,
          liquidity: Number(market.liquidity) || 0,
          borrowRate: Number(market.borrow_rate) * 100 || 0,
          lendRate: Number(market.lend_rate) * 100 || 0,
          ltv: Number(market.global_ltv) * 100 || 0,
          contractAddress: market.market,
          protocolLink:
            market.protocol_id === 0
              ? "https://app.curve.fi/lending"
              : "https://app.frax.finance/lending",
          depositTokenAddress: market.deposit_token,
          collateralTokenAddress: market.collat_token,
          resupplyPairAddress: market.pair,
          depositTokenSymbol: market.deposit_token_symbol,
          collateralTokenSymbol: market.collateral_token_symbol,
          controller: market.controller,
          interestRateContract: market.interest_rate_contract,
          resupplyBorrowLimit,
          deprecated,
          totalDebt: Number(market.total_debt) || 0,
          resupply_ltv: Number(market.resupply_ltv) * 100 || 0,
          resupply_total_debt: Number(market.resupply_total_debt) || 0,
          resupply_utilization: Number(market.resupply_utilization) * 100 || 0,
          resupply_available_liquidity:
            Number(market.resupply_available_liquidity) || 0,
          resupply_borrow_rate: Number(market.resupply_borrow_rate) * 100 || 0,
          resupply_lend_rate: Number(market.resupply_lend_rate) * 100 || 0,
        };
      });

      setMarketData(validatedData);
      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error("Error fetching market data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to fetch market data"
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

  const handleSort = (key: keyof MarketData) => {
    setSortConfig((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === "asc"
          ? "desc"
          : "asc",
    }));
  };

  const getSortedData = () => {
    if (!sortConfig.key) return marketData;

    return [...marketData].sort((a, b) => {
      // Special case: sort by total APR in resupply mode
      if (sortConfig.key === "lendRate" && resupplyMode) {
        const aRewards =
          Number(getValue(a, "lendRate", "resupply_lend_rate")) || 0;
        const aUnderlying = Number(a.lendRate || 0);
        const bRewards =
          Number(getValue(b, "lendRate", "resupply_lend_rate")) || 0;
        const bUnderlying = Number(b.lendRate || 0);
        const aTotal = aRewards + aUnderlying;
        const bTotal = bRewards + bUnderlying;
        return sortConfig.direction === "asc"
          ? aTotal - bTotal
          : bTotal - aTotal;
      }
      // Special case: sort by resupply values for utilization and liquidity in resupply mode
      if (resupplyMode && sortConfig.key === "utilization") {
        const aValue =
          Number(getValue(a, "utilization", "resupply_utilization")) || 0;
        const bValue =
          Number(getValue(b, "utilization", "resupply_utilization")) || 0;
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      if (resupplyMode && sortConfig.key === "liquidity") {
        const aValue =
          Number(getValue(a, "liquidity", "resupply_available_liquidity")) || 0;
        const bValue =
          Number(getValue(b, "liquidity", "resupply_available_liquidity")) || 0;
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      // Always sort by raw number for borrowRate
      if (sortConfig.key === "borrowRate") {
        const aValue =
          Number(getValue(a, "borrowRate", "resupply_borrow_rate")) || 0;
        const bValue =
          Number(getValue(b, "borrowRate", "resupply_borrow_rate")) || 0;
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      // Always sort by raw number for liquidity and totalDebt
      if (sortConfig.key === "liquidity" || sortConfig.key === "totalDebt") {
        const aValue = Number(a[sortConfig.key!]) || 0;
        const bValue = Number(b[sortConfig.key!]) || 0;
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      // Always sort by raw number for numeric columns
      const numericKeys = [
        "ltv",
        "totalDebt",
        "utilization",
        "liquidity",
        "lendRate",
      ];
      if (numericKeys.includes(sortConfig.key as string)) {
        const aValue =
          Number(
            getValue(a, sortConfig.key as string, `resupply_${sortConfig.key}`)
          ) || 0;
        const bValue =
          Number(
            getValue(b, sortConfig.key as string, `resupply_${sortConfig.key}`)
          ) || 0;
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      if (typeof aValue === "string" && typeof bValue === "string") {
        return sortConfig.direction === "asc"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      return sortConfig.direction === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
  };

  const handleInfoClick = (market: MarketInfoModal) => {
    setSelectedMarket(market);
    onOpen();
  };

  const SortIcon = ({ column }: { column: keyof MarketData }) => {
    return (
      <Box
        as="span"
        mt={0}
        display="flex"
        justifyContent="center"
        minH="10px"
        alignItems="center"
      >
        {sortConfig.key === column ? (
          sortConfig.direction === "asc" ? (
            <ChevronUpIcon boxSize="2" />
          ) : (
            <ChevronDownIcon boxSize="2" />
          )
        ) : (
          // Empty box to reserve space for the arrow
          <Box boxSize="10px" />
        )}
      </Box>
    );
  };

  // Filtered data based on protocol toggle and deprecated
  const getFilteredData = () => {
    let data = getSortedData();
    if (!showDeprecated) {
      data = data.filter((m) => !m.deprecated);
    }
    if (protocolFilter === "all") return data;
    if (protocolFilter === "curve")
      return data.filter((m) => m.protocolId === 0);
    if (protocolFilter === "frax")
      return data.filter((m) => m.protocolId !== 0);
    return data;
  };

  // Copy handler
  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1200);
  };

  // Save sortConfig to localStorage whenever it changes
  useEffect(() => {
    if (sortConfig && typeof window !== "undefined") {
      localStorage.setItem(SORT_CONFIG_KEY, JSON.stringify(sortConfig));
    }
  }, [sortConfig]);

  // Helper to get the correct value based on resupplyMode
  const getValue = (market: any, key: string, resupplyKey: string) => {
    if (
      resupplyMode &&
      market[resupplyKey] !== undefined &&
      market[resupplyKey] !== null
    ) {
      return market[resupplyKey];
    }
    return market[key];
  };

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
        {/* Resupply/Underlying Toggle and Protocol Filter - now as Tabs */}
        <Flex justify="center" mb={2} direction="column" align="center">
          <Box
            display="inline-block"
            w={{ base: "100%", md: "740px" }}
            border="1px solid black"
            borderRadius="16px 16px 0 0"
            overflow="hidden"
            bg="white"
            sx={{ boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}
          >
            <Box display="flex" flexDirection="column" gap={0}>
              {/* Resupply/Underlying Tabs */}
              <Tabs
                variant="unstyled"
                align="center"
                isFitted
                index={resupplyMode ? 0 : 1}
                onChange={(i) => setResupplyMode(i === 0)}
                mb={0}
              >
                <TabList
                  display="flex"
                  borderBottom="1px solid black"
                  borderRadius="16px 16px 0 0"
                  overflow="hidden"
                  p={0}
                  m={0}
                  w={{ base: "100%", md: "740px" }}
                  bg="white"
                >
                  <Tab
                    fontFamily="monospace"
                    fontWeight="normal"
                    fontSize="sm"
                    flex="1"
                    borderRight="1px solid black"
                    borderRadius="16px 0 0 0"
                    bg={resupplyMode ? "white" : "#f3f3f3"}
                    color={resupplyMode ? "black" : "gray.500"}
                    _selected={{
                      bg: "white",
                      color: "black",
                      fontWeight: "bold",
                      borderBottom: "2px solid white",
                    }}
                    px={0}
                    py={1}
                    minW={0}
                  >
                    <Image
                      src="/resupply-hippo.png"
                      alt="Resupply Hippo"
                      h="36px"
                      w="100%"
                      maxW="90%"
                      objectFit="contain"
                      mx="auto"
                      display="block"
                    />
                  </Tab>
                  <Tab
                    fontFamily="monospace"
                    fontWeight="normal"
                    fontSize="sm"
                    flex="1"
                    borderRadius="0 16px 0 0"
                    bg={!resupplyMode ? "white" : "#f3f3f3"}
                    color={!resupplyMode ? "black" : "gray.500"}
                    _selected={{
                      bg: "white",
                      color: "black",
                      fontWeight: "bold",
                      borderBottom: "2px solid white",
                    }}
                    px={0}
                    py={1}
                    minW={0}
                  >
                    Underlying
                  </Tab>
                </TabList>
              </Tabs>
              {/* Protocol Tabs */}
              <Tabs
                variant="unstyled"
                align="center"
                isFitted
                index={
                  protocolFilter === "all"
                    ? 0
                    : protocolFilter === "curve"
                    ? 1
                    : 2
                }
                onChange={(i) =>
                  setProtocolFilter(
                    i === 0 ? "all" : i === 1 ? "curve" : "frax"
                  )
                }
                mb={0}
              >
                <TabList
                  display="flex"
                  borderBottom="1px solid black"
                  borderRadius="0"
                  overflow="hidden"
                  p={0}
                  m={0}
                  w={{ base: "100%", md: "740px" }}
                  bg="white"
                >
                  <Tab
                    fontFamily="monospace"
                    fontWeight="normal"
                    fontSize={{ base: "10px", md: "sm" }}
                    flex="1"
                    borderRight="1px solid black"
                    borderRadius="16px 0 0 0"
                    bg={protocolFilter === "all" ? "white" : "#f3f3f3"}
                    color={protocolFilter === "all" ? "black" : "gray.500"}
                    _selected={{
                      bg: "white",
                      color: "black",
                      fontWeight: "bold",
                      borderBottom: "2px solid white",
                    }}
                    px={2}
                    py={1}
                    minW={0}
                  >
                    All
                  </Tab>
                  <Tab
                    fontFamily="monospace"
                    fontWeight="normal"
                    fontSize={{ base: "10px", md: "sm" }}
                    flex="1"
                    borderRight="1px solid black"
                    borderRadius="0"
                    bg={protocolFilter === "curve" ? "white" : "#f3f3f3"}
                    color={protocolFilter === "curve" ? "black" : "gray.500"}
                    _selected={{
                      bg: "white",
                      color: "black",
                      fontWeight: "bold",
                      borderBottom: "2px solid white",
                    }}
                    px={2}
                    py={1}
                    minW={0}
                  >
                    <Flex align="center" gap={1} justify="center">
                      <Image src={crvLogo} boxSize="16px" display="inline" />
                      <span style={{ marginLeft: 2, fontFamily: "monospace" }}>
                        CurveLend
                      </span>
                    </Flex>
                  </Tab>
                  <Tab
                    fontFamily="monospace"
                    fontWeight="normal"
                    fontSize={{ base: "10px", md: "sm" }}
                    flex="1"
                    borderRadius="0 16px 0 0"
                    bg={protocolFilter === "frax" ? "white" : "#f3f3f3"}
                    color={protocolFilter === "frax" ? "black" : "gray.500"}
                    _selected={{
                      bg: "white",
                      color: "black",
                      fontWeight: "bold",
                      borderBottom: "2px solid white",
                    }}
                    px={2}
                    py={1}
                    minW={0}
                  >
                    <Flex align="center" gap={1} justify="center">
                      <Image
                        src={fraxlendLogo}
                        boxSize="16px"
                        display="inline"
                      />
                      <span style={{ marginLeft: 2, fontFamily: "monospace" }}>
                        FraxLend
                      </span>
                    </Flex>
                  </Tab>
                </TabList>
              </Tabs>
            </Box>
            {/* Table and rest of content remain unchanged */}
            {error ? (
              <Alert status="error" mb={4}>
                <AlertIcon />
                <AlertTitle>Error!</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : isLoading ? (
              <Center py={8}>
                <Spinner size="xl" />
              </Center>
            ) : (
              <Flex justify="center" w="100%" overflowX="auto" px={0.2}>
                <Box w={{ base: "100%", md: "740px" }} px={0.2}>
                  <Table variant="simple" size="sm" w="100%" mx="auto">
                    <Thead>
                      <Tr>
                        <Th
                          onClick={() => handleSort("marketName")}
                          fontFamily="monospace"
                          fontSize={{ base: "2xs", md: "sm" }}
                          position="relative"
                          minW={{ base: "80px", md: "200px" }}
                          w={{ base: "100px", md: "200px" }}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <span>Market</span>
                            <SortIcon column="marketName" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("ltv")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          position="relative"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <span>LTV</span>
                            <SortIcon column="ltv" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("totalDebt")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          position="relative"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <span>Debt</span>
                            <SortIcon column="totalDebt" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("utilization")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          position="relative"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <span>Util</span>
                            <SortIcon column="utilization" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("liquidity")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          position="relative"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <span>Liq</span>
                            <SortIcon column="liquidity" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("borrowRate")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          fontSize={{ base: "8px", md: "sm" }}
                          whiteSpace="normal"
                          maxW={{ base: "48px", md: "none" }}
                          position="relative"
                        >
                          <Box as="span" display="block">
                            {resupplyMode ? (
                              <>
                                Borrow
                                <br />
                                Cost
                              </>
                            ) : (
                              <>
                                Borrow
                                <br />
                                APR
                              </>
                            )}
                            <SortIcon column="borrowRate" />
                          </Box>
                        </Th>
                        <Th
                          onClick={() => handleSort("lendRate")}
                          px={{ base: 1, md: 5 }}
                          py={{ base: 0.5, md: 2 }}
                          textAlign="center"
                          whiteSpace="normal"
                          minW={{ base: "64px", md: "96px" }}
                          maxW={{ base: "64px", md: "96px" }}
                          w={{ base: "64px", md: "96px" }}
                          position="relative"
                        >
                          <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                          >
                            <Box
                              as="span"
                              fontSize={{ base: "8px", md: "sm" }}
                              lineHeight={1}
                              display="block"
                            >
                              {resupplyMode ? (
                                <>
                                  Total
                                  <br />
                                  APR
                                </>
                              ) : (
                                <>
                                  Lend
                                  <br />
                                  APR
                                </>
                              )}
                            </Box>
                            <SortIcon column="lendRate" />
                          </Box>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {getFilteredData().map((market) => {
                        const rewardsApr = Number(
                          getValue(market, "lendRate", "resupply_lend_rate")
                        );
                        const underlyingApr = Number(market.lendRate);
                        const totalApr = rewardsApr + underlyingApr;
                        return (
                          <Tr
                            key={`${market.marketName}-${market.contractAddress}`}
                          >
                            <Td>
                              <Flex align="center" gap={1}>
                                <Box position="relative" boxSize="24px">
                                  <Image
                                    src={market.depositTokenLogo}
                                    boxSize="20px"
                                    fallbackSrc={FALLBACK_IMAGE}
                                    borderRadius="full"
                                  />
                                  <Image
                                    src={market.collateralTokenLogo}
                                    boxSize="20px"
                                    position="absolute"
                                    bottom="0px"
                                    right="-10px"
                                    zIndex={1}
                                    fallbackSrc={FALLBACK_IMAGE}
                                    borderRadius="full"
                                  />
                                </Box>
                                <Text
                                  as="button"
                                  display="inline-flex"
                                  alignItems="center"
                                  gap={1}
                                  ml={3}
                                  onClick={() =>
                                    handleInfoClick({
                                      marketName: market.marketName,
                                      protocolId: market.protocolId,
                                      contractAddress: market.contractAddress,
                                      protocolLink: market.protocolLink,
                                      depositTokenAddress:
                                        market.depositTokenAddress,
                                      collateralTokenAddress:
                                        market.collateralTokenAddress,
                                      resupplyPairAddress:
                                        market.resupplyPairAddress,
                                      depositTokenSymbol:
                                        market.depositTokenSymbol,
                                      collateralTokenSymbol:
                                        market.collateralTokenSymbol,
                                      controller: market.controller,
                                      interestRateContract:
                                        market.interestRateContract,
                                      depositTokenLogo: market.depositTokenLogo,
                                      collateralTokenLogo:
                                        market.collateralTokenLogo,
                                    })
                                  }
                                  textDecoration="underline"
                                  color="black"
                                  fontFamily="monospace"
                                  bg="transparent"
                                  border="none"
                                  p={0}
                                  cursor="pointer"
                                  fontSize={{ base: "8px", md: "sm" }}
                                >
                                  {market.marketName}
                                </Text>
                              </Flex>
                            </Td>
                            <Td>
                              {formatNumberWithAbbreviation(
                                Number(getValue(market, "ltv", "resupply_ltv"))
                              )}
                              %
                            </Td>
                            <Td>
                              $
                              {formatNumberWithAbbreviation(
                                getValue(
                                  market,
                                  "totalDebt",
                                  "resupply_total_debt"
                                )
                              )}
                            </Td>
                            <Td
                              fontFamily="monospace"
                              fontSize={{ base: "10px", md: "sm" }}
                              px={{ base: 1, md: 5 }}
                              py={{ base: 0.5, md: 2 }}
                              textAlign="center"
                            >
                              {formatPercent3Digits(
                                getValue(
                                  market,
                                  "utilization",
                                  "resupply_utilization"
                                )
                              )}
                            </Td>
                            <Td
                              fontFamily="monospace"
                              fontSize={{ base: "10px", md: "sm" }}
                              px={{ base: 1, md: 5 }}
                              py={{ base: 0.5, md: 2 }}
                              textAlign="center"
                            >
                              $
                              {formatNumberWithAbbreviation(
                                getValue(
                                  market,
                                  "liquidity",
                                  "resupply_available_liquidity"
                                )
                              )}
                            </Td>
                            <Td>
                              {resupplyMode
                                ? `${Number(
                                    getValue(
                                      market,
                                      "borrowRate",
                                      "resupply_borrow_rate"
                                    )
                                  ).toFixed(2)}%`
                                : `${Number(
                                    getValue(market, "borrowRate", "borrowRate")
                                  ).toFixed(2)}%`}
                            </Td>
                            <Td>
                              {resupplyMode ? (
                                <Tooltip
                                  label={
                                    <Box
                                      fontFamily="monospace"
                                      fontSize="xs"
                                      color="white"
                                      bg="gray.800"
                                      borderRadius="md"
                                      px={2}
                                      py={1}
                                    >
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        gap={2}
                                      >
                                        <span>rewards:</span>
                                        <span
                                          style={{
                                            minWidth: 40,
                                            textAlign: "right",
                                            display: "inline-block",
                                          }}
                                        >
                                          {rewardsApr.toFixed(2)}%
                                        </span>
                                      </Box>
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        gap={2}
                                      >
                                        <span>underlying:</span>
                                        <span
                                          style={{
                                            minWidth: 40,
                                            textAlign: "right",
                                            display: "inline-block",
                                          }}
                                        >
                                          {underlyingApr.toFixed(2)}%
                                        </span>
                                      </Box>
                                    </Box>
                                  }
                                  fontSize="xs"
                                  hasArrow
                                  placement="top"
                                  bg="gray.800"
                                  color="white"
                                  borderRadius="md"
                                  p={0}
                                >
                                  <span
                                    style={{
                                      fontFamily: "monospace",
                                      cursor: "pointer",
                                    }}
                                  >
                                    {totalApr.toFixed(2)}%
                                  </span>
                                </Tooltip>
                              ) : (
                                `${Number(
                                  getValue(market, "lendRate", "lendRate")
                                ).toFixed(2)}%`
                              )}
                            </Td>
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </Box>
              </Flex>
            )}

            {/* Subtle checkbox for deprecated markets */}
            <Flex justify="center" mt={5} mb={1}>
              <Box fontSize="xs" color="gray.500">
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    cursor: "pointer",
                    fontFamily: "monospace",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={showDeprecated}
                    onChange={(e) => setShowDeprecated(e.target.checked)}
                    style={{
                      accentColor: "#bbb",
                      width: 12,
                      height: 12,
                      marginRight: 4,
                    }}
                  />
                  Show deprecated markets
                </label>
              </Box>
            </Flex>

            <Modal isOpen={isOpen} onClose={onClose}>
              <ModalOverlay bg="blackAlpha.300" />
              <ModalContent
                bg="white"
                boxShadow="xl"
                borderRadius="md"
                p={1}
                minW="0"
                w="max-content"
                maxW="95vw"
                m="0 auto"
                top="10vh"
                h="auto"
                minH="0"
                height="fit-content"
                position="relative"
              >
                <ModalBody pb={1} px={1} w="100%">
                  <Box height="24px" />
                  {selectedMarket && (
                    <Box fontSize="sm" m={0} p={0} fontFamily="monospace">
                      <Stack spacing={1} align="start">
                        {/* Market name and logos at the top */}
                        <Flex direction="column" align="center" w="100%" mb={3}>
                          <Flex align="center" justify="center" gap={1} mb={1}>
                            <Box position="relative" boxSize="32px">
                              <Image
                                src={selectedMarket.depositTokenLogo}
                                boxSize="28px"
                                fallbackSrc={FALLBACK_IMAGE}
                                borderRadius="full"
                              />
                              <Image
                                src={selectedMarket.collateralTokenLogo}
                                boxSize="28px"
                                position="absolute"
                                bottom="0px"
                                right="-12px"
                                zIndex={1}
                                fallbackSrc={FALLBACK_IMAGE}
                                borderRadius="full"
                              />
                            </Box>
                          </Flex>
                          <Text
                            fontWeight="bold"
                            fontSize="md"
                            fontFamily="monospace"
                            color="black"
                          >
                            {selectedMarket.marketName}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            Protocol:
                          </strong>
                          <Image
                            src={
                              selectedMarket.protocolId === 0
                                ? crvLogo
                                : fraxlendLogo
                            }
                            boxSize="18px"
                            fallbackSrc={FALLBACK_IMAGE}
                            ml={0}
                            mr={0}
                          />
                          <Text mb={1} mt={0} fontFamily="monospace">
                            {selectedMarket.protocolId === 0
                              ? "CurveLend"
                              : "FraxLend"}
                          </Text>
                        </Flex>
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            Market:
                          </strong>
                          <Link
                            href={`https://etherscan.io/address/${selectedMarket.contractAddress}`}
                            isExternal
                            color="blue.500"
                            wordBreak="break-all"
                            fontFamily="monospace"
                          >
                            {abbreviateAddress(selectedMarket.contractAddress)}
                          </Link>
                          <Box
                            as="button"
                            ml={1}
                            onClick={() =>
                              handleCopy(selectedMarket.contractAddress)
                            }
                            p={0.5}
                            borderRadius="sm"
                            bg="white"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            {copied === selectedMarket.contractAddress ? (
                              <CheckIcon color="green.400" boxSize={3} />
                            ) : (
                              <CopyIcon boxSize={3} />
                            )}
                          </Box>
                        </Flex>
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            {selectedMarket.depositTokenSymbol}:
                          </strong>
                          <Link
                            href={`https://etherscan.io/address/${selectedMarket.depositTokenAddress}`}
                            isExternal
                            color="blue.500"
                            wordBreak="break-all"
                            fontFamily="monospace"
                          >
                            {abbreviateAddress(
                              selectedMarket.depositTokenAddress
                            )}
                          </Link>
                          <Box
                            as="button"
                            ml={1}
                            onClick={() =>
                              handleCopy(selectedMarket.depositTokenAddress)
                            }
                            p={0.5}
                            borderRadius="sm"
                            bg="white"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            {copied === selectedMarket.depositTokenAddress ? (
                              <CheckIcon color="green.400" boxSize={3} />
                            ) : (
                              <CopyIcon boxSize={3} />
                            )}
                          </Box>
                        </Flex>
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            {selectedMarket.collateralTokenSymbol}:
                          </strong>
                          <Link
                            href={`https://etherscan.io/address/${selectedMarket.collateralTokenAddress}`}
                            isExternal
                            color="blue.500"
                            wordBreak="break-all"
                            fontFamily="monospace"
                          >
                            {abbreviateAddress(
                              selectedMarket.collateralTokenAddress
                            )}
                          </Link>
                          <Box
                            as="button"
                            ml={1}
                            onClick={() =>
                              handleCopy(selectedMarket.collateralTokenAddress)
                            }
                            p={0.5}
                            borderRadius="sm"
                            bg="white"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            {copied ===
                            selectedMarket.collateralTokenAddress ? (
                              <CheckIcon color="green.400" boxSize={3} />
                            ) : (
                              <CopyIcon boxSize={3} />
                            )}
                          </Box>
                        </Flex>
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            Resupply:
                          </strong>
                          <Link
                            href={`https://etherscan.io/address/${selectedMarket.resupplyPairAddress}`}
                            isExternal
                            color="blue.500"
                            wordBreak="break-all"
                            fontFamily="monospace"
                          >
                            {abbreviateAddress(
                              selectedMarket.resupplyPairAddress
                            )}
                          </Link>
                          <Box
                            as="button"
                            ml={1}
                            onClick={() =>
                              handleCopy(selectedMarket.resupplyPairAddress)
                            }
                            p={0.5}
                            borderRadius="sm"
                            bg="white"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            {copied === selectedMarket.resupplyPairAddress ? (
                              <CheckIcon color="green.400" boxSize={3} />
                            ) : (
                              <CopyIcon boxSize={3} />
                            )}
                          </Box>
                        </Flex>
                        {selectedMarket.controller &&
                          selectedMarket.controller !==
                            "0x0000000000000000000000000000000000000000" && (
                            <Flex align="center" gap={4} w="100%">
                              <strong
                                style={{
                                  minWidth: 110,
                                  fontFamily: "monospace",
                                }}
                              >
                                Controller:
                              </strong>
                              <Link
                                href={`https://etherscan.io/address/${selectedMarket.controller}`}
                                isExternal
                                color="blue.500"
                                wordBreak="break-all"
                                fontFamily="monospace"
                              >
                                {abbreviateAddress(selectedMarket.controller)}
                              </Link>
                              <Box
                                as="button"
                                ml={1}
                                onClick={() =>
                                  handleCopy(selectedMarket.controller)
                                }
                                p={0.5}
                                borderRadius="sm"
                                bg="white"
                                _hover={{ bg: "gray.100" }}
                                transition="all 0.2s"
                              >
                                {copied === selectedMarket.controller ? (
                                  <CheckIcon color="green.400" boxSize={3} />
                                ) : (
                                  <CopyIcon boxSize={3} />
                                )}
                              </Box>
                            </Flex>
                          )}
                        <Flex align="center" gap={4} w="100%">
                          <strong
                            style={{ minWidth: 110, fontFamily: "monospace" }}
                          >
                            Rate Calc:
                          </strong>
                          <Link
                            href={`https://etherscan.io/address/${selectedMarket.interestRateContract}`}
                            isExternal
                            color="blue.500"
                            wordBreak="break-all"
                            fontFamily="monospace"
                          >
                            {abbreviateAddress(
                              selectedMarket.interestRateContract
                            )}
                          </Link>
                          <Box
                            as="button"
                            ml={1}
                            onClick={() =>
                              handleCopy(selectedMarket.interestRateContract)
                            }
                            p={0.5}
                            borderRadius="sm"
                            bg="white"
                            _hover={{ bg: "gray.100" }}
                            transition="all 0.2s"
                          >
                            {copied === selectedMarket.interestRateContract ? (
                              <CheckIcon color="green.400" boxSize={3} />
                            ) : (
                              <CopyIcon boxSize={3} />
                            )}
                          </Box>
                        </Flex>
                      </Stack>
                    </Box>
                  )}
                </ModalBody>
              </ModalContent>
            </Modal>

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
          </Box>
        </Flex>
      </Container>
    </ChakraProvider>
  );
}

export default Markets;
