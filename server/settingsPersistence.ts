import fs from 'fs';
import path from 'path';
import { type SystemSetting } from '@shared/schema';

const SETTINGS_FILE_PATH = path.join(process.cwd(), 'settings.json');

// Interface for the structure of settings data stored in the file
interface PersistedSettings {
  settings: Record<string, SystemSetting>;
  lastUpdated: string;
}

/**
 * Load settings from the persistence file
 * If file doesn't exist, returns an empty object
 */
export function loadSettings(): Record<string, SystemSetting> {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const data = fs.readFileSync(SETTINGS_FILE_PATH, 'utf8');
      const persistedData: PersistedSettings = JSON.parse(data);
      return persistedData.settings;
    }
  } catch (error) {
    console.error('Failed to load settings from file:', error);
  }
  
  return {};
}

/**
 * Save settings to the persistence file
 */
export function saveSettings(settings: Record<string, SystemSetting>): void {
  try {
    const persistedData: PersistedSettings = {
      settings,
      lastUpdated: new Date().toISOString()
    };
    
    fs.writeFileSync(
      SETTINGS_FILE_PATH,
      JSON.stringify(persistedData, null, 2),
      'utf8'
    );
    
    console.log('Settings successfully saved to file');
  } catch (error) {
    console.error('Failed to save settings to file:', error);
  }
}

/**
 * Save a single setting to the persistence file
 * This loads existing settings first, then updates just the one key
 */
export function saveSetting(key: string, setting: SystemSetting): void {
  try {
    const existingSettings = loadSettings();
    existingSettings[key] = setting;
    saveSettings(existingSettings);
  } catch (error) {
    console.error(`Failed to save setting ${key} to file:`, error);
  }
}

/**
 * Delete a setting from the persistence file
 * This loads existing settings first, then removes the specified key
 */
export function deleteSetting(key: string): void {
  try {
    const existingSettings = loadSettings();
    if (existingSettings[key]) {
      delete existingSettings[key];
      saveSettings(existingSettings);
      console.log(`Setting ${key} successfully deleted from file`);
    }
  } catch (error) {
    console.error(`Failed to delete setting ${key} from file:`, error);
  }
}