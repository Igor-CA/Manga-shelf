import { createContext, useState } from "react";

const UserContext = createContext(null);

function UserProvider(props) {
	const [user, setUser] = useState();
	const [outdated, setOutdated] = useState(true);
	return (
		<UserContext.Provider value={{user, setUser, outdated, setOutdated}}>
			{props.children}
		</UserContext.Provider>
	);
}

export { UserContext, UserProvider };
