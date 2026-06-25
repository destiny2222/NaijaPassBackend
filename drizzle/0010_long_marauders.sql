CREATE TABLE `procurements` (
	`id` varchar(36) NOT NULL,
	`project_id` varchar(255) NOT NULL,
	`lga` varchar(255),
	`state` varchar(255),
	`city` varchar(255),
	`entity_type` varchar(255),
	`contractor` varchar(255),
	`award_date` datetime,
	`amount` varchar(255),
	`status` enum('active','completed','suspended','cancelled') DEFAULT 'active',
	`description` text,
	`created_by_id` varchar(36),
	CONSTRAINT `procurements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `procurements` ADD CONSTRAINT `procurements_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;