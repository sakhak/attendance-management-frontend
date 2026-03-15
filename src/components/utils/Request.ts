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
    const res = await axios({
      url: config.api_url + (url.startsWith("/") ? url : "/" + url),
      method,
      data,
      headers,
      timeout: 8000,
    });

    return res.data;
  } catch (err) {
    if (!axios.isAxiosError(err) || !err.response) {
      localStorage.removeItem("user");
      window.location.href = "/admin/login";
      throw err;
    }

    const status = err.response.status;
    if (status === 401 || status === 403) {
      // Don't redirect for auth endpoints, let the component handle the error
      if (!url.includes("admin/login") && !url.includes("admin/register")) {
        localStorage.removeItem("user");
        window.location.href = "/admin/login";
      }
    }

    throw err.response.data;
  }
};
