import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryPreferenceChart = ({ data, view }) => {
  console.log(data);
  const labels = data.map((item) => item.variant_name);

  const chartData = {
    labels,
    datasets: [
      {
        label: view === "value" ? "Total Value (INR)" : "Total Volume",
        data: data.map((item) =>
          view === "value" ? (item.total_value ? item.total_value.toFixed(3) : 0) : (item.total_volume ? item.total_volume : 0)
        ),
        backgroundColor: "rgba(75, 192, 192, 0.2)",
        borderColor: "rgba(75, 192, 192, 1)",
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
        text: `Inventory Preference - Top 10 SKUs (${view === "value" ? "Value" : "Volume"})`,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = data[context.dataIndex];
            return [
              `${context.dataset.label}: ${context.raw}`,
              `Variant Id: ${item.variantId}`,
              `Variant Name: ${item.variant_name}`
            ];
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Variant Name',
        },
      },
      y: {
        title: {
          display: true,
          text: view === "value" ? 'Total Value (INR)' : 'Total Volume',
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default InventoryPreferenceChart;
