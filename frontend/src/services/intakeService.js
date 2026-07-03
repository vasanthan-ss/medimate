import api from "./api";

export const markDoseTaken = async (formData) => {
  const response = await api.post("/intake/taken", formData);
  return response.data;
};

export const markDoseSkipped = async (formData) => {
  const response = await api.post("/intake/skipped", formData);
  return response.data;
};

export const getTodayIntakes = async () => {
  const response = await api.get("/intake/today");
  return response.data;
};