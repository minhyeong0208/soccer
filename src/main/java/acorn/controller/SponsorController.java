package acorn.controller;

import java.sql.Date;
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

import acorn.entity.Sponsor;
import acorn.service.FinanceService; // FinanceService 추가
import acorn.service.SponsorService;

@RestController
@RequestMapping("/sponsors")
public class SponsorController {

    private final SponsorService sponsorService;
    private final FinanceService financeService; // FinanceService 필드 추가

    // SponsorService와 FinanceService를 생성자 주입
    public SponsorController(SponsorService sponsorService, FinanceService financeService) {
        this.sponsorService = sponsorService;
        this.financeService = financeService;
    }
    
 // 스폰서 이름과 기간으로 검색 (페이징 처리)
    @GetMapping("/search-by-name-and-date")
    public Page<Sponsor> searchSponsorsByNameAndContractDate(
            @RequestParam(value = "sponsorName", required = false) String sponsorName,
            @RequestParam(value = "startDate", required = false) Date startDate,
            @RequestParam(value = "endDate", required = false) Date endDate,
            Pageable pageable) {
        // SponsorService에 있는 검색 메서드를 호출
        return sponsorService.searchSponsorsByNameAndContractDate(sponsorName, startDate, endDate, pageable);
    }

    // 모든 스폰서 조회 (페이징 처리)
    @GetMapping
    public Page<Sponsor> getAllSponsors(Pageable pageable) {
        return sponsorService.getAllSponsors(pageable);
    }

    // 스폰서 이름으로 검색 (페이징 처리)
    @GetMapping("/search")
    public Page<Sponsor> searchSponsorsByName(@RequestParam("sponsorName") String sponsorName, Pageable pageable) {
        return sponsorService.searchSponsorsByName(sponsorName, pageable);
    }

    // 기간으로 스폰서 검색 (페이징 처리)
    // contractDate 기준으로 기간별 스폰서 검색 (페이징 처리)
    @GetMapping("/search-by-contract-date")
    public Page<Sponsor> searchSponsorsByContractDateRange(
            @RequestParam("startDate") Date startDate,
            @RequestParam("endDate") Date endDate,
            Pageable pageable) {
        return sponsorService.searchSponsorsByContractDateRange(startDate, endDate, pageable);
    }

    // 새로운 스폰서 추가
    @PostMapping
    public Sponsor createSponsor(@RequestBody Sponsor sponsor) {
        // 스폰서 추가는 SponsorService에서 처리 (재정 추가도 여기서 처리)
        return sponsorService.addSponsor(sponsor);
    }

    // 스폰서 업데이트
    @PutMapping("/{id}")
    public ResponseEntity<Sponsor> updateSponsor(
            @PathVariable(value = "id") int sponsorIdx, @RequestBody Sponsor sponsorDetails) {
        Sponsor updatedSponsor = sponsorService.updateSponsor(sponsorIdx, sponsorDetails);
        if (updatedSponsor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(updatedSponsor);
    }

    // 스폰서 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteSponsor(@PathVariable(value = "id") int sponsorIdx) {
        sponsorService.deleteSponsor(sponsorIdx);
        return ResponseEntity.ok("Sponsor with ID " + sponsorIdx + " has been successfully deleted.");
    }

    // 선택된 스폰서 삭제
    @DeleteMapping("/delete-multiple")
    public ResponseEntity<String> deleteSponsors(@RequestBody List<Integer> sponsorIds) {
        sponsorService.deleteSponsors(sponsorIds);
        return ResponseEntity.ok("Sponsors with IDs " + sponsorIds + " have been successfully deleted.");
    }
}
