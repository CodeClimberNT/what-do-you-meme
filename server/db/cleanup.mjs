import { db } from "./db.mjs";

export const cleanup = () => {
	db.run("DELETE FROM rounds");
	// Cleanup all the data
	db.parallelize(() => {
		db.run("DELETE FROM games");
		db.run("DELETE FROM meme_captions");
	});
	db.parallelize(() => {
		db.run("DELETE FROM users");
		db.run("DELETE FROM memes");
		db.run("DELETE FROM captions");
	});
	resolve("Database cleaned up");
};
