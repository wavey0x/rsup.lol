import { useEffect, useState } from "react";
import {
  Box,
  Text,
  Spinner,
  Center,
  Container,
  Flex,
  Stack,
  Link,
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
  Tooltip,
} from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import axios from "axios";
import { customTheme } from "./Markets";
import { formatNumberWithAbbreviation } from "./utils/format";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";

function abbreviateAddress(addr: string) {
  return addr ? `${addr.slice(0, 5)}..${addr.slice(-3)}` : "";
}

function abbreviateHash(hash: string) {
  return hash ? `${hash.slice(0, 5)}..${hash.slice(-3)}` : "";
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

function SimpleLineChart({ data }: { data: any[] }) {
  if (!data || data.length === 0) {
    return (
      <Box p={4} textAlign="center" color="gray.500" fontFamily="monospace">
        No chart data available
      </Box>
    );
  }

  // Sort data by timestamp
  const sortedData = [...data].sort((a, b) => a.timestamp - b.timestamp);

  // Get min and max values for scaling
  const amounts = sortedData.map((d) => Number(d.amount) || 0);
  const minAmount = Math.min(...amounts, 0);
  const maxAmount = Math.max(...amounts);
  const amountRange = maxAmount - minAmount;

  // Chart dimensions
  const width = 400;
  const height = 200;
  const padding = 40;
  const chartWidth = width - 2 * padding;
  const chartHeight = height - 2 * padding;

  // Generate X-axis ticks every 15 days
  const generateXTicks = () => {
    if (sortedData.length < 2) return [];

    const startDate = new Date(sortedData[0].timestamp * 1000);
    const endDate = new Date(
      sortedData[sortedData.length - 1].timestamp * 1000
    );
    const ticks = [];

    let currentDate = new Date(startDate);
    currentDate.setDate(currentDate.getDate() - (currentDate.getDate() % 15)); // Round down to nearest 15th

    while (currentDate <= endDate) {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = monthNames[currentDate.getMonth()];
      const day = currentDate.getDate();

      // Calculate position on chart
      const timeDiff = endDate.getTime() - startDate.getTime();
      const currentTimeDiff = currentDate.getTime() - startDate.getTime();
      const x = padding + (currentTimeDiff / timeDiff) * chartWidth;

      if (x >= padding && x <= width - padding) {
        ticks.push({
          x,
          label: `${month} ${day}`,
          date: new Date(currentDate),
        });
      }

      currentDate.setDate(currentDate.getDate() + 15);
    }

    return ticks;
  };

  const xTicks = generateXTicks();

  // Create SVG path for the line
  const points = sortedData.map((point, index) => {
    const x =
      padding + (index / Math.max(sortedData.length - 1, 1)) * chartWidth;
    let normalizedAmount;
    if (amountRange > 0) {
      normalizedAmount = (Number(point.amount) - minAmount) / amountRange;
    } else {
      // If all values are the same, show a horizontal line in the middle
      normalizedAmount = 0.5;
    }
    const y = height - padding - normalizedAmount * chartHeight;
    return `${x},${y}`;
  });

  const pathData = points.length > 0 ? `M ${points.join(" L ")}` : "";

  return (
    <Box mb={4} p={2}>
      <Box display="flex" justifyContent="center">
        <svg width={width} height={height}>
          {/* Y-axis labels */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = height - padding - ratio * chartHeight;
            const value = minAmount + ratio * amountRange;
            return (
              <text
                key={i}
                x={padding - 5}
                y={y + 3}
                fontSize="10px"
                fontFamily="monospace"
                textAnchor="end"
                fill="#666"
              >
                {formatNumberWithAbbreviation(value)}
              </text>
            );
          })}

          {/* Smooth line chart */}
          <path
            d={pathData}
            stroke="#3182ce"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* X-axis labels */}
          {xTicks.map((tick, i) => (
            <text
              key={i}
              x={tick.x}
              y={height - padding + 15}
              fontSize="10px"
              fontFamily="monospace"
              textAnchor="middle"
              fill="#666"
            >
              {tick.label}
            </text>
          ))}
        </svg>
      </Box>
    </Box>
  );
}

