/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import PropTypes from "prop-types";

import "./TimerComponent.css";

function Timer(props) {
	const { initialTime, onComplete, disabled, timeLeft, setTimeLeft } = props;
	const radius = 40;
	const circumference = 2 * Math.PI * radius;

	// Wrap onComplete in useCallback if it's passed from a parent component
	// This prevents unnecessary re-renders if onComplete changes less frequently

	useEffect(() => {
		// Update the timer every second
		if (disabled) return;

		const timer = setInterval(() => {
			setTimeLeft((prevTime) => {
				if (prevTime <= 1) {
					clearInterval(timer);
					onComplete && onComplete();
					return 0;
				}
				return prevTime - 1;
			});
		}, 1000);

		// Cleanup interval on component unmount
		return () => clearInterval(timer);
	}, [onComplete, disabled]);

	const strokeDashoffset = circumference * (1 - timeLeft / initialTime);
	const hue = (timeLeft / initialTime) * 120; // 120 is green, 0 is red

	return (
		<div className="mb-3 rounded-pill py-2 px-5 my-bg-white">
			<svg width="100" height="100" viewBox="0 0 100 100">
				<circle
					cx="50"
					cy="50"
					r={radius}
					fill="none"
					stroke={`hsl(${hue}, 100%, 50%)`}
					strokeWidth="10"
					strokeDasharray={circumference}
					strokeDashoffset={strokeDashoffset}
					transform="rotate(-90 50 50)"
					className="smooth-transition"
				/>
				<text
					x="50%"
					y="50%"
					dominantBaseline="middle"
					textAnchor="middle"
					fill="black"
					fontSize="1.3rem"
				>
					{timeLeft > 0 ? `${timeLeft}s` : "Time's Up!"}
				</text>
			</svg>
		</div>
	);
}

Timer.propTypes = {
	initialTime: PropTypes.number,
	onComplete: PropTypes.func,
	disabled: PropTypes.bool,
	timeLeft: PropTypes.number,
	setTimeLeft: PropTypes.func,
};

export default Timer;
