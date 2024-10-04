package acorn.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import acorn.entity.Game;
import acorn.repository.GameRepository;

@Service
public class GameService {

    @Autowired
    private GameRepository gameRepository;
    
    // 경기 결과 계산
    public String getGameResult(Game game) {
        if (game.getGoal() > game.getConcede()) {
            return "승리";
        } else if (game.getGoal() == game.getConcede()) {
            return "무승부";
        } else {
            return "패배";
        }
    }

    // 특정 경기 조회 및 결과 반환
    public Game getGameByIdWithResult(int gameIdx) {
        Optional<Game> gameOptional = gameRepository.findById(gameIdx);
        if (gameOptional.isPresent()) {
            Game game = gameOptional.get();
            game.setResult(getGameResult(game)); // 결과를 게임 객체에 설정
            return game;
        } else {
            return null;
        }
    }
    
    // 미래 3경기 조회
    public List<Game> getFuture3Games() {
        Pageable topThree = PageRequest.of(0, 3, Sort.by("gameDate").ascending());
        return gameRepository.findTopByGameDateAfter(LocalDate.now(), topThree).getContent();
    }

    // 모든 경기 조회(일정에 추가)
    public List<Game> getAllGames() {
        return gameRepository.findAll();
    }

    // 모든 경기 조회 (페이징 처리)
    public Page<Game> getAllGames(Pageable pageable) {
        Sort sort = Sort.by(Sort.Direction.DESC, "gameDate");
        pageable = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize(), sort);
        return gameRepository.findAll(pageable);
    }

    // 경기 횟수
    public long getTotalGames() {
        return gameRepository.countTotalGames();
    }

    // 총 득점
    public int getTotalGoals() {
        return gameRepository.sumTotalGoals();
    }

    // 총 실점
    public int getTotalConcede() {
        return gameRepository.sumTotalConcede();
    }

    // 승패 마진
    public String getWinLossMargin() {
        int margin = gameRepository.calculateWinLossMargin();
        /**
         * margin 값에 부호를 붙여서 return
         *
         * 0보다 높으면 +
         * 0이면 공백
         * 0보다 낮으면 -
         */
        String marginStr = (margin > 0 ? "+" : "") + margin;
        return marginStr;
    }

    // 게임 분류 조회
    public Page<Game> getGamesByType(String gameType, Pageable pageable) {
        return gameRepository.findByGameType(gameType, pageable);
    }

    // 특정 경기 조회
    public Game getGameById(int gameIdx) {
        Optional<Game> game = gameRepository.findById(gameIdx);
        return game.orElse(null);
    }

    // 최근 경기
    public Game getMostRecentGame() {
        return gameRepository.findFirstByGameDateLessThanEqualOrderByGameDateDesc(LocalDate.now());
    }

    // 게임 저장 전 유효성 검사
    public Map<String, String> validGame(Game game) {
        Map<String, String> errors = new HashMap<>();

        // 기존의 유효성 검사 로직
        if (game.getGameName() == null || game.getGameName().trim().isEmpty()) {
            errors.put("game_name", "경기명은 필수입니다.");
        }

        if (game.getGameType() == null || game.getGameType().trim().isEmpty()) {
            errors.put("gameType", "대회 유형은 필수입니다.");
        }

        if (game.getOpponent() == null || game.getOpponent().trim().isEmpty()) {
            errors.put("opponent", "상대팀은 필수입니다.");
        }

        if (game.getGameDate() == null) {
            errors.put("gameDate", "경기 일자는 필수입니다.");
        }

        if (game.getStadium() == null || game.getStadium().trim().isEmpty()) {
            errors.put("stadium", "경기장소는 필수입니다.");
        }

        if (game.getIsHome() != 0 && game.getIsHome() != 1) {
            errors.put("isHome", "홈/원정은 0 또는 1이어야 합니다.");
        }

        // 미래 경기 득점과 실점 검증 수정
        if (game.getGameDate() != null && game.getGameDate().isAfter(LocalDate.now())) {
            if (game.getGoal() != 0 || game.getConcede() != 0) {
                errors.put("futureGame", "미래 경기의 득점과 실점은 0이어야 합니다.");
            }
        } else {
            // 과거 또는 현재 경기에 대한 득점과 실점 검증
            if (game.getGoal() < 0) {
                errors.put("goal", "득점은 0 이상이어야 합니다.");
            }
            if (game.getConcede() < 0) {
                errors.put("concede", "실점은 0 이상이어야 합니다.");
            }
        }

        return errors;
    }

    // 경기 추가 및 갱신, 과거와 미래 데이터 구분
    public Game saveGame(Game game) {
        LocalDate now = LocalDate.now();

        // 미래 경기일 경우 득점과 실점을 0으로 설정
        if (game.getGameDate().isAfter(now)) {
            game.setGoal(0);
            game.setConcede(0);
        }

        // 과거 경기 또는 현재 경기일 경우 기존 득점과 실점을 유지
        return gameRepository.save(game);
    }

    // 경기 삭제
    public void deleteGame(List<Integer> ids) {
        gameRepository.deleteAllByIdInBatch(ids);
    }

    // 팀 이미지 추가
    public String getTeamImageFileName(String teamName) {
        Map<String, String> nameMap = new HashMap<>();
        nameMap.put("울산HD", "울산HD");
        nameMap.put("수원FC", "수원FC");
        nameMap.put("김천상무FC", "김천상무FC");
        nameMap.put("서울FC", "서울FC");
        nameMap.put("포항 스틸러스", "포항 스틸러스");
        nameMap.put("광주FC", "광주FC");
        nameMap.put("제주 유나이티드FC", "제주 유나이티드FC");
        nameMap.put("대전 하나시티즈", "대전 하나시티즈");
        nameMap.put("인천 유나이티드FC", "인천 유나이티드FC");
        nameMap.put("전북 현대", "전북 현대");
        nameMap.put("대구FC", "대구FC");
        nameMap.put("강원FC", "강원FC");

        return nameMap.getOrDefault(teamName, teamName) + ".png";
    }
}
