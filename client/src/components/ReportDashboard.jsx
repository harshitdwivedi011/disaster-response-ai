import React, { useEffect, useState } from "react";
import ReportForm from "./ReportForm";
import ReportList from "./ReportList";

const server_origin = import.meta.env.VITE_SERVER_ORIGIN;
const ReportDashboard = () => {
  const [reports, setReports] = useState([]);

  const fetchReports = async () => {
    try {
      const res = await fetch(`${server_origin}/api/reports`, {
        headers: {
          "x-user": "netrunnerX", // or "reliefAdmin"
        },
      });
      const data = await res.json();
      setReports(data.reverse()); // newest first
    } catch (err) {
      console.error("Error fetching reports:", err);
    }
  };

  useEffect(() => {
    fetchReports(); // Initial fetch
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ReportForm refreshReports={fetchReports} />
      {reports.length > 0 ? <ReportList reports={reports} /> : ""}
    </div>
  );
};

export default ReportDashboard;
