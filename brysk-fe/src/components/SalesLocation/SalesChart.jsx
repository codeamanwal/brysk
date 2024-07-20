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

const SalesChart = ({ data, timePeriod, dataType }) => {
  // console.log(data);

  let labels = data.map((item) => item.displayName);
  const tooltips = data.map((item) => {
    if (timePeriod === "month") {
      return `Year: ${item.sale_year}, Month: ${item.sale_month}`;
    } else if (timePeriod === "week") {
      return `Year: ${item.sale_year}, Week: ${item.sale_week}`;
    } else if (timePeriod === "day") {
      return `Day: ${new Date(item.sale_day).toLocaleDateString()}`;
    }
    return "";
  });

  const chartData = {
    labels,
    datasets: [
      {
        label: "Total Sales (INR)",
        data: data.map((item) => item.total_sales.toFixed(3)),
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
        text: `Sales Per Location/Store (${
          timePeriod.charAt(0).toUpperCase() + timePeriod.slice(1)
        })`,
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.dataset.label || "";
            const value = context.raw || 0;
            const tooltipText = tooltips[context.dataIndex];
            const variantText =
              dataType === "sku"
                ? `, Variant: ${data[context.dataIndex].variantAndProductName}`
                : "";
            return [`${label}: ${value}`, `(${tooltipText}${variantText})`];
          },
        },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
};

export default SalesChart;
