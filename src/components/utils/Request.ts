import axios from "axios";
import { config } from "./Config.ts";

export const request = async (
  url = "",
  method = "get",
  data: Record<string, unknown> | FormData = {},
) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");
  const token = user?.token || "";

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  if (token) headers.Authorization = `Bearer ${token}`;
  if (data instanceof FormData) delete headers["Content-Type"];

  try {
    const finalUrl = config.api_url + (url.startsWith("/") ? url : "/" + url);
    console.log(`Sending ${method} to ${finalUrl}`, data);
    
    const res = await axios({
      url: finalUrl,
      method,
      data,
      headers,
      timeout: 8000,
    });

    return res.data;
  } catch (err) {
    if (!axios.isAxiosError(err) || !err.response) {
      // For network errors, don't redirect to login automatically
      // as it might be a temporary server issue
      console.error("Network error or server down:", err);
      throw err;
    }

    const status = err.response.status;
    if (status === 401) {
      // Only redirect if we are not already on an auth page
      if (
        !window.location.pathname.includes("/login") &&
        !window.location.pathname.includes("/register")
      ) {
        console.warn("Session expired or invalid, redirecting to login...");
        localStorage.removeItem("user");
        window.location.href = "/admin/login";
      }
    }

    throw err.response.data || err;
  }
};
