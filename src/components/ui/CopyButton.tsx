import { useState } from "react";
import { Box } from "@chakra-ui/react";
import { CopyIcon, CheckIcon } from "@chakra-ui/icons";
import { designTokens } from "../../theme";

interface CopyButtonProps {
  textToCopy: string;
  size?: number;
  successDuration?: number;
}

/**
 * Copy-to-clipboard button with visual feedback
 * Shows check icon briefly after successful copy
 */
export function CopyButton({
  textToCopy,
  size = 3,
  successDuration = 1200,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), successDuration);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  return (
    <Box
      as="button"
      ml={1}
      onClick={handleCopy}
      p={0.5}
      borderRadius={designTokens.borderRadius.small}
      bg="transparent"
      transition={designTokens.transitions.fast}
      _hover={{
        bg: "gray.100",
        transform: "scale(1.1)",
      }}
      _active={{
        transform: "scale(0.95)",
      }}
      cursor="pointer"
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <CheckIcon color="green.500" boxSize={size} />
      ) : (
        <CopyIcon color="gray.600" boxSize={size} />
      )}
    </Box>
  );
}
