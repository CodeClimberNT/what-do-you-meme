import dayjs from "dayjs";

class Game {
	constructor(gameId, score = 0, playDate = dayjs().now(), rounds = []) {
		this.gameId = gameId;
		this.finalScore = score;
		// use dayjs to parse the date if it is not null,
		// database stored in utc, here converted in local time,
		this.date = playDate && dayjs(playDate);
		this.rounds = rounds;
	}
	getRounds() {
		return this.rounds;
	}
	setRounds(rounds) {
		this.rounds = rounds;
	}
}

class Round {
	constructor(id, score, image) {
		this.id = id;
		this.score = score;
		this.memeImage = image;
	}
}


// Enum for game status
const GameStatus = {
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
};


export { Game, Round, GameStatus };

