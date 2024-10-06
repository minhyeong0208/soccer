// 페이징 처리
let currentPage = 0;
const pageSize = 10;
const maxVisiblePages = 10; // 최대 표시 페이지 수
let totalPages = 1;

let totalPeople = [];
let mappedPeople = [];

let selectedPlayer = [];

//
let url = `http://3.36.70.208:8080/persons`;

// csrf
const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');
console.log(csrfToken)
console.log(csrfHeader)
// form 입력한 값 객체로 변환
const formToObject = (form) =>
	Array.from(new FormData(form)).reduce(
		(acc, [key, value]) => ({ ...acc, [key]: value }),
		{}
	);

// 전체 사람 정보 가져오기
function fetchPlayerData(page, url) {
	currentPage = page;

	// 수정하기
	url += `/players?page=${page}&size=${pageSize}`;

	console.log(url);
	fetch(url)
		.then(response => response.json())
		.then(data => {
			totalPeople = data.content.filter(person => person.typeCode === 'player');

			const pageButtons = document.querySelector("#pageButtons");
			totalPages = data.totalPages;

			let tableBody = document.getElementById('person-rows');
			tableBody.innerHTML = '';

			// 선수 데이터 테이블에 출력
			mappedPeople = totalPeople
				//.filter(person => person.typeCode === 'player')
				.map(
					(person) => {
						if (document.getElementById('selectAllCheckbox')) {
							return `<tr class="player-row" data-id="${person.personIdx}">
                                        <td>
                                            <input type="checkbox" class="delete-checkbox" data-id="${person.personIdx}">
                                        </td>
                                        <td>
                                            ${person.personName}
                                        </td>
                                        <td>
                                            <span class="position position--${person.position}">
                                                ${person.position}
                                            </span>
                                        </td>
                                        <td>
                                            ${person.backNumber}
                                        </td>
                                    </tr>`;
						} else {
							return `<tr class="player-row" data-id="${person.personIdx}">
                                        <td>
                                            ${person.personName}
                                        </td>
                                        <td>
                                            <span class="position position--${person.position}">
                                                ${person.position}
                                            </span>
                                        </td>
                                        <td>
                                            ${person.backNumber}
                                        </td>
                                    </tr>`;
						}
					}
				);

			tableBody.innerHTML = mappedPeople.join('');

			// 페이지 버튼 초기화
			pageButtons.innerHTML = '';

			// 중앙을 기준으로 10페이지 생성
			let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
			let endPage = Math.min(totalPages, startPage + maxVisiblePages);

			if (endPage - startPage < maxVisiblePages) {
				startPage = Math.max(0, endPage - maxVisiblePages);
			}

			// 페이징 버튼 생성
			for (let i = startPage; i < endPage; i++) {
				pageButtons.innerHTML += `
			        <li class="page-item ${i === page ? 'active' : ''}">
			            <button class="page-link" onclick="fetchPlayerData(${i}, url)">${i + 1}</button>
			        </li>`;
			}

			// 이전/다음 그룹 버튼 활성화/비활성화 설정
			document.querySelector("#prevGroup").disabled = currentPage === 0;
			document.querySelector("#nextGroup").disabled = currentPage >= totalPages - 1;

			// 리스트 첫번째 데이터 상세보기
			selectedPlayer = totalPeople[0];
			showPlayerDetail(totalPeople[0]);

		})
		.catch(error => console.error('Error while fetching data', error))

}

// 검색
document.getElementById('search-btn').addEventListener('click', function() {
	const searchOption = document.getElementById('search-option').value;
	const searchValue = document.getElementById('search-value').value;

	console.log(searchOption, searchValue);
	currentPage = 0;

	// 수정하기
	url += `/search?`;

	if (searchOption && !searchValue) {
		showAlertModal('알림', '검색어를 입력하세요');
		return;
	} else {
		url += `${searchOption}=${searchValue}&page=${currentPage}&size=${pageSize}`;
		//console.log(url);
	}

	fetchPlayerData(currentPage, url);
	url = `http://3.36.70.208:8080/persons`;

})

