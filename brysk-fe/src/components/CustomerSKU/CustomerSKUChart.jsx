import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const CustomerSKUChart = ({ data, startDate, endDate }) => {
  const labels = data.map((item) => item.displayName);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Times Sold",
        data: data.map((item) => item.times_sold),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Times Picked",
        data: data.map((item) => item.times_picked),
        backgroundColor: "rgba(153, 102, 255, 0.2)",
        borderColor: "rgba(153, 102, 255, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Customer SKU Preference Chart",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = data[context.dataIndex];
            return [
              `Dates: ${startDate} - ${endDate}`,
              `Times Sold: ${item.times_sold}`,
              `Times Picked: ${item.times_picked}`,
              `Variant Id: ${item.variantId}`,
              `Variant Name: ${item.variant_name}`,
            ];
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default CustomerSKUChart;
