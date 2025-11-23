-- BestTravel seed (MySQL) - 20 demo packages with images and itinerary
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

-- Clean tables
TRUNCATE TABLE `itinerary_items`;
TRUNCATE TABLE `package_images`;
TRUNCATE TABLE `packages`;

SET FOREIGN_KEY_CHECKS=1;

-- Base timestamps
SET @now = NOW();

-- Insert 20 packages
INSERT INTO `packages`
  (`id`,`title`,`title_zh`,`slug`,`description`,`description_zh`,`short_description`,`short_description_zh`,`price`,`currency`,`duration`,`duration_unit`,`categories`,`categories_zh`,`destination`,`destination_zh`,`included`,`included_zh`,`excluded`,`excluded_zh`,`highlights`,`highlights_zh`,`availability`,`availability_zh`,`max_participants`,`featured`,`status`,`view_count`,`inquiry_count`,`created_at`,`updated_at`)
VALUES
  ("pkg-0001","Bali Getaway 3D2N","巴厘岛 3 天 2 夜之旅","bali-getaway-3d2n","Relax in Bali's beaches and culture.","在巴厘岛海滩与文化中放松。","A short, sweet Bali escape.","短暂而惬意的巴厘度假",3500000,'IDR',3,'days','["beach","relax","culture"]','["海滩","休闲","文化"]','bali','巴厘岛','["hotel","breakfast"]','["酒店","早餐"]','["flights"]','["机票"]','["sunset","temple","spa"]','["日落","庙宇","水疗"]','year-round','全年可订',20,1,'published',10,1,@now,@now),
  ("pkg-0002","Yogyakarta Heritage","日惹文化遗产之旅","yogyakarta-heritage","Discover temples and cuisine.","探索寺庙与美食。","Culture trip in Jogja.","日惹文化体验",2500000,'IDR',2,'days','["culture","city"]','["文化","城市"]','yogyakarta','日惹','["hotel","guide"]','["酒店","导游"]','["flights"]','["机票"]','["borobudur","prambanan"]','["婆罗浮屠","普兰巴南"]','year-round','全年可订',15,0,'published',5,0,@now,@now),
  ("pkg-0003","Lombok Adventure 4D3N","龙目岛 4 天冒险","lombok-adventure-4d3n","Explore Lombok's beaches and waterfalls.","探索龙目岛海滩与瀑布。","Adventure in Lombok.","龙目岛冒险",4200000,'IDR',4,'days','["adventure","beach"]','["冒险","海滩"]','lombok','龙目岛','["hotel","breakfast","tour"]','["酒店","早餐","行程"]','["flights"]','["机票"]','["waterfall","snorkeling"]','["瀑布","浮潜"]','seasonal','季节性',18,1,'published',0,0,@now,@now),
  ("pkg-0004","Komodo Explorer","科莫多探险之旅","komodo-explorer","Sail to Komodo and pink beach.","航行至科莫多与粉色沙滩。","Liveaboard to Komodo.","科莫多船宿",7500000,'IDR',3,'days','["adventure","wildlife"]','["冒险","野生动物"]','labuan-bajo','拉布安巴焦','["boat","meals","guide"]','["船只","餐食","导游"]','["flights"]','["机票"]','["dragon","snorkel"]','["巨蜥","浮潜"]','seasonal','季节性',12,0,'published',0,0,@now,@now),
  ("pkg-0005","Jakarta City Break","雅加达城市休闲","jakarta-city-break","Weekend city highlights.","周末城市亮点游。","Jakarta quick break.","雅加达速享行",1500000,'IDR',2,'days','["city","food"]','["城市","美食"]','jakarta','雅加达','["hotel"]','["酒店"]','["flights"]','["机票"]','["old-town","street-food"]','["老城区","街头美食"]','weekend-only','仅周末',25,0,'published',0,0,@now,@now),
  ("pkg-0006","Bandung Family Fun","万隆亲子乐游","bandung-family-fun","Cool weather and family attractions.","清凉气候与亲子景点。","Bandung for families.","万隆亲子行",2200000,'IDR',3,'days','["family","nature"]','["家庭","自然"]','bandung','万隆','["hotel","breakfast"]','["酒店","早餐"]','["flights"]','["机票"]','["farm","tea-hills"]','["农场","茶园"]','year-round','全年可订',30,0,'published',0,0,@now,@now),
  ("pkg-0007","Bromo Sunrise","布罗莫日出之旅","bromo-sunrise","Classic Bromo sunrise trip.","经典布罗莫日出行程。","See Bromo sunrise.","观赏布罗莫日出",1800000,'IDR',2,'days','["nature","mountain"]','["自然","山岳"]','bromo','布罗莫','["transport","guide"]','["交通","导游"]','["meals"]','["餐食"]','["sunrise","jeep"]','["日出","吉普车"]','year-round','全年可订',16,1,'published',0,0,@now,@now),
  ("pkg-0008","Raja Ampat Dream","四王群岛梦幻之旅","raja-ampat-dream","World-class snorkeling Raja Ampat.","世界级四王群岛浮潜。","Raja Ampat reefs.","四王群岛珊瑚礁",14500000,'IDR',5,'days','["adventure","islands"]','["冒险","群岛"]','raja-ampat','四王群岛','["boat","meals"]','["船只","餐食"]','["flights"]','["机票"]','["coral","lagoon"]','["珊瑚","泻湖"]','seasonal','季节性',10,1,'published',0,0,@now,@now), 
  ("pkg-0009","Sumba Hidden Gems","松巴秘境探索","sumba-hidden-gems","Savannahs and culture of Sumba.","松巴草原与文化。","Explore Sumba.","探索松巴",6800000,'IDR',4,'days','["culture","nature"]','["文化","自然"]','sumba','松巴','["hotel","guide"]','["酒店","导游"]','["flights"]','["机票"]','["savannah","traditional-village"]','["草原","传统村落"]','seasonal','季节性',14,0,'published',0,0,@now,@now),
  ("pkg-0010","Belitung Island Escape","勿里洞海岛度假","belitung-island-escape","Granite rocks and clear sea.","花岗岩巨石与清澈海水。","Belitung beaches.","勿里洞海滩",2600000,'IDR',3,'days','["beach","islands"]','["海滩","群岛"]','belitung','勿里洞','["hotel","boat"]','["酒店","船只"]','["flights"]','["机票"]','["lighthouse","island-hopping"]','["灯塔","跳岛"]','year-round','全年可订',20,0,'published',0,0,@now,@now),
  ("pkg-0011","Bali Luxury Retreat","巴厘岛奢华静养","bali-luxury-retreat","Private villas and spa.","私密别墅与水疗。","Luxury Bali.","奢享巴厘",12500000,'IDR',4,'days','["luxury","relax"]','["奢华","休闲"]','bali','巴厘岛','["villa","spa","breakfast"]','["别墅","水疗","早餐"]','["flights"]','["机票"]','["fine-dining","beach-club"]','["精致餐饮","海滩俱乐部"]','year-round','全年可订',8,1,'published',0,0,@now,@now),
  ("pkg-0012","Karimunjawa Snorkel","卡里穆加娃浮潜之旅","karimunjawa-snorkel","Tropical islands near Java.","爪哇附近热带小岛。","Karimunjawa trip.","卡里穆加娃之行",2900000,'IDR',3,'days','["beach","snorkel"]','["海滩","浮潜"]','karimunjawa','卡里穆加娃','["guesthouse","boat"]','["民宿","船只"]','["flights"]','["机票"]','["coral","sandbar"]','["珊瑚","沙洲"]','seasonal','季节性',18,0,'published',0,0,@now,@now),
  ("pkg-0013","Toba Lake Explorer","多巴湖探索","toba-lake-explorer","Scenic lake and Batak culture.","湖光山色与巴塔克文化。","Lake Toba.","多巴湖",3200000,'IDR',3,'days','["nature","culture"]','["自然","文化"]','toba','多巴湖','["hotel","breakfast"]','["酒店","早餐"]','["flights"]','["机票"]','["lake-view","traditional-show"]','["湖景","传统表演"]','year-round','全年可订',22,0,'published',0,0,@now,@now),
  ("pkg-0014","Labuan Bajo Deluxe","拉布安巴焦豪华行","labuan-bajo-deluxe","Premium Komodo experience.","尊贵科莫多体验。","Deluxe Komodo.","豪华科莫多",9800000,'IDR',4,'days','["luxury","wildlife"]','["奢华","野生动物"]','labuan-bajo','拉布安巴焦','["boat","meals"]','["船只","餐食"]','["flights"]','["机票"]','["pink-beach","manta"]','["粉色沙滩","蝠鲼"]','seasonal','季节性',10,1,'published',0,0,@now,@now),
  ("pkg-0015","Makassar Culinary Tour","望加锡美食之旅","makassar-culinary-tour","Savoury local food.","地道美味品尝。","Makassar eats.","望加锡美食",1600000,'IDR',2,'days','["food","city"]','["美食","城市"]','makassar','望加锡','["guide"]','["导游"]','["flights"]','["机票"]','["coto","pisang-ijo"]','["牛肉汤","青香蕉甜品"]','year-round','全年可订',20,0,'published',0,0,@now,@now),
  ("pkg-0016","Dieng Plateau Chill","迪昂高原清凉行","dieng-plateau-chill","Highland scenery and temples.","高原景色与庙宇。","Dieng cool air.","迪昂清凉",2100000,'IDR',2,'days','["nature","culture"]','["自然","文化"]','dieng','迪昂','["transport","guide"]','["交通","导游"]','["meals"]','["餐食"]','["crater","color-lake"]','["火山口","彩色湖"]','year-round','全年可订',16,0,'published',0,0,@now,@now),
  ("pkg-0017","Banyuwangi Blue Fire","巴纽旺宜蓝火","banyuwangi-blue-fire","Ijen crater night trek.","夜间徒步宜珍火山。","Ijen blue fire.","宜珍蓝火",2400000,'IDR',2,'days','["adventure","mountain"]','["冒险","山岳"]','banyuwangi','巴纽旺宜','["guide","mask"]','["导游","口罩"]','["flights"]','["机票"]','["ijen","sunrise"]','["宜珍","日出"]','seasonal','季节性',12,0,'published',0,0,@now,@now),
  ("pkg-0018","Manado Dive Trip","万鸦老潜水行","manado-dive-trip","Bunaken diving paradise.","布纳肯潜水天堂。","Dive Manado.","潜入万鸦老",8300000,'IDR',4,'days','["adventure","dive"]','["冒险","潜水"]','manado','万鸦老','["boat","tanks"]','["船只","气瓶"]','["flights"]','["机票"]','["wall-dive","turtle"]','["峭壁潜水","海龟"]','seasonal','季节性',12,0,'published',0,0,@now,@now),
  ("pkg-0019","Medan City + Berastagi","棉兰与百拉士打高地","medan-berastagi","City sights and highlands.","城市景点与高地。","Medan & Berastagi.","棉兰与百拉士打",2700000,'IDR',3,'days','["city","nature"]','["城市","自然"]','medan','棉兰','["hotel","breakfast"]','["酒店","早餐"]','["flights"]','["机票"]','["ghung","fruit-market"]','["钟楼","水果市场"]','year-round','全年可订',24,0,'published',0,0,@now,@now),
  ("pkg-0020","Padang Mentawai Surf","巴东明打威冲浪","padang-mentawai-surf","World-class Mentawai waves.","世界级明打威海浪。","Mentawai surf.","明打威冲浪",17500000,'IDR',6,'days','["surf","adventure"]','["冲浪","冒险"]','padang','巴东','["boat","meals"]','["船只","餐食"]','["flights"]','["机票"]','["reef","barrel"]','["礁石","桶状浪"]','seasonal','季节性',8,1,'published',0,0,@now,@now);

