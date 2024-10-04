package acorn.service;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import acorn.entity.Finance;
import acorn.repository.FinanceRepository;

@Service
public class FinanceService {
	
	@Autowired
	private FinanceRepository financeRepository;

	// 검색 기능 (Timestamp로 변환 후 endDate 처리)
	public Page<Finance> getFinancesByTypeAndDateAndKeyword(String type, Timestamp startDate, Timestamp endDate, String keyword, Pageable pageable) {
	    // endDate가 null이 아니면 23:59:59로 맞춰서 범위를 설정
		if (endDate != null) {
		    // endDate를 2024-09-16 00:00:00으로 설정 
		    endDate = Timestamp.valueOf(endDate.toLocalDateTime().plusDays(1).withHour(0).withMinute(0).withSecond(0));
		}

	    System.out.println("Start Date: " + startDate);
	    System.out.println("End Date: " + endDate);  // 이 부분을 추가
	    return financeRepository.findByTypeAndDate(type, startDate, endDate, keyword, pageable);
	}

	// 수입 항목 추가
    public Finance addIncome(Finance finance) {
        finance.setFinanceType("수입");
        return financeRepository.save(finance);
    }
    
    // 트레이더와 재정 날짜로 중복된 항목이 있는지 확인
    public boolean existsByTraderAndFinanceDate(String trader, Timestamp financeDate) {
        return financeRepository.existsByTraderAndFinanceDate(trader, financeDate);
    }

    // 지출 항목 추가
    public Finance addExpense(Finance finance) {
        finance.setFinanceType("지출");
        return financeRepository.save(finance);
    }
    
    // 특정 스폰서 이름과 날짜로 재정 항목 조회
    public Finance getFinanceByTraderAndDate(String trader, Timestamp financeDate) {
        return financeRepository.findByTraderAndFinanceDate(trader, financeDate);
    }

    // 재정 항목 업데이트
    public void updateFinance(Finance finance) {
        financeRepository.save(finance); // 재정 항목 저장
    }
    
    // 수입/지출 데이터 수정
    public Finance updateFinance(int id, Finance entity) {
    	Optional<Finance> financeData = financeRepository.findById(id);
    	
    	if (financeData.isPresent()) {
            Finance finance = financeData.get();
            finance.setFinanceDate(entity.getFinanceDate());
            finance.setAmount(entity.getAmount());
            finance.setTrader(entity.getTrader());
            finance.setPurpose(entity.getPurpose());
            finance.setFinanceMemo(entity.getFinanceMemo());
            // 필요한 경우 더 많은 필드를 업데이트할 수 있습니다.
            return financeRepository.save(finance);
        } else {
            throw new RuntimeException("Finance not found with id " + id);
        }
    }
    
    // 다중 삭제
    public void deleteFinance(List<Integer> ids) {
    	financeRepository.deleteAllByIdInBatch(ids);
    }
}
