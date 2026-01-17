import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { UserProvider } from "./contexts/userProvider";
import { MessageProvider } from "./contexts/messageStateProvider";
import { PromptProvider } from "./components/PromptContext";
import { EditVolumeProvider } from "./contexts/EditVolumeContext";

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
