import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SELF_RESTORING_PATHS = ["/", "/browse", "/browse/user"];
const isSelfRestoringPath = (pathname) => SELF_RESTORING_PATHS.includes(pathname);

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
