import { Col, Container, Nav, Navbar, Row } from "react-bootstrap";
import { LoginButton, LogoutButton } from "./AuthComponents";
import { ProfileAvatar } from "./ProfileComponents";

import PropTypes from "prop-types";
import { useContext } from "react";
import UserContext from "../contexts/userContext";
import { Link } from "react-router-dom";

import "./NavHeaderComponent.css";

function NavHeader(props) {
	const { user, isPlaying } = useContext(UserContext);
	const { loggedIn, handleLogout } = props;

	return (
		<Navbar id="navheader" className="shadow" data-bs-theme="dark">
			<Container fluid>
				<Nav.Link
					as={Link}
					to={loggedIn ? "/profile" : "/login"}
					state={{ wanted: "profile" }}
				>
					<Container>
						<Row>
							<Col>
								<ProfileAvatar className="mx-0 my-auto" />
							</Col>
							<Col className="lead my-auto mx-0">
								<i className="text-decoration-underline">
									{user.username ? user.username : "Guest"}
								</i>
							</Col>
						</Row>
					</Container>
				</Nav.Link>

				<Navbar.Brand as={Link} to={"/"} className="mx-auto">
					<Container>
						<Row>
							<Col>
								<SiteLogo width={50} height={50} />
							</Col>
							<Col>
								<p className="h1 text-inline text-uppercase">
									What Do You Meme?
								</p>
							</Col>
							<Col>
								<SiteLogo width={50} height={50} />
							</Col>
						</Row>
					</Container>
				</Navbar.Brand>

				{loggedIn ? (
					<LogoutButton logout={handleLogout} disabled={isPlaying} />
				) : (
					<LoginButton disabled={isPlaying} />
				)}
			</Container>
		</Navbar>
	);
}

NavHeader.propTypes = {
	handleLogout: PropTypes.func,
	loggedIn: PropTypes.bool,
};

function SiteLogo(props) {
	return (
		<img
			src="/icons/doge.png"
			width={props.width || 30}
			height={props.height || 30}
			className="d-inline-block align-top"
			alt="'What Do You Meme?' Logo"
		/>
	);
}

SiteLogo.propTypes = {
	width: PropTypes.number,
	height: PropTypes.number,
};

export { NavHeader, SiteLogo };
