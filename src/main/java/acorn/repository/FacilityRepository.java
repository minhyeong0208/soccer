package acorn.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import acorn.entity.Facility;

@Repository
public interface FacilityRepository extends JpaRepository<Facility, Integer> {
    // 시설명으로 검색 (페이징 처리 추가)
    Page<Facility> findByFacilityNameContaining(String facilityName, Pageable pageable);
    
    // 여러 시설 삭제
    void deleteAllByIdInBatch(Iterable<Integer> ids);
}
