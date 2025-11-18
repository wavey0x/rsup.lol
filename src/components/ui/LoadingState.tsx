import { Center, Spinner, Box, keyframes } from "@chakra-ui/react";

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

interface LoadingStateProps {
  size?: "sm" | "md" | "lg" | "xl";
  minHeight?: string | number;
}

/**
 * Standardized loading state with spinner
 * Consistent loading indicator across all pages
 */
export function LoadingState({ size = "lg", minHeight = "200px" }: LoadingStateProps) {
  return (
    <Center py={8} w="100%" minH={minHeight}>
      <Box
        animation={`${fadeIn} 0.3s ease-in`}
      >
        <Spinner
          size={size}
          thickness="3px"
          speed="0.8s"
          color="gray.800"
          emptyColor="gray.200"
        />
      </Box>
    </Center>
  );
}
