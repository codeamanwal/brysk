import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SellThroughChart = ({ data }) => {
  const labels = data.map((item) => item.displayName);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Sell Through Rate (%)",
        data: data.map((item) =>
          item.sell_through_rate !== null ? item.sell_through_rate.toFixed(2) : "N/A"
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
        text: "Sell Through Rate (%)",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const item = data[context.dataIndex];
            return [
              `${context.dataset.label}: ${context.raw}`,
              `Variant Id: ${item.variantId}`,
              `Received Quantity: ${item.received_qty}`,
              `Sold Quantity: ${item.sold_qty}`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Location',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Sell Through Rate (%)',
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default SellThroughChart;
