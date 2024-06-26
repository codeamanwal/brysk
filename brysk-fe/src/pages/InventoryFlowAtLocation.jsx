import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { ThreeDots } from "react-loader-spinner";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  DocumentArrowDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const InventoryFlowAtLocation = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("table");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [fetched, setFetched] = useState(false); // New state to track if data is fetched

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setFetched(false); // Set fetched to false while fetching new data
    const startDateString = startDate.toISOString().split("T")[0];
    const endDateString = endDate.toISOString().split("T")[0];

    try {
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/inventoryflow?start_date=${startDateString}&end_date=${endDateString}`
      );
      setData(response.data);
      setFetched(true); // Set fetched to true after data is fetched
      console.log("dataFlow", response.data);
    } catch (error) {
      setError(error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateColumns = () => [
    {
      Header: "Location",
      accessor: "locationId",
      Cell: ({ value }) => (value ? value : "N/A"),
    },
    {
      Header: "Variant",
      accessor: "variantId",
      Cell: ({ value }) => (value ? value : "N/A"),
    },
    {
      Header: "Starting Quantity",
      accessor: "start_qty",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
    {
      Header: "Inward Quantity",
      accessor: "inward_qty",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
    {
      Header: "Sold Quantity",
      accessor: "sold_qty",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
    {
      Header: "Intransit Quantity",
      accessor: "intransit_qty",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
    {
      Header: "Ending Quantity",
      accessor: "end_qty",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
    {
      Header: "Quantity Loss",
      accessor: "qty_loss",
      Cell: ({ value }) =>
        value !== null && value !== undefined ? parseFloat(value).toFixed(3) : "N/A",
    },
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
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
    },
    usePagination
  );

  const downloadCSV = () => {
    const csvRows = [];
    const headers = columns.map((col) => col.Header);
    csvRows.push(headers.join(","));

    data.forEach((row) => {
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
    a.setAttribute("download", `Inventory_flow_${startDate}_${endDate}.csv`);
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
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
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
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0`}
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
                  Inventory Flow at Location/Store/Warehouse
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
                      <div className="my-4">
                        <label>
                          Start Date:
                          <DatePicker
                            selected={startDate}
                            onChange={(date) => setStartDate(date)}
                            selectsStart
                            startDate={startDate}
                            endDate={endDate}
                            className="p-1 border"
                            dateFormat="yyyy-MM-dd"
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
                            dateFormat="yyyy-MM-dd"
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
                      ) : (
                        fetched && (
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
                                    Showing{" "}
                                    <span className="font-medium">
                                      {pageIndex * pageSize + 1}
                                    </span>{" "}
                                    -{" "}
                                    <span className="font-medium">
                                      {Math.min(
                                        (pageIndex + 1) * pageSize,
                                        data.length
                                      )}
                                    </span>{" "}
                                    of{" "}
                                    <span className="font-medium">
                                      {data.length}
                                    </span>{" "}
                                    results
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

export default InventoryFlowAtLocation;
