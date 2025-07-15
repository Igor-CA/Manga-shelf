import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../components/userProvider";
import { Link, useNavigate } from "react-router-dom";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import SideNavbar from "../../components/SideNavbar";
import axios from "axios";
import "./NotificationsPage.css";

const options = [
	{
		label: "Novos volumes",
		id: "volumes",
	},
	{
		label: "Seguidores",
		id: "followers",
	},
	{
		label: "Novas funcionalidades",
		id: "updates",
	},
];

const fetchNotifications = async (page, params) => {
	try {
		const response = await axios({
			method: "GET",
			withCredentials: true,
			headers: {
				Authorization: import.meta.env.REACT_APP_API_KEY,
			},
			params: {
				page: page,
				...params,
			},
			url: `${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/api/data/user-notifications`,
		});
		const resultList = response.data;
		return resultList;
	} catch (error) {
		console.error("Error fetching series list:", error);
	}
};

export default function NotificationsPage() {
	const { user, isFetching } = useContext(UserContext);
	const navigate = useNavigate();

	const [sitePage, setSitePage] = useState(1);
	const [volumesPage, setVolumesPage] = useState(1);
	const [followersPage, setFollowersPage] = useState(1);

	const [siteNotifications, setSiteNotifications] = useState([]);
	const [volumesNotifications, setVolumesNotifications] = useState([]);
	const [followersNotifications, setFollowersNotifications] = useState([]);

	useEffect(() => {
		const fetchFirstBatch = async () => {
			const lists = await fetchNotifications();

			setSiteNotifications(lists.updates);
			setVolumesNotifications(lists.volumes);
			setFollowersNotifications(lists.followers);
			setSitePage(2);
			setVolumesPage(2);
			setFollowersPage(2);
		};
		fetchFirstBatch();
	}, []);

	useEffect(() => {
		if (!isFetching && !user) {
			navigate("/");
		}
	}, [isFetching, user, navigate]);

	const handleMoreVolumes = async () => {
		const list = await fetchNotifications(volumesPage, { type: "volumes" });
		setVolumesPage((prev) => prev + 1);
		setVolumesNotifications((prev) => [...prev, ...list]);
	};
	const handleMoreFollowers = async () => {
		const list = await fetchNotifications(followersPage, {
			type: "followers",
		});
		setFollowersPage((prev) => prev + 1);
		setFollowersNotifications((prev) => [...prev, ...list]);
	};
	const handleMoreSite = async () => {
		const list = await fetchNotifications(sitePage, { type: "site" });
		setSitePage((prev) => prev + 1);
		setSiteNotifications((prev) => [...prev, ...list]);
	};

	return (
		<div className="container page-content notifications-page">
			{user && (
				<>
					<SideNavbar title={"Notificações"} options={options} />
					<div className="notifications-container">
						<div className="notifications-group">
							<h2 className="notifications-group__title" id="volumes">
								Novos volumes
							</h2>
							<ul className="notifications-list">
								{volumesNotifications.map((notification, index) => {
									return (
										<Notification notification={notification} key={index} />
									);
								})}
							</ul>
							{volumesNotifications.length === 0 ? (
								<p className="notification-missing">
									Nenhuma notificação desse tipo no momento
								</p>
							) : (
								<button className="button" onClick={handleMoreVolumes}>
									Mostrar mais
								</button>
							)}
						</div>

						<div className="notifications-group">
							<h2 className="notifications-group__title" id="followers">
								Seguidores
							</h2>
							<ul className="notifications-list">
								{followersNotifications.map((notification, index) => {
									return (
										<Notification notification={notification} key={index} />
									);
								})}
							</ul>
							{followersNotifications.length === 0 ? (
								<p className="notification-missing">
									Nenhuma notificação desse tipo no momento
								</p>
							) : (
								<button className="button" onClick={handleMoreFollowers}>
									Mostrar mais
								</button>
							)}
						</div>

						<div className="notifications-group">
							<h2 className="notifications-group__title" id="updates">
								Novas funcionalidades
							</h2>
							<ul className="notifications-list">
								{siteNotifications.map((notification, index) => {
									return (
										<Notification notification={notification} key={index} />
									);
								})}
							</ul>
							{siteNotifications.length === 0 ? (
								<p className="notification-missing">
									Nenhuma notificação desse tipo no momento
								</p>
							) : (
								<button className="button" onClick={handleMoreSite}>
									Mostrar mais
								</button>
							)}
						</div>
					</div>
				</>
			)}
		</div>
	);
}

