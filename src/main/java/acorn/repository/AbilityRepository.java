package acorn.repository;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import acorn.entity.Ability;

@Repository
public interface AbilityRepository extends JpaRepository<Ability, Integer> {
    // 기본적인 CRUD 메서드 포함
	
	// 선수의 예측 데이터를 고정된 날짜로 조회 (2024-10-06 12:05:08)
	@Query("SELECT a FROM Ability a WHERE a.person.personIdx = :personIdx AND a.inputType = 1 AND a.measureDate = :fixedDate")
	Ability findFixedPredictionByPersonIdx(@Param("personIdx") int personIdx, @Param("fixedDate") LocalDateTime fixedDate);

	
	// 선수의 실제 능력치 목록 조회 (inputType = 0)
    @Query("SELECT a FROM Ability a WHERE a.person.personIdx = :personIdx AND a.inputType = 0 ORDER BY a.measureDate DESC")
    List<Ability> findActualAbilitiesByPersonIdx(@Param("personIdx") int personIdx);
	
}
