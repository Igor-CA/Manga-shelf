const DESIRED_IMAGE_SIZE_HEIGHT = 512; //PX

export default function r(
	image, // HTMLImageElement
	canvas, // HTMLCanvasElement
	crop, // PixelCrop
	aspecRatio
) {
	const ctx = canvas.getContext("2d");
	if (!ctx) {
		throw new Error("No 2d context");
	}

	const pixelRatio = window.devicePixelRatio;
	const scaleX = image.naturalWidth / image.width;
	const scaleY = image.naturalHeight / image.height;

	canvas.width = DESIRED_IMAGE_SIZE_HEIGHT * aspecRatio;
	canvas.height = DESIRED_IMAGE_SIZE_HEIGHT;

	ctx.scale(pixelRatio, pixelRatio);
	ctx.imageSmoothingQuality = "high";
	ctx.save();

	const cropX = crop.x * scaleX;
	const cropY = crop.y * scaleY;
	const cropW = crop.width * scaleX * pixelRatio;
	const cropH = crop.height * scaleX * pixelRatio;

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
		canvas.height
	);

	ctx.restore();
}
