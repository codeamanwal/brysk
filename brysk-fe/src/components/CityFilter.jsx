import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CityFilter = ({ onCityChange }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/cities`);
        setCities(response.data);
      } catch (error) {
        console.error('Error fetching cities:', error);
      }
    };
    fetchCities();
  }, []);

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    onCityChange(event.target.value);
  };

  return (
    <div className='my-2'>
      <label htmlFor="city">Filter by City:</label>
      <select id="city" value={selectedCity} onChange={handleCityChange} className="ml-2 p-1 border">
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CityFilter;
