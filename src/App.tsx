import { useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { Navigation } from "./Navigation";
import Markets from "./Markets";
import RetentionProgram from "./RetentionProgram";
import Authorizations from "./Authorizations";

function App() {
  const [currentPage, setCurrentPage] = useState("markets");

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
