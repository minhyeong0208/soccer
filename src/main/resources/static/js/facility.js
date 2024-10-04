document.addEventListener('DOMContentLoaded', function() {
    // CSRF 토큰 설정
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // DOM 요소 참조
    const searchLocationButton = document.getElementById('searchLocationButton');
    const facilityLocationInput = document.getElementById('facilityLocation');
    const mapContainer = document.getElementById('map');

    // 지도 및 위치 관련 변수
    let map;
    let marker;
    let selectedLatitude;
    let selectedLongitude;
    let locationSelected = false;

    // 수정 및 삭제 관련 변수
    let selectedFacilityId;
    let deleteId;

    // 페이징 관련 변수
    let currentPage = 0;    // 현재 페이지 번호 
    let totalPages = 0;     // 총 페이지 수 
    let isSearching = false;
    let searchCurrentPage = 0;
    let searchTotalPages = 0;

    // =================== 지도 관련 함수 ===================

    // Kakao 지도 초기화 함수
    function initMap(lat = 33.450701, lng = 126.570667) {
        const mapOptions = {
            center: new kakao.maps.LatLng(lat, lng),
            level: 3
        };

        map = new kakao.maps.Map(mapContainer, mapOptions);

        // 기존 마커 제거
        if (marker) {
            marker.setMap(null);
        }

        // 새로운 마커 추가
        marker = new kakao.maps.Marker({
            position: new kakao.maps.LatLng(lat, lng),
            map: map
        });
    }

    // 초기 지도 로드
    initMap();

    // 지도 이동 함수
    function moveMapToLocation(lat, lng) {
        const moveLatLng = new kakao.maps.LatLng(lat, lng);

        // 지도 중심 이동
        map.setCenter(moveLatLng);

        // 기존 마커 제거
        if (marker) {
            marker.setMap(null);
        }

        // 새로운 마커 추가
        marker = new kakao.maps.Marker({
            position: moveLatLng,
            map: map
        });
    }

    // =================== 모달 및 시설 관련 함수 ===================

    // 위치 검색 버튼 클릭 시 Kakao Postcode API를 사용하여 주소 검색
    if (searchLocationButton) {
        searchLocationButton.addEventListener('click', function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    facilityLocationInput.value = data.address;

                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(data.address, function(result, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            selectedLatitude = result[0].y;
                            selectedLongitude = result[0].x;

                            // 지도와 마커 업데이트
                            initMap(selectedLatitude, selectedLongitude);
                            locationSelected = true;
                        } else {
                            showAlertModal("알림", "위치 정보를 찾을 수 없습니다.");
                        }
                    });
                }
            }).open();
        });
    }

    // 모달창 열릴 때 필드 초기화
    const openAddButton = document.getElementById('openAddFacilityModalButton');
    if (openAddButton) {
        openAddButton.addEventListener('click', function () {
            document.getElementById('facilityName').value = '';
            document.getElementById('facilityLocation').value = '';
            document.getElementById('facilityCapacity').value = '';
            document.getElementById('facilityFoundDate').value = '';
            selectedLatitude = null;
            selectedLongitude = null;
            locationSelected = false;
        });
    }

    // 시설 추가 기능
    const addFacilityButton = document.getElementById('addFacilityButton');
    if (addFacilityButton) {
        addFacilityButton.addEventListener('click', function() {
            const form = document.getElementById('facilityAddForm');
            
            if (!locationSelected) {
                const addFacilityModal = bootstrap.Modal.getInstance(document.getElementById('addFacilityModal'));
                if (addFacilityModal) {
                    addFacilityModal.hide();
                }
                showAlertModal('알림', '시설 위치를 검색하고 선택해야 합니다.');
                return;
            }

            // 폼이 유효한지 검사
            if (form.checkValidity()) {
                const facilityData = {
                    facilityName: document.getElementById('facilityName').value,
                    facilityLocation: document.getElementById('facilityLocation').value,
                    latitude: selectedLatitude,
                    longitude: selectedLongitude,
                    capacity: document.getElementById('facilityCapacity').value,
                    facilityFound: document.getElementById('facilityFoundDate').value
                };

                fetch('/facilities', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        [csrfHeader]: csrfToken
                    },
                    body: JSON.stringify(facilityData)
                })
                .then(response => response.json())
                .then(data => {
                    showAlertModal('추가 성공', '데이터가 성공적으로 추가되었습니다.');
                    loadFacilityData(currentPage);

                    const modal = bootstrap.Modal.getInstance(document.getElementById('addFacilityModal'));
                    modal.hide();
                })
                .catch(error => {
                    console.error('시설 추가 중 오류:', error);
                });
            } else {
                // 폼의 유효성 검사를 트리거
                form.reportValidity();
            }
        });
    }

    // 수정 모달이 열리는 조건
    const openUpdateButton = document.getElementById('openUpdateFacilityModalButton');
    if (openUpdateButton) {
        openUpdateButton.addEventListener('click', function() {
            const checkboxes = document.querySelectorAll('#facilityTableBody input[type="checkbox"]:checked');

            if (checkboxes.length !== 1) {
                showAlertModal("알림", "수정할 항목을 하나만 선택하세요.");
                return;
            }

            const facilityId = checkboxes[0].value;
            openEditModal(facilityId);
        });
    }

    // 수정 버튼 클릭 시 수정 모달을 열고 선택된 시설 정보를 로드하는 함수
    function openEditModal(facilityId) {
        selectedFacilityId = facilityId;

        // 시설 ID를 사용하여 시설 데이터를 가져오는 로직
        fetch(`/facilities/${facilityId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(facility => {
                // 모달의 필드를 가져온 시설 데이터로 채우기
                document.getElementById('editFacilityName').value = facility.facilityName || '';
                document.getElementById('editFacilityLocation').value = facility.facilityLocation || '';
                document.getElementById('editFacilityCapacity').value = facility.capacity || '';
                document.getElementById('editFacilityFoundDate').value = facility.facilityFound
                    ? new Date(facility.facilityFound).toISOString().split('T')[0]
                    : '';

                // 위도와 경도 설정
                selectedLatitude = facility.latitude || null;
                selectedLongitude = facility.longitude || null;

                // 모달 열기
                const editModal = new bootstrap.Modal(document.getElementById('updateFacilityModal'));
                editModal.show();
            })
            .catch(error => {
                console.error('시설 데이터를 불러오는 중 오류 발생:', error);
                showAlertModal("알림", "시설 정보를 불러오는 중 오류가 발생했습니다.");
            });
    }

    // 수정 기능
    const editFacilityButton = document.getElementById('editFacilityButton');
    if (editFacilityButton) {
        editFacilityButton.addEventListener('click', function() {
            const updatedFacilityData = {
                facilityName: document.getElementById('editFacilityName').value,
                facilityLocation: document.getElementById('editFacilityLocation').value,
                capacity: document.getElementById('editFacilityCapacity').value,
                facilityFound: document.getElementById('editFacilityFoundDate').value,
                latitude: selectedLatitude,
                longitude: selectedLongitude
            };

            fetch(`/facilities/${selectedFacilityId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    [csrfHeader]: csrfToken
                },
                body: JSON.stringify(updatedFacilityData)
            })
            .then(response => {
                if (response.ok) {
                    loadFacilityData(currentPage);

                    const editModal = bootstrap.Modal.getInstance(document.getElementById('updateFacilityModal'));
                    editModal.hide();

                    showAlertModal("수정 완료", "수정이 완료되었습니다.");
                } else {
                    showAlertModal("알림", "시설 정보 수정에 실패하였습니다.");
                }
            })
            .catch(error => {
                console.error('시설 정보 수정 중 오류 발생:', error);
                showAlertModal("알림", "시설 정보 수정 중 오류가 발생했습니다.");
            });
        });
    }

    // 위치 검색 버튼 클릭 시 이벤트 핸들러 (수정 모달)
    const searchEditLocationButton = document.getElementById('searchEditLocationButton');
    if (searchEditLocationButton) {
        searchEditLocationButton.addEventListener('click', function() {
            new daum.Postcode({
                oncomplete: function(data) {
                    document.getElementById('editFacilityLocation').value = data.address;

                    const geocoder = new kakao.maps.services.Geocoder();
                    geocoder.addressSearch(data.address, function(result, status) {
                        if (status === kakao.maps.services.Status.OK) {
                            selectedLatitude = result[0].y;
                            selectedLongitude = result[0].x;
                        } else {
                            showAlertModal("알림", "위치 정보를 찾을 수 없습니다.");
                        }
                    });
                }
            }).open();
        });
    }

    // 삭제 버튼 클릭 시
    const openDeleteButton = document.getElementById('openDeleteButton');
    if (openDeleteButton) {
        openDeleteButton.addEventListener('click', function() {
            const selectedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked')).map(checkbox => checkbox.value);
            if (selectedIds.length === 0) {
                showAlertModal('알림', '삭제할 항목을 선택하세요.');
                return;
            }

            deleteId = selectedIds;

            showConfirmModal('삭제 확인', '선택한 항목을 삭제 하시겠습니까?', function() {
                deleteId.forEach(id => {
                    fetch(`/facilities/${id}`, {
                        method: 'DELETE',
                        headers: {
                            [csrfHeader]: csrfToken
                        }
                    })
                    .then(response => {
                        if (response.ok) {
                            console.log(`시설 ID ${id} 삭제 완료`);
                            showAlertModal('삭제 완료', '삭제가 완료되었습니다.');
                            loadFacilityData(currentPage);
                        } else {
                            console.error(`삭제 실패 - 응답 코드: ${response.status}`);
                            response.text().then(errorMessage => {
                                showAlertModal('알림', `시설 ID ${id} 삭제에 실패하였습니다. 서버에서 반환된 메시지: ${errorMessage}`);
                            });
                        }
                    })
                    .catch(error => {
                        console.error(`시설 ID ${id} 삭제 중 오류 발생:`, error);
                        showAlertModal('알림', `시설 ID ${id} 삭제 중 오류가 발생했습니다. 네트워크 상태를 확인해주세요.`);
                    });
                });
            });
        });
    }

    // =================== 데이터 로드 및 페이징 관련 함수 ===================

    // 시설 리스트 데이터 불러오기
    function loadFacilityData(searchField, searchTerm, page) {
        let url;

        if (isSearching && searchField && searchTerm) {
            url = `/facilities/search?${searchField}=${encodeURIComponent(searchTerm)}&page=${page}&size=10`;
        } else {
            url = `/facilities?page=${page}&size=10`;
        }

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 403 || response.status === 401) {
                        showAlertModal("알림", "데이터에 접근할 권한이 없습니다.");
                    } else {
                        showAlertModal("알림", `데이터를 가져오는 중 오류가 발생했습니다. (에러 코드: ${response.status})`);
                    }
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                const facilityTableBody = document.getElementById('facilityTableBody');
                facilityTableBody.innerHTML = ''; // 기존 데이터 초기화

                const facilities = Array.isArray(data.content) ? data.content : [];

                if (facilities.length > 0) {
                    facilities.forEach(facility => {
                        const foundDate = facility.facilityFound ? new Date(facility.facilityFound).toISOString().split('T')[0] : 'N/A';

                        const row = `<tr data-lat="${facility.latitude}" data-lng="${facility.longitude}">
                                        <td><input type="checkbox" value="${facility.facilityIdx}"></td>
                                        <td>${facility.facilityName !== null ? facility.facilityName : 'N/A'}</td>
                                        <td>${facility.facilityLocation !== null ? facility.facilityLocation : 'N/A'}</td>
                                        <td>${facility.capacity !== null ? facility.capacity : 'N/A'}</td>
                                        <td>${foundDate}</td>
                                    </tr>`;
                        facilityTableBody.insertAdjacentHTML('beforeend', row);
                    });

                    // 페이지 정보 업데이트
                    totalPages = data.totalPages;
                    renderPaginationButtons(totalPages, page, isSearching);

                    // 행을 클릭했을 때 지도를 이동시키는 이벤트 처리
                    document.querySelectorAll('#facilityTableBody tr').forEach(row => {
                        row.style.cursor = 'pointer';

                        row.addEventListener('click', function() {
                            const lat = parseFloat(this.getAttribute('data-lat'));
                            const lng = parseFloat(this.getAttribute('data-lng'));

                            if (!isNaN(lat) && !isNaN(lng)) {
                                moveMapToLocation(lat, lng);
                            } else {
                                showAlertModal("알림", "이 시설의 위치 정보가 없습니다.");
                            }
                        });

                        row.addEventListener('mouseenter', function() {
                            row.style.backgroundColor = '#f0f0f0';
                        });

                        row.addEventListener('mouseleave', function() {
                            row.style.backgroundColor = '';
                        });
                    });
                } else {
                    facilityTableBody.innerHTML = '<tr><td colspan="5">검색 결과가 없습니다.</td></tr>';
                }
            })
            .catch(error => {
                console.error('시설 데이터를 불러오는 중 오류 발생:', error);
            });
    }
	
	// 페이지 버튼 렌더링 함수
	function renderPaginationButtons(totalPages, currentPage, isSearch) {
	    const pageButtons = $('#pageButtons');
	    pageButtons.empty(); // 기존 버튼 초기화

	    // 이전 버튼 생성
	    pageButtons.append(`
	        <li class="page-item ${currentPage === 0 ? 'disabled' : ''}">
	            <button class="page-link" id="prevGroup" data-search="${isSearch}">이전</button>
	        </li>
	    `);

	    // 페이지 번호 버튼 생성
	    for (let i = 0; i < totalPages; i++) {
	        const pageButton = `
	            <li class="page-item ${i === currentPage ? 'active' : ''}">
	                <button class="page-link" data-page="${i}" data-search="${isSearch}">${i + 1}</button>
	            </li>`;
	        pageButtons.append(pageButton);
	    }

	    // 다음 버튼 생성
	    pageButtons.append(`
	        <li class="page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}">
	            <button class="page-link" id="nextGroup" data-search="${isSearch}">다음</button>
	        </li>
	    `);
	}

	$(document).on('click', '.page-link', function() {
	    const page = $(this).data('page');
	    const isSearch = $(this).data('search');
	    const buttonId = $(this).attr('id');

	    if (buttonId === 'prevGroup') {
	        // 이전 버튼 클릭 처리
	        if (currentPage > 0) {
	            currentPage--;
	        } else {
	            return; // 더 이상 이전 페이지가 없으므로 함수 종료
	        }
	    } else if (buttonId === 'nextGroup') {
	        // 다음 버튼 클릭 처리
	        if (currentPage < totalPages - 1) {
	            currentPage++;
	        } else {
	            return; // 더 이상 다음 페이지가 없으므로 함수 종료
	        }
	    } else if (page !== undefined) {
	        // 페이지 번호 버튼 클릭 처리
	        currentPage = page;
	    }

	    if (isSearch) {
	        const searchTerm = $('#searchInput').val().trim();
	        loadFacilityData('facilityName', searchTerm, currentPage); // 검색 처리
	    } else {
	        loadFacilityData(null, '', currentPage); // 일반 페이지 처리
	    }
	});

	// 초기 데이터 로드 시 1페이지부터 로드
	$(document).ready(function() {
		loadFacilityData(null, '', 0);  // 기본 데이터 0페이지 로드
	});

	// 검색 기능
	document.getElementById('searchButton').addEventListener('click', function() {
		const searchTerm = document.getElementById('searchInput').value.trim();

		if (!searchTerm) {
			showAlertModal("알림", "검색어를 입력해주세요.");	
			return;
		}

		isSearching = true;
		searchCurrentPage = 0;
		loadFacilityData('facilityName', searchTerm, searchCurrentPage);
	});

	// 초기 데이터 로드
	loadFacilityData(currentPage);
});