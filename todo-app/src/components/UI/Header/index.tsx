"use client";
import React, { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { HiMenu } from "react-icons/hi";
import { signOut, useSession } from "next-auth/react";

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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: session } = useSession();

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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
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
            <h1 className="text-xl font-semibold text-gray-800">
              {getPageTitle()}
            </h1>
          </div>

          {/* User profile dropdown */}
          <div className="ml-4 flex items-center md:ml-6">
            <div className="relative" ref={dropdownRef}>
              <div
                className="flex max-w-xs items-center rounded-full bg-gray-100 text-sm focus:outline-none cursor-pointer"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <span className="sr-only">Open user menu</span>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  <span>
                    {session?.user.name ? session?.user.name.charAt(0) : "U"}
                  </span>
                </div>
              </div>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-gray-900">
                      {session?.user.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {session?.user.email}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
