import { Link } from "react-router-dom";
import bgImage from "./images/Ambulance-On-Street.jpg";

export default function Home() {
  return (
    <div
      className="min-h-screen w-full bg-cover bg-center relative"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      {/* dark overlay */}
      <div className="absolute inset-0 bg-black/80"></div>

      {/* flashing emergency bar */}
      <div className="absolute top-0 w-full text-center py-2 bg-red-700 animate-pulse text-white tracking-widest font-semibold">
        EMERGENCY RESPONSE CONTROL PANEL
      </div>

      {/* content */}
      <div className="relative z-10 flex items-center justify-center h-full px-6">
        <div className="max-w-4xl text-center backdrop-blur-xl bg-white/10 border border-red-600/50 rounded-3xl shadow-2xl p-12">

          <h1 className="text-5xl font-extrabold text-white mb-4">
            Smart Ambulance Pre-Allocation System
          </h1>

          <p className="text-gray-200 text-lg mb-8">
            Real-time disaster-aware ambulance planning engine. 
            Predict, pre-position and respond faster.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/disaster-type"
              className="px-8 py-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-900 transition"
            >
               Start Allocation
            </Link>

            <button className="px-8 py-4 rounded-xl bg-gray-800 text-white border border-gray-500 hover:bg-gray-700">
               View Live Situation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
