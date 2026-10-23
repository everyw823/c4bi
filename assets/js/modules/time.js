export function ParseThisTimeInterval(time, rootTime, units = { d: 'd ', h: 'h ', m: 'm ', s: 's' }) {
    const timeDiff = time - rootTime;
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    let timeString = '';
    if (days > 0) timeString += `${days}${units.d}`;
    if (hours > 0) timeString += `${hours}${units.h}`;
    if (minutes > 0) timeString += `${minutes}${units.m}`;
    if (seconds > 0) timeString += `${seconds}${units.s}`;

    return timeString;
}
