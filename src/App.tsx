import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./components/contexts/AuthContext";
import LoginPage from "./pages/admin/auth/LoginPage";
import RegisterPage from "./pages/admin/auth/RegisterPage";
import ForgotPasswordPage from "./pages/admin/auth/ForgotPasswordPage";
import LayoutMainPage from "./pages/layout/LayoutMainPage";
import DashboardPage from "./pages/admin/DashboardPage";
import AttendancePage from "./pages/admin/AttendancePage";
import NotfoundPage from "./pages/notfound/NotfoundPage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LayoutMainPage />}>
            <Route index element={<DashboardPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>

          <Route path="/admin">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="recovery" element={<ForgotPasswordPage />} />
          </Route>
          <Route path="/student">
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="recovery" element={<ForgotPasswordPage />} />
          </Route>

          <Route path="*" element={<NotfoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
