-- Создание таблицы для хранения настроек системы
CREATE TABLE IF NOT EXISTS app_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индекса для быстрого поиска по ключу
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(key);

-- Вставка начальной настройки стоимости бронирования (по умолчанию 0)
INSERT INTO app_settings (key, value, description) VALUES
('booking_cost_rub', '0', 'Стоимость бронирования велосипеда в рублях')
ON CONFLICT (key) DO NOTHING;

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();