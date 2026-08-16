import api from '../config/api';

// NGO Profile Services
export const getNGOProfile = async () => {
  try {
    console.log('Fetching NGO profile...');
    const response = await api.get('/api/ngo/dashboard');
    console.log('NGO profile response:', response.data);
    
    if (!response.data || !response.data.data) {
      throw new Error('No data received from the server');
    }
    
    const { organization, stats } = response.data.data;
    
    if (!organization) {
      throw new Error('Invalid NGO profile data: missing organization details');
    }

    // Get the nested organization details
    const orgDetails = organization.organization || {};

    // Return the processed data with merged organization details
    return {
      organization: {
        ...organization,
        ...orgDetails, // Merge the nested organization details
        name: organization.name || orgDetails.name,
        email: organization.email,
        phone: orgDetails.phone || organization.phone,
        address: orgDetails.address,
        type: orgDetails.type || 'NGO',
        description: orgDetails.description,
        website: orgDetails.website,
        socialMedia: orgDetails.socialMedia || {},
        registrationNumber: orgDetails.registrationNumber,
        foundedYear: orgDetails.foundedYear
      },
      stats: stats || {
        activeProjects: 0,
        totalDonations: 0,
        totalVolunteers: 0,
        upcomingEvents: 0
      }
    };
  } catch (error) {
    console.error('Error in getNGOProfile:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    if (!error.response) {
      throw new Error('Network error. Please check your connection.');
    }

    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }

    if (error.response?.status === 404) {
      throw new Error('NGO profile not found');
    }

    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch NGO profile'
    );
  }
};

export const updateNGOProfile = async (profileData) => {
  try {
    const response = await api.put('/api/ngo/profile', profileData);
    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      throw new Error('Unauthorized. Please log in again.');
    }
    if (error.response?.status === 404) {
      throw new Error('NGO profile not found');
    }
    throw new Error(error.response?.data?.message || 'Failed to update NGO profile');
  }
};

// Volunteer Management Services
export const getNGOVolunteers = async () => {
  try {
    const response = await api.get('/api/ngo/volunteers');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const addVolunteer = async (volunteerId) => {
  try {
    const response = await api.post('/api/ngo/volunteers', { volunteerId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const removeVolunteer = async (volunteerId) => {
  try {
    const response = await api.delete(`/api/ngo/volunteers/${volunteerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Project Management Services
export const createProject = async (projectData) => {
  try {
    const response = await api.post('/api/ngo/projects', projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getNGOProjects = async () => {
  try {
    const response = await api.get('/api/ngo/projects');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateProject = async (projectId, projectData) => {
  try {
    const response = await api.put(`/api/ngo/projects/${projectId}`, projectData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Event Management Services
export const createEvent = async (eventData) => {
  try {
    const response = await api.post('/api/ngo/events', eventData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getNGOEvents = async () => {
  try {
    const response = await api.get('/api/ngo/events');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const updateEvent = async (eventId, eventData) => {
  try {
    const response = await api.put(`/api/ngo/events/${eventId}`, eventData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Donation Management Services
export const recordDonation = async (donationData) => {
  try {
    const response = await api.post('/api/ngo/donations', donationData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getNGODonations = async () => {
  try {
    const response = await api.get('/api/ngo/donations');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
}; 