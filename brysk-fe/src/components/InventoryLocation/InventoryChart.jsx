import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryChart = ({ data }) => {
  const labels = data.map((item) => item.displayName);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Current Inventory",
        data: data.map((item) => item.end_weight),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Inventory Loss",
        data: data.map((item) => item.weight_loss),
        backgroundColor: "rgba(255, 99, 132, 0.2)",
        borderColor: "rgba(255, 99, 132, 1)",
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
        text: "Inventory At Location/Store/Warehouse",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = data[context.dataIndex];
            return [
              `Variant ${item.variantAndProductName}`,
            ]
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default InventoryChart;
