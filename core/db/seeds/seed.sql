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
  (`id`,`title`,`slug`,`description`,`short_description`,`price`,`currency`,`duration`,`duration_unit`,`categories`,`destination`,`included`,`excluded`,`highlights`,`availability`,`max_participants`,`featured`,`status`,`view_count`,`inquiry_count`,`created_at`,`updated_at`)
VALUES
  ("pkg-0001","Bali Getaway 3D2N","bali-getaway-3d2n","Relax in Bali's beaches and culture.","A short, sweet Bali escape.",3500000,'IDR',3,'days','["beach","relax","culture"]','bali','["hotel","breakfast"]','["flights"]','["sunset","temple","spa"]','year-round',20,1,'published',10,1,@now,@now),
  ("pkg-0002","Yogyakarta Heritage","yogyakarta-heritage","Discover temples and cuisine.","Culture trip in Jogja.",2500000,'IDR',2,'days','["culture","city"]','yogyakarta','["hotel","guide"]','["flights"]','["borobudur","prambanan"]','year-round',15,0,'published',5,0,@now,@now),
  ("pkg-0003","Lombok Adventure 4D3N","lombok-adventure-4d3n","Explore Lombok's beaches and waterfalls.","Adventure in Lombok.",4200000,'IDR',4,'days','["adventure","beach"]','lombok','["hotel","breakfast","tour"]','["flights"]','["waterfall","snorkeling"]','seasonal',18,1,'published',0,0,@now,@now),
  ("pkg-0004","Komodo Explorer","komodo-explorer","Sail to Komodo and pink beach.","Liveaboard to Komodo.",7500000,'IDR',3,'days','["adventure","wildlife"]','labuan-bajo','["boat","meals","guide"]','["flights"]','["dragon","snorkel"]','seasonal',12,0,'published',0,0,@now,@now),
  ("pkg-0005","Jakarta City Break","jakarta-city-break","Weekend city highlights.","Jakarta quick break.",1500000,'IDR',2,'days','["city","food"]','jakarta','["hotel"]','["flights"]','["old-town","street-food"]','weekend-only',25,0,'published',0,0,@now,@now),
  ("pkg-0006","Bandung Family Fun","bandung-family-fun","Cool weather and family attractions.","Bandung for families.",2200000,'IDR',3,'days','["family","nature"]','bandung','["hotel","breakfast"]','["flights"]','["farm","tea-hills"]','year-round',30,0,'published',0,0,@now,@now),
  ("pkg-0007","Bromo Sunrise","bromo-sunrise","Classic Bromo sunrise trip.","See Bromo sunrise.",1800000,'IDR',2,'days','["nature","mountain"]','bromo','["transport","guide"]','["meals"]','["sunrise","jeep"]','year-round',16,1,'published',0,0,@now,@now),
  ("pkg-0008","Raja Ampat Dream","raja-ampat-dream","World-class snorkeling Raja Ampat.","Raja Ampat reefs.",14500000,'IDR',5,'days','["adventure","islands"]','raja-ampat','["boat","meals"]','["flights"]','["coral","lagoon"]','seasonal',10,1,'published',0,0,@now,@now), 
  ("pkg-0009","Sumba Hidden Gems","sumba-hidden-gems","Savannahs and culture of Sumba.","Explore Sumba.",6800000,'IDR',4,'days','["culture","nature"]','sumba','["hotel","guide"]','["flights"]','["savannah","traditional-village"]','seasonal',14,0,'published',0,0,@now,@now),
  ("pkg-0010","Belitung Island Escape","belitung-island-escape","Granite rocks and clear sea.","Belitung beaches.",2600000,'IDR',3,'days','["beach","islands"]','belitung','["hotel","boat"]','["flights"]','["lighthouse","island-hopping"]','year-round',20,0,'published',0,0,@now,@now),
  ("pkg-0011","Bali Luxury Retreat","bali-luxury-retreat","Private villas and spa.","Luxury Bali.",12500000,'IDR',4,'days','["luxury","relax"]','bali','["villa","spa","breakfast"]','["flights"]','["fine-dining","beach-club"]','year-round',8,1,'published',0,0,@now,@now),
  ("pkg-0012","Karimunjawa Snorkel","karimunjawa-snorkel","Tropical islands near Java.","Karimunjawa trip.",2900000,'IDR',3,'days','["beach","snorkel"]','karimunjawa','["guesthouse","boat"]','["flights"]','["coral","sandbar"]','seasonal',18,0,'published',0,0,@now,@now),
  ("pkg-0013","Toba Lake Explorer","toba-lake-explorer","Scenic lake and Batak culture.","Lake Toba.",3200000,'IDR',3,'days','["nature","culture"]','toba','["hotel","breakfast"]','["flights"]','["lake-view","traditional-show"]','year-round',22,0,'published',0,0,@now,@now),
  ("pkg-0014","Labuan Bajo Deluxe","labuan-bajo-deluxe","Premium Komodo experience.","Deluxe Komodo.",9800000,'IDR',4,'days','["luxury","wildlife"]','labuan-bajo','["boat","meals"]','["flights"]','["pink-beach","manta"]','seasonal',10,1,'published',0,0,@now,@now),
  ("pkg-0015","Makassar Culinary Tour","makassar-culinary-tour","Savoury local food.","Makassar eats.",1600000,'IDR',2,'days','["food","city"]','makassar','["guide"]','["flights"]','["coto","pisang-ijo"]','year-round',20,0,'published',0,0,@now,@now),
  ("pkg-0016","Dieng Plateau Chill","dieng-plateau-chill","Highland scenery and temples.","Dieng cool air.",2100000,'IDR',2,'days','["nature","culture"]','dieng','["transport","guide"]','["meals"]','["crater","color-lake"]','year-round',16,0,'published',0,0,@now,@now),
  ("pkg-0017","Banyuwangi Blue Fire","banyuwangi-blue-fire","Ijen crater night trek.","Ijen blue fire.",2400000,'IDR',2,'days','["adventure","mountain"]','banyuwangi','["guide","mask"]','["flights"]','["ijen","sunrise"]','seasonal',12,0,'published',0,0,@now,@now),
  ("pkg-0018","Manado Dive Trip","manado-dive-trip","Bunaken diving paradise.","Dive Manado.",8300000,'IDR',4,'days','["adventure","dive"]','manado','["boat","tanks"]','["flights"]','["wall-dive","turtle"]','seasonal',12,0,'published',0,0,@now,@now),
  ("pkg-0019","Medan City + Berastagi","medan-berastagi","City sights and highlands.","Medan & Berastagi.",2700000,'IDR',3,'days','["city","nature"]','medan','["hotel","breakfast"]','["flights"]','["ghung","fruit-market"]','year-round',24,0,'published',0,0,@now,@now),
  ("pkg-0020","Padang Mentawai Surf","padang-mentawai-surf","World-class Mentawai waves.","Mentawai surf.",17500000,'IDR',6,'days','["surf","adventure"]','padang','["boat","meals"]','["flights"]','["reef","barrel"]','seasonal',8,1,'published',0,0,@now,@now);

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
INSERT INTO `itinerary_items` (`id`,`package_id`,`day`,`title`,`description`,`activities`,`meals`,`accommodation`,`created_at`,`updated_at`) VALUES
  ("it-0001","pkg-0001",1,'Arrival & Relax','Check-in and relax.','["check-in","beach time"]','["breakfast"]','3-star hotel',@now,@now),
  ("it-0002","pkg-0001",2,'Ubud Day','Visit temples and rice fields.','["temple","rice terrace"]','["breakfast"]','3-star hotel',@now,@now),
  ("it-0003","pkg-0002",1,'City Tour','Heritage tour.','["borobudur","prambanan"]','["lunch"]','hotel',@now,@now),
  ("it-0004","pkg-0002",2,'Kuliner','Local food walk.','["street food"]','["breakfast"]','hotel',@now,@now);
-- (Add simple two-day entries only for first 2 to keep it concise; others will still display correctly.)
