import express from "express";

import morgan from "morgan";
import cors from "cors";
import { check, validationResult } from "express-validator";

import passport from "passport";
import LocalStrategy from "passport-local";
import session from "express-session";

import UserDAO from "./dao/user-dao.mjs";
import GameDAO from "./dao/game-dao.mjs";
import MemeDAO from "./dao/meme-dao.mjs";
import dayjs from "dayjs";

import utc from "dayjs/plugin/utc.js";
import { GameStatus } from "./components/game.mjs";

/**
 * Preludes
 */
dayjs.extend(utc);

const userDao = new UserDAO();
const gameDao = new GameDAO();
const memeDao = new MemeDAO();

/**
 * Initialize the server
 */
const app = new express();
const port = 3001;

/**
 * Middleware
 */
app.use(express.static("public"));

app.use(express.json());
app.use(morgan("dev"));

/**
 * Setup and enable CORS
 */
const corsOptions = {
	origin: "http://localhost:5173",
	optionsSuccessStatus: 200,
	credentials: true,
};
app.use(cors(corsOptions));

/**
 * Passport: set up local strategy
 */
passport.use(
	new LocalStrategy(async function verify(username, password, cb) {
		const user = await userDao.getUser(username, password);
		if (!user) return cb(null, false, "Incorrect username or password");

		return cb(null, user); // NOTE: user info in the session (all fields returned by userDao.getUser, i.e, id, username, name)
	})
);

passport.serializeUser(function (user, cb) {
	cb(null, user);
});

passport.deserializeUser(function (user, cb) {
	// this user is id, username
	return cb(null, user);
	// if needed, we can do extra check here (e.g., double check that the user is still in the database, etc.)
});

const isLoggedIn = (req, res, next) => {
	if (req.isAuthenticated()) {
		return next();
	}
	return res.status(401).json({ error: "Not authorized" });
};

app.use(
	session({
		secret: "how2meme",
		resave: false,
		saveUninitialized: false,
	})
);
app.use(passport.authenticate("session"));

/**
 * ROUTES
 */

// GET /api/users/<username>
// Future implementation of admin to retrieve not self
app.get(
	"/api/users/:username",
	isLoggedIn,
	[check("username").notEmpty().isAlphanumeric()],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}
			const user = await userDao.getUserByUsername(req.params.username);
			if (user.error) res.status(404).json(user);
			else res.json(user);
		} catch {
			res.status(500).end();
		}
	}
);

// GET /api/games/history
app.get(
	"/api/games/history/:username",
	isLoggedIn,
	[check("username").notEmpty().isAlphanumeric()],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}
			if (req.user.username !== req.params.username) {
				return res
					.status(401)
					.json({ error: "Not authorized! You cannot see another's history!" });
			}

			const games = await gameDao.getGamesHistory(req.params.username);
			if (games.error) {
				return res.status(404).json(games);
			}
			return res.json(games);
		} catch {
			res.status(500).end();
		}
	}
);

app.get("/api/games/new", async (req, res) => {
	try {
		const memeToPlay = await memeDao.getMemeWithSevenCaptions();
		if (memeToPlay.error) {
			return res.status(404).json(memeToPlay);
		}

		res.status(200).json({
			gameId: -1,
			gameStatus: GameStatus.COMPLETED,
			newRound: memeToPlay,
		});
	} catch (err) {
		console.error(err);
		res.status(500).end();
	}
});

/**
 * get result of a combination of meme and caption using query
 */
app.get(
	"/api/memes/:memeId/captions/:captionId",
	[
		check("memeId").notEmpty().isNumeric(),
		check("captionId").notEmpty().isNumeric(),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}

			const { memeId, captionId } = req.params;
			const { score } = await memeDao.getScoreAndIdFromMemeAndCaption(
				memeId,
				captionId
			);
			if (score.error) {
				return res.status(404).json(score);
			}
			res.json({ score });
		} catch (err) {
			console.error(err);
			res.status(500).end();
		}
	}
);

