import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUserSettings, 
  createUserSettings, 
  updateUserSettings, 
  getOrCreateUserSettings,
  UserSettings 
} from '@/services/database';

export function useUserSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user settings
  const loadSettings = useCallback(async () => {
    if (!user?.id) {
      setSettings(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const userSettings = await getOrCreateUserSettings(user.id);
      setSettings(userSettings);
    } catch (err) {
      console.error('Failed to load user settings:', err);
      setError('Failed to load user settings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update user settings
  const updateSettings = useCallback(async (
    updates: Partial<Pick<UserSettings, 'notifications' | 'privacy' | 'preferences'>>
  ) => {
    if (!user?.id || !settings) return;

    try {
      setError(null);
      const updatedSettings = await updateUserSettings(user.id, updates);
      setSettings(updatedSettings);
      return updatedSettings;
    } catch (err) {
      console.error('Failed to update user settings:', err);
      setError('Failed to update settings');
      throw err;
    }
  }, [user?.id, settings]);

  // Update specific preference
  const updatePreference = useCallback(async (
    key: keyof NonNullable<UserSettings['preferences']>,
    value: any
  ) => {
    if (!settings?.preferences) return;

    const updatedPreferences = {
      ...settings.preferences,
      [key]: value
    };

    return updateSettings({ preferences: updatedPreferences });
  }, [settings, updateSettings]);

  // Update notification setting
  const updateNotification = useCallback(async (
    key: keyof UserSettings['notifications'],
    value: boolean
  ) => {
    if (!settings?.notifications) return;

    const updatedNotifications = {
      ...settings.notifications,
      [key]: value
    };

    return updateSettings({ notifications: updatedNotifications });
  }, [settings, updateSettings]);

  // Update privacy setting
  const updatePrivacy = useCallback(async (
    key: keyof UserSettings['privacy'],
    value: boolean
  ) => {
    if (!settings?.privacy) return;

    const updatedPrivacy = {
      ...settings.privacy,
      [key]: value
    };

    return updateSettings({ privacy: updatedPrivacy });
  }, [settings, updateSettings]);

  // Load settings when user changes
  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    updateSettings,
    updatePreference,
    updateNotification,
    updatePrivacy,
    refetch: loadSettings
  };
}