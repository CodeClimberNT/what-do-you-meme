import { Button, Col, Container, Image, Row } from "react-bootstrap";
import { API, SERVER_URL } from "../API.mjs";
import PropTypes from "prop-types";
import { useEffect, useReducer, useState } from "react";
import { useNavigate } from "react-router-dom";
import Timer from "./TimerComponent";

import "./GameComponents.css";

const initialState = {
	roundsInfo: [],
	currentCaptions: [],
	nextCaptions: [],
	viewedMemes: [],
	currentMemeImage: null,
	currentMemeId: null,
	nextMemeImage: null,
	nextMemeId: null,
	gameId: null,
	gameStatus: null,
	selectedCaption: {},
	initialTime: 30,
	stopTimer: false,
	timeout: false,
	lastScore: -1,
	readyToPlay: true,
	readyToRecap: false,
	roundFinished: false,
};

function gameReducer(state, action) {
	switch (action.type) {
		case "SET_CAPTION":
			return {
				...state,
				readyToPlay: false,
				roundFinished: true,
				selectedCaption: action.payload,
				stopTimer: true,
			};
		case "SET_TIMEOUT":
			return {
				...state,
				timeout: true,
				stopTimer: true,
				readyToPlay: false,
				roundFinished: true,
				lastScore: 0,
				selectedCaption: { caption: "Time's up!", captionId: 42 },
			};
		case "SET_LAST_SCORE":
			return { ...state, lastScore: action.payload };
		case "UPDATE_GAME":
			return {
				...state,
				nextCaptions: action.payload.captions,
				gameId: action.payload.gameId,
				gameStatus: action.payload.gameStatus,
				nextMemeImage: `${SERVER_URL}memes/${action.payload.image}`,
				nextMemeId: action.payload.memeId,
				roundFinished: false,
				stopTimer: true,
				timeout: false,
				roundsInfo: [
					...state.roundsInfo,
					{
						memeId: state.currentMemeId,
						memeImage: state.currentMemeImage,
						score: action.payload.lastScore,
						caption: state.selectedCaption,
					},
				],
				lastScore: action.payload.lastScore,
				viewedMemes: [...state.viewedMemes, action.payload.memeId],
				readyToRecap: false,
			};
		case "START_GAME":
			return {
				...state,
				stopTimer: false,
				currentCaptions: action.payload.captions,
				gameId: action.payload.gameId,
				gameStatus: action.payload.gameStatus,
				currentMemeImage: `${SERVER_URL}memes/${action.payload.image}`,
				currentMemeId: action.payload.memeId,
				roundFinished: false,
				timeout: false,
				lastScore: action.payload.lastScore,
				viewedMemes: [...state.viewedMemes, action.payload.memeId],
			};
		case "GAME_FINISHED":
			return {
				...state,
				stopTimer: true,
				gameStatus: "COMPLETED",
				lastScore: action.payload.lastScore,
				finalScore: action.payload.finalScore,
				readyToRecap: false,
				roundsInfo: [
					...state.roundsInfo,
					{
						memeId: state.currentMemeId,
						memeImage: state.currentMemeImage,
						score: action.payload.lastScore,
						caption: state.selectedCaption,
					},
				],
			};
		case "START_NEXT_ROUND":
			return {
				...state,
				readyToPlay: true,
				stopTimer: false,
				timeout: false,
				selectedCaption: {},
				currentMemeId: state.nextMemeId,
				currentMemeImage: state.nextMemeImage,
				currentCaptions: state.nextCaptions,
				readyToRecap: false,
			};
		case "WATCH_RESULTS":
			return {
				...state,
				readyToRecap: true,
			};
		default:
			return state;
	}
}

