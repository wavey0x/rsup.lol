import { Box, Text, Alert, AlertIcon, AlertTitle, AlertDescription } from "@chakra-ui/react";
import { designTokens } from "../../theme";

interface ErrorStateProps {
  message: string;
  title?: string;
  variant?: "simple" | "alert";
}

/**
 * Standardized error state display
 * Consistent error messaging across all pages
 */
export function ErrorState({
  message,
  title = "Error",
  variant = "simple",
}: ErrorStateProps) {
  if (variant === "alert") {
    return (
      <Alert
        status="error"
        mb={4}
        borderRadius={designTokens.borderRadius.button}
        fontFamily="monospace"
      >
        <AlertIcon />
        <Box>
          <AlertTitle fontFamily="monospace">{title}</AlertTitle>
          <AlertDescription fontFamily="monospace">{message}</AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <Box py={8} textAlign="center">
      <Text
        color="red.500"
        fontFamily="monospace"
        fontSize="sm"
        {...designTokens.typography.body}
      >
        {message}
      </Text>
    </Box>
  );
}
