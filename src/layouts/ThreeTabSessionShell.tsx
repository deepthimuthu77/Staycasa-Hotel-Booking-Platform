// src/layouts/ThreeTabSessionShell.tsx

import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  Briefcase,
  User as UserIcon,
  Home,
  ChevronLeft,
} from 'lucide-react';

// Define the navigation links for the tabs
const tabs = [
  {
    name: 'My Bookings',
    href: '/bookings',
    icon: Briefcase,
  },
  {
    name: 'My Stays',
    href: '/accommodations',
    icon: Home,
  },
  {
    name: 'My Account',
    href: '/profile',
    icon: UserIcon,
  },
];

/**
 * A shared layout component for the user dashboard.
 * Provides tabbed navigation for Bookings, Accommodations, and Account.
 */
export const ThreeTabSessionShell = () => {
  const location = useLocation();

  // Helper to get the page title from the current path
  const getPageTitle = () => {
    const currentTab = tabs.find((tab) => location.pathname.startsWith(tab.href));
    return currentTab?.name || 'My Dashboard';
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Note: The main <Header> is now part of the root <Layout> in App.tsx.
        This shell provides the sub-navigation and content area.
      */}
      <main className="container mx-auto max-w-7xl p-4 mt-6">
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 mb-4"
        >
          <ChevronLeft size={16} />
          Back to Browse
        </a>

        <div className="flex flex-col lg:flex-row lg:gap-8">
          {/* --- Left Column (Navigation) --- */}
          <aside className="w-full lg:w-1/4 mb-6 lg:mb-0">
            {/* Page title for mobile */}
            <h1 className="text-3xl font-bold text-gray-900 mb-6 lg:hidden">
              {getPageTitle()}
            </h1>
            
            <nav className="flex lg:flex-col lg:space-y-2 p-2 bg-gray-200 lg:bg-white lg:shadow-md lg:rounded-xl lg:border lg:border-gray-100 lg:p-4">
              {tabs.map((tab) => (
                <NavLink
                  key={tab.name}
                  to={tab.href}
                  end // Use 'end' to match routes exactly
                  className={({ isActive }) =>
                    `flex items-center gap-3 p-3 lg:p-4 rounded-lg font-semibold transition-colors text-sm lg:text-base ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-gray-700 hover:bg-gray-100 lg:hover:bg-gray-50'
                    }`
                  }
                >
                  <tab.icon size={20} />
                  <span className="flex-1 lg:flex-none">{tab.name}</span>
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* --- Right Column (Page Content) --- */}
          <div className="w-full lg:w-3/4">
            {/* The active child route (e.g., AccountPage) will render here */}
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ThreeTabSessionShell;