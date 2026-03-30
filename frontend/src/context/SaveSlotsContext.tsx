/**
 * Save Slots Context
 * Manages local save slots for offline gameplay
 * 
 * Features:
 * - 3 free slots (expandable to 10 with upgrade)
 * - Each slot stores a complete game save
 * - All data persisted to AsyncStorage
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVE_SLOTS_KEY = 'retro_fc_save_slots';
const SLOTS_CONFIG_KEY = 'retro_fc_slots_config';
const MAX_FREE_SLOTS = 3;
const MAX_PAID_SLOTS = 10;

export interface SaveSlotMeta {
  slotId: number;
  isEmpty: boolean;
  saveName: string | null;
  teamName: string | null;
  teamId: string | null;
  season: number | null;
  currentWeek: number | null;
  leaguePosition: number | null;
  lastSaved: string | null;  // ISO date string
  currencySymbol: string;
}

export interface SlotsConfig {
  totalSlots: number;       // 3 (free) or up to 10 (paid)
  hasPremium: boolean;      // Has purchased additional slots
}

interface SaveSlotsContextType {
  slots: SaveSlotMeta[];
  config: SlotsConfig;
  isLoading: boolean;
  activeSlotId: number | null;
  
  // Actions
  loadSlotData: (slotId: number) => Promise<any | null>;
  saveToSlot: (slotId: number, saveData: any) => Promise<boolean>;
  deleteSlot: (slotId: number) => Promise<boolean>;
  clearAllSlots: () => Promise<boolean>;
  setActiveSlot: (slotId: number | null) => void;
  refreshSlots: () => Promise<void>;
  
  // Future: Premium upgrade
  upgradeToPremium: () => Promise<boolean>;
}

const SaveSlotsContext = createContext<SaveSlotsContextType | undefined>(undefined);

/**
 * Create empty slot metadata
 */
function createEmptySlot(slotId: number): SaveSlotMeta {
  return {
    slotId,
    isEmpty: true,
    saveName: null,
    teamName: null,
    teamId: null,
    season: null,
    currentWeek: null,
    leaguePosition: null,
    lastSaved: null,
    currencySymbol: '£',
  };
}

/**
 * Extract metadata from a full save object
 */
function extractSlotMeta(slotId: number, saveData: any): SaveSlotMeta {
  if (!saveData) return createEmptySlot(slotId);
  
  // Calculate league position
  let leaguePosition: number | null = null;
  if (saveData.leagues && saveData.leagues[0]?.table) {
    const sortedTable = [...saveData.leagues[0].table].sort((a: any, b: any) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_difference !== a.goal_difference) return b.goal_difference - a.goal_difference;
      return b.goals_for - a.goals_for;
    });
    const idx = sortedTable.findIndex((t: any) => t.team_id === saveData.managed_team_id);
    leaguePosition = idx >= 0 ? idx + 1 : null;
  }
  
  return {
    slotId,
    isEmpty: false,
    saveName: saveData.name || `Save ${slotId}`,
    teamName: saveData.managed_team_name || null,
    teamId: saveData.managed_team_id || null,
    season: saveData.season || null,
    currentWeek: saveData.leagues?.[0]?.current_week ?? null,
    leaguePosition,
    lastSaved: saveData.updated_at || saveData.created_at || null,
    currencySymbol: saveData.currency_symbol || '£',
  };
}

