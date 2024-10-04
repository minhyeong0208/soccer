package acorn.service;

import java.sql.Date;
import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import acorn.entity.Finance;
import acorn.entity.Sponsor;
import acorn.repository.SponsorRepository;
import jakarta.transaction.Transactional;

@Service
public class SponsorService {

    private final SponsorRepository sponsorRepository;
    private final FinanceService financeService; // FinanceService 필드 추가

    public SponsorService(SponsorRepository sponsorRepository, FinanceService financeService) {
        this.sponsorRepository = sponsorRepository;
        this.financeService = financeService; // 생성자 주입
    }
    
 // 스폰서 이름과 계약 기간으로 검색 (빈 값일 경우 전체 결과 반환)
    public Page<Sponsor> searchSponsorsByNameAndContractDate(
            String sponsorName, Date startDate, Date endDate, Pageable pageable) {

        // 스폰서 이름과 날짜가 모두 null이거나 빈 값이면 전체 결과 반환
        if ((sponsorName == null || sponsorName.isEmpty()) && startDate == null && endDate == null) {
            return sponsorRepository.findAll(pageable);
        }

        // 스폰서 이름이 비어 있을 때는 기간으로만 검색
        if (sponsorName == null || sponsorName.isEmpty()) {
            return sponsorRepository.findByContractDateBetween(startDate, endDate, pageable);
        }

        // 기간이 비어 있을 때는 이름으로만 검색
        if (startDate == null || endDate == null) {
            return sponsorRepository.findBySponsorNameContaining(sponsorName, pageable);
        }

        // 이름과 기간이 모두 있을 때는 이름과 기간으로 검색
        return sponsorRepository.findBySponsorNameContainingAndContractDateBetween(
                sponsorName, startDate, endDate, pageable);
    }

    // 모든 스폰서 조회 (페이징 처리)
    public Page<Sponsor> getAllSponsors(Pageable pageable) {
        return sponsorRepository.findAll(pageable);
    }

    // 스폰서 이름으로 검색 (페이징 처리)
    public Page<Sponsor> searchSponsorsByName(String sponsorName, Pageable pageable) {
        return sponsorRepository.findBySponsorNameContaining(sponsorName, pageable);
    }

    // contractDate 기준으로 기간별 스폰서 검색 (페이징 처리)
    public Page<Sponsor> searchSponsorsByContractDateRange(Date startDate, Date endDate, Pageable pageable) {
        return sponsorRepository.findByContractDateBetween(startDate, endDate, pageable);
    }

    // 새로운 스폰서 추가
    @Transactional  // 트랜잭션을 명확히 지정
    public Sponsor addSponsor(Sponsor sponsor) {
        Sponsor savedSponsor = sponsorRepository.save(sponsor);

        // 중복 재정 항목이 있는지 확인 (trader와 시분초까지 포함한 financeDate 기준)
        Timestamp contractTimestamp = new Timestamp(sponsor.getContractDate().getTime());  // 스폰서 계약 날짜를 timestamp로 변환
        
        boolean exists = financeService.existsByTraderAndFinanceDate(savedSponsor.getSponsorName(), contractTimestamp);

        if (!exists) {
            Finance finance = Finance.builder()
                .financeType("수입")
                .financeDate(contractTimestamp)  // 스폰서 계약 날짜로 설정
                .amount(savedSponsor.getPrice())  // 스폰서 금액
                .trader(savedSponsor.getSponsorName())  // 거래처 정보
                .purpose("스폰서 계약")
                .financeMemo("스폰서 계약에 따른 수입")
                .build();

            financeService.addIncome(finance);  // 재정 항목에 추가
        } else {
            System.out.println("Duplicate finance entry detected for sponsor: " + savedSponsor.getSponsorName());
        }

        return savedSponsor;
    }

    // 스폰서 업데이트 (재정 정보와 연동)
    @Transactional
    public Sponsor updateSponsor(int sponsorIdx, Sponsor sponsorDetails) {
        Sponsor sponsor = getSponsorById(sponsorIdx);
        if (sponsor != null) {
            // 기존 스폰서 정보 저장
            String oldSponsorName = sponsor.getSponsorName();
            Timestamp oldContractDate = new Timestamp(sponsor.getContractDate().getTime());

            // 스폰서 정보 업데이트
            sponsor.setSponsorName(sponsorDetails.getSponsorName());
            sponsor.setContractDate(sponsorDetails.getContractDate());
            sponsor.setPrice(sponsorDetails.getPrice());
            sponsor.setContractCondition(sponsorDetails.getContractCondition());
            sponsor.setSponsorMemo(sponsorDetails.getSponsorMemo());
            sponsor.setStartDate(sponsorDetails.getStartDate());
            sponsor.setEndDate(sponsorDetails.getEndDate());

            // 재정 정보 업데이트 (기존 재정 항목을 찾아서 수정)
            Finance finance = financeService.getFinanceByTraderAndDate(oldSponsorName, oldContractDate);
            if (finance != null) {
                finance.setTrader(sponsorDetails.getSponsorName()); // 스폰서 이름 업데이트
                finance.setAmount(sponsorDetails.getPrice()); // 금액 업데이트
                finance.setFinanceDate(new Timestamp(sponsorDetails.getContractDate().getTime())); // 계약 날짜 업데이트
                financeService.updateFinance(finance);
                System.out.println("재정 정보 업데이트 성공: " + finance);
            } else {
                System.out.println("재정 항목을 찾지 못했습니다: " + oldSponsorName + " / " + oldContractDate);
            }
            return sponsorRepository.save(sponsor);
        }
        return null;
    }

    // 특정 스폰서 조회
    public Sponsor getSponsorById(int sponsorIdx) {
        Optional<Sponsor> sponsor = sponsorRepository.findById(sponsorIdx);
        return sponsor.orElse(null);
    }

    // 스폰서 삭제
    public void deleteSponsor(int sponsorIdx) {
        sponsorRepository.deleteById(sponsorIdx);
    }

    // 선택된 스폰서들 삭제
    public void deleteSponsors(List<Integer> sponsorIds) {
        sponsorRepository.deleteAllByIdInBatch(sponsorIds);
    }
}
