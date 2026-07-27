import { useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/userProvider";
import { usePrompt } from "../contexts/PromptContext";
import { stash } from "./returnTo";

export function useAuthGate() {
	const { user } = useContext(UserContext);
	const { confirm } = usePrompt();
	const navigate = useNavigate();
	const location = useLocation();

	return function ensureLogged(actionLabel, action) {
		if (user) {
			action();
			return;
		}

		confirm(
			`Você precisa estar logado para ${actionLabel}. Ir para o login?`,
			() => {
				stash(`${location.pathname}${location.search}`);
				navigate("/login");
			},
		);
	};
}
