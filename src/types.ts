export interface User {
  _id?: string;
  paid?: boolean;
  username?: string; 
  email?: string; 
  phone?: number;
  order?: Order 
}

export interface Order {
  cards: string[]
  created_at: Date
}
