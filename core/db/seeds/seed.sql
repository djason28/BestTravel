SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE TABLE `itinerary_items`;
TRUNCATE TABLE `package_images`;
TRUNCATE TABLE `packages`;
SET FOREIGN_KEY_CHECKS=1;

INSERT INTO `packages`(
  `id`,`title`,`title_zh`,`slug`,`description`,`description_zh`,`short_description`,`short_description_zh`,`price`,`currency`,`duration`,`duration_unit`,`categories`,`categories_zh`,`destination`,`destination_zh`,`included`,`included_zh`,`excluded`,`excluded_zh`,`highlights`,`highlights_zh`,`availability`,`availability_zh`,`max_participants`,`featured`,`status`,`view_count`,`inquiry_count`,`created_at`,`updated_at`
)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL SELECT n+1 FROM seq WHERE n < 100
)
SELECT 
  CONCAT('pkg-demo-', LPAD(n,4,'0')),
  CONCAT('Demo Package ', LPAD(n,3,'0')),
  CONCAT('示例套餐 ', LPAD(n,3,'0')),
  CONCAT('demo-package-', n),
  CONCAT('This is demo package ', n, ' for bulk testing with image slider.'),
  CONCAT('这是用于批量测试和图片滑块的示例套餐 ', n, '。'),
  'Short demo description',
  '简短示例描述',
  1000000 + n*5000,
  'IDR',
  (n % 7) + 2,
  'days',
  '["demo","test"]',
  '["示例","测试"]',
  CASE n % 10
    WHEN 0 THEN 'bali'
    WHEN 1 THEN 'lombok'
    WHEN 2 THEN 'yogyakarta'
    WHEN 3 THEN 'komodo'
    WHEN 4 THEN 'jakarta'
    WHEN 5 THEN 'bandung'
    WHEN 6 THEN 'bromo'
    WHEN 7 THEN 'raja-ampat'
    WHEN 8 THEN 'sumba'
    ELSE 'belitung' END,
  CASE n % 10
    WHEN 0 THEN '巴厘岛'
    WHEN 1 THEN '龙目岛'
    WHEN 2 THEN '日惹'
    WHEN 3 THEN '科莫多'
    WHEN 4 THEN '雅加达'
    WHEN 5 THEN '万隆'
    WHEN 6 THEN '布罗莫'
    WHEN 7 THEN '四王群岛'
    WHEN 8 THEN '松巴'
    ELSE '勿里洞' END,
  '["hotel","breakfast"]',
  '["酒店","早餐"]',
  '["flights"]',
  '["机票"]',
  '["highlight-a","highlight-b"]',
  '["亮点A","亮点B"]',
  'year-round',
  '全年可订',
  20 + (n % 10),
  CASE WHEN n % 5 = 0 THEN 1 ELSE 0 END,
  'published',
  0,0,NOW(),NOW()
FROM seq;

INSERT INTO `package_images`(`id`,`package_id`,`url`,`alt`,`order`,`is_cover`,`created_at`,`updated_at`)
WITH RECURSIVE seq AS (
  SELECT 1 AS n UNION ALL SELECT n+1 FROM seq WHERE n < 100
), imgix AS (
  SELECT 1 AS i UNION ALL SELECT i+1 FROM imgix WHERE i < 3
)
SELECT 
  CONCAT('img-demo-', LPAD(seq.n,4,'0'), '-', i),
  CONCAT('pkg-demo-', LPAD(seq.n,4,'0')),
  CASE i
    WHEN 1 THEN 'https://images.pexels.com/photos/346885/pexels-photo-346885.jpeg'
    WHEN 2 THEN 'https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg'
    ELSE 'https://images.pexels.com/photos/2404370/pexels-photo-2404370.jpeg' END,
  CONCAT('Demo Package ', LPAD(seq.n,3,'0'), ' Image ', i),
  i,
  CASE WHEN i=1 THEN 1 ELSE 0 END,
  NOW(),NOW()
FROM seq CROSS JOIN imgix;

-- No itinerary for bulk test; slider & pagination only.
-- After seeding run: SELECT COUNT(*) FROM packages; should be 100.
