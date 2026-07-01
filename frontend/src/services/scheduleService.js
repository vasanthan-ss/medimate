import api from "./api";

export const createSchedule = async (formData) => {
  const response = await api.post("/schedules", formData);
  return response.data;
};

export const getSchedules = async () => {
  const response = await api.get("/schedules");
  return response.data;
};

export const updateSchedule = async (id, formData) => {
  const response = await api.put(`/schedules/${id}`, formData);
  return response.data;
};