# 02 数据模型（草案）

## 表：users
- id (pk)
- phone (unique)
- nickname
- role (user/admin)
- status (active/disabled)
- created_at

## 表：participants
- id (pk)
- user_id (fk -> users.id)
- game_name
- need_help_this_week (bool)
- coupons_received (int)
- game_id (string)
- luyện功_mode (int)  # 1=我帮你, 2=自己做
- contact_wechat (string, nullable)
- status (pending/confirmed/disputed)
- created_at
- updated_at

## 表：admin_fields
- id (pk)
- participant_id (fk -> participants.id)
- coupons_given (int)
- card_green (int)
- card_blue (int)
- card_purple (int)
- card_orange (int)
- card_red (int)
- card_gold (int)
- updated_at

## 表：ledger_entries  （流水明细）
- id (pk)
- participant_id (fk -> participants.id)
- type (coupon_in/coupon_out/transfer_in/transfer_out/card_out)
- amount (int, nullable)
- card_type (green/blue/purple/orange/red/gold, nullable)
- card_count (int, nullable)
- note (string, nullable)
- status (pending/confirmed/disputed)
- created_by (fk -> users.id)
- created_at

## 表：audit_logs
- id (pk)
- participant_id (fk)
- admin_id (fk -> users.id)
- action (confirm/reject/unlock/update)
- remark
- created_at

## 表：sms_codes
- id (pk)
- phone
- code
- expires_at
- used_at
- created_at

备注：
- 流水与参与者总表并存：总表用于概览，流水用于对账追溯
