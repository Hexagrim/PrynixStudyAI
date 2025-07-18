
export type Role = 'user' | 'model';

export interface ChatMessage {
  role: Role;
  text: string;
  image?: string; // base64 encoded image
}
