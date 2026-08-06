import { SearchIcon, PanelLeft } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../features/themeSlice";
import { MoonIcon, SunIcon } from "lucide-react";
import { UserButton } from "@clerk/react";
import viora_logo from "../assets/viora_logo.png";

const Navbar = ({ setIsSidebarOpen }) => {
  const dispatch = useDispatch();
  const { theme } = useSelector((state) => state.theme);

  return (
    <div
      className="
    sticky top-0 z-50
    w-full flex-shrink-0
    border-b border-zinc-200/60 dark:border-zinc-800
    bg-white/80 dark:bg-zinc-900/80
    backdrop-blur-xl
    px-4 sm:px-6 lg:px-10
    py-3
  "
    >
      <div className="flex items-center justify-between w-full">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Sidebar */}
          <button
            onClick={() => setIsSidebarOpen((prev) => !prev)}
            className="sm:hidden p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <PanelLeft className="size-5 text-zinc-700 dark:text-zinc-200" />
          </button>

          {/* Logo */}
          <div className="h-14 w-14 shrink-0">
            <img
              src={viora_logo}
              alt="VIORA Logo"
              className="h-full w-full object-contain"
            />
          </div>

          {/* Brand */}
          <div className="leading-tight min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white truncate">
              VIORA
            </h1>

            <p className="hidden sm:block text-xs text-zinc-500 dark:text-zinc-400 truncate">
              Smart Project Management
            </p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => dispatch(toggleTheme())}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 bg-white transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            {theme === "light" ? (
              <MoonIcon className="size-4 text-zinc-800" />
            ) : (
              <SunIcon className="size-4 text-yellow-400" />
            )}
          </button>

          <UserButton />
        </div>
      </div>
    </div>
  );
};

export default Navbar;
