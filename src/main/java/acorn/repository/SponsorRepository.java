package acorn.repository;

import java.util.Date;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import acorn.entity.Sponsor;

@Repository
public interface SponsorRepository extends JpaRepository<Sponsor, Integer> {

    // 스폰서 이름으로 검색 (페이징 처리)
    Page<Sponsor> findBySponsorNameContaining(String sponsorName, Pageable pageable);
    
    // contractDate를 기준으로 기간별로 스폰서 검색 (페이징 처리)
    Page<Sponsor> findByContractDateBetween(Date startDate, Date endDate, Pageable pageable);
    
    // 스폰서 이름과 기간으로 검색 (페이징 처리)
    Page<Sponsor> findBySponsorNameContainingAndContractDateBetween(
        String sponsorName, Date startDate, Date endDate, Pageable pageable);

    // 여러 스폰서 삭제
    void deleteAllByIdInBatch(Iterable<Integer> ids);
}
