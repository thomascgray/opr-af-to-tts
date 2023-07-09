import useLocalStorageState from "use-local-storage-state";
import { Moon, Sun } from "./icons";
export const DarkModeSwitch = () => {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState<any>(
    "tombolaopraftotts_isDarkMode",
    {
      defaultValue: false,
    }
  );

  return (
    <div className="dark:text-white">
      {isDarkMode && (
        <button
          title="Switch app theme to Light mode"
          onClick={() => {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
          }}
        >
          <Sun />
        </button>
      )}
      {!isDarkMode && (
        <button
          title="Switch app theme to Dark mode"
          onClick={() => {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
          }}
        >
          <Moon />
        </button>
      )}
    </div>
  );
};
