package acorn.repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import acorn.entity.Game;

@Repository
public interface GameRepository extends JpaRepository<Game, Integer> {
    // 기본적인 CRUD 메서드와 페이징 지원 메서드 포함
    Page<Game> findByGameType(String gameType, Pageable pageable);

    // 여러 경기를 한꺼번에 삭제하는 메서드
    void deleteAllByIdInBatch(Iterable<Integer> ids);

    // 최근 하루 경기 조회
    Game findFirstByGameDateLessThanEqualOrderByGameDateDesc(LocalDate date);

    // 전체 경기 수 조회
    @Query("SELECT COUNT(g) FROM Game g")
    long countTotalGames();

    // 팀 전체 득점 조회
    @Query("SELECT SUM(g.goal) FROM Game g")
    Integer sumTotalGoals();

    // 팀 전체 실점 조회
    @Query("SELECT SUM(g.concede) FROM Game g")
    Integer sumTotalConcede();

    // 승패 마진 계산 (승리 수 - 패배 수)
    @Query("SELECT " +
            "(SELECT COUNT(g) FROM Game g WHERE g.goal > g.concede) - " +
            "(SELECT COUNT(g) FROM Game g WHERE g.goal < g.concede)")
    Integer calculateWinLossMargin();

    // 특정 기간 내의 경기 수 조회
    @Query("SELECT COUNT(g) FROM Game g WHERE g.gameDate BETWEEN :startDate AND :endDate")
    long countGamesBetweenDates(LocalDateTime startDate, LocalDateTime endDate);

    // 특정 기간 내의 팀 득점 조회
    @Query("SELECT SUM(g.goal) FROM Game g WHERE g.gameDate BETWEEN :startDate AND :endDate")
    Integer sumGoalsBetweenDates(LocalDateTime startDate, LocalDateTime endDate);
    
    // 미래 경기 중 가장 가까운 3개를 조회하는 메서드
    @Query("SELECT g FROM Game g WHERE g.gameDate > :date ORDER BY g.gameDate ASC")
    Page<Game> findTopByGameDateAfter(@Param("date") LocalDate date, Pageable pageable);

}
