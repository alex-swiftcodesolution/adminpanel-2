import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const eventMap: { [key: string]: string } = {
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
  unlock: "Unlocked Remotely", // Generic unlock

  // Lock Events
  lock: "Locked",

  // Alarms
  tamper: "Tamper Alarm",
  doorbell: "Doorbell Pressed",
  hijack: "Duress Alarm",
  low_battery: "Low Battery",
  wrong_finger: "Wrong Fingerprint",
  wrong_password: "Wrong Password",
  wrong_card: "Wrong Card",
};
