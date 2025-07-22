import {
  Box,
  Flex,
  Text,
  Image,
  Collapse,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";
import { ChevronDownIcon } from "@chakra-ui/icons";

interface NavigationProps {
  currentPage: string;
  onPageChange: (page: string) => void;
}

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
];

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  const { isOpen, onToggle } = useDisclosure();
  const currentPageData = pages.find((page) => page.id === currentPage);

  return (
    <Box
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
        >
          <Image
            src={currentPageData?.logo}
            alt={currentPageData?.name}
            boxSize="64px"
            mr={3}
          />
          <Text
            fontFamily="monospace"
            fontSize="lg"
            fontWeight="bold"
            color="gray.800"
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
                      onPageChange(page.id);
                      onToggle();
                    }}
                    _hover={{ bg: "gray.50" }}
                    borderBottom="1px solid"
                    borderColor="gray.100"
                  >
                    <Image
                      src={page.logo}
                      alt={page.name}
                      boxSize="32px"
                      mr={2}
                    />
                    <Text fontFamily="monospace" fontSize="sm" color="gray.600">
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
