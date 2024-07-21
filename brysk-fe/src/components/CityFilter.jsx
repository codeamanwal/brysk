import React, { useState, useEffect } from "react";
import axios from "axios";

const CityFilter = ({ onCityChange, onLocationChange, locations }) => {
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_BACKEND_URL}/cities`
        );
        setCities(response.data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities();
  }, []);

  useEffect(() => {
    if (selectedCity) {
      const filtered = locations.filter(
        (location) => location.cityId === selectedCity
      );
      setFilteredLocations(filtered);
    } else {
      setFilteredLocations(locations);
    }
  }, [selectedCity, locations]);

  const handleCityChange = (event) => {
    setSelectedCity(event.target.value);
    setSelectedLocation("");
    onCityChange(event.target.value);
    onLocationChange(""); // Reset location filter when city changes
  };

  const handleLocationChange = (event) => {
    setSelectedLocation(event.target.value);
    onLocationChange(event.target.value);
  };

  return (
    <div className="my-2">
      <label htmlFor="city">Filter by City:</label>
      <select
        id="city"
        value={selectedCity}
        onChange={handleCityChange}
        className="ml-2 p-1 border"
      >
        <option value="">All Cities</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}
          </option>
        ))}
      </select>

      {selectedCity && (
        <div className="my-2">
          <label htmlFor="location">Filter by Location:</label>
          <select
            id="location"
            value={selectedLocation}
            onChange={handleLocationChange}
            className="p-1 border"
          >
            <option value="">All Locations</option>
            {filteredLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.displayName}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default CityFilter;
