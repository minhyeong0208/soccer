// CSRF 토큰을 meta 태그에서 가져옴
const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

document.addEventListener("DOMContentLoaded", function() {
	const coachId = loggedInCoachId;
	const editButton = document.getElementById("edit-button");
	const saveButton = document.getElementById("save-button");
	const passwordModal = new bootstrap.Modal(document.getElementById("passwordModal"));
	const confirmPasswordButton = document.getElementById("confirmPasswordButton");
	const form = document.getElementById("personal-info-form");
	let personIdx = null;

	const newPasswordInput = document.getElementById("newPassword");
	const confirmNewPasswordInput = document.getElementById("confirmNewPassword");

	if (coachId !== 'default_id') {
		// API를 호출하여 코치 정보를 가져옴
		fetch(`/persons/coaches/${coachId}`)
			.then(response => response.json())
			.then(data => {
				if (data) {
					document.getElementById("coach-name").innerText = data.personName;
					document.getElementById("coach-birth").value = data.birth ? new Date(data.birth).toISOString().split('T')[0] : '';
					document.getElementById("coach-phone").value = data.phone ? data.phone : '';
					document.getElementById("coach-email").value = data.email ? data.email : '';
					document.getElementById("contract-start").innerText = new Date(data.contractStart).toLocaleDateString();
					document.getElementById("contract-end").innerText = new Date(data.contractEnd).toLocaleDateString();
					personIdx = data.personIdx;
				} else {
					console.error("코치 정보를 가져오지 못했습니다.");
				}
			});

		// 수정 버튼 클릭 시 비밀번호 확인 모달 표시
		editButton.addEventListener("click", function() {
			passwordModal.show();
		});

		// 비밀번호 확인 버튼 클릭
		confirmPasswordButton.addEventListener("click", function() {
			const password = document.getElementById("confirmPassword").value;
			const errorMessageDiv = document.getElementById("error-message"); // 오류 메시지 div

			// 오류 메시지 숨기기
			errorMessageDiv.style.display = "none";
			errorMessageDiv.textContent = "";

			fetch('/persons/verify-password', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					[csrfHeader]: csrfToken
				},
				body: JSON.stringify({ password })
			})
				.then(response => response.json())
				.then(result => {
					if (result.verified) {
						// 폼 필드 활성화
						document.getElementById("coach-phone").disabled = false;
						document.getElementById("coach-email").disabled = false;
						document.getElementById("coach-birth").disabled = false;
						newPasswordInput.disabled = false;
						confirmNewPasswordInput.disabled = false;

						// 수정 버튼 숨기고 저장 버튼 표시
						editButton.style.display = "none";
						saveButton.style.display = "inline";
						passwordModal.hide();
					} else {
						// 비밀번호가 틀린 경우 오류 메시지 표시
						errorMessageDiv.textContent = "비밀번호가 틀렸습니다. 다시 입력하세요.";
						errorMessageDiv.style.display = "block";
					}
				})
				.catch(error => {
					console.error("비밀번호 확인 중 오류 발생:", error);
				});
		});

		// 폼 제출 이벤트 (저장 버튼 클릭 시)
		form.addEventListener("submit", function(event) {
			event.preventDefault(); // 기본 폼 제출 동작 방지

			const updatedData = {
				phone: document.getElementById("coach-phone").value,
				email: document.getElementById("coach-email").value,
				birth: document.getElementById("coach-birth").value
			};

			const newPassword = newPasswordInput.value;
			const confirmNewPassword = confirmNewPasswordInput.value;

			// 비밀번호가 입력된 경우 처리
			if (newPassword && confirmNewPassword) {
				if (newPassword === confirmNewPassword) {
					// 비밀번호 변경 요청
					fetch(`/persons/${personIdx}/change-password`, {
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							[csrfHeader]: csrfToken
						},
						body: JSON.stringify({ newPassword })
					})
						.then(response => response.json())
						.then(data => {
							if (data) {
								showAlertModal("알림", "비밀번호가 성공적으로 변경되었습니다.");
							} else {
								showAlertModal("알림", "비밀번호 변경에 실패했습니다.");
							}
						});
				} else {
					showAlertModal("알림", "새 비밀번호와 비밀번호 확인이 일치하지 않습니다.");
					return;
				}
			}

			// 정보 업데이트 요청
			fetch(`/persons/${personIdx}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					[csrfHeader]: csrfToken
				},
				body: JSON.stringify(updatedData)
			})
				.then(response => response.json())
				.then(data => {
					if (data) {
						showAlertModal("알림", "정보가 성공적으로 업데이트되었습니다.");
						// 필드를 비활성화하고 수정 버튼 표시
						document.getElementById("coach-phone").disabled = true;
						document.getElementById("coach-email").disabled = true;
						document.getElementById("coach-birth").disabled = true;
						newPasswordInput.disabled = true;
						confirmNewPasswordInput.disabled = true;

						editButton.style.display = "inline";
						saveButton.style.display = "none";
					} else {
						showAlertModal("알림", "정보 업데이트에 실패했습니다.");
					}
				})
				.catch(error => {
					console.error("정보 업데이트 중 오류 발생:", error);
				});
		});
	}
});
