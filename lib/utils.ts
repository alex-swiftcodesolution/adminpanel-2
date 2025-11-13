import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const eventMap: Record<string, string> = {
  // Unlock Events
  unlock_fingerprint: "Unlocked with Fingerprint",
  unlock_password: "Unlocked with Password",
  unlock_temporary: "Unlocked with Temp. Password",
  unlock_dynamic: "Unlocked with Dynamic Password",
  unlock_card: "Unlocked with Card",
  unlock_face: "Unlocked with Face",
  unlock_key: "Unlocked with Mechanical Key",
  unlock_identity_card: "Unlocked with ID Card",
  unlock_emergency: "Unlocked with Emergency Code",
  unlock: "Unlocked Remotely",

  // Lock Events
  lock: "Locked",

  // ALARMS – MATCH TUYA v1.1 EXACTLY
  alarm_lock: "Lock Alarm",
  alarm_battery_low: "Battery Low",
  alarm_tamper: "Tamper Detected",
  alarm_duress: "Duress Alarm",
  alarm_break_in: "Break-in Detected",
  alarm_vibration: "Vibration Detected",
  alarm_door_open: "Door Left Open",

  // Legacy fallback
  tamper: "Tamper Alarm",
  hijack: "Duress Alarm",
  low_battery: "Low Battery",

  doorbell: "Doorbell Pressed",

  wrong_password: "Wrong Password",

  unlock_success: "Unlocked",
  unlock_failed: "Failed",
};

export const phaseMap: Record<string, string> = {
  "1": "Pending",
  "2": "Active",
  "3": "Frozen",
  "4": "Deleted",
  "5": "Failed",
  "0": "Deleted",
  "7": "Failed",
};