// 데이트 피커 하루 전으로 나오는 문제
function convertDate(date) {
	date = new Date(date);
	let offset = date.getTimezoneOffset() * 60000;
	return new Date(date.getTime() - offset);
}

// 능력치 데이터 가져오기
function showPlayerDetail(player) {
	document.getElementById('detail-personName').value = player.personName;
	document.getElementById('detail-height').value = player.height;
	document.getElementById('detail-weight').value = player.weight;
	document.getElementById('detail-position-' + player.position.toLowerCase()).checked = true;
	document.getElementById('detail-birth').value = convertDate(player.birth).toISOString().split("T", 1);
	document.getElementById('detail-backNumber').value = player.backNumber;
	document.getElementById('detail-nationality').value = player.nationality;
	document.getElementById('detail-personIdx').value = player.personIdx;

	document.getElementById('player-name-backnumber').textContent = player.personIdx + ' ' + player.personName;
	document.getElementById('player-detail-image').setAttribute('src', `/img/persons/${player.personImage}`);
	document.getElementById('player-detail-image').setAttribute('onerror', `this.onerror = null; this.src = '/img/persons/default.png';`);

	// 능력치 데이터 가져오기
	fetch(`http://3.36.70.208:8080/abilities/person/${player.personIdx}/abilities`)
		.then(response => response.json())
		.then(data => {
			// 가장 최근의 실제 능력치와 예측 능력치 가져오기
			const actualAbilities = data.actual || { pass: 0, physical: 0, shoot: 0, speed: 0, dribble: 0, defence: 0 };
			const predictedAbilities = data.prediction || { pass: 0, physical: 0, shoot: 0, speed: 0, dribble: 0, defence: 0 };
			updateChart(actualAbilities, predictedAbilities); // 차트 업데이트
			selectedPlayer.ability = actualAbilities; // 차트 클릭 시 사용할 ability 설정
		})
		.catch(error => console.error('Error fetching ability data:', error));
}


