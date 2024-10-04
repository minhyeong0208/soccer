let currentPage = 0;
const pageSize = 10;
const maxVisiblePages = 10;
let totalPages = 1;
let selectedTrainIdx = null;
let playersToAdd = []; // 추가할 선수 목록 저장
let playersToRemove = []; // 제거할 선수 목록 저장
let currentParticipants = []; // 현재 참가자 목록 저장

const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

// 훈련 리스트 로드
function loadTrainData(page) {
	fetch(`/trains?page=${page}&size=${pageSize}`)
		.then(response => response.json())
		.then(data => {
			const table = document.querySelector("#trainTable tbody");
			table.innerHTML = '';

			data.content.forEach((train, index) => {
				const row = document.createElement('tr');
				row.setAttribute('data-id', train.trainIdx);
				row.innerHTML = `
                    <td><input type="checkbox" class="delete-checkbox" data-id="${train.trainIdx}"></td>
                    <td>${train.trainName}</td>
                    <td>${formatTime(train.startTime)}</td>
                    <td>${formatTime(train.endTime)}</td>
                    <td>${formatDate(train.startDate)}</td>
                    <td>${formatDate(train.endDate)}</td>
                    <td>${train.countMem}</td>
                `;
				row.addEventListener('click', () => {
					selectedTrainIdx = train.trainIdx; // 선택된 훈련의 인덱스를 저장
					showTrainDetails(train);
				});
				table.appendChild(row);

				// 첫 번째 훈련을 자동 선택
				if (index === 0 && selectedTrainIdx === null) {
					selectedTrainIdx = train.trainIdx; // 가장 위에 있는 훈련을 선택
					showTrainDetails(train); // 해당 훈련의 상세 정보를 보여줌
				}
			});

			totalPages = data.totalPages; // totalPages 업데이트
			updatePaginationButtons(page, totalPages);

			// 모두 선택 체크박스 동작 처리
			handleSelectAll();
		})
		.catch(error => console.error('Error fetching data:', error));
}

// 페이지네이션 버튼 생성
function updatePaginationButtons(page, totalPages) {
	const pageButtons = document.querySelector("#pageButtons");
	pageButtons.innerHTML = ''; // 이전 페이지 버튼들을 초기화

	let startPage = Math.max(0, page - Math.floor(maxVisiblePages / 2));
	let endPage = Math.min(totalPages, startPage + maxVisiblePages);

	for (let i = startPage; i < endPage; i++) {
		pageButtons.innerHTML += `
            <li class="page-item ${i === page ? 'active' : ''}">
                <button class="page-link" onclick="loadTrainData(${i})">${i + 1}</button>
            </li>`;
	}

	document.querySelector("#prevGroup").disabled = page === 0;
	document.querySelector("#nextGroup").disabled = page >= totalPages - 1;
}

// 이전/다음 버튼 이벤트 추가
document.getElementById('prevGroup').addEventListener('click', function() {
	if (currentPage > 0) {
		currentPage--;
		loadTrainData(currentPage); // 이전 페이지로 이동
	}
});

document.getElementById('nextGroup').addEventListener('click', function() {
	if (currentPage < totalPages - 1) {
		currentPage++;
		loadTrainData(currentPage); // 다음 페이지로 이동
	}
});

// 모두 선택 체크박스 처리
function handleSelectAll() {
	const selectAllCheckbox = document.getElementById('selectAllCheckbox');
	const checkboxes = document.querySelectorAll('.delete-checkbox');

	selectAllCheckbox.addEventListener('change', function() {
		checkboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
		});
	});

	checkboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			selectAllCheckbox.checked = Array.from(checkboxes).every(cb => cb.checked);
		});
	});
}

// 선수 목록의 전체 선택 체크박스 처리
function handleSelectAllPlayers() {
	const selectAllPersonCheckbox = document.getElementById('selectAllPerson');
	const playerCheckboxes = document.querySelectorAll('.player-checkbox');

	selectAllPersonCheckbox.addEventListener('change', function() {
		playerCheckboxes.forEach(checkbox => {
			checkbox.checked = this.checked;
			togglePlayerSelection(checkbox);
		});
	});

	playerCheckboxes.forEach(checkbox => {
		checkbox.addEventListener('change', function() {
			togglePlayerSelection(checkbox);
			selectAllPersonCheckbox.checked = Array.from(playerCheckboxes).every(cb => cb.checked);
		});
	});
}

function togglePlayerSelection(checkbox) {
	const personIdx = parseInt(checkbox.value);
	if (checkbox.checked) {
		if (!currentParticipants.includes(personIdx) && !playersToAdd.includes(personIdx)) {
			playersToAdd.push(personIdx);
		}
		playersToRemove = playersToRemove.filter(id => id !== personIdx);
	} else {
		if (currentParticipants.includes(personIdx) && !playersToRemove.includes(personIdx)) {
			playersToRemove.push(personIdx);
		}
		playersToAdd = playersToAdd.filter(id => id !== personIdx);
	}
}

