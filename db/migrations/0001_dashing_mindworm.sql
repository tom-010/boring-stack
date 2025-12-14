CREATE TABLE `projects` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` text DEFAULT 'blue',
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE `todos` ADD `project_id` integer NOT NULL REFERENCES projects(id);--> statement-breakpoint
ALTER TABLE `todos` ADD `description` text;--> statement-breakpoint
ALTER TABLE `todos` ADD `priority` text DEFAULT 'medium';--> statement-breakpoint
ALTER TABLE `todos` ADD `due_date` text;