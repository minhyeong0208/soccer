package acorn.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import acorn.service.AbilityService;
import acorn.service.PersonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import acorn.entity.Transfer;
import acorn.dto.TransferDto;
import acorn.entity.Ability;
import acorn.entity.Person;
import acorn.service.TransferService;

@RestController
@RequestMapping("/transfers")
public class TransferController {

    @Autowired
    private TransferService transferService;

    @Autowired
    private PersonService personService;
    
    @Autowired
    private AbilityService abilityService;

    private static final String teamIdx = "GFC";

    private static final int TRANSFER_TYPE_BUY = 1;
    private static final int TRANSFER_TYPE_SELL = 0;

    private static final String TRANSFER_FILTER_TEAM = "team";
    private static final String TRANSFER_FILTER_PERSON = "person";

    // 모든 이적 정보 조회 (페이징 처리)
    @GetMapping
    public Page<Transfer> search(@RequestParam(value = "team", required = false) String team,
            @RequestParam(value = "person", required = false) String person,
            @RequestParam(value = "transferType", required = false) String transferType,
                                 Pageable pageable) {
        String filterType = (team != null) ? TRANSFER_FILTER_TEAM :TRANSFER_FILTER_PERSON;
        String name = (TRANSFER_FILTER_TEAM.equals(filterType)) ? team : person;
        return transferService.searchTransfers(filterType, name, transferType, pageable);
    }

    // 특정 이적 정보 조회
    @GetMapping("/{id}")
    public ResponseEntity<Transfer> getTransferById(@PathVariable("id") int id) {
        Transfer transfer = transferService.getTransferById(id);
        return transfer != null ? ResponseEntity.ok(transfer) : ResponseEntity.notFound().build();
    }

    // 선수 구매
    @PostMapping("/buy")
    public ResponseEntity<?> buy(@RequestBody TransferDto  transferDTO) {
    	transferDTO.setTransferType(TRANSFER_TYPE_BUY);

    	// DTO에서 personName 가져옴
        Person tempPerson = new Person();
        tempPerson.setPersonName(transferDTO.getPersonName());
        tempPerson.setTeamIdx(teamIdx);
        tempPerson.setTypeCode("player");
        tempPerson.setBirth(transferDTO.getPerson().getBirth());
        tempPerson.setNationality(transferDTO.getPerson().getNationality());
        tempPerson.setBackNumber(transferDTO.getPerson().getBackNumber());
        tempPerson.setPosition(transferDTO.getPerson().getPosition());
        tempPerson.setContractStart(transferDTO.getPerson().getContractStart());
        tempPerson.setContractEnd(transferDTO.getPerson().getContractEnd());
        tempPerson.setPersonImage(transferDTO.getPerson().getPersonImage());
        tempPerson.setWeight(transferDTO.getPerson().getWeight());
        tempPerson.setHeight(transferDTO.getPerson().getHeight());

        Person person = personService.addPerson(tempPerson);
        
     // Transfer 객체 생성
        Transfer transfer = new Transfer();
        transfer.setPerson(person);  // 저장된 Person 객체를 설정
        transfer.setTradingDate(transferDTO.getTradingDate());
        transfer.setPrice(transferDTO.getPrice());
        transfer.setOpponent(transferDTO.getOpponent());
        transfer.setTransferMemo(transferDTO.getTransferMemo());
        transfer.setTransferType(TRANSFER_TYPE_BUY);
        

     // 능력치 초기화
        Ability ability = Ability.builder()
            .person(person)
            .pass(50)
            .physical(50)
            .shoot(50)
            .speed(50)
            .dribble(50)
            .defence(50)
            .build();

        // Ability 저장
        abilityService.addAbility(ability, person.getPersonIdx());
        
        transfer.setPerson(person);

        try {
            transferService.addPurchaseTransfer(transfer);
            return ResponseEntity.ok("");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("이적 구매 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 선수 판매
    @PostMapping("/sell")
    public ResponseEntity<?> sell(@RequestBody Transfer transfer) {
        transfer.setTransferType(TRANSFER_TYPE_SELL);

        Person person = personService.getPersonById(transfer.getPersonIdx());
        transfer.setPerson(person);

        try {
        	// 선수의 능력치 삭제
            abilityService.deleteAbility(person.getPersonIdx());
        	
            transferService.addSaleTransfer(transfer);
            return ResponseEntity.ok("");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("이적 판매 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 이적 정보 업데이트
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransfer(@PathVariable("id") int id, @RequestBody Transfer transferDetails) {
        // 기존 Transfer 조회
        Transfer transfer = transferService.getTransferById(id);
        transfer.setTradingDate(transferDetails.getTradingDate());
        transfer.setOpponent(transferDetails.getOpponent());
        transfer.setPrice(transferDetails.getPrice());
        transfer.setTransferMemo(transferDetails.getTransferMemo());

        return (transferService.updateTransfer(transfer) != null)
                ? ResponseEntity.ok("") : ResponseEntity.notFound().build();
    }

    // 선택된 경기 삭제 (스크립트에서 deleteGame 호출)
    @DeleteMapping
    public ResponseEntity<?> deleteTransfer(@RequestBody List<Integer> ids) {
        try {
            transferService.deleteTransfers(ids); // 서비스 호출로 이적 기록 삭제
            return ResponseEntity.ok(""); // 성공 시 빈 응답 반환
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("삭제 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    @GetMapping("/detail/{id}")
    public String getTransferDetail(@PathVariable("id") int id, Model model) {
        Transfer selectedTransfer = transferService.getTransferById(id);
        model.addAttribute("selectedTransfer", selectedTransfer);
        return "transfer"; // transfer.html 뷰 이름
    }

    /**
     * 판매 대상 선수 목록 조회
     * @return
     */
    @GetMapping("/person/list")
    public ResponseEntity<?> getPersonList() {
        Map<Integer, String> persons = new HashMap<>();
        /**
         * TODO
         * teamIdx Session 내 처리
         */
        for (Person item : personService.findAllWithTeamIdx(teamIdx)) {
            persons.put(item.getPersonIdx(), item.getPersonName());
        }
        return ResponseEntity.ok(persons);
    }
}