import { BrowserRouter, Routes, Route } from "react-router";
import RegisterPage from "./pages/member/RegisterPage";

export default App;
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  );
}
