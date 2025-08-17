'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');

class Workout {
  date = new Date();
  id = (Date.now() + '').slice(-10);

  constructor(coords, distance, duration) {
    this.coords = coords; // [lat, lng]
    this.distance = distance; // in km
    this.duration = duration; // in min
  }

  _setDescription() {
    // prettier-ignore
    const month = months[this.date.getMonth()];
    this.description = ` ${this.type[0].toUpperCase()}${this.type.slice(
      1
    )} on ${month} ${this.date.getDate()}`;
  }
}
class running extends Workout {
  type = 'running';
  emoji = '🏃‍♂️';
  constructor(coords, distance, duration, cadence) {
    super(coords, distance, duration);
    this.cadence = cadence; // in steps/min
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    // min/km
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}
class cycling extends Workout {
  type = 'cycling';
  emoji = '🚴‍♀️';
  constructor(coords, distance, duration, elevationGain) {
    super(coords, distance, duration);
    this.elevationGain = elevationGain; // in meters
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    // km/h
    this.speed = (this.distance / this.duration) * 60;
    return this.speed;
  }
}

class App {
  #map;
  #mapEvent;
  #workouts = [];
  constructor() {
    this._getLocalStorage();
    this._GetPosition();

    form.addEventListener('submit', this._NewWorkout.bind(this));

    inputType.addEventListener('change', this._ToggleElevationField);
    containerWorkouts.addEventListener('click', this._moveMarker.bind(this));
  }

  _GetPosition() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this._LoadMap.bind(this),
        function () {
          console.log('fails to get your location');
        }
      );
    }
  }

  _LoadMap(pos) {
    const { latitude } = pos.coords;
    const { longitude } = pos.coords;
    const cords = [latitude, longitude];
    this.#map = L.map('map').setView(cords, 13);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);

    this.#map.on('click', this._ShowForm.bind(this));
    this._renderAllWorkOutsAndMarkers();
  }

  _ShowForm(MapEv) {
    this.#mapEvent = MapEv;
    form.classList.remove('hidden');
    inputDistance.focus();
  }
  _HideForm() {
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => {
      form.style.display = 'grid';
    }, 1000);
  }

  _ToggleElevationField(e) {
    e.preventDefault();
    inputCadence.closest('div').classList.toggle('form__row--hidden');
    inputElevation.closest('div').classList.toggle('form__row--hidden');
  }

  _NewWorkout(e) {
    e.preventDefault();
    //Helper func
    const validateInput = (...inputs) =>
      inputs.every(input => Number.isFinite(input));
    const isAllPositive = (...inputs) => inputs.every(input => input > 0);

    //Get Data from form
    const { lat, lng } = this.#mapEvent.latlng;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    let workout;

    //if Running Create Running opj
    if (inputType.value === 'running') {
      const cadence = +inputCadence.value;
      //Check if data vaild
      if (
        !validateInput(distance, duration, cadence) ||
        !isAllPositive(cadence, distance, duration)
      ) {
        return alert('Input is not valid');
      }
      workout = new running([lat, lng], distance, duration, cadence);
    }

    //if Cycling Create Cycling opj
    //Check if data vaild
    if (inputType.value === 'cycling') {
      const elevation = +inputElevation.value;
      if (!validateInput(distance, duration, elevation)) {
        return alert('Input is not valid');
      }
      workout = new cycling([lat, lng], distance, duration, elevation);
    }

    //Add new opject tp the workout arrray
    this.#workouts.push(workout);
    //Render workout marker
    this._createMapMarker(workout);
    //render workout in the list
    this._RenderWorkoutInTheList(workout);

    //clear and hide form
    this._HideForm();

    // Save to local storage
    this._setLocalStorage();
  }

  _RenderWorkoutInTheList(workout) {
    let html = `
    <li class="workout workout--running" data-id="${workout.id}">
          <h2 class="workout__title">${workout.description}</h2>
          <div class="workout__details">
            <span class="workout__icon">${workout.emoji}</span>
            <span class="workout__value">${workout.distance}</span>
            <span class="workout__unit">km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⏱</span>
            <span class="workout__value">${workout.duration}</span>
            <span class="workout__unit">min</span>
          </div>
    `;
    if (workout.type === 'running') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.pace}</span>
            <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">🦶🏼</span>
            <span class="workout__value">${workout.cadence}</span>
            <span class="workout__unit">spm</span>
          </div>
        </li>
      `;
    }
    if (workout.type === 'cycling') {
      html += `
          <div class="workout__details">
            <span class="workout__icon">⚡️</span>
            <span class="workout__value">${workout.speed}</span>
            <span class="workout__unit">km/h</span>
          </div>
          <div class="workout__details">
            <span class="workout__icon">⛰</span>
            <span class="workout__value">${workout.elevationGain}</span>
            <span class="workout__unit">m</span>
          </div>
        </li>
      `;
    }
    form.insertAdjacentHTML('afterend', html);
  }
  _createMapMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        new L.Popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(`${workout.emoji} ${workout.description}`)
      .openPopup();
  }
  _moveMarker(e) {
    const WorkoutEl = e.target.closest('.workout');

    if (!WorkoutEl) return;

    const workout = this.#workouts.find(
      work => work.id === WorkoutEl.dataset.id
    );

    this.#map.setView(workout.coords, 13, {
      animate: true,
      duration: 1,
    });
  }

  _setLocalStorage() {
    localStorage.setItem('workouts', JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = localStorage.getItem('workouts');
    if (!data) return;

    this.#workouts = JSON.parse(data);
  }
  _renderAllWorkOutsAndMarkers() {
    this.#workouts.forEach(work => {
      this._RenderWorkoutInTheList(work);
      this._createMapMarker(work);
    });
  }
}
const app = new App();
