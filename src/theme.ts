import { extendTheme } from "@chakra-ui/react";

// Design Tokens - Refined minimalist black and white aesthetic
export const designTokens = {
  // Sophisticated gray scale for depth while maintaining minimalism
  colors: {
    gray: {
      50: "#FAFAFA",   // Lightest backgrounds
      100: "#F5F5F5",  // Hover states, subtle backgrounds
      150: "#EEEEEE",  // Custom: borders, dividers
      200: "#E5E5E5",  // Borders
      300: "#D4D4D4",  // Dividers, disabled backgrounds
      400: "#A3A3A3",  // Disabled text, placeholders
      500: "#737373",  // Secondary text
      600: "#525252",  // Primary text
      800: "#262626",  // Headers, emphasis
      900: "#171717",  // Strong emphasis
    },
  },

  // Typography hierarchy - refined weights and spacing
  typography: {
    display: {
      fontWeight: 600,
      letterSpacing: "-0.02em",
      lineHeight: 1.1,
    },
    heading: {
      fontWeight: 500,
      letterSpacing: "-0.01em",
      lineHeight: 1.2,
    },
    body: {
      fontWeight: 400,
      letterSpacing: "0em",
      lineHeight: 1.5,
    },
    caption: {
      fontWeight: 400,
      letterSpacing: "0.01em",
      lineHeight: 1.4,
      opacity: 0.8,
    },
  },

  // Transition system for smooth interactions
  transitions: {
    fast: "all 0.15s ease",
    normal: "all 0.2s ease",
    slow: "all 0.3s ease-in-out",
  },

  // Consistent spacing scale
  spacing: {
    pageTop: { base: 20, md: 24 },
    pageMargin: { base: 8, md: 8 },
    containerPadding: { base: 2, md: 4 },
    cardPadding: { base: 4, md: 6 },
    sectionGap: { base: 4, md: 6 },
  },

  // Container widths for consistency
  containerWidths: {
    narrow: { base: "100%", md: "448px" },
    medium: { base: "100%", md: "600px" },
    wide: { base: "100%", md: "740px" },
    full: { base: "100%", md: "container.xl" },
  },

  // Border radius tokens
  borderRadius: {
    card: "16px",
    tab: "12px",
    button: "8px",
    input: "6px",
    small: "4px",
  },

  // Shadow tokens - subtle depth
  shadows: {
    subtle: "0 1px 3px rgba(0, 0, 0, 0.04)",
    card: "0 2px 8px rgba(0, 0, 0, 0.06)",
    hover: "0 4px 12px rgba(0, 0, 0, 0.08)",
    navigation: "0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.1)",
  },
};

// Chakra UI theme extension
export const customTheme = extendTheme({
  fonts: {
    body: "monospace",
    heading: "monospace",
    mono: "monospace",
  },
  components: {
    Table: {
      baseStyle: {
        table: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
        th: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 2, md: 3 },
          px: { base: 2, md: 4 },
          cursor: "pointer",
          userSelect: "none",
          transition: designTokens.transitions.fast,
          borderBottom: "2px solid",
          borderColor: "black",
          bg: "white",
          fontWeight: 600,
          textAlign: "left",
          _hover: {
            bg: "gray.50",
            transform: "translateY(-1px)",
          },
        },
        td: {
          fontFamily: "monospace",
          fontSize: { base: "xs", md: "sm" },
          py: { base: 2, md: 2.5 },
          px: { base: 2, md: 4 },
          transition: designTokens.transitions.fast,
          borderBottom: "1px solid",
          borderColor: "black",
        },
        tbody: {
          tr: {
            transition: designTokens.transitions.fast,
            _hover: {
              bg: "gray.50",
            },
            _last: {
              td: {
                borderBottom: "none",
              },
            },
          },
        },
        thead: {
          tr: {
            _hover: {
              bg: "transparent",
            },
          },
        },
      },
      variants: {
        simple: {
          th: {
            borderBottom: "2px solid",
            borderColor: "black",
          },
          td: {
            borderBottom: "1px solid",
            borderColor: "black",
          },
        },
      },
    },
    Button: {
      baseStyle: {
        fontFamily: "monospace",
        transition: designTokens.transitions.fast,
        _hover: {
          transform: "translateY(-1px)",
        },
        _active: {
          transform: "scale(0.98)",
        },
      },
    },
    Tab: {
      baseStyle: {
        fontFamily: "monospace",
        transition: designTokens.transitions.normal,
      },
    },
  },
});

export const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg width='24' height='24' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='12' cy='12' r='12' fill='%23ffffff'/%3E%3Ctext x='12' y='17' text-anchor='middle' font-size='16' font-family='monospace' fill='%23999'%3E%3F%3C/text%3E%3C/svg%3E";
