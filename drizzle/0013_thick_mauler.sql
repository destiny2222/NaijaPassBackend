ALTER TABLE `bid_applications` MODIFY COLUMN `proposal_text` text;--> statement-breakpoint
ALTER TABLE `bid_applications` ADD `form_data` json;--> statement-breakpoint
ALTER TABLE `bids` ADD `form_schema` json;