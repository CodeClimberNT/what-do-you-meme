import sqlite from "sqlite3";

/**
 * Initialize and export the database
 */
export const db = new sqlite.Database("./db/db.db", (err) => {
	if (err) throw err;
});
