import api from "./api";

export const getMedicines = async () => {
  const response = await api.get("/medicines");
  return response.data;
};

export const createMedicine = async (formData) => {
  const response = await api.post("/medicines", formData);
  return response.data;
};

export const getMedicineById = async (id) => {
  const response = await api.get(`/medicines/${id}`);
  return response.data;
};

export const updateMedicine = async (id, formData) => {
  const response = await api.put(`/medicines/${id}`, formData);
  return response.data;
};

export const deleteMedicine = async (id) => {
  const response = await api.delete(`/medicines/${id}`);
  return response.data;
};

export const pauseMedicine = async (id) => {
  const response = await api.patch(`/medicines/${id}/pause`);
  return response.data;
};