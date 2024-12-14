import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://replit.com/@adityaaverma200/location-context-backend';// Adjust to your backend URL

const AuthService = {
  login: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.error || 'Login failed';
    }
  },

  register: async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, { email, password });
      if (response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('token', response.data.token);
      }
      return response.data.user;
    } catch (error) {
      throw error.response?.data?.error || 'Registration failed';
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};

const AddressService = {
  saveAddress: async (address) => {
    try {
      const response = await axios.post(`${API_URL}/addresses`, address, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to save address';
    }
  },

  getUserAddresses: async () => {
    try {
      const response = await axios.get(`${API_URL}/addresses`, {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      throw error.response?.data?.error || 'Failed to fetch addresses';
    }
  }
};

const OpenStreetMapService = {
  getAddressFromCoordinates: async (lat, lng) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'json',
          lat: lat,
          lon: lng,
          zoom: 18,
          addressdetails: 1
        }
      });

      const address = response.data.display_name;
      return address || `Latitude: ${lat}, Longitude: ${lng}`;
    } catch (error) {
      console.error('Error fetching address:', error);
      return `Latitude: ${lat}, Longitude: ${lng}`;
    }
  },

  searchPlaces: async (query) => {
    try {
      const response = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'json',
          q: query,
          addressdetails: 1,
          limit: 5
        }
      });

      return response.data.map(place => ({
        geometry: {
          location: {
            lat: () => parseFloat(place.lat),
            lng: () => parseFloat(place.lon)
          }
        },
        formatted_address: place.display_name
      }));
    } catch (error) {
      console.error('Error searching places:', error);
      return [];
    }
  },

  requestLocation: async () => {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser.'));
      }
    });
  }
};

export default {
  ...AuthService,
  ...AddressService,
  getAddressFromCoordinates: OpenStreetMapService.getAddressFromCoordinates,
  searchPlaces: OpenStreetMapService.searchPlaces,
  requestLocation: OpenStreetMapService.requestLocation
};