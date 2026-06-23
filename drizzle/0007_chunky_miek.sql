ALTER TABLE `bids` ADD CONSTRAINT `bids_created_by_id_users_id_fk` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;
