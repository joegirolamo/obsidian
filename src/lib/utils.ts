import { customAlphabet } from 'nanoid';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Create a custom nanoid generator with only uppercase letters and numbers
const generateId = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ', 8);

export function generateAccessCode(): string {
  return generateId();
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
} 