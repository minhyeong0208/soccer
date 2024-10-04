package acorn.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

import acorn.entity.Train;
import org.springframework.data.jpa.repository.JpaRepository;

@Repository
public interface TrainRepository extends JpaRepository<Train, Integer> {

    // 훈련명을 포함하는 훈련 조회 (페이징 처리)
    Page<Train> findByTrainNameContaining(String trainName, Pageable pageable);
    
    // 훈련 시작일을 기준으로 내림차순으로 정렬된 훈련 목록 조회 (페이징 처리)
    Page<Train> findAllByOrderByStartDateDesc(Pageable pageable);
}