-- Images: one cover per package
INSERT INTO `package_images` (`id`,`package_id`,`url`,`alt`,`order`,`is_cover`,`created_at`,`updated_at`) VALUES
  ("img-0001","pkg-0001","https://images.pexels.com/photos/1430676/pexels-photo-1430676.jpeg","Bali Beach",1,1,@now,@now),
  ("img-0002","pkg-0002","https://images.pexels.com/photos/236296/pexels-photo-236296.jpeg","Yogyakarta Temple",1,1,@now,@now),
  ("img-0003","pkg-0003","https://images.pexels.com/photos/2404370/pexels-photo-2404370.jpeg","Lombok Waterfall",1,1,@now,@now),
  ("img-0004","pkg-0004","https://images.pexels.com/photos/460376/pexels-photo-460376.jpeg","Komodo Sailing",1,1,@now,@now),
  ("img-0005","pkg-0005","https://images.pexels.com/photos/3732908/pexels-photo-3732908.jpeg","Jakarta City",1,1,@now,@now),
  ("img-0006","pkg-0006","https://images.pexels.com/photos/240221/pexels-photo-240221.jpeg","Bandung Hills",1,1,@now,@now),
  ("img-0007","pkg-0007","https://images.pexels.com/photos/3573382/pexels-photo-3573382.jpeg","Bromo Sunrise",1,1,@now,@now),
  ("img-0008","pkg-0008","https://images.pexels.com/photos/356830/pexels-photo-356830.jpeg","Raja Ampat",1,1,@now,@now),
  ("img-0009","pkg-0009","https://images.pexels.com/photos/1659437/pexels-photo-1659437.jpeg","Sumba",1,1,@now,@now),
  ("img-0010","pkg-0010","https://images.pexels.com/photos/753626/pexels-photo-753626.jpeg","Belitung",1,1,@now,@now),
  ("img-0011","pkg-0011","https://images.pexels.com/photos/2303781/pexels-photo-2303781.jpeg","Bali Luxury",1,1,@now,@now),
  ("img-0012","pkg-0012","https://images.pexels.com/photos/533998/pexels-photo-533998.jpeg","Karimunjawa",1,1,@now,@now),
  ("img-0013","pkg-0013","https://images.pexels.com/photos/15286/pexels-photo.jpg","Toba Lake",1,1,@now,@now),
  ("img-0014","pkg-0014","https://images.pexels.com/photos/219998/pexels-photo-219998.jpeg","Labuan Bajo",1,1,@now,@now),
  ("img-0015","pkg-0015","https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg","Makassar Food",1,1,@now,@now),
  ("img-0016","pkg-0016","https://images.pexels.com/photos/459225/pexels-photo-459225.jpeg","Dieng",1,1,@now,@now),
  ("img-0017","pkg-0017","https://images.pexels.com/photos/572897/pexels-photo-572897.jpeg","Ijen",1,1,@now,@now),
  ("img-0018","pkg-0018","https://images.pexels.com/photos/386025/pexels-photo-386025.jpeg","Manado",1,1,@now,@now),
  ("img-0019","pkg-0019","https://images.pexels.com/photos/218760/pexels-photo-218760.jpeg","Medan",1,1,@now,@now),
  ("img-0020","pkg-0020","https://images.pexels.com/photos/156860/pexels-photo-156860.jpeg","Mentawai Surf",1,1,@now,@now);

