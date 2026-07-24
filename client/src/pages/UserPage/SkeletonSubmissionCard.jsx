export default function SkeletonSubmissionCard() {
	return (
		<li className="submission">
			<div className="submission__header">
				<div className="submission-image-container submission-image--skeleton loader-animation"></div>
				<div className="submission__heading">
					<div className="submission__title--skeleton loader-animation"></div>
					<div className="submission__meta--skeleton loader-animation"></div>
				</div>
			</div>
		</li>
	);
}
