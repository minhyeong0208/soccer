package acorn.service;

import java.sql.Timestamp;
import java.util.List;

import acorn.entity.Person;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import acorn.entity.Finance;
import acorn.entity.Transfer;
import acorn.repository.PersonRepository;
import acorn.repository.TransferRepository;

@Service
public class TransferService {

    @Autowired
    private TransferRepository transferRepository;

    @Autowired
    private PersonRepository personRepository;

    @Autowired
    private FinanceService financeService;

    private static final int TRANSFER_TYPE_BUY = 1;
    private static final int TRANSFER_TYPE_SELL = 0;

    private static final String TRANSFER_FILTER_TEAM = "team";
    private static final String TRANSFER_FILTER_PERSON = "person";

    private static final String TRANSFER_MEMO_DEF_BUY = "선수 구매 완료";
    private static final String TRANSFER_MEMO_DEF_SELL = "선수 판매 완료";

    // 구매 이적 처리
    @Transactional
    public void addPurchaseTransfer(Transfer transfer) {
        if (transfer.getTransferMemo() == null || "".equals(transfer.getTransferMemo())) { transfer.setTransferMemo(TRANSFER_MEMO_DEF_BUY); }
        // 선수 이름 저장
        if (transfer.getPerson() != null) {
            transfer.setPlayerName(transfer.getPerson().getPersonName()); // 구매 시 playerName 설정
        }
        Transfer savedTransfer = transferRepository.save(transfer);

        Finance expense = Finance.builder()
                .financeType("지출")
                .financeDate(new Timestamp(System.currentTimeMillis()))
                .amount(savedTransfer.getPrice())
                .trader(savedTransfer.getOpponent())
                .purpose("선수 구매")
                .financeMemo("선수 구매에 따른 지출")
                .build();

        financeService.addExpense(expense);
    }

    // 판매 이적 처리
    @Transactional
    public void addSaleTransfer(Transfer transfer) {
        if (transfer.getTransferMemo() == null || "".equals(transfer.getTransferMemo())) { transfer.setTransferMemo(TRANSFER_MEMO_DEF_SELL); }
        Person tempPerson = transfer.getPerson();

     	// 판매할 선수의 이름을 따로 저장
        String personName = tempPerson.getPersonName();
        
        // 기존 구매 건에 대해서도 이름 저장
        Transfer purchaseTransfer = transferRepository.findWithPersonId(tempPerson.getPersonIdx());

        if (purchaseTransfer != null) {
            purchaseTransfer.getPerson().setPersonName(tempPerson.getPersonName());  // Person의 이름 설정
            this.updateTransfer(purchaseTransfer);  // 기존 Transfer 업데이트
        }
        
        // 추가할 판매 건의 Person 정보 설정
        transfer.setPerson(tempPerson);  // Person을 Transfer에 설정
        transfer.setPlayerName(personName);  // 삭제 전 선수 이름 저장
        
        Transfer savedTransfer = transferRepository.save(transfer);

        personRepository.deleteById(transfer.getPersonIdx());

        Finance income = Finance.builder()
                .financeType("수입")
                .financeDate(new Timestamp(System.currentTimeMillis()))
                .amount(savedTransfer.getPrice())
                .trader(savedTransfer.getOpponent())
                .purpose("선수 판매")
                .financeMemo("선수 판매에 따른 수입")
                .build();

        financeService.addIncome(income);
    }

    // 특정 이적 정보 조회
    @Transactional(readOnly = true)
    public Transfer getTransferById(int transferIdx) {
        return transferRepository.findById(transferIdx).orElse(null);
    }

    @Transactional
    public Transfer updateTransfer(Transfer transfer) {
        return transferRepository.save(transfer);
    }

    // 추가: 모든 이적 정보 조회 (리스트)
    @Transactional(readOnly = true)
    public List<Transfer> getAllTransfers() {
        return transferRepository.findAll();
    }

    // 선택된 이적 기록 삭제
    @Transactional
    public void deleteTransfers(List<Integer> transferIds) {
        for (Transfer transfer : transferRepository.findByTransferIdxIn(transferIds)) {
            int transferType = transfer.getTransferType();
            switch (transferType) {
                case TRANSFER_TYPE_BUY: // TODO : 정산 추가
                    int personIdx = transfer.getPersonIdx(); // person 검증
                    if (personIdx > 0) personRepository.deleteById(personIdx);
                    break;
                case TRANSFER_TYPE_SELL: // TODO : 정산 추가
                    break;
                default:
            }
        }

        transferRepository.deleteAllById(transferIds);
    }

    // 선수, 팀 이름으로 이적 정보 검색 (페이징 처리 지원)
    @Transactional(readOnly = true)
    public Page<Transfer> searchTransfers(String filterType, String name, String transferTypeStr, Pageable pageable) {
        int transferType = (("전체".equals(transferTypeStr) || null == transferTypeStr) ? -1 : ("구매".equals(transferTypeStr)) ? 1 : 0);
        if ("".equals(name) || null == name) {
            if ( -1 == transferType ) return transferRepository.findAllWithPerson(pageable); // 전체
            return transferRepository.findAllWithPersonFilterTransferType(transferType, pageable); // 조건
        }

        if ("team".equals(filterType)) {
            if ( -1 == transferType ) return transferRepository.findByTeamNameContaining(name, pageable); // 전체, 팀 검색
            else return transferRepository.findByTeamNameContainingFilterTransferType(name, transferType, pageable); // 조건, 팀 검색
        }

        if ( -1 == transferType ) return transferRepository.findByPlayerNameContaining(name, pageable); // 전체, 선수 검색
        return transferRepository.findByPlayerNameContainingFilterTransferType(name, transferType, pageable); // 조건, 선수 검색
    }
}