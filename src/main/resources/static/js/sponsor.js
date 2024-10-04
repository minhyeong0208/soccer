let currentPage = 0;
const pageSize = 10;
const maxVisiblePages = 10; // 최대 표시 페이지 수
let totalPages = 1;

const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

// 스폰서 데이터를 로드하는 함수
function loadSponsorData(page) {
	currentPage = page;

	const startDate = document.querySelector('#startDate').value;
	const endDate = document.querySelector('#endDate').value;
	const keyword = document.querySelector('#searchKeyword').value;

	// 기본 URL 설정
	let url = `/sponsors/search-by-name-and-date?page=${page}&size=${pageSize}`;

	// 조건에 따라 URL에 파라미터 추가 (필터 조건 결합)
	const params = [];

	// 스폰서 이름 추가
	if (keyword) {
		params.push(`sponsorName=${encodeURIComponent(keyword)}`);
	}

	// 시작일과 종료일이 모두 있을 때만 기간 검색 파라미터 추가
	if (startDate && endDate) {
		params.push(`startDate=${startDate}`);
		params.push(`endDate=${endDate}`);
	}

	// 조건이 있는 경우 URL에 추가
	if (params.length > 0) {
		url += `&${params.join('&')}`;
	}

	// fetch로 데이터 요청
	fetch(url)
		.then(response => response.json())
		.then(data => {
			const table = document.querySelector("#sponsorTable tbody");
			const pageButtons = document.querySelector("#pageButtons");

			totalPages = data.totalPages;
			table.innerHTML = '';

			// 자료가 없을 경우 버튼 비활성화
			const updateButton = document.getElementById("updateAllButton");
			const deleteButton = document.getElementById("deleteSponsorButton");

			if (data.content.length === 0) {
				updateButton.disabled = true;
				deleteButton.disabled = true;
			} else {
				updateButton.disabled = false;
				deleteButton.disabled = false;
			}

			// 각 스폰서 데이터를 테이블에 추가
			data.content.forEach(sponsor => {
				const contractDate = formatDate(sponsor.contractDate);
				const startDate = formatDate(sponsor.startDate);
				const endDate = formatDate(sponsor.endDate);

				table.innerHTML += `
                    <tr data-id="${sponsor.sponsorIdx}">
                        <td><input type="checkbox" class="delete-checkbox" data-id="${sponsor.sponsorIdx}"></td>
                        <td><input type="text" class="editable form-control form-control-sm" data-field="sponsorName" value="${sponsor.sponsorName}"></td>
                        <td><input type="date" class="editable form-control form-control-sm" data-field="contractDate" value="${contractDate}"></td>
                        <td><input type="text" class="editable form-control form-control-sm" data-field="price" value="${sponsor.price}"></td>
                        <td><input type="text" class="editable form-control form-control-sm" data-field="contractCondition" value="${sponsor.contractCondition}"></td>
                        <td><input type="date" class="editable form-control form-control-sm" data-field="startDate" value="${startDate}"></td>
                        <td><input type="date" class="editable form-control form-control-sm" data-field="endDate" value="${endDate}"></td>
                        <td><input type="text" class="editable form-control form-control-sm" data-field="sponsorMemo" value="${sponsor.sponsorMemo}"></td>
                    </tr>`;
			});

			// 페이지네이션 버튼 처리
			pageButtons.innerHTML = '';
			let startPage = Math.max(0, currentPage - Math.floor(maxVisiblePages / 2));
			let endPage = Math.min(totalPages, startPage + maxVisiblePages);

			if (endPage - startPage < maxVisiblePages) {
				startPage = Math.max(0, endPage - maxVisiblePages);
			}

			for (let i = startPage; i < endPage; i++) {
				pageButtons.innerHTML += `
                    <li class="page-item ${i === page ? 'active' : ''}">
                        <button class="page-link" onclick="loadSponsorData(${i})">${i + 1}</button>
                    </li>`;
			}

			document.querySelector("#prevGroup").disabled = currentPage === 0;
			document.querySelector("#nextGroup").disabled = currentPage >= totalPages - 1;
		})
		.catch(error => console.error('Error fetching data:', error));
}

// Unix 타임스탬프를 YYYY-MM-DD 형식으로 변환하는 함수
function formatDate(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1 필요
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

document.querySelector("#searchButton").onclick = () => {
	const startDate = document.querySelector('#startDate').value;
	const endDate = document.querySelector('#endDate').value;

	// 시작 날짜 또는 종료 날짜가 하나만 입력된 경우 경고 모달 추가
	if ((startDate && !endDate) || (!startDate && endDate)) {
		showAlertModal("알림", "기간 검색을 하려면 시작일과 종료일을 모두 입력하세요.");
		return; // 더 이상 진행하지 않음
	}

	// 날짜 비교: startDate가 있고, endDate가 있으며, startDate가 endDate보다 클 경우
	if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
		showAlertModal("알림", "시작 날짜는 종료 날짜보다 이전이어야 합니다.");
		return; // 더 이상 진행하지 않음
	}

	currentPage = 0;
	loadSponsorData(currentPage);
};

