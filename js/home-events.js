import { listPublishedEvents } from './events-service.js';

function createEventCard(record) {
  const column = document.createElement('div');
  column.className = 'column events-list__item';

  const heading = document.createElement('h3');
  heading.className = 'display-1 events-list__item-title';

  const link = document.createElement('a');
  link.href = `events-single.html?id=${encodeURIComponent(record.id)}`;
  link.title = record.title;
  link.textContent = record.title;
  heading.appendChild(link);

  const body = document.createElement('p');
  body.textContent = record.description || 'This event has been published through the dashboard.';

  const meta = document.createElement('ul');
  meta.className = 'events-list__meta';

  const dateItem = document.createElement('li');
  dateItem.className = 'events-list__meta-date';
  dateItem.textContent = new Date(record.start_at).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const timeItem = document.createElement('li');
  timeItem.className = 'events-list__meta-time';
  timeItem.textContent = record.all_day
    ? 'All day'
    : new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(new Date(record.start_at));

  const locationItem = document.createElement('li');
  locationItem.className = 'events-list__meta-location';
  locationItem.textContent = record.location || 'Location to be announced';

  meta.append(dateItem, timeItem, locationItem);
  column.append(heading, body, meta);

  return column;
}

document.addEventListener('DOMContentLoaded', async () => {
  const list = document.getElementById('home-events-list');
  const loading = document.querySelector('[data-home-events-loading]');

  if (!list) return;

  try {
    const events = await listPublishedEvents({ limit: 4 });
    if (loading) loading.remove();

    list.innerHTML = '';
    events.forEach((event) => list.appendChild(createEventCard(event)));
  } catch (error) {
    console.error(error);
    if (loading) loading.textContent = 'Unable to load events right now.';
  }
});