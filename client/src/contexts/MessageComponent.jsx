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
	const { messages } = useContext(messageContext);

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

	const groups = [];
	messages.forEach((message) => {
		const last = groups[groups.length - 1];
		if (last && last.type === message.type) {
			last.items.push(message);
		} else {
			groups.push({ type: message.type, items: [message] });
		}
	});

	return (
		<>
			{messages?.length > 0 && (
				<div className="message_box__container">
					{groups.map((group) => (
						<div
							key={group.items[0].id}
							className={`message_box ${getClass(group.type)}`}
						>
							<FontAwesomeIcon icon={getIcon(group.type)} size="lg" />
							<div>
								{group.items.map((message) => (
									<p
										key={message.id}
										className="message_box__message"
									>
										{message.text}
									</p>
								))}
							</div>
						</div>
					))}
				</div>
			)}
		</>
	);
}