/* Calendario */

let today = new Date();
let currentMonth = today.getMonth();
let currentYear = today.getFullYear();
let months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
let monthAndYear = document.getElementById("monthAndYear");

showCalendar(currentMonth, currentYear);

function next() {
    currentYear = (currentMonth === 11) ? currentYear + 1 : currentYear;
    currentMonth = (currentMonth + 1) % 12;
    showCalendar(currentMonth, currentYear);
}

function previous() {
    currentYear = (currentMonth === 0) ? currentYear - 1 : currentYear;
    currentMonth = (currentMonth === 0) ? 11 : currentMonth - 1;
    showCalendar(currentMonth, currentYear);
}

function showCalendar(month, year) {
    let firstDay = (new Date(year, month)).getDay();
    let daysInMonth = 32 - new Date(year, month, 32).getDate();
    let tbl = document.getElementById("calendarBody");

    tbl.innerHTML = "";
    monthAndYear.innerHTML = months[month] + " " + year;

    let date = 1;
    for (let i = 0; i < 6; i++) {
        let row = document.createElement("tr");

        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDay) {
                let cell = document.createElement("td");
                let cellText = document.createTextNode("");
                cell.appendChild(cellText);
                row.appendChild(cell);
            } else if (date > daysInMonth) {
                break;
            } else {
                let cell = document.createElement("td");
                let cellButton = document.createElement("button");
                cellButton.textContent = date;
                cellButton.className = "calendar-btn";
                cellButton.addEventListener("click", (event) => openModal(event.target, month, year));
                if (date === today.getDate() && year === today.getFullYear() && month === today.getMonth()) {
                    cellButton.classList.add("bg-info");
                }
                cell.appendChild(cellButton);
                row.appendChild(cell);
                date++;
            }
        }
        tbl.appendChild(row);
    }
}

/* Calculo de horas */ 
function openModal(button, month, year) {
    let modal = document.getElementById("confirmationModal");
    let dateInfo = document.getElementById("dateInfo");
    let selectedDate = document.getElementById("selectedDate");

    let date = button.textContent;
    selectedDate.value = `${date}-${month + 1}-${year}`;
    dateInfo.textContent = `Dia selecionado: ${date} de ${months[month]} de ${year}`;
    modal.style.display = "block";
}

function closeModal() {
    let modal = document.getElementById("confirmationModal");
    modal.style.display = "none";
}

document.getElementById('hour-end').addEventListener('input', function() {
    const startTime = document.getElementById('hour-start').value;
    const endTime = document.getElementById('hour-end').value;

    if (startTime && endTime) {
        const start = new Date(`01/01/2020 ${startTime}`);
        const end = new Date(`01/01/2020 ${endTime}`);

        const diffMs = end - start;
        const diffHrs = Math.floor((diffMs % 86400000) / 3600000); // converte ms em horas
        const diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000); // converte ms em minutos

        if (diffMs > 0) {
            document.getElementById('time-difference').value = `${diffHrs}h ${diffMins}min`;
        } else {
            document.getElementById('time-difference').value = 'Inválido';
        }
    }
});
