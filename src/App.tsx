import { useState, useEffect } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { Navigation } from "./Navigation";
import Markets from "./Markets.tsx";
import RetentionProgram from "./RetentionProgram.tsx";
import Authorizations from "./Authorizations.tsx";

const PAGE_PATHS: { [key: string]: string } = {
  markets: "/markets",
  retention: "/retention",
  authorizations: "/authorizations",
};
const PATH_TO_PAGE: { [key: string]: string } = {
  "/": "markets",
  "/markets": "markets",
  "/retention": "retention",
  "/authorizations": "authorizations",
};

function App() {
  // Set initial page based on URL
  const [currentPage, setCurrentPage] = useState(() => {
    const path = window.location.pathname;
    return PATH_TO_PAGE[path as keyof typeof PATH_TO_PAGE] || "markets";
  });

  // Update URL when page changes
  useEffect(() => {
    const newPath =
      PAGE_PATHS[currentPage as keyof typeof PAGE_PATHS] || "/markets";
    if (window.location.pathname !== newPath) {
      window.history.pushState({}, "", newPath);
    }
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case "markets":
        return <Markets />;
      case "retention":
        return <RetentionProgram />;
      case "authorizations":
        return <Authorizations />;
      default:
        return <Markets />;
    }
  };

  return (
    <ChakraProvider>
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderPage()}
    </ChakraProvider>
  );
}

export default App;
