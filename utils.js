function log(message) {
    let timestamp = getActualTime();
    console.log(`[${timestamp}] - ${message}`);
}

function logError(message) {
    let timestamp = getActualTime();
    console.error(`[${timestamp}] - ${message}`);
}

function getActualTime() {
    let now = new Date();
    let hours = now.getHours().toString().padStart(2, '0');
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    let timestamp = `${hours}:${minutes}:${seconds}`;
    return timestamp;
}

module.exports = {
    log,
    logError
}