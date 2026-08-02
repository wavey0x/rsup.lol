import { ChakraProvider } from "@chakra-ui/react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navigation } from "./Navigation";
import Markets from "./Markets.tsx";
import SreUSD from "./SreUSD.tsx";
import RetentionProgram from "./RetentionProgram.tsx";
import Authorizations from "./Authorizations.tsx";
import ProtocolDebt from "./ProtocolDebt.tsx";
import Incentives from "./Incentives.tsx";

function App() {
  return (
    <ChakraProvider>
      <BrowserRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<Navigate to="/markets" replace />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/sreusd" element={<SreUSD />} />
          <Route path="/retention" element={<RetentionProgram />} />
          <Route path="/authorizations" element={<Authorizations />} />
          <Route path="/protocoldebt" element={<ProtocolDebt />} />
          <Route path="/incentives" element={<Incentives />} />
          <Route path="*" element={<Navigate to="/markets" replace />} />
        </Routes>
      </BrowserRouter>
    </ChakraProvider>
  );
}

export default App;
