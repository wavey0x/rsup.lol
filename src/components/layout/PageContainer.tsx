import { ReactNode } from "react";
import { Container, ChakraProvider } from "@chakra-ui/react";
import { customTheme, designTokens } from "../../theme";

interface PageContainerProps {
  children: ReactNode;
  maxWidth?: "narrow" | "medium" | "wide" | "full";
}

/**
 * Standardized page container with consistent spacing and theme
 * Wraps all page content with ChakraProvider
 */
export function PageContainer({
  children,
  maxWidth = "full",
}: PageContainerProps) {
  const widthConfig = designTokens.containerWidths[maxWidth];

  return (
    <ChakraProvider theme={customTheme}>
      <Container
        maxW={widthConfig}
        py={4}
        minH="100vh"
        pt={designTokens.spacing.pageTop}
        mt={designTokens.spacing.pageMargin}
        px={designTokens.spacing.containerPadding}
        mx="auto"
      >
        {children}
      </Container>
    </ChakraProvider>
  );
}
