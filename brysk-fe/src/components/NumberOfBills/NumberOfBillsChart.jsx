import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const NumberOfBillsChart = ({ data, timePeriod }) => {
  const labels = data.map((item) => item.displayName);

  const chartData = {
    labels,
    datasets: [
      {
        label: "Average Order Value (INR)",
        data: data.map((item) => item.average_order_value.toFixed(3)),
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
        text: `Number of Bills (${timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)})`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const item = data[context.dataIndex];
            let timeInfo = "";
            if (timePeriod === "month") {
              timeInfo = `Year: ${item.sale_year}, Month: ${item.sale_month}`;
            } else if (timePeriod === "week") {
              timeInfo = `Year: ${item.sale_year}, Week: ${item.sale_week}`;
            } else if (timePeriod === "day") {
              timeInfo = `Day: ${new Date(item.sale_day).toLocaleDateString()}`;
            }
            return [
              `${context.dataset.label}: ${context.raw}`,
              `Unique Bills: ${item.unique_bills}`,
              `Total Bills: ${item.total_bills}`,
              `(${timeInfo})`,
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
          text: 'Average Order Value (INR)',
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default NumberOfBillsChart;
