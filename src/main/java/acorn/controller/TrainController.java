package acorn.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import acorn.entity.Person;
import acorn.entity.Train;
import acorn.service.PersonService;
import acorn.service.TrainMemService;
import acorn.service.TrainService;

@RestController
@RequestMapping("/trains")
public class TrainController {

    private final TrainService trainService;
    private final TrainMemService trainMemService;
    private final PersonService personService;  // PersonService 추가

    public TrainController(TrainService trainService, TrainMemService trainMemService, PersonService personService) {
        this.trainService = trainService;
        this.trainMemService = trainMemService;
        this.personService = personService;
    }

    // 모든 훈련 조회 (페이징 처리)
    @GetMapping
    public Page<Train> getAllTrains(Pageable pageable) {
        return trainService.getAllTrains(pageable);
    }
    
    // 훈련명을 포함하는 훈련 검색 (페이징 처리)
    @GetMapping("/search")
    public Page<Train> searchTrainsByName(@RequestParam("trainName") String trainName, Pageable pageable) {
        return trainService.searchTrainsByName(trainName, pageable);
    }
    
    // 훈련에 참가자를 추가하는 엔드포인트 (참가자 제한 로직 추가)
    @PostMapping("/{id}/add-participants")
    public ResponseEntity<String> addParticipantsToTraining(@PathVariable("id") int trainIdx, @RequestBody List<Integer> personIds) {
        Train train = trainService.getTrainById(trainIdx);
        if (train == null) {
            return ResponseEntity.notFound().build();
        }

        List<Person> participants = personService.getPersonsByIds(personIds);
        for (Person person : participants) {
            // 이미 훈련에 참가한 인원이 있는지 확인
            if (!trainMemService.isPersonInTraining(train, person)) {
                try {
                    trainMemService.addTrainMem(train, person);
                } catch (IllegalArgumentException e) {
                    return ResponseEntity.badRequest().body(e.getMessage());
                }
            } else {
                return ResponseEntity.badRequest().body("Participant " + person.getPersonName() + " is already added to this training.");
            }
        }

        return ResponseEntity.ok("Participants have been successfully added to the training.");
    }

    
    // 특정 훈련에서 특정 선수를 제거하는 엔드포인트
    @DeleteMapping("/{trainId}/remove-participant/{personId}")
    public ResponseEntity<String> removeParticipantFromTraining(
            @PathVariable("trainId") int trainId, 
            @PathVariable("personId") int personId) {
        
        Train train = trainService.getTrainById(trainId);
        if (train == null) {
            return ResponseEntity.notFound().build();
        }

        Person person = personService.getPersonById(personId);
        if (person == null) {
            return ResponseEntity.notFound().build();
        }

        trainMemService.removeTrainMem(train, person);
        return ResponseEntity.ok("Participant removed successfully.");
    }

    // 특정 훈련 조회
    @GetMapping("/{id}")
    public ResponseEntity<Train> getTrainById(@PathVariable(value = "id") int trainIdx) {
        Train train = trainService.getTrainById(trainIdx);
        if (train == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok().body(train);
    }

    // 새로운 훈련 추가
    @PostMapping
    public Train createTrain(@RequestBody Train train) {
        return trainService.addTrain(train);
    }

    // 훈련 업데이트
    @PutMapping("/{id}")
    public ResponseEntity<Train> updateTrain(
            @PathVariable(value = "id") int trainIdx, @RequestBody Train trainDetails) {
        Train updatedTrain = trainService.updateTrain(trainIdx, trainDetails);
        if (updatedTrain == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedTrain);
    }

    // 훈련 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTrain(@PathVariable(value = "id") int trainIdx) {
        trainService.deleteTrain(trainIdx);
        return ResponseEntity.ok().build();
    }
}
