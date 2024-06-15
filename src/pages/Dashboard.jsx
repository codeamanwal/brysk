import React from "react";
import Sidebar from "../components/Sidebar";
import SearchBar from "../components/SearchBar";

const Dashboard = () => {
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
                className="rounded-md bg-gray-800 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
              >
                Chart
              </button>
              <button
                type="button"
                className="rounded-md bg-gray-800 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-500"
              >
                Tables
              </button>
            </div>
            <p>Dashboard</p>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
