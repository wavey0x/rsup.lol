import { useEffect, useState } from "react";
import {
  ChakraProvider,
  Box,
  Text,
  Image,
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
} from "@chakra-ui/react";
import { ArrowLeftIcon, ArrowRightIcon } from "@chakra-ui/icons";
import axios from "axios";
import { customTheme, FALLBACK_IMAGE } from "./App";

const LOGO = "/retention-logo.png";
const PAGE_SIZE = 15;

function abbreviateAddress(addr: string) {
  return addr ? `${addr.slice(0, 5)}...${addr.slice(-4)}` : "";
}

function abbreviateHash(hash: string) {
  return hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : "";
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          "https://raw.githubusercontent.com/wavey0x/open-data/master/resupply_market_data.json"
        );
        setData(response.data?.retention_program || null);
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
  const original = Number(data?.total_supply_original) || 0;
  const remaining = Number(data?.total_supply_remaining) || 0;
  const withdrawn = original - remaining;
  const remainingPct = original ? (remaining / original) * 100 : 0;
  const withdrawnPct = original ? (withdrawn / original) * 100 : 0;

  const topData = [
    {
      label: "Current APR",
      value: data ? `${(Number(data.apr) * 100).toFixed(2)}%` : "-",
    },
    {
      label: "Remaining RSUP",
      value: Number(data?.remaining_rsup).toLocaleString(),
    },
    {
      label: "Supply Remaining",
      value: `${Math.floor(remaining).toLocaleString()} (${remainingPct.toFixed(
        2
      )}%)`,
    },
    {
      label: "Total Withdrawn",
      value: `${Math.floor(withdrawn).toLocaleString()} (${withdrawnPct.toFixed(
        2
      )}%)`,
    },
  ];

  return (
    <ChakraProvider theme={customTheme}>
      <Flex
        direction="column"
        align="center"
        justify="flex-start"
        minH="0"
        w="100vw"
        bg="white"
        pt={0}
        mt={0}
        mb={0}
      >
        <Container
          maxW="md"
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
            <Image
              src={LOGO}
              alt="Retention Logo"
              boxSize="100px"
              fallbackSrc={FALLBACK_IMAGE}
              mx="auto"
              mt={0}
              mb={0}
              style={{ marginTop: 0, marginBottom: 0 }}
            />
            <Text
              fontFamily="monospace"
              fontSize="2xl"
              fontWeight="bold"
              color="black"
              textAlign="center"
              mt={0}
              mb={0}
              style={{ marginTop: 0, marginBottom: 0 }}
            >
              Retention Program
            </Text>
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
                              fontSize: "16px",
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
                  <Box mt={6} w="100%">
                    <Text
                      fontWeight="bold"
                      mb={2}
                      fontSize="lg"
                      textAlign="center"
                    >
                      Withdrawal Feed
                    </Text>
                    <Flex justify="center" overflowX="auto">
                      <Table
                        variant="simple"
                        size="sm"
                        fontFamily="monospace"
                        colorScheme="blackAlpha"
                        borderWidth="1px"
                        borderColor="black"
                        minWidth="420px"
                        width="auto"
                        style={{ textAlign: "center", fontSize: "13px" }}
                      >
                        <Thead>
                          <Tr>
                            <Th
                              fontFamily="monospace"
                              color="black"
                              borderColor="black"
                              fontSize="xs"
                              textAlign="center"
                              px={1}
                              py={0.5}
                            >
                              UTC
                            </Th>
                            <Th
                              fontFamily="monospace"
                              color="black"
                              borderColor="black"
                              fontSize="sm"
                              textAlign="center"
                              px={1}
                              py={0.5}
                            >
                              User
                            </Th>
                            <Th
                              fontFamily="monospace"
                              color="black"
                              borderColor="black"
                              fontSize="sm"
                              textAlign="center"
                              px={1}
                              py={0.5}
                            >
                              Txn
                            </Th>
                            <Th
                              fontFamily="monospace"
                              color="black"
                              borderColor="black"
                              fontSize="sm"
                              textAlign="center"
                              px={1}
                              py={0.5}
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
                                  px={1}
                                  py={0.5}
                                >
                                  {ts ? formatDate(ts) : "-"}
                                </Td>
                                <Td
                                  fontFamily="monospace"
                                  color="black"
                                  borderColor="black"
                                  fontSize="xs"
                                  textAlign="left"
                                  px={1}
                                  py={0.5}
                                >
                                  <a
                                    href={`https://etherscan.io/address/${row.user}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#3182ce",
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
                                  px={1}
                                  py={0.5}
                                >
                                  <a
                                    href={`https://etherscan.io/tx/${row.txn_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{
                                      color: "#3182ce",
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
                                  px={1}
                                  py={0.5}
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
                    <Flex justify="center" align="center" mt={2} gap={2}>
                      <Button
                        size="xs"
                        onClick={() => setPage((p) => Math.max(0, p - 1))}
                        disabled={page === 0}
                        fontFamily="monospace"
                        aria-label="Previous Page"
                      >
                        <ArrowLeftIcon />
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
                        <ArrowRightIcon />
                      </Button>
                    </Flex>
                  </Box>
                )}
              </Box>
            ) : null}
          </Stack>
        </Container>
      </Flex>
    </ChakraProvider>
  );
}

export default RetentionProgram;
