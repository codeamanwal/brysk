import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { ThreeDots } from "react-loader-spinner";
import DatePickerRange from "../components/DatePickerRange";
import CustomerSKUTable from "../components/CustomerSKU/CustomerSKUTable";
import CustomerSKUChart from "../components/CustomerSKU/CustomerSKUChart";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const CustomerSKUPreference = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fetched, setFetched] = useState(false);
  const [view, setView] = useState("table");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = async () => {
    if (!startDate || !endDate) {
      return;
    }

    setLoading(true);
    setError(null);
    setFetched(false);

    const endpoint = `${process.env.REACT_APP_BACKEND_URL}/customerskupreference?start_date=${startDate}&end_date=${endDate}`;

    try {
      const response = await axios.get(endpoint);
      console.log(response.data)
      const transformedData = response.data.map(item => ({
        ...item,
        variantAndProductName: ` ${item.productName} - (${item.variant_name})`
      }));
      setData(transformedData);
      setFilteredData(transformedData);
      setFetched(true);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery === "") {
      setFilteredData(data);
    } else {
      const filtered = data.filter((item) =>
        item.displayName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredData(filtered);
    }
  }, [searchQuery, data]);

  const generateColumns = () => [
    { Header: "Customer name", accessor: "displayName" },
    { Header: "Phone no", accessor: "phoneNumber" },
    { Header: "SKU Name", accessor: "variantAndProductName" },
    { Header: "Times Sold", accessor: "times_sold" },
    { Header: "Times Picked", accessor: "times_picked" },
  ];

  const columns = React.useMemo(generateColumns, []);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
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
      initialState: { pageIndex: 0, pageSize: 10 },
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
        return `"${value !== undefined && value !== null ? value : "N/A"}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", "customer_sku_preference.csv");
    a.click();
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxPagesToShow = 3;
    const startPage = Math.max(1, pageIndex + 1 - maxPagesToShow);
    const endPage = Math.min(pageCount, pageIndex + 1 + maxPagesToShow);

    if (startPage > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => gotoPage(0)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          1
        </button>
      );
      if (startPage > 2) {
        pages.push(
          <span
            key="start-ellipsis"
            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
          >
            ...
          </span>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => gotoPage(i - 1)}
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
            i === pageIndex + 1
              ? "bg-gray-600 text-white"
              : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
          }`}
        >
          {i}
        </button>
      );
    }

    if (endPage < pageCount) {
      if (endPage < pageCount - 1) {
        pages.push(
          <span
            key="end-ellipsis"
            className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0"
          >
            ...
          </span>
        );
      }
      pages.push(
        <button
          key={pageCount}
          onClick={() => gotoPage(pageCount - 1)}
          className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0"
        >
          {pageCount}
        </button>
      );
    }

    return pages;
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
                  Customer SKU Preference
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
                      </div>
                      {(!fetched && !loading) && (
                        <div className="flex justify-between items-start mt-3">
                          <div>
                            <span className="block sm:inline">
                              Select a date range to generate data
                            </span>
                          </div>
                        </div>
                      )}
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
                      ) : view === "table" ? (
                        <CustomerSKUTable
                          columns={columns}
                          data={filteredData}
                          page={page}
                          canPreviousPage={canPreviousPage}
                          canNextPage={canNextPage}
                          pageCount={pageCount}
                          pageIndex={pageIndex}
                          pageSize={pageSize}
                          gotoPage={gotoPage}
                          previousPage={previousPage}
                          nextPage={nextPage}
                          setPageSize={setPageSize}
                          getTableProps={getTableProps}
                          getTableBodyProps={getTableBodyProps}
                          headerGroups={headerGroups}
                          prepareRow={prepareRow}
                          renderPageNumbers={renderPageNumbers}
                        />
                      ) : (
                        <CustomerSKUChart
                          data={filteredData}
                          startDate={startDate}
                          endDate={endDate}
                        />
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

export default CustomerSKUPreference;
