import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../contexts/userProvider";
import { Link, useNavigate } from "react-router-dom";
import { FaAngleDown, FaAngleUp } from "react-icons/fa";
import SideNavbar from "../../components/navbars/SideNavbar";
import axios from "axios";
import "./NotificationsPage.css";

const options = [
	{
		label: "Suas obras",
		id: "media",
	},
	{
		label: "Seguidores",
		id: "social",
	},
	{
		label: "Novas funcionalidades",
		id: "system",
	},
];

const fetchNotifications = async (page, group) => {
	try {
		const response = await axios({
			method: "GET",
			withCredentials: true,
			headers: {
				Authorization: import.meta.env.REACT_APP_API_KEY,
			},
			params: {
				page: page,
				group: group,
			},
			url: `${
				import.meta.env.REACT_APP_HOST_ORIGIN
			}/api/data/user-notifications`,
		});
		const resultList = response.data;
		return resultList;
	} catch (error) {
		console.error("Error fetching notifications:", error);
		return [];
	}
};

const RichText = ({ text }) => {
	if (!text) return null;

	const regex = /(\[\[.*?\|.*?\]\])|(\*\*.*?\*\*)|(@\w+)/g;

	return (
		<>
			{text
				.split(regex)
				.filter(Boolean)
				.map((part, index) => {
					if (part.startsWith("[[") && part.endsWith("]]")) {
						const content = part.slice(2, -2);
						const [label, url] = content.split("|");
						return (
							<Link key={index} to={url} className="notification-link">
								{label}
							</Link>
						);
					}

					if (part.startsWith("**") && part.endsWith("**")) {
						return <strong key={index}>{part.slice(2, -2)}</strong>;
					}

					if (part.startsWith("@")) {
						const username = part.slice(1);
						return (
							<Link key={index} to={`/user/${username}`} className="mention">
								{part}
							</Link>
						);
					}

					return <span key={index}>{part}</span>;
				})}
		</>
	);
};
export default function NotificationsPage() {
	const { user, isFetching } = useContext(UserContext);
	const navigate = useNavigate();

	const [sitePage, setSitePage] = useState(1);
	const [mediaPage, setMediaPage] = useState(1);
	const [followersPage, setFollowersPage] = useState(1);

	const [siteNotifications, setSiteNotifications] = useState([]);
	const [mediaNotifications, setMediaNotifications] = useState([]);
	const [followersNotifications, setFollowersNotifications] = useState([]);

	useEffect(() => {
		const fetchFirstBatch = async () => {
			const lists = await fetchNotifications();

			setSiteNotifications(lists.system || []);
			setMediaNotifications(lists.media || []);
			setFollowersNotifications(lists.social || []);
			setSitePage(2);
			setMediaPage(2);
			setFollowersPage(2);
		};
		fetchFirstBatch();
	}, []);

	useEffect(() => {
		if (!isFetching && !user) {
			navigate("/");
		}
	}, [isFetching, user, navigate]);

	const handleLoadMore = async (group) => {
		if (group === "media") {
			const list = await fetchNotifications(mediaPage, "media");
			setMediaNotifications((prev) => [...prev, ...list]);
			setMediaPage((prev) => prev + 1);
		} else if (group === "social") {
			const list = await fetchNotifications(followersPage, "social");
			setFollowersNotifications((prev) => [...prev, ...list]);
			setFollowersPage((prev) => prev + 1);
		} else if (group === "system") {
			const list = await fetchNotifications(sitePage, "system");
			setSiteNotifications((prev) => [...prev, ...list]);
			setSitePage((prev) => prev + 1);
		}
	};

	return (
		<div className="container page-content notifications-page">
			{user && (
				<>
					<SideNavbar title={"Notificações"} options={options} />
					<div className="notifications-container">
						{/* Group 1: Media (Series + Volumes) */}
						<NotificationSection
							id="media"
							title={options[0].label}
							list={mediaNotifications}
							onLoadMore={() => handleLoadMore("media")}
						/>
						{/* Group 2: Followers */}
						<NotificationSection
							id="social"
							title={options[1].label}
							list={followersNotifications}
							onLoadMore={() => handleLoadMore("social")}
						/>
						{/* Group 3: Site Updates */}
						<NotificationSection
							id="system"
							title={options[2].label}
							list={siteNotifications}
							onLoadMore={() => handleLoadMore("system")}
						/>
					</div>
				</>
			)}
		</div>
	);
}

