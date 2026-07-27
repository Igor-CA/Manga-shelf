import { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { UserContext } from "../contexts/userProvider";
import { stash } from "../utils/returnTo";

const RedirectShell = ({ to }) => (
	<div className="page-content">
		<Navigate to={to} replace />
	</div>
);

export default function RequireAuth({ children, adminOnly = false }) {
	const { user } = useContext(UserContext);
	const location = useLocation();

	if (!user) {
		stash(`${location.pathname}${location.search}`);
		return <RedirectShell to="/login" />;
	}

	if (adminOnly && !user.isAdmin) {
		return <RedirectShell to="/" />;
	}

	return children;
}