function ProtocolDebt() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [lastUpdateFromApi, setLastUpdateFromApi] = useState<string | null>(
    null
  );
  const [lastUpdateDate, setLastUpdateDate] = useState<Date | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const badDebtPayments = Array.isArray(data?.loan_repayment?.bad_debt_payments)
    ? data.loan_repayment.bad_debt_payments
    : [];
  const repayments = Array.isArray(data?.loan_repayment?.repayments)
    ? data.loan_repayment.repayments
    : [];
  const badDebtHistory = Array.isArray(data?.loan_repayment?.bad_debt_history)
    ? data.loan_repayment.bad_debt_history
    : [];
  const yearnLoanHistory = Array.isArray(
    data?.loan_repayment?.yearn_loan_history
  )
    ? data.loan_repayment.yearn_loan_history
    : [];

  const badDebtPageCount = Math.ceil(badDebtPayments.length / PAGE_SIZE);
  const repaymentsPageCount = Math.ceil(repayments.length / PAGE_SIZE);
  const pagedBadDebt = badDebtPayments.slice(
    page * PAGE_SIZE,
    (page + 1) * PAGE_SIZE
  );
  const pagedRepayments = repayments.slice(
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
        setError("Failed to load yearn loan data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1200);
  };

  // Top data calculations
  const remainingBadDebt =
    Number(data?.loan_repayment?.current_state?.remaining_bad_debt) || 0;
  const remainingYearnDebt =
    Number(data?.loan_repayment?.current_state?.remaining_debt) || 0;
  const badDebtPaid =
    Number(data?.loan_repayment?.current_state?.bad_debt_paid) || 0;
  const totalRepaid =
    Number(data?.loan_repayment?.current_state?.total_repaid) || 0;

  const topData = [
    {
      label: "Remaining Bad Debt",
      value: `$${formatNumberWithAbbreviation(remainingBadDebt)}`,
      fullValue: `$${Math.floor(remainingBadDebt).toLocaleString()}`,
    },
    {
      label: "Remaining Yearn Debt",
      value: `$${formatNumberWithAbbreviation(remainingYearnDebt)}`,
      fullValue: `$${Math.floor(remainingYearnDebt).toLocaleString()}`,
    },
    {
      label: "Bad Debt Paid",
      value: `$${formatNumberWithAbbreviation(badDebtPaid)}`,
      fullValue: `$${Math.floor(badDebtPaid).toLocaleString()}`,
    },
    {
      label: "Total Repaid",
      value: `$${formatNumberWithAbbreviation(totalRepaid)}`,
      fullValue: `$${Math.floor(totalRepaid).toLocaleString()}`,
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
                        Yearn Loan
                      </Tab>
                      <Tab
                        fontFamily="monospace"
                        fontWeight="normal"
                        fontSize="sm"
                        flex="1"
                        borderRight="1px solid black"
                        borderRadius="0"
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
                        Bad Debt
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
                    <TabPanels
                      border="1px solid black"
                      borderTopWidth={0}
                      borderRadius="0 0 10px 10px"
                    >
                      {/* Yearn Loan Tab */}
                      <TabPanel px={0} py={0}>
                        <Flex
                          direction="row"
                          justify="center"
                          align="center"
                          mb={2}
                          gap={4}
                          wrap="wrap"
                        >
                          <Box
                            as="table"
                            mx="auto"
                            style={{ borderCollapse: "collapse" }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "2px 8px",
                                    fontFamily: "monospace",
                                    fontSize: "15px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Remaining Yearn Debt:
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
                                  <Tooltip
                                    label={topData[1].fullValue}
                                    fontSize="xs"
                                    hasArrow
                                    placement="top"
                                    bg="gray.800"
                                    color="white"
                                    borderRadius="md"
                                    p={2}
                                    fontFamily="monospace"
                                  >
                                    <span style={{ cursor: "pointer" }}>
                                      {topData[1].value}
                                    </span>
                                  </Tooltip>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "2px 8px",
                                    fontFamily: "monospace",
                                    fontSize: "15px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Total Repaid:
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
                                  <Tooltip
                                    label={topData[3].fullValue}
                                    fontSize="xs"
                                    hasArrow
                                    placement="top"
                                    bg="gray.800"
                                    color="white"
                                    borderRadius="md"
                                    p={2}
                                    fontFamily="monospace"
                                  >
                                    <span style={{ cursor: "pointer" }}>
                                      {topData[3].value}
                                    </span>
                                  </Tooltip>
                                </td>
                              </tr>
                            </tbody>
                          </Box>
                        </Flex>
                        <SimpleLineChart data={yearnLoanHistory} />
                        {repayments.length > 0 ? (
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
                                    Date
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
                                    Payer
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
                                    Txn
                                  </Th>
                                  <Th
                                    fontFamily="monospace"
                                    color="black"
                                    borderColor="black"
                                    fontSize="xs"
                                    textAlign="center"
                                    px={2}
                                    py={0}
                                    minWidth="93px"
                                    maxWidth="93px"
                                    whiteSpace="nowrap"
                                  >
                                    Amount
                                  </Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {pagedRepayments.map(
                                  (repayment: any, i: number) => (
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
                                        {repayment.timestamp
                                          ? formatDate(repayment.timestamp)
                                          : "-"}
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
                                        <Link
                                          href={`https://etherscan.io/address/${repayment.payer}`}
                                          isExternal
                                          color="blue.600"
                                          textDecoration="underline"
                                        >
                                          {abbreviateAddress(repayment.payer)}
                                        </Link>
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
                                        <Link
                                          href={`https://etherscan.io/tx/${repayment.txn}`}
                                          isExternal
                                          color="blue.600"
                                          textDecoration="underline"
                                        >
                                          {abbreviateHash(repayment.txn)}
                                        </Link>
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
                                        {repayment.amount !== undefined
                                          ? Math.floor(
                                              Number(repayment.amount)
                                            ).toLocaleString()
                                          : "-"}
                                      </Td>
                                    </Tr>
                                  )
                                )}
                              </Tbody>
                            </Table>
                            {repaymentsPageCount > 1 && (
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
                                  {page + 1} / {repaymentsPageCount}
                                </Text>
                                <Button
                                  size="xs"
                                  onClick={() =>
                                    setPage((p) =>
                                      Math.min(repaymentsPageCount - 1, p + 1)
                                    )
                                  }
                                  disabled={page >= repaymentsPageCount - 1}
                                  fontFamily="monospace"
                                  aria-label="Next Page"
                                >
                                  {">"}
                                </Button>
                              </Flex>
                            )}
                          </Box>
                        ) : (
                          <Text>No repayments found.</Text>
                        )}
                      </TabPanel>

                      {/* Bad Debt Tab */}
                      <TabPanel px={0} py={0}>
                        <Flex
                          direction="row"
                          justify="center"
                          align="center"
                          mb={2}
                          gap={4}
                          wrap="wrap"
                        >
                          <Box
                            as="table"
                            mx="auto"
                            style={{ borderCollapse: "collapse" }}
                          >
                            <tbody>
                              <tr>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "2px 8px",
                                    fontFamily: "monospace",
                                    fontSize: "15px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Remaining Bad Debt:
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
                                  <Tooltip
                                    label={topData[0].fullValue}
                                    fontSize="xs"
                                    hasArrow
                                    placement="top"
                                    bg="gray.800"
                                    color="white"
                                    borderRadius="md"
                                    p={2}
                                    fontFamily="monospace"
                                  >
                                    <span style={{ cursor: "pointer" }}>
                                      {topData[0].value}
                                    </span>
                                  </Tooltip>
                                </td>
                              </tr>
                              <tr>
                                <td
                                  style={{
                                    textAlign: "right",
                                    padding: "2px 8px",
                                    fontFamily: "monospace",
                                    fontSize: "15px",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  Bad Debt Paid:
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
                                  <Tooltip
                                    label={topData[2].fullValue}
                                    fontSize="xs"
                                    hasArrow
                                    placement="top"
                                    bg="gray.800"
                                    color="white"
                                    borderRadius="md"
                                    p={2}
                                    fontFamily="monospace"
                                  >
                                    <span style={{ cursor: "pointer" }}>
                                      {topData[2].value}
                                    </span>
                                  </Tooltip>
                                </td>
                              </tr>
                            </tbody>
                          </Box>
                        </Flex>
                        <SimpleLineChart data={badDebtHistory} />
                        {badDebtPayments.length > 0 ? (
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
                                    Date
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
                                    Payer
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
                                    Txn
                                  </Th>
                                  <Th
                                    fontFamily="monospace"
                                    color="black"
                                    borderColor="black"
                                    fontSize="xs"
                                    textAlign="center"
                                    px={2}
                                    py={0}
                                    minWidth="93px"
                                    maxWidth="93px"
                                    whiteSpace="nowrap"
                                  >
                                    Amount
                                  </Th>
                                </Tr>
                              </Thead>
                              <Tbody>
                                {pagedBadDebt.map((payment: any, i: number) => (
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
                                      {payment.timestamp
                                        ? formatDate(payment.timestamp)
                                        : "-"}
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
                                      <Link
                                        href={`https://etherscan.io/address/${payment.payer}`}
                                        isExternal
                                        color="blue.600"
                                        textDecoration="underline"
                                      >
                                        {abbreviateAddress(payment.payer)}
                                      </Link>
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
                                      <Link
                                        href={`https://etherscan.io/tx/${payment.txn}`}
                                        isExternal
                                        color="blue.600"
                                        textDecoration="underline"
                                      >
                                        {abbreviateHash(payment.txn)}
                                      </Link>
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
                                      {payment.amount !== undefined
                                        ? Math.floor(
                                            Number(payment.amount)
                                          ).toLocaleString()
                                        : "-"}
                                    </Td>
                                  </Tr>
                                ))}
                              </Tbody>
                            </Table>
                            {badDebtPageCount > 1 && (
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
                                  {page + 1} / {badDebtPageCount}
                                </Text>
                                <Button
                                  size="xs"
                                  onClick={() =>
                                    setPage((p) =>
                                      Math.min(badDebtPageCount - 1, p + 1)
                                    )
                                  }
                                  disabled={page >= badDebtPageCount - 1}
                                  fontFamily="monospace"
                                  aria-label="Next Page"
                                >
                                  {">"}
                                </Button>
                              </Flex>
                            )}
                          </Box>
                        ) : (
                          <Text>No bad debt payments found.</Text>
                        )}
                      </TabPanel>

                      {/* Info Tab */}
                      <TabPanel px={0} py={0}>
                        <Box
                          border="1px solid black"
                          borderTopWidth={0}
                          borderRadius="0 0 10px 10px"
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
                            <Box w="100%">
                              <Text fontWeight="bold" mb={2} textAlign="center">
                                Loan Terms
                              </Text>
                              <Flex alignItems="center" gap={2} mb={1}>
                                <Text minW="140px" textAlign="left">
                                  Principal:
                                </Text>
                                <Text>1.13M crvUSD</Text>
                              </Flex>
                              <Flex alignItems="center" gap={2} mb={3}>
                                <Text minW="140px" textAlign="left">
                                  Interest Rate:
                                </Text>
                                <Text>6% APR</Text>
                              </Flex>
                              <Box
                                borderTop="1px solid"
                                borderColor="gray.300"
                                my={3}
                              />
                              <Flex alignItems="center" gap={2} mb={1}>
                                <Text minW="140px" textAlign="left">
                                  Loan Repayer:
                                </Text>
                                <Flex alignItems="center" gap={1}>
                                  <Link
                                    href="https://etherscan.io/address/0x4C0fFC2B96f3C6b048eF85d1A4744c8e36B5b6F6"
                                    isExternal
                                    color="blue.500"
                                    wordBreak="break-all"
                                  >
                                    {abbreviateAddress(
                                      "0x4C0fFC2B96f3C6b048eF85d1A4744c8e36B5b6F6"
                                    )}
                                  </Link>
                                  <Box
                                    as="button"
                                    ml={1}
                                    onClick={() =>
                                      handleCopy(
                                        "0x4C0fFC2B96f3C6b048eF85d1A4744c8e36B5b6F6"
                                      )
                                    }
                                    p={0.5}
                                    borderRadius="sm"
                                    bg="white"
                                    _hover={{ bg: "gray.100" }}
                                    transition="all 0.2s"
                                  >
                                    {copied ===
                                    "0x4C0fFC2B96f3C6b048eF85d1A4744c8e36B5b6F6" ? (
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
                              <Flex alignItems="center" gap={2} mb={1}>
                                <Text minW="140px" textAlign="left">
                                  Loan Converter:
                                </Text>
                                <Flex alignItems="center" gap={1}>
                                  <Link
                                    href="https://etherscan.io/address/0xf4aA178D7096E207Dc899d556c57336795311D53"
                                    isExternal
                                    color="blue.500"
                                    wordBreak="break-all"
                                  >
                                    {abbreviateAddress(
                                      "0xf4aA178D7096E207Dc899d556c57336795311D53"
                                    )}
                                  </Link>
                                  <Box
                                    as="button"
                                    ml={1}
                                    onClick={() =>
                                      handleCopy(
                                        "0xf4aA178D7096E207Dc899d556c57336795311D53"
                                      )
                                    }
                                    p={0.5}
                                    borderRadius="sm"
                                    bg="white"
                                    _hover={{ bg: "gray.100" }}
                                    transition="all 0.2s"
                                  >
                                    {copied ===
                                    "0xf4aA178D7096E207Dc899d556c57336795311D53" ? (
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
                              <Flex alignItems="center" gap={2} mb={1}>
                                <Text minW="140px" textAlign="left">
                                  Bad Debt Repayer:
                                </Text>
                                <Flex alignItems="center" gap={1}>
                                  <Link
                                    href="https://etherscan.io/address/0xcB2b60bE903556668e8ac172e91a61aD1A2F7CD1"
                                    isExternal
                                    color="blue.500"
                                    wordBreak="break-all"
                                  >
                                    {abbreviateAddress(
                                      "0xcB2b60bE903556668e8ac172e91a61aD1A2F7CD1"
                                    )}
                                  </Link>
                                  <Box
                                    as="button"
                                    ml={1}
                                    onClick={() =>
                                      handleCopy(
                                        "0xcB2b60bE903556668e8ac172e91a61aD1A2F7CD1"
                                      )
                                    }
                                    p={0.5}
                                    borderRadius="sm"
                                    bg="white"
                                    _hover={{ bg: "gray.100" }}
                                    transition="all 0.2s"
                                  >
                                    {copied ===
                                    "0xcB2b60bE903556668e8ac172e91a61aD1A2F7CD1" ? (
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

export default ProtocolDebt;
