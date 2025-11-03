import React from 'react';
import { Link } from 'react-router-dom';
// import NewDeliveryModal from './NewDeliveryModal';
// Example icons from Heroicons CDN (or use your preferred icon library)
const navLinks = [
  { name: 'Home', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7m-9 2v8m4-8v8m5 0h-2a2 2 0 01-2-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v11a2 2 0 002 2h2" /></svg>
  ) },
  { name: 'Agenda', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M16 2v4M8 2v4M3 10h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { name: 'New Delivery', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
  ) },
  { name: 'Pricing', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
  ) },
  { name: 'Truck Management', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/><path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
  ) },
  { name: 'Dashboard', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h18v18H3V3zm3 3v12h12V6H6z" /></svg>
  ) },
  { name: 'About', icon: (
    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01" /></svg>
  ) },
];

const Navbar = ({ onRequestDelivery }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <nav className="bg-gradient-to-r from-gray-900 via-gray-800 to-yellow-700 shadow-lg sticky top-0 z-50 border-b-4 border-yellow-500">
  <div className="flex items-center px-0.5 sm:px-1 md:px-2 lg:px-4 xl:px-8 2xl:px-12 h-16 md:h-20 w-full">
        {/* Logo & App Name (hug left) */}
        <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-shrink-0">
          <img src="/logo.png" alt="Logo" className="h-7 w-7 md:h-9 md:w-9 rounded shadow-md border-2 border-yellow-500 bg-white flex-shrink-0" />
          <span className="truncate text-base md:text-xl font-extrabold tracking-widest uppercase text-yellow-400 drop-shadow-lg">ConcreteXpress</span>
        </div>
        {/* Desktop Nav Links (center) */}
        <div className="hidden lg:flex flex-1 justify-center gap-3 items-center min-w-0">
          {navLinks.map(link => {
            let to = '#';
            if (link.name === 'Agenda') to = '/agenda';
            else if (link.name === 'Truck Management') to = '/trucks';
            else if (link.name === 'Dashboard') to = '/dashboard';
            else if (link.name === 'Home') to = '/';
            else if (link.name === 'Pricing') to = '/pricing';
            return (
              <Link
                key={link.name}
                to={to}
                className="flex items-center uppercase font-semibold tracking-wide text-gray-100 hover:text-yellow-400 transition-colors duration-200 px-1.5 py-0.5 rounded-lg hover:bg-gray-800 text-xs xl:text-sm"
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
        </div>
        {/* Request Delivery Button (hug right) */}
        <div className="hidden md:flex flex-shrink-0 ml-auto">
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold uppercase px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg shadow transition-colors duration-200 border-2 border-yellow-600 text-xs md:text-sm xl:text-base"
            onClick={onRequestDelivery}
          >
            Request Delivery
          </button>
        </div>
        {/* Mobile Hamburger */}
        <button className="lg:hidden flex items-center ml-2" onClick={() => setMenuOpen(!menuOpen)}>
          <svg className="w-8 h-8 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      {/* Mobile Menu */}
      {menuOpen && (
        <div className="lg:hidden px-4 pb-4 flex flex-col gap-4 bg-gradient-to-b from-gray-900 via-gray-800 to-yellow-700 shadow-lg border-b-4 border-yellow-500">
          {navLinks.map(link => {
            let to = '#';
            if (link.name === 'Agenda') to = '/agenda';
            else if (link.name === 'Truck Management') to = '/trucks';
            else if (link.name === 'Dashboard') to = '/dashboard';
            else if (link.name === 'Home') to = '/';
            else if (link.name === 'Pricing') to = '/pricing';
            return (
              <Link
                key={link.name}
                to={to}
                className="flex items-center uppercase font-semibold tracking-wide text-gray-100 hover:text-yellow-400 transition-colors duration-200 px-2 py-1 rounded-lg hover:bg-gray-800 text-base"
              >
                {link.icon}
                {link.name}
              </Link>
            );
          })}
          <button
            className="bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold uppercase px-4 py-2 rounded-lg shadow border-2 border-yellow-600"
            onClick={onRequestDelivery}
          >
            Request Delivery
          </button>
        </div>
      )}
    </nav>
  );
}

export default Navbar