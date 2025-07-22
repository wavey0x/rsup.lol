import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./Navigation";
import Markets from "./Markets.tsx";
import RetentionProgram from "./RetentionProgram.tsx";
import Authorizations from "./Authorizations.tsx";

function App() {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/markets" replace />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/retention" element={<RetentionProgram />} />
          <Route path="/authorizations" element={<Authorizations />} />
          <Route path="*" element={<Navigate to="/markets" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
