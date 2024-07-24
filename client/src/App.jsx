import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./App.css";

import { useEffect, useState } from "react";
import { Container } from "react-bootstrap";
import { Routes, Route, Outlet, Navigate, useLocation } from "react-router-dom";

import { NavHeader } from "./components/NavHeaderComponent";
import NotFound from "./components/NotFoundComponent";
import { LoginForm } from "./components/AuthComponents";
import { ProfilePage } from "./components/ProfileComponents";
import { API } from "./API.mjs";
import { Home } from "./components/HomeComponent";
import { Game } from "./components/GameComponents";

import UserContext from "./contexts/userContext";
import { Footer } from "./components/FooterComponents";

function App() {
	const [loggedIn, setLoggedIn] = useState(false);
	const [user, setUser] = useState({});
	const [isPlaying, setIsPlaying] = useState(false);
	const [startingScore] = useState(0);
	const location = useLocation();
	const wantedProfile = useLocation().state?.wanted === "profile";

	useEffect(() => {
		const getUserInfo = async () => {
			try {
				const user = await API.getUserInfo(); // we have the user info here
				setLoggedIn(true);
				setUser(user);
			} catch (err) {
				setLoggedIn(false);
				setUser({});
				stopPlaying();
			}
		};
		getUserInfo();
	}, [user.username]);

	useEffect(() => {
		if (!location.pathname.includes("/play")) {
			stopPlaying();
		}
	}, [location.pathname]);

	const handleLogin = async (credentials) => {
		try {
			const user = await API.logIn(credentials);
			setLoggedIn(true);
			setUser(user);
			stopPlaying();
		} catch (err) {
			console.error(err);
		}
	};

	const handleLogout = async () => {
		await API.logOut();
		// clean up everything
		setLoggedIn(false);
		setUser({});
		stopPlaying();
	};

	const startPlaying = () => {
		setIsPlaying(true);
	};

	const stopPlaying = () => {
		setIsPlaying(false);
	};

	return (
		<UserContext.Provider
			value={{
				user,
			}}
		>
			<Routes>
				<Route
					element={
						<>
							<NavHeader handleLogout={handleLogout} loggedIn={loggedIn} />
							<Container fluid className="mt-3">
								<Outlet />
								<Footer />
							</Container>
						</>
					}
				>
					<Route path="*" element={<NotFound />} />
					<Route index path="/" element={<Home loggedIn={loggedIn} />} />

					<Route
						path="/login"
						element={
							loggedIn ? (
								wantedProfile ? (
									<Navigate replace to="/profile" state={{ wanted: "" }} />
								) : (
									<Navigate replace to="/" />
								)
							) : (
								<LoginForm login={handleLogin} />
							)
						}
					/>

					<Route
						path="/profile"
						element={
							loggedIn ? (
								<ProfilePage />
							) : (
								<Navigate replace to="/login" state={{ wanted: "profile" }} />
							)
						}
					/>
					<Route
						path="/play"
						element={
							<Game
								loggedIn={loggedIn}
								startingScore={startingScore}
								isPlaying={isPlaying}
								startPlaying={startPlaying}
								stopPlaying={stopPlaying}
							/>
						}
					/>
				</Route>
			</Routes>
		</UserContext.Provider>
	);
}

export default App;
