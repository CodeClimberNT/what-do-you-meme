import { useState } from "react";
import {
	Form,
	Button,
	Row,
	Col,
	FloatingLabel,
	FormGroup,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";

function LoginForm(props) {
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleSubmit = (event) => {
		try {
			setSubmitting(true);
			event.preventDefault();
			const credentials = { username, password };
			props.login(credentials);
		} catch (error) {
			console.error(error);
		} finally{
			setSubmitting(false)
		}
	};

	return (
		<Row>
			<Col md={6} className="mx-auto">
				<Form onSubmit={handleSubmit}>
					<FormGroup controlId="username" className="my-3">
						<FloatingLabel label="Username">
							<Form.Control
								type="text"
								value={username}
								onChange={(ev) => setUsername(ev.target.value)}
								required={true}
							/>
						</FloatingLabel>
					</FormGroup>

					<FormGroup controlId="password" className="mb-3">
						<FloatingLabel label="Password">
							<Form.Control
								type="password"
								value={password}
								onChange={(ev) => setPassword(ev.target.value)}
								required={true}
								minLength={6}
							/>
						</FloatingLabel>
					</FormGroup>

					<Row>
						<Col>
							<Button
								type="submit"
								className="my-bg-blue border-0 fs-3 rounded-pill px-3 text-center"
								disabled={submitting}
							>
								Login
							</Button>

							<Link
								className="btn btn-danger mx-2 fs-3 rounded-pill px-3 text-center"
								to={"/"}
							>
								Cancel
							</Link>
						</Col>
					</Row>
				</Form>
			</Col>
		</Row>
	);
}

LoginForm.propTypes = {
	login: PropTypes.func.isRequired,
};

function LoginButton(props) {
	const handleLogin = (e) => {
		if (props.disabled) {
			e.preventDefault();
			return;
		}
	};
	return (
		<Button
			as={Link}
			to={"/login"}
			onClick={handleLogin}
			state={{ wanted: "login" }}
			disabled={props.disabled}
			className="border-0 rounded-pill my-bg-blue my-text-white py-2 px-4 shadow"
		>
			Login
		</Button>
	);
}
LoginButton.propTypes = {
	disabled: PropTypes.bool,
};

function LogoutButton(props) {
	const handleLogout = (e) => {
		if (props.disabled) {
			e.preventDefault();
			return;
		}
		props.logout();
	};
	return (
		<Button
			as={Link}
			to={"/"}
			onClick={handleLogout}
			disabled={props.disabled}
			className="border-0 rounded-pill my-bg-dark my-text-white py-2 px-4 shadow"
		>
			Logout
		</Button>
	);
}

LogoutButton.propTypes = {
	logout: PropTypes.func.isRequired,
	disabled: PropTypes.bool,
};

export { LoginForm, LoginButton, LogoutButton };
