import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserProvider } from "./components/userProvider";
import { MessageProvider } from "./components/messageStateProvider";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<UserProvider>
			<MessageProvider>
				<App />
			</MessageProvider>
		</UserProvider>
	</React.StrictMode>
);
