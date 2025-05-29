import axios from "@/lib/axios";
import { createContext, ReactNode, useEffect, useState } from "react";

export type Settings = Array<{
  _id: string;
  name: string;
  value: string;
}>;

interface SettingsContextType {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      const res = await axios.get<Settings>("/api/setting");
      setSettings(res.data);
    } catch (err) {
      console.error("Error fetching settings:", err);
      setError("Failed to fetch settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        loading,
        error,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
