CREATE TABLE `bid_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `bid_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `bids` (
	`id` varchar(36) NOT NULL,
	`title` varchar(255) NOT NULL,
	`bid_number` varchar(255) NOT NULL,
	`deadline` datetime NOT NULL,
	`agency` varchar(255) NOT NULL,
	`category_id` int,
	CONSTRAINT `bids_id` PRIMARY KEY(`id`),
	CONSTRAINT `bids_bid_number_unique` UNIQUE(`bid_number`)
);
--> statement-breakpoint
CREATE TABLE `industry_categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	CONSTRAINT `industry_categories_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kyc_representatives` (
	`id` int AUTO_INCREMENT NOT NULL,
	`kyc_id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`position` varchar(255) NOT NULL,
	CONSTRAINT `kyc_representatives_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `kycs` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` enum('individual','business') NOT NULL,
	`status` enum('pending','inprogress','approved','rejected') NOT NULL DEFAULT 'pending',
	`email` varchar(255) NOT NULL,
	`phone_number` varchar(255) NOT NULL,
	`business_name` varchar(255),
	`registration_number` varchar(255),
	`tax_identification_number` varchar(255),
	`rejection_reason` text,
	`industry_category_id` int,
	CONSTRAINT `kycs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`password` varchar(255) NOT NULL,
	`role` enum('user','admin') NOT NULL DEFAULT 'user',
	`email_verified_at` datetime,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `bids` ADD CONSTRAINT `bids_category_id_bid_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `bid_categories`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kyc_representatives` ADD CONSTRAINT `kyc_representatives_kyc_id_kycs_id_fk` FOREIGN KEY (`kyc_id`) REFERENCES `kycs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycs` ADD CONSTRAINT `kycs_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `kycs` ADD CONSTRAINT `kycs_industry_category_id_industry_categories_id_fk` FOREIGN KEY (`industry_category_id`) REFERENCES `industry_categories`(`id`) ON DELETE no action ON UPDATE no action;