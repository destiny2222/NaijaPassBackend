CREATE TABLE `bid_applications` (
	`id` varchar(36) NOT NULL,
	`bid_id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`proposal_text` text NOT NULL,
	`proposed_amount` varchar(255),
	`status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
	`created_at` datetime NOT NULL,
	CONSTRAINT `bid_applications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `bid_applications` ADD CONSTRAINT `bid_applications_bid_id_bids_id_fk` FOREIGN KEY (`bid_id`) REFERENCES `bids`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `bid_applications` ADD CONSTRAINT `bid_applications_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;