// 차트 업데이트
function updateChart(actual, predicted) {
	const actualData = {
		pass: actual.pass || 0,
		physical: actual.physical || 0,
		shoot: actual.shoot || 0,
		speed: actual.speed || 0,
		dribble: actual.dribble || 0,
		defence: actual.defence || 0
	};

	const predictedData = {
		pass: predicted.pass || 0,
		physical: predicted.physical || 0,
		shoot: predicted.shoot || 0,
		speed: predicted.speed || 0,
		dribble: predicted.dribble || 0,
		defence: predicted.defence || 0
	};

	if (myChart) {
		myChart.data.datasets[0].data = Object.values(actualData);
		myChart.data.datasets[1].data = Object.values(predictedData);
		myChart.update();
	} else {
		myChart = new Chart(ctx, {
			type: 'radar',
			data: {
				labels: ['패스', '피지컬', '슛', '스피드', '드리블', '수비'],
				datasets: [
					{
						label: '실제 능력치',
						data: Object.values(actualData),
						backgroundColor: 'rgba(140, 200, 255, 0.2)',
						borderColor: 'rgba(140, 200, 255, 1)',
						borderWidth: 1
					},
					{
						label: '예측 능력치',
						data: Object.values(predictedData),
						backgroundColor: 'rgba(255, 100, 100, 0.2)',
						borderColor: 'rgba(255, 100, 100, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				plugins: {
					legend: {
						display: true
					}
				},
				maintainAspectRatio: true,
				responsive: true,
				scales: {
					r: {
						angleLines: { color: 'tomato' },
						suggestedMin: 20,
						suggestedMax: 100,
						ticks: { stepSize: 20 }
					}
				}
			}
		});
	}
}


// 차트
let ctx = document.getElementById('player-ability-chart').getContext('2d');
let myChart;

// 차트 업데이트
function updateChart(actual, predicted) {
	const actualData = actual ? {
		pass: actual.pass || 0,
		physical: actual.physical || 0,
		shoot: actual.shoot || 0,
		speed: actual.speed || 0,
		dribble: actual.dribble || 0,
		defence: actual.defence || 0
	} : {};

	const predictedData = predicted ? {
		pass: predicted.pass || 0,
		physical: predicted.physical || 0,
		shoot: predicted.shoot || 0,
		speed: predicted.speed || 0,
		dribble: predicted.dribble || 0,
		defence: predicted.defence || 0
	} : {};

	if (myChart) {
		myChart.data.datasets[0].data = Object.values(actualData);
		myChart.data.datasets[1].data = Object.values(predictedData);
		myChart.update();
	} else {
		myChart = new Chart(ctx, {
			type: 'radar',
			data: {
				labels: ['패스', '피지컬', '슛', '스피드', '드리블', '수비'],
				datasets: [
					{
						label: '실제 능력치',
						data: Object.values(actualData),
						backgroundColor: 'rgba(140, 200, 255, 0.2)',
						borderColor: 'rgba(140, 200, 255, 1)',
						borderWidth: 1
					},
					{
						label: '예측 능력치',
						data: Object.values(predictedData),
						backgroundColor: 'rgba(255, 100, 100, 0.2)',
						borderColor: 'rgba(255, 100, 100, 1)',
						borderWidth: 1
					}
				]
			},
			options: {
				plugins: {
					legend: {
						display: true
					}
				},
				maintainAspectRatio: true,
				responsive: true,
				scales: {
					r: {
						angleLines: { color: 'tomato' },
						suggestedMin: 20,
						suggestedMax: 100,
						ticks: { stepSize: 20 }
					}
				}
			}
		});
	}
}

// 특정 선수 클릭 시 우측에 상세보기
document.getElementById('person-table-widget').addEventListener('click', function(e) {
	const row = e.target.closest('tr.player-row');

	if (row) {
		const personIdx = row.getAttribute('data-id');
		const player = totalPeople.find(player => player.personIdx === parseInt(personIdx));
		if (player) {
			selectedPlayer = player;
			showPlayerDetail(player);
			updateChart(player.ability);
			console.log(selectedPlayer);
		}
	}
})

const abilityModal = document.getElementById('ability-update-modal');

// 능력치 차트 클릭 시 능력치 수정 모달
document.getElementById('player-ability-chart').addEventListener('click', function() {
	//alert(selectedPlayer.ability.abilityIdx);
	const abilityModal = new bootstrap.Modal(document.getElementById('ability-update-modal'));

	// 모달 내부의 input 요소들에 현재 능력치 값 설정
	const abilityData = selectedPlayer.ability;  // 선택된 선수의 능력치 데이터
	document.getElementById('update-pass').value = abilityData.pass;
	document.getElementById('show-update-pass').textContent = abilityData.pass;

	document.getElementById('update-physical').value = abilityData.physical;
	document.getElementById('show-update-physical').textContent = abilityData.physical;

	document.getElementById('update-speed').value = abilityData.speed;
	document.getElementById('show-update-speed').textContent = abilityData.speed;

	document.getElementById('update-dribble').value = abilityData.dribble;
	document.getElementById('show-update-dribble').textContent = abilityData.dribble;

	document.getElementById('update-shoot').value = abilityData.shoot;
	document.getElementById('show-update-shoot').textContent = abilityData.shoot;

	document.getElementById('update-defence').value = abilityData.defence;
	document.getElementById('show-update-defence').textContent = abilityData.defence;

	// 모달을 띄움
	abilityModal.show();
})

// 능력치 수정 버튼 클릭 시 업데이트 처리
document.getElementById('update-player-ability').addEventListener('click', function() {
	const updatedAbility = {
		pass: parseInt(document.getElementById('update-pass').value),
		physical: parseInt(document.getElementById('update-physical').value),
		speed: parseInt(document.getElementById('update-speed').value),
		dribble: parseInt(document.getElementById('update-dribble').value),
		shoot: parseInt(document.getElementById('update-shoot').value),
		defence: parseInt(document.getElementById('update-defence').value),
	};

	const personIdx = selectedPlayer.personIdx; // 선수의 personIdx 가져오기
	console.log(personIdx)

	fetch(`http://3.36.70.208:8080/abilities/actual/${personIdx}`, { // personIdx를 URL에 포함시킴
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			[csrfHeader]: csrfToken
		},
		body: JSON.stringify(updatedAbility),
	})
		.then(response => response.json())
		.then(data => {
			if (data !== null) {
				showAlertModal('알림', '수정이 완료되었습니다.');
				fetchPlayerData(currentPage, url);  // 수정 후 데이터 갱신
			}
		})
		.catch(error => {
			console.error('request failed', error);
		});

	const abilityModal = bootstrap.Modal.getInstance(document.getElementById('ability-update-modal'));
	abilityModal.hide();
});

