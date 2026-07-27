import { Component } from "react";
import { Link, useLocation } from "react-router-dom";
import "../pages/404Page/NotFound.css";
import "./ErrorBoundary.css";

class ErrorBoundaryView extends Component {
	constructor(props) {
		super(props);
		this.state = { error: null };
	}

	static getDerivedStateFromError(error) {
		return { error };
	}

	componentDidCatch(error, info) {
		console.error("Erro não tratado na página:", error, info.componentStack);
	}

	render() {
		const { error } = this.state;

		if (!error) return this.props.children;

		return (
			<div className="page-content">
				<div className="container">
					<div className="not-found">
						<h1>Ops!</h1>
						<p>Parece que algo deu errado ao carregar essa página</p>
						<p>Tente recarregar a página para ver se o problema se resolve</p>
						<p>
							Caso o erro persista nos mande detalhes na área de{" "}
							<Link to="/feedback" className="not-found--link">
								feedback
							</Link>{" "}
							e tentaremos resolver o quanto antes
						</p>
						{import.meta.env.REACT_APP_DEV && (
							<pre className="error-page__details">{error.message}</pre>
						)}
						<div className="call-to-action-container">
							<button
								type="button"
								className="call-to-action error-page__reload"
								onClick={() => window.location.reload()}
							>
								Recarregar a página
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}
}

export default function ErrorBoundary({ children }) {
	const { pathname } = useLocation();

	return <ErrorBoundaryView key={pathname}>{children}</ErrorBoundaryView>;
}