function Game(props) {
	const [state, dispatch] = useReducer(gameReducer, initialState);
	const navigate = useNavigate();

	const { loggedIn, startingScore, isPlaying, startPlaying, stopPlaying } =
		props;

	const [timeLeft, setTimeLeft] = useState(state.initialTime);

	const handleCaptionClick = (caption) => {
		if (state.selectedCaption.caption) {
			return;
		}
		dispatch({ type: "SET_CAPTION", payload: caption });
	};

	const handleNextClick = async () => {
		setTimeLeft(state.initialTime);
		dispatch({ type: "START_NEXT_ROUND" });

		if ((state.gameStatus === "COMPLETED" && state.readyToRecap) || !loggedIn) {
			stopPlaying();
			navigate("/");
			return;
		}

		if (state.gameStatus === "COMPLETED" && !state.readyToRecap && loggedIn) {
			dispatch({ type: "WATCH_RESULTS" });
			return;
		}
	};

	const handleTimerComplete = () => {
		dispatch({ type: "SET_TIMEOUT" });
	};

	useEffect(() => {
		const gameController = async () => {
			if (!loggedIn) {
				{
					/*Game login for not logged user (only one round)*/
				}
				if (!isPlaying) {
					// set the game to playing
					startPlaying();
					try {
						const game = await API.getRandomMemeGame();
						const shuffledCaptions = game.newRound.captions.sort(
							() => Math.random() - 0.5
						);

						dispatch({
							type: "START_GAME",
							payload: {
								gameStatus: game.gameStatus,
								captions: shuffledCaptions,
								gameId: game.gameId,
								image: game.newRound.image,
								memeId: game.newRound.memeId,
							},
						});
					} catch (error) {
						console.error("Error fetching game:", error);
					}
					// if round ended
				} else if (state.roundFinished) {
					// if ended because of timeout set the score to 0
					if (!state.timeout) {
						// if the round ended because of a choice verify it
						// if ended because of timeout there is a case in the state that manage that
						const score = await API.verifyChoice(
							state.currentMemeId,
							state.selectedCaption.captionId
						);
						dispatch({ type: "SET_LAST_SCORE", payload: score.score });
					}
				}
			} else if (loggedIn) {
				{
					/* Game logic for logged in User with multiple rounds (3 by specification)*/
				}
				if (!isPlaying) {
					// start the game only one time
					try {
						startPlaying();

						const game = await API.startGame(startingScore);
						const shuffledCaptions = game.newRound.captions.sort(
							() => Math.random() - 0.5
						);

						dispatch({
							type: "START_GAME",
							payload: {
								gameStatus: game.gameStatus,
								captions: shuffledCaptions,
								gameId: game.gameId,
								image: game.newRound.image,
								memeId: game.newRound.memeId,
							},
						});
					} catch (error) {
						console.error("Error starting a new game:", error);
					}
					// end of the round
				} else if (state.roundFinished) {
					try {
						const nextRound = await API.nextRound({
							gameId: state.gameId,
							memeSeen: state.viewedMemes,
							answer: {
								memeId: state.currentMemeId,
								captionId: state.selectedCaption.captionId,
								timeout: state.timeout,
							},
						});
						{
							/* you played all the rounds */
						}
						if (nextRound.gameStatus === "COMPLETED") {
							dispatch({
								type: "GAME_FINISHED",
								payload: {
									lastScore: nextRound.lastScore,
									finalScore: nextRound.finalScore,
								},
							});
							{
								/* game is still on! */
							}
						} else {
							const shuffledCaptions = nextRound.newRound.captions.sort(
								() => Math.random() - 0.5
							);

							dispatch({
								type: "UPDATE_GAME",
								payload: {
									gameStatus: nextRound.gameStatus,
									captions: shuffledCaptions,
									gameId: nextRound.gameId,
									image: nextRound.newRound.image,
									memeId: nextRound.newRound.memeId,
									lastScore: nextRound.lastScore,
								},
							});
						}
					} catch (error) {
						console.error("Error Fetching Next Round: ", error);
					}
				}
			}
		};

		gameController();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [state.roundFinished]);

	return (
		<Container fluid>
			{!state.readyToRecap ? (
				<>
					<Row className="d-flex justify-content-between">
						<Col md={6} className="d-flex justify-content-center">
							<Timer
								initialTime={state.initialTime}
								onComplete={handleTimerComplete}
								disabled={state.stopTimer}
								timeLeft={timeLeft}
								setTimeLeft={setTimeLeft}
							/>
						</Col>
						<Col md={4} className="mx-auto">
							<div className="text-center fs-2 rounded-pill my-bg-blue py-2">
								Guess the description!
							</div>
						</Col>
					</Row>
					<Row className="d-flex justify-content-evenly mt-4">
						<Col md={6} className="d-flex justify-content-center">
							<MemeImage meme={state.currentMemeImage} className="mx-auto" />
						</Col>
						<Col md={6} className="my-auto mx-auto">
							{!state.roundFinished && state.readyToPlay ? (
								state.currentCaptions.map((caption) => (
									<Button
										disabled={state.selectedCaption.caption}
										key={caption.captionId}
										onClick={() => handleCaptionClick(caption)}
										className="my-bg-dark w-100 border-0 mb-3"
									>
										{caption.caption}
									</Button>
								))
							) : (
								<RoundResults
									loggedIn={loggedIn}
									gameStatus={state.gameStatus}
									lastScore={state.lastScore}
									currentCaptions={state.currentCaptions}
									selectedCaption={state.selectedCaption}
									handleNextClick={handleNextClick}
								/>
							)}
						</Col>
					</Row>
				</>
			) : (
				<GameRecap
					finalScore={state.finalScore}
					roundsInfo={state.roundsInfo}
					handleNextClick={handleNextClick}
				/>
			)}
		</Container>
	);
}

Game.propTypes = {
	loggedIn: PropTypes.bool,
	startingScore: PropTypes.number,
	isPlaying: PropTypes.bool,
	startPlaying: PropTypes.func,
	stopPlaying: PropTypes.func,
};

function RoundResults(props) {
	const {
		loggedIn,
		gameStatus,
		lastScore,
		currentCaptions,
		selectedCaption,
		handleNextClick,
	} = props;
	return (
		<>
			<Row>
				<div
					className={
						"display-3 mb-2 text-center " +
						(lastScore > 0 ? "my-text-correct" : "my-text-wrong")
					}
				>
					{lastScore > 0 ? "+" : ""} {lastScore} Points!
				</div>
			</Row>
			{currentCaptions.map((caption) => (
				<Row
					key={caption.captionId}
					className={
						"rounded-pill py-2 px-2 w-100 border-0 mb-3" +
						(caption.score > 0 ? " my-bg-correct" : " my-bg-wrong") +
						(caption.captionId === selectedCaption.captionId
							? " my-selected-caption"
							: "")
					}
				>
					{caption.caption}
				</Row>
			))}
			<Row>
				<Col>
					<Button
						onClick={handleNextClick}
						className="rounded-pill w-100 border-0 my-bg-blue"
					>
						{loggedIn ? (
							<i className="bi bi-fast-forward-btn">
								{gameStatus === "COMPLETED" ? " View Results" : " Next"}
							</i>
						) : (
							<i className="bi bi-arrow-counterclockwise"> Back to Home</i>
						)}
					</Button>
				</Col>
			</Row>
		</>
	);
}

RoundResults.propTypes = {
	loggedIn: PropTypes.bool,
	gameStatus: PropTypes.string,
	lastScore: PropTypes.number,
	currentCaptions: PropTypes.array,
	selectedCaption: PropTypes.object,
	handleNextClick: PropTypes.func,
};

function GameRecap(props) {
	const { finalScore, roundsInfo, handleNextClick } = props;
	return (
		<>
			<Row>
				<Col>
					<div
						className={
							"rounded-pill display-2 text-center my-text-black py-3" +
							(finalScore > 5 ? " my-bg-correct" : " my-bg-wrong")
						}
					>
						{finalScore > 5
							? `GG! You Got ${finalScore} Points!`
							: `You Got ${finalScore} Points! Try again to beat this score!`}
					</div>
				</Col>
			</Row>
			<Row className="my-3">
				{roundsInfo.map(
					(round) =>
						round.score > 0 && (
							<Col key={round.memeId} className="mx-auto">
								<MemeImage meme={round.memeImage} className="mx-auto" />

								<div className="text-center fs-3 rounded-pill my-bg-correct mt-2">
									{round.caption.caption}
								</div>
							</Col>
						)
				)}
			</Row>
			<Row>
				<Col md={6} className="mx-auto mt-4">
					<Button
						onClick={handleNextClick}
						className="rounded-pill w-100 border-0 my-bg-blue"
					>
						<i className="bi bi-arrow-counterclockwise"> Back to Home</i>
					</Button>
				</Col>
			</Row>
		</>
	);
}

GameRecap.propTypes = {
	finalScore: PropTypes.number,
	roundsInfo: PropTypes.array,
	handleNextClick: PropTypes.func,
};

function MemeImage(props) {
	return <Image className="meme-game" src={props.meme} />;
}

MemeImage.propTypes = {
	meme: PropTypes.string,
};

export { Game };