// 선수 추가 모달
const modal = document.getElementById("player-modal");
const modalTitle = document.getElementById("modalTitle");
const dateLabel = document.getElementById("dateLabel");
const closeButtons = document.getElementsByClassName("close");
if (document.getElementById("add-player-btn")) {
	const addPlayerButton = document.getElementById("add-player-btn");
	// 선수 추가 입력폼 모달
	addPlayerButton.onclick = function() {
		// 모달 열기 전에 폼 필드 초기화
		document.getElementById('add-personName').value = '';
		document.getElementById('add-backNumber').value = '';
		document.getElementById('add-height').value = '';
		document.getElementById('add-weight').value = '';
		document.getElementById('add-birth').value = '';
		document.getElementById('add-nationality').value = '';
		document.getElementById('add-personImage').value = '';

		// 능력치 필드 초기화
		document.getElementById('update-pass').value = 50;
		document.getElementById('update-physical').value = 50;
		document.getElementById('update-speed').value = 50;
		document.getElementById('update-dribble').value = 50;
		document.getElementById('update-shoot').value = 50;
		document.getElementById('update-defence').value = 50;

		modal.style.display = "block";
	}
}


// 모달 닫기
for (let i = 0; i < closeButtons.length; i++) {
	closeButtons[i].onclick = function() {
		modal.style.display = "none";
	}
}

// 능력치 range값 변경될 때 값 바로 보기
function updateAbilityValue(id, val) {
	document.getElementById('show-' + id).textContent = val;
}


// 선수 추가
document.getElementById('submit-player').addEventListener('click', function() {
	// 모달 위치 조정하기
	if (!document.getElementById('add-personName').value) {
		showAlertModal('알림', '이름을 입력하세요');
		return;
	} else if (!document.getElementById('add-backNumber').value) {
		showAlertModal('알림', '등번호를 입력하세요');
		return;
	} else if (!document.getElementById('add-height').value) {
		showAlertModal('알림', '키를 입력하세요');
		return;
	} else if (!document.getElementById('add-weight').value) {
		showAlertModal('알림', '몸무게를 입력하세요');
		return;
	} else if (!document.getElementById('add-birth').value) {
		showAlertModal('알림', '생일을 입력하세요');
		return;
	} else if (!document.getElementById('add-nationality').value) {
		showAlertModal('알림', '국적을 입력하세요');
		return;
	} else if (!document.getElementById('add-personImage').value) {
		showAlertModal('알림', '사진을 입력하세요');
		return;
	}

	const playerAbility = formToObject(document.getElementById('add-player-ability'));
	const playerInfo = formToObject(document.getElementById('add-player-info'));
	const playerInfoWithAbility = { ...playerInfo, ability: playerAbility };

	const formData = new FormData();
	const fileInput = document.getElementById('add-personImage');
	formData.append('person', new Blob([JSON.stringify(playerInfoWithAbility)], { type: 'application/json' }));
	formData.append('file', fileInput.files[0]);

	// 선수 추가 API 호출
	postPlayer(formData, playerAbility);

});


function postPlayer(newPerson, playerAbility) {
	fetch(url + `/add-player-with-image`, {
		method: "POST",
		headers: {
			[csrfHeader]: csrfToken
		},
		body: newPerson,
	})
		.then(response => response.json())
		.then(result => {
			if (result != null) {
				showAlertModal("알림", "데이터가 성공적으로 추가되었습니다.");

				// 선수 추가 후 능력치 추가 API 호출
				postAbility(result.personIdx, playerAbility);

				const abilityModal = bootstrap.Modal.getInstance(document.getElementById('player-modal'));
				abilityModal.hide();  // 모달 닫기

				// 백드롭 수동 제거
				const modalBackdrop = document.querySelector('.modal-backdrop');
				if (modalBackdrop) {
					modalBackdrop.remove();
				}
				fetchPlayerData(currentPage, url);
			} else {
				showAlertModal("알림", "관리자에게 문의하세요.");
			}
		})
		.catch(error => {
			console.error("Error:", error);
			showAlertModal("알림", "서버와의 통신 중 오류가 발생했습니다.");
		});
}

