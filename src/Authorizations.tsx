import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Spinner,
  Center,
  Container,
  Flex,
  Stack,
  Link, // Add Link for etherscan links
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  ChakraProvider,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Button,
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { customTheme } from "./Markets";

function abbreviateAddress(addr: string) {
  return addr ? `${addr.slice(0, 5)}..${addr.slice(-3)}` : "";
}
// Helper to extract function name (before parens)
function getFunctionName(signature: string) {
  if (!signature) return "";
  const idx = signature.indexOf("(");
  return idx > 0 ? signature.slice(0, idx) : signature;
}
// Helper to truncate selector name to 16 chars with '..'
function truncateSelectorName(name: string) {
  if (!name) return "";
  return name.length > 16 ? name.slice(0, 16) + ".." : name;
}
// Helper to check for address(0)
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

function Authorizations() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(
    null
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  // Track which selector tooltip is open (by row index)
  const [openSelectorTooltip, setOpenSelectorTooltip] = useState<number | null>(
    null
  );
  const PAGE_SIZE = 15;
  const [page, setPage] = useState(0);
  const activeAuths = Array.isArray(data?.authorizations?.active)
    ? data.authorizations.active
    : [];
  const pageCount = Math.ceil(activeAuths.length / PAGE_SIZE);
  const pagedAuths = activeAuths.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );

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
          const ts = Number(response.data.last_update);
          if (!isNaN(ts) && ts > 1000000000) {
            setLastUpdateDate(new Date(ts * 1000));
          } else {
            setLastUpdateDate(null);
          }
        }

        setData(response.data);
        setLastUpdated(new Date());
        setError(null);
      } catch (e) {
        setError("Failed to load authorizations data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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
                <Box
                  width={{ base: "380px", md: "448px" }}
                  minWidth={{ base: "380px", md: "448px" }}
                  mx="auto"
                  px={0}
                  py={0}
                >
                  <Tabs variant="unstyled" align="center" mb={0} mt={0}>
                    <TabList
                      display="flex"
                      border="1px solid black"
                      borderRadius="10px 10px 0 0"
                      overflow="hidden"
                      p={0}
                      m={0}
                      minWidth={{ base: "380px", md: "448px" }}
                      width={{ base: "380px", md: "448px" }}
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
                        Active Authorizations
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
                        {Array.isArray(data.authorizations?.active) &&
                        data.authorizations.active.length > 0 ? (
                          <Box
                            overflowX="auto"
                            w="100%"
                            minWidth={{ base: "380px", md: "448px" }}
                            width={{ base: "100%", md: "auto" }}
                            mt={1}
                          >
                            <Table
                              variant="simple"
                              size="sm"
                              w="100%"
                              fontFamily="monospace"
                              colorScheme="blackAlpha"
                              borderWidth="1px"
                              borderColor="black"
                              borderTopWidth={0}
                              minWidth={{ base: "380px", md: "448px" }}
                              width={{ base: "100%", md: "auto" }}
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
                                    Selector
                                  </Th>
                                  <Th
                                    fontFamily="monospace"
                                    color="black"
                                    borderColor="black"
                                    fontSize="xs"
                                    textAlign="center"
                                    px={2}
                                    py={0}
                                    minWidth="83px"
                                    maxWidth="83px"
                                    whiteSpace="nowrap"
                                  >
                                    Target
                                  </Th>
                                  <Th
                                    fontFamily="monospace"
                                    color="black"
                                    borderColor="black"
                                    fontSize="xs"
                                    textAlign="center"
                                    px={2}
                                    py={0}
                                    minWidth="83px"
                                    maxWidth="83px"
                                    whiteSpace="nowrap"
                                  >
                                    Caller
                                  </Th>
                                  <Th
                                    fontFamily="monospace"
                                    color="black"
                                    borderColor="black"
                                    fontSize="xs"
                                    textAlign="center"
                                    px={2}
                                    py={0}
                                    minWidth="60px"
                                    maxWidth="60px"
                                    whiteSpace="nowrap"
                                  >
                                    Hook
                                  </Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {pagedAuths.map((auth: any, i: number) => (
                                  <Tr key={i}>
                                    <Td
                                      fontFamily="monospace"
                                      textAlign="left"
                                      style={{ position: "relative" }}
                                    >
                                      {Array.isArray(auth.selector) &&
                                      auth.selector[1] ? (
                                        <span
                                          style={{
                                            fontFamily: "monospace",
                                            cursor: "pointer",
                                            position: "relative",
                                            display: "inline-block",
                                          }}
                                          data-selector-tooltip-anchor
                                          onMouseEnter={() =>
                                            setOpenSelectorTooltip(i)
                                          }
                                          onMouseLeave={() =>
                                            setOpenSelectorTooltip((cur) =>
                                              cur === i ? null : cur
                                            )
                                          }
                                        >
                                          {truncateSelectorName(
                                            getFunctionName(auth.selector[1])
                                          )}
                                          {openSelectorTooltip === i && (
                                            <Box
                                              position="absolute"
                                              top="100%"
                                              left={0}
                                              mt={-1}
                                              zIndex={2000}
                                              bg="gray.800"
                                              color="white"
                                              borderRadius="md"
                                              px={3}
                                              py={2}
                                              fontFamily="monospace"
                                              fontSize="xs"
                                              boxShadow="lg"
                                              textAlign="left"
                                              minW="220px"
                                              maxW="260px"
                                              pointerEvents="auto"
                                              onMouseEnter={() =>
                                                setOpenSelectorTooltip(i)
                                              }
                                              onMouseLeave={() =>
                                                setOpenSelectorTooltip(null)
                                              }
                                            >
                                              {auth.selector[1] && (
                                                <Box>{auth.selector[1]}</Box>
                                              )}
                                              <Box>{auth.selector[0]}</Box>
                                              <Box mt={1}>
                                                <Link
                                                  href={`https://www.4byte.directory/signatures/?bytes4_signature=${auth.selector[0]}`}
                                                  isExternal
                                                  color="blue.200"
                                                  textDecoration="underline"
                                                  fontSize="xs"
                                                  fontFamily="monospace"
                                                >
                                                  4byte.directory ↗
                                                </Link>
                                              </Box>
                                            </Box>
                                          )}
                                        </span>
                                      ) : Array.isArray(auth.selector) &&
                                        auth.selector[0] ? (
                                        <span
                                          style={{
                                            fontFamily: "monospace",
                                            cursor: "pointer",
                                            position: "relative",
                                            display: "inline-block",
                                          }}
                                          data-selector-tooltip-anchor
                                          onMouseEnter={() =>
                                            setOpenSelectorTooltip(i)
                                          }
                                          onMouseLeave={() =>
                                            setOpenSelectorTooltip((cur) =>
                                              cur === i ? null : cur
                                            )
                                          }
                                        >
                                          {truncateSelectorName(
                                            auth.selector[0]
                                          )}
                                          {openSelectorTooltip === i && (
                                            <Box
                                              position="absolute"
                                              top="100%"
                                              left={0}
                                              mt={-1}
                                              zIndex={2000}
                                              bg="gray.800"
                                              color="white"
                                              borderRadius="md"
                                              px={3}
                                              py={2}
                                              fontFamily="monospace"
                                              fontSize="xs"
                                              boxShadow="lg"
                                              textAlign="left"
                                              minW="220px"
                                              maxW="260px"
                                              pointerEvents="auto"
                                              onMouseEnter={() =>
                                                setOpenSelectorTooltip(i)
                                              }
                                              onMouseLeave={() =>
                                                setOpenSelectorTooltip(null)
                                              }
                                            >
                                              <Box>{auth.selector[0]}</Box>
                                              <Box mt={1}>
                                                <Link
                                                  href={`https://www.4byte.directory/signatures/?bytes4_signature=${auth.selector[0]}`}
                                                  isExternal
                                                  color="blue.200"
                                                  textDecoration="underline"
                                                  fontSize="xs"
                                                  fontFamily="monospace"
                                                >
                                                  4byte.directory ↗
                                                </Link>
                                              </Box>
                                            </Box>
                                          )}
                                        </span>
                                      ) : (
                                        <span>-</span>
                                      )}
                                    </Td>
                                    <Td
                                      fontFamily="monospace"
                                      textAlign="center"
                                      fontSize="xs"
                                    >
                                      {auth.target === ADDRESS_ZERO ? (
                                        <span>*</span>
                                      ) : (
                                        <Link
                                          href={`https://etherscan.io/address/${auth.target}`}
                                          isExternal
                                          color="blue.600"
                                          textDecoration="underline"
                                        >
                                          {abbreviateAddress(auth.target)}
                                        </Link>
                                      )}
                                    </Td>
                                    <Td
                                      fontFamily="monospace"
                                      textAlign="center"
                                      fontSize="xs"
                                    >
                                      <Link
                                        href={`https://etherscan.io/address/${auth.caller}`}
                                        isExternal
                                        color="blue.600"
                                        textDecoration="underline"
                                      >
                                        {abbreviateAddress(auth.caller)}
                                      </Link>
                                    </Td>
                                    <Td
                                      fontFamily="monospace"
                                      textAlign="center"
                                      fontSize="xs"
                                      minWidth="60px"
                                      maxWidth="60px"
                                      style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {auth.auth_hook === ADDRESS_ZERO ? (
                                        <span>None</span>
                                      ) : (
                                        <Link
                                          href={`https://etherscan.io/address/${auth.auth_hook}`}
                                          isExternal
                                          color="blue.600"
                                          textDecoration="underline"
                                        >
                                          {abbreviateAddress(auth.auth_hook)}
                                        </Link>
                                      )}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
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
                          </Box>
                        ) : (
                          <Text>No authorizations found.</Text>
                        )}
                      </TabPanel>
                      <TabPanel px={0} py={0}>
                        <Box
                          border="1px solid black"
                          borderTopWidth={0}
                          borderRadius="0 0 10px 10px"
                          px={0}
                          py={0}
                          bg="white"
                          mt={0}
                        >
                          <Stack
                            spacing={3}
                            align="center"
                            fontFamily="monospace"
                            fontSize="xs"
                            mt={1}
                          >
                            <Text textAlign="left">
                              Resupply Core is the owner of all protocol
                              contracts. Resupply manages authorizations by
                              granting fine-grain permissions for callers to
                              specified function selectors.
                            </Text>
                          </Stack>
                        </Box>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Box>
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

export default Authorizations;
