//
const imageMap = {
    '강원': '강원FC.png',
    '광주': '광주FC.png',
    '김천': '김천상무FC.png',
    '대구': '대구FC.png',
    '대전': '대전 하나시티즈.png',
    '서울': '서울FC.png',
    '울산': '울산HD.png',
    '인천': '인천 유나이티드FC.png',
    '전북': '전북 현대.png',
    '제주': '제주 유나이티드FC.png',
    '수원FC': '수원FC.png',
    '포항': '포항 스틸러스.png'
};

// 전체 선수 수
let playerCount = 0;

function getPlayerCount() {
    fetch('http://3.36.70.208:8080/persons/players')
        .then(response => response.json())
        .then(data => {
            playerCount = data.totalElements;
            //console.log(playerCount);
            document.getElementById('player-count').textContent = `${playerCount}명`;
        })
}

// 전체 부상자 수
function getInjured() {
    fetch('http://3.36.70.208:8080/injuries')
        .then(response => response.json())
        .then(data => {
            //console.log(`getInjured : ${data.totalElements}`);
            document.getElementById('injury-count').textContent = `${data.totalElements}명`;
        })
}

// 월별 부상자 차트
let ctx = document.getElementById('monthly-injury-counts').getContext('2d');
let monthlyInjuryChart;

function monthlyInjury() {
    fetch('http://3.36.70.208:8080/injuries/monthly-injury-counts')
        .then(response => response.json())
        .then(data => {
                // 1~12월 데이터를 모두 포함하는 배열 생성
                const fullYearData = Array.from({length: 12}, (_, index) => {
                    const month = index + 1;
                    const monthData = data.find(item => item.month === month);
                    return {month, count: monthData ? monthData.count : 0};
                });

                const injuryByMonth = fullYearData.map((data) => data.count);
                updateChart(injuryByMonth);
            }
        )
}

// 월별 부상자 차트 업데이트
function updateChart(injuryByMonth) {
    if (monthlyInjuryChart) {
        //monthlyInjuryChart.data.datasets[0].data = Object.values(abilities);
        //monthlyInjuryChart.update();
    } else {
        monthlyInjuryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
                datasets: [{
                    data: injuryByMonth,
                    backgroundColor: [
                        'rgba(50, 137, 131, 1)'
                    ],
                    borderColor: [
                        'rgba(50, 137, 131, 1)'
                    ],
                    borderWidth: 1,
                    borderRadius: 5,
                    borderSkipped: false,
                }]
            },
            options: {
                // 라벨 숨기기
                plugins: {
                    legend: {
                        display: false,
                        position: top,
                    },
                },
                scales: {
                    grid: false,
                    x: {
                        border: {
                            display: false,
                        },
                        grid: {
                            display: false,
                            drawOnChartArea: false,
                            drawTicks: false,
                        }
                    },
                    y: {
                        beginAtZero: true,
                        min: 0,
                        max: 3,
                        ticks: {
                            stepSize: 1,
                        },
                    }
                },
                maintainAspectRatio: true,
                responsive: true,
            }
        });
    }

}

// 포지션별 선수 수
let positionCount = [];
let countByposition = [];

function countPosition() {
    fetch('http://3.36.70.208:8080/persons/positions/count')
        .then(response => response.json())
        .then(data => {
                //console.log(data);
                positionCount = data;

                console.log(positionCount.length);
                for (let i = 0; i < positionCount.length; i++) {
                    countByposition.push(positionCount[i].count);
                }
                //console.log(countByposition);
                updateChart2(countByposition);
            }
        )
}

let ctx2 = document.getElementById('position-count').getContext('2d');
let positionCountChart;

// 포지션별 선수 차트 업데이트
function updateChart2(countByposition) {
    if (positionCountChart) {
        //monthlyInjuryChart.data.datasets[0].data = Object.values(abilities);
        //monthlyInjuryChart.update();
    } else {
        positionCountChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: ['DF', 'FW', 'GK', 'MF'],
                datasets: [{
                    data: countByposition,
                    backgroundColor: [
                        '#f57a4c',
                        '#ecddff',
                        '#fcd74f',
                        '#328b85',
                    ],
                    borderRadius: 10,
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                        position: 'right',
                    },
                },
                maintainAspectRatio: false,
                responsive: true,
            }
        });
    }

}

// 미래 3경기
let futureGames = [];

function getFuturGames() {
    fetch('http://3.36.70.208:8080/games/future')
        .then(response => response.json())
        .then(data => {
            futureGames = data;
            console.group(futureGames);

            //let tableBody = document.getElementById('upcoming-3-games');
            let a = document.getElementById('upcoming-games');
            let mappedGames = futureGames.map((game) => {
                const gameDate = new Date(game.gameDate);
                const gameDay = gameDate.getDate();
                const gameMonth = gameDate.getMonth() + 1;

                const homeTeam = game.isHome ? '강원FC' : game.opponent;
                const awayTeam = game.isHome ? game.opponent : '강원FC';

                return `<div class="upcoming-game">
                            <div class="date-flag">
                                <div class="game-date">
                                    ${gameDay}
                                </div>
                                <div class="game-date-month">
                                    ${gameMonth}월
                                </div>
                            </div>
                            <div class="upcoming-game-details">
                                <table style="text-align: center; height: 100%">
                                    <tr>
                                        <td style="width: 45%;">
                                            <img src="/img/team/${homeTeam}.png" style="width: 50px; height: 50px;">
                                            <div>${homeTeam}</div>
                                        </td>
                                        <td style="width: 10%;">VS</td>
                                        <td>
                                            <img src="/img/team/${awayTeam}.png" style="width: 50px; height: 50px;">
                                            <div>${awayTeam}</div>
                                        </td>
                                    </tr>
                                    <tr style="height: 20%;">
                                        <td colspan="3">${game.stadium}</td>
                                    </tr>
                                </table>
                            </div>
                            
                        </div>`;

                // return `<tr>
                //             <td>${game.gameDate}</td>
                //             <td>${homeTeam}</td>
                //             <td>${'vs'}</td>
                //             <td>${awayTeam}</td>
                //             <td>${game.stadium}</td>
                //         </tr>`;
            });

            //tableBody.innerHTML = mappedGames.join('');
            a.innerHTML = mappedGames.join('');
        })
}