// 훈련 상세 정보 표시 및 선수 목록 로드
function showTrainDetails(train) {
	document.getElementById('noSelectionMessage').style.display = 'none';
	document.getElementById('trainInfo').style.display = 'block';

	document.getElementById('detailTrainName').textContent = train.trainName;
	document.getElementById('detailStartDate').textContent = formatDate(train.startDate);
	document.getElementById('detailEndDate').textContent = formatDate(train.endDate);
	document.getElementById('detailStartTime').textContent = formatTime(train.startTime);
	document.getElementById('detailEndTime').textContent = formatTime(train.endTime);
	document.getElementById('detailCountMem').textContent = train.countMem;
	document.getElementById('detailArea').textContent = train.area;
	document.getElementById('detailMemo').textContent = train.memo;

	loadParticipants(selectedTrainIdx);
	loadPlayerData(selectedTrainIdx);

	document.getElementById('playerSection').style.display = 'block';
}

// 훈련 참가자 목록 로드
function loadParticipants(trainIdx) {
	if (!trainIdx) {
		console.error("Invalid trainIdx");
		return;
	}
	fetch(`/trains/${trainIdx}`)
		.then(response => response.json())
		.then(data => {
			const participantsContainer = document.getElementById('participantsContainer');
			participantsContainer.innerHTML = data.trainMems.map(mem => mem.person.personName).join(', ') || '참가자가 없습니다.';
			currentParticipants = data.trainMems.map(mem => mem.person.personIdx); // 현재 참가자 목록 저장
		})
		.catch(error => console.error('참가자 목록을 불러오는 중 오류 발생:', error));
}

// 선수 목록 가져오기
function loadPlayerData(trainIdx) {
	if (!trainIdx) {
		console.error("Invalid trainIdx");
		return;
	}
	fetch('/persons/players?page=0&size=500')
		.then(response => response.json())
		.then(players => {
			return fetch(`/trains/${trainIdx}`)
				.then(response => response.json())
				.then(training => {
					const participants = training.trainMems.map(mem => mem.person.personIdx);
					const table = document.querySelector("#playerTable tbody");
					table.innerHTML = '';
					playersToAdd = []; // 초기화
					playersToRemove = []; // 초기화

					players.content.forEach(player => {
						console.log(players); // 응답 확인
						const isChecked = participants.includes(player.personIdx) ? 'checked' : '';
						const row = document.createElement('tr');
						row.innerHTML = `
                            <td><input type="checkbox" class="player-checkbox" value="${player.personIdx}" ${isChecked}></td>
                            <td>${player.backNumber}</td>
                            <td>${player.personName}</td>
                            <td>${player.position}</td>
                        `;
						table.appendChild(row);
					});

					handleSelectAllPlayers(); // 전체 선택 체크박스 및 개별 체크박스 동작 처리
				});
		})
		.catch(error => console.error('Error fetching player data:', error));
}

// 선수 추가/삭제 버튼 클릭 시 서버로 변경 사항 전송
document.getElementById('addPlayersToTrain').addEventListener('click', function() {
	const promises = [];

	if (playersToAdd.length > 0) {
		promises.push(
			fetch(`/trains/${selectedTrainIdx}/add-participants`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[csrfHeader]: csrfToken
				},
				body: JSON.stringify(playersToAdd)
			}).catch(error => console.error('참가자 추가 중 오류 발생:', error))
		);
	}

	if (playersToRemove.length > 0) {
		playersToRemove.forEach(personIdx => {
			promises.push(
				fetch(`/trains/${selectedTrainIdx}/remove-participant/${personIdx}`, {
					method: 'DELETE',
					headers: {
						'Content-Type': 'application/json',
						[csrfHeader]: csrfToken
					}
				}).catch(error => console.error('참가자 삭제 중 오류 발생:', error))
			);
		});
	}

	Promise.all(promises).then(() => {
		loadParticipants(selectedTrainIdx);
		loadPlayerData(selectedTrainIdx);
	});
});

// 날짜, 시간 포맷 변환 함수
function formatDate(dateStr) {
	return new Date(dateStr).toISOString().split('T')[0];
}

function formatTime(dateStr) {
	return new Date(dateStr).toISOString().split('T')[1].substring(0, 5);
}

// 페이지 로드 시 초기 데이터 로드
document.addEventListener("DOMContentLoaded", function() {
	loadTrainData(currentPage);
	document.getElementById('trainInfo').style.display = 'none';
	document.getElementById('noSelectionMessage').style.display = 'block';
});

