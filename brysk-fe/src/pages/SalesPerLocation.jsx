import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import CityFilter from "../components/CityFilter";
import SalesTable from "../components/SalesLocation/SalesTable";
import SalesChart from "../components/SalesLocation/SalesChart";
import axios from "axios";
import { ThreeDots } from "react-loader-spinner";
import DatePickerRange from "../components/DatePickerRange";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const SalesPerLocation = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("table");
  const [timePeriod, setTimePeriod] = useState("day");
  const [dataType, setDataType] = useState("total");
  const [cityId, setCityId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [locations, setLocations] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fetched, setFetched] = useState(false);

  useEffect(() => {
    fetchLocations();
    if (timePeriod !== "date-range") {
      fetchData();
    }
  }, [timePeriod, dataType]);

  useEffect(() => {
    filterDataByCityAndLocation(cityId, locationId);
  }, [data, cityId, locationId]);

  const fetchData = async () => {
    if (timePeriod === "date-range" && (!startDate || !endDate)) {
      return;
    }

    setLoading(true);
    setError(null);
    setFetched(false);

    let endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation`;
    const startDateString = startDate ? startDate : "";
    const endDateString = endDate ? endDate : "";

    switch (dataType) {
      case "total":
        switch (timePeriod) {
          case "day":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/day`;
            break;
          case "week":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/week`;
            break;
          case "month":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/month`;
            break;
          case "date-range":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/daterange?start_date=${startDateString}&end_date=${endDateString}`;
            break;
          default:
            break;
        }
        break;
      case "sku":
        switch (timePeriod) {
          case "day":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/sku/day`;
            break;
          case "week":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/sku/week`;
            break;
          case "month":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/sku/month`;
            break;
          case "date-range":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/sku/daterange?start_date=${startDateString}&end_date=${endDateString}`;
            break;
          default:
            break;
        }
        break;
      default:
        break;
    }

    try {
      const response = await axios.get(endpoint);
      const fetchedData = response.data.map((item) => ({
        ...item,
        startDate: startDateString,
        endDate: endDateString,
        variantAndProductName: ` ${item.productName} - (${item.variant_name})`
      }));
      setData(fetchedData);
      setFilteredData(fetchedData);
      setFetched(true);
    } catch (error) {
      setError(error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/locations`
      );
      setLocations(response.data);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  const filterDataByCityAndLocation = (cityId, locationId) => {
    let filtered = data;
    if (cityId) {
      filtered = filtered.filter((item) => {
        const location = locations.find((loc) => loc.id === item.locationId);
        return location && location.cityId === cityId;
      });
    }
    if (locationId) {
      filtered = filtered.filter((item) => item.locationId === locationId);
    }
    setFilteredData(filtered);
  };

  const handleCityChange = (newCityId) => {
    setCityId(newCityId);
    setLocationId("");
    filterDataByCityAndLocation(newCityId, "");
  };

  const handleLocationChange = (newLocationId) => {
    setLocationId(newLocationId);
    filterDataByCityAndLocation(cityId, newLocationId);
  };

  const downloadCSV = () => {
    const csvRows = [];
    const headers = ["Location", "Total Sales (INR)"];
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      const values = [row.displayName, row.total_sales];
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Location_sales_data_${timePeriod}_${dataType}.csv`);
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
                  Sales Per Location/Store
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
                        <label>
                          Time Period:
                          <select
                            value={timePeriod}
                            onChange={(e) => setTimePeriod(e.target.value)}
                            className="ml-2 p-1 border"
                          >
                            <option value="day">Day</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="date-range">Date Range</option>
                          </select>
                        </label>
                        <label className="mt-2 lg:mt-0">
                          Data Type:
                          <select
                            value={dataType}
                            onChange={(e) => setDataType(e.target.value)}
                            className="ml-2 p-1 border"
                          >
                            <option value="total">Total</option>
                            <option value="sku">SKU wise</option>
                          </select>
                        </label>
                        <CityFilter 
                          onCityChange={handleCityChange} 
                          onLocationChange={handleLocationChange} 
                          locations={locations} 
                        />
                        {timePeriod === "date-range" && (
                          <div className="mt-4">
                            <DatePickerRange
                              startDate={startDate}
                              endDate={endDate}
                              onStartDateChange={setStartDate}
                              onEndDateChange={setEndDate}
                            />
                            <button
                              type="button"
                              className="mt-2 rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm bg-gray-800"
                              onClick={fetchData}
                              disabled={!startDate || !endDate}
                            >
                              Fetch Data
                            </button>
                            {!startDate && !endDate && (
                              <div className="flex justify-between items-start mt-3">
                                <div>
                                  <span className="block sm:inline">
                                    Select a date range to generate data
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {error && (
                        <div
                          className="fixed top-4 right-4 w-80 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg transform transition-transform duration-1000 ease-in-out"
                          role="alert"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <strong className="font-bold">
                                Oops! Something went wrong.
                              </strong>
                              <span className="block sm:inline">
                                We encountered an issue while fetching the data.
                                Please try again later.
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
                                <path d="M14.348 5.652a.5.5 0 00-.707 0L10 9.293 6.354 5.652a.5.5 0 10-.707.707l3.647 3.647-3.647 3.646a.5.5 0 00.707.708L10 10.707l3.646 3.646a.5.5 0 00.707-.707l-3.646-3.646 3.646-3.647a.5.5 0 000-.707z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      )}
                      {loading ||
                      (timePeriod === "date-range" &&
                        (!startDate || !endDate)) ? (
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
                      ) : fetched && view === "table" ? (
                        !error && (
                          <SalesTable
                            data={filteredData}
                            timePeriod={timePeriod}
                            dataType={dataType}
                          />
                        )
                      ) : (
                        <SalesChart data={filteredData} timePeriod={timePeriod} dataType={dataType}/>
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

export default SalesPerLocation;
