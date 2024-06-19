import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { format, isValid } from "date-fns";
import { ThreeDots } from "react-loader-spinner";
import SalesBarChart from "../components/charts/SalesBarChart";
import SalesLineChart from "../components/charts/SalesLineChart";

const SalesPerLocation = () => {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("table");
  const [timePeriod, setTimePeriod] = useState("day");
  const [dataType, setDataType] = useState("total");

  useEffect(() => {
    fetchData();
  }, [timePeriod, dataType]);

  const fetchData = async () => {
    setLoading(true);
    let endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation`;
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
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/daterange?start_date=2023-01-01&end_date=2023-01-31`;
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
            endpoint = `${process.env.REACT_APP_BACKEND_URL}/salesperlocation/sku/daterange?start_date=2023-01-01&end_date=2023-01-31`;
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
      setData(response.data);
      console.log(response.data);
    } catch (error) {
      setError(error);
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const generateColumns = () => {
    let columns = [
      {
        Header: "Location ID",
        accessor: "locationId",
      },
      {
        Header: "Total Sales",
        accessor: "total_sales",
      },
    ];

    switch (timePeriod) {
      case "day":
        columns.splice(1, 0, {
          Header: "Sale Day",
          accessor: "sale_day",
          Cell: ({ value }) => isValid(new Date(value)) ? format(new Date(value), "yyyy-MM-dd HH:mm:ss") : "Invalid Date",
        });
        break;
      case "week":
        columns.splice(
          1,
          0,
          {
            Header: "Sale Year",
            accessor: "sale_year",
          },
          {
            Header: "Sale Week",
            accessor: "sale_week",
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
          },
          {
            Header: "Sale Month",
            accessor: "sale_month",
          }
        );
        break;
      case "date-range":
        columns = [
          {
            Header: "Location ID",
            accessor: "locationId",
          },
          {
            Header: "Total Sales",
            accessor: "total_sales",
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
        },
        {
          Header: "Total Quantity",
          accessor: "total_quantity",
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
      data,
      initialState: { pageIndex: 0 },
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
            <div className="max-w-7xl mx-auto p-5 bg-white rounded-md shadow">
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
              <div className="px-4 sm:px-6 lg:px-8">
                <div className="flow-root">
                  <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8 pb-2">
                    <div className="inline-block min-w-full py-2 align-middle">
                      <div className="my-4">
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
                          </select>
                        </label>
                        <label className="ml-4">
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
                      </div>
                      {error ? <p>{error.message}</p> : null}
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
                            <button
                              onClick={() => nextPage()}
                              disabled={!canNextPage}
                            >
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
                          <SalesBarChart data={data} loading={loading} />
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
