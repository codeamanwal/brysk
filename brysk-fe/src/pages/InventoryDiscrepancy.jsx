import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import CityFilter from "../components/CityFilter";
import axios from "axios";
import { ThreeDots } from "react-loader-spinner";
import {
  DocumentArrowDownIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";
import InventoryDiscrepancyTable from "../components/InventoryDiscrepancy/InventoryDiscrepancyTable";
import InventoryDiscrepancyChart from "../components/InventoryDiscrepancy/InventoryDiscrepancyChart";

const InventoryDiscrepancy = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("table");
  const [cityId, setCityId] = useState("");
  const [locations, setLocations] = useState([]);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetchLocations();
    fetchData();
  }, []);

  useEffect(() => {
    filterDataByCity(cityId);
  }, [data, cityId]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setFetched(false);

    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/inventory-discrepancy`);
      setData(response.data);
      setFilteredData(response.data);
      setFetched(true);
    } catch (error) {
      setError("Failed to fetch discrepancies");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/locations`);
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const filterDataByCity = (cityId) => {
    if (!cityId) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) => {
        const location = locations.find((loc) => loc.id === item.locationId);
        return location && location.cityId === cityId;
      });
      setFilteredData(filtered);
    }
  };

  const handleCityChange = (newCityId) => {
    setCityId(newCityId);
  };

  const generateColumns = () => [
    {
      Header: "Location",
      accessor: "locationName",
      Cell: ({ value }) => (value ? value : "N/A"),
    },
    {
      Header: "Variant",
      accessor: "variantName",
      Cell: ({ value }) => (value ? value : "N/A"),
    },
    {
      Header: "IMS Quantity",
      accessor: "imsQuantity",
      Cell: ({ value }) => (value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A"),
    },
    {
      Header: "Sensor Quantity",
      accessor: "sensorQuantity",
      Cell: ({ value }) => (value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A"),
    },
    {
      Header: "Discrepancy",
      accessor: "discrepancy",
      Cell: ({ value }) => (value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A"),
    },
  ];

  const columns = React.useMemo(generateColumns, []);

  const downloadCSV = () => {
    const csvRows = [];
    const headers = columns.map((col) => col.Header);
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.accessor];
        return `"${value !== undefined && value !== null ? value : "N/A"}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Inventory_discrepancy.csv`);
    a.click();
  };

  return (
    <div>
      <Sidebar />
      <div className="lg:pl-72">
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto p-5 bg-white rounded-md shadow">
              <div className="border-b border-gray-200 pb-5 sm:flex sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold leading-6 text-gray-900">
                  Weight-Based vs. System Inventory Discrepancy
                </h2>
                <div className="mt-3 flex sm:ml-4 sm:mt-0">
                  <button
                    type="button"
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-500 ${
                      view === "table"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-900"
                    }`}
                    onClick={() => setView("table")}
                  >
                    Tables
                  </button>
                  <button
                    type="button"
                    className={`ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-500 ${
                      view === "chart"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-900"
                    }`}
                    onClick={() => setView("chart")}
                  >
                    Chart
                  </button>
                  <div
                    className="relative flex items-center cursor-pointer"
                    onClick={downloadCSV}
                  >
                    <DocumentArrowDownIcon
                      className="ml-4 h-8 w-8 text-blue-500"
                      data-tooltip-id="csv-tooltip"
                      data-tooltip-content="Download CSV"
                    />
                    <Tooltip
                      id="csv-tooltip"
                      place="top"
                      type="dark"
                      effect="solid"
                    />
                  </div>
                </div>
              </div>
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 pb-2">
                    <div className="inline-block min-w-full py-2 align-middle">
                      <div className="my-4 grid lg:grid-cols-3 items-center">
                        <CityFilter onCityChange={handleCityChange} />
                      </div>
                      {error && (
                        <div
                          className="fixed top-4 right-4 w-80 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg transform transition-transform duration-1000 ease-in-out"
                          role="alert"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="font-bold">Oops! Something went wrong.</strong>
                              <span className="block sm:inline">
                                We encountered an issue while fetching the data. Please try again later.
                              </span>
                            </div>
                            <button
                              className="ml-4"
                              onClick={() => setError(null)}
                            >
                              <svg
                                className="fill-current h-6 w-6 text-red-500"
                                role="button"
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                              >
                                <title>Close</title>
                                <path
                                  d="M14.348 5.652a.5.5 0 00-.707 0L10 9.293 6.354 5.652a.5.5 0 10-.707.707l3.647 3.647-3.647 3.646a.5.5 0 00.707.708L10 10.707l3.646 3.646a.5.5 0 00.707-.707l-3.646-3.646 3.646-3.647a.5.5 0 000-.707z"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      {loading ? (
                        !error && (
                          <div className="flex justify-center">
                            <ThreeDots
                              visible={true}
                              height="80"
                              width="80"
                              color="#000"
                              radius="9"
                              ariaLabel="three-dots-loading"
                              wrapperStyle={{}}
                              wrapperClass=""
                            />
                          </div>
                        )
                      ) : (
                        fetched && (
                          <div>
                            {view === "table" ? (
                              <InventoryDiscrepancyTable data={filteredData} columns={columns} />
                            ) : (
                              <InventoryDiscrepancyChart data={filteredData} />
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InventoryDiscrepancy;
