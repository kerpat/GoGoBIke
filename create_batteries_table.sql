-- Create batteries table for GoGoBike system
CREATE TABLE IF NOT EXISTS batteries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    power VARCHAR(100), -- e.g., "500W", "750W"
    description TEXT,
    status VARCHAR(50) DEFAULT 'available', -- available, assigned, maintenance
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add battery_id column to rentals table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'rentals' AND column_name = 'battery_id') THEN
        ALTER TABLE rentals ADD COLUMN battery_id INTEGER REFERENCES batteries(id);
    END IF;
END $$;

-- Add RLS (Row Level Security) policies if needed
ALTER TABLE batteries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read batteries
CREATE POLICY "Allow authenticated users to read batteries" ON batteries
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow authenticated users to insert batteries
CREATE POLICY "Allow authenticated users to insert batteries" ON batteries
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update batteries
CREATE POLICY "Allow authenticated users to update batteries" ON batteries
    FOR UPDATE USING (auth.role() = 'authenticated');

-- Allow authenticated users to delete batteries
CREATE POLICY "Allow authenticated users to delete batteries" ON batteries
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_batteries_status ON batteries(status);
CREATE INDEX IF NOT EXISTS idx_batteries_name ON batteries(name);