function success() {
	return { ok: true };
}

function retryableFailure(reason, details) {
	return { ok: false, retryable: true, reason, details };
}

function permanentFailure(reason, details) {
	return { ok: false, retryable: false, reason, details };
}

module.exports = { success, retryableFailure, permanentFailure };
