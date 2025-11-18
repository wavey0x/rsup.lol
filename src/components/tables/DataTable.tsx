import type { ReactNode } from "react";
import { Table, Thead, Tbody, Box } from "@chakra-ui/react";
import { designTokens } from "../../theme";

interface DataTableProps {
  children: ReactNode;
  variant?: "simple" | "striped";
  size?: "sm" | "md" | "lg";
}

/**
 * Standardized data table wrapper with consistent styling
 * Ensures uniform spacing, borders, and hover states across all tables
 */
export function DataTable({
  children,
  variant = "simple",
  size = "sm",
}: DataTableProps) {
  return (
    <Box
      overflowX="auto"
      borderRadius={designTokens.borderRadius.button}
      border="1px solid"
      borderColor="black"
      bg="white"
    >
      <Table
        variant={variant}
        size={size}
        sx={{
          borderCollapse: "separate",
          borderSpacing: 0,
        }}
      >
        {children}
      </Table>
    </Box>
  );
}

// Export common table components for convenience
export { Thead, Tbody };