// 능력치 추가 API 호출
function postAbility(personIdx, ability) {
	fetch(`http://3.36.70.208:8080/abilities/actual/${personIdx}`, {
		method: "POST",
		headers: {
			'Content-Type': 'application/json',
			[csrfHeader]: csrfToken
		},
		body: JSON.stringify(ability),
	})
		.then(response => response.json())
		.then(data => {
			if (data !== null) {
				showAlertModal('알림', '능력치가 성공적으로 추가되었습니다.');
			}
		})
		.catch(error => {
			console.error('request failed', error);
		});
}

// 선수 수정
if (document.getElementById('update-player')) {
	document.getElementById('update-player').addEventListener('click', function() {
		const playerInfo = formToObject(document.getElementById('detail-player-info'));
		//console.log(playerInfo);

		const formData = new FormData();

		formData.append('person', new Blob([JSON.stringify(playerInfo)], { type: 'application/json' }));
		const fileInput = document.getElementById('update-personImage');
		formData.append('file', fileInput.files[0]);

		showConfirmModal("확인", "수정하시겠습니까?", function() {
			putPlayer(playerInfo.personIdx, formData);
		})

	});
}


function putPlayer(id, formData) {
	fetch(url + `/${id}/with-image`, {
		method: "PUT",
		headers: {
			[csrfHeader]: csrfToken
		},
		body: formData,
	})
		.then(response => response.json())
		.then(result => {
			if (result != null) {
				showAlertModal("알림", "수정이 완료되었습니다");

				fetchPlayerData(currentPage, url); // 수정 후 데이터 갱신
				modal.style.display = "none";
			} else {
				showAlertModal("알림", "관리자에게 문의하세요.");
			}
		})
		.catch(error => {
			console.error("Error:", error);
			showAlertModal("알림", "서버와의 통신 중 오류가 발생했습니다.");
		});
}

// 삭제
if (document.getElementById('delete-player-btn')) {
	document.getElementById('delete-player-btn').addEventListener('click', function() {
		deletePerson();
	})
}


function deletePerson() {
	const selectedCheckboxes = document.querySelectorAll('.delete-checkbox:checked');
	const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-id'));

	if (selectedIds.length === 0) {
		showAlertModal("알림", "삭제할 항목을 선택하세요.");
		return;
	}

	showConfirmModal("확인", "선택한 항목을 삭제하시겠습니까?", function() {
		const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
		const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

		fetch(url + '/delete-multiple', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(selectedIds)
		})
			.then(response => response.text())
			.then(result => {
				if (result) {
					showAlertModal("알림", "삭제가 완료되었습니다.");
					fetchPlayerData(currentPage, url);
				} else {
					showAlertModal("알림", '관리자에게 문의하세요.');
				}
			})
			.catch(error => {
				console.error("Error:", error);
				showAlertModal("알림", "서버와의 통신 중 오류가 발생했습니다.");
			});
	})
}

// 체크박스 전체 클릭
if (document.getElementById('selectAllCheckbox')) {
	document.querySelector("#selectAllCheckbox").addEventListener("change", function() {
		const isChecked = this.checked;
		const checkboxes = document.querySelectorAll(".delete-checkbox");

		checkboxes.forEach(checkbox => {
			checkbox.checked = isChecked;
		});
	});
}

// 페이징 - 이전 페이지
document.querySelector("#prevGroup").onclick = () => {
	if (currentPage > 0) {
		currentPage--;
		fetchPlayerData(currentPage, url);
	}
};

// 페이징 - 다음 페이지
document.querySelector("#nextGroup").onclick = () => {
	if (currentPage < totalPages - 1) {
		currentPage++;
		fetchPlayerData(currentPage, url);
	}
};

// 페이지 로드
document.addEventListener('DOMContentLoaded', function() {
	fetchPlayerData(currentPage, url);
})




