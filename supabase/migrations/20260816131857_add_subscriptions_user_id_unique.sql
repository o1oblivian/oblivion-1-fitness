-- Add unique constraint on subscriptions.user_id for upsert support
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_unique UNIQUE (user_id);
