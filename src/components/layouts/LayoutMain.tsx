import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Footer from "../common/Footer";
import Navbar from "../common/Navbar";
import { useAuth } from "../contexts/AuthContext";

const LayoutMain = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isCheckingAuth, setIsCheckingAuth] = React.useState(true);

  console.log("LayoutMain - isAuthenticated:", isAuthenticated);

  React.useEffect(() => {
    console.log("LayoutMain useEffect - checking auth:", isAuthenticated);
    setIsCheckingAuth(false);

    if (!isAuthenticated) {
      console.log("LayoutMain - redirecting to login");
      navigate("/admin/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Show loading while checking authentication
  if (isCheckingAuth) {
    console.log("LayoutMain - showing loading");
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log("LayoutMain - returning null (not authenticated)");
    return null;
  }

  console.log("LayoutMain - rendering authenticated content");
  return (
    <div className="min-h-screen bg-slate-100">
      <Navbar />
      <div className="md:pl-72">
        <main className="min-h-[calc(100vh-4rem)] px-4 py-4 md:px-8 md:py-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default LayoutMain;
