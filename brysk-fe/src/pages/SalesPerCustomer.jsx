import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { format, isValid } from "date-fns";
import { ThreeDots } from "react-loader-spinner";
import DatePickerRange from "../components/DatePickerRange";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";
import SalesPerCustomerTable from "../components/SalesCustomer/SalesCustomerTable";
import SalesPerCustomerChart from "../components/SalesCustomer/SalesCustomerChart";
import CityFilter from "../components/CityFilter";
import { useTable, usePagination } from "react-table";

const SalesPerCustomer = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const [timePeriod, setTimePeriod] = useState("day");
  const [dataType, setDataType] = useState("total");
  const [cityId, setCityId] = useState("");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    fetchLocations();
    fetchData();
  }, [timePeriod, dataType]);

  useEffect(() => {
    filterDataByCity(cityId);
  }, [data, cityId]);

  useEffect(() => {
    filterDataBySearchQuery(searchQuery);
  }, [searchQuery, data]);

  const fetchData = async () => {
    if (timePeriod === "date-range" && (!startDate || !endDate)) {
      return;
    }

    setLoading(true);
    setError(null);
    let endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer`;
    const startDateString = startDate ? startDate : "";
    const endDateString = endDate ? endDate : "";

    switch (dataType) {
      case "total":
        switch (timePeriod) {
          case "day":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/day`;
            break;
          case "week":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/week`;
            break;
          case "month":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/month`;
            break;
          case "date-range":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/daterange?start_date=${startDateString}&end_date=${endDateString}`;
            break;
          default:
            break;
        }
        break;
      case "sku":
        switch (timePeriod) {
          case "day":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/sku/day`;
            break;
          case "week":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/sku/week`;
            break;
          case "month":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/sku/month`;
            break;
          case "date-range":
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salespercustomer/sku/daterange?start_date=${startDateString}&end_date=${endDateString}`;
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
      console.log(response.data)
      const enrichedData = response.data.map((item) => ({
        ...item,
        startDate: startDateString,
        endDate: endDateString,
        variantAndProductName: ` ${item.productName} - (${item.variantName})`
      }));
      setData(enrichedData);
      setFilteredData(enrichedData);
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

  const filterDataBySearchQuery = (query) => {
    if (!query) {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        item.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const handleCityChange = (newCityId) => {
    setCityId(newCityId);
    filterDataByCity(newCityId);
  };

  const generateColumns = () => {
    let columns = [
      {
        Header: "Customer",
        accessor: "displayName",
        Cell: ({ value }) => (value ? value : "N/A"),
      },
      {
        Header: "Phone Number",
        accessor: "phoneNumber",
        Cell: ({ value }) => (value ? value : "N/A"),
      },
      {
        Header: "Total Sales (INR)",
        accessor: "total_sales",
        Cell: ({ value }) => (value !== undefined ? value.toFixed(3) : "N/A"),
      },
    ];

    switch (timePeriod) {
      case "day":
        columns.splice(2, 0, {
          Header: "Sale Day",
          accessor: "sale_day",
          Cell: ({ value }) =>
            isValid(new Date(value))
              ? format(new Date(value), "yyyy-MM-dd, HH:mm:ss")
              : "Invalid Date",
        });
        break;
      case "week":
        columns.splice(
          1,
          0,
          {
            Header: "Sale Year",
            accessor: "sale_year",
            Cell: ({ value }) => (value ? value : "N/A"),
          },
          {
            Header: "Sale Week",
            accessor: "sale_week",
            Cell: ({ value }) => (value ? value : "N/A"),
          }
        );
        break;
      case "month":
        columns.splice(
          1,
          0,
          {
            Header: "Sale Year",
            accessor: "sale_year",
            Cell: ({ value }) => (value ? value : "N/A"),
          },
          {
            Header: "Sale Month",
            accessor: "sale_month",
            Cell: ({ value }) => (value ? value : "N/A"),
          }
        );
        break;
      case "date-range":
        columns = [
          {
            Header: "Customer",
            accessor: "displayName",
            Cell: ({ value }) => (value ? value : "N/A"),
          },
          {
            Header: "Start Date",
            accessor: "startDate",
            Cell: ({ value }) =>
              value ? format(new Date(value), "yyyy-MM-dd") : "N/A",
          },
          {
            Header: "End Date",
            accessor: "endDate",
            Cell: ({ value }) =>
              value ? format(new Date(value), "yyyy-MM-dd") : "N/A",
          },
          {
            Header: "Total Sales (INR)",
            accessor: "total_sales",
            Cell: ({ value }) => (value !== undefined ? value.toFixed(3) : "N/A"),
          },
        ];
        break;
      default:
        break;
    }

    if (dataType === "sku") {
      columns.push(
        {
          Header: "Variant",
          accessor: "variantAndProductName",
          Cell: ({ value }) => (value ? value : "N/A"),
        },
        {
          Header: "Total Quantity",
          accessor: "total_quantity",
          Cell: ({ value }) => (value !== undefined ? Number(value).toFixed(3) : "N/A"),
        }
      );
    }

    return columns;
  };

  const columns = useMemo(generateColumns, [timePeriod, dataType]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data: filteredData,
      initialState: { pageIndex: 0 },
    },
    usePagination
  );

  const downloadCSV = () => {
    const csvRows = [];
    const headers = columns.map((col) => col.Header);
    csvRows.push(headers.join(","));

    filteredData.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.accessor];
        return `"${value !== undefined ? value : ""}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `Customer_sales_data_${timePeriod}_${dataType}.csv`);
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
                  Sales Per Customer
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
                        <div className="mt-4 lg:mt-0">
                          <CityFilter onCityChange={handleCityChange} />
                        </div>
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
                          </div>
                        )}
                      </div>
                      <div className="mt-4">
                        <input
                          type="text"
                          placeholder="Search by Customer Name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="p-2 border rounded w-full"
                        />
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
                      {loading ? (
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
                      ) : view === "table" ? (
                        <SalesPerCustomerTable
                          columns={columns}
                          data={filteredData}
                          loading={loading}
                          error={error}
                          setError={setError}
                          pageIndex={pageIndex}
                          pageSize={pageSize}
                          setPageSize={setPageSize}
                          previousPage={previousPage}
                          nextPage={nextPage}
                          canPreviousPage={canPreviousPage}
                          canNextPage={canNextPage}
                          pageCount={pageCount}
                          gotoPage={gotoPage}
                          getTableProps={getTableProps}
                          getTableBodyProps={getTableBodyProps}
                          headerGroups={headerGroups}
                          page={page}
                          prepareRow={prepareRow}
                          filteredData={filteredData}
                        />
                      ) : (
                        <SalesPerCustomerChart data={filteredData} timePeriod={timePeriod} dataType={dataType}/>
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

export default SalesPerCustomer;
