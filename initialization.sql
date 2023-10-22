/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `isegye` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `isegye`;

CREATE TABLE IF NOT EXISTS `category` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `title` varchar(32) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(title)` (`title`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `current_movie_statistic` (
	`id` INT(10) UNSIGNED NOT NULL,
	`movie_id` INT(10) UNSIGNED NOT NULL,
	`view_count` INT(10) UNSIGNED NOT NULL,
	`like_count` BIGINT(21) NOT NULL,
	`comment_count` BIGINT(21) NOT NULL,
	`star_average` DECIMAL(7,4) NULL,
	`created_at` DATETIME NOT NULL
) ENGINE=MyISAM;

DELIMITER //
CREATE EVENT `insert_movie_statistic` ON SCHEDULE EVERY 1 HOUR STARTS '2023-09-18 16:14:51' ON COMPLETION PRESERVE ENABLE DO INSERT INTO movie_statistic (movie_id, view_count, like_count, comment_count, star_average) SELECT movie_id, view_count, like_count, comment_count, star_average FROM current_movie_statistic WHERE created_at <= NOW() - INTERVAL 1 DAY//
DELIMITER ;

CREATE TABLE IF NOT EXISTS `media` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(128) NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `type` varchar(3) NOT NULL,
  `size` int(10) unsigned NOT NULL,
  `width` smallint(5) unsigned NOT NULL,
  `height` smallint(5) unsigned NOT NULL,
  `aspect_ratio` varchar(16) NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(hash)` (`hash`) USING BTREE,
  KEY `FOREIGN KEY(media.user_id,user.id)` (`user_id`),
  CONSTRAINT `FOREIGN KEY(media.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_part` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `media_id` int(10) unsigned NOT NULL,
  `index` int(10) unsigned NOT NULL,
  `size` int(10) unsigned NOT NULL,
  `duration` double unsigned NOT NULL,
  `video_bit_rate` int(10) unsigned NOT NULL,
  `audio_bit_rate` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(media_id,index)` (`media_id`,`index`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(media_part.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `media_video` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `media_id` int(10) unsigned NOT NULL,
  `duration` double unsigned NOT NULL,
  `frame_rate` double unsigned NOT NULL,
  `bit_rate` int(10) unsigned NOT NULL,
  `sample_rate` int(10) unsigned NOT NULL,
  `channel_count` tinyint(2) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(media_id)` (`media_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(media_video.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `image_media_id` int(10) unsigned NOT NULL,
  `video_media_id` int(10) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` varchar(4096) DEFAULT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(video_media_id)` (`video_media_id`) USING BTREE,
  KEY `FOREIGN KEY(movie.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(movie.category_id,category.id)` (`category_id`),
  KEY `FOREIGN KEY(movie.image_media_id,media.id)` (`image_media_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie.category_id,category.id)` FOREIGN KEY (`category_id`) REFERENCES `category` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie.image_media_id,media.id)` FOREIGN KEY (`image_media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie.video_media_id,media.id)` FOREIGN KEY (`video_media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie_comment` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `time` double unsigned NOT NULL,
  `content` varchar(128) NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(movie_comment.movie_id,movie.id)` (`movie_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_comment.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie_comment.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie_comment.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie_like` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(movie_id,user_id)` (`movie_id`,`user_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_like.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie_like.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie_like.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie_star` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `movie_id` int(10) unsigned NOT NULL,
  `value` tinyint(1) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX (user_id,movie_id)` (`user_id`,`movie_id`),
  KEY `FOREIGN KEY(movie_star.movie_id,movie.id)` (`movie_id`),
  CONSTRAINT `FOREIGN KEY(movie_star.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie_star.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `movie_statistic` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `view_count` int(10) unsigned NOT NULL,
  `comment_count` int(10) unsigned NOT NULL,
  `like_count` int(10) unsigned NOT NULL,
  `star_average` double unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(movie_statistic.movie_id,movie.id)` (`movie_id`),
  CONSTRAINT `FOREIGN KEY(movie_statistic.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `report` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `type` tinyint(3) unsigned NOT NULL,
  `target_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(report.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(report.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `series` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `media_id` int(10) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` varchar(4096) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(series.user_id,user.id)` (`user_id`),
  KEY `FOREIGN KEY(series.media_id,media.id)` (`media_id`),
  CONSTRAINT `FOREIGN KEY(series.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(series.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `series_movie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `series_id` int(10) unsigned NOT NULL,
  `movie_id` int(10) unsigned NOT NULL,
  `index` tinyint(4) NOT NULL,
  `subtitle` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(movie_id)` (`movie_id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(series_id,index)` (`series_id`,`index`) USING BTREE,
  KEY `FOREIGN KEY(series_movie.series_id,series.id)` (`series_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(series_movie.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(series_movie.series_id,series.id)` FOREIGN KEY (`series_id`) REFERENCES `series` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DELIMITER //
CREATE EVENT `update_movie_statistic` ON SCHEDULE EVERY 5 MINUTE STARTS '2023-09-18 16:40:29' ON COMPLETION PRESERVE ENABLE DO UPDATE movie_statistic, current_movie_statistic SET movie_statistic.comment_count = current_movie_statistic.comment_count, movie_statistic.like_count = current_movie_statistic.like_count, movie_statistic.star_average = current_movie_statistic.star_average WHERE movie_statistic.id = current_movie_statistic.id//
DELIMITER ;

CREATE TABLE `used_media` (
	`id` INT(10) UNSIGNED NULL
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `handle` varchar(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `description` varchar(2048) DEFAULT NULL,
  `profile_media_id` int(10) unsigned DEFAULT NULL,
  `banner_media_id` int(10) unsigned DEFAULT NULL,
  `is_verified` bit(1) NOT NULL DEFAULT b'0',
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(email)` (`email`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(handle)` (`handle`) USING BTREE,
  KEY `FOREIGN KEY(user.profile_media_id,media.id)` (`profile_media_id`),
  KEY `FOREIGN KEY(user.banner_media_id,media.id)` (`banner_media_id`),
  CONSTRAINT `FOREIGN KEY(user.banner_media_id,media.id)` FOREIGN KEY (`banner_media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(user.profile_media_id,media.id)` FOREIGN KEY (`profile_media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `movie_id` int(10) unsigned NOT NULL,
  `duration` double unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(user_history.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(user_history.movie_id,movie.id)` (`movie_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(user_history.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(user_history.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `user_verification` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `token` varchar(40) NOT NULL,
  `email` varchar(64) NOT NULL,
  `password` varchar(128) NOT NULL,
  `name` varchar(64) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(token)` (`token`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(email)` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

DROP TABLE IF EXISTS `current_movie_statistic`;
CREATE ALGORITHM=TEMPTABLE SQL SECURITY DEFINER VIEW `current_movie_statistic` AS select `movie_statistic`.`id` AS `id`,`movie_statistic`.`movie_id` AS `movie_id`,`movie_statistic`.`view_count` AS `view_count`,count(`movie_like`.`id`) AS `like_count`,count(`movie_comment`.`id`) AS `comment_count`,coalesce(avg(`movie_star`.`value`),0) AS `star_average`,`movie_statistic`.`created_at` AS `created_at` from ((((`movie_statistic` left join `movie_like` on(`movie_statistic`.`movie_id` = `movie_like`.`movie_id`)) left join `movie_comment` on(`movie_statistic`.`movie_id` = `movie_comment`.`movie_id`)) left join `movie_star` on(`movie_statistic`.`movie_id` = `movie_star`.`movie_id`)) join (select max(`movie_statistic`.`id`) AS `id` from `movie_statistic` group by `movie_statistic`.`movie_id`) `_movie_statistic` on(`movie_statistic`.`id` = `_movie_statistic`.`id`)) group by `movie_statistic`.`movie_id`;

DROP TABLE IF EXISTS `used_media`;
CREATE ALGORITHM=TEMPTABLE SQL SECURITY DEFINER VIEW `used_media` AS select `movie`.`image_media_id` AS `id` from `movie` union select `movie`.`video_media_id` AS `video_media_id` from `movie` union select `series`.`media_id` AS `media_id` from `series` union select `user`.`profile_media_id` AS `profile_media_id` from `user` where `user`.`profile_media_id` is not null union select `user`.`banner_media_id` AS `banner_media_id` from `user` where `user`.`banner_media_id` is not null;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
