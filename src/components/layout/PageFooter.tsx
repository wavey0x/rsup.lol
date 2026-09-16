import { Box, Text } from "@chakra-ui/react";
import { formatDistanceToNow } from "date-fns";
import { designTokens } from "../../theme";
import { useEffect, useState } from "react";

interface PageFooterProps {
  lastUpdateDate?: Date | null;
  error?: string | null;
}

/**
 * Fixed footer component showing last update time
 * Displays across all pages with consistent styling
 */
export function PageFooter({
  lastUpdateDate,
  error,
}: PageFooterProps) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const stale = lastUpdateDate && now - lastUpdateDate.getTime() > 15 * 60 * 1000;
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
        color={error || stale ? "orange.800" : "gray.600"}
        fontFamily="monospace"
        {...designTokens.typography.caption}
      >
        {stale ? "Stale data — " : "Data updated: "}
        {lastUpdateDate
          ? formatDistanceToNow(lastUpdateDate, { addSuffix: true })
          : "unknown"}
        {error && ` · ${error}`}
      </Text>
    </Box>
  );
}