app.post(
	"/api/games/new",
	isLoggedIn,
	[check("score").notEmpty(),],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}

			const gameId = await gameDao.createNewGame(
				req.user.id,
				req.body.score,
			);

			const memeToPlay = await memeDao.getMemeWithSevenCaptions();
			if (memeToPlay.error) {
				return res.status(404).json(memeToPlay);
			}

			// memeToPlay.resetCaptionsScore();
			res.status(201).json({
				gameId,
				lastScore: 0,
				gameStatus: GameStatus.IN_PROGRESS,
				newRound: memeToPlay,
			});
		} catch (err) {
			console.error(err);
			res.status(500).end();
		}
	}
);

app.post(
	"/api/games/next",
	isLoggedIn,
	[
		check("gameId").notEmpty().isNumeric(),
		check("answer").notEmpty().isObject(),
		check("memeSeen").notEmpty().isArray(),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}
			const { gameId, answer, memeSeen } = req.body;

			if (!answer.memeId || !answer.captionId || answer.timeout === undefined) {
				return res.status(422).json({ error: "Invalid answer!" });
			}

			const { score: scoreLastChoice, id: id } =
				await memeDao.getScoreAndIdFromMemeAndCaption(
					answer.memeId,
					answer.captionId
				);

			const gameStatus = (await gameDao.saveRound(gameId, id, answer.timeout))
				? GameStatus.COMPLETED
				: GameStatus.IN_PROGRESS;

			const newRound = {
				gameId: gameId,
				lastScore: answer.timeout ? 0 : scoreLastChoice,
				gameStatus: gameStatus,
			};

			switch (gameStatus) {
				case GameStatus.IN_PROGRESS:
					const memeToPlay = await memeDao.getMemeWithSevenCaptions(memeSeen);
					if (memeToPlay.error) {
						return res.status(404).json(memeToPlay);
					}
					newRound.newRound = memeToPlay;
					break;

				case GameStatus.COMPLETED:
					const finalScore = await gameDao.finishGame(gameId);
					if (finalScore.error) {
						return res.status(404).json(finalScore);
					}
					// get most recent game played with only correct guess
					const game = await gameDao.getGameById(gameId);
					if (game.error) {	
						return res.status(404).json(game);
					}



					newRound.finalScore = finalScore;
					break;
			}

			return res.status(201).json(newRound);
		} catch {
			res.status(500).end();
		}
	}
);

// get all memes
// app.get("/api/memes", isLoggedIn ,async (req, res) => {
// 	try {
// 		const memes = await memeDao.getAllMemes();
// 		if (memes.error) res.status(404).json(memes);
// 		else res.json(memes);
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).end();
// 	}
// });

/**
 * Register new user


app.post(
	"/api/users",
	[
		check("username").notEmpty().isAlphanumeric(),
		check("password").notEmpty().isAlphanumeric(),
	],
	async (req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return res.status(422).json({ errors: errors.array() });
			}
			const { username, password } = req.body;
			const user = await userDao.registerUser(username, password);
			if (user.error) res.status(400).json(user);
			else res.status(201).json(user);
		} catch {
			res.status(500).end();
		}
	}
);
 */

/**
 * SESSIONS
 */

// POST /api/sessions
app.post("/api/sessions", function (req, res, next) {
	passport.authenticate("local", (err, user, info) => {
		if (err) return next(err);
		if (!user) {
			// display wrong login messages
			return res.status(401).send(info);
		}
		// success, perform the login
		req.login(user, (err) => {
			if (err) return next(err);

			// req.user contains the authenticated user, we send all the user info back
			return res.status(200).json(req.user);
		});
	})(req, res, next);
});

// GET /api/sessions/current
app.get("/api/sessions/current", (req, res) => {
	if (req.isAuthenticated()) {
		res.json(req.user);
	} else res.status(401).json({ error: "Not authenticated" });
});

// DELETE /api/session/current
app.delete("/api/sessions/current", (req, res) => {
	req.logout(() => {
		res.end();
	});
});

// /**
//  * DEBUG ROUTE
//  */
// app.delete("/api/reset", async (req, res) => {
// 	try {
// 		db.exec(resetAllSQL);
// 		res.status(204).end();
// 	} catch (err) {
// 		console.error(err);
// 		res.status(500).end();
// 	}
// });

/**
 * Cleanup hanging games
 */
// 2 hours in milliseconds
setInterval(gameDao.cleanUnfinishedGames, 2 * 60 * 60 * 1000);

/**
 * Start the server
 */
app.listen(port, () => {
	console.log(`Server listening at http://localhost:${port}`);
});
