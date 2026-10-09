export const onMyDay = ['ddvpage.ru', 'www.ddvpage.ru'].includes(location.hostname);
export const apiBase = onMyDay ? 'https://api.ddvpage.ru' : location.origin;
export let authenticated = !onMyDay;
export function setAuthenticated(value) { authenticated = Boolean(value); }
