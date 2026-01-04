import { Link } from "react-router-dom";

export default function DisasterType() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">

      <div className="max-w-3xl w-full mx-4 p-10 rounded-2xl border border-red-700 bg-black/40 backdrop-blur-xl shadow-2xl">

        <h2 className="text-3xl font-bold mb-6 text-center">
          Select Disaster Category
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* Natural */}
          <div className="p-6 rounded-xl bg-slate-900 border border-gray-600 hover:border-red-500 cursor-pointer">
            <h3 className="text-xl font-semibold mb-3">🌊 Natural Disasters</h3>

            <ul className="text-gray-300 text-sm mb-4">
              <li>• Flood</li>
              <li>• Landslide</li>
              <li>• Cyclone</li>
            </ul>

            <Link
              to="/flood-allocation"
              className="px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 inline-block"
            >
              Select Flood →
            </Link>
          </div>

          {/* Man-made */}
          <div className="p-6 rounded-xl bg-slate-900 border border-gray-600 hover:border-red-500 cursor-pointer">
            <h3 className="text-xl font-semibold mb-3">💥 Human-Made Disasters</h3>

            <ul className="text-gray-300 text-sm mb-4">
              <li>• Bomb Blast</li>
              <li>• Major Road Accident</li>
              <li>• Industrial Explosion</li>
            </ul>

            <button className="px-6 py-2 bg-gray-700 rounded-lg cursor-not-allowed">
              Coming Soon
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
