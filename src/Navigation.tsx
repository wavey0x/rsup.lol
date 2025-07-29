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
    id: "yearnloan",
    name: "Yearn Loan",
    logo: "/hippo_blue.png",
  },
];

const PAGE_TO_PATH: { [key: string]: string } = {
  markets: "/markets",
  retention: "/retention",
  authorizations: "/authorizations",
  yearnloan: "/yearnloan",
};
const PATH_TO_PAGE: { [key: string]: string } = {
  "/": "markets",
  "/markets": "markets",
  "/retention": "retention",
  "/authorizations": "authorizations",
  "/yearnloan": "yearnloan",
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
      top={2}
      left="50%"
      transform="translateX(-50%)"
      zIndex={1000}
      bg="white"
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
      minW={{ base: "280px", md: "auto" }}
      w={{ base: "90vw", md: "auto" }}
      maxW={{ base: "400px", md: "none" }}
    >
      <Flex direction="column">
        {/* Active page display */}
        <Flex
          align="center"
          justify="center"
          py={1}
          px={3}
          cursor="pointer"
          onClick={onToggle}
          _hover={{ bg: "gray.50" }}
          borderRadius="lg"
          minW="220px"
        >
          <Image
            src={currentPageData?.logo}
            alt={currentPageData?.name}
            h="64px"
            w="auto"
            maxW="64px"
            objectFit="contain"
            mr={3}
          />
          <Text
            fontFamily="monospace"
            fontSize="lg"
            fontWeight="bold"
            color="gray.800"
            minW="160px"
            textAlign="center"
          >
            {currentPageData?.name}
          </Text>
          <ChevronDownIcon
            boxSize={5}
            color="gray.500"
            ml={3}
            transform={isOpen ? "rotate(180deg)" : "rotate(0deg)"}
            transition="transform 0.2s"
          />
        </Flex>

        {/* Collapsible menu */}
        <Collapse in={isOpen} animateOpacity>
          <Box
            bg="white"
            borderTop="1px solid"
            borderColor="gray.200"
            borderRadius="0 0 lg lg"
            overflow="hidden"
          >
            <VStack spacing={0} align="stretch">
              {pages
                .filter((page) => page.id !== currentPage)
                .map((page) => (
                  <Flex
                    key={page.id}
                    align="center"
                    p={2}
                    cursor="pointer"
                    onClick={() => {
                      navigate(PAGE_TO_PATH[page.id]);
                      onToggle();
                    }}
                    _hover={{ bg: "gray.50" }}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                    minW="220px"
                  >
                    <Image
                      src={page.logo}
                      alt={page.name}
                      h="32px"
                      w="auto"
                      maxW="32px"
                      objectFit="contain"
                      mr={2}
                    />
                    <Text
                      fontFamily="monospace"
                      fontSize="sm"
                      color="gray.600"
                      minW="160px"
                      textAlign="left"
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
