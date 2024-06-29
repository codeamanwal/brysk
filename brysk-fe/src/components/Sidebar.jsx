import { Fragment, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  XMarkIcon,
  Bars3Icon,
  ArrowLeftOnRectangleIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  {
    name: "Sales and Inventory Analytics",
    children: [
      { name: "Sales per Location/Store", href: "/sales/location-store", icon: XMarkIcon },
      { name: "Sales per Customer", href: "/sales/customer", icon: XMarkIcon },
      { name: "Inventory at Location/Store/Warehouse", href: "/inventory/location-store-warehouse", icon: XMarkIcon },
      { name: "Inventory Flow at Location/Store/Warehouse", href: "/inventory-flow/location-store-warehouse", icon: XMarkIcon },
      { name: "Weight-Based vs. System Inventory Discrepancy", href: "/inventory/discrepancy", icon: XMarkIcon },
    ],
  },
  {
    name: "Location/Store Analytics",
    children: [
      { name: "Number of Bills per Location", href: "/bills/location", icon: XMarkIcon },
      { name: "Inventory Preference", href: "/inventory/preference", icon: XMarkIcon },
      { name: "Sell-through Rate", href: "/sell-through-rate", icon: XMarkIcon },
      { name: "Customer SKU Preference", href: "/customer/sku-preference", icon: XMarkIcon },
    ],
  },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();
  const [openSections, setOpenSections] = useState({});
  const location = useLocation();
  const history = useNavigate();

  useEffect(() => {
    const currentPath = location.pathname;
    const newOpenSections = {};

    navigation.forEach((section) => {
      section.children.forEach((item) => {
        if (currentPath.startsWith(item.href)) {
          newOpenSections[section.name] = true;
        }
      });
    });

    setOpenSections(newOpenSections);
  }, [location]);

  const handleNavLinkClick = () => {
    setSidebarOpen(false);
  };

  const toggleSection = (section) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleLogout = () => {
    history("/");
  };

  return (
    <div>
      {/* Hamburger menu button for mobile view */}
      <div className="lg:hidden p-4 bg-gray-800">
        <button
          type="button"
          className="text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>

      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50 lg:hidden"
          onClose={setSidebarOpen}
        >
          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="ease-in-out duration-300"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="ease-in-out duration-300"
              leaveFrom="-translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 w-full max-w-xs">
                <div className="flex flex-col h-full overflow-y-auto bg-gray-800 p-6">
                  <div className="flex items-center justify-between">
                    <img
                      className="h-8 w-auto"
                      src="/assets/Brysk-white-logo.webp"
                      alt="Brysk"
                    />
                    <button
                      type="button"
                      className="rounded-md text-gray-400 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      onClick={() => {
                        setSidebarOpen(!sidebarOpen);
                      }}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                  <div className="mt-5 flex-1">
                    <nav>
                      {navigation.map((section) => (
                        <div key={section.name}>
                          <button
                            onClick={() => toggleSection(section.name)}
                            className="w-full flex items-center px-2 py-2 text-left text-gray-400 hover:text-white hover:bg-black text-sm font-medium rounded-md"
                          >
                            {openSections[section.name] ? (
                              <ChevronDownIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                            ) : (
                              <ChevronRightIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                            )}
                            {section.name}
                          </button>
                          {openSections[section.name] && (
                            <div className="ml-4">
                              {section.children.map((item) => (
                                <NavLink
                                  key={item.name}
                                  to={item.href}
                                  onClick={handleNavLinkClick}
                                  className={({ isActive }) =>
                                    classNames(
                                      isActive
                                        ? "bg-brysk text-black"
                                        : "text-gray-400 hover:text-black hover:bg-hover",
                                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md break-words mb-2"
                                    )
                                  }
                                >
                                  <item.icon
                                    className="mr-3 h-6 w-6 flex-shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span className="break-words">{item.name}</span>
                                </NavLink>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </nav>
                  </div>
                  <div className="mt-auto">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-2 py-2 text-left text-gray-400 hover:text-white hover:bg-black text-sm font-medium rounded-md"
                    >
                      <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                      Logout
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:flex lg:flex-col lg:w-72 lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-gray-800 p-6">
          <div className="flex items-center flex-shrink-0">
            <img
              className="h-8 w-auto"
              src="/assets/Brysk-white-logo.webp"
              alt="Brysk"
            />
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 space-y-1">
              {navigation.map((section) => (
                <div key={section.name}>
                  <button
                    onClick={() => toggleSection(section.name)}
                    className="w-full flex items-center px-2 py-2 text-left text-white hover:text-white hover:bg-gray-500 text-sm font-medium rounded-md"
                  >
                    {openSections[section.name] ? (
                      <ChevronDownIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                    ) : (
                      <ChevronRightIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                    )}
                    {section.name}
                  </button>
                  {openSections[section.name] && (
                    <div className="ml-4">
                      {section.children.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          className={({ isActive }) =>
                            classNames(
                              isActive ? "bg-brysk text-black" : "hover:bg-hover hover:text-black text-white",
                              "group flex items-center px-2 py-2 text-sm font-medium rounded-md break-words mb-2"
                            )
                          }
                        >
                          <item.icon
                            className="mr-3 h-6 w-6 flex-shrink-0"
                            aria-hidden="true"
                          />
                          <span className="break-words">{item.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>
            <div className="mt-auto">
              <button
                onClick={handleLogout}
                className="w-full flex items-center px-2 py-2 text-left text-gray-400 hover:text-white hover:bg-black text-sm font-medium rounded-md"
              >
                <ArrowLeftOnRectangleIcon className="mr-3 h-6 w-6" aria-hidden="true" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
