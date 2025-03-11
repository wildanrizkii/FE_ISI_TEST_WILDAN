"use client";
import React from "react";
import { usePathname } from "next/navigation";
import { HiMenu } from "react-icons/hi";

interface HeaderProps {
  toggleSidebar: () => void;
  toggleCollapse?: () => void;
  isCollapsed?: boolean;
}

const Header: React.FC<HeaderProps> = ({
  toggleSidebar,
  toggleCollapse,
  isCollapsed = true,
}) => {
  const pathname = usePathname();

  // Get page title based on current path
  const getPageTitle = () => {
    switch (pathname) {
      case "/":
        return "Dashboard";
      case "/tasks":
        return "Tasks";
      case "/team":
        return "Team";
      default:
        return "Todo App";
    }
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 lg:hidden hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              onClick={toggleSidebar}
            >
              <HiMenu size={24} />
            </button>
          </div>

          {/* Title */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <h1 className="text-xl font-semibold text-gray-800">Todo App</h1>
          </div>

          {/* User profile dropdown */}
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative">
              <div className="flex max-w-xs items-center rounded-full bg-gray-100 text-sm focus:outline-none">
                <span className="sr-only"> Open user menu </span>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <span>U</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