// 훈련 추가 버튼 클릭 시
document.getElementById("trainForm").addEventListener("submit", function(event) {
	event.preventDefault(); // 폼의 기본 제출 동작 막기
	const trainName = document.getElementById('trainName').value;
	const startDate = document.getElementById('startDate').value;
	const endDate = document.getElementById('endDate').value;
	const startTime = document.getElementById('startTime').value;
	const endTime = document.getElementById('endTime').value;
	const trainArea = document.getElementById('trainPlace').value;
	const trainMemo = document.getElementById('trainMemo').value;
	const countMem = document.getElementById('limitCount').value;

	const newTrain = {
		trainName: trainName,
		startDate: `${startDate}T${startTime}:00.000+00:00`,
		endDate: `${endDate}T${endTime}:00.000+00:00`,
		startTime: `${startDate}T${startTime}:00.000+00:00`,
		endTime: `${endDate}T${endTime}:00.000+00:00`,
		area: trainArea,
		memo: trainMemo,
		countMem: countMem
	};

	fetch('/trains', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			[csrfHeader]: csrfToken
		},
		body: JSON.stringify(newTrain)
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('훈련 추가 실패');
			}
			return response.json();
		})
		.then(data => {
			//console.log('훈련 추가 성공:', data);
			showAlertModal('추가 성공', "데이터가 성공적으로 추가되었습니다.")
			loadTrainData(currentPage); // 훈련 목록 다시 로드
			document.getElementById('trainForm').reset(); // 폼 초기화

			const modalElement = document.getElementById('trainModal');
			const modalInstance = bootstrap.Modal.getInstance(modalElement);
			modalInstance.hide();
		})
		.catch(error => {
			console.error('훈련 추가 중 오류 발생:', error);
		});
});

// 훈련 수정 모달 열기
document.getElementById('editTrainButton').addEventListener('click', function() {
	if (!selectedTrainIdx) {
		showAlertModal('알림', '수정할 훈련을 선택하세요.');
		return;
	}

	fetch(`/trains/${selectedTrainIdx}`)
		.then(response => response.json())
		.then(train => {
			document.getElementById('editTrainName').value = train.trainName;
			document.getElementById('editTrainPlace').value = train.area;
			document.getElementById('editStartDate').value = formatDate(train.startDate);
			document.getElementById('editEndDate').value = formatDate(train.endDate);
			document.getElementById('editStartTime').value = formatTime(train.startTime);
			document.getElementById('editEndTime').value = formatTime(train.endTime);
			document.getElementById('editLimitCount').value = train.countMem;
			document.getElementById('editTrainMemo').value = train.memo;
		})
		.catch(error => console.error('Error fetching train data:', error));

	const editModal = new bootstrap.Modal(document.getElementById('editTrainModal'));
	editModal.show();
});

// 훈련 수정 후 즉시 화면 갱신
document.getElementById('saveTrainChanges').addEventListener('click', function() {

	const updatedTrain = {
		trainName: document.getElementById('editTrainName').value,
		area: document.getElementById('editTrainPlace').value,
		startDate: document.getElementById('editStartDate').value,
		endDate: document.getElementById('editEndDate').value,
		startTime: document.getElementById('editStartDate').value + "T" + document.getElementById('editStartTime').value + ":00.000+00:00",
		endTime: document.getElementById('editEndDate').value + "T" + document.getElementById('editEndTime').value + ":00.000+00:00",
		memo: document.getElementById('editTrainMemo').value,
		countMem: document.getElementById('editLimitCount').value
	};

	fetch(`/trains/${selectedTrainIdx}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			[csrfHeader]: csrfToken
		},
		body: JSON.stringify(updatedTrain)
	})
		.then(response => {
			if (!response.ok) throw new Error('훈련 수정 실패');
			return response.json();
		})
		.then(() => {
			loadTrainData(currentPage); // 훈련 목록 다시 로드
			showTrainDetails(updatedTrain); // 수정된 훈련 상세 정보 업데이트
			const editModal = bootstrap.Modal.getInstance(document.getElementById('editTrainModal'));
			editModal.hide();

			// 수정 완료 알림 모달 표시
			showAlertModal('수정 완료', '수정이 완료되었습니다.');
		})
		.catch(error => console.error('훈련 수정 중 오류 발생:', error));
});

// 훈련 삭제
document.getElementById('deleteTrainButton').addEventListener('click', function() {
	if (!selectedTrainIdx) {
		showAlertModal('알림', '삭제할 항목을 선택하세요.');
		return;
	}

	// showConfirmModal 함수 호출
	showConfirmModal('삭제 확인', '정말로 이 훈련을 삭제하시겠습니까?', function() {
		// 확인이 되었을 때 실행되는 콜백 함수
		fetch(`/trains/${selectedTrainIdx}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			}
		})
			.then(response => {
				if (!response.ok) throw new Error('훈련 삭제 실패');
				return response.text();
			})
			.then(() => {

				// 삭제 완료 후 '삭제가 완료되었습니다.' 모달 표시
				showAlertModal('삭제 완료', '삭제가 완료되었습니다.');
				document.getElementById('trainInfo').style.display = 'none';
				//document.getElementById('playerSection').style.display = 'none';
				document.getElementById('noSelectionMessage').style.display = 'block';
				loadTrainData(currentPage);
				selectedTrainIdx = null; // 삭제 후 selectedTrainIdx 초기화
			})
			.catch(error => {
				console.error('훈련 삭제 중 오류 발생:', error);
			});
	});
});


