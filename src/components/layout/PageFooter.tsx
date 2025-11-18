import { Box, Text } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { designTokens } from "../../theme";

interface PageFooterProps {
  lastUpdateDate?: Date | null;
  lastUpdateFromApi?: string | null;
  lastUpdated: Date;
}

/**
 * Fixed footer component showing last update time
 * Displays across all pages with consistent styling
 */
export function PageFooter({
  lastUpdateDate,
  lastUpdateFromApi,
  lastUpdated,
}: PageFooterProps) {
  return (
    <Box
      position="fixed"
      bottom={0}
      left={0}
      right={0}
      bg="gray.100"
      p={1}
      textAlign="center"
      transition={designTokens.transitions.fast}
      borderTop="1px solid"
      borderColor="gray.200"
    >
      <Text
        fontSize="xs"
        color="gray.600"
        fontFamily="monospace"
        {...designTokens.typography.caption}
      >
        Last updated:{" "}
        {lastUpdateDate
          ? formatDistanceToNow(lastUpdateDate, { addSuffix: true })
          : lastUpdateFromApi ||
            formatDistanceToNow(lastUpdated, { addSuffix: true })}
      </Text>
    </Box>
  );
}
