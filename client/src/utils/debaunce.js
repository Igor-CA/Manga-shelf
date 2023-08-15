export default function debaunce(fn, delay) {
	let timer;
	return function (...arg) {
		clearTimeout(timer);
		timer = setTimeout(() => {
			fn(...arg);
		}, delay);
	};
}
