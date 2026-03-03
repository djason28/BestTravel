CREATE DATABASE IF NOT EXISTS besttravel;
CREATE USER IF NOT EXISTS 'bestuser'@'localhost' IDENTIFIED BY 'PasswordKuat123!';
GRANT ALL PRIVILEGES ON besttravel.* TO 'bestuser'@'localhost';
FLUSH PRIVILEGES;
