import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import axios from "axios";
import { useTable } from "react-table";
import { ThreeDots } from "react-loader-spinner";
import { DocumentArrowDownIcon } from "@heroicons/react/24/solid";
import { Tooltip } from "react-tooltip";

const InventoryPreference = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("value");

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
      Header: "Variant ID",
      accessor: "variantId",
    },
    view === "value"
      ? {
          Header: "Total Value",
          accessor: "total_value",
          Cell: ({ value }) => (value ? value.toFixed(3) : "N/A"),
        }
      : {
          Header: "Total Volume",
          accessor: "total_volume",
        },
  ];

  const columns = React.useMemo(generateColumns, [view]);

  const { getTableProps, getTableBodyProps, headerGroups, rows, prepareRow } =
    useTable({
      columns,
      data,
    });

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
                  <select
                    value={view}
                    onChange={(e) => setView(e.target.value)}
                    className="inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-100 bg-white text-gray-900"
                  >
                    <option value="value">Top 10 by Value</option>
                    <option value="volume">Top 10 by Volume</option>
                  </select>
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
              {error && (
                <div
                  className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                  role="alert"
                >
                  <strong className="font-bold">
                    Oops! Something went wrong.
                  </strong>
                  <span className="block sm:inline">
                    We encountered an issue while fetching the data. Please try
                    again later.
                  </span>
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
              ) : (
                <div className="mt-8 flex flex-col">
                  <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                      <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                        <table
                          {...getTableProps()}
                          className="min-w-full divide-y divide-gray-300"
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
                            {rows.map((row) => {
                              prepareRow(row);
                              return (
                                <tr {...row.getRowProps()}>
                                  {row.cells.map((cell) => (
                                    <td
                                      {...cell.getCellProps()}
                                      className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900"
                                    >
                                      {cell.render("Cell")}
                                    </td>
                                  ))}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default InventoryPreference;
