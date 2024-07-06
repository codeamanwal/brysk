import React, { useState, useEffect, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { ThreeDots } from "react-loader-spinner";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";
import InventoryPreferenceTable from "../components/InventoryPreference/InventoryPreferenceTable";
import InventoryPreferenceChart from "../components/InventoryPreference/InventoryPreferenceChart";

const InventoryPreference = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("value");
  const [displayMode, setDisplayMode] = useState("table");

  useEffect(() => {
    fetchData();
  }, [view]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    let endpoint = `${process.env.REACT_APP_BACKEND_URL}/inventorypreference/${view}`;

    try {
      const response = await axios.get(endpoint);
      console.log(response.data);
      setData(response.data);
    } catch (error) {
      setError(error);
    } finally {
      setLoading(false);
    }
  };

  const generateColumns = () => [
    {
      Header: "Variant Id",
      accessor: "variantId",
    },
    {
      Header: "Variant Name",
      accessor: "variant_name",
    },
    view === "value"
      ? {
          Header: "Total Value (INR)",
          accessor: "total_value",
          Cell: ({ value }) => (value ? value.toFixed(3) : "N/A"),
        }
      : {
          Header: "Total Volume",
          accessor: "total_volume",
        },
  ];

  const columns = useMemo(generateColumns, [view]);

  const downloadCSV = () => {
    const csvRows = [];
    const headers = columns.map((col) => col.Header);
    csvRows.push(headers.join(","));

    data.forEach((row) => {
      const values = columns.map((col) => {
        const value = row[col.accessor];
        return `"${value !== undefined ? value : "N/A"}"`;
      });
      csvRows.push(values.join(","));
    });

    const csvContent = csvRows.join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.setAttribute("href", url);
    a.setAttribute("download", `top10sku_${view}.csv`);
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
                  Inventory Preference - Top 10 SKUs
                </h2>
                <div className="mt-3 flex sm:ml-4 sm:mt-0">
                  <button
                    type="button"
                    className={`inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-500 ${
                      displayMode === "table"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-900"
                    }`}
                    onClick={() => setDisplayMode("table")}
                  >
                    Table
                  </button>
                  <button
                    type="button"
                    className={`ml-3 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-500 ${
                      displayMode === "chart"
                        ? "bg-gray-800 text-white"
                        : "bg-white text-gray-900"
                    }`}
                    onClick={() => setDisplayMode("chart")}
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
              <div>
                <select
                  value={view}
                  onChange={(e) => setView(e.target.value)}
                  className="mt-5 inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 bg-white text-gray-900"
                >
                  <option value="value">Top 10 by Value</option>
                  <option value="volume">Top 10 by Volume</option>
                </select>
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
                        We encountered an issue while fetching the data. Please
                        try again later.
                      </span>
                    </div>
                    <button className="ml-4" onClick={() => setError(null)}>
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
              ) : displayMode === "table" ? (
                <InventoryPreferenceTable data={data} columns={columns} />
              ) : (
                <InventoryPreferenceChart data={data} view={view} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InventoryPreference;
