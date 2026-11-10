import { isConfigured, listPublishedEvents } from './events-service.js';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: 'numeric',
  minute: '2-digit',
});

function formatDate(value) {
  return dateFormatter.format(new Date(value));
}

function formatTimeRange(record) {
  if (record.all_day) {
    return 'All day';
  }

  const start = new Date(record.start_at);
  const end = record.end_at ? new Date(record.end_at) : null;

  if (!end) {
    return timeFormatter.format(start);
  }

  return `${timeFormatter.format(start)} - ${timeFormatter.format(end)}`;
}

function createMetaItem(className, text) {
  const item = document.createElement('li');
  item.className = className;
  item.textContent = text;
  return item;
}

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
  meta.appendChild(createMetaItem('events-list__meta-date', formatDate(record.start_at)));
  meta.appendChild(createMetaItem('events-list__meta-time', formatTimeRange(record)));
  meta.appendChild(createMetaItem('events-list__meta-location', record.location || 'Location to be announced'));

  column.appendChild(heading);
  column.appendChild(body);
  column.appendChild(meta);

  return column;
}

function setLoadingMessage(message) {
  const loading = document.querySelector('[data-events-loading]');

  if (loading) {
    loading.textContent = message;
  }
}

async function renderEvents() {
  const list = document.querySelector('#events-list');
  const emptyState = document.querySelector('[data-events-empty]');

  if (!list) {
    return;
  }

  try {
    const events = await listPublishedEvents({ limit: 24 });
    const loading = document.querySelector('[data-events-loading]');

    if (loading) {
      loading.remove();
    }

    if (!events.length) {
      if (emptyState) {
        emptyState.hidden = false;
      }

      return;
    }

    list.innerHTML = '';
    events.forEach((record) => {
      list.appendChild(createEventCard(record));
    });
  } catch (error) {
    console.error(error);
    setLoadingMessage(
      isConfigured()
        ? 'Unable to load events right now.'
        : 'Connect Supabase in js/supabase-config.js to load live events.'
    );

    if (emptyState) {
      emptyState.hidden = false;
      emptyState.textContent = 'No events are available to show right now.';
    }
  }
}

document.addEventListener('DOMContentLoaded', renderEvents);