-- Append 4 additional copies (batches) of existing demo packages to reach 500 total.
-- Run AFTER initial seed.sql. Each batch adds suffix -c1 .. -c4 ensuring unique IDs & slugs.
-- If needed fewer batches, remove corresponding sections.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
-- Do NOT truncate here; this appends.
SET FOREIGN_KEY_CHECKS=1;

-- Helper: duplicate packages per batch
-- Batch 1
INSERT INTO packages(
  id,title,title_zh,slug,description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,created_at,updated_at
)
SELECT 
  CONCAT(id,'-c1'), title,title_zh, CONCAT(slug,'-c1'), description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,NOW(),NOW()
FROM packages p WHERE p.id LIKE 'pkg-demo-%';

INSERT INTO package_images(id,package_id,url,alt,`order`,is_cover,created_at,updated_at)
SELECT CONCAT(id,'-c1'), CONCAT(package_id,'-c1'), url, CONCAT(alt,' Copy1'), `order`, is_cover, NOW(), NOW()
FROM package_images WHERE package_id LIKE 'pkg-demo-%';

-- Batch 2
INSERT INTO packages(
  id,title,title_zh,slug,description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,created_at,updated_at
)
SELECT 
  CONCAT(id,'-c2'), title,title_zh, CONCAT(slug,'-c2'), description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,NOW(),NOW()
FROM packages p WHERE p.id LIKE 'pkg-demo-%';

INSERT INTO package_images(id,package_id,url,alt,`order`,is_cover,created_at,updated_at)
SELECT CONCAT(id,'-c2'), CONCAT(package_id,'-c2'), url, CONCAT(alt,' Copy2'), `order`, is_cover, NOW(), NOW()
FROM package_images WHERE package_id LIKE 'pkg-demo-%';

-- Batch 3
INSERT INTO packages(
  id,title,title_zh,slug,description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,created_at,updated_at
)
SELECT 
  CONCAT(id,'-c3'), title,title_zh, CONCAT(slug,'-c3'), description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,NOW(),NOW()
FROM packages p WHERE p.id LIKE 'pkg-demo-%';

INSERT INTO package_images(id,package_id,url,alt,`order`,is_cover,created_at,updated_at)
SELECT CONCAT(id,'-c3'), CONCAT(package_id,'-c3'), url, CONCAT(alt,' Copy3'), `order`, is_cover, NOW(), NOW()
FROM package_images WHERE package_id LIKE 'pkg-demo-%';

-- Batch 4
INSERT INTO packages(
  id,title,title_zh,slug,description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,created_at,updated_at
)
SELECT 
  CONCAT(id,'-c4'), title,title_zh, CONCAT(slug,'-c4'), description,description_zh,short_description,short_description_zh,price,currency,duration,duration_unit,categories,categories_zh,destination,destination_zh,included,included_zh,excluded,excluded_zh,highlights,highlights_zh,availability,availability_zh,max_participants,featured,status,view_count,inquiry_count,NOW(),NOW()
FROM packages p WHERE p.id LIKE 'pkg-demo-%';

INSERT INTO package_images(id,package_id,url,alt,`order`,is_cover,created_at,updated_at)
SELECT CONCAT(id,'-c4'), CONCAT(package_id,'-c4'), url, CONCAT(alt,' Copy4'), `order`, is_cover, NOW(), NOW()
FROM package_images WHERE package_id LIKE 'pkg-demo-%';

-- Verification queries (optional):
-- SELECT COUNT(*) FROM packages; -- Expect 500 after running this (100 * 5)
-- SELECT package_id, COUNT(*) imgs FROM package_images GROUP BY package_id LIMIT 5;
