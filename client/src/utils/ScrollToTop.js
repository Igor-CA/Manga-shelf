import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const isSelfRestoringPath = (pathname) =>
	pathname === "/" || pathname.startsWith("/browse");

const ScrollToTop = () => {
	const { pathname } = useLocation();
	const navigationType = useNavigationType();

	useEffect(() => {
		if (navigationType === "POP" && isSelfRestoringPath(pathname)) return;
		window.scrollTo(0, 0);
	}, [pathname, navigationType]);

	return null;
};

export default ScrollToTop;
