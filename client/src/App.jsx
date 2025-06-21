import { useEffect, useState } from "react";
import "./App.css";
import DisasterForm from "./components/DisasterForm";
import DisasterList from "./components/DisasterList";
import ReportDashboard from "./components/ReportDashboard";

const server_origin = import.meta.env.VITE_SERVER_ORIGIN;

function App() {
  const [disasters, setDisasters] = useState([]);
  const [filterTag, setFilterTag] = useState("");

  const fetchDisasters = async (tag) => {
    const url = tag
      ? `${server_origin}/disasters?tag=${encodeURIComponent(tag)}`
      : `${server_origin}/disasters`;
    const res = await fetch(url, {
      headers: {
        "x-user": "netrunnerX", // or "reliefAdmin"
      },
    });
    const data = await res.json();
    setDisasters(data);
  };

  useEffect(() => {
    fetchDisasters();
  }, []);

  return (
    <div className="p-6 space-y-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-center">
        Disaster Response Dashboard
      </h1>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Create Disaster</h2>
        <DisasterForm onSubmitSuccess={fetchDisasters} />
      </section>

      <section className="space-y-4">
        <DisasterList
          disasters={disasters}
          fetchDisasters={fetchDisasters}
          filterTag={filterTag}
          setFilterTag={setFilterTag}
        />
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Reports</h2>
        <ReportDashboard />
      </section>
    </div>
  );
}

export default App;