-- Minimal itinerary: 2 days each
INSERT INTO `itinerary_items` (`id`,`package_id`,`day`,`title`,`title_zh`,`description`,`description_zh`,`activities`,`activities_zh`,`meals`,`meals_zh`,`accommodation`,`accommodation_zh`,`created_at`,`updated_at`) VALUES
  ("it-0001","pkg-0001",1,'Arrival & Relax','抵达与休息','Check-in and relax.','办理入住后休息。','["check-in","beach time"]','["入住","海滩时光"]','["breakfast"]','["早餐"]','3-star hotel','三星级酒店',@now,@now),
  ("it-0002","pkg-0001",2,'Ubud Day','乌布一日游','Visit temples and rice fields.','参观寺庙与梯田。','["temple","rice terrace"]','["寺庙","梯田"]','["breakfast"]','["早餐"]','3-star hotel','三星级酒店',@now,@now),
  ("it-0003","pkg-0002",1,'City Tour','城市文化游','Heritage tour.','遗产景点参观。','["borobudur","prambanan"]','["婆罗浮屠","普兰巴南"]','["lunch"]','["午餐"]','hotel','酒店',@now,@now),
  ("it-0004","pkg-0002",2,'Kuliner','美食体验','Local food walk.','当地街头美食漫步。','["street food"]','["街头美食"]','["breakfast"]','["早餐"]','hotel','酒店',@now,@now);
-- (Add simple two-day entries only for first 2 to keep it concise; others will still display correctly.)
