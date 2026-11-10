import { requireSupabase } from './supabase-client.js';
import { isSupabaseConfigured } from './supabase-config.js';

const TABLE_NAME = 'events';

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateInputValue(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-');
}

function toTimeInputValue(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function toLocalTimestamp(date) {
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
  ].join('-') + `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function combineDateAndTime(dateValue, timeValue, forceMidnight = false) {
  if (!dateValue) {
    return null;
  }

  if (forceMidnight || !timeValue) {
    return `${dateValue}T00:00:00`;
  }

  const normalizedTime = timeValue.length === 5 ? `${timeValue}:00` : timeValue;
  return `${dateValue}T${normalizedTime}`;
}

function normalizeRecord(record) {
  return {
    id: record.id,
    title: record.title || '',
    description: record.description || '',
    location: record.location || '',
    start_at: record.start_at,
    end_at: record.end_at || null,
    all_day: Boolean(record.all_day),
    is_published: Boolean(record.is_published),
    created_at: record.created_at,
    updated_at: record.updated_at,
  };
}

function normalizePayload(event) {
  const title = typeof event.title === 'string' ? event.title.trim() : '';

  if (!title) {
    throw new Error('Event title is required.');
  }

  const startAt = combineDateAndTime(event.startDate, event.startTime, Boolean(event.allDay));

  if (!startAt) {
    throw new Error('Event start date is required.');
  }

  const endAt = combineDateAndTime(event.endDate, event.endTime, Boolean(event.allDay));

  return {
    title,
    description: typeof event.description === 'string' ? event.description.trim() : null,
    location: typeof event.location === 'string' ? event.location.trim() : null,
    start_at: startAt,
    end_at: endAt,
    all_day: Boolean(event.allDay),
    is_published: Boolean(event.isPublished),
  };
}

export async function listPublishedEvents({ limit = 24 } = {}) {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('is_published', true)
    .gte('start_at', toLocalTimestamp(new Date()))
    .order('start_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeRecord);
}

export async function listAllEvents() {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .order('start_at', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeRecord);
}

export async function saveEvent(event) {
  const supabase = requireSupabase();
  const payload = normalizePayload(event);

  if (event.id) {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update(payload)
      .eq('id', event.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return normalizeRecord(data);
  }

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return normalizeRecord(data);
}

export async function deleteEvent(id) {
  const supabase = requireSupabase();
  const { error } = await supabase.from(TABLE_NAME).delete().eq('id', id);

  if (error) {
    throw error;
  }
}

export function buildFormDefaults(dateValue) {
  const day = dateValue instanceof Date ? dateValue : new Date();
  const isoDay = toDateInputValue(day);

  return {
    startDate: isoDay,
    startTime: '09:00',
    endDate: isoDay,
    endTime: '10:00',
    allDay: false,
    isPublished: true,
  };
}

export function calendarRecordToEvent(record) {
  return {
    id: record.id,
    title: record.title,
    start: record.start_at,
    end: record.end_at || undefined,
    allDay: record.all_day,
    backgroundColor: record.is_published ? '#00164d' : '#7f8a9f',
    borderColor: record.is_published ? '#00164d' : '#7f8a9f',
    extendedProps: {
      description: record.description,
      location: record.location,
      isPublished: record.is_published,
      allDay: record.all_day,
    },
  };
}

export function eventToFormValues(record) {
  const start = record.start_at ? new Date(record.start_at) : null;
  const end = record.end_at ? new Date(record.end_at) : null;

  return {
    id: record.id || '',
    title: record.title || '',
    startDate: start ? toDateInputValue(start) : '',
    startTime: start ? toTimeInputValue(start) : '',
    endDate: end ? toDateInputValue(end) : '',
    endTime: end ? toTimeInputValue(end) : '',
    location: record.location || '',
    description: record.description || '',
    allDay: Boolean(record.all_day),
    isPublished: Boolean(record.is_published),
  };
}

export function parseDateOnly(dateValue) {
  if (!dateValue) {
    return null;
  }

  const [year, month, day] = String(dateValue).split('-').map((part) => Number(part));

  if (!year || !month || !day) {
    return null;
  }

  return new Date(year, month - 1, day);
}

export function isConfigured() {
  return isSupabaseConfigured();
}