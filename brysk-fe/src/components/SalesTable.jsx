import React from "react";
import { useTable, usePagination } from "react-table";
import { format, isValid } from "date-fns";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/solid";

const SalesTable = ({ data, timePeriod, dataType }) => {
  const generateColumns = () => {
    let columns = [
      {
        Header: "Location",
        accessor: "displayName",
        Cell: ({ value }) => (value ? value : "N/A"),
      },
      {
        Header: "Total Sales (INR)",
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
              return value ? format(new Date(value), "yyyy-MM-dd") : "N/A";
            },
          },
          {
            Header: "End Date",
            accessor: "endDate",
            Cell: ({ value }) => {
              return value ? format(new Date(value), "yyyy-MM-dd") : "N/A";
            },
          },
          {
            Header: "Total Sales (INR)",
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
          Header: "Variant Name",
          accessor: "variant_name",
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
      data,
      initialState: { pageIndex: 0 },
    },
    usePagination
  );

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
          className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
            pageIndex === i - 1 ? "bg-gray-600 text-white" : ""
          }`}
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
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                pageIndex === 0 ? "bg-gray-600 text-white" : ""
              }`}
            >
              1
            </button>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
              ...
            </span>
          </>
        )}
        {pages}
        {endPage < pageCount && (
          <>
            <span className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 focus:outline-offset-0">
              ...
            </span>
            <button
              onClick={() => gotoPage(pageCount - 1)}
              className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 ${
                pageIndex === pageCount - 1 ? "bg-gray-600 text-white" : ""
              }`}
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
  );
};

export default SalesTable;
