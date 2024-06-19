import React from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ThreeDots } from "react-loader-spinner";

const SalesBarChart = ({ data, loading }) => {
  if (loading) {
    return (
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
    );
  }


  return (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart
        width={500}
        height={300}
        data={data}
        margin={{
          top: 5, right: 30, left: 20, bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="locationId" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="total_sales" fill="#8884d8" />
        {data[0] && data[0].variantId && <Bar dataKey="total_quantity" fill="#82ca9d" />}
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SalesBarChart;
