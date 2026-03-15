import React from "react";
import { useNavigate } from "react-router-dom";
import Notfound from "../../components/common/Notfound";
import { useAuth } from "../../components/contexts/AuthContext";

const NotfoundPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Notfound />
    </>
  );
};

export default NotfoundPage;
