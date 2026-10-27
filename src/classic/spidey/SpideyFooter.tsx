import React from 'react';

const SpideyFooter: React.FC = () => {
  return (
    <footer className="bg-red border-t-2 border-red-600 text-white py-8 mt-12">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-8 mb-6">
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm text-red-500 font-mono tracking-wider">About</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-mono">
              <li className="hover:text-red-500 cursor-pointer">Mission</li>
              <li className="hover:text-red-500 cursor-pointer">Team</li>
              <li className="hover:text-red-500 cursor-pointer">Contact</li>
              <li className="hover:text-red-500 cursor-pointer">Join Us</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm text-red-500 font-mono tracking-wider">Intel</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-mono">
              <li className="hover:text-red-500 cursor-pointer">Live Feed</li>
              <li className="hover:text-red-500 cursor-pointer">Threat Map</li>
              <li className="hover:text-red-500 cursor-pointer">Crime Data</li>
              <li className="hover:text-red-500 cursor-pointer">Analytics</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm text-red-500 font-mono tracking-wider">Network</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-mono">
              <li className="hover:text-red-500 cursor-pointer">Community</li>
              <li className="hover:text-red-500 cursor-pointer">Report Sighting</li>
              <li className="hover:text-red-500 cursor-pointer">API Access</li>
              <li className="hover:text-red-500 cursor-pointer">Developers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm text-red-500 font-mono tracking-wider">Connect</h4>
            <ul className="space-y-2 text-xs text-gray-400 font-mono">
              <li className="hover:text-red-500 cursor-pointer">Twitter</li>
              <li className="hover:text-red-500 cursor-pointer">Discord</li>
              <li className="hover:text-red-500 cursor-pointer">GitHub</li>
              <li className="hover:text-red-500 cursor-pointer">Newsletter</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-red-600/30 pt-6 text-center text-xs font-mono">
          <p className="mb-2 text-gray-400">&copy; 2026 SPIDEY.WATCH &bull; Neural Network v4.2.0</p>
          <p className="text-red-600/60">
            "Your Friendly Neighborhood Intelligence Network"
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SpideyFooter;
