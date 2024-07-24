import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";

const SERVER_URL = new URL("http://localhost:3001");

// new game for logged user
const startGame = async (startingScore) => {
	const response = await fetch(`${SERVER_URL}api/games/new`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify({ score: startingScore }),
	});
	if (!response.ok) {
		throw new Error("Internal server error");
	}

	const game = await response.json();
	return game;
};

// next round for logged user
const nextRound = async (roundPlayed) => {
	const response = await fetch(`${SERVER_URL}api/games/next`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		credentials: "include",
		body: JSON.stringify(roundPlayed),
	});

	if (!response.ok) {
		throw new Error("Internal server error");
	}
	const game = await response.json();
	return game;
};

// quick game for not logged user
const getRandomMemeGame = async () => {
	const response = await fetch(`${SERVER_URL}api/games/new`, {
		method: "GET",
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Internal server error");
	}

	const game = await response.json();
	return game;
};

// verify combination of meme and caption
const verifyChoice = async (memeId, captionId) => {
	const response = await fetch(
		`${SERVER_URL}api/memes/${memeId}/captions/${captionId}`,
		{
			method: "GET",
			credentials: "include",
		}
	);
	if (!response.ok) {
		throw new Error("Internal server error");
	}

	const game = await response.json();
	return game;
};

// retrieve game history for a user
const getGameHistory = async (username) => {
	const response = await fetch(`${SERVER_URL}api/games/history/${username}`, {
		method: "GET",
		credentials: "include",
	});
	if (!response.ok) {
		throw new Error("Internal server error");
	}
	if (response.status === 404) {
		return [];
	}

	dayjs.extend(utc);

	const gameHistory = await response.json();
	// redundant as the query in the server already sorts 
	// the games by date and the round by id but prefer to be double sure then sorry
	return gameHistory
		.toSorted((a, b) => {
			return dayjs.utc(b.date).isBefore(dayjs.utc(a.date)) ? -1 : 1;
		})
		.map((game) => {
			return {
				...game,
				rounds: game.rounds
					.sort((a, b) => a.id - b.id)
					.map((round) => {
						return {
							...round,
							image: `${SERVER_URL}/memes/${round.memeImage}`,
						};
					}),
				date: dayjs.utc(game.date).local().format("YYYY-MM-DD HH:mm:ss"),
			};
		});
};

const logIn = async (credentials) => {
	const response = await fetch(`${SERVER_URL}api/sessions`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		credentials: "include",
		body: JSON.stringify(credentials),
	});
	if (!response.ok) {
		const errDetails = await response.text();
		throw errDetails;
	}
	const user = await response.json();
	return user;
};

const getUserInfo = async () => {
	try {
		const response = await fetch(`${SERVER_URL}api/sessions/current`, {
			credentials: "include",
		});
		if (!response.ok) {
			throw new Error("Not authenticated");
		}
		const user = await response.json();
		return user;
	} catch (err) {
		throw new Error(err);
	}
};

const logOut = async () => {
	const response = await fetch(`${SERVER_URL}api/sessions/current`, {
		method: "DELETE",
		credentials: "include",
	});
	if (response.ok) return null;
};

const API = {
	getGameHistory,
	startGame,
	nextRound,
	verifyChoice,
	getRandomMemeGame,
	logIn,
	logOut,
	getUserInfo,
};
export { API, SERVER_URL };
