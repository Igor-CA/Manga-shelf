import { useContext } from "react";
import { messageContext } from "./messageStateProvider";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
	faCheckCircle,
	faCircleXmark,
	faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
import "./Prompts.css";

export default function MessageComponent() {
	const { message, type } = useContext(messageContext);

	const getIcon = (type) => {
		switch (type) {
			case "Error":
				return faCircleXmark;
			case "Warning":
				return faExclamationTriangle;
			case "Success":
				return faCheckCircle;
			default:
				return faCircleXmark;
		}
	};
	const getClass = (type) => {
		switch (type) {
			case "Error":
				return "message_box--error";
			case "Warning":
				return "message_box--warning";
			case "Success":
				return "message_box--success";
			default:
				return "message_box--error";
		}
	};
	return (
		<>
			{message?.length > 0 && (
				<div className={`message_box ${getClass(type)}`}>
					<FontAwesomeIcon icon={getIcon(type)} size="lg" />
					<div>
						{message.map((erro, index) => {
							return (
								<p key={index} className="message_box__message">
									{erro}
								</p>
							);
						})}
					</div>
				</div>
			)}
		</>
	);
}