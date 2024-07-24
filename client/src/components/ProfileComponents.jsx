import { Col, Container, Image, Row, Table } from "react-bootstrap";
import { API } from "../API.mjs";
import { useContext, useEffect, useState } from "react";

import UserContext from "../contexts/userContext";

function ProfilePage() {
	const { user } = useContext(UserContext);
	const [gameHistory, setGameHistory] = useState([]);
	const [numPlays, setNumPlays] = useState(0);
	const [highScore, setHighScore] = useState(0);
	const [totalScore, setTotalScore] = useState(0);

	useEffect(() => {
		if (user.username === undefined) {
			return;
		}

		API.getGameHistory(user.username)
			.then((fetchedHistory) => {
				setGameHistory(fetchedHistory);
				setNumPlays(fetchedHistory.length);
				setHighScore(
					// calculate the high score from the game history array
					fetchedHistory.reduce(
						(max, game) => (game.finalScore > max ? game.finalScore : max),
						0
					)
				);

				setTotalScore(
					// calculate the total score from the game history array
					fetchedHistory.reduce((total, game) => total + game.finalScore, 0)
				);
			})
			.catch((err) => {
				console.log("failed to get game history");
				console.error(err);
			});
	}, [user]);

	return (
		<Container fluid>
			<Row>
				<Col>
					<Table variant="success" className="h3 text-center">
						<thead>
							<tr>
								<th>Username</th>
								<th>Game Played</th>
								<th>High Score</th>
								<th>Total Score</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>{user.username}</td>
								<td>{numPlays}</td>
								<td>{highScore} / 15</td>
								<td>{totalScore}</td>
							</tr>
						</tbody>
					</Table>
				</Col>
			</Row>
			<Row className="mt-4">
				{gameHistory.map((game) => (
					<Table key={game.gameId} className="text-center">
						<thead>
							<tr>
								<th className="h1" colSpan={game.rounds.length}>
									Final Score: {game.finalScore}
								</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								{game.rounds.map((round, index) => (
									<td
										key={round.id}
										className="vh-75 w-25"
									>
										<Image
											src={round.image}
											alt={`Round ${index + 1}`}
											thumbnail="true"
											
											className="my-bg-dark mx-auto my-auto "
										/>
									</td>
								))}
							</tr>
							<tr>
								{game.rounds.map((round) => (
									<td className="h2" key={round.id}>
										{round.score}
									</td>
								))}
							</tr>
						</tbody>
					</Table>
				))}
			</Row>
		</Container>
	);
}

function ProfileAvatar() {
	const { user } = useContext(UserContext);
	return (
		<>
			{user.username ? (
				<p className="bi bi-person text-center display-4 mx-auto my-auto px-0 py-0" />
			) : (
				<p className="bi bi-person my-text-gray text-center display-4 mx-auto my-auto px-0 py-0" />
			)}
		</>
	);
}

export { ProfilePage, ProfileAvatar };
