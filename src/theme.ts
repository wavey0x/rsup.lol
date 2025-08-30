import { theme } from "@chakra-ui/react";

// Custom theme extension for monospace and compact table
export const customTheme = {
  ...theme,
  components: {
    Table: {
      baseStyle: {
        th: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 1, md: 2 },
          px: { base: 1, md: 2 },
          cursor: "pointer",
          userSelect: "none",
          _hover: {
            bg: "gray.50",
          },
        },
        td: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 0.5, md: 1 },
          px: { base: 1, md: 2 },
        },
      },
    },
  },
};

export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23ffffff'/%3E%3Ctext x='12' y='17' text-anchor='middle' font-size='16' font-family='monospace' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E";
