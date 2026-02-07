-- Prize Balance (פדיון), Transaction status (בקשת משיכה), ItemInventory metadata
-- Run: psql $DATABASE_URL -f apps/api/src/db/migrations/013_prize_balance_cashout_live.sql

-- 1. מאזן פדיון — כסף שניתן למשיכה (זכיות + מתנות לייב)
ALTER TABLE users ADD COLUMN IF NOT EXISTS prize_balance DECIMAL(20, 8) NOT NULL DEFAULT 0 CHECK (prize_balance >= 0);
COMMENT ON COLUMN users.prize_balance IS 'מאזן פדיון: זכיות מטורנירים ומתנות מהלייב, ניתן למשיכה';

-- 2. סטטוס טרנזקציה — PENDING (בקשת פדיון), COMPLETED, FAILED
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'COMPLETED';
COMMENT ON COLUMN transactions.status IS 'PENDING | COMPLETED | FAILED — לפדיון נדרש אישור אדמין';

-- 3. הרחבת סוגי טרנזקציה: gift_sent | gift_received | withdrawal
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_type_check;
ALTER TABLE transactions ADD CONSTRAINT transactions_type_check CHECK (
  type IN (
    'purchase', 'win', 'bet', 'fee', 'gift', 'market_sale', 'market_buy',
    'coupon', 'referral', 'referral_commission',
    'escrow_hold', 'escrow_release', 'p2p_transfer', 'oasis_mint', 'oasis_spend',
    'gift_sent', 'gift_received', 'withdrawal'
  )
);

CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- 4. ItemInventory — item_id (dragon_cue | phoenix_board) + metadata (סוג מקל וכו')
ALTER TABLE items_inventory ADD COLUMN IF NOT EXISTS item_id TEXT NOT NULL DEFAULT 'unknown';
UPDATE items_inventory SET item_id = item_type WHERE item_id = 'unknown' AND item_type IS NOT NULL;
COMMENT ON COLUMN items_inventory.item_id IS 'מזהה פריט: dragon_cue | phoenix_board | ...';

ALTER TABLE items_inventory ADD COLUMN IF NOT EXISTS metadata JSONB;
COMMENT ON COLUMN items_inventory.metadata IS 'מטא-דאטה גמישה (למשל: סוג מקל — דרקון, נחש)';
