import { Game, GameStatus, Round } from "../components/game.mjs";
import { db } from "../db/db.mjs";
import { gamesFromUsernameSQL } from "../db/query.mjs";
import User from "../components/user.mjs";
import dayjs from "dayjs";

class GameDAO {
	constructor() {}

	getGamesHistory = (username) => {
		return new Promise((resolve, reject) => {
			try {
				db.all(gamesFromUsernameSQL, [username], (err, rows) => {
					if (err) {
						return reject(err);
					}

					if (!rows) {
						return resolve({ error: "User not found!" });
					}

					if (rows.length === 0) {
						return resolve([]);
					}

					const games = [];
					const gameMap = new Map();

					rows.forEach((row) => {
						const gameId = row.game_id;
						if (!gameMap.has(gameId)) {
							const game = new Game(row.game_id, row.game_score, row.game_date);
							gameMap.set(gameId, game);
							games.push(game);
						}

						const round = new Round(
							row.round_id,
							row.timeout ? 0 : row.meme_caption_score,
							row.meme_file_name
						);

						const game = gameMap.get(gameId);
						game.setRounds([...game.getRounds(), round]);
					});

					const gameList = Array.from(gameMap.values());
					return resolve(gameList);
				});
			} catch (error) {
				return reject(error);
			}
		});
	};

	getGameById = (id) => {
		return new Promise((resolve, reject) => {
			try {
				const sql = "SELECT * FROM games WHERE id = ?";
				db.get(sql, [id], (err, row) => {
					if (err) {
						return reject(err);
					}
					if (!row) {
						return resolve({ error: "User not found!" });
					}
					const user = new User(row.id, row.username, row.email);
					return resolve(user);
				});
			} catch (error) {
				return reject(error);
			}
		});
	};

	createNewGame = (userId, score, date) => {
		return new Promise((resolve, reject) => {
			try {
				const utcDate = dayjs(date).utc().format("YYYY-MM-DD HH:mm:ss");

				const status = GameStatus.IN_PROGRESS;
				const newGameSQL =
					"INSERT INTO games (user_id, score, date, status) VALUES (?, ?, ?, ?)";
				db.run(newGameSQL, [userId, score, utcDate, status], function (err) {
					if (err) {
						return reject(err);
					}
					return resolve(this.lastID);
				});
			} catch (error) {
				return reject(error);
			}
		});
	};

	finishGame = (gameId) => {
		return new Promise((resolve, reject) => {
			try {
				const finalScoreSQL = `
				SELECT SUM(mc.score) AS total_score
				FROM rounds r
				JOIN meme_captions mc ON r.meme_caption_id = mc.id
				WHERE r.game_id = ?;`;

				db.get(finalScoreSQL, [gameId], (err, row) => {
					if (err) {
						return reject(err);
					}
					const status = GameStatus.COMPLETED;
					const finalScore = row.total_score;
					const updateGameSQL =
						"UPDATE games SET score = ?, status = ? WHERE id = ?";
					db.run(updateGameSQL, [finalScore, status, gameId], function (err) {
						if (err) {
							return reject(err);
						}
						return resolve(finalScore);
					});
				});
			} catch (error) {
				return reject(error);
			}
		});
	};

	saveRound = (gameId, memeCaptionId, timeout) => {
		return new Promise((resolve, reject) => {
			try {
				const insertRoundSQL =
					"INSERT INTO rounds (game_id, meme_caption_id, timeout) VALUES (?, ?, ?)";
				db.run(
					insertRoundSQL,
					[gameId, memeCaptionId, timeout],
					function (err) {
						if (err) {
							return reject(err);
						}

						const roundPlayedSQL =
							"SELECT COUNT(*) as count FROM rounds WHERE game_id = ?";

						db.get(roundPlayedSQL, [gameId], (err, row) => {
							if (err) {
								return reject(err);
							}

							const isLimitReached = Number(row.count) >= 3;

							return resolve(isLimitReached);
						});
					}
				);
			} catch (error) {
				return reject(error);
			}
		});
	};

	cleanUnfinishedGames = () => {
		return new Promise((resolve, reject) => {
			try {
				// Delete rounds with status "IN_PROGRESS" and date at least 2 hours old
				const cleanUnfinishedGamesSQL = `
				DELETE FROM rounds
				WHERE game_id IN (
						SELECT id
						FROM games
						WHERE status = 'IN_PROGRESS'
						AND datetime(date) <= datetime('now', '-2 hours')
				);`;
				db.run(cleanUnfinishedGamesSQL, function (err) {
					if (err) {
						return reject(err);
					}

					const deleteRounds = this.changes;

					// Delete games with status "IN_PROGRESS" that are not completed in the last 2 hours
					const deleteGamesQuery = `
					DELETE FROM games
					WHERE status = 'IN_PROGRESS'
					AND datetime(date) <= datetime('now', '-2 hours');
					`;
					db.run(deleteGamesQuery, function (err) {
						if (err) {
							return reject(err);
						}
						console.log(
							`Cleaned ${
								this.changes
							} unfinished games and ${deleteRounds} related rounds at ${dayjs().format()}`
						);
						return resolve();
					});
				});
			} catch (error) {
				return reject(error);
			}
		});
	};
}

export default GameDAO;
