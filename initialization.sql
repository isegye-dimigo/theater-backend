/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE `isegye` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `isegye`;

CREATE TABLE `media` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `hash` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `type` varchar(3) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int(10) unsigned NOT NULL,
  `width` int(10) unsigned NOT NULL,
  `height` int(10) unsigned NOT NULL,
  `aspect_ratio` varchar(16) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_video` bit(1) NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(hash)` (`hash`) USING BTREE,
  KEY `FOREIGN KEY(media.user_id,user.id)` (`user_id`),
  CONSTRAINT `FOREIGN KEY(media.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE NO ACTION ON UPDATE NO ACTION
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `media_video` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `media_id` int(10) unsigned NOT NULL,
  `index` int(10) unsigned NOT NULL,
  `size` int(10) unsigned NOT NULL,
  `duration` double unsigned NOT NULL,
  `video_bit_rate` int(10) unsigned NOT NULL,
  `audio_bit_rate` int(10) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(media_id,index)` (`media_id`,`index`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(media_video.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `media_video_metadata` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `media_id` int(10) unsigned NOT NULL,
  `duration` double unsigned NOT NULL,
  `frame_rate` double unsigned NOT NULL,
  `bit_rate` int(10) unsigned NOT NULL,
  `sample_rate` int(10) unsigned NOT NULL,
  `channel_count` tinyint(2) unsigned NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(media_id)` (`media_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(media_video_metadata.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `movie` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `title` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(4096) COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_media_id` int(10) unsigned NOT NULL,
  `image_media_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(video_media_id)` (`video_media_id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(image_media_id)` (`image_media_id`) USING BTREE,
  KEY `FOREIGN KEY(movie.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie.image_media_id,media.id)` FOREIGN KEY (`image_media_id`) REFERENCES `media` (`id`),
  CONSTRAINT `FOREIGN KEY(movie.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
  CONSTRAINT `FOREIGN KEY(movie.video_media_id,media.id)` FOREIGN KEY (`video_media_id`) REFERENCES `media` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `movie_comment` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `time` int(10) unsigned NOT NULL,
  `content` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(movie_comment.movie_id,movie.id)` (`movie_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_comment.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie_comment.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`),
  CONSTRAINT `FOREIGN KEY(movie_comment.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `movie_like` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(movie_id,user_id)` (`movie_id`,`user_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_like.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie_like.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`),
  CONSTRAINT `FOREIGN KEY(movie_like.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `movie_star` (
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

CREATE TABLE `movie_statistic` (
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

CREATE TABLE `report` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `type` tinyint(3) unsigned NOT NULL,
  `target_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(report.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(report.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `email` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `handle` varchar(32) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profile_media_id` int(10) unsigned DEFAULT NULL,
  `banner_media_id` int(10) unsigned DEFAULT NULL,
  `verification_key` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` bit(1) NOT NULL DEFAULT b'0',
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(email)` (`email`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(handle)` (`handle`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(profile_media_id)` (`profile_media_id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(banner_media_id)` (`banner_media_id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(verification_key)` (`verification_key`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(user.banner_media_id,media.id)` FOREIGN KEY (`banner_media_id`) REFERENCES `media` (`id`),
  CONSTRAINT `FOREIGN KEY(user.profile_media_id,media.id)` FOREIGN KEY (`profile_media_id`) REFERENCES `media` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_history` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int(10) unsigned NOT NULL,
  `movie_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(user_history.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(user_history.movie_id,movie.id)` (`movie_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(user_history.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`),
  CONSTRAINT `FOREIGN KEY(user_history.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE ALGORITHM=TEMPTABLE SQL SECURITY DEFINER VIEW `current_movie_statistic` AS SELECT `isegye`.`movie_statistic`.`id` AS `id`,`isegye`.`movie_statistic`.`movie_id` AS `movie_id`,`isegye`.`movie_statistic`.`view_count` AS `view_count`, COUNT(`isegye`.`movie_like`.`id`) AS `like_count`, COUNT(`isegye`.`movie_comment`.`id`) AS `comment_count`, COALESCE(AVG(`isegye`.`movie_star`.`value`), 0) AS `star_average`,`isegye`.`movie_statistic`.`created_at` AS `created_at` FROM ((((`isegye`.`movie_statistic` LEFT JOIN `isegye`.`movie_like` ON (`isegye`.`movie_statistic`.`movie_id` = `isegye`.`movie_like`.`movie_id`)) LEFT JOIN `isegye`.`movie_comment` ON (`isegye`.`movie_statistic`.`movie_id` = `isegye`.`movie_comment`.`movie_id`)) LEFT JOIN `isegye`.`movie_star` ON (`isegye`.`movie_statistic`.`movie_id` = `isegye`.`movie_star`.`movie_id`)) JOIN (SELECT MAX(`isegye`.`movie_statistic`.`id`) AS `id` from `isegye`.`movie_statistic` GROUP BY `isegye`.`movie_statistic`.`movie_id`) `_movie_statistic` ON (`isegye`.`movie_statistic`.`id` = `_movie_statistic`.`id`)) GROUP BY `isegye`.`movie_statistic`.`movie_id`;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;