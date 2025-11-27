export interface NameItem {
  id: string;
  name: string;
  gender?: 'Boy' | 'Girl';
  inspiration?: string;
}

export type BucketType = 'shortlist' | 'maybe' | 'rejected';

export type BabyGender = 'Boy' | 'Girl' | "I don't know yet";

export interface UserPreferences {
  userName?: string;
  partnerName?: string;
  babyGender?: BabyGender;
  birthCountry: string;
  livingCountry: string;
  religion: string;
  tone: string;
  alphabetPreferences: string;
  otherPreferences: string;
  numberOfNamesToGenerate?: number;
}