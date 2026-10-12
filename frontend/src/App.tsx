import { BrowserRouter, Routes, Route } from "react-router";
import Register from "./pages/member/register.tsx";

export default App;
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}
