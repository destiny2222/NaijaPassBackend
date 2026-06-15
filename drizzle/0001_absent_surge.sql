ALTER TABLE `kycs` ADD `id_type` varchar(50);--> statement-breakpoint
ALTER TABLE `kycs` ADD `id_number` varchar(100);--> statement-breakpoint
ALTER TABLE `kycs` ADD `first_name` varchar(255);--> statement-breakpoint
ALTER TABLE `kycs` ADD `last_name` varchar(255);--> statement-breakpoint
ALTER TABLE `kycs` ADD `dob` varchar(50);--> statement-breakpoint
ALTER TABLE `kycs` ADD `verification_status` enum('unverified','verified','failed') DEFAULT 'unverified' NOT NULL;--> statement-breakpoint
ALTER TABLE `kycs` ADD `verified_at` datetime;--> statement-breakpoint
ALTER TABLE `kycs` ADD `third_party_reference` varchar(255);--> statement-breakpoint
ALTER TABLE `kycs` ADD `verification_details` text;