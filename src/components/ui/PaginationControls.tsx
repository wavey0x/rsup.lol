import { Flex, Button, Text } from "@chakra-ui/react";
import { designTokens } from "../../theme";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Pagination controls for tables
 * Consistent pagination UI across all paginated lists
 */
export function PaginationControls({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationControlsProps) {
  const handlePrevious = () => {
    if (currentPage > 0) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <Flex
      justify="center"
      align="center"
      mt={4}
      gap={3}
      fontFamily="monospace"
    >
      <Button
        size="xs"
        onClick={handlePrevious}
        isDisabled={currentPage === 0}
        fontFamily="monospace"
        variant="ghost"
        minW="auto"
        px={2}
        transition={designTokens.transitions.fast}
        bg="transparent"
        _hover={{
          bg: "transparent",
          textDecoration: "underline",
        }}
        _disabled={{
          opacity: 0.3,
          cursor: "not-allowed",
        }}
        _active={{
          bg: "transparent",
        }}
      >
        {"<"}
      </Button>

      <Text
        fontSize="xs"
        fontFamily="monospace"
        color="gray.700"
        minW="80px"
        textAlign="center"
        {...designTokens.typography.body}
      >
        {currentPage + 1} / {totalPages}
      </Text>

      <Button
        size="xs"
        onClick={handleNext}
        isDisabled={currentPage >= totalPages - 1}
        fontFamily="monospace"
        variant="ghost"
        minW="auto"
        px={2}
        transition={designTokens.transitions.fast}
        bg="transparent"
        _hover={{
          bg: "transparent",
          textDecoration: "underline",
        }}
        _disabled={{
          opacity: 0.3,
          cursor: "not-allowed",
        }}
        _active={{
          bg: "transparent",
        }}
      >
        {">"}
      </Button>
    </Flex>
  );
}
