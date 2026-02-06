
-- ------
-- BGA framework: Gregory Isabelli & Emmanuel Colin & BoardGameArena
-- spookytower implementation : © <Your name here> <Your email address here>
-- 
-- This code has been produced on the BGA studio platform for use on http://boardgamearena.com.
-- See http://en.boardgamearena.com/#!doc/Studio for more information.
-- -----

-- dbmodel.sql

-- This is the file where you are describing the database schema of your game
-- Basically, you just have to export from PhpMyAdmin your table structure and copy/paste
-- this export here.
-- Note that the database itself and the standard tables ("global", "stats", "gamelog" and "player") are
-- already created and must not be created here

-- Note: The database schema is created from this file when the game starts. If you modify this file,
--       you have to restart a game to see your changes in database.

-- Example 1: create a standard "card" table to be used with the "Deck" tools (see example game "hearts"):

-- CREATE TABLE IF NOT EXISTS `card` (
--   `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
--   `card_type` varchar(16) NOT NULL,
--   `card_type_arg` int(11) NOT NULL,
--   `card_location` varchar(16) NOT NULL,
--   `card_location_arg` int(11) NOT NULL,
--   PRIMARY KEY (`card_id`)
-- ) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;


-- Example 2: add a custom field to the standard "player" table
-- ALTER TABLE `player` ADD `player_my_custom_field` INT UNSIGNED NOT NULL DEFAULT '0';

CREATE TABLE IF NOT EXISTS `pending` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `player_id` int(10) NULL,  
  `function` varchar(50) NULL,
  `target` varchar(50) NULL,
  `arg` varchar(50) NULL,  
  `arg2` varchar(50) NULL,
  `arg3` varchar(50) NULL,
  `arg4` varchar(50) NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1000 ;

CREATE TABLE IF NOT EXISTS `building` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` varchar(16) NOT NULL,
  `card_type_arg` int(11) NOT NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  `position` int(5) unsigned DEFAULT 1,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--  `building`
--   `card_id` 
--   `card_type`         chiffre de la carte
--   `card_type_arg`     numero de la carte (sprite)
--   `card_location`     deckX (X = numero) / hand (si besoin etape transitoire) / house / discard
--   `card_location_arg` player_id
--   `position`          position verticale quand a coté de la house (1 etant celle du bas)

CREATE TABLE IF NOT EXISTS `grimoire` (
  `card_id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `card_type` varchar(16) NOT NULL,
  `card_type_arg` int(11) NOT NULL,
  `card_location` varchar(16) NOT NULL,
  `card_location_arg` int(11) NOT NULL,
  PRIMARY KEY (`card_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--  `grimoire`
--   `card_id` 
--   `card_type`         type de grimoire
--   `card_type_arg`     non utilisé
--   `card_location`     deck / hand (si besoin etape transitoire) / discard
--   `card_location_arg` player_id

CREATE TABLE IF NOT EXISTS `other` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `dice1` int(2) unsigned DEFAULT 1,
  `dice2` int(2) unsigned DEFAULT 1, 
  `clock` int(2) unsigned DEFAULT 0, 
  `pet1` varchar(16) NULL,
  `pet2` varchar(16) NULL, 
  `pet3` varchar(16) NULL, 
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 AUTO_INCREMENT=1 ;

--  `other`
--   `id` 
--   `dice1`          valeur actuelle du dé 1
--   `dice2`          valeur actuelle du dé 2
--   `clock`          position actuelle de l'horloge ( de 0 à 5 ... 0 étant midi)
--   `pet(position)`  numeroPet_table ou numeroPet_idplayer

ALTER TABLE `player` ADD `reroll` int(5) NOT NULL DEFAULT 1;
--   `reroll`     1 reroll OK, 0 reroll NOK