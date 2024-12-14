import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { useAppContext } from '../contexts/AppContext';
import OpenStreetMapService from '../services/api';

// Import marker icon images
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const addressTypes = [
  { name: 'Home', icon: '🏠' },
  { name: 'Office', icon: '💼' },
  { name: 'Friends & Family', icon: '👥' }
];

const LocationPicker = () => {
  const { 
    setCurrentLocation, 
    setSelectedAddress,
    saveAddress 
  } = useAppContext();

  const [step, setStep] = useState('map');
  const [mapLocation, setMapLocation] = useState(null);
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState({
    houseNumber: '',
    apartmentRoad: '',
    addressType: null
  });
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Fix for Leaflet marker icon
  useEffect(() => {
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: markerIcon,
      iconUrl: markerIcon,
      shadowUrl: markerShadow
    });
  }, []);

  useEffect(() => {
    // Ensure map container exists before initializing
    const mapContainer = document.getElementById('map');
    if (mapContainer && !mapRef.current) {
      // Initialize map
      mapRef.current = L.map('map').setView([51.505, -0.09], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(mapRef.current);

      // Add resize listener to ensure map fills container
      const resizeMap = () => {
        if (mapRef.current) {
          mapRef.current.invalidateSize();
        }
      };
      window.addEventListener('resize', resizeMap);

      // Add click event to map
      mapRef.current.on('click', handleMapClick);

      // Cleanup function
      return () => {
        window.removeEventListener('resize', resizeMap);
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
        }
      };
    }
  }, []);

  const handleMapClick = async (e) => {
    const { lat, lng } = e.latlng;

    // Remove existing marker if any
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    // Add new marker
    markerRef.current = L.marker([lat, lng]).addTo(mapRef.current);

    try {
      // Update current location when a location is selected
      setCurrentLocation({ lat, lng });

      const foundAddress = await OpenStreetMapService.getAddressFromCoordinates(lat, lng);

      setMapLocation({ lat, lng });
      setAddress(foundAddress);
      setStep('details');
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleLocateMe = async () => {
    try {
      const location = await OpenStreetMapService.requestLocation();

      // Center map and add marker
      mapRef.current.setView([location.lat, location.lng], 15);

      if (markerRef.current) {
        mapRef.current.removeLayer(markerRef.current);
      }
      markerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current);

      handleMapLocationSelect(location);
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleMapLocationSelect = async (location) => {
    try {
      const foundAddress = await OpenStreetMapService.getAddressFromCoordinates(
        location.lat, 
        location.lng
      );

      setCurrentLocation(location);
      setMapLocation(location);
      setAddress(foundAddress);
      setStep('details');
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleSearchAddress = async (query) => {
    try {
      const results = await OpenStreetMapService.searchPlaces(query);
      if (results.length > 0) {
        const firstResult = results[0];
        const location = { 
          lat: firstResult.geometry.location.lat(), 
          lng: firstResult.geometry.location.lng() 
        };

        // Center map and add marker
        mapRef.current.setView([location.lat, location.lng], 15);

        if (markerRef.current) {
          mapRef.current.removeLayer(markerRef.current);
        }
        markerRef.current = L.marker([location.lat, location.lng]).addTo(mapRef.current);

        handleMapLocationSelect(location);
      }
    } catch (error) {
      console.error('Address search error:', error);
    }
  };

  const handleDetailsInputChange = (e) => {
    const { name, value } = e.target;
    setAddressDetails(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddressTypeSelect = (type) => {
    setAddressDetails(prev => ({
      ...prev,
      addressType: type
    }));
  };

  const handleSaveAddress = () => {
    const completeAddress = {
      fullAddress: address,
      latitude: mapLocation.lat,
      longitude: mapLocation.lng,
      ...addressDetails,
      id: Date.now() // Simple unique ID generation
    };

    // Save the address and set it as the selected address
    saveAddress(completeAddress);
    setSelectedAddress(completeAddress);

    // Reset to initial state
    setStep('map');
    setMapLocation(null);
    setAddress('');
    setAddressDetails({
      houseNumber: '',
      apartmentRoad: '',
      addressType: null
    });

    // Remove marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      {step === 'map' && (
        <div>
          <input 
            type="text" 
            placeholder="Search for an address" 
            className="w-full p-2 rounded mb-2"
            onChange={(e) => {
              if (e.target.value.length > 2) {
                handleSearchAddress(e.target.value);
              }
            }}
          />
          <button 
            onClick={handleLocateMe}
            className="w-full bg-blue-500 text-white p-2 rounded mb-2"
          >
            Use My Current Location
          </button>
          {/* OpenStreetMap container */}
          <div 
            id="map" 
            className="w-full h-96 bg-gray-200 flex items-center justify-center"
          ></div>
        </div>
      )}

      {step === 'details' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Address Details</h2>

          <div className="mb-4">
            <p className="font-semibold">Selected Location:</p>
            <p>{address}</p>
          </div>

          <div className="mb-4">
            <label className="block mb-2">House/Flat/Block No.</label>
            <input 
              type="text" 
              name="houseNumber"
              value={addressDetails.houseNumber}
              onChange={handleDetailsInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter house/flat number"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Apartment/Road/Area</label>
            <input 
              type="text" 
              name="apartmentRoad"
              value={addressDetails.apartmentRoad}
              onChange={handleDetailsInputChange}
              className="w-full p-2 border rounded"
              placeholder="Enter apartment, road, or area"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-2">Address Type</label>
            <div className="flex space-x-4">
              {addressTypes.map((type) => (
                <button
                  key={type.name}
                  onClick={() => handleAddressTypeSelect(type)}
                  className={`p-2 rounded flex items-center ${
                    addressDetails.addressType?.name === type.name 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{type.icon}</span>
                  {type.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setStep('map')}
              className="flex-1 bg-gray-200 text-black p-2 rounded"
            >
              Back
            </button>
            <button 
              onClick={handleSaveAddress}
              disabled={!addressDetails.houseNumber || !addressDetails.apartmentRoad || !addressDetails.addressType}
              className="flex-1 bg-green-500 text-white p-2 rounded disabled:opacity-50"
            >
              Save Address
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;

