const DESIRED_IMAGE_SIZE_HEIGHT = 512; //PX

export default function r(
	image, // HTMLImageElement
	canvas, // HTMLCanvasElement
	crop, // PixelCrop
	aspectRatio,
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("No 2d context");
	}

	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;

	canvas.width = Math.floor(DESIRED_IMAGE_SIZE_HEIGHT * aspectRatio);
	canvas.height = DESIRED_IMAGE_SIZE_HEIGHT;

	ctx.imageSmoothingQuality = "high";
	ctx.save();

	const cropX = crop.x * scaleX;
	const cropY = crop.y * scaleY;
	const cropW = crop.width * scaleX;
	const cropH = crop.height * scaleX;

	// Move the crop origin to the canvas origin (0,0)
	ctx.drawImage(
		image,
		cropX,
		cropY,
		cropW,
		cropH,
		0,
		0,
		canvas.width,
		canvas.height,
	);

	ctx.restore();
}