// 순위표
function getRankTable() {
    fetch('http://3.36.70.208:8080/rank')
        .then(response => response.json())
        .then(data => {
            //console.table(data);

            // 랭킹, 팀명, 승점, 승무패
            let tableBody = document.getElementById('rank-table-rows');

            let mappedData = data.map((rankData) => {
                const imageFileName = imageMap[rankData.title] || '';
                return `<tr>
                <td class="font-bold">${rankData.rank}</td>
                <td>
                    <img src="/img/team/${imageFileName}" style="width: 25px; height: 25px;">
                    ${rankData.title}
                </td>
                <td class="font-bold">${rankData.victoryPoint}</td>
                <td>${rankData.victory}</td>
                <td>${rankData.draw}</td>
                <td>${rankData.defeat}</td>
            </tr>`;
            });


            tableBody.innerHTML = mappedData.join('');
        })
}

// 오늘의 일정
let todaySchedule = [];

function getTodaySchedule() {
    fetch('http://3.36.70.208:8080/schedule/today')
        .then(response => response.json())
        .then(data => {
            console.group(data);

            //document.getElementById('today-schedule-overview').textContent = `경기 : ${data.games.length}, 훈련 : ${data.trainings.length}, 부상 : ${data.injuries.length}`;

            // 부상
            if (!data.injuries || data.injuries.length !== 0) {
                //console.log(`today's injuries : ${data.injuries.length}`);
                let todayInjuries = '';
                data.injuries.map((injury) => {
                    todayInjuries += `<div class="ec-schedule">번호 : ${injury.injuryIdx},&nbsp;&nbsp;&nbsp;부위 : ${injury.injuryPart}</div>`;
                })
                document.getElementById('today-schedule-injuries').innerHTML = todayInjuries;
            } else {
                document.getElementById('today-schedule-injuries').innerHTML = `<span class="no-schedule">오늘 부상자는 존재하지 않습니다.</span>`;
            }

            // 경기
            if (!data.games || data.games.length !== 0) {
                //console.log(`today's games : ${data.games.length}`);
                const isHome = data.games[0].isHome === 1 ? '홈' : '원정';
                //document.getElementById('today-schedule-games').textContent = `경기 : ${data.games[0].opponent}랑 경기`;
                document.getElementById('today-schedule-games').innerHTML = `${isHome},&nbsp;&nbsp; 상대 : ${data.games[0].opponent}`;
            } else {
                document.getElementById('today-schedule-games').innerHTML = `<span class="no-schedule">오늘 경기는 존재하지 않습니다.</span>`;
            }

            // 훈련
            if (!data.trainings || data.trainings.length !== 0) {
                //console.log(`today's trainings : ${data.trainings}`);
                let trainingsText = '';
                data.trainings.map((training) => {
                    const trainDate = new Date(training.startTime);
                    trainingsText += `<div class="ec-schedule">${trainDate.getHours()}시&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;${training.trainName}</div>`;
                })
                document.getElementById('today-schedule-trainings').innerHTML = trainingsText;
            } else {
                document.getElementById('today-schedule-trainings').innerHTML = `<span class="no-schedule">오늘 훈련은 존재하지 않습니다.</span>`;
            }


        })
}

// 부위별 부상자 수 전월과 비교
let ctx3 = document.getElementById('injuries-count-compare').getContext('2d');
let injuriesCountCompare;

function getInjuriesCompare() {
    fetch('http://3.36.70.208:8080/injuries/compare')
        .then(response => response.json())
        .then(data => {
            const injuryPart = Object.keys(data);
            const lastMonthValues = Object.keys(data).map(key => data[key]["저번달"]);
            const thisMonthValues = Object.keys(data).map(key => data[key]["이번달"]);
            updateChart3(injuryPart, lastMonthValues, thisMonthValues);
        })
}

// 부상자 수 비교 차트 업데이트
function updateChart3(injuryPart, lastMonthValues, thisMonthValues) {
    if (injuriesCountCompare) {
        //monthlyInjuryChart.data.datasets[0].data = Object.values(abilities);
        //monthlyInjuryChart.update();
    } else {
        injuriesCountCompare = new Chart(ctx3, {
            type: 'bar',
            data: {
                labels: injuryPart,
                datasets: [{
                    label: '저번달',
                    data: lastMonthValues,
                    backgroundColor: '#fcd74f',
                    borderRadius: 5,
                    borderSkipped: false
                },
                    {
                        label: '이번달',
                        data: thisMonthValues,
                        backgroundColor: 'rgb(255,135,85)',
                        borderRadius: 5,
                        borderSkipped: false
                    }]
            },
            options: {
                indexAxis: 'y',
                maintainAspectRatio: true,
                responsive: true,
            }
        });
    }

}


// 페이지 로드
document.addEventListener('DOMContentLoaded', function () {
    monthlyInjury();
    countPosition();
    getPlayerCount();
    getFuturGames();
    getRankTable();
    getInjured();
    getTodaySchedule();
    getInjuriesCompare();
})