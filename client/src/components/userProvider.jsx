import { createContext, useState, useEffect } from "react";
import axios from "axios";

const UserContext = createContext(null);

function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [outdated, setOutdated] = useState(true); // Tracks if user data needs refreshing
  const [isFetching, setIsFetching] = useState(true); // Tracks initial loading state

  const fetchLoggedUser = async () => {
    try {
      const res = await axios({
        method: "GET",
        withCredentials: true,
        headers: {
          Authorization: import.meta.env.REACT_APP_API_KEY,
        },
        url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/data/user/logged-user`,
      });

      if (res.data.msg) {
        setUser(null); 
      } else {
        setUser(res.data); 
      }

      setOutdated(false); 
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null); 
    } finally {
      setIsFetching(false); 
    }
  };

  useEffect(() => {
    if (outdated) {
      fetchLoggedUser();
    }
  }, [outdated]);

  return (
    <UserContext.Provider value={{ user, setUser, outdated, setOutdated, isFetching }}>
      {isFetching ? "" : children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider };
