import api from "../api/axios";

export const createFormRecord = async (formData) => {
  const response = await api.post("/forms", formData);
  return response.data;
};

export const updateFormRecord = async (id, formData) => {
  const response = await api.put(`/forms/${id}`, formData);
  return response.data;
};

export const getBranches = async () => {
  const response = await api.get("/branches");
  return response.data;
};

export const getStatuses = async () => {
  const response = await api.get("/statuses");
  return response.data;
};