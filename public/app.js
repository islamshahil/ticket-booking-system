// public/app.js

const eventList = document.getElementById('event-list');

// Fetch initial data
fetch('/api/events')
  .then(res => res.json())
  .then(data => renderEvents(data));

function renderEvents(events) {
  eventList.innerHTML = '';
  events.forEach(event => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h2>${event.name}</h2>
      <div id="seats-${event.id}"></div>
    `;
    eventList.appendChild(div);

    const seatContainer = div.querySelector(`#seats-${event.id}`);
    event.seats.forEach(seat => {
      const seatDiv = document.createElement('span');
      seatDiv.className = `seat ${seat.is_booked ? 'booked' : 'available'}`;
      seatDiv.id = `seat-${event.id}-${seat.seat_number}`;
      seatDiv.innerText = seat.seat_number;
      seatContainer.appendChild(seatDiv);
    });
  });
}

// Real-time updates
const socket = io();

socket.on('seat-update', (data) => {
  const seatEl = document.getElementById(`seat-${data.eventId}-${data.seatNumber}`);
  if (seatEl) {
    seatEl.className = `seat ${data.status === 'booked' ? 'booked' : 'available'}`;
  }
});
