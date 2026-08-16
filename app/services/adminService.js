import api from '../config/api';

// NGO Management
export const getAllNGOs = async () => {
  try {
    const response = await api.get('/api/admin/ngos');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const createNGO = async (ngoData) => {
  try {
    const response = await api.post('/api/admin/ngos', ngoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateNGO = async (ngoId, ngoData) => {
  try {
    const response = await api.put(`/api/admin/ngos/${ngoId}`, ngoData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const deleteNGO = async (ngoId) => {
  try {
    const response = await api.delete(`/api/admin/ngos/${ngoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const toggleNGOStatus = async (ngoId, isActive) => {
  try {
    const response = await api.put(`/api/admin/ngos/${ngoId}/status`, { isActive });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 