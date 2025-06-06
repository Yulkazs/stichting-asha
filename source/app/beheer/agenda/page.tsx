'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Calendar, Clock, Users, MapPin, ChevronDown, ChevronUp } from 'lucide-react';

interface Event {
  _id?: string;
  title: string;
  description: string;
  type: 'eenmalig' | 'standaard' | 'dagelijks' | 'wekelijks';
  startTime: string;
  endTime: string;
  author: string;
  location: string;
  zaal: string;
  date: string;
  recurringDays?: number[];
  recurringWeeks?: number;
  recurringDayOfWeek?: number;
  recurringId?: string;
}

interface GroupedEvent {
  id: string;
  title: string;
  description: string;
  type: 'eenmalig' | 'standaard' | 'dagelijks' | 'wekelijks';
  startTime: string;
  endTime: string;
  author: string;
  location: string;
  zaal: string;
  date: string;
  recurringDays?: number[];
  recurringWeeks?: number;
  recurringDayOfWeek?: number;
  recurringId?: string;
  eventCount?: number;
  events?: Event[];
}

const EVENT_TYPES = [
  { value: 'eenmalig', label: 'Eenmalig' },
  { value: 'standaard', label: 'Standaard' },
  { value: 'dagelijks', label: 'Dagelijks' },
  { value: 'wekelijks', label: 'Wekelijks' }
];

const ZALEN = [
  'Zaal 1', 'Zaal 2', 'Zaal 3', 'Zaal 4', 'Zaal 5',
  'Zaal 6', 'Zaal 7', 'Zaal 8', 'Zaal 9', 'Zaal 10'
];

const WEEKDAYS = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];

// Utility functions for Netherlands timezone handling
const formatTimeForInput = (timeString: string): string => {
  if (!timeString) return '';
  
  if (timeString.match(/^\d{2}:\d{2}$/)) {
    return timeString;
  }
  
  try {
    const date = new Date(timeString);
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'Europe/Amsterdam'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

const formatDateForInput = (dateString: string): string => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Amsterdam' });
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
};

// Function to get current day of week (0 = Sunday, 1 = Monday, etc.)
const getCurrentDayOfWeek = (): number => {
  return new Date().getDay();
};

// Function to group recurring events
const groupEvents = (events: Event[]): GroupedEvent[] => {
  const grouped: { [key: string]: GroupedEvent } = {};
  
  events.forEach(event => {
    if (event.type === 'eenmalig') {
      grouped[event._id || ''] = {
        id: event._id || '',
        ...event,
        eventCount: 1,
        events: [event]
      };
    } else {
      const baseId = event._id?.includes('_') ? event._id.split('_')[0] : event._id;
      const groupKey = baseId || `${event.title}-${event.type}-${event.startTime}-${event.endTime}-${event.zaal}-${event.author}`;
      
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          id: groupKey,
          ...event,
          eventCount: 1,
          events: [event]
        };
      } else {
        grouped[groupKey].eventCount = (grouped[groupKey].eventCount || 0) + 1;
        grouped[groupKey].events?.push(event);
      }
    }
  });
  
  return Object.values(grouped);
};

// Function to get recurring pattern description
const getRecurringDescription = (event: GroupedEvent): string => {
  switch (event.type) {
    case 'standaard':
      if (event.recurringDayOfWeek !== undefined) {
        return `Elke ${WEEKDAYS[event.recurringDayOfWeek].toLowerCase()}`;
      }
      return 'Standaard herhaling';
    case 'dagelijks':
      if (event.recurringDays && event.recurringDays.length > 0) {
        const days = event.recurringDays.map(d => WEEKDAYS[d]).join(', ');
        return `Deze week: ${days}`;
      }
      return 'Dagelijks';
    case 'wekelijks':
      if (event.recurringDayOfWeek !== undefined && event.recurringWeeks) {
        return `${event.recurringWeeks} weken op ${WEEKDAYS[event.recurringDayOfWeek].toLowerCase()}`;
      }
      return 'Wekelijks';
    default:
      return '';
  }
};

