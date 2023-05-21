// Helper functions

function convertUnixTimestamp(unixTimestamp) {
  // Create a new Date object using the Unix timestamp multiplied by 1000 to convert it to milliseconds
  const date = new Date(unixTimestamp * 1000);

  // Get the individual components of the date
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Months are zero-based, so we add 1
  const day = date.getDate().toString().padStart(2, "0");
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const seconds = date.getSeconds().toString().padStart(2, "0");

  // Construct the human-readable date string
  const formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

  return formattedDate;
}

function fetchData() {
  return {
    data: [],
    isLoading: false,
    baseUrl: "https://api.opendota.com/api/proMatches",
    async getData(date) {
      console.log(date);
      this.isLoading = true;
      let response = await fetch(this.baseUrl + "?date=" + date);
      this.data = await response.json();
      this.data = groupObjectsByDateAndLeague(this.data, date);
      this.isLoading = false;

      console.log(JSON.parse(JSON.stringify(this.data)));
    },
  };
}

function groupObjectsByDateAndLeague(objects, date) {
  const targetDate = new Date(date);

  const result = objects.reduce((result, obj) => {
    const startDate = new Date(obj.start_time * 1000);
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1);
    const day = String(startDate.getDate()).padStart(2, "0");
    const formattedDate = `${year}-${month}-${day}`;
    const time = startDate.toLocaleTimeString();

    if (startDate.toDateString() !== targetDate.toDateString()) {
      return result;
    }

    const leagueId = obj.leagueid;
    const leagueName = obj.league_name;

    let dateGroup = result[formattedDate];

    if (!dateGroup) {
      dateGroup = {
        formattedDate,
        time,
        leagues: [],
      };
      result[formattedDate] = dateGroup;
    }

    let league = dateGroup.leagues.find((l) => l.leagueid === leagueId);

    if (!league) {
      league = {
        leagueid: leagueId,
        leaguename: leagueName,
        matches: [],
      };
      dateGroup.leagues.push(league);
    }

    league.matches.push(obj);

    return result;
  }, {});

  return Object.values(result);
}

function dateSwitcher() {
  return {
    eventDispatched: false,
    currentDate: null,
    minDate: null,
    maxDate: null,
    formattedDate: null,
    getDate: function (offset) {
      let date = new Date(this.currentDate);
      date.setDate(date.getDate() + offset);
      return date;
    },
    formatDateString: function (date) {
      return dayjs(date).format("ddd, MMM DD");
    },
    switchDates: function (offset) {
      let prevDate = new Date(this.currentDate);
      this.currentDate = this.getDate(offset);
      this.updateAdjacentDates(offset);
      this.updateCurrentDate(prevDate);
      this.setDisabledClass();
    },
    updateAdjacentDates: function (offset) {
      let prevElement = document.getElementById("prevDate");
      let nextElement = document.getElementById("nextDate");
      prevElement.innerText = this.formatDateString(this.getDate(offset - 1));
      nextElement.innerText = this.formatDateString(this.getDate(offset + 1));
    },
    updateCurrentDate: function (date) {
      let currentElement = document.getElementById("currentDate");
      currentElement.innerText = this.formatDateString(date);
    },
    setDisabledClass: function () {
      let prevElement = document.getElementById("prevDate");
      let nextElement = document.getElementById("nextDate");
      let currentDate = this.currentDate;

      prevElement.classList.toggle("disabled", currentDate <= this.minDate);
      nextElement.classList.toggle("disabled", currentDate >= this.maxDate);
    },
    init: function () {
      this.currentDate = new Date();
      this.minDate = this.getDate(-7);
      this.maxDate = this.getDate(7);
    },
    getFormattedDate: function (date) {
      let formattedDate = new Date(date).toISOString().slice(0, 10);
    },
  };
}
