// 페이징
let currentPage = 0;
const pageSize = 10;
const maxVisiblePages = 10;
let totalPages = 1;

let totalPeople = [];
let mappedPeople = [];

let url = `http://localhost:80/persons`;

// csrf
const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

// form 입력값 객체로
const formToObject = (form) =>
    Array.from(new FormData(form)).reduce(
        (acc, [key, value]) => ({...acc, [key]: value}),
        {}
    );

// 전체 데이터 불러오기
function fetchCoachData(page, url) {
    currentPage = page;

    // 수정하기
    url += `/coaches?page=${page}&size=${pageSize}`;

    console.log(url);
    fetch(url)
        .then(response => response.json())
        .then(data => {
            console.group(data.content);
            totalPeople = data.content.filter(person => person.typeCode === 'coach');

            const pageButtons = document.querySelector("#pageButtons");
            totalPages = data.totalPages;

            let tableBody = document.getElementById('person-rows');
            tableBody.innerHTML = '';


            mappedPeople = totalPeople
                .map(
                    (person) => {
                        if(document.getElementById('selectAllCheckbox')){
                            return `<tr class="person-rows" data-id="${person.personIdx}">
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
                                    </tr>`;
                        } else {
                            return `<tr class="person-rows" data-id="${person.personIdx}">                                      
                                        <td>
                                            ${person.personName}
                                        </td>
                                        <td>
                                            <span class="position position--${person.position}">
                                                ${person.position}
                                            </span>
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
			            <button class="page-link" onclick="fetchCoachData(${i}, url)">${i + 1}</button>
			        </li>`;
            }

            // 이전/다음 그룹 버튼 활성화/비활성화 설정
            document.querySelector("#prevGroup").disabled = currentPage === 0;
            document.querySelector("#nextGroup").disabled = currentPage >= totalPages - 1;

            // 리스트 첫번째 데이터 상세보기
            console.log(totalPeople[0]);
            showDetail(totalPeople[0]);

        })
        .catch(error => console.error('Error while fetching data', error))
}

// 검색
document.getElementById('search-btn').addEventListener('click', function () {
    const searchOption = document.getElementById('search-option').value;
    const searchValue = document.getElementById('search-value').value;
    currentPage = 0;

    // 수정하기
    url += `/search?`;

    if (searchOption && !searchValue) {
        showAlertModal('알림', '검색어를 입력하세요');
        return;
    } else {
        url += `${searchOption}=${searchValue}&page=${currentPage}&size=${pageSize}`;
        console.log(url);
    }

    fetchCoachData(currentPage, url);
    url = `http://localhost:80/persons`;

})


// 데이트 피커 하루 전으로 나오는 문제
function convertDate(date) {
    date = new Date(date);
    let offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset);
}

// 상세보기
function showDetail(person) {
    document.getElementById('detail-personName').value = person.personName;
    document.getElementById('detail-height').value = person.height;
    document.getElementById('detail-weight').value = person.weight;
    document.getElementById('detail-position').value = person.position;
    document.getElementById('detail-birth').value = convertDate(person.birth).toISOString().split("T", 1);
    document.getElementById('detail-contractStart').value = convertDate(person.contractStart).toISOString().split("T", 1);
    document.getElementById('detail-contractEnd').value = convertDate(person.contractEnd).toISOString().split("T", 1);
    document.getElementById('detail-nationality').value = person.nationality;
    document.getElementById('detail-personIdx').value = person.personIdx;
    //document.getElementById('detail-backNumber').value = person.backNumber;

    document.getElementById('person-detail-image').setAttribute('src', `/img/persons/${person.personImage}`);
    document.getElementById('person-detail-image').setAttribute('onerror', `this.onerror = null; this.src = '/img/persons/default.png';`);

}

// 특정 사람 상세보기
document.getElementById('person-table-widget').addEventListener('click', function (e) {
    const row = e.target.closest('tr.person-rows');

    if (row) {
        const personIdx = row.getAttribute('data-id');
        const person = totalPeople.find(person => person.personIdx === parseInt(personIdx));
        if (person) {
            showDetail(person);
        }
    }
})

// 코치 추가 모달
const modal = document.getElementById("coach-modal");
const modalTitle = document.getElementById("modalTitle");
const dateLabel = document.getElementById("dateLabel");
const closeButtons = document.getElementsByClassName("close");
if (document.getElementById("add-coach-btn")) {
    const addCoachButton = document.getElementById("add-coach-btn");
    // 코치 추가 입력폼 모달
    addCoachButton.onclick = function () {
        modal.style.display = "block";
    }
}

// 모달 닫기
for (let i = 0; i < closeButtons.length; i++) {
    closeButtons[i].onclick = function () {
        modal.style.display = "none";
    }
}

// 코치 추가
document.getElementById('submit-coach').addEventListener('click', function () {
    // 유효성 검사
    if (!document.getElementById('add-personName').value) {
        showAlertModal('알림', '이름을 입력하세요');
        return;
    } else if (!document.getElementById('add-position').value) {
        showAlertModal('알림', '포지션을 입력하세요');
        return;
    } else if (!document.getElementById('add-height').value) {
        showAlertModal('알림', '키를 입력하세요');
        return;
    } else if (!document.getElementById('add-weight').value) {
        showAlertModal('알림', '몸무게를 입력하세요');
        return;
    } else if (!document.getElementById('add-birth').value) {
        showAlertModal('알림', '생년월일을 입력하세요');
        return;
    } else if (!document.getElementById('add-nationality').value) {
        showAlertModal('알림', '국적을 입력하세요');
        return;
    } else if (!document.getElementById('add-contractStart').value) {
        showAlertModal('알림', '계약시작일을 입력하세요');
        return;
    } else if (!document.getElementById('add-contractEnd').value) {
        showAlertModal('알림', '계약종료일을 입력하세요');
        return;
    } else if (!document.getElementById('add-personImage').value) {
        showAlertModal('알림', '사진을 입력하세요');
        return;
    } else if (!document.getElementById('add-id').value) {
        showAlertModal('알림', 'ID를 입력하세요');
        return;
    }

    const coachInfo = formToObject(document.getElementById('add-coach-info'));

    const formData = new FormData();
    const fileInput = document.getElementById('add-personImage');
    formData.append('person', new Blob([JSON.stringify(coachInfo)], {type: 'application/json'}));
    formData.append('file', fileInput.files[0]);
    postCoach(formData);
})

// POST
function postCoach(newPerson) {
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
                showAlertModal('알림', '데이터가 성공적으로 추가되었습니다.');
                modal.style.display = "none";
                //location.reload(); // 페이지 갱신

                // hidden.bs.modal : 모달의 닫힘이 끝나고 실행되는 이벤트
                document.getElementById('alertModal').addEventListener('hidden.bs.modal', function() {
                    location.reload(); // 페이지 갱신
                });
            } else {
                showAlertModal('알림', '관리자에게 문의하세요.');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showAlertModal('알림', '서버와의 통신 중 오류가 발생했습니다.');
        });
}

