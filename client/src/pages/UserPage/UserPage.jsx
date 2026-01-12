import { Route, Routes, useParams } from "react-router-dom";
import "./UserPage.css";
import { lazy, Suspense } from "react";
import { LoadingPageComponent } from "../../App";

const UserCollection = lazy(() => import("./UserCollection"));
const ProfileHeader = lazy(() => import("./ProfileHeader"));
const MissingVolumesPage = lazy(() => import("./MissingVolumesPage"));
const UserStatsPage = lazy(() => import("./UserStatsPage"));
const UserSocials = lazy(() => import("./UserSocialsPage"));
const WishlistPage = lazy(() => import("./WishlistPage"));
const ReadListPage = lazy(() => import("./ReadListPage"));
const CollectionGallery = lazy(() => import("./CollectionGallery"));

export default function UserPage() {
	const { username } = useParams();

	return (
		<>
			<div className="page-content" key={username}>
				<ProfileHeader user={username}></ProfileHeader>
				<Suspense fallback={<LoadingPageComponent />}>
					<Routes>
						<Route path="missing" element={<MissingVolumesPage />}></Route>
						<Route path="wishlist" element={<WishlistPage />}></Route>
						<Route path="stats" element={<UserStatsPage />}></Route>
						<Route path="socials" element={<UserSocials />}></Route>
						<Route path="volumes" element={<ReadListPage />}></Route>
						<Route path="gallery" element={<CollectionGallery />}></Route>
						<Route path="" element={<UserCollection />}></Route>
					</Routes>
				</Suspense>
			</div>
		</>
	);
}