function Notification({ notification }) {
	const { type, text, imageUrl, associatedObject, date, seen, id, details } =
		notification;
	const [seenState, setSeenState] = useState(seen);
	const { setOutdated } = useContext(UserContext);
	const [showDetails, setShowDetails] = useState(false);

	const markAsSeen = async (id) => {
		if (seen) return;
		setSeenState(true);
		try {
			await axios({
				method: "PUT",
				withCredentials: true,
				headers: {
					Authorization: import.meta.env.REACT_APP_API_KEY,
				},
				data: {
					notification: id,
				},
				url: `${
					import.meta.env.REACT_APP_HOST_ORIGIN
				}/api/user/mark-notification-seen`,
			});
			setOutdated(true);
		} catch (error) {
			setSeenState(seen);
			console.error("Error fetching series list:", error);
		}
	};

	function extractParts(text) {
		const regex =
			/^(?:Um novo volume de\s+(.*?)\s+foi adicionado ao site|(.+?)\s+Começou a te seguir)$/;
		const match = text.match(regex);
		if (!match) return [text]; // Return null if no match is found

		if (match[1]) {
			return ["Um novo volume de ", match[1], " foi adicionado ao site"];
		} else if (match[2]) {
			return [match[2], " começou a te seguir"];
		}

		return null;
	}
	function timeAgo(date) {
		const now = new Date();
		const givenDate = new Date(date);
		const diff = Math.floor((now - givenDate) / 1000); // Difference in seconds

		const intervals = [
			{ label: "ano", seconds: 31536000 },
			{ label: "mês", seconds: 2592000 },
			{ label: "semana", seconds: 604800 },
			{ label: "dia", seconds: 86400 },
			{ label: "hora", seconds: 3600 },
			{ label: "minuto", seconds: 60 },
			{ label: "segundo", seconds: 1 },
		];

		for (const interval of intervals) {
			const count = Math.floor(diff / interval.seconds);
			if (count >= 1) {
				if(interval.label === "mês" && count > 1)
					return `${count} meses atrás`;
				return `${count} ${interval.label}${count > 1 ? "s" : ""} atrás`;
			}
		}

		return "just now";
	}

	const textList = extractParts(text);
	const time = timeAgo(date);
	return (
		<li className="notification_container" onClick={() => markAsSeen(id)}>
			<div className="notification">
				<NotificationImage
					imageUrl={imageUrl}
					type={type}
					associatedObject={associatedObject}
					userName={textList[0]}
				></NotificationImage>
				<p className="notification-text">
					{type === "volumes" && (
						<>
							{textList[0]}{" "}
							<Link to={`/volume/${associatedObject}`}>{textList[1]}</Link>{" "}
							{textList[2]}
						</>
					)}
					{type === "followers" && (
						<>
							<Link to={`/user/${textList[0]}`}>{textList[0]}</Link>{" "}
							{textList[1]}
						</>
					)}
					{type === "site" && <>{textList[0]}</>}
				</p>
				<div className="notification-date-container">
					<time className="notification-date" dateTime={date}>
						{time}
					</time>
					{details.length > 0 && (
						<div
							className="notification__icon-container"
							onClick={() => {
								setShowDetails((prev) => !prev);
							}}
						>
							{showDetails ? (
								<FaAngleUp className="notification__icon" />
							) : (
								<FaAngleDown className="notification__icon" />
							)}
						</div>
					)}
				</div>
			</div>
			{showDetails && (
				<ul className="notifications__list__container">
					{details.map((detail, id) => {
						return (
							<li key={id} className="notifications__list__item">
								{parseMessage(detail)}
							</li>
						);
					})}
				</ul>
			)}
			{!seen && !seenState && <div className="notification-not-seen"></div>}
		</li>
	);
}
const parseMessage = (message) => {
	const regex = /@(\w+)/g;
	const parts = message.split(regex);

	return parts.map((part, index) =>
		index % 2 === 0 ? (
			part
		) : (
			<Link key={index} to={`/user/${part}`} className="mention">
				@{part}
			</Link>
		)
	);
};

const NotificationImage = ({ imageUrl, type, associatedObject, userName }) => {
	const pictureSRC = `${import.meta.env.REACT_APP_HOST_ORIGIN}/images`;

	const imageSRC = `${import.meta.env.REACT_APP_HOST_ORIGIN}${
		imageUrl ? imageUrl : "/images/deffault-profile-picture.webp"
	}`;
	return (
		<Link
			className={`notification-image-container ${
				type !== "volumes" && "notification-image-container--square"
			}`}
			to={`${
				type === "volumes"
					? "/volume/" + associatedObject
					: type === "followers"
					? "/user/" + userName
					: "/"
			}`}
		>
			{type === "volumes" ? (
				<img
					src={`${pictureSRC}/medium/${imageUrl}`}
					srcSet={`
				${pictureSRC}/small/${imageUrl} 100w,
				${pictureSRC}/medium/${imageUrl} 400w, 
				${pictureSRC}/large/${imageUrl} 700w,
				${pictureSRC}/extralarge/${imageUrl} 1000w,`}
					sizes=" (min-width: 1024px) 15vw, 
					(min-width: 768px) 20vw, 
					(min-width: 360px) and (max-width: 768px) 35vw, 
					(max-width: 320px) 50vw"
					alt={`notification picture`}
					className="notification-image"
				/>
			) : (
				<img
					src={imageSRC}
					alt="user profile"
					className="notification-image"
				></img>
			)}
		</Link>
	);
};
