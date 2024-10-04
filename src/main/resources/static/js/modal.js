document.addEventListener('DOMContentLoaded', function() {
    const alertModalElement = document.getElementById('alertModal');
    const confirmModalElement = document.getElementById('confirmModal');

    // 미리 모달 인스턴스를 생성해둠 (캐싱)
    const alertModal = new bootstrap.Modal(alertModalElement);
    const confirmModal = new bootstrap.Modal(confirmModalElement);

    function showAlertModal(title, message) {
        const alertModalLabel = document.getElementById('alertModalLabel');
        const alertModalBody = document.getElementById('alertModalBody');

        if (alertModalLabel && alertModalBody) {
            alertModalLabel.textContent = title;
            alertModalBody.textContent = message;

            alertModal.show();  // 캐싱된 모달 인스턴스 사용
        } else {
            console.error('Alert modal elements not found');
			console.log('showAlertModal is ready to be used');
			console.log('showConfirmModal is ready to be used');
        }
    }

    function showConfirmModal(title, message, confirmCallback) {
        const confirmModalLabel = document.getElementById('confirmModalLabel');
        const confirmModalBody = document.getElementById('confirmModalBody');
        const confirmButton = document.getElementById('confirmModalButton');

        if (confirmModalLabel && confirmModalBody) {
            confirmModalLabel.textContent = title;
            confirmModalBody.textContent = message;

            // 기존 이벤트 리스너 제거 후, 새로 추가
            confirmButton.removeEventListener('click', handleConfirmClick); 
            function handleConfirmClick() {
                confirmCallback();
                confirmModal.hide();  // 모달 숨기기
            }
            confirmButton.addEventListener('click', handleConfirmClick);

            confirmModal.show();  // 캐싱된 모달 인스턴스 사용
        } else {
            console.error('Confirm modal elements not found');
        }
    }

    // 전역에서 사용할 수 있도록 함수 내보내기
    window.showAlertModal = showAlertModal;
    window.showConfirmModal = showConfirmModal;
});