// 수정
if (document.getElementById('update-coach')) {
    document.getElementById('update-coach').addEventListener('click', function () {
        const coachInfo = formToObject(document.getElementById('detail-coach-info'));
        console.log(coachInfo);

        const formData = new FormData();

        formData.append('person', new Blob([JSON.stringify(coachInfo)], {type: 'application/json'}));
        const fileInput = document.getElementById('update-personImage');
        formData.append('file', fileInput.files[0]);

        console.log(formData);
        showConfirmModal('확인', '수정하시겠습니까?', function () {
            putCoach(coachInfo.personIdx, formData);
        })
    });
}

// PUT
function putCoach(id, formData) {
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
                showAlertModal('알림', '수정이 완료되었습니다.');

                fetchCoachData(currentPage, url); // 수정 후 데이터 갱신
                console.log(url + `/${id}/with-image`);
                modal.style.display = "none";
            } else {
                showAlertModal('알림', '관리자에게 문의하세요.');
            }
        })
        .catch(error => {
            console.error("Error:", error);
            showAlertModal('알림', '서버와의 통신 중 오류가 발생했습니다.');
        });

}

// 삭제
if (document.getElementById('delete-coach-btn')) {
    document.getElementById('delete-coach-btn').addEventListener('click', function () {
        deletePerson();
    })
}

// DELETE
function deletePerson() {
    const selectedCheckboxes = document.querySelectorAll('.delete-checkbox:checked');
    const selectedIds = Array.from(selectedCheckboxes).map(checkbox => checkbox.getAttribute('data-id'));

    if (selectedIds.length === 0) {
        showAlertModal('알림', '삭제할 항목을 선택하세요.');
        return;
    }

    showConfirmModal('확인', '선택한 항목을 삭제하시겠습니까?', function () {
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
                    showAlertModal('알림', '삭제가 완료되었습니다.');
                    fetchCoachData(currentPage, url);
                } else {
                    showAlertModal('알림', '관리자에게 문의하세요.');
                }
            })
            .catch(error => {
                console.error("Error:", error);
                showAlertModal('알림', '서버와의 통신 중 오류가 발생했습니다.');
            });
    })

}

// 체크박스 전체 클릭
if(document.getElementById('selectAllCheckbox')){
    document.querySelector("#selectAllCheckbox").addEventListener("change", function () {
        const isChecked = this.checked;
        const checkboxes = document.querySelectorAll(".delete-checkbox");

        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
    });
}

// 페이지 로드
document.addEventListener('DOMContentLoaded', function () {
    fetchCoachData(currentPage, url);
})

// 페이징 - 이전 페이지
document.querySelector("#prevGroup").onclick = () => {
    if (currentPage > 0) {
        currentPage--;
        fetchCoachData(currentPage, url);
    }
};

// 페이징 - 다음 페이지
document.querySelector("#nextGroup").onclick = () => {
    if (currentPage < totalPages - 1) {
        currentPage++;
        fetchCoachData(currentPage, url);
    }
};