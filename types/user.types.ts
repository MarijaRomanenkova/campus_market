import { User } from './chat/message.types';

export interface UserWithRating extends User {
  sellerRating?: number | null;
  clientRating?: number | null;
} 
