package acorn.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import acorn.entity.Person;
import acorn.entity.Train;
import acorn.entity.TrainMem;

@Repository
public interface TrainMemRepository extends JpaRepository<TrainMem, Integer> {
	
	// Train 객체로 훈련에 참가한 인원 조회
    List<TrainMem> findByTrain(Train train);
    
    // 훈련과 선수로 TrainMem 찾기
    TrainMem findByTrainAndPerson(Train train, Person person);
}
