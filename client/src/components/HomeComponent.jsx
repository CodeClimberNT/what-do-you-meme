import { Col, Container, Row } from "react-bootstrap";

import { Link } from "react-router-dom";
import { useContext } from "react";

import UserContext from "../contexts/userContext";

import PropTypes from "prop-types";

function Home(props) {
	const { user } = useContext(UserContext);
	const { loggedIn } = props;

	return (
		<Container fluid>
			<Row>
				<Col className="text-center">
					<p className="h1">Are you ready?</p>
				</Col>
			</Row>
			{!loggedIn && (
				<Row>
					<Col className="text-center">
						<p className="h2">
							Log in to play the full game and view your past score!
						</p>
						<p className="h3">
							Or continue as <i>guest</i> and enjoy a quick game!
						</p>
					</Col>
				</Row>
			)}
			<Row className="mt-4">
				<Col className="text-center">
					<Link
						to="/play"
						className="text-white text-decoration-none rounded-pill mx-2 py-2 px-4 my-bg-primary"
					>
						Play as {user.username ? user.username : "Guest"}
					</Link>
					{!loggedIn && (
						<Link
							to="/login"
							className="text-white text-decoration-none rounded-pill mx-2 py-2 px-4 my-bg-blue"
						>
							Ok! Log me in!
						</Link>
					)}
				</Col>
			</Row>
		</Container>
	);
}

Home.propTypes = {
	loggedIn: PropTypes.bool.isRequired,
};

export { Home };
