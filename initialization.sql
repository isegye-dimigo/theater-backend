/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

CREATE DATABASE IF NOT EXISTS `isegye` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci */;
USE `isegye`;

CREATE TABLE `current_episode_statistic` (
	`id` INT(10) UNSIGNED NULL,
	`episode_id` INT(10) UNSIGNED NOT NULL
) ENGINE=MyISAM;

CREATE TABLE `current_movie_statistic` (
	`id` INT(10) UNSIGNED NULL,
	`movie_id` INT(10) UNSIGNED NOT NULL
) ENGINE=MyISAM;

CREATE TABLE `current_used_media` (
	`id` INT(10) UNSIGNED NULL
) ENGINE=MyISAM;

CREATE TABLE IF NOT EXISTS `episode` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `index` int(10) unsigned NOT NULL,
  `title` varchar(128) NOT NULL,
  `description` varchar(4096) DEFAULT NULL,
  `image_media_id` int(10) unsigned NOT NULL,
  `video_media_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(episode.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(episode.image_media_id,media.id)` (`image_media_id`) USING BTREE,
  KEY `FOREIGN KEY(episode.movie_id,movie.id)` (`movie_id`) USING BTREE,
  KEY `FOREIGN KEY(episode.video_media_id,media.id)` (`video_media_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(episode.image_media_id,media.id)` FOREIGN KEY (`image_media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(episode.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(episode.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(episode.video_media_id,media.id)` FOREIGN KEY (`video_media_id`) REFERENCES `media` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `episode_comment` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `episode_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `time` int(10) unsigned NOT NULL,
  `content` varchar(1024) NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(episode_comment.episode_id,episode.id)` (`episode_id`),
  KEY `FOREIGN KEY(episode_comment.user_id,user.id)` (`user_id`),
  CONSTRAINT `FOREIGN KEY(episode_comment.episode_id,episode.id)` FOREIGN KEY (`episode_id`) REFERENCES `episode` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(episode_comment.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `episode_like` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `episode_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE KEY `UNIQUE INDEX(episode_id,user_id)` (`episode_id`,`user_id`) USING BTREE,
  KEY `FOREIGN KEY(episode_like.user_id,user.id)` (`user_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(episode_like.movie_id,episode.id)` FOREIGN KEY (`episode_id`) REFERENCES `episode` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(episode_like.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `episode_statistic` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `episode_id` int(10) unsigned NOT NULL,
  `view_count` int(10) unsigned NOT NULL DEFAULT 0,
  `comment_count` int(10) unsigned NOT NULL DEFAULT 0,
  `like_count` int(10) unsigned NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(episode_statistic.episode_id,episode.id)` (`episode_id`),
  CONSTRAINT `FOREIGN KEY(episode_statistic.episode_id,episode.id)` FOREIGN KEY (`episode_id`) REFERENCES `episode` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER //
CREATE EVENT `insert_episode_statistic` ON SCHEDULE EVERY 1 HOUR STARTS '2023-12-11 09:14:21' ON COMPLETION PRESERVE ENABLE DO INSERT INTO episode_statistic (episode_id, view_count, comment_count, like_count) SELECT episode_statistic.episode_id, episode_statistic.view_count, episode_statistic.comment_count, episode_statistic.like_count FROM episode_statistic INNER JOIN current_episode_statistic ON episode_statistic.id = current_episode_statistic.id WHERE created_at <= NOW() - INTERVAL 1 DAY//
DELIMITER ;

DELIMITER //
CREATE EVENT `insert_movie_statistic` ON SCHEDULE EVERY 1 HOUR STARTS '2023-12-11 09:14:21' ON COMPLETION PRESERVE ENABLE DO INSERT INTO movie_statistic (movie_id, view_count, comment_count, star_average) SELECT movie_statistic.movie_id, movie_statistic.view_count, movie_statistic.comment_count, movie_statistic.star_average FROM movie_statistic INNER JOIN current_movie_statistic ON movie_statistic.id = current_movie_statistic.id WHERE created_at <= NOW() - INTERVAL 1 DAY//
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
  CONSTRAINT `FOREIGN KEY(media.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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
  `title` varchar(128) NOT NULL,
  `description` varchar(4096) DEFAULT NULL,
  `media_id` int(10) unsigned NOT NULL,
  `category_id` int(10) unsigned NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(movie.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(movie.media_id,media.id)` (`media_id`) USING BTREE,
  CONSTRAINT `FOREIGN KEY(movie.media_id,media.id)` FOREIGN KEY (`media_id`) REFERENCES `media` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `movie_comment` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `content` varchar(1024) NOT NULL,
  `is_deleted` bit(1) NOT NULL DEFAULT b'0',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(movie_comment.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_comment.movie_id,movie.id)` (`movie_id`),
  CONSTRAINT `FOREIGN KEY(movie_comment.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie_comment.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `movie_star` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `user_id` int(10) unsigned NOT NULL,
  `value` tinyint(1) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `UNIQUE INDEX(user_id,movie_id)` (`user_id`,`movie_id`) USING BTREE,
  KEY `FOREIGN KEY(movie_star.movie_id,movie.id)` (`movie_id`),
  KEY `INDEX(movie_id,value)` (`movie_id`,`value`),
  CONSTRAINT `FOREIGN KEY(movie_star.movie_id,movie.id)` FOREIGN KEY (`movie_id`) REFERENCES `movie` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(movie_star.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE IF NOT EXISTS `movie_statistic` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `movie_id` int(10) unsigned NOT NULL,
  `view_count` int(10) unsigned NOT NULL DEFAULT 0,
  `comment_count` int(10) unsigned NOT NULL DEFAULT 0,
  `star_average` double unsigned NOT NULL DEFAULT 0,
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
  CONSTRAINT `FOREIGN KEY(report.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


DELIMITER //
CREATE EVENT `update_episode_statistic` ON SCHEDULE EVERY 5 MINUTE STARTS '2023-12-11 09:14:21' ON COMPLETION PRESERVE ENABLE DO UPDATE episode_statistic INNER JOIN current_episode_statistic ON episode_statistic.id = current_episode_statistic.id SET comment_count = (SELECT COUNT(*) FROM episode_comment WHERE episode_id = episode_statistic.episode_id), like_count = (SELECT COUNT(*) FROM episode_like WHERE episode_id = episode_statistic.episode_id)//
DELIMITER ;

DELIMITER //
CREATE EVENT `update_movie_statistic` ON SCHEDULE EVERY 5 MINUTE STARTS '2023-12-11 09:14:21' ON COMPLETION PRESERVE ENABLE DO UPDATE movie_statistic INNER JOIN current_movie_statistic ON movie_statistic.id = current_movie_statistic.id SET comment_count = (SELECT COUNT(*) FROM movie_comment WHERE movie_id = movie_statistic.movie_id), star_average = (SELECT COALESCE(AVG(value), 0) FROM movie_star WHERE movie_id = movie_statistic.movie_id)//
DELIMITER ;

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
  `episode_id` int(10) unsigned NOT NULL,
  `time` int(10) unsigned NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `FOREIGN KEY(user_history.user_id,user.id)` (`user_id`) USING BTREE,
  KEY `FOREIGN KEY(user_history.episode_id,episode.id)` (`episode_id`) USING BTREE,
  CONSTRAINT `FK_user_history_episode` FOREIGN KEY (`episode_id`) REFERENCES `episode` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `FOREIGN KEY(user_history.user_id,user.id)` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
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


DROP TABLE IF EXISTS `current_episode_statistic`;
CREATE ALGORITHM=TEMPTABLE SQL SECURITY DEFINER VIEW `current_episode_statistic` AS select max(`episode_statistic`.`id`) AS `id`,`episode_statistic`.`episode_id` AS `episode_id` from `episode_statistic` group by `episode_statistic`.`episode_id`;

DROP TABLE IF EXISTS `current_movie_statistic`;
CREATE ALGORITHM=TEMPTABLE SQL SECURITY DEFINER VIEW `current_movie_statistic` AS select max(`movie_statistic`.`id`) AS `id`,`movie_statistic`.`movie_id` AS `movie_id` from `movie_statistic` group by `movie_statistic`.`movie_id`;

DROP TABLE IF EXISTS `current_used_media`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `current_used_media` AS select `movie`.`media_id` AS `id` from `movie` union select `episode`.`image_media_id` AS `image_media_id` from `episode` union select `user`.`profile_media_id` AS `profile_media_id` from `user` where `user`.`profile_media_id` is not null union select `user`.`banner_media_id` AS `banner_media_id` from `user` where `user`.`banner_media_id` is not null;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
