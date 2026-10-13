import api from "../api/axios";

export const getDashboard = async (params = {}) => {
  const response = await api.get("/dashboard", {
    params,
  });

  return response.data;
};