ALTER TABLE `bids` ADD `procuring_entity` varchar(255);--> statement-breakpoint
ALTER TABLE `bids` ADD `sector` varchar(255);--> statement-breakpoint
ALTER TABLE `bids` ADD `location` varchar(255);--> statement-breakpoint
ALTER TABLE `bids` ADD `description` text;--> statement-breakpoint
ALTER TABLE `bids` ADD `status` enum('draft','published','cancelled','awarded') DEFAULT 'published' NOT NULL;