const NotificationSection = ({ id, title, list, onLoadMore }) => (
	<div className="notifications-group">
		<h2 className="notifications-group__title" id={id}>
			{title}
		</h2>
		<ul className="notifications-list">
			{list.map((notification, index) => (
				<Notification
					notification={notification}
					key={notification._id || index}
				/>
			))}
		</ul>
		{list.length === 0 ? (
			<p className="notification-missing">Nenhuma notificação.</p>
		) : (
			<button className="button" onClick={onLoadMore}>
				Mostrar mais
			</button>
		)}
	</div>
);

function Notification({ notification }) {
	const {
		text,
		imageUrl,
		associatedObject,
		date,
		seen,
		id,
		details,
		objectType,
	} = notification;
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
				headers: { Authorization: import.meta.env.REACT_APP_API_KEY },
				data: { notification: id },
				url: `${import.meta.env.REACT_APP_HOST_ORIGIN}/api/user/mark-notification-seen`,
			});
			setOutdated(true);
		} catch (error) {
			setSeenState(seen);
		}
	};

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
				if (interval.label === "mês" && count > 1)
					return `${count} meses atrás`;
				return `${count} ${interval.label}${count > 1 ? "s" : ""} atrás`;
			}
		}

		return "just now";
	}

	const time = timeAgo(date);
	return (
		<li className="notification_container" onClick={() => markAsSeen(id)}>
			<div className="notification">
				<NotificationImage
					imageUrl={imageUrl}
					objectType={objectType}
					associatedObject={associatedObject}
				></NotificationImage>
				<p className="notification-text">
					<RichText text={text} />
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
								<RichText text={detail} />
							</li>
						);
					})}
				</ul>
			)}
			{!seen && !seenState && <div className="notification-not-seen"></div>}
		</li>
	);
}
const NotificationImage = ({ imageUrl, objectType, associatedObject }) => {
	const hostOrigin = import.meta.env.REACT_APP_HOST_ORIGIN;
	const pictureSRC = `${hostOrigin}/images`;

	let linkTo = "/";

	const getId = (obj) => obj?._id || obj;

	if (objectType === "User") {
		if (typeof associatedObject === "object" && associatedObject?.username) {
			linkTo = `/user/${associatedObject.username}`;
		} else {
			linkTo = `/user/${associatedObject}`;
		}
	} else if (objectType === "Volume" && associatedObject) {
		linkTo = `/volume/${getId(associatedObject)}`;
	} else if (objectType === "Series" && associatedObject) {
		linkTo = `/series/${getId(associatedObject)}`;
	}

	let finalImageSrc = "";
	const isPoster = objectType === "Volume" || objectType === "Series";

	if (isPoster) {
		if (imageUrl) {
			finalImageSrc = `${pictureSRC}/small/${imageUrl}`;
		} else {
			finalImageSrc = `${pictureSRC}/default-cover.webp`; //
		}
	} else {
		const userAvatar =
			typeof associatedObject === "object" && associatedObject?.profileImageUrl
				? associatedObject.profileImageUrl
				: imageUrl;

		finalImageSrc = userAvatar
			? `${hostOrigin}${userAvatar}`
			: `${hostOrigin}/images/deffault-profile-picture.webp`;
	}

	return (
		<Link
			to={linkTo}
			className={`notification-image-container ${!isPoster ? "notification-image-container--square" : ""}`}
		>
			{isPoster ? (
				<img
					src={finalImageSrc}
					srcSet={
						imageUrl
							? `
								${pictureSRC}/small/${imageUrl} 100w,
								${pictureSRC}/medium/${imageUrl} 400w,
								${pictureSRC}/large/${imageUrl} 700w,
								${pictureSRC}/extralarge/${imageUrl} 1000w`
							: undefined
					}
					sizes={
						imageUrl
							? `
								(min-width: 1024px) 15vw,
								(min-width: 768px) 20vw,
								(min-width: 360px) and (max-width: 768px) 35vw,
								(max-width: 320px) 50vw`
							: undefined
					}
					altalt={`notification picture`}
					className="notification-image"
				/>
			) : (
				<img
					src={finalImageSrc}
					alt="user profile"
					className="notification-image"
				></img>
			)}
		</Link>
	);
};
