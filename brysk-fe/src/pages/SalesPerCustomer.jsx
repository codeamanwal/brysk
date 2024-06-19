import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { format } from "date-fns";

const SalesPerLocation = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [view, setView] = useState("table"); // State to toggle between table and chart view

  useEffect(() => {
    setError("");
    axios
      .get(`${process.env.REACT_APP_BACKEND_URL}/salesperlocation`)
      .then((response) => {
        setData(response.data);
        console.log(response.data);
      })
      .catch((error) => {
        setError(error);
        console.error(error);
      });
  }, []);

  const columns = React.useMemo(
    () => [
      {
        Header: "Location ID",
        accessor: "locationId",
      },
      {
        Header: "Sale Day",
        accessor: "sale_day",
        Cell: ({ value }) => format(new Date(value), "yyyy-MM-dd"), // Format date and time here
      },
      {
        Header: "Total Sales",
        accessor: "total_sales",
      },
    ],
    []
  );

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
      initialState: { pageIndex: 0 }, // Pass our hoisted table state
    },
    usePagination
  );

  return (
    <div>
      <Sidebar />
      <div className="lg:pl-64">
        <SearchBar />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-end">
              <button
                type="button"
                className={`rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm ${
                  view === "table" ? "bg-gray-800" : "bg-gray-500"
                }`}
                onClick={() => setView("table")}
              >
                Tables
              </button>
              <button
                type="button"
                className={`rounded-md px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm ${
                  view === "chart" ? "bg-gray-800" : "bg-gray-500"
                }`}
                onClick={() => setView("chart")}
              >
                Chart
              </button>
            </div>
            <div></div>
            {error ? <p>{error.message}</p> : null}
            {view === "table" ? (
              <div>
                <table
                  {...getTableProps()}
                  className="min-w-full divide-y divide-gray-200 my-10"
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
                <div className="pagination">
                  <button
                    onClick={() => gotoPage(0)}
                    disabled={!canPreviousPage}
                  >
                    {"<<"}
                  </button>{" "}
                  <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                  >
                    {"<"}
                  </button>{" "}
                  <button onClick={() => nextPage()} disabled={!canNextPage}>
                    {">"}
                  </button>{" "}
                  <button
                    onClick={() => gotoPage(pageCount - 1)}
                    disabled={!canNextPage}
                  >
                    {">>"}
                  </button>{" "}
                  <span>
                    Page{" "}
                    <strong>
                      {pageIndex + 1} of {pageOptions.length}
                    </strong>{" "}
                  </span>
                  <span>
                    | Go to page:{" "}
                    <input
                      type="number"
                      defaultValue={pageIndex + 1}
                      onChange={(e) => {
                        const page = e.target.value
                          ? Number(e.target.value) - 1
                          : 0;
                        gotoPage(page);
                      }}
                      style={{ width: "100px" }}
                    />
                  </span>{" "}
                  <select
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                    }}
                  >
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <option key={pageSize} value={pageSize}>
                        Show {pageSize}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div>
                {/* This is where your chart component will go */}
                <p>Chart view is currently empty</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default SalesPerLocation;
