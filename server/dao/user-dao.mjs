import User from "../components/user.mjs";
import { db } from "../db/db.mjs";
import crypto from "crypto";

class UserDAO {
	constructor() {}

	getUser = (username, password) => {
		return new Promise((resolve, reject) => {
			const sql = "SELECT * FROM users WHERE username = ?";
			db.get(sql, [username], (err, row) => {
				if (err) {
					return reject(err);
				}
				if (!row) {
					return resolve(false);
				}
				const user = new User(row.id, row.username);
				crypto.scrypt(password, row.salt, 32, function (err, hashedPassword) {
					if (err) return reject(err);
					if (
						!crypto.timingSafeEqual(
							Buffer.from(row.password, "hex"),
							hashedPassword
						)
					) {
						return resolve(false);
					}

					return resolve(user);
				});
			});
		});
	};

	// getUserById = (id) => {
	// 	return new Promise((resolve, reject) => {
	// 		const sql = "SELECT * FROM users WHERE id = ?";
	// 		db.get(sql, [id], (err, row) => {
	// 			if (err) {
	// 				return reject(err);
	// 			}
	// 			if (!row) {
	// 				return resolve({ error: "User not found!" });
	// 			}
	// 			const user = new User(row.id, row.username);
	// 			return resolve(user);
	// 		});
	// 	});
	// };

	getUserByUsername = (username) => {
		return new Promise((resolve, reject) => {
			const sql = "SELECT * FROM users WHERE username = ?";
			db.get(sql, [username], (err, row) => {
				if (err) {
					return reject(err);
				}
				if (!row) {
					return resolve({ error: "User not found!" });
				}
				const user = new User(row.id, row.username);
				return resolve(user);
			});
		});
	};

	// registerUser = (username, password) => {
	// 	return new Promise((resolve, reject) => {
	// 		crypto.randomBytes(16, (err, saltBuffer) => {
	// 			if (err) {
	// 				return reject(err);
	// 			}

	// 			const salt = saltBuffer.toString("hex");

	// 			crypto.scrypt(password, salt, 32, (err, hashedPasswordBuffer) => {
	// 				if (err) {
	// 					return reject(err);
	// 				}

	// 				const hashedPassword = hashedPasswordBuffer.toString("hex");
	// 				const sql =
	// 					"INSERT INTO users (username, password, salt) VALUES (?, ?, ?)";

	// 				db.run(sql, [username, hashedPassword, salt], function (err) {
	// 					if (err) {
	// 						return reject(err);
	// 					}

	// 					resolve(new User(this.lastID, username));
	// 				});
	// 			});
	// 		});
	// 	});
	// };
}

export default UserDAO;
