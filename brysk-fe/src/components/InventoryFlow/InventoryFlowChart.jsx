import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const InventoryFlowChart = ({ data }) => {
  const labels = data.map((item) => item.locationName || "N/A");

  const chartData = {
    labels,
    datasets: [
      {
        label: "Quantity Loss (%)",
        data: data.map((item) => {
          const percentage = item.start_qty ? ((item.start_qty - item.inward_qty) / item.start_qty) * 100 : 0;
          return percentage;
        }),
        backgroundColor: "rgba(255, 159, 64, 0.6)",
        borderColor: "rgba(255, 159, 64, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
      title: {
        display: true,
        text: "Inventory Flow at Location/Store/Warehouse",
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = data[context.dataIndex];
            const percentage = item.start_qty ? ((item.start_qty - item.inward_qty) / item.start_qty) * 100 : 0;
            return [
              `Start Quantity: ${item.start_qty}`,
              `Inward Quantity: ${item.inward_qty}`,
              `Sold Quantity: ${item.sold_qty}`,
              `Intransit Quantity: ${item.intransit_qty}`,
              `Adjustment Quantity: ${item.adjustment_qty}`,
              `End Quantity: ${item.end_qty}`,
              `Quantity Loss (%): ${percentage.toFixed(2)}%`
            ];
          },
        },
      },
    },
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div className="relative h-96">
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default InventoryFlowChart;