export function SaveSlotsProvider({ children }: { children: ReactNode }) {
  const [slots, setSlots] = useState<SaveSlotMeta[]>([]);
  const [config, setConfig] = useState<SlotsConfig>({ totalSlots: MAX_FREE_SLOTS, hasPremium: false });
  const [isLoading, setIsLoading] = useState(true);
  const [activeSlotId, setActiveSlotId] = useState<number | null>(null);

  // Initialize slots on mount
  useEffect(() => {
    initializeSlots();
  }, []);

  /**
   * Initialize slot system from storage
   */
  const initializeSlots = async () => {
    try {
      setIsLoading(true);
      
      // Load config
      const configJson = await AsyncStorage.getItem(SLOTS_CONFIG_KEY);
      const loadedConfig: SlotsConfig = configJson 
        ? JSON.parse(configJson) 
        : { totalSlots: MAX_FREE_SLOTS, hasPremium: false };
      setConfig(loadedConfig);
      
      // Load slot metadata
      const slotsJson = await AsyncStorage.getItem(SAVE_SLOTS_KEY);
      let loadedSlots: SaveSlotMeta[] = slotsJson ? JSON.parse(slotsJson) : [];
      
      // Ensure we have the correct number of slots
      const targetSlotCount = loadedConfig.totalSlots;
      if (loadedSlots.length < targetSlotCount) {
        // Add missing empty slots
        for (let i = loadedSlots.length; i < targetSlotCount; i++) {
          loadedSlots.push(createEmptySlot(i + 1));
        }
      } else if (loadedSlots.length > targetSlotCount) {
        // Trim excess (only if downgrading, which shouldn't happen)
        loadedSlots = loadedSlots.slice(0, targetSlotCount);
      }
      
      // Ensure slot IDs are correct
      loadedSlots = loadedSlots.map((slot, idx) => ({ ...slot, slotId: idx + 1 }));
      
      setSlots(loadedSlots);
    } catch (error) {
      console.error('Failed to initialize save slots:', error);
      // Create default empty slots on error
      const defaultSlots = Array.from({ length: MAX_FREE_SLOTS }, (_, i) => createEmptySlot(i + 1));
      setSlots(defaultSlots);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Refresh slots metadata from storage
   */
  const refreshSlots = async () => {
    await initializeSlots();
  };

  /**
   * Load full save data from a slot
   */
  const loadSlotData = async (slotId: number): Promise<any | null> => {
    try {
      const key = `${SAVE_SLOTS_KEY}_slot_${slotId}`;
      const dataJson = await AsyncStorage.getItem(key);
      return dataJson ? JSON.parse(dataJson) : null;
    } catch (error) {
      console.error(`Failed to load slot ${slotId}:`, error);
      return null;
    }
  };

  /**
   * Save game data to a slot
   */
  const saveToSlot = async (slotId: number, saveData: any): Promise<boolean> => {
    try {
      // Validate slot ID
      if (slotId < 1 || slotId > config.totalSlots) {
        console.error(`Invalid slot ID: ${slotId}`);
        return false;
      }
      
      // Add timestamp
      const dataWithTimestamp = {
        ...saveData,
        updated_at: new Date().toISOString(),
      };
      
      // Save full data
      const key = `${SAVE_SLOTS_KEY}_slot_${slotId}`;
      await AsyncStorage.setItem(key, JSON.stringify(dataWithTimestamp));
      
      // Update slot metadata
      const newMeta = extractSlotMeta(slotId, dataWithTimestamp);
      const newSlots = slots.map(slot => 
        slot.slotId === slotId ? newMeta : slot
      );
      
      setSlots(newSlots);
      await AsyncStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
      
      return true;
    } catch (error) {
      console.error(`Failed to save to slot ${slotId}:`, error);
      return false;
    }
  };

  /**
   * Delete a slot's save data
   */
  const deleteSlot = async (slotId: number): Promise<boolean> => {
    try {
      // Remove full save data
      const key = `${SAVE_SLOTS_KEY}_slot_${slotId}`;
      await AsyncStorage.removeItem(key);
      
      // Update slot metadata to empty
      const newSlots = slots.map(slot => 
        slot.slotId === slotId ? createEmptySlot(slotId) : slot
      );
      
      setSlots(newSlots);
      await AsyncStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
      
      // Clear active slot if it was deleted
      if (activeSlotId === slotId) {
        setActiveSlotId(null);
      }
      
      return true;
    } catch (error) {
      console.error(`Failed to delete slot ${slotId}:`, error);
      return false;
    }
  };

  /**
   * Clear all save slots
   */
  const clearAllSlots = async (): Promise<boolean> => {
    try {
      // Remove all slot data
      for (let i = 1; i <= config.totalSlots; i++) {
        const key = `${SAVE_SLOTS_KEY}_slot_${i}`;
        await AsyncStorage.removeItem(key);
      }
      
      // Reset all slots to empty
      const newSlots = slots.map(slot => createEmptySlot(slot.slotId));
      setSlots(newSlots);
      await AsyncStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
      
      // Clear active slot
      setActiveSlotId(null);
      
      return true;
    } catch (error) {
      console.error('Failed to clear all slots:', error);
      return false;
    }
  };

  /**
   * Set the currently active slot
   */
  const setActiveSlot = (slotId: number | null) => {
    setActiveSlotId(slotId);
  };

  /**
   * Upgrade to premium (unlock more slots)
   * In a real app, this would integrate with IAP
   */
  const upgradeToPremium = async (): Promise<boolean> => {
    try {
      const newConfig: SlotsConfig = {
        totalSlots: MAX_PAID_SLOTS,
        hasPremium: true,
      };
      
      await AsyncStorage.setItem(SLOTS_CONFIG_KEY, JSON.stringify(newConfig));
      setConfig(newConfig);
      
      // Add new empty slots
      const newSlots = [...slots];
      for (let i = slots.length; i < MAX_PAID_SLOTS; i++) {
        newSlots.push(createEmptySlot(i + 1));
      }
      
      setSlots(newSlots);
      await AsyncStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(newSlots));
      
      return true;
    } catch (error) {
      console.error('Failed to upgrade to premium:', error);
      return false;
    }
  };

  return (
    <SaveSlotsContext.Provider
      value={{
        slots,
        config,
        isLoading,
        activeSlotId,
        loadSlotData,
        saveToSlot,
        deleteSlot,
        clearAllSlots,
        setActiveSlot,
        refreshSlots,
        upgradeToPremium,
      }}
    >
      {children}
    </SaveSlotsContext.Provider>
  );
}

export function useSaveSlots() {
  const context = useContext(SaveSlotsContext);
  if (context === undefined) {
    throw new Error('useSaveSlots must be used within a SaveSlotsProvider');
  }
  return context;
}
