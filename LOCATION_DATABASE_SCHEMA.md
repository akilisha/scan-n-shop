# 🗺️ Location-Based Marketplace Database Schema

## 🚀 **NEW TABLES & EXTENSIONS**

### 1. Products Table Extensions

```sql
-- Add location columns to existing products table
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location_name TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS search_radius INTEGER DEFAULT 10; -- kilometers
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS zip_code TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_pickup_only BOOLEAN DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_delivery_available BOOLEAN DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS delivery_radius INTEGER DEFAULT 5; -- km for delivery
```

### 2. Events Table (NEW)

```sql
-- Create events table for garage sales, markets, auctions
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL CHECK (event_type IN ('garage_sale', 'farmers_market', 'auction', 'estate_sale', 'flea_market', 'pop_up')),
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_name TEXT NOT NULL,
  address TEXT,
  search_radius INTEGER DEFAULT 15, -- km
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- 'weekly', 'monthly', etc.
  max_participants INTEGER,
  entry_fee DECIMAL(8,2) DEFAULT 0,
  contact_phone TEXT,
  contact_email TEXT,
  special_instructions TEXT,
  tags TEXT[], -- searchable tags like 'vintage', 'electronics', 'clothes'
  images TEXT[], -- array of image URLs
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'draft')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events table
CREATE POLICY "Anyone can view active events." ON public.events
  FOR SELECT USING (status = 'active');

CREATE POLICY "Sellers can manage their own events." ON public.events
  FOR ALL USING (auth.uid() = seller_id);
```

### 3. Event Products Junction Table (NEW)

```sql
-- Link products to events
CREATE TABLE IF NOT EXISTS public.event_products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(event_id, product_id)
);

-- Enable RLS
ALTER TABLE public.event_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view event products." ON public.event_products
  FOR SELECT USING (true);

CREATE POLICY "Sellers can manage their event products." ON public.event_products
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = event_id AND e.seller_id = auth.uid()
    )
  );
```

### 4. Location Searches (NEW)

```sql
-- Track popular search locations and user preferences
CREATE TABLE IF NOT EXISTS public.location_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_latitude DECIMAL(10, 8) NOT NULL,
  search_longitude DECIMAL(11, 8) NOT NULL,
  search_radius INTEGER NOT NULL,
  search_query TEXT,
  category TEXT,
  location_name TEXT,
  search_count INTEGER DEFAULT 1,
  last_searched TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.location_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own searches." ON public.location_searches
  FOR ALL USING (auth.uid() = user_id);
```

### 5. Saved Locations (NEW)

```sql
-- User's saved locations (home, work, favorite markets)
CREATE TABLE IF NOT EXISTS public.saved_locations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL, -- 'Home', 'Work', 'Mom\'s House'
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  address TEXT,
  location_type TEXT DEFAULT 'custom' CHECK (location_type IN ('home', 'work', 'custom')),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.saved_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own saved locations." ON public.saved_locations
  FOR ALL USING (auth.uid() = user_id);
```

### 6. Geographic Indexes for Performance

```sql
-- Add indexes for fast geographic queries
CREATE INDEX IF NOT EXISTS idx_products_location ON public.products USING btree (latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_events_location ON public.events USING btree (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_events_date_location ON public.events USING btree (start_date, latitude, longitude) WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_products_category_location ON public.products USING btree (category, latitude, longitude) WHERE latitude IS NOT NULL;
```

### 7. Distance Calculation Function

```sql
-- Function to calculate distance between two points
CREATE OR REPLACE FUNCTION calculate_distance(lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
  earth_radius DECIMAL := 6371; -- Earth's radius in kilometers
  dlat DECIMAL;
  dlon DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  dlat := radians(lat2 - lat1);
  dlon := radians(lon2 - lon1);
  a := sin(dlat/2) * sin(dlat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2) * sin(dlon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN earth_radius * c;
END;
$$ LANGUAGE plpgsql;
```

## 🎯 **QUERY EXAMPLES**

### Find Products Near Location

```sql
-- Find products within radius
SELECT p.*,
       calculate_distance(p.latitude, p.longitude, $1, $2) as distance_km
FROM products p
WHERE p.latitude IS NOT NULL
  AND p.longitude IS NOT NULL
  AND calculate_distance(p.latitude, p.longitude, $1, $2) <= $3
ORDER BY distance_km ASC;
```

### Find Upcoming Events Near Location

```sql
-- Find events happening soon near location
SELECT e.*,
       calculate_distance(e.latitude, e.longitude, $1, $2) as distance_km
FROM events e
WHERE e.status = 'active'
  AND e.start_date >= NOW()
  AND e.start_date <= NOW() + INTERVAL '7 days'
  AND calculate_distance(e.latitude, e.longitude, $1, $2) <= $3
ORDER BY e.start_date ASC, distance_km ASC;
```

## 🔧 **SETUP INSTRUCTIONS**

1. **Run all SQL commands** in your Supabase SQL editor
2. **Verify RLS policies** are enabled
3. **Test distance calculations** with sample data
4. **Create sample events** for testing

This schema enables:

- ✅ **Geotagged Products** - Every item has a location
- ✅ **Event Management** - Garage sales, markets, auctions
- ✅ **Proximity Search** - Find items/events by distance
- ✅ **User Preferences** - Save favorite locations
- ✅ **Performance** - Optimized for geographic queries
- ✅ **Analytics** - Track popular search locations

**Ready for the location revolution!** 🚀🗺️
