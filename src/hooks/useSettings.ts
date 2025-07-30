import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserSettings, createUserSettings, updateUserSettings, UserSettings } from '@/services/database';

interface NotificationSettings {
  workoutReminders: boolean;
  progressUpdates: boolean;
  aiInsights: boolean;
  weeklyReports: boolean;
}

interface PrivacySettings {
  shareProgress: boolean;
  publicProfile: boolean;
  analyticsData: boolean;
}

interface UseSettingsReturn {
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  loading: boolean;
  error: string | null;
  updateNotification: (key: keyof NotificationSettings, value: boolean) => Promise<void>;
  updatePrivacy: (key: keyof PrivacySettings, value: boolean) => Promise<void>;
  refetch: () => Promise<void>;
}

// Default settings for fallback
const defaultNotifications: NotificationSettings = {
  workoutReminders: true,
  progressUpdates: true,
  aiInsights: true,
  weeklyReports: true
};

const defaultPrivacy: PrivacySettings = {
  shareProgress: false,
  publicProfile: false,
  analyticsData: true
};

export function useSettings(): UseSettingsReturn {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadSettings();
    } else {
      setSettings(null);
      setLoading(false);
    }
  }, [user]);

  const loadSettings = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Try to load from database first
      let userSettings = await getUserSettings(user.id);

      // If no settings exist, try to create default ones
      if (!userSettings) {
        try {
          userSettings = await createUserSettings(user.id);
        } catch (createError) {
          console.warn('Could not create user settings in database, using localStorage fallback:', createError);
          // Fall back to localStorage if table doesn't exist
          userSettings = loadFromLocalStorage();
        }
      }

      setSettings(userSettings);
    } catch (err) {
      console.error('Error loading settings from database, falling back to localStorage:', err);
      
      // Fall back to localStorage
      const localSettings = loadFromLocalStorage();
      setSettings(localSettings);
    } finally {
      setLoading(false);
    }
  };

  const loadFromLocalStorage = (): UserSettings => {
    const stored = localStorage.getItem(`user_settings_${user?.id}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return {
          id: 'local',
          user_id: user?.id || '',
          notifications: { ...defaultNotifications, ...parsed.notifications },
          privacy: { ...defaultPrivacy, ...parsed.privacy },
          created_at: parsed.created_at || new Date().toISOString(),
          updated_at: parsed.updated_at || new Date().toISOString()
        };
      } catch (e) {
        console.error('Error parsing stored settings:', e);
      }
    }
    
    return {
      id: 'local',
      user_id: user?.id || '',
      notifications: defaultNotifications,
      privacy: defaultPrivacy,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  };

  const saveToLocalStorage = (updatedSettings: UserSettings) => {
    if (!user) return;
    localStorage.setItem(`user_settings_${user.id}`, JSON.stringify({
      notifications: updatedSettings.notifications,
      privacy: updatedSettings.privacy,
      created_at: updatedSettings.created_at,
      updated_at: new Date().toISOString()
    }));
  };

  const updateNotification = async (key: keyof NotificationSettings, value: boolean) => {
    if (!user || !settings) return;

    try {
      const updatedNotifications = {
        ...settings.notifications,
        [key]: value
      };

      const updatedSettings = {
        ...settings,
        notifications: updatedNotifications,
        updated_at: new Date().toISOString()
      };

      // Optimistically update local state
      setSettings(updatedSettings);

      // Try to update in database first
      if (settings.id !== 'local') {
        try {
          await updateUserSettings(user.id, {
            notifications: updatedNotifications
          });
        } catch (dbError) {
          console.warn('Database update failed, saving to localStorage:', dbError);
          saveToLocalStorage(updatedSettings);
        }
      } else {
        // Save to localStorage for local settings
        saveToLocalStorage(updatedSettings);
      }
    } catch (err) {
      console.error('Error updating notification setting:', err);
      // Revert optimistic update on failure
      await loadSettings();
      throw err;
    }
  };

  const updatePrivacy = async (key: keyof PrivacySettings, value: boolean) => {
    if (!user || !settings) return;

    try {
      const updatedPrivacy = {
        ...settings.privacy,
        [key]: value
      };

      const updatedSettings = {
        ...settings,
        privacy: updatedPrivacy,
        updated_at: new Date().toISOString()
      };

      // Optimistically update local state
      setSettings(updatedSettings);

      // Try to update in database first
      if (settings.id !== 'local') {
        try {
          await updateUserSettings(user.id, {
            privacy: updatedPrivacy
          });
        } catch (dbError) {
          console.warn('Database update failed, saving to localStorage:', dbError);
          saveToLocalStorage(updatedSettings);
        }
      } else {
        // Save to localStorage for local settings
        saveToLocalStorage(updatedSettings);
      }
    } catch (err) {
      console.error('Error updating privacy setting:', err);
      // Revert optimistic update on failure
      await loadSettings();
      throw err;
    }
  };

  return {
    notifications: settings?.notifications || defaultNotifications,
    privacy: settings?.privacy || defaultPrivacy,
    loading,
    error,
    updateNotification,
    updatePrivacy,
    refetch: loadSettings
  };
}