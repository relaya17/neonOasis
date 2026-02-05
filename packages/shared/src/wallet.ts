/** Wallet, transactions, marketplace — single source of truth */

export type TransactionType =
  | 'purchase'
  | 'win'
  | 'bet'
  | 'fee'
  | 'gift'
  | 'market_sale'
  | 'market_buy'
  | 'escrow_hold'
  | 'escrow_release'
  | 'p2p_transfer'
  | 'oasis_mint'
  | 'oasis_spend';

export interface Transaction {
  id: string;
  user_id: string;
  amount: string;
  type: TransactionType;
  reference_id?: string;
  created_at: string;
}

export type ItemRarity = 'Common' | 'Rare' | 'Legendary';

export interface ItemInInventory {
  id: string;
  owner_id: string;
  item_type: string;
  rarity: ItemRarity;
  is_for_sale: boolean;
  price: string | null;
  created_at: string;
}

export interface UserWallet {
  id: string;
  username: string;
  avatar_id: string;
  is_verified: boolean;
  balance: string;
  level: number;
}
