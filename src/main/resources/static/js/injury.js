$(document).ready(function() {
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    let injuryData = [];   // 부상 데이터를 저장할 배열
    let playerData = [];   // 선수 데이터를 저장할 배열
    let currentPage = 0;   // 현재 페이지 번호
    const pageSize = 10;   // 한 페이지에 보여줄 항목 수
    let totalPages = 0;    // 전체 페이지 수
    let selectedIds = [];  // 선택된 항목의 ID를 저장하는 배열

	$(document).ready(function() {
	    const fields = [
	        { id: 'addInjuryPlayer', message: '선수를 선택해 주세요.' },
	        { id: 'addInjuryDate', message: '부상 날짜를 입력해 주세요.' },
	        { id: 'addInjuryPart', message: '부상 부위를 입력해 주세요.' },
	        { id: 'addDoctor', message: '의사 이름을 입력해 주세요.' },
	        { id: 'addRecoveryPeriod', message: '회복 기간을 입력해 주세요.' }
	    ];

	    // 필드가 입력되었는지 확인하는 함수
	    function validateFields() {
	        let allFilled = true;
	        for (const field of fields) {
	            if (!$('#' + field.id).val()) {
	                allFilled = false;
	                break;
	            }
	        }
	        $('#addInjuryButton').prop('disabled', !allFilled);  // 모든 필드가 채워져야 버튼 활성화
	    }

	    // 각 필드에 입력 이벤트 리스너 추가
	    fields.forEach(field => {
	        $('#' + field.id).on('input', validateFields);
	    });

	    // 추가 버튼 클릭 시
	    $('#addInjuryButton').on('click', function() {
	        let newInjury = {
	            person: { personIdx: $('#addInjuryPlayer').val() },
	            brokenDate: $('#addInjuryDate').val(),
	            injuryPart: $('#addInjuryPart').val(),
	            severity: $('input[name="addSeverity"]:checked').val(),
	            doctor: $('#addDoctor').val(),
	            recovery: $('#addRecoveryPeriod').val(),
	            memo: $('#addMemo').val()
	        };

	        $.ajax({
	            url: '/injuries',
	            method: 'POST',
	            contentType: 'application/json',
	            headers: {
	                'Content-Type': 'application/json',
	                [csrfHeader]: csrfToken
	            },
	            data: JSON.stringify(newInjury),
	            success: function(response) {
	                showAlertModal("추가 성공", "데이터가 성공적으로 추가되었습니다.");
	                $('#addInjuryModal').modal('hide');  // 부상 추가 모달 닫기
	                loadInjuryData(currentPage);         // 추가 후 리스트 새로 로드

	                // 부상 정보 추가 후 입력 필드 초기화 
	                $('#addInjuryPlayer').val('');
	                $('#addInjuryDate').val('');
	                $('#addInjuryPart').val('');
	                $('input[name="addSeverity"]').prop('checked', false);
	                $('#addDoctor').val('');
	                $('#addRecoveryPeriod').val('');
	                $('#addMemo').val('');

	                validateFields(); // 필드 초기화 후 다시 버튼 비활성화
	            },
	            error: function(error) {
	                console.error('부상 정보를 추가하는 중 오류 발생:', error)
	                showAlertModal("알림", "부상 정보를 추가하는 중 오류가 발생했습니다.");
	            }
	        });
	    });

	    // 페이지 로드 시 초기 필드 상태 확인
	    validateFields();
	});

    // 부상 데이터 불러오기
    function loadInjuryData(page = 0) {
        $.ajax({
            url: `/injuries?page=${page}&size=${pageSize}`,
            method: "GET",
            success: function(injuryDataResponse) {
                injuryData = injuryDataResponse.content;
                totalPages = injuryDataResponse.totalPages;

                $.ajax({
                    url: "/injuries/players",
                    method: "GET",
                    success: function(data) {
                        playerData = data;
                        renderTable(injuryData);      // 부상 리스트 렌더링
                        renderPaginationButtons();    // 페이지 버튼 렌더링
                    },
                    error: function(error) {
                        console.error("선수 데이터를 가져오는 중 오류 발생:", error);
                    }
                });
            },
            error: function(error) {
                console.error("부상 데이터를 가져오는 중 오류 발생:", error);
            }
        });
    }

    // 페이지 로드 시 데이터 불러오기
    loadInjuryData(currentPage);

    // 테이블에 데이터를 렌더링하는 함수
    function renderTable(data) {
        let injuryTableBody = $("#injuryTableBody");
        injuryTableBody.empty();  // 기존 데이터 초기화

        $.each(data, function(index, injury) {
            let player = playerData.find(p => p.injuries.some(i => i.injuryIdx === injury.injuryIdx)) || {};

            let backNumber = player.backNumber || '--';
            let personName = player.personName || '--';
            let brokenDate = injury.brokenDate ? new Date(injury.brokenDate).toISOString().split('T')[0] : '--';

            let tableRow = `
                <tr style="cursor: pointer;" data-id="${player.personIdx || ''}">
                    <td><input type="checkbox" class="rowCheckbox" value="${injury.injuryIdx}"></td>
                    <td>${backNumber}</td>
                    <td>${personName}</td>
                    <td>${brokenDate}</td>
                </tr>`;
            injuryTableBody.append(tableRow);
        });
    }

    // 부상 정보 수정
    $('#updateInjuryButton').on('click', function() {
        let injuryIdx = $('#injuryId').val();
        let updatedInjury = {
            brokenDate: $('#editInjuryDate').val(),
            injuryPart: $('#editInjuryPart').val(),
            memo: $('#editMemo').val(),
            severity: $('input[name="editSeverity"]:checked').val(),
            doctor: $('#editDoctor').val(),
            recovery: $('#editRecoveryPeriod').val()
        };

        $.ajax({
            url: `/injuries/${injuryIdx}`,
            method: "PUT",
            contentType: "application/json",
            headers: {
                'Content-Type': 'application/json',
                [csrfHeader]: csrfToken
            },
            data: JSON.stringify(updatedInjury),
			success: function(response) {
			    showAlertModal("수정 완료", "수정이 완료되었습니다.");
			    $('#editInjuryModal').modal('hide');  // 부상 수정 모달 닫기
			    loadInjuryData(currentPage);          // 수정 후 리스트 새로 로드
			},
            error: function(error) {
                console.error("부상 정보를 수정하는 중 오류 발생:", error);
				showAlertModal("알림", "부상 정보 수정 중 오류가 발생했습니다.");
				
            }
        });
    });

    // 부상 삭제
	// 삭제 버튼 클릭 시 삭제할 시설의 ID를 저장하고, 삭제 확인 모달을 띄움
	document.getElementById('openDeleteButton').addEventListener('click', function() {
	    const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
	    
	    if (selectedIds.length === 0) {
	        showAlertModal("알림", "삭제할 항목을 선택하세요.");
	        return;
	    }

	    // 삭제 확인 모달을 띄우고, 사용자가 확인을 클릭하면 삭제를 수행
	    showConfirmModal("삭제 확인", "선택한 항목을 삭제 하시겠습니까?", function() {
	        let deleteRequests = [];

	        selectedIds.forEach(id => {
	            deleteRequests.push(
	                $.ajax({
	                    url: `/injuries/${id}`,
	                    method: 'DELETE',
	                    headers: { [csrfHeader]: csrfToken }
	                })
	            );
	        });

	        // 모든 삭제 요청이 완료된 후 삭제 완료 알림 모달을 띄움
	        $.when.apply($, deleteRequests).done(function() {
	            showAlertModal("삭제 완료", "삭제가 완료되었습니다.");
	            loadInjuryData(currentPage); // 삭제 후 리스트 새로 로드
	        }).fail(function(error) {
	            console.error("삭제 중 오류 발생:", error);
	            showAlertModal("알림", "삭제 중 오류가 발생했습니다.");
	        });
	    });
	});

    // 전체 선택 체크박스 클릭 시 모든 체크박스의 상태를 변경
    $('#selectAllCheckbox').on('click', function() {
        let isChecked = $(this).is(':checked');
        $('.rowCheckbox').prop('checked', isChecked);
    });

    // 개별 체크박스 클릭 시 전체 선택 체크박스의 상태를 업데이트
    $('#injuryTableBody').on('change', '.rowCheckbox', function() {
        let allChecked = $('.rowCheckbox:checked').length === $('.rowCheckbox').length;
        $('#selectAllCheckbox').prop('checked', allChecked);
    });

    // 검색 버튼 클릭 시 검색어에 맞는 데이터 필터링 및 페이지네이션 조정
    $('#searchButton').on('click', function() {
        let searchField = $('#searchField').val();
        let searchTerm = $('#searchInput').val().toLowerCase();
        
        if (!searchTerm) {
			showAlertModal("알림", "검색어를 입력해주세요.");
            return;
        }

        let filteredData = injuryData.filter(function(injury) {
            let player = playerData.find(p => p.injuries.some(i => i.injuryIdx === injury.injuryIdx)) || {};

            if (searchField === 'name') {
                return player.personName && player.personName.toLowerCase().includes(searchTerm);
            }
            if (searchField === 'position') {
                return player.position && player.position.toLowerCase().includes(searchTerm);
            }
            return false;
        });

        renderTableWithPagination(filteredData);
    });

    // 페이지 이동 버튼 클릭 시 이벤트 처리
	$(document).on('click', '.page-link', function() {
	    const thisId = $(this).attr('id');
	    if (thisId === 'prevGroup') {
	        if (currentPage > 0) {
	            currentPage--;
	        }
	    } else if (thisId === 'nextGroup') {
	        if (currentPage < totalPages - 1) {
	            currentPage++;
	        }
	    } else {
	        currentPage = $(this).data('page');
	    }
	    loadInjuryData(currentPage);
	});

	function renderPaginationButtons() {
	    let pageButtons = $('#pageButtons');
	    pageButtons.empty();

	    // 이전 버튼 생성
	    pageButtons.append(`
	        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}" id="prevGroupItem">
	            <button class="page-link" id="prevGroup" ${currentPage === 0 ? 'disabled' : ''}>이전</button>
	        </li>
	    `);

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

	    // 다음 버튼 생성
	    pageButtons.append(`
	        <li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}" id="nextGroupItem">
	            <button class="page-link" id="nextGroup" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>다음</button>
	        </li>
	    `);
	}



    // 테이블 행 클릭 시, 해당 선수 정보와 부상 정보를 표시 및 이미지 로드
    $('#injuryTableBody').on('click', 'tr', function() {
        let playerId = $(this).data('id');  // tr에 저장된 data-id 값 가져오기

        let player = playerData.find(p => p.personIdx == playerId);
        // console.log('First Injury Data:', injuryData[0]);
        // console.log('Player Data:', playerData);

        if (player) {
            $('#playerNumber').text(player.backNumber || '--');
            $('#playerName').text(player.personName || '--');
            $('#playerPosition').text(player.position || '--');
            $('#playerHeight').text(player.height ? player.height + 'cm' : '--');
            $('#playerWeight').text(player.weight ? player.weight + 'kg' : '--');

            loadPlayerImage(player.personName);

            if (player.injuries && player.injuries.length > 0) {
                let injury = player.injuries[0];
                $('#editInjuryPlayer').val(player.personName);
                $('#editInjuryDate').val(new Date(injury.brokenDate).toISOString().split('T')[0]);
                $('#editInjuryPart').val(injury.injuryPart || '');
                $('input[name="editSeverity"][value="' + injury.severity + '"]').prop('checked', true);
                $('#editDoctor').val(injury.doctor || '');
                $('#editMemo').val(injury.memo || '');
                $('#editRecoveryPeriod').val(injury.recovery || 0);
                $('#injuryId').val(injury.injuryIdx);
            } else {
				showAlertModal("알림", "선수에게 부상 정보가 없습니다.");
            }
        } else {
            console.error("해당 선수 정보를 찾을 수 없습니다.");
        }
    });

    // 모달창 열 때 선수 목록 로드 및 입력 필드 초기화
    $('#openAddInjuryModalButton').on('click', function() {
        loadPlayerOptions();

        $('#addInjuryPlayer').val('');
        $('#addInjuryDate').val('');
        $('#addInjuryPart').val('');
        $('input[name="addSeverity"]').prop('checked', false);
        $('#addDoctor').val('');
        $('#addRecoveryPeriod').val('');
        $('#addMemo').val('');
    });

    // 선수 목록을 가져와서 선택 필드에 추가하는 함수 (부상 추가용)
    function loadPlayerOptions() {
        $.ajax({
            url: '/injuries/players',
            method: 'GET',
            success: function(players) {
                let playerSelect = $('#addInjuryPlayer');
                playerSelect.empty();
                playerSelect.append('<option value="">선수명 선택</option>');

                $.each(players, function(index, player) {
                    playerSelect.append(`<option value="${player.personIdx}">${player.personName}</option>`);
                });
            },
            error: function(error) {
                console.error('선수 목록을 불러오는 중 오류 발생:', error);
            }
        });
    }

    // 필터링된 데이터로 페이지네이션을 다시 생성하고 테이블에 렌더링하는 함수
    function renderTableWithPagination(filteredData) {
        let totalItems = filteredData.length;
        totalPages = Math.ceil(totalItems / pageSize);
        currentPage = 0;  // 필터링 후 첫 페이지로 초기화

        renderPaginationButtons();
        renderTable(filteredData.slice(currentPage * pageSize, (currentPage + 1) * pageSize));
    }

    // 선수의 이미지를 동적으로 로드하는 함수
    function loadPlayerImage(playerName) {
        let imagePath = `/img/persons/${playerName}.png`;

        let playerImage = document.getElementById('playerImage');

        playerImage.src = imagePath;
        playerImage.onerror = function() {
            this.onerror = null;  // 무한 루프 방지
            this.src = '/img/persons/default.png';
        };
    }
});