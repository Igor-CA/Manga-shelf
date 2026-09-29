import { createContext, useState, useEffect } from "react";
import axios from "axios";
import { readStorage, writeStorage } from "../utils/storage";

const UserContext = createContext(null);
const SESSION_HINT_KEY = "session-hint";

const clearSessionHint = () => writeStorage(SESSION_HINT_KEY, "");

const readSessionHint = () => {
  try {
    return JSON.parse(readStorage(SESSION_HINT_KEY)) || null;
  } catch {
    return null;
  }
};

function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [outdated, setOutdated] = useState(true); // Tracks if user data needs refreshing
  const [isFetching, setIsFetching] = useState(true); // Tracks initial loading state
  const [sessionHint] = useState(readSessionHint);

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

  useEffect(() => {
    if (isFetching) return;
    writeStorage(
      SESSION_HINT_KEY,
      user?.username
        ? JSON.stringify({
            username: user.username,
            notificationCount: user.notificationCount,
          })
        : ""
    );
  }, [user, isFetching]);

  const displayUser = user ?? (isFetching ? sessionHint : null);

  return (
    <UserContext.Provider
      value={{ user, setUser, outdated, setOutdated, isFetching, displayUser }}
    >
      {children}
    </UserContext.Provider>
  );
}

export { UserContext, UserProvider, clearSessionHint };