export default function BeheerAgendaPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [groupedEvents, setGroupedEvents] = useState<GroupedEvent[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<GroupedEvent | null>(null);
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<Event>({
    title: '',
    description: '',
    type: 'eenmalig',
    startTime: '',
    endTime: '',
    author: '',
    location: '',
    zaal: 'Zaal 1',
    date: '',
    recurringDays: [],
    recurringWeeks: undefined,
    recurringDayOfWeek: undefined
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    const grouped = groupEvents(events);
    setGroupedEvents(grouped);
  }, [events]);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/events');
      const data = await response.json();
      
      const formattedEvents = data.map((event: Event) => ({
        ...event,
        startTime: formatTimeForInput(event.startTime),
        endTime: formatTimeForInput(event.endTime),
        date: formatDateForInput(event.date)
      }));
      
      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        options.push(timeString);
      }
    }
    return options;
  };

  const TIME_OPTIONS = generateTimeOptions();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventData = {
        ...formData,
        startTime: formData.startTime,
        endTime: formData.endTime,
        date: formData.type === 'eenmalig' 
          ? new Date(`${formData.date}T00:00:00`).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]
      };
      
      let url: string;
      const method = editingEvent ? 'PUT' : 'POST';
      
      if (editingEvent) {
        if (editingEvent.type === 'eenmalig') {
          const eventId = (editingEvent as any)._id || editingEvent.id;
          url = `/api/events/${eventId}`;
        } else {
          const firstEvent = editingEvent.events?.[0];
          if (firstEvent?._id) {
            const baseId = firstEvent._id.includes('_') ? firstEvent._id.split('_')[0] : firstEvent._id;
            url = `/api/events/${baseId}`;
          } else {
            throw new Error('Kan het evenement ID niet vinden');
          }
        }
      } else {
        url = '/api/events';
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        fetchEvents();
        closeModal();
      } else {
        const errorData = await response.json();
        console.error('Error saving event:', errorData);
        alert('Er is een fout opgetreden bij het opslaan van het evenement.');
      }
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Er is een fout opgetreden bij het opslaan van het evenement.');
    }
  };

  const handleDeleteGroup = async (groupedEvent: GroupedEvent) => {
    const eventCount = groupedEvent.eventCount || 1;
    const confirmMessage = eventCount > 1 
      ? `Weet je zeker dat je alle ${eventCount} evenementen van "${groupedEvent.title}" wilt verwijderen?`
      : `Weet je zeker dat je dit evenement wilt verwijderen?`;
    
    if (confirm(confirmMessage)) {
      try {
        if (groupedEvent.type === 'eenmalig') {
          const eventId = (groupedEvent as any)._id || groupedEvent.id;
          await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
        } else {
          const baseEventIds = new Set<string>();
          
          groupedEvent.events?.forEach(event => {
            if (event._id) {
              const baseId = event._id.includes('_') ? event._id.split('_')[0] : event._id;
              baseEventIds.add(baseId);
            }
          });
          
          const deletePromises = Array.from(baseEventIds).map(baseId => 
            fetch(`/api/events/${baseId}`, { method: 'DELETE' })
          );
          
          await Promise.all(deletePromises);
        }
        
        fetchEvents();
      } catch (error) {
        console.error('Error deleting events:', error);
        alert('Er is een fout opgetreden bij het verwijderen van het evenement.');
      }
    }
  };

  const toggleExpanded = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  const openModal = (event?: GroupedEvent) => {
    if (event) {
      setEditingEvent(event);
      const firstEvent = event.events?.[0] || event;
      setFormData({
        ...firstEvent,
        startTime: formatTimeForInput(firstEvent.startTime),
        endTime: formatTimeForInput(firstEvent.endTime),
        date: formatDateForInput(firstEvent.date)
      });
    } else {
      setEditingEvent(null);
      setFormData({
        title: '',
        description: '',
        type: 'eenmalig',
        startTime: '',
        endTime: '',
        author: '',
        location: '',
        zaal: 'Zaal 1',
        date: '',
        recurringDays: [],
        recurringWeeks: undefined,
        recurringDayOfWeek: undefined
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEvent(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle numeric fields specially
    if (name === 'recurringDayOfWeek' || name === 'recurringWeeks') {
      setFormData(prev => ({
        ...prev,
        [name]: value === '' ? undefined : parseInt(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleRecurringDaysChange = (dayIndex: number) => {
    setFormData(prev => ({
      ...prev,
      recurringDays: prev.recurringDays?.includes(dayIndex)
        ? prev.recurringDays.filter(d => d !== dayIndex)
        : [...(prev.recurringDays || []), dayIndex]
    }));
  };

  // New function to handle weekly recurring weeks selection
  const handleWeeklyWeeksChange = (weekCount: number) => {
    setFormData(prev => ({
      ...prev,
      recurringWeeks: weekCount
    }));
  };

  // Function to check if a day is in the past
  const isDayInPast = (dayIndex: number): boolean => {
    const currentDay = getCurrentDayOfWeek();
    return dayIndex < currentDay;
  };

  return (
    <div className="min-h-screen p-3 sm:p-4 lg:p-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold flex items-center gap-2">
            <Calendar size={20} className="sm:w-6 sm:h-6" /> Agenda
          </h2>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-3 sm:py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 font-medium"
          >
            <Plus className="w-4 h-4" />
            Nieuw Evenement
          </button>
        </div>

        {/* Events Grid */}
        <div className="space-y-4">
          {groupedEvents.map((groupedEvent) => (
            <div key={groupedEvent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">{groupedEvent.title}</h3>
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                          groupedEvent.type === 'eenmalig' 
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {EVENT_TYPES.find(t => t.value === groupedEvent.type)?.label}
                        </span>
                        {groupedEvent.eventCount && groupedEvent.eventCount > 1 && (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 whitespace-nowrap">
                            {groupedEvent.eventCount} evenementen
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-gray-600 mb-4 text-sm sm:text-base line-clamp-2">{groupedEvent.description}</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">
                          {groupedEvent.type === 'eenmalig' 
                            ? new Date(groupedEvent.date).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })
                            : getRecurringDescription(groupedEvent)
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{groupedEvent.startTime} - {groupedEvent.endTime}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{groupedEvent.zaal}</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="truncate">{groupedEvent.author}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-row sm:flex-col lg:flex-row items-center justify-end gap-2 sm:ml-4">
                    {groupedEvent.eventCount && groupedEvent.eventCount > 1 && (
                      <button
                        onClick={() => toggleExpanded(groupedEvent.id)}
                        className="text-xs sm:text-sm text-blue-600 hover:text-blue-800 transition-colors px-2 py-1 rounded whitespace-nowrap"
                      >
                        {expandedEvents.has(groupedEvent.id) ? 'Inklappen' : 'Uitklappen'}
                      </button>
                    )}
                    <button
                      onClick={() => openModal(groupedEvent)}
                      className="text-blue-600 hover:text-blue-800 transition-colors p-2 hover:bg-blue-50 rounded"
                      aria-label="Bewerken"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(groupedEvent)}
                      className="text-red-600 hover:text-red-800 transition-colors p-2 hover:bg-red-50 rounded"
                      aria-label="Verwijderen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {/* Expanded individual events */}
                {expandedEvents.has(groupedEvent.id) && groupedEvent.events && groupedEvent.events.length > 1 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Individuele evenementen:</h4>
                    <div className="space-y-2">
                      {groupedEvent.events.map((event, index) => (
                        <div key={event._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-2 px-3 bg-gray-50 rounded gap-1">
                          <span className="text-sm">
                            {new Date(event.date).toLocaleDateString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
                          </span>
                          <span className="text-sm text-gray-600">
                            {event.startTime} tot {event.endTime}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
            <div className="bg-white rounded-lg w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header - Fixed */}
              <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200 flex-shrink-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {editingEvent ? 'Evenement Bewerken' : 'Nieuw Evenement'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded"
                  aria-label="Sluiten"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="overflow-y-auto flex-1">
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Title */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Titel <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>

                    {/* Type */}
                    <div className="sm:col-span-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        {EVENT_TYPES.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Beschrijving <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      required
                      rows={3}
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Date (for eenmalig only) */}
                    {formData.type === 'eenmalig' && (
                      <div className="sm:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Datum <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="date"
                          value={formData.date}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        />
                      </div>
                    )}

                    {/* Start Time */}
                    <div className={formData.type === 'eenmalig' ? 'sm:col-span-1' : 'sm:col-span-1'}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Starttijd <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="startTime"
                        value={formData.startTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        <option value="">Selecteer tijd</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* End Time */}
                    <div className={formData.type === 'eenmalig' ? 'sm:col-span-1' : 'sm:col-span-1'}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Eindtijd <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="endTime"
                        value={formData.endTime}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        <option value="">Selecteer tijd</option>
                        {TIME_OPTIONS.map(time => (
                          <option key={time} value={time}>
                            {time}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Organizer & Zaal */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organisator <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="author"
                        value={formData.author}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zaal <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="zaal"
                        value={formData.zaal}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        {ZALEN.map(zaal => (
                          <option key={zaal} value={zaal}>
                            {zaal}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Locatie <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                    />
                  </div>

                  {/* Recurring Options */}
                  {formData.type === 'dagelijks' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Selecteer dagen voor deze week:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                        {WEEKDAYS.map((day, index) => {
                          const isDisabled = isDayInPast(index);
                          return (
                            <label 
                              key={day} 
                              className={`flex items-center p-3 border rounded-md text-sm ${
                                isDisabled 
                                  ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                                  : 'cursor-pointer hover:bg-gray-50'
                              } ${
                                formData.recurringDays?.includes(index) 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-300'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={formData.recurringDays?.includes(index) || false}
                                onChange={() => !isDisabled && handleRecurringDaysChange(index)}
                                disabled={isDisabled}
                                className="mr-2 text-blue-600"
                              />
                              <span className="truncate">{day}</span>
                            </label>
                          );
                        })}
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Dagen in het verleden zijn uitgeschakeld
                      </p>
                    </div>
                  )}

                  {formData.type === 'standaard' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Dag van de week:
                      </label>
                      <select
                        name="recurringDayOfWeek"
                        value={formData.recurringDayOfWeek || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                      >
                        <option value="">Selecteer dag</option>
                        {WEEKDAYS.map((day, index) => (
                          <option key={day} value={index}>
                            {day}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {formData.type === 'wekelijks' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dag van de week <span className="text-red-500">*</span>
                        </label>
                        <select
                          name="recurringDayOfWeek"
                          value={formData.recurringDayOfWeek || ''}
                          onChange={handleInputChange}
                          required
                          className="w-full px-3 py-3 sm:py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
                        >
                          <option value="">Selecteer dag</option>
                          {WEEKDAYS.map((day, index) => (
                            <option key={day} value={index}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Aantal weken <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(weekNum => (
                            <label 
                              key={weekNum} 
                              className={`flex items-center justify-center cursor-pointer p-3 rounded-md border text-sm transition-colors ${
                                formData.recurringWeeks === weekNum
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'border-gray-300 bg-white hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="recurringWeeks"
                                value={weekNum}
                                checked={formData.recurringWeeks === weekNum}
                                onChange={() => handleWeeklyWeeksChange(weekNum)}
                                className="sr-only"
                              />
                              <span>{weekNum} week{weekNum > 1 ? 'en' : ''}</span>
                            </label>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Selecteer hoeveel opeenvolgende weken het evenement moet plaatsvinden
                        </p>
                      </div>
                    </div>
                  )}
                </form>
              </div>

              {/* Footer - Fixed */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors font-medium"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  className="w-full sm:w-auto px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingEvent ? 'Bijwerken' : 'Aanmaken'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {groupedEvents.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Geen evenementen</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">Begin met het toevoegen van je eerste evenement om je agenda te vullen.</p>
            <button
              onClick={() => openModal()}
              className="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Eerste Evenement Toevoegen
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
