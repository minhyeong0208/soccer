document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.querySelector('#calendar');
    const modalBackground = document.querySelector('#modal-background');
    const modalTitle = document.querySelector('#modal-title');
    const modalStart = document.querySelector('#modal-start');
    const modalDescription = document.querySelector('#modal-description');
    const modalClass = document.querySelector('#modal-class');
    const modalClose = document.querySelector('#modal-close');

    let schedules = [];
    let trainings = [];
    let matches = [];

    function convertDate(date) {
        date = new Date(date);
        let offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - offset);
    }

    function showModal(modal) {
        modal.style.display = 'flex';
    }

    function hideModal(modal) {
        modal.style.display = 'none';
    }

    function fetchData() {
        fetch('http://3.36.70.208:8080/schedule/list')
            .then(response => response.json())
            .then(data => {
                //console.group(data);

                data.trainings.map((train) => {
                    let training = new Object();
                    training.title = train.trainName;
                    training.start = train.startDate;
                    training.end = train.endDate;
                    training.memo = train.memo;
                    training.className = 'training';
                    trainings.push(training);
                })
                //console.log(trainings);

                data.games.map((game) => {
                    let match = new Object();
                    match.title = game.gameName;
                    match.start = game.gameDate;
                    match.type = game.gameType;
                    match.isHome = game.isHome === 1 ? '홈 경기' : '원정 경기'; // home:1, away:0
                    match.stadium = game.stadium;
                    match.className = 'match';
                    matches.push(match);
                })
                //console.log(matches);
                schedules = [...trainings, ...matches];
                console.group(schedules);
                initializeCalendar();
            });
    }

    function initializeCalendar() {
        const calendar = new FullCalendar.Calendar(calendarEl, {
            aspectRatio: 2,
           	locale: 'ko',
            initialView: 'dayGridMonth',
            events: schedules,
            eventClick: function (info) {
                handleEventClick(info);
            },
            buttonText: {
                today: '오늘',
            },
            // customButtons: {
            //     today: {
            //       text: '오늘',
            //     },
            // },
            headerToolbar: {
                right: 'prev,next today',
                center: 'title',
                left: ''
            },
        });
        calendar.render();
    }

    function handleEventClick(info) {
        modalTitle.textContent = info.event.title;
        //modalStart.textContent = info.event.start.toISOString().split('T', 1);
        modalStart.textContent = convertDate(info.event.start).toISOString().split('T', 1);
        if (info.event.classNames.includes('match')) {
            modalDescription.textContent = `${info.event.extendedProps.isHome}, ${info.event.extendedProps.stadium}`;
            modalClass.textContent = '경기';
        } else if (info.event.classNames.includes('training')) {
            modalDescription.textContent = `${info.event.extendedProps.memo}`;
            modalClass.textContent = '훈련';
        }

        showModal(modalBackground);
    }

    modalClose.addEventListener('click', function () {
        hideModal(modalBackground);
    });
	
    fetchData();
	
});