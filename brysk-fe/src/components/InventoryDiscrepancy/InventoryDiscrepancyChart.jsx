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

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const InventoryDiscrepancyChart = ({ data }) => {
  console.log(data);
  const labels = data.map((item) => item.locationName);
  const chartData = {
    labels,
    datasets: [
      {
        label: "Discrepancy",
        data: data.map((item) => item.discrepancy),
        backgroundColor: "rgba(255, 205, 86, 0.2)",
        borderColor: "rgba(255, 205, 86, 1)",
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
        text: "Weight-Based vs. System Inventory Discrepancy",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = data[context.dataIndex];
            return [
              `Discrepancy ${item.discrepancy}`,
              `IMS Quantity ${item.imsQuantity}`,
              `Sensor Quantity ${item.sensorQuantity}`,
            ]
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Location",
          },
        },
        y: {
          title: {
            display: true,
            text: "Discrepancy",
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default InventoryDiscrepancyChart;
