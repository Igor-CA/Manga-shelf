import VolumeItem from "./VolumeItem";
import AffiliateDisclosure from "../../components/links/AffiliateDisclosure";

export default function SeriesVolumesList({
	volumes = [],
	localVolumesList,
	handleChange,
	handleReadToggle,
	dense = true,
}) {
	const normalVolumes = volumes.filter((volume) => !volume.isVariant);
	const variants = volumes.filter((volume) => volume.isVariant);
	const hasBuyableVolume = volumes.some((volume) => volume.buyUrl);
	return (
		<div>
			{hasBuyableVolume && <AffiliateDisclosure />}
			<ol
				className={`collection-container ${
					dense === true && "collection-container--denser"
				}`}
			>
				{normalVolumes.map((volume) => (
					<li key={volume.volumeId}>
						<VolumeItem
							volumeInfo={volume}
							localVolumeState={localVolumesList}
							handleChange={handleChange}
							handleReadToggle={handleReadToggle}
						/>
					</li>
				))}
			</ol>
			{variants.length > 0 && (
				<>
					<hr style={{ margin: "0px 10px" }} />
					<h2 className="collection-lable">Capas Variantes</h2>
					<ol
						className={`collection-container ${
							dense === true && "collection-container--denser"
						}`}
					>
						{variants.map((volume) => (
							<li key={volume.volumeId}>
								<VolumeItem
									volumeInfo={volume}
									localVolumeState={localVolumesList}
									handleChange={handleChange}
									handleReadToggle={handleReadToggle}
								/>
							</li>
						))}
					</ol>
				</>
			)}
		</div>
	);
}
