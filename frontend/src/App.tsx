import { BrowserRouter, Routes, Route } from "react-router";
import RegisterPage from "./pages/member/RegisterPage";
import LoginPage from "./pages/member/LoginPage";
import ProfilePage from "./pages/member/ProfilePage";


export default App;
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <Routes>
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      </BrowserRouter>
  );
}
