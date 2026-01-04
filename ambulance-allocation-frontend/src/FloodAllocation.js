import React, { useState } from "react";
import axios from "axios";

export default function FloodAllocation() {
  const [district, setDistrict] = useState("");
  const [gauges, setGauges] = useState([]);
  const [results, setResults] = useState(null);

  const addGauge = () => {
    setGauges([
      ...gauges,
      { name: "", water: "", minor: "", major: "", rain: "" }
    ]);
  };

  const updateGauge = (index, field, value) => {
    const newGauges = [...gauges];
    newGauges[index][field] = value;
    setGauges(newGauges);
  };

  const callBackend = async () => {
    if (!district || gauges.length === 0) {
      alert("Please select district and add at least one gauge");
      return;
    }

    try {
      const response = await axios.post("http://127.0.0.1:8000/predict", {
        district: district,
        gauges: gauges.map(g => ({
          name: g.name,
          water: Number(g.water),
          minor: Number(g.minor),
          major: Number(g.major),
          rain: Number(g.rain)
        }))
      });

      setResults(response.data);
    } catch (err) {
      console.error(err);
      alert("Backend error. Check console.");
    }
  };

  return (
    <div className="min-h-screen p-10"
         style={{ background: "white", color: "#0f172a" }}>

      {/* HEADER CARD glassy */}
      <div className="max-w-4xl mx-auto rounded-2xl p-8 shadow-xl border backdrop-blur"
           style={{ background: "rgba(22,58,52,0.85)", color: "white" }}>

        <h1 className="text-3xl font-bold mb-2">
          Flood Ambulance Pre-Allocation
        </h1>

        <p className="text-gray-200">
          Decision support system for emergency ambulance deployment.
        </p>
      </div>

      {/* FORM PANEL */}
      <div className="max-w-4xl mx-auto mt-8 p-8 rounded-2xl shadow-lg bg-white border">

        <label className="font-semibold">Select District</label>
        <select
          value={district}
          onChange={e => setDistrict(e.target.value)}
          className="w-full p-3 border rounded-xl mt-2"
        >
          <option value="">-- select --</option>
          <option>Kandy</option>
          <option>Gampaha</option>
          <option>Galle</option>
          <option>Ratnapura</option>
          <option>Nuwara Eliya</option>
        </select>

        {/* Gauge Inputs */}
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            River Gauge Readings
          </h2>

          {gauges.map((g, idx) => (
            <div key={idx} className="grid grid-cols-5 gap-3 mb-3">
              <input className="border p-2 rounded" placeholder="Gauge name"
                     onChange={e=>updateGauge(idx,"name",e.target.value)} />

              <input className="border p-2 rounded" placeholder="Water level"
                     onChange={e=>updateGauge(idx,"water",e.target.value)} />

              <input className="border p-2 rounded" placeholder="Minor level"
                     onChange={e=>updateGauge(idx,"minor",e.target.value)} />

              <input className="border p-2 rounded" placeholder="Major level"
                     onChange={e=>updateGauge(idx,"major",e.target.value)} />

              <input className="border p-2 rounded" placeholder="Rainfall (mm)"
                     onChange={e=>updateGauge(idx,"rain",e.target.value)} />
            </div>
          ))}

          <button
            onClick={addGauge}
            className="mt-2 px-4 py-2 rounded-xl text-white"
            style={{ background: "#163a34" }}
          >
            Add Gauge
          </button>
        </div>

        <button
          onClick={callBackend}
          className="mt-6 w-full py-3 rounded-2xl font-semibold text-white"
          style={{ background: "#dc2626" }}
        >
          Predict Ambulance Requirement
        </button>
      </div>

      {results && results.per_gauge_results && (
  <div className="max-w-4xl mx-auto mt-8 p-8 rounded-2xl shadow-xl border bg-white">

    <h2 className="text-2xl font-bold mb-4">
      Prediction Results – {results.district}
    </h2>

    <table className="w-full text-left">
      <thead>
        <tr className="font-semibold border-b">
          <th>Gauge</th>
          <th>Scenario</th>
          <th>Rain (mm)</th>
          <th>Ambulances</th>
        </tr>
      </thead>

      <tbody>
        {results.per_gauge_results.map((r, i) => (
          <tr key={i} className="border-b">
            <td>{r.gauge}</td>
            <td>
  {r.scenario === "FLOOD_S2" && (
    <span className="font-bold" style={{color:"#dc2626"}}>
      Major Flood
    </span>
  )}

  {r.scenario === "FLOOD_S1" && (
    <span className="font-bold" style={{color:"#ca8a04"}}>
      Minor Flood
    </span>
  )}

  {r.scenario === "PRE_WARNING" && (
    <span className="font-bold" style={{color:"#163a34"}}>
      Warning – Near Flood Level
    </span>
  )}

  {r.scenario === "NO_FLOOD" && (
    <span className="text-gray-600">
      No Flood
    </span>
  )}
</td>

            <td>{r.rain_mm}</td>
            <td className="font-bold">{r.predicted_ambulances}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div className="mt-4 font-bold text-right">
      Total ambulances to pre-allocate: {results.total_ambulances}
    </div>

  </div>
)}

    </div>
  );
}
