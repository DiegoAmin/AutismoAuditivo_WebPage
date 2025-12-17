import { BrowserRouter,Routes,Route } from "react-router-dom";
import { Landing } from "./pages/Landing";
import { Dashboard } from "./pages/Dashboard";
import { Roulette } from "./pages/Roulette";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        {/* Public Routes that will be private */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/roulette" element={<Roulette />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;