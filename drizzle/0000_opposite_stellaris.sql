CREATE TABLE `guesses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`room_code` text NOT NULL,
	`player` text NOT NULL,
	`word` text NOT NULL,
	`score` integer NOT NULL,
	`rank` integer NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rooms` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target` text NOT NULL,
	`solved` integer DEFAULT 0 NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `guesses_room_idx` ON `guesses` (`room_code`,`id`);
