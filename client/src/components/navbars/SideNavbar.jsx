import useActiveHeader from "../../utils/useActiveHeading";
import "./NavBar.css";

export default function SideNavbar({title, options}) {
	const activeId = useActiveHeader();

	const handleClick = (e, id) => {
		e.preventDefault();
		document.querySelector(`#${id}`).scrollIntoView({
			behavior: "smooth",
		});
	};

	const getStyle = (activeId, id) => {
		const activeStyle =
			"side-navbar__link side-navbar__link--active";
		const inactiveStyle = "side-navbar__link";
		return activeId === id ? activeStyle : inactiveStyle;
	};

	return (
		<aside className="side-aside">
			<section className="side-navbar-container">
				<p className="side-navbar-title">{title}</p>
				<nav>
					<ul>
						{options.map((option) => {
							return (
								<li className="side-navbar-item" key={option.id}>
									<a
										className={getStyle(
											activeId,
											option.id
										)}
										href={`#${option.id}`}
										onClick={(e) => {
											handleClick(e, option.id);
										}}
									>
										{option.label}
									</a>
								</li>
							);
						})}
						
					</ul>
				</nav>
			</section>
		</aside>
	);
}
