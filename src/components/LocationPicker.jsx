import React, { useState, useEffect } from 'react';
import { GoogleMap, Marker, useLoadScript, StandaloneSearchBox } from '@react-google-maps/api';
import { useAppContext } from '../contexts/AppContext';
import OpenStreetMapService from '../services/api';

const libraries = ['places'];

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
  const [searchBox, setSearchBox] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 51.505, lng: -0.09 });

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handleMapClick = async (e) => {
    const lat = e.latLng.lat();
    const lng = e.latLng.lng();

    try {
      setCurrentLocation({ lat, lng });
      const foundAddress = await OpenStreetMapService.getAddressFromCoordinates(lat, lng);

      setMapLocation({ lat, lng });
      setAddress(foundAddress);
      setMapCenter({ lat, lng });
      setStep('details');
    } catch (error) {
      console.error('Error fetching address:', error);
    }
  };

  const handleLocateMe = async () => {
    try {
      const location = await OpenStreetMapService.requestLocation();
      setMapCenter(location);
      setCurrentLocation(location);

      const foundAddress = await OpenStreetMapService.getAddressFromCoordinates(
        location.lat, 
        location.lng
      );

      setMapLocation(location);
      setAddress(foundAddress);
      setStep('details');
    } catch (error) {
      console.error('Location error:', error);
    }
  };

  const handleSearchAddress = async () => {
    if (searchBox) {
      const places = searchBox.getPlaces();
      if (places && places.length > 0) {
        const firstPlace = places[0];
        const location = {
          lat: firstPlace.geometry.location.lat(),
          lng: firstPlace.geometry.location.lng()
        };

        try {
          const foundAddress = await OpenStreetMapService.getAddressFromCoordinates(
            location.lat, 
            location.lng
          );

          setCurrentLocation(location);
          setMapLocation(location);
          setAddress(foundAddress);
          setMapCenter(location);
          setStep('details');
        } catch (error) {
          console.error('Address search error:', error);
        }
      }
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
  };

  if (loadError) return <div>Error loading maps</div>;
  if (!isLoaded) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      {step === 'map' && (
        <div>
          <div className="mb-2 flex">
            <StandaloneSearchBox
              onLoad={(ref) => setSearchBox(ref)}
              onPlacesChanged={handleSearchAddress}
            >
              <input 
                type="text" 
                placeholder="Search for an address" 
                className="w-full p-2 rounded"
              />
            </StandaloneSearchBox>
          </div>
          <button 
            onClick={handleLocateMe}
            className="w-full bg-blue-500 text-white p-2 rounded mb-2"
          >
            Use My Current Location
          </button>

          <GoogleMap
            mapContainerClassName="w-full h-96"
            center={mapCenter}
            zoom={13}
            onClick={handleMapClick}
          >
            {mapLocation && (
              <Marker 
                position={{ 
                  lat: mapLocation.lat, 
                  lng: mapLocation.lng 
                }} 
              />
            )}
          </GoogleMap>
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