// 선택 삭제 기능
document.getElementById("deleteSponsorButton").onclick = function() {
	const selectedCheckboxes = document.querySelectorAll(".delete-checkbox:checked");
	const idsToDelete = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute("data-id"));

	if (idsToDelete.length > 0) {
		showConfirmModal('삭제 확인', `선택한 항목을 삭제하시겠습니까?`, function() {
			fetch(`/sponsors/delete-multiple`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					[csrfHeader]: csrfToken
				},
				body: JSON.stringify(idsToDelete)
			})
				.then(response => {
					if (!response.ok) {
						throw new Error('Network response was not ok');
					}
					showAlertModal("삭제 완료", "삭제가 완료되었습니다."); // 삭제 완료 알림 추가
					loadSponsorData(currentPage); // 삭제 후 데이터 재로드
				})
				.catch(error => {
					console.error('Error deleting data:', error);
				});
		});
	} else {
		showAlertModal("알림", "삭제할 항목을 선택하세요.");
	}
};

// 전체 선택/해제 기능
document.getElementById("selectAllCheckbox").onclick = function() {
	const checkboxes = document.querySelectorAll(".delete-checkbox");
	const isChecked = this.checked;
	checkboxes.forEach(checkbox => {
		checkbox.checked = isChecked;
	});
};

// 모달 인스턴스를 생성
const sponsorModal = new bootstrap.Modal(document.getElementById('sponsorModal'));

// 스폰서 추가 시 날짜 그대로 사용
document.getElementById("sponsorForm").addEventListener("submit", function(event) {
	event.preventDefault(); // 폼의 기본 제출 동작 막기
	const sponsorName = document.getElementById("sponsorName").value;
	const contractDate = document.getElementById("contractDate").value;
	const price = document.getElementById("contractPrice").value;
	const contractCondition = document.getElementById("contractCondition").value;
	const sponsorMemo = document.getElementById("sponsorMemo").value;
	const startDate = document.getElementById("editStartDate").value;
	const endDate = document.getElementById("editEndDate").value;

	const sponsorData = {
		sponsorName: sponsorName,
		contractDate: contractDate, // 입력값 그대로 사용
		price: parseInt(price),
		contractCondition: contractCondition,
		sponsorMemo: sponsorMemo,
		startDate: startDate, // 입력값 그대로 사용
		endDate: endDate // 입력값 그대로 사용
	};

	fetch(`/sponsors`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			[csrfHeader]: csrfToken
		},
		body: JSON.stringify(sponsorData)
	})
		.then(response => {
			if (!response.ok) {
				throw new Error('Network response was not ok');
			}
			return response.json();
		})
		.then(data => {
			console.log('Success:', data);
			const modal = bootstrap.Modal.getInstance(document.getElementById("sponsorModal"));
			modal.hide(); // 모달 닫기
			showAlertModal('추가 성공', '데이터가 성공적으로 추가되었습니다.'); // 추가 완료 알림 모달 표시
			loadSponsorData(currentPage); // 데이터 재로드
		})
		.catch(error => {
			console.error('Error:', error);
		});
});

document.getElementById("updateAllButton").onclick = function() {
	// 모든 수정된 셀의 데이터를 수집
	const rows = document.querySelectorAll("#sponsorTable tbody tr");
	const updatedSponsors = Array.from(rows).map(row => {
		const sponsorIdx = row.getAttribute('data-id');
		return {
			sponsorIdx: sponsorIdx,
			sponsorName: row.querySelector('input[data-field="sponsorName"]').value,
			contractDate: row.querySelector('input[data-field="contractDate"]').value,
			price: parseInt(row.querySelector('input[data-field="price"]').value),
			contractCondition: row.querySelector('input[data-field="contractCondition"]').value,
			startDate: row.querySelector('input[data-field="startDate"]').value,
			endDate: row.querySelector('input[data-field="endDate"]').value,
			sponsorMemo: row.querySelector('input[data-field="sponsorMemo"]').value
		};
	});

	// 변경된 데이터를 서버로 전송
	updatedSponsors.forEach(sponsorData => {
		fetch(`/sponsors/${sponsorData.sponsorIdx}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				[csrfHeader]: csrfToken
			},
			body: JSON.stringify(sponsorData)
		})
			.then(response => {
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				showAlertModal("수정 완료", "수정이 완료되었습니다.");

				document.querySelector('#startDate').value = '';
				document.querySelector('#endDate').value = '';
				document.querySelector('#searchKeyword').value = '';
				loadSponsorData(currentPage); // 수정 후 데이터 재로드
			})
			.catch(error => {
				console.error('Error updating data:', error);
			});
	});
};


// 이전/다음 버튼 클릭 시 currentPage를 기반으로 페이지 이동
document.querySelector("#prevGroup").onclick = () => {
	if (currentPage > 0) {
		loadSponsorData(currentPage - 1);
	}
};

document.querySelector("#nextGroup").onclick = () => {
	if (currentPage < totalPages - 1) {
		loadSponsorData(currentPage + 1);
	}
};

document.addEventListener("DOMContentLoaded", function() {
	loadSponsorData(currentPage);
});