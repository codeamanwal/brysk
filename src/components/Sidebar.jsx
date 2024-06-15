import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../contexts/SidebarContext";
import {
  HomeIcon,
  ExclamationCircleIcon,
  ClipboardDocumentCheckIcon,
  Cog8ToothIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Sales per Location/Store", href: "/dashboard", icon: HomeIcon },
  { name: "Sales per Customer", href: "/salesCustomer", icon: ExclamationCircleIcon },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useSidebar();

  const handleNavLinkClick = () => {
    setSidebarOpen(false);
  };

  return (
    <div>
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
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 w-full max-w-xs">
                <div className="flex flex-col h-full overflow-y-auto bg-zentrybg p-6">
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
                  <div className="mt-5">
                    <nav>
                      {navigation.map((item) => (
                        <NavLink
                          key={item.name}
                          to={item.href}
                          onClick={handleNavLinkClick}
                          className={({ isActive }) =>
                            classNames(
                              isActive
                                ? "bg-gray-800 text-white"
                                : "text-gray-400 hover:text-white hover:bg-black",
                              "group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                            )
                          }
                        >
                          <item.icon
                            className="mr-3 h-6 w-6"
                            aria-hidden="true"
                          />
                          {item.name}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        {/* Static sidebar */}
        <div className="flex flex-col flex-grow bg-gray-800 p-6">
          <div className="flex items-center flex-shrink-0">
            <img
              className="h-8 w-auto"
              src="/assets/Brysk-white-logo.webp"
              alt="Brysk"
            />
          </div>
          <div className="mt-5 flex-1 flex flex-col">
            <nav className="flex-1 px-2 space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    classNames(
                      isActive
                        ? "bg-brysk text-black"
                        : "text-white",
                      "group flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-hover hover:text-black"
                    )
                  }
                >
                  <item.icon className="mr-3 h-6 w-6" aria-hidden="true" />
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
