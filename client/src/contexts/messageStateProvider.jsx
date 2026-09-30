import { createContext, useCallback, useMemo, useRef, useState } from "react";

const messageContext = createContext();

function MessageProvider({ children }) {
	const [messages, setMessages] = useState([]);
	const idRef = useRef(0);

	const removeMessage = useCallback(
		(id) => setMessages((prev) => prev.filter((m) => m.id !== id)),
		[]
	);

	const addMessage = useCallback(
		(newMessage, type = "Error") => {
			const texts = Array.isArray(newMessage) ? newMessage : [newMessage];
			const added = texts.map((text) => ({
				id: ++idRef.current,
				text,
				type,
			}));

			setMessages((prev) => [...prev, ...added]);
			added.forEach((m) => setTimeout(() => removeMessage(m.id), 5000));
		},
		[removeMessage]
	);

	const value = useMemo(() => ({ messages, addMessage }), [messages, addMessage]);

	return (
		<messageContext.Provider value={value}>
			{children}
		</messageContext.Provider>
	);
}

export { messageContext, MessageProvider };