// 날짜 및 시간 포맷 함수

function formatDate(dateStr) {
	return new Date(dateStr).toISOString().split('T')[0];
}

function formatTime(dateStr) {
	return new Date(dateStr).toISOString().split('T')[1].substring(0, 5);
}

// 초기 로딩
document.addEventListener("DOMContentLoaded", function() {
	loadTrainData(currentPage);
	document.getElementById('trainInfo').style.display = 'none';
	document.getElementById('noSelectionMessage').style.display = 'block';
});

// 선택된 항목 삭제
// 선택된 항목 삭제
document.querySelector('button[type="deleteButton"]').addEventListener('click', function() {
	const selectedCheckboxes = document.querySelectorAll('.delete-checkbox:checked');
	const selectedTrainIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-id'));

	if (selectedTrainIds.length === 0) {
		showAlertModal('알림', '삭제할 항목을 선택하세요.');
		return;
	}

	// showConfirmModal 호출, 확인 후 삭제 진행
	showConfirmModal('삭제 확인', `선택한 항목을 삭제하시겠습니까?`, function() {
		const deletePromises = selectedTrainIds.map(trainId => {
			return fetch(`/trains/${trainId}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					[csrfHeader]: csrfToken
				}
			}).then(response => {
				if (!response.ok) throw new Error(`훈련 ${trainId} 삭제 실패`);
				return response.text();
			});
		});

		// 모든 삭제 작업이 완료된 후에 실행
		Promise.all(deletePromises)
			.then(() => {
				// 삭제가 완료된 후 화면을 업데이트하고 알림 모달을 띄움
				document.getElementById('trainInfo').style.display = 'none';
				document.getElementById('noSelectionMessage').style.display = 'block';
				document.getElementById('playerSection').style.display = 'none';
				loadTrainData(currentPage); // 삭제 후 데이터 다시 로드
				selectedTrainIdx = null; // 선택된 훈련 인덱스 초기화
				
				// 삭제 완료 알림 모달 표시
				showAlertModal('삭제 완료', '삭제가 완료되었습니다.');
			})
			.catch(error => {
				console.error('훈련 삭제 중 오류 발생:', error);
			});
	});
});


function searchTrains(trainName, page) {
	fetch(`/trains/search?trainName=${encodeURIComponent(trainName)}&page=${page}&size=${pageSize}`)
		.then(response => response.json())
		.then(data => {
			const table = document.querySelector("#trainTable tbody");
			table.innerHTML = ''; // 기존 데이터 초기화

			data.content.forEach(train => {
				const row = document.createElement('tr');
				row.setAttribute('data-id', train.trainIdx);
				row.innerHTML = `
                    <td><input type="checkbox" class="delete-checkbox" data-id="${train.trainIdx}"></td>
                    <td>${train.trainName}</td>
                    <td>${formatTime(train.startTime)}</td>
                    <td>${formatTime(train.endTime)}</td>
                    <td>${formatDate(train.startDate)}</td>
                    <td>${formatDate(train.endDate)}</td>
                    <td>${train.countMem}</td>
                `;
				row.addEventListener('click', () => {
					selectedTrainIdx = train.trainIdx;
					showTrainDetails(train);
				});
				table.appendChild(row);
			});

			totalPages = data.totalPages; // totalPages 업데이트
			updatePaginationButtons(page, data.totalPages);
			handleSelectAll(); // 모두 선택 체크박스 동작 처리
		})
		.catch(error => console.error('Error fetching search results:', error));
}

document.getElementById('searchButton').addEventListener('click', function() {
	const trainName = document.getElementById('searchInput').value;
	if (trainName.trim() === '') {
		showAlertModal('알림', '훈련명을 입력하세요.');
		return;
	}
	currentPage = 0; // 검색 시 첫 페이지부터 시작
	searchTrains(trainName, currentPage);
});
