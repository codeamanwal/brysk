import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import CityFilter from "../components/CityFilter";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { format, isValid } from "date-fns";
import { ThreeDots } from "react-loader-spinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { DocumentArrowDownIcon, ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const SalesPerLocation = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const [timePeriod, setTimePeriod] = useState("day");
  const [dataType, setDataType] = useState("total");
  const [cityId, setCityId] = useState("");
  const [locations, setLocations] = useState([]);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    fetchData();
    fetchLocations();
  }, [timePeriod, dataType]);

  useEffect(() => {
    filterDataByCity(cityId);
  }, [data, cityId]);

  const fetchData = async () => {
    if (timePeriod === "date-range" && (!startDate || !endDate)) {
      return;
    }

    setLoading(true);
    let endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation`;
    const startDateString = startDate ? startDate.toISOString().split("T")[0] : "";
    const endDateString = endDate ? endDate.toISOString().split("T")[0] : "";

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
      console.log("Fetched Data:", response.data); // Log the fetched data for debugging
      setData(response.data);
      setFilteredData(response.data);
    } catch (error) {
      setError(error);
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
    filterDataByCity(newCityId);
  };

  const generateColumns = () => {
    let columns = [
      {
        Header: "Location",
        accessor: "displayName",
        Cell: ({ value }) => (value ? value : "N/A"),
      },
      {
        Header: "Total Sales",
        accessor: "total_sales",
        Cell: ({ value }) => {
          const numValue = Number(value);
          return !isNaN(numValue) ? numValue.toFixed(3) : "N/A";
        },
      },
    ];

    switch (timePeriod) {
      case "day":
        columns.splice(1, 0, {
          Header: "Sale Day",
          accessor: "sale_day",
          Cell: ({ value }) =>
            isValid(new Date(value))
              ? format(new Date(value), "yyyy-MM-dd HH:mm:ss")
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
            Header: "Location",
            accessor: "displayName",
            Cell: ({ value }) => (value ? value : "N/A"),
          },
          {
            Header: "Start Date",
            accessor: "startDate",
            Cell: ({ value }) => {
              console.log("Start Date Cell Value:", value); // Log the value for debugging
              return value ? format(new Date(value), "yyyy-MM-dd") : "N/A";
            },
          },
          {
            Header: "End Date",
            accessor: "endDate",
            Cell: ({ value }) => {
              console.log("End Date Cell Value:", value); // Log the value for debugging
              return value ? format(new Date(value), "yyyy-MM-dd") : "N/A";
            },
          },
          {
            Header: "Total Sales",
            accessor: "total_sales",
            Cell: ({ value }) => {
              const numValue = Number(value);
              return !isNaN(numValue) ? numValue.toFixed(3) : "N/A";
            },
          },
        ];
        break;
      default:
        break;
    }

    if (dataType === "sku") {
      columns.push(
        {
          Header: "Variant ID",
          accessor: "variantId",
          Cell: ({ value }) => (value ? value : "N/A"),
        },
        {
          Header: "Total Quantity",
          accessor: "total_quantity",
          Cell: ({ value }) => {
            const numValue = Number(value);
            return !isNaN(numValue) ? numValue.toFixed(3) : "N/A";
          },
        }
      );
    }

    return columns;
  };

  const columns = React.useMemo(generateColumns, [timePeriod, dataType]);

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
    a.setAttribute("download", `Location_sales_data_${timePeriod}_${dataType}.csv`);
    a.click();
  };

  const renderPageNumbers = () => {
    const pagesToShow = 3;
    const totalPageNumbers = pagesToShow * 2 + 1;
    let startPage = Math.max(1, pageIndex - pagesToShow);
    let endPage = Math.min(pageCount, pageIndex + pagesToShow);

    if (pageCount > totalPageNumbers) {
      if (pageIndex - pagesToShow <= 0) {
        startPage = 1;
        endPage = totalPageNumbers;
      } else if (pageIndex + pagesToShow >= pageCount) {
        startPage = pageCount - totalPageNumbers + 1;
        endPage = pageCount;
      }
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => gotoPage(i - 1)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pageIndex === i - 1 ? 'bg-gray-600 text-white' : ''}`}
        >
          {i}
        </button>
      );
    }

    return (
      <>
        {startPage > 1 && (
          <>
            <button
              onClick={() => gotoPage(0)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pageIndex === 0 ? 'bg-gray-600 text-white' : ''}`}
            >
              1
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>
          </>
        )}
        {pages}
        {endPage < pageCount && (
          <>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">...</span>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${pageIndex === pageCount - 1 ? 'bg-gray-600 text-white' : ''}`}
            >
              {pageCount}
            </button>
          </>
        )}
      </>
    );
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

                        <CityFilter onCityChange={handleCityChange} />

                        {timePeriod === "date-range" && (
                          <div className="mt-4">
                            <label>
                              Start Date:
                              <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                selectsStart
                                startDate={startDate}
                                endDate={endDate}
                                className="p-1 border"
                                popperPlacement="bottom-start"
                              />
                            </label>
                            <label>
                              End Date:
                              <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                selectsEnd
                                startDate={startDate}
                                endDate={endDate}
                                minDate={startDate}
                                className="p-1 border"
                                popperPlacement="bottom-start"
                              />
                            </label>
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
                      {error ? <p>{error.message}</p> : null}
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
                      ) : view === "table" ? (
                        <div>
                          <table
                            {...getTableProps()}
                            className="min-w-full divide-y divide-gray-200 my-5 border"
                          >
                            <thead className="bg-gray-50">
                              {headerGroups.map((headerGroup) => (
                                <tr {...headerGroup.getHeaderGroupProps()}>
                                  {headerGroup.headers.map((column) => (
                                    <th
                                      {...column.getHeaderProps()}
                                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                      {column.render("Header")}
                                    </th>
                                  ))}
                                </tr>
                              ))}
                            </thead>
                            <tbody
                              {...getTableBodyProps()}
                              className="bg-white divide-y divide-gray-200"
                            >
                              {page.map((row, i) => {
                                prepareRow(row);
                                return (
                                  <tr {...row.getRowProps()}>
                                    {row.cells.map((cell) => {
                                      return (
                                        <td
                                          {...cell.getCellProps()}
                                          className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                        >
                                          {cell.render("Cell")}
                                        </td>
                                      );
                                    })}
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                            <div className="flex flex-1 justify-between sm:hidden">
                              <button
                                onClick={() => previousPage()}
                                disabled={!canPreviousPage}
                                className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Previous
                              </button>
                              <button
                                onClick={() => nextPage()}
                                disabled={!canNextPage}
                                className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                              >
                                Next
                              </button>
                            </div>
                            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                              <div>
                                <p className="text-sm text-gray-700">
                                  Showing <span className="font-medium">{pageIndex * pageSize + 1}</span> to{" "}
                                  <span className="font-medium">
                                    {Math.min((pageIndex + 1) * pageSize, filteredData.length)}
                                  </span>{" "}
                                  of <span className="font-medium">{filteredData.length}</span> results
                                </p>
                              </div>
                              <div>
                                <nav
                                  className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                                  aria-label="Pagination"
                                >
                                  <button
                                    onClick={() => previousPage()}
                                    disabled={!canPreviousPage}
                                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                  >
                                    <span className="sr-only">Previous</span>
                                    <ChevronLeftIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                  {renderPageNumbers()}
                                  <button
                                    onClick={() => nextPage()}
                                    disabled={!canNextPage}
                                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
                                  >
                                    <span className="sr-only">Next</span>
                                    <ChevronRightIcon
                                      className="h-5 w-5"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </nav>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p>No Chart</p>
                        </div>
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
