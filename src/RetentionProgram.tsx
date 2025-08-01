import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  Center,
  Container,
  Button,
  Flex,
  Stack,
  Link,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  ChakraProvider,
} from "@chakra-ui/react";
import { InfoIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { customTheme } from "./Markets";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";

const PAGE_SIZE = 15;

function abbreviateAddress(addr: string) {
  return addr ? `${addr.slice(0, 5)}...${addr.slice(-3)}` : "";
}

function abbreviateHash(hash: string) {
  return hash ? `${hash.slice(0, 5)}...${hash.slice(-3)}` : "";
}

function formatDate(ts: number | string) {
  if (!ts) return "-";
  const n = typeof ts === "string" ? Number(ts) : ts;
  if (!n || isNaN(n)) return "-";
  const date = new Date(n * 1000);
  if (isNaN(date.getTime())) return "-";
  // Format as MM/DD HH:MM (UTC)
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const min = String(date.getUTCMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
}

function getTimestamp(row: any) {
  // Try common timestamp fields
  if (row.date && !isNaN(Number(row.date))) return Number(row.date);
  if (row.timestamp && !isNaN(Number(row.timestamp)))
    return Number(row.timestamp);
  if (row.ts && !isNaN(Number(row.ts))) return Number(row.ts);
  return null;
}

function RetentionProgram() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(
    null
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [showAprBreakdown, setShowAprBreakdown] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://raw.githubusercontent.com/wavey0x/open-data/master/resupply_market_data.json"
        );

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

        setData(response.data?.retention_program || null);
        setLastUpdated(new Date());
        setError(null);
      } catch (e) {
        setError("Failed to load retention program data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const feed = Array.isArray(data?.withdrawal_feed) ? data.withdrawal_feed : [];
  const pageCount = Math.ceil(feed.length / PAGE_SIZE);
  const pagedFeed = feed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Top data calculations
  const original = Number(data?.total_assets_original) || 0;
  const remaining = Number(data?.total_assets_remaining) || 0;
  const withdrawn = original - remaining;
  const remainingPct = original ? (remaining / original) * 100 : 0;
  const withdrawnPct = original ? (withdrawn / original) * 100 : 0;

  const baseApr = Number(data?.base_apr) * 100 || 0;
  const retentionApr = Number(data?.apr) * 100 || 0;
  const totalApr = baseApr + retentionApr;

  const topData = [
    {
      label: "Expected APR",
      value: data ? (
        <>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              color: "#000",
              fontSize: "16px",
            }}
          >
            <Text as="span" fontWeight="bold" color="green.500">
              {totalApr.toFixed(2)}%
            </Text>
            <Box
              as="span"
              position="relative"
              ml={1}
              display="inline-block"
              onMouseEnter={() => setShowAprBreakdown(true)}
              onMouseLeave={() => setShowAprBreakdown(false)}
            >
              <InfoIcon
                boxSize="13px"
                color="black"
                cursor="pointer"
                _hover={{ color: "gray.500" }}
                mt="-2px"
              />
              {showAprBreakdown && (
                <Box
                  position="absolute"
                  top="100%"
                  left="50%"
                  transform="translateX(-50%)"
                  mt={-1}
                  bg="gray.800"
                  color="white"
                  borderRadius="md"
                  px={3}
                  py={2}
                  maxW="220px"
                  zIndex={1000}
                  fontFamily="monospace"
                  fontSize="xs"
                  boxShadow="lg"
                  textAlign="left"
                >
                  <div>{baseApr.toFixed(2)}% base apr</div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#fff",
                    }}
                  >
                    <span>{retentionApr.toFixed(2)}% ❤️ retention program</span>
                    <span
                      style={{
                        fontSize: "15px",
                        marginLeft: 4,
                        color: "#e53935",
                      }}
                    ></span>
                  </div>
                </Box>
              )}
            </Box>
          </span>
        </>
      ) : (
        "-"
      ),
    },
    {
      label: "Eligible Remaining",
      value: (
        <>
          {Math.floor(remaining).toLocaleString()}
          <span style={{ fontSize: "12px" }}>
            {" "}
            ({remainingPct.toFixed(2)}%)
          </span>
        </>
      ),
      smallLabel: true,
    },
    {
      label: "Eligible Withdrawn",
      value: (
        <>
          {Math.floor(withdrawn).toLocaleString()}
          <span style={{ fontSize: "12px" }}>
            {" "}
            ({withdrawnPct.toFixed(2)}%)
          </span>
        </>
      ),
      smallLabel: true,
    },
  ];

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1200);
  };

  return (
    <ChakraProvider theme={customTheme}>
      <Flex
        direction="column"
        align="center"
        justify="flex-start"
        minH="0"
        w="100vw"
        bg="white"
        pt={24}
        mt={8}
        mb={0}
      >
        <Container
          maxW={{ base: "100vw", md: "md" }}
          px={{ base: 0, md: 0 }}
          py={0}
          my={0}
          centerContent
          style={{ marginTop: 0, paddingTop: 0 }}
        >
          <Stack
            align="center"
            spacing={0}
            w="100%"
            mt={0}
            mb={0}
            style={{ marginTop: 0, marginBottom: 0 }}
          >
            {loading ? (
              <Center py={8} w="100%">
                <Spinner size="lg" />
              </Center>
            ) : error ? (
              <Text color="red.500" fontFamily="monospace" textAlign="center">
                {error}
              </Text>
            ) : data ? (
              <Box
                w="100%"
                fontFamily="monospace"
                color="black"
                fontSize="md"
                textAlign="center"
              >
                <Flex
                  direction="row"
                  justify="center"
                  align="center"
                  mb={4}
                  gap={4}
                  wrap="wrap"
                >
                  <Box
                    as="table"
                    mx="auto"
                    style={{ borderCollapse: "collapse" }}
                  >
                    <tbody>
                      {topData.map((item, i) => (
                        <tr key={i}>
                          <td
                            style={{
                              textAlign: "right",
                              padding: "2px 8px",
                              fontFamily: "monospace",
                              fontSize: item.smallLabel ? "14px" : "15px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.label}
                          </td>
                          <td
                            style={{
                              textAlign: "left",
                              padding: "2px 8px",
                              fontFamily: "monospace",
                              fontSize: "16px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Box>
                </Flex>
                {feed.length > 0 && (
                  <Box w="100%" minWidth="0">
                    <Box minWidth="374px" width="auto" mx="auto">
                      <Tabs variant="unstyled" align="center" mb={0} mt={0}>
                        <TabList
                          display="flex"
                          border="1px solid black"
                          borderRadius="10px 10px 0 0"
                          overflow="hidden"
                          p={0}
                          m={0}
                          minWidth="374px"
                          width="auto"
                        >
                          <Tab
                            fontFamily="monospace"
                            fontWeight="normal"
                            fontSize="sm"
                            flex="1"
                            borderRight="1px solid black"
                            borderRadius="10px 0 0 0"
                            bg="#f3f3f3"
                            color="gray.500"
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
                            Withdrawal Feed
                          </Tab>
                          <Tab
                            fontFamily="monospace"
                            fontWeight="normal"
                            fontSize="sm"
                            flex="1"
                            borderRadius="0 10px 0 0"
                            bg="#f3f3f3"
                            color="gray.500"
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
                            Info
                          </Tab>
                        </TabList>
                        <TabPanels>
                          <TabPanel px={0} py={0}>
                            <Flex justify="center" overflowX="auto">
                              <Table
                                variant="simple"
                                size="sm"
                                fontFamily="monospace"
                                colorScheme="blackAlpha"
                                borderWidth="1px"
                                borderColor="black"
                                borderTopWidth={0}
                                minWidth="374px"
                                width="auto"
                                style={{
                                  textAlign: "center",
                                  fontSize: "13px",
                                  borderSpacing: 0,
                                }}
                              >
                                <Thead>
                                  <Tr>
                                    <Th
                                      fontFamily="monospace"
                                      color="black"
                                      borderColor="black"
                                      fontSize="xs"
                                      textAlign="center"
                                      px={2}
                                      py={0}
                                      minWidth="70px"
                                      maxWidth="70px"
                                      whiteSpace="nowrap"
                                    >
                                      Date
                                    </Th>
                                    <Th
                                      fontFamily="monospace"
                                      color="black"
                                      borderColor="black"
                                      fontSize="sm"
                                      textAlign="center"
                                      px={2}
                                      py={0}
                                      minWidth="83px"
                                      maxWidth="83px"
                                      whiteSpace="nowrap"
                                    >
                                      User
                                    </Th>
                                    <Th
                                      fontFamily="monospace"
                                      color="black"
                                      borderColor="black"
                                      fontSize="sm"
                                      textAlign="center"
                                      px={2}
                                      py={0}
                                      minWidth="83px"
                                      maxWidth="83px"
                                      whiteSpace="nowrap"
                                    >
                                      Txn
                                    </Th>
                                    <Th
                                      fontFamily="monospace"
                                      color="black"
                                      borderColor="black"
                                      fontSize="sm"
                                      textAlign="center"
                                      px={2}
                                      py={0}
                                      minWidth="93px"
                                      maxWidth="93px"
                                      whiteSpace="nowrap"
                                    >
                                      Amt
                                    </Th>
                                  </Tr>
                                </Thead>
                                <Tbody>
                                  {pagedFeed.map((row: any, i: number) => {
                                    const ts = getTimestamp(row);
                                    return (
                                      <Tr key={i}>
                                        <Td
                                          fontFamily="monospace"
                                          color="black"
                                          borderColor="black"
                                          fontSize="xs"
                                          textAlign="left"
                                          px={2}
                                          py={0}
                                          minWidth="85px"
                                          maxWidth="85px"
                                          overflow="hidden"
                                          whiteSpace="nowrap"
                                        >
                                          {ts ? formatDate(ts) : "-"}
                                        </Td>
                                        <Td
                                          fontFamily="monospace"
                                          color="black"
                                          borderColor="black"
                                          fontSize="xs"
                                          textAlign="left"
                                          px={2}
                                          py={0}
                                          minWidth="83px"
                                          maxWidth="83px"
                                          overflow="hidden"
                                          whiteSpace="nowrap"
                                        >
                                          <a
                                            href={`https://etherscan.io/address/${row.user}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: "black",
                                              textDecoration: "underline",
                                            }}
                                          >
                                            {abbreviateAddress(row.user)}
                                          </a>
                                        </Td>
                                        <Td
                                          fontFamily="monospace"
                                          color="black"
                                          borderColor="black"
                                          fontSize="xs"
                                          textAlign="left"
                                          px={2}
                                          py={0}
                                          minWidth="83px"
                                          maxWidth="83px"
                                          overflow="hidden"
                                          whiteSpace="nowrap"
                                        >
                                          <a
                                            href={`https://etherscan.io/tx/${row.txn_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{
                                              color: "black",
                                              textDecoration: "underline",
                                            }}
                                          >
                                            {abbreviateHash(row.txn_hash)}
                                          </a>
                                        </Td>
                                        <Td
                                          fontFamily="monospace"
                                          color="black"
                                          borderColor="black"
                                          fontSize="sm"
                                          textAlign="right"
                                          px={2}
                                          py={0}
                                          minWidth="93px"
                                          maxWidth="93px"
                                          overflow="hidden"
                                          whiteSpace="nowrap"
                                        >
                                          {row.amount !== undefined
                                            ? Number(row.amount).toLocaleString(
                                                undefined,
                                                {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                }
                                              )
                                            : "-"}
                                        </Td>
                                      </Tr>
                                    );
                                  })}
                                </Tbody>
                              </Table>
                            </Flex>
                            <Flex
                              justify="center"
                              align="center"
                              mt={2}
                              gap={2}
                            >
                              <Button
                                size="xs"
                                onClick={() =>
                                  setPage((p) => Math.max(0, p - 1))
                                }
                                disabled={page === 0}
                                fontFamily="monospace"
                                aria-label="Previous Page"
                              >
                                {"<"}
                              </Button>
                              <Text fontFamily="monospace" fontSize="sm">
                                {page + 1} / {pageCount}
                              </Text>
                              <Button
                                size="xs"
                                onClick={() =>
                                  setPage((p) => Math.min(pageCount - 1, p + 1))
                                }
                                disabled={page >= pageCount - 1}
                                fontFamily="monospace"
                                aria-label="Next Page"
                              >
                                {">"}
                              </Button>
                            </Flex>
                          </TabPanel>
                          <TabPanel px={0} py={4}>
                            <Box
                              border="1px solid black"
                              borderTopWidth={0}
                              borderRadius="0 0 10px 10px"
                              minWidth="374px"
                              width="auto"
                              px={4}
                              py={3}
                              bg="white"
                              mt={0}
                            >
                              <Stack
                                spacing={3}
                                align="center"
                                fontFamily="monospace"
                                fontSize="sm"
                              >
                                {/* Countdown removed from Info tab */}
                                <Box w="100%">
                                  <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={2}
                                    mb={1}
                                  >
                                    <Text minW="140px">Retention Program:</Text>
                                    <Flex alignItems="center" gap={1}>
                                      <Link
                                        href="https://etherscan.io/address/0xB9415639618e70aBb71A0F4F8bbB2643Bf337892"
                                        isExternal
                                        color="black"
                                        textDecoration="underline"
                                        wordBreak="break-all"
                                      >
                                        {abbreviateAddress(
                                          "0xB9415639618e70aBb71A0F4F8bbB2643Bf337892"
                                        )}
                                      </Link>
                                      <Box
                                        as="button"
                                        ml={1}
                                        onClick={() =>
                                          handleCopy(
                                            "0xB9415639618e70aBb71A0F4F8bbB2643Bf337892"
                                          )
                                        }
                                        p={0.5}
                                        borderRadius="sm"
                                        bg="white"
                                        _hover={{ bg: "gray.100" }}
                                        transition="all 0.2s"
                                      >
                                        {copied ===
                                        "0xB9415639618e70aBb71A0F4F8bbB2643Bf337892" ? (
                                          <CheckIcon
                                            color="green.400"
                                            boxSize={3}
                                          />
                                        ) : (
                                          <CopyIcon boxSize={3} />
                                        )}
                                      </Box>
                                    </Flex>
                                  </Flex>
                                  <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={2}
                                    mb={1}
                                  >
                                    <Text minW="140px">Program Receiver:</Text>
                                    <Flex alignItems="center" gap={1}>
                                      <Link
                                        href="https://etherscan.io/address/0x6E7D5dade33f76F480EA38E3c47f870de74906F1"
                                        isExternal
                                        color="black"
                                        textDecoration="underline"
                                        wordBreak="break-all"
                                      >
                                        {abbreviateAddress(
                                          "0x6E7D5dade33f76F480EA38E3c47f870de74906F1"
                                        )}
                                      </Link>
                                      <Box
                                        as="button"
                                        ml={1}
                                        onClick={() =>
                                          handleCopy(
                                            "0x6E7D5dade33f76F480EA38E3c47f870de74906F1"
                                          )
                                        }
                                        p={0.5}
                                        borderRadius="sm"
                                        bg="white"
                                        _hover={{ bg: "gray.100" }}
                                        transition="all 0.2s"
                                      >
                                        {copied ===
                                        "0x6E7D5dade33f76F480EA38E3c47f870de74906F1" ? (
                                          <CheckIcon
                                            color="green.400"
                                            boxSize={3}
                                          />
                                        ) : (
                                          <CopyIcon boxSize={3} />
                                        )}
                                      </Box>
                                    </Flex>
                                  </Flex>
                                </Box>
                                <Box w="100%">
                                  <Flex
                                    alignItems="center"
                                    justifyContent="space-between"
                                    gap={2}
                                    mb={1}
                                  >
                                    <Text minW="140px">More Info:</Text>
                                    <Flex alignItems="center" gap={1}>
                                      <Link
                                        href="https://gov.resupply.fi/t/resupply-recovery-plan-phase-2-activate-ip-retention-program/63"
                                        isExternal
                                        color="black"
                                        textDecoration="underline"
                                      >
                                        governance proposal
                                      </Link>
                                      <ExternalLinkIcon
                                        boxSize={3}
                                        color="black"
                                      />
                                    </Flex>
                                  </Flex>
                                </Box>
                              </Stack>
                            </Box>
                          </TabPanel>
                        </TabPanels>
                      </Tabs>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : null}
          </Stack>
        </Container>

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
      </Flex>
    </ChakraProvider>
  );
}

export default RetentionProgram;
