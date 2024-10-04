$(document).ready(function() {
	const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
	const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

	/**
	 * user 권한일 때 read만 가능하도록
	 */
	const isUserPath = window.location.pathname.includes('/user/');
	if (isUserPath) {
		// 추가 버튼 숨기기
		$('#openAddTransferModalButton').hide();
		// 삭제 버튼 숨기기
		$('#deleteSelectedBtn').hide();
		// 수정 버튼 숨기기
		$('#updateTransferButton').hide();

		// 체크박스 비활성화
		$('input[name="rowCheckbox"]').prop('disabled', true);
		$('#selectAllCheckbox').prop('disabled', true);

		// 테이블의 모든 입력 필드를 읽기 전용으로 설정
		$('.transfer-form-container input, .transfer-form-container select, .transfer-form-container textarea').prop('readonly', true);
		$('.transfer-form-container select').prop('disabled', true);

		// AJAX 요청 인터셉터 추가
		$(document).ajaxSend(function(e, xhr, options) {
			if (options.type !== "GET") {
				xhr.abort();  // GET 요청이 아닌 경우 요청 중단
			}
		});
	}

	let transferData = [];
	let currentPage = 0;
	let transferType = '전체'; // string | enum['구매', '판매']
	const pageSize = 10;
	let totalPages = 0;



	// 숫자에 콤마 추가하는 함수
	function addCommas(num) {
		return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
	}

	// 콤마가 있는 문자열에서 숫자만 추출하는 함수
	function removeCommas(str) {
		return str.replace(/,/g, '');
	}

	// 이적료 입력 필드에 콤마 추가 이벤트 리스너
	$('#editPrice, #addPrice, #addSellPrice').on('input', function() {
		let value = removeCommas($(this).val());
		if (value !== '') {
			value = parseInt(value, 10);
			if (!isNaN(value)) {
				$(this).val(addCommas(value));
			}
		}
	});

	/**
	 * 이적 유형 필터 이벤트 리스너
	 */
	document.querySelectorAll('input[name="transferTypeFilter"]').forEach(radio => {
		radio.addEventListener('change', function() {
			transferType = this.value;
			currentPage = 0; // 필터 변경 시 첫 페이지로 리셋
			console.log('# transferTypeFilter > click')
			search();
		});
	});

	/**
	 * 전체 선택 체크박스 이벤트
	 */
	document.getElementById('selectAllCheckbox').addEventListener('change', function() {
		const checkboxes = document.getElementsByName('rowCheckbox');
		for (let checkbox of checkboxes) {
			checkbox.checked = this.checked;
		}
	});

	/**
	 * 개별 체크박스 이벤트
	 */
	document.addEventListener('DOMContentLoaded', function() {
		const transferTableBody = document.getElementById('transferTableBody');

		transferTableBody.addEventListener('change', function(event) {
			if (event.target && event.target.name === 'rowCheckbox') {
				updateSelectAllCheckbox();
			}
		});
	});

	/**
	 * 전체 선택 체크박스 상태 업데이트 함수
	 */
	function updateSelectAllCheckbox() {
		const checkboxes = document.getElementsByName('rowCheckbox');
		const selectAllCheckbox = document.getElementById('selectAllCheckbox');

		let allChecked = true;
		for (let checkbox of checkboxes) {
			if (!checkbox.checked) {
				allChecked = false;
				break;
			}
		}

		selectAllCheckbox.checked = allChecked;
	}

	/**
	 * 선택 삭제 버튼 이벤트 리스너
	 */
	document.getElementById('deleteSelectedBtn').addEventListener('click', showDeleteConfirmModal);

	/**
	 * 삭제 모달 Open 및 Validation
	 */
	function showDeleteConfirmModal() {
		const selectedTransfers = document.querySelectorAll('input[name="rowCheckbox"]:checked');
		if (selectedTransfers.length > 0) {
			const modal = new bootstrap.Modal(document.getElementById('deleteConfirmModal'));
			modal.show();
		} else {
			showModal('알림', '삭제할 이적 항목을 선택해주세요.');
		}
	}

	/**
	 * 삭제 확인 이벤트
	 */
	$('#confirmDeleteButton').on('click', function() {
		remove();
	});

	/**
	 * searchField 변경 이벤트 리스너
	 */
	$('#searchField').on('change', function() {
		let filterType = $(this).val();
		// 검색 입력 필드의 placeholder 갱신
		$('#searchInput').attr('placeholder', filterType === 'person' ? '선수명 입력' : '팀명 입력');
	});

	/**
	 * searchInput에서 엔터 키 입력 이벤트 리스너
	 */
	$('#searchInput').on('keypress', function(e) {
		if (e.which === 13) { // 13은 엔터 키의 keyCode
			console.log('# searchInput > enter key pressed');
			search();
			e.preventDefault(); // 폼 제출 방지
		}
	});

	/**
	 * 검색 버튼
	 */
	$('#searchButton').on('click', function() {
		console.log('# searchButton > click')
		search();
	});

	/**
	 * 검색
	 */
	function search(caller) {
		let searchField = $('#searchField').val();
		let searchTerm = $('#searchInput').val().toLowerCase();

		let state = 0;

		console.log('# caller >', caller);
		if (caller === '.page-link' || caller === '#prevGroup' || caller === '#nextGroup') {
			state = currentPage;
		}

		const url = `/transfers?${searchField}=${searchTerm}&page=${state}&size=${pageSize}`
			+ (transferType !== '' ? `&transferType=${transferType}` : '');

		$.ajax({
			url: url,
			method: 'GET',
			success: function(data) {
				transferData = data.content;
				totalPages = data.totalPages;
				currentPage = data.number;
				renderTable(transferData);
				renderPaginationButtons();
			},
			error: function(error) {
				console.error('검색 중 오류 발생:', error);
				alert('검색 중 오류가 발생했습니다.');
			}
		});
	}

	/**
	 * 페이지네이션 이벤트
	 */
	$(document).on('click', '.page-link', function() {
		// prevGroup과 nextGroup 버튼에 대해서는 이벤트를 처리하지 않음
		const thisId = $(this).attr('id');
		if (thisId === 'prevGroup' || thisId === 'nextGroup') {
			return;
		}
		currentPage = $(this).data('page');
		search('.page-link');
	});

	/**
	 * 이전 버튼 클릭 이벤트
	 */
	$('#prevGroup').on('click', function() {
		if (currentPage > 0) {
			currentPage--;
			search('#prevGroup');
		}
	});

	/**
	 * 다음 버튼 클릭 이벤트
	 */
	$('#nextGroup').on('click', function() {
		if (currentPage < totalPages - 1) {
			currentPage++;
			search('#nextGroup');
		}
	});

	/**
	 * 페이지네이션 버튼 렌더링
	 */
	function renderPaginationButtons() {
		let pageButtons = $('#pageButtons');
		pageButtons.empty();

		console.log('# currentPage, totalPages >', currentPage, totalPages)

		// 이전 버튼 상태 설정
		$('#prevGroupItem').toggleClass('disabled', currentPage === 0).find('#prevGroup').prop('disabled', currentPage === 0);

		// 다음 버튼 상태 설정
		$('#nextGroupItem').toggleClass('disabled', currentPage >= totalPages - 1).find('#nextGroup').prop('disabled', currentPage >= totalPages - 1);

		let startPage = Math.max(0, currentPage - 2);
		let endPage = Math.min(totalPages - 1, startPage + 4);

		if (startPage > 0) {
			pageButtons.append(`<li class="page-item"><button class="page-link" data-page="0">1</button></li>`);
			if (startPage > 1) {
				pageButtons.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
			}
		}

		for (let i = startPage; i <= endPage; i++) {
			pageButtons.append(`
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <button class="page-link" data-page="${i}">${i + 1}</button>
            </li>
        `);
		}

		if (endPage < totalPages - 1) {
			if (endPage < totalPages - 2) {
				pageButtons.append('<li class="page-item disabled"><span class="page-link">...</span></li>');
			}
			pageButtons.append(`<li class="page-item"><button class="page-link" data-page="${totalPages - 1}">${totalPages}</button></li>`);
		}
	}

	/**
	 * 이적 데이터 로드
	 */
	function loadTransfer(page = 0) {
		const url = `/transfers?page=${page}&size=${pageSize}`
			+ (transferType !== '전체' ? `&transferType=` + transferType : '');
		$.ajax({
			url: url,
			method: "GET",
			success: function(response) {
				transferData = response.content;
				totalPages = response.totalPages;
				renderTable(transferData);
				renderPaginationButtons();
			},
			error: function(error) {
				console.error("이적 데이터를 가져오는 중 오류 발생:", error);
			}
		});
	}

	/**
	 * 테이블 렌더링
	 */
	function renderTable(data) {
		let transferTableBody = $("#transferTableBody");
		transferTableBody.empty();

		$.each(data, function(index, transfer) {
			transferTableBody.append(`
            <tr style="cursor: pointer;" data-id="${transfer.transferIdx}">
                <td><input type="checkbox" name="rowCheckbox" value="${transfer.transferIdx}"></td>
                <td>${transfer.transferType === 1 ? '구매' : '판매'}</td>
                <td>${transfer.person ? transfer.person.personName : (transfer.playerName || '--')}</td>
                <td>${transfer.opponent || '--'}</td>
                <td>${new Date(transfer.tradingDate).toLocaleDateString()}</td>
                <td>${new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(transfer.price)}</td>
                <td>${transfer.transferMemo || ''}</td>
            </tr>
        `);
		});
	}

	/**
	 * 선수 이미지 로드
	 */
	function loadPlayerImage(backNumber, personName) {
		const url = `/persons/image?backNumber=${backNumber}&personName=${personName}`;
		let playerImage = document.getElementById('playerImage');

		fetch(url, {
			headers: {
				[csrfHeader]: csrfToken
			}
		})
			.then(response => {
				if (!response.ok) throw new Error('이미지 정보를 가져오는데 실패했습니다.');
				return response.text();
			})
			.then(imagePath => {
				playerImage.src = '/img/persons/' + imagePath;
				playerImage.onerror = function() {
					this.onerror = null;
					this.src = '/img/persons/default.png';
				};
			})
			.catch(error => {
				console.error('Error:', error);
				playerImage.src = '/img/persons/default.png';
				alert('이미지 정보를 불러오는 중 오류가 발생했습니다.');
			});
	}

	/**
	 * 선수 프로필 조회
	 */
	function loadPlayerInfo(transfer) {
		$('#playerNumber').text(transfer.person ? transfer.person.backNumber : '--');
		$('#playerName').text(transfer.playerName || '--');    // 선수 이름
		$('#playerPosition').text(transfer.person ? transfer.person.position : '--');
		$('#playerHeight').text(transfer.person ? transfer.person.height + 'cm' : '--');
		$('#playerWeight').text(transfer.person ? transfer.person.weight + 'kg' : '--');

		loadPlayerImage(transfer.person ? transfer.person.backNumber : -1,
			transfer.person ? transfer.person.personName : 'default');

		// 우측 하단 선수명도 playerName으로 표시
		$('#editTransferPlayer').val(transfer.playerName || '--');

		// 날짜 처리 수정
		let date = new Date(transfer.tradingDate);
		date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
		$('#editTransferDate').val(date.toISOString().split('T')[0]);

		$('#editTransferType').val(transfer.transferType);
		$('#editOpponent').val(transfer.opponent);
		$('#editPrice').val(addCommas(transfer.price));
		$('#editTransferMemo').val(transfer.transferMemo || '');
		$('#transferId').val(transfer.transferIdx);
	}

	/**
	 * 테이블 행 클릭 이벤트 (선수 프로필 조회)
	 */
	$('#transferTableBody').on('click', 'tr', function() {
		let transferId = $(this).data('id');
		let transfer = transferData.find(t => t.transferIdx === transferId);

		if (transfer) loadPlayerInfo(transfer);
	});

	/**
	 * 이적 추가 모달 오픈 이벤트
	 */
	$('#openAddTransferModalButton').on('click', function() {
		loadTeamOptions();
		// loadPlayerOptions();
		// resetAddTransferForm();
		const selectedValue = $('input[name="transferType"]:checked').val();
		switchFormMode(selectedValue);
		updatePlayerNameField(selectedValue);
	});

	/**
	 * 이적 추가 Form Mode 구성
	 */
	function switchFormMode(selectedValue) {
		var addForm1 = $('#addForm1');
		var addForm2 = $('#addForm2');
		var nextInfoButton = $('#nextInfoButton');
		var backInfoButton = $('#backInfoButton');
		var saveButton = $('#saveButton');

		switch (selectedValue) {
			case 'buy':
				console.log('구매가 선택되었습니다.');
				addForm1.show();
				addForm2.hide();
				nextInfoButton.show();
				backInfoButton.hide();
				saveButton.hide();
				break;
			case 'sell':
				console.log('판매가 선택되었습니다.');
				addForm1.show();
				addForm2.hide();
				nextInfoButton.hide();
				backInfoButton.hide();
				saveButton.show();
				break;
			case 'next':
				console.log('선수 추가 정보 버튼 클릭 (다음 버튼)');
				addForm1.hide();
				addForm2.show();
				nextInfoButton.hide();
				backInfoButton.show();
				saveButton.show();
				break;
			case 'back':
				console.log('선수 추가 정보 버튼 클릭 (이전 버튼)');
				addForm1.show();
				addForm2.hide();
				nextInfoButton.show();
				backInfoButton.hide();
				saveButton.hide();
				break;
			default:
				console.log('알 수 없는 값입니다.');
		}
	}

	/**
	 * TODO : 내용 검토 필요
	 */
	function fetchAndPopulatePlayerList(selectElement) {
		$.ajax({
			url: '/transfers/person/list',
			method: 'GET',
			success: function(response) {
				selectElement.html('<option value="">선수를 선택하세요</option>');
				$.each(response, function(personIdx, personName) {
					selectElement.append($('<option>', {
						value: personIdx,
						text: personName
					}));
				});
			},
			error: function(error) {
				console.error('Error fetching player list:', error);
			}
		});
	}

	/**
	 * TODO : 내용 검토 필요
	 */
	function updatePlayerNameField(transferType) {
		var container = $('#playerNameContainer');
		container.empty(); // 기존 내용을 비웁니다

		if (transferType === 'buy') {
			// 구매의 경우: text input 생성
			container.html('<input type="text" class="form-control" id="addPlayerName" autocomplete="off">');
		} else if (transferType === 'sell') {
			// 판매의 경우: select (콤보박스) 생성 및 데이터 로드
			var select = $('<select class="form-control" id="addPlayerName"></select>');
			container.append(select);
			fetchAndPopulatePlayerList(select);
		}
	}

	/**
	 * 이적 타입 변경 이벤트
	 */
	$('input[name="transferType"]').on('change', function() {
		var selectedValue = $(this).val();
		console.log('Selected transfer type:', selectedValue);
		switchFormMode(selectedValue);
		updatePlayerNameField(selectedValue);
	});

	/**
	 * 이적 추가 form validation
	 */
	function validationForm1() {
		const requiredFields = ['addPlayerName', 'addTradingDate', 'addPrice', 'addOpponent'];
		let isValid = true;
		let firstInvalidField = null;

		// 각 필수 필드 검사
		requiredFields.forEach(fieldId => {
			const field = $(`#${fieldId}`);
			const value = field.val().trim();

			if (value === '') {
				isValid = false;
				field.addClass('is-invalid');
				if (!firstInvalidField) firstInvalidField = field;
			} else {
				field.removeClass('is-invalid');
			}
		});

		// 메모 필드는 선택사항이므로 별도 처리
		const memoField = $('#addMemo');
		memoField.removeClass('is-invalid');

		if (!isValid) {
			// // 유효성 검사 실패 시 처리
			showModal('입력 오류', '모든 필수 항목을 입력해주세요.');
			if (firstInvalidField) firstInvalidField.focus();
			return false;
		}

		console.log('모든 필드가 유효합니다.');
		return true;
	}

	/**
	 * 다음 버튼 이벤트
	 * - 선수 기본 정보 폼 비활성화
	 * - 선수 추가 정보 폼 활성화
	 */
	$('#nextInfoButton').on('click', function() {
		if (validationForm1()) switchFormMode('next');
	});

	/**
	 * 이전 버튼 이벤트
	 * - 선수 기본 정보 폼 활성화
	 * - 선수 추가 정보 폼 비활성화
	 */
	$('#backInfoButton').on('click', function() {
		switchFormMode('back');
	});

	// 이적 정보 업데이트 이벤트
	$('#updateTransferButton').on('click', function() {
		let transferIdx = $('#transferId').val();
		let transferData = {
			transferType: $('#editTransferType').val(),
			tradingDate: $('#editTransferDate').val(),
			opponent: $('#editOpponent').val(),
			price: removeCommas($('#editPrice').val()),
			transferMemo: $('#editTransferMemo').val()
		};

		const url = `/transfers/${transferIdx}`;

		fetch(url, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(transferData),
		})
			.then(response => {
				if (!response.ok) {
					return response.json().then(err => { throw err; });
				}
				return response.text();
			})
			.then(data => {
				showModal('성공', '이적 정보 수정을 완료하였습니다.', (event) => {
					location.reload();
				});
			})
			.catch((error) => {
				let errMsg = '이적 정보 수정 중 오류가 발생했습니다.\n';
				Object.values(error).forEach(value => {
					const item = '\n• ' + value;
					errMsg += item;
				});
				showModal('오류', errMsg);
			});
	});

	// 팀 옵션 로드 (강원FC 제외)
	function loadTeamOptions() {
		$.ajax({
			url: '/teams',
			method: 'GET',
			success: function(teams) {
				let teamItems = $('#addOpponent');
				teamItems.empty().append('<option value="">상대팀 선택</option>');
				teams.forEach(team => {
					if (team.teamName !== '강원FC') {
						teamItems.append(`<option value="${team.teamName}">${team.teamName}</option>`);
					}
				});
			},
			error: function(error) {
				console.error('팀 목록 로드 중 오류 발생:', error);
			}
		});
	}

	/**
	 * 저장 버튼
	 */
	$('#saveButton').on('click', function() {
		if (!validationForm1()) return;

		const selectedValue = $('input[name="transferType"]:checked').val();
		(selectedValue === 'buy') ? buy() : sell()
	});

	/**
	 * 구매 (비동기 처리)
	 */
	async function buy() {
		let price = $('#addPrice').val();

		// 업로드된 이미지를 처리
		const addPlayerImage = $('#addPlayerImage')[0].files[0];
		let uploadedImageLocation = '';
		if (addPlayerImage) {
			try {
				uploadedImageLocation = await uploadImage(addPlayerImage);  // 이미지 업로드 완료까지 대기
			} catch (error) {
				console.error('Error in handleAddPlayer:', error);
				showModal('오류', '선수 이미지 업로드 중 오류가 발생했습니다.');
				return;  // 이미지 업로드가 실패하면 이후 코드 실행 중단
			}
		}

		// Transfer 데이터 구성
		var transferData = {
			personName: $('#addPlayerName').val(),
			tradingDate: $('#addTradingDate').val(),
			price: removeCommas(price),
			opponent: $('#addOpponent').val(),
			transferMemo: $('#addMemo').val(),
			person: {
				birth: $('#addPlayerBirthdate').val(),
				nationality: $('#addPlayerNationality').val(),
				backNumber: $('#addPlayerBackNumber').val(),
				position: $('input[name="playerPosition"]:checked').val(),
				contractStart: $('#addPlayerContractStart').val(),
				contractEnd: $('#addPlayerContractEnd').val(),
				personImage: uploadedImageLocation, // 업로드된 이미지 경로
				height: $('#addPlayerHeight').val(),  // 키 입력 추가
				weight: $('#addPlayerWeight').val()   // 몸무게 입력 추가
			}
		};

		// Transfer 데이터 전송
		fetch('/transfers/buy', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(transferData)
		})
			.then(response => response.statusText)
			.then(data => {
				const modal = bootstrap.Modal.getInstance(document.getElementById('addTransferModal'));
				modal.hide();
				showModal('성공', '정상적으로 영입을 완료하였습니다.', (event) => {
					location.reload();
				});
			})
			.catch(error => {
				let errMsg = '구매 중 오류가 발생하였습니다.\n';
				Object.values(error).forEach(value => {
					const item = '\n• ' + value;
					errMsg += item;
				});
				showModal('오류', errMsg);
			});
	}


	/**
	 * 판매
	 */
	function sell() {
		let price = $('#addPrice').val();

		var transferData = {
			personIdx: $('#addPlayerName').val(),
			tradingDate: $('#addTradingDate').val(),
			price: removeCommas(price),
			opponent: $('#addOpponent').val(),
			transferMemo: $('#addMemo').val()
		};

		console.log('# transferData > ', transferData);

		fetch('/transfers/sell', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(transferData)
		})
			.then(response => {
				return response.statusText;
			})
			.then(data => {
				const modal = bootstrap.Modal.getInstance(document.getElementById('addTransferModal'));
				modal.hide();
				showModal('성공', '정상적으로 판매를 완료하였습니다.', (event) => {
					location.reload();
				});
			})
			.catch((error) => {
				let errMsg = '판매 중 오류가 발생하였습니다.\n';
				Object.values(error).forEach(value => {
					const item = '\n• ' + value;
					errMsg += item;
				});
				showModal('오류', errMsg);
			});
	}

	/**
	 * 삭제
	 */
	function remove() {
		const selectedCheckboxes = document.querySelectorAll('input[name="rowCheckbox"]:checked');
		const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.value);

		// validation은 이전에 처리하였음

		fetch('/transfers', {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(selectedIds)
		})
			.then(response => {
				if (!response.ok) {
					return response.text().then(text => {
						throw new Error(text || '서버 응답이 올바르지 않습니다.');
					});
				}
				return response.text().then(text => {
					return text ? JSON.parse(text) : {};
				});
			})
			.then(data => {
				const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
				modal.hide();
				showModal('성공', '선택한 이적 기록을 성공적으로 삭제했습니다.', (event) => {
					location.reload();
				});
			})
			.catch((error) => {
				let errMsg = '이적 기록 삭제 중 오류가 발생했습니다.\n';
				Object.values(error).forEach(value => {
					const item = '\n• ' + value;
					errMsg += item;
				});
				showModal('오류', errMsg);
			});
	}

	/**
	 * 이미지 업로드 (비동기 처리)
	 */
	async function uploadImage(file) {
		const formData = new FormData();
		formData.append('file', file);

		try {
			const response = await fetch('/persons/add-only-image', {
				method: 'POST',
				headers: { [csrfHeader]: csrfToken },
				body: formData
			});
			const data = await response.json();
			return data.imageLocation;
		} catch (error) {
			console.error('Error uploading image:', error);
			throw error;
		}
	}

	$('#addPlayerImage').on('change', function(event) {
		var file = event.target.files[0];
		if (file) {
			var reader = new FileReader();
			reader.onload = function(e) {
				$('#playerImagePreview').attr('src', e.target.result);
			}
			reader.readAsDataURL(file);
		}
	});

	// 초기 데이터 로드 호출
	loadTransfer(currentPage);

	function showModal(title, message, callback) {
		const modalElement = document.getElementById('customModal');
		const modalTitle = modalElement.querySelector('.modal-title');
		const modalBody = modalElement.querySelector('.modal-body');

		modalTitle.textContent = title;
		modalBody.textContent = message;
		modalBody.style.whiteSpace = 'pre-line';
		modalBody.style.wordWrap = 'break-word';

		const modal = new bootstrap.Modal(modalElement);
		// 이전 이벤트 리스너 제거
		$('#customModal').off('hidden.bs.modal');
		$('#customModal').on('hidden.bs.modal', callback);
		modal.show();
	}
});