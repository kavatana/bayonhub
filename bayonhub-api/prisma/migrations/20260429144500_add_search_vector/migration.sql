-- Add tsvector search column
ALTER TABLE "Listing" ADD COLUMN IF NOT EXISTS search_vector tsvector
GENERATED ALWAYS AS (
  to_tsvector('english',
    coalesce(title,'') || ' ' ||
    coalesce("titleKm",'') || ' ' ||
    coalesce(description,'') || ' ' ||
    coalesce("categorySlug",'') || ' ' ||
    coalesce(province,'') || ' ' ||
    coalesce(district,'')
  )
) STORED;

CREATE INDEX IF NOT EXISTS listing_search_idx ON "Listing" USING GIN(search_vector);
