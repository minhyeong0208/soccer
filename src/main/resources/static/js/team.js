$(document).ready(function() {
    // CSRF 토큰과 헤더를 전역으로 선언
    const csrfToken = document.querySelector('meta[name="_csrf"]').getAttribute('content');
    const csrfHeader = document.querySelector('meta[name="_csrf_header"]').getAttribute('content');

    // 페이지가 로드될 때, 강원FC의 정보를 자동으로 불러옵니다.
    fetchTeamInfo();

    function fetchTeamInfo() {
        // 서버에서 강원FC의 정보를 가져옵니다.
        $.ajax({
            url: '/teams/GFC',  // 실제 API 엔드포인트로 변경해야 합니다.
            method: 'GET',
            headers: {
                [csrfHeader]: csrfToken  // CSRF 토큰을 헤더에 추가
            },
            success: function(data) {
                // 서버로부터 받은 데이터로 폼을 채웁니다.
                $('#team-name').val(data.teamName);
                $('#team-found').val(formatDate(data.found));  // 날짜 포맷팅
                $('#team-location').val(data.hometown);
            },
            error: function(xhr, status, error) {
                console.error('데이터를 불러오는 데 실패했습니다:', error);
            }
        });
    }

    // 날짜를 'YYYY-MM-DD' 형식으로 포맷팅하는 함수
    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // 월은 0부터 시작하므로 +1
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
});
