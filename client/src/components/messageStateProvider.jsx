import { createContext, useState } from 'react';

const messageContext = createContext();

function MessageProvider({ children }){
  const [message, setMessage] = useState([]);
  const [type, setType] = useState("Error")

  const addMessage = (newMessage) => {
    setMessage((prevMessages) => [...prevMessages, newMessage]);
    setTimeout(() => {
      setMessage((prevMessages) => prevMessages.filter((message) => message !== newMessage));
    }, 5000);
  };
  const setMessageType = (newType) => {
    setType(newType);
    setTimeout(() => {
      setType("Error");
    }, 5000);
  }

  return (
    <messageContext.Provider value={{ message, addMessage, type, setMessageType }}>
      {children}
    </messageContext.Provider>
  );
};

export { messageContext, MessageProvider };
