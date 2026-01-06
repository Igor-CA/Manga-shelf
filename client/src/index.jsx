import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserProvider } from "./components/userProvider";
import { MessageProvider } from "./components/messageStateProvider";
import { PromptProvider } from "./components/PromptContext";
import { EditVolumeProvider } from "./components/EditVolumeContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
	<React.StrictMode>
		<PromptProvider>
			<UserProvider>
				<MessageProvider>
					<EditVolumeProvider>
						<App />
					</EditVolumeProvider>
				</MessageProvider>
			</UserProvider>
		</PromptProvider>
	</React.StrictMode>
);
