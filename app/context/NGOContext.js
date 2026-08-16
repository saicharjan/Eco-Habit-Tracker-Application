import React, { createContext, useState, useContext, useEffect } from 'react';
import * as ngoService from '../services/ngoService';
import { useAuth } from './AuthContext';
import { useRouter } from 'expo-router';

const NGOContext = createContext();

export const NGOProvider = ({ children }) => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [ngoProfile, setNGOProfile] = useState(null);
  const [volunteers, setVolunteers] = useState([]);
  const [projects, setProjects] = useState([]);
  const [events, setEvents] = useState([]);
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);

  const handleAuthError = async (err) => {
    console.log('Handling auth error:', err.message);
    if (err.response?.status === 401) {
      await logout();
      router.replace('/(public)/login');
    }
  };

  const fetchNGOProfile = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      if (!user) {
        throw new Error('User not found');
      }

      const userRole = user.role?.toUpperCase();
      if (userRole !== 'NGO') {
        throw new Error('User is not an NGO');
      }

      console.log('Fetching NGO profile with token:', user.token ? 'Present' : 'Missing');
      const response = await ngoService.getNGOProfile();
      
      if (!response) {
        throw new Error('No NGO profile data received');
      }
      
      console.log('NGO profile data received:', {
        hasOrganization: !!response.organization,
        volunteersCount: response.volunteers?.length,
        projectsCount: response.projects?.length,
        eventsCount: response.events?.length,
        donationsCount: response.donations?.length
      });

      setNGOProfile(response.organization);
      setVolunteers(response.volunteers || []);
      setProjects(response.projects || []);
      setEvents(response.events || []);
      setDonations(response.donations || []);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error in fetchNGOProfile:', err);
      if (err.message.includes('Network error')) {
        setError('Network error. Please check your connection and try again.');
      } else if (err.response?.status === 401) {
        await handleAuthError(err);
      } else {
        setError(err.message || 'Failed to fetch NGO profile');
      }
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    console.log('NGOContext useEffect - User:', {
      present: !!user,
      role: user?.role,
      token: user?.token ? 'Present' : 'Missing'
    });

    if (user?.role?.toUpperCase() === 'NGO') {
      fetchNGOProfile();
    } else {
      setLoading(false);
    }
  }, [user]);

  const value = {
    ngoProfile,
    volunteers,
    projects,
    events,
    donations,
    loading,
    error,
    lastRefresh,
    fetchNGOProfile,
    refreshData: () => fetchNGOProfile(true)
  };

  return (
    <NGOContext.Provider value={value}>
      {children}
    </NGOContext.Provider>
  );
};

export const useNGO = () => {
  const context = useContext(NGOContext);
  if (!context) {
    throw new Error('useNGO must be used within an NGOProvider');
  }
  return context;
}; 