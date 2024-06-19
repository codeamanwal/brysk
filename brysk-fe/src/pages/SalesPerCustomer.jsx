import React, { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";
import axios from "axios";
import { useTable, usePagination } from "react-table";
import { format } from "date-fns";

const SalesPerCustomer = () => {
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
          <p>Hello</p>
        </main>
      </div>
    </div>
  );
};

export default SalesPerCustomer;
