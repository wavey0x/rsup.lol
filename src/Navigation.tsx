import {
  Box,
  Flex,
  Text,
  Image,
  Collapse,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { useRef, useEffect } from "react";
import { ChevronDownIcon } from "@chakra-ui/icons";
import { useLocation, useNavigate } from "react-router-dom";

const pages = [
  {
    id: "markets",
    name: "Markets",
    logo: "/hippo_markets.png",
  },
  {
    id: "retention",
    name: "Retention Program",
    logo: "/hippo_retention.png",
  },
  {
    id: "authorizations",
    name: "Authorizations",
    logo: "/hippo_auth.png",
  },
  {
    id: "protocoldebt",
    name: "Protocol Debt",
    logo: "/hippo_blue.png",
  },
  {
    id: "sreusd",
    name: "sreUSD",
    logo: "/hippo_sreusd.png",
  },
  {
    id: "incentives",
    name: "Incentives",
    logo: "/hippo_incentives.png",
  },
  {
    id: "positionmonitor",
    name: "Position Monitor",
    logo: "/hippo_positionmonitor.png",
  },
];

const PAGE_TO_PATH: { [key: string]: string } = {
  markets: "/markets",
  sreusd: "/sreusd",
  retention: "/retention",
  authorizations: "/authorizations",
  protocoldebt: "/protocoldebt",
  incentives: "/incentives",
  positionmonitor: "/position-monitor",
};
const PATH_TO_PAGE: { [key: string]: string } = {
  "/": "markets",
  "/markets": "markets",
  "/sreusd": "sreusd",
  "/retention": "retention",
  "/authorizations": "authorizations",
  "/protocoldebt": "protocoldebt",
  "/incentives": "incentives",
  "/position-monitor": "positionmonitor",
};

export function Navigation() {
  const { isOpen, onToggle } = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPage = PATH_TO_PAGE[location.pathname] || "markets";
  const currentPageData = pages.find((page) => page.id === currentPage);
  const navRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        onToggle();
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onToggle]);

  return (
    <Box
      ref={navRef}
      position="fixed"
      top={4}
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      bg="white"
      borderRadius={isOpen ? "xl xl 0 0" : "xl"}
      boxShadow="0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)"
      border="1px solid"
      borderColor="gray.150"
      w={{ base: "380px", md: "448px" }}
      minW={{ base: "380px", md: "448px" }}
      maxW={{ base: "380px", md: "448px" }}
    >
      <Flex direction="column">
        {/* Active page display */}
        <Flex
          align="center"
          py={4}
          px={4}
          cursor="pointer"
          onClick={onToggle}
          _hover={{ bg: "gray.25" }}
          borderRadius={isOpen ? "xl xl 0 0" : "xl"}
          w="100%"
          position="relative"
          transition="background-color 0.15s ease"
        >
          <Image
            src={currentPageData?.logo}
            alt={currentPageData?.name}
            h="64px"
            w="auto"
            maxW="64px"
            objectFit="contain"
            position="absolute"
            left="12px"
          />
          <Text
            fontFamily="monospace"
            fontSize="lg"
            fontWeight="semibold"
            color="gray.900"
            textAlign="center"
            flex="1"
            letterSpacing="-0.025em"
          >
            {currentPageData?.name}
          </Text>
          <ChevronDownIcon
            boxSize={5}
            color="gray.400"
            position="absolute"
            right="14px"
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
            transition="all 0.2s ease"
          />
        </Flex>

        {/* Collapsible menu */}
        <Collapse in={isOpen} animateOpacity>
          <Box
            bg="white"
            borderTop="1px solid"
            borderColor="gray.150"
            borderRadius="0"
            overflow="hidden"
            mt={1}
          >
            <VStack spacing={0} align="stretch">
              {pages
                .filter((page) => page.id !== currentPage)
                .map((page) => (
                  <Flex
                    key={page.id}
                    align="center"
                    py={3}
                    px={3}
                    cursor="pointer"
                    onClick={() => {
                      navigate(PAGE_TO_PATH[page.id]);
                      onToggle();
                    }}
                    _hover={{ bg: "gray.50", transform: "translateX(2px)" }}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    w="100%"
                    position="relative"
                    transition="all 0.15s ease"
                    _last={{ borderBottom: "none" }}
                  >
                    <Image
                      src={page.logo}
                      alt={page.name}
                      h="32px"
                      w="auto"
                      maxW="32px"
                      objectFit="contain"
                      position="absolute"
                      left="8px"
                    />
                    <Text
                      fontFamily="monospace"
                      fontSize="sm"
                      color="gray.700"
                      textAlign="center"
                      flex="1"
                      fontWeight="medium"
                    >
                      {page.name}
                    </Text>
                  </Flex>
                ))}
            </VStack>
          </Box>
        </Collapse>
      </Flex>
    </Box>
  );
}
