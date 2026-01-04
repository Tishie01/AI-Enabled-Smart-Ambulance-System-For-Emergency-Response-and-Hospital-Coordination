import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import DisasterType from "./DisasterType";
import FloodAllocation from "./FloodAllocation";

function App() {
  return (
    

    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/disaster-type" element={<DisasterType />} /> 
        <Route path="/flood-allocation" element={<FloodAllocation />} />
      </Routes>
    </Router>
 
  )
}

export default App;
