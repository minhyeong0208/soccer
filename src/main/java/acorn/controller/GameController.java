package acorn.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import acorn.entity.Game;
import acorn.service.GameService;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
@RequestMapping("/games")
public class GameController {

    @Autowired
    private GameService gameService;

    // 특정 경기 결과 조회
    @GetMapping("/{id}/result")
    public ResponseEntity<String> getGameResult(@PathVariable(value = "id") int gameIdx) {
        Game game = gameService.getGameByIdWithResult(gameIdx);
        if (game == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(game.getResult());
    }
    
    // 미래 3경기 조회
    @GetMapping("/future")
    public ResponseEntity<List<Game>> getFuture3Games() {
        List<Game> games = gameService.getFuture3Games();
        return ResponseEntity.ok(games);
    }

    // 모든 경기 조회 (페이징 처리)
    @GetMapping("/list")
    public ResponseEntity<Object> getAllGames(
    		@RequestParam(value = "gameType", required = false) String gameType,
            Pageable pageable) {
        Page<Game> gameList;

        // 초기, 전체인 경우 전체 조회를 위한 구성
        if ("null".equals(gameType) || "전체".equals(gameType)) gameType = null;

        // 게임 유형에 따른 필터링
        if (gameType != null && !gameType.isEmpty())  gameList = gameService.getGamesByType(gameType, pageable);
        else gameList = gameService.getAllGames(pageable);

        // 해당 페이지의 게임 목록을 반환
        return ResponseEntity.ok().body(gameList);
    }

    // 특정 경기 조회 (스크립트의 openEditModal에서 호출)
    @GetMapping("/{id}")
    public ResponseEntity<Game> getGameById(@PathVariable(value = "id") int gameIdx) {
        Game game = gameService.getGameById(gameIdx);
        if (game == null) {
            return ResponseEntity.notFound().build(); // 게임이 없는 경우
        }
        return ResponseEntity.ok().body(game); // 게임 정보 반환
    }

    // 경기 추가
    @PostMapping("/add")
    public ResponseEntity<?> addGame(@RequestBody Game game) {
        // 값 검사
        Map<String, String> validErrors = gameService.validGame(game);
        if (!validErrors.isEmpty()) return ResponseEntity.badRequest().body(validErrors);

        try {
            Game savedGame = gameService.saveGame(game); // 서비스 호출
            return ResponseEntity.ok(savedGame); // 저장된 게임 반환
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("경기 추가 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 경기 수정
    @PostMapping("/edit")
    public ResponseEntity<?> editGame(@RequestBody Game game) {
        // 값 검사
        Map<String, String> validErrors = gameService.validGame(game);
        if (!validErrors.isEmpty()) return ResponseEntity.badRequest().body(validErrors);

        try {
            // 이미 Game 객체에 날짜가 포함되어 있으므로 별도의 변환 과정은 필요 없음.
            Game savedGame = gameService.saveGame(game); // 서비스 호출로 수정 저장
            return ResponseEntity.ok(savedGame); // 수정된 게임 반환
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("경기 수정 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 선택된 경기 삭제 (스크립트에서 deleteGame 호출)
    @DeleteMapping
    public ResponseEntity<?> deleteGame(@RequestBody List<Integer> ids) {
        try {
            gameService.deleteGame(ids); // 서비스 호출로 경기 삭제
            return ResponseEntity.ok(""); // 성공 시 빈 응답 반환
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 최근 경기 정보 가져오기 (스크립트에서 updateMostRecentGame 호출)
    @GetMapping("/mostRecent")
    public ResponseEntity<Game> getMostRecentGame() {
        Game mostRecentGame = gameService.getMostRecentGame(); // 최근 경기 정보
        if (mostRecentGame == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body(mostRecentGame); // 최근 경기 반환
    }
}