package acorn.repository;

import java.sql.Timestamp;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import acorn.entity.Finance;

public interface FinanceRepository extends JpaRepository<Finance, Integer> {

    // Timestamp를 사용하여 필터링
    @Query("SELECT f FROM Finance f WHERE (:type IS NULL OR f.financeType = :type) "
            + "AND (:startDate IS NULL OR f.financeDate >= :startDate) "
            + "AND (:endDate IS NULL OR f.financeDate <= :endDate) "
            + "AND (:keyword IS NULL OR f.trader LIKE %:keyword% OR f.purpose LIKE %:keyword% OR f.financeMemo LIKE %:keyword%)")
    Page<Finance> findByTypeAndDate(@Param("type") String type, @Param("startDate") Timestamp startDate,
                                    @Param("endDate") Timestamp endDate, @Param("keyword") String keyword, Pageable pageable);

    // 트레이더와 재정 날짜를 기준으로 중복 항목이 있는지 확인하는 메서드
    boolean existsByTraderAndFinanceDate(String trader, Timestamp financeDate);
    
    // 스폰서 이름과 날짜로 재정 항목 조회
    @Query("SELECT f FROM Finance f WHERE f.trader = :trader AND DATE(f.financeDate) = DATE(:financeDate)")
    Finance findByTraderAndFinanceDate(@Param("trader") String trader, @Param("financeDate") Timestamp financeDate);

}
