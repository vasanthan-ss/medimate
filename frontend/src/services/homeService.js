import api from "./api";

export const getTodayMedicines = async () => {
  const response = await api.get("/home/today");
  return response.data;
};

export const getHomeSummary = async () => {
  const response = await api.get("/home/summary");
  return response.data;
};