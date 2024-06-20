import React from 'react';
import Sidebar from '../components/Sidebar';
import SearchBar from '../components/SearchBar';

const StoreStatus = () => {
  return (
    <div className="flex">
      <Sidebar />
      <div className="lg:pl-72 flex-1">
        <SearchBar />
        <main className="py-10">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto p-5 bg-white rounded-md shadow">
              <h1>Store Status</h1>
              {/* Your content goes here */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StoreStatus;
