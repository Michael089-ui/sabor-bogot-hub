import { useState, useEffect } from 'react';

export interface UserSettings {
  showPrices: boolean;
  searchRadius: number;
  distanceUnit: 'km' | 'mi';
  shareLocation: boolean;
  saveHistory: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  showPrices: true,
  searchRadius: 2000,
  distanceUnit: 'km',
  shareLocation: true,
  saveHistory: true,
  pushNotifications: false,
  emailNotifications: false,
};

const STORAGE_KEY = 'sabor-capital-settings';

export const useSettings = () => {
  const [settings, setSettings] = useState<UserSettings>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_SETTINGS;
      }
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    settings,
    updateSettings,
    resetSettings,
  };
};
