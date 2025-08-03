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

class App {
  #map;
  #mapEvent;
  constructor() {
    this._GetPosition();
    form.addEventListener('submit', this._NewWorkout.bind(this));

    inputType.addEventListener('change', this._ToggleElevationField);
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
  }

  _ShowForm(MapEv) {
    this.#mapEvent = MapEv;
    form.classList.remove('hidden');
    inputDistance.focus();
  }

  _ToggleElevationField(e) {
    e.preventDefault();
    inputCadence.closest('div').classList.toggle('form__row--hidden');
    inputElevation.closest('div').classList.toggle('form__row--hidden');
  }

  _NewWorkout(e) {
    e.preventDefault();
    inputDistance.value =
      inputDuration.value =
      inputCadence.value =
      inputElevation.value =
        '';

    const { lat, lng } = this.#mapEvent.latlng;
    L.marker([lat, lng])
      .addTo(this.#map)
      .bindPopup(
        new L.Popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: 'running-popup',
        })
      )
      .setPopupContent('Workout')
      .openPopup();
    form.classList.add('hidden');
  }
}
const app = new App();
