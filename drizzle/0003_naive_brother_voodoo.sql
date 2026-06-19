ALTER TABLE `users` ADD `otp_code` varchar(6);--> statement-breakpoint
ALTER TABLE `users` ADD `otp_expires_at` datetime;