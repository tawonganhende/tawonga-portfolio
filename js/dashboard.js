import { deleteEvent, eventToFormValues, isConfigured, listAllEvents, saveEvent, calendarRecordToEvent, buildFormDefaults, parseDateOnly } from './events-service.js';
import { supabase } from './supabase-client.js';

const state = {
  calendar: null,
  session: null,
  selectedDate: null,
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function formatLocalDateTime(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

const elements = {};

function cacheElements() {
  elements.calendar = document.getElementById('dashboard-calendar');
  elements.configAlert = document.getElementById('dashboard-config-alert');
  elements.session = document.getElementById('dashboard-session');
  elements.sessionEmail = document.getElementById('dashboard-session-email');
  elements.signOut = document.getElementById('dashboard-sign-out');
  elements.status = document.getElementById('dashboard-status');
  elements.form = document.getElementById('event-form');
  elements.formHeading = document.getElementById('event-form-heading');
  elements.eventId = document.getElementById('event-id');
  elements.title = document.getElementById('event-title');
  elements.startDate = document.getElementById('event-start-date');
  elements.startTime = document.getElementById('event-start-time');
  elements.endDate = document.getElementById('event-end-date');
  elements.endTime = document.getElementById('event-end-time');
  elements.location = document.getElementById('event-location');
  elements.description = document.getElementById('event-description');
  elements.allDay = document.getElementById('event-all-day');
  elements.published = document.getElementById('event-published');
  elements.clear = document.getElementById('event-clear');
  elements.remove = document.getElementById('event-delete');
  elements.addEvent = document.getElementById('dashboard-add-event');
}

function setStatus(message, type = 'info') {
  if (!elements.status) {
    return;
  }

  elements.status.textContent = message || '';
  elements.status.dataset.type = type;
}

function setConfigAlert(message) {
  if (!elements.configAlert) {
    return;
  }

  elements.configAlert.textContent = message;
  elements.configAlert.hidden = !message;
}

function toggleEditorAccess(enabled) {
  if (elements.form) {
    Array.from(elements.form.elements).forEach((field) => {
      field.disabled = !enabled;
    });
  }

  if (elements.addEvent) {
    elements.addEvent.disabled = !enabled;
  }
}

function toggleAuthPanels(session) {
  const signedIn = Boolean(session);

  if (elements.session) {
    elements.session.hidden = !signedIn;
  }

  if (elements.sessionEmail && session) {
    elements.sessionEmail.textContent = session.user?.email || 'Authenticated user';
  }

  toggleEditorAccess(signedIn);
}

function buildCalendar() {
  if (!elements.calendar || state.calendar) {
    return;
  }

  state.calendar = new FullCalendar.Calendar(elements.calendar, {
    initialView: 'dayGridMonth',
    height: 'auto',
    selectable: true,
    nowIndicator: true,
    dayMaxEvents: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth,timeGridWeek,listWeek',
    },
    dateClick(info) {
      openEditorForNewEvent(info.dateStr);
    },
    eventClick(info) {
      populateFormFromRecord({
        id: info.event.id,
        title: info.event.title,
        description: info.event.extendedProps.description || '',
        location: info.event.extendedProps.location || '',
        start_at: info.event.start ? formatLocalDateTime(info.event.start) : '',
        end_at: info.event.end ? formatLocalDateTime(info.event.end) : '',
        all_day: Boolean(info.event.allDay),
        is_published: Boolean(info.event.extendedProps.isPublished),
      });
      setStatus('Editing existing event.');
    },
    events: async (fetchInfo, success, failure) => {
      try {
        const records = await listAllEvents();
        success(records.map(calendarRecordToEvent));
      } catch (error) {
        failure(error);
        setStatus('Unable to load events.', 'error');
      }
    },
  });

  state.calendar.render();
}

function clearForm() {
  const defaults = buildFormDefaults(new Date());

  elements.form.reset();
  elements.eventId.value = '';
  elements.formHeading.textContent = 'New Event';
  elements.title.value = '';
  elements.startDate.value = defaults.startDate;
  elements.startTime.value = defaults.startTime;
  elements.endDate.value = defaults.endDate;
  elements.endTime.value = defaults.endTime;
  elements.location.value = '';
  elements.description.value = '';
  elements.allDay.checked = defaults.allDay;
  elements.published.checked = defaults.isPublished;
  elements.remove.disabled = true;
  state.selectedDate = defaults.startDate;
  syncTimeFields();
}

function syncTimeFields() {
  const allDay = elements.allDay.checked;
  elements.startTime.disabled = allDay;
  elements.endTime.disabled = allDay;

  if (allDay) {
    elements.startTime.value = '';
    elements.endTime.value = '';
  }
}

function openEditorForNewEvent(dateValue) {
  const dateObject = parseDateOnly(dateValue) || new Date();
  const defaults = buildFormDefaults(dateObject);
  elements.formHeading.textContent = 'New Event';
  elements.eventId.value = '';
  elements.title.value = '';
  elements.startDate.value = defaults.startDate;
  elements.startTime.value = defaults.startTime;
  elements.endDate.value = defaults.endDate;
  elements.endTime.value = defaults.endTime;
  elements.location.value = '';
  elements.description.value = '';
  elements.allDay.checked = false;
  elements.published.checked = true;
  elements.remove.disabled = true;
  state.selectedDate = defaults.startDate;
  syncTimeFields();
  elements.title.focus();
}

function populateFormFromRecord(record) {
  const values = eventToFormValues(record);

  elements.formHeading.textContent = 'Edit Event';
  elements.eventId.value = values.id;
  elements.title.value = values.title;
  elements.startDate.value = values.startDate;
  elements.startTime.value = values.startTime;
  elements.endDate.value = values.endDate;
  elements.endTime.value = values.endTime;
  elements.location.value = values.location;
  elements.description.value = values.description;
  elements.allDay.checked = values.allDay;
  elements.published.checked = values.isPublished;
  elements.remove.disabled = !values.id;
  state.selectedDate = values.startDate;
  syncTimeFields();
  elements.title.focus();
}

async function handleSignOut() {
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
  state.session = null;
  toggleAuthPanels(null);
  window.location.assign('login.html');
}

async function handleEventSubmit(event) {
  event.preventDefault();

  const payload = {
    id: elements.eventId.value || undefined,
    title: elements.title.value,
    startDate: elements.startDate.value,
    startTime: elements.startTime.value,
    endDate: elements.endDate.value,
    endTime: elements.endTime.value,
    location: elements.location.value,
    description: elements.description.value,
    allDay: elements.allDay.checked,
    isPublished: elements.published.checked,
  };

  try {
    const saved = await saveEvent(payload);
    setStatus(elements.eventId.value ? 'Event updated.' : 'Event created.');
    populateFormFromRecord(saved);
    state.calendar.refetchEvents();
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unable to save event.', 'error');
  }
}

async function handleDeleteEvent() {
  const id = elements.eventId.value;

  if (!id) {
    return;
  }

  const shouldDelete = window.confirm('Delete this event? This cannot be undone.');

  if (!shouldDelete) {
    return;
  }

  try {
    await deleteEvent(id);
    clearForm();
    state.calendar.refetchEvents();
    setStatus('Event deleted.');
  } catch (error) {
    console.error(error);
    setStatus(error.message || 'Unable to delete event.', 'error');
  }
}

function bindEvents() {
  elements.signOut.addEventListener('click', handleSignOut);
  elements.form.addEventListener('submit', handleEventSubmit);
  elements.clear.addEventListener('click', () => {
    clearForm();
    setStatus('Ready for a new event.');
  });
  elements.remove.addEventListener('click', handleDeleteEvent);
  elements.addEvent.addEventListener('click', () => {
    openEditorForNewEvent(state.selectedDate || new Date().toISOString().slice(0, 10));
  });
  elements.allDay.addEventListener('change', syncTimeFields);
}

async function bootstrapAuth() {
  if (!supabase) {
    setConfigAlert('Connect Supabase in js/supabase-config.js to use the dashboard.');
    toggleAuthPanels(null);
    toggleEditorAccess(false);
    clearForm();
    return;
  }

  const { data } = await supabase.auth.getSession();
  state.session = data.session;
  toggleAuthPanels(state.session);

  if (!state.session) {
    window.location.assign('login.html');
    return;
  }

  if (state.session) {
    buildCalendar();
  }

  supabase.auth.onAuthStateChange((_, session) => {
    state.session = session;
    toggleAuthPanels(session);

    if (!state.calendar && session) {
      buildCalendar();
    }

    if (!session && state.calendar) {
      state.calendar.destroy();
      state.calendar = null;
      return;
    }

    if (state.calendar) {
      state.calendar.refetchEvents();
    }
  });

  if (state.session) {
    setStatus('Dashboard ready.');
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  cacheElements();
  bindEvents();
  clearForm();

  if (!isConfigured()) {
    setConfigAlert('Add your Supabase project URL and anon key in js/supabase-config.js before using the dashboard.');
    setStatus('Dashboard is waiting for Supabase configuration.', 'error');
  }

  await bootstrapAuth();
  syncTimeFields();
});