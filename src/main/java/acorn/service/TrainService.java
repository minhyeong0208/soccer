package acorn.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import acorn.entity.Train;
import acorn.repository.TrainRepository;

@Service
public class TrainService {

    private final TrainRepository trainRepository;

    public TrainService(TrainRepository trainRepository) {
        this.trainRepository = trainRepository;
    }
    
    // 훈련의 현재 참가자 수를 반환하는 메서드 추가
    public int getParticipantCount(Train train) {
        return train.getTrainMems().size();  // trainMems의 크기로 현재 참가자 수를 확인
    }
    
    // 훈련명으로 검색 (페이징 처리)
    public Page<Train> searchTrainsByName(String trainName, Pageable pageable) {
        return trainRepository.findByTrainNameContaining(trainName, pageable);
    }
    
    // 모든 훈련 조회(일정에 추가)
    public List<Train> getAllTrains() {
        return trainRepository.findAll();
    }

    // 모든 훈련 조회 (페이징 처리)
 // 모든 훈련 조회 (시작일 내림차순 정렬, 페이징 처리)
    public Page<Train> getAllTrains(Pageable pageable) {
        return trainRepository.findAllByOrderByStartDateDesc(pageable);
    }

    // 특정 훈련 조회
    public Train getTrainById(int trainIdx) {
        Optional<Train> train = trainRepository.findById(trainIdx);
        return train.orElse(null);
    }

    // 새로운 훈련 추가
    public Train addTrain(Train train) {
        return trainRepository.save(train);
    }

    // 훈련 업데이트
    public Train updateTrain(int trainIdx, Train trainDetails) {
        Train train = getTrainById(trainIdx);
        if (train != null) {
            train.setTrainName(trainDetails.getTrainName());
            train.setStartDate(trainDetails.getStartDate());
            train.setEndDate(trainDetails.getEndDate());
            train.setStartTime(trainDetails.getStartTime());
            train.setEndTime(trainDetails.getEndTime());
            train.setArea(trainDetails.getArea());
            train.setMemo(trainDetails.getMemo());
            train.setCountMem(trainDetails.getCountMem());
            return trainRepository.save(train);
        }
        return null;
    }

    // 훈련 삭제
    public void deleteTrain(int trainIdx) {
        trainRepository.deleteById(trainIdx);
    }
}