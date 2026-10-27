import React from 'react';

const BugleFooter: React.FC = () => {
  return (
    <footer className="bg-black text-white py-8 mt-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-4 gap-8 mb-6">
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm">About Us</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-red-500 cursor-pointer">Our History</li>
              <li className="hover:text-red-500 cursor-pointer">Staff Directory</li>
              <li className="hover:text-red-500 cursor-pointer">Contact Us</li>
              <li className="hover:text-red-500 cursor-pointer">Careers</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm">Sections</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-red-500 cursor-pointer">Breaking News</li>
              <li className="hover:text-red-500 cursor-pointer">City News</li>
              <li className="hover:text-red-500 cursor-pointer">Crime Reports</li>
              <li className="hover:text-red-500 cursor-pointer">Business</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm">Services</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-red-500 cursor-pointer">Subscribe</li>
              <li className="hover:text-red-500 cursor-pointer">Advertise</li>
              <li className="hover:text-red-500 cursor-pointer">Archives</li>
              <li className="hover:text-red-500 cursor-pointer">Photo Reprints</li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase mb-3 text-sm">Follow Us</h4>
            <ul className="space-y-2 text-xs">
              <li className="hover:text-red-500 cursor-pointer">Twitter</li>
              <li className="hover:text-red-500 cursor-pointer">Facebook</li>
              <li className="hover:text-red-500 cursor-pointer">Instagram</li>
              <li className="hover:text-red-500 cursor-pointer">Newsletter</li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-6 text-center text-xs">
          <p className="mb-2">&copy; 2026 The Daily Bugle. All rights reserved.</p>
          <p className="text-gray-400">
            "New York's Finest Daily Newspaper" &bull; Founded 1897 &bull; J. Jonah Jameson, Publisher
          </p>
        </div>
      </div>
    </footer>
  );
};

export default BugleFooter;
