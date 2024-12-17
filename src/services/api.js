import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'https://replit.com/@adityaaverma200/location-context-backend';

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

const GoogleMapsService = {
  getAddressFromCoordinates: async (lat, lng) => {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
        params: {
          latlng: `${lat},${lng}`,
          key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
        }
      });

      // Return the first formatted address or coordinates
      const address = response.data.results[0]?.formatted_address;
      return address || `Latitude: ${lat}, Longitude: ${lng}`;
    } catch (error) {
      console.error('Error fetching address:', error);
      return `Latitude: ${lat}, Longitude: ${lng}`;
    }
  },

  searchPlaces: async (query) => {
    try {
      const response = await axios.get('https://maps.googleapis.com/maps/api/place/textsearch/json', {
        params: {
          query: query,
          key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY
        }
      });

      return response.data.results.map(place => ({
        geometry: {
          location: {
            lat: () => place.geometry.location.lat,
            lng: () => place.geometry.location.lng
          }
        },
        formatted_address: place.formatted_address
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
  getAddressFromCoordinates: GoogleMapsService.getAddressFromCoordinates,
  searchPlaces: GoogleMapsService.searchPlaces,
  requestLocation: GoogleMapsService.requestLocation
};