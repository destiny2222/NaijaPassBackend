CREATE TABLE `bid_reviews` (
	`id` varchar(36) NOT NULL,
	`bid_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`rating` int NOT NULL,
	`comment` text NOT NULL,
	`created_at` datetime NOT NULL,
	CONSTRAINT `bid_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bid_reviews` ADD CONSTRAINT `bid_reviews_bid_id_bids_id_fk` FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bid_reviews` ADD CONSTRAINT `bid_reviews_